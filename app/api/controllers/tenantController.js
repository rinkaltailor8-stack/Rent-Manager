const Tenant = require('../../models/Tenant');
const RentEntry = require('../../models/RentEntry');
const Property = require('../../models/Property');

// Get all tenants for the logged-in user with rent statistics
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ owner: req.userId }).sort({ createdAt: -1 });
    
    // Calculate rent statistics for each tenant
    const tenantsWithStats = await Promise.all(tenants.map(async (tenant) => {
      const rentEntries = await RentEntry.find({ tenant: tenant._id });
      
      // Calculate total amount that should be paid (all rent entries)
      const totalAmount = rentEntries.reduce((sum, entry) => sum + entry.rentAmount, 0);
      
      // Calculate total paid (including partial payments)
      const totalPaid = rentEntries.reduce((sum, entry) => sum + (entry.paidAmount || 0), 0);
      
      // Remaining = Total Amount - Total Paid
      const remaining = totalAmount - totalPaid;
      
      // Count pending and overdue separately
      const pendingEntries = rentEntries.filter(entry => entry.status === 'pending');
      const overdueEntries = rentEntries.filter(entry => entry.status === 'overdue');
      const partialEntries = rentEntries.filter(entry => entry.status === 'partial');
      
      const pendingAmount = pendingEntries.reduce((sum, entry) => sum + (entry.rentAmount - (entry.paidAmount || 0)), 0);
      const overdueAmount = overdueEntries.reduce((sum, entry) => sum + (entry.rentAmount - (entry.paidAmount || 0)), 0);
      
      // Get current property assignment
      const property = await Property.findOne({ currentTenant: tenant._id });
      
      return {
        ...tenant.toObject(),
        rentStats: {
          totalAmount,
          totalPaid,
          remaining,
          pendingAmount,
          overdueAmount,
          overdueCount: overdueEntries.length,
          pendingCount: pendingEntries.length,
          partialCount: partialEntries.length,
          totalEntries: rentEntries.length
        },
        currentProperty: property ? {
          _id: property._id,
          address: property.address,
          city: property.city,
          monthlyRent: property.monthlyRent
        } : null
      };
    }));
    
    res.json(tenantsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single tenant
exports.getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.userId });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Get rent statistics
    const rentEntries = await RentEntry.find({ tenant: tenant._id });
    const property = await Property.findOne({ currentTenant: tenant._id });
    
    const totalAmount = rentEntries.reduce((sum, entry) => sum + entry.rentAmount, 0);
    const totalPaid = rentEntries.reduce((sum, entry) => sum + (entry.paidAmount || 0), 0);
    const remaining = totalAmount - totalPaid;
    
    const overdueEntries = rentEntries.filter(e => e.status === 'overdue');
    const overdueAmount = overdueEntries.reduce((sum, entry) => sum + (entry.rentAmount - (entry.paidAmount || 0)), 0);
    
    res.json({
      ...tenant.toObject(),
      rentStats: {
        totalAmount,
        totalPaid,
        remaining,
        overdueAmount,
        overdueCount: overdueEntries.length
      },
      currentProperty: property
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 

// Create new tenant
exports.createTenant = async (req, res) => {
  try {
    const tenant = new Tenant({
      ...req.body,
      owner: req.userId
    });
    await tenant.save();
    res.status(201).json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update tenant
exports.updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign property to tenant and generate rent entries
exports.assignProperty = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const tenantId = req.params.id;

    // Validate tenant ownership
    const tenant = await Tenant.findOne({ _id: tenantId, owner: req.userId });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Validate property ownership
    const Property = require('../../models/Property');
    const property = await Property.findOne({ _id: propertyId, owner: req.userId });
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!tenant.moveInDate) {
      return res.status(400).json({ message: 'Tenant must have a move-in date before assigning to a property' });
    }

    // Update property with tenant
    property.currentTenant = tenantId;
    property.status = 'occupied';
    await property.save();

    // Generate rent entries from move-in date
    const moveInDate = new Date(tenant.moveInDate);
    const currentDate = new Date();
    const entries = [];

    let year = moveInDate.getFullYear();
    let month = moveInDate.getMonth() + 1;

    while (year < currentDate.getFullYear() || 
           (year === currentDate.getFullYear() && month <= currentDate.getMonth() + 1)) {
      
      const existing = await RentEntry.findOne({
        tenant: tenantId,
        property: propertyId,
        month,
        year
      });

      if (!existing) {
        const dueDate = new Date(year, month - 1, 5);
        const now = new Date();
        
        const entry = new RentEntry({
          owner: req.userId,
          property: propertyId,
          tenant: tenantId,
          month,
          year,
          rentAmount: property.monthlyRent,
          dueDate,
          status: dueDate < now ? 'overdue' : 'pending'
        });
        
        entries.push(entry);
      }

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    if (entries.length > 0) {
      await RentEntry.insertMany(entries);
    }

    res.json({
      message: 'Property assigned successfully',
      property,
      entriesGenerated: entries.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete tenant
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.userId });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check for unpaid rent entries
    const unpaidEntries = await RentEntry.find({
      tenant: req.params.id,
      status: { $in: ['pending', 'overdue', 'partial'] }
    });

    if (unpaidEntries.length > 0) {
      const totalUnpaid = unpaidEntries.reduce((sum, entry) => 
        sum + (entry.rentAmount - (entry.paidAmount || 0)), 0
      );
      return res.status(400).json({ 
        message: `Cannot delete tenant with unpaid rent. ${unpaidEntries.length} unpaid entries totaling $${totalUnpaid.toFixed(2)}`,
        unpaidCount: unpaidEntries.length,
        unpaidAmount: totalUnpaid
      });
    }

    await Tenant.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
