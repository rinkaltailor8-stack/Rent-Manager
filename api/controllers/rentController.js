const RentEntry = require('../models/RentEntry');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');

// Helper function to generate rent entries for a tenant from move-in date
const generateRentEntriesForTenant = async (tenantId, propertyId, ownerId) => {
  const tenant = await Tenant.findById(tenantId);
  const property = await Property.findById(propertyId);
  
  if (!tenant || !property || !tenant.moveInDate) {
    throw new Error('Tenant move-in date or property not found');
  }

  const moveInDate = new Date(tenant.moveInDate);
  const currentDate = new Date();
  const entries = [];

  // Generate entries from move-in date to current month
  let year = moveInDate.getFullYear();
  let month = moveInDate.getMonth() + 1; // 1-12

  while (year < currentDate.getFullYear() || 
         (year === currentDate.getFullYear() && month <= currentDate.getMonth())) {
    
    // Check if entry already exists for this month/year
    const existing = await RentEntry.findOne({
      tenant: tenantId,
      property: propertyId,
      month,
      year
    });

    if (!existing) {
      const dueDate = new Date(year, month - 1, 5); // Due on 5th of each month
      const now = new Date();
      
      const entry = new RentEntry({
        owner: ownerId,
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

    // Move to next month
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  // Save all new entries
  if (entries.length > 0) {
    await RentEntry.insertMany(entries);
  }

  return entries;
};

// Get all rent entries for the logged-in user
exports.getRentEntries = async (req, res) => {
  try {
    const rentEntries = await RentEntry.find({ owner: req.userId })
      .populate('property', 'address city state monthlyRent')
      .populate('tenant', 'name phone')
      .sort({ year: -1, month: -1 });
    res.json(rentEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single rent entry
exports.getRentEntry = async (req, res) => {
  try {
    const rentEntry = await RentEntry.findOne({ _id: req.params.id, owner: req.userId })
      .populate('property')
      .populate('tenant');
    if (!rentEntry) {
      return res.status(404).json({ message: 'Rent entry not found' });
    }
    res.json(rentEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create/Assign tenant to property and generate rent entries
exports.createRentEntry = async (req, res) => {
  try {
    const { propertyId, tenantId } = req.body;
    
    if (propertyId && tenantId) {
      // Assigning tenant to property - generate all rent entries
      await Property.findByIdAndUpdate(propertyId, { 
        currentTenant: tenantId,
        status: 'occupied'
      });

      // Generate all rent entries from move-in date
      await generateRentEntriesForTenant(tenantId, propertyId, req.userId);
      
      const entries = await RentEntry.find({ 
        property: propertyId, 
        tenant: tenantId 
      }).populate('property tenant');
      
      return res.status(201).json(entries);
    } else {
      // Manual rent entry creation
      const rentEntry = new RentEntry({
        ...req.body,
        owner: req.userId
      });
      await rentEntry.save();
      await rentEntry.populate('property tenant');
      return res.status(201).json(rentEntry);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Regenerate rent entries (useful when updating tenant move-in date)
exports.regenerateRentEntries = async (req, res) => {
  try {
    const { propertyId, tenantId } = req.body;
    await generateRentEntriesForTenant(tenantId, propertyId, req.userId);
    
    const entries = await RentEntry.find({ 
      property: propertyId, 
      tenant: tenantId 
    }).populate('property tenant');
    
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update rent entry
exports.updateRentEntry = async (req, res) => {
  try {
    const rentEntry = await RentEntry.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('property tenant');
    if (!rentEntry) {
      return res.status(404).json({ message: 'Rent entry not found' });
    }
    res.json(rentEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark rent as paid
exports.markAsPaid = async (req, res) => {
  try {
    const { paidAmount, paymentMethod, paidDate } = req.body;
    const rentEntry = await RentEntry.findOne({ _id: req.params.id, owner: req.userId });
    
    if (!rentEntry) {
      return res.status(404).json({ message: 'Rent entry not found' });
    }

    const amountToPay = paidAmount || rentEntry.rentAmount;
    
    rentEntry.paidAmount = amountToPay;
    rentEntry.paidDate = paidDate ? new Date(paidDate) : new Date();
    rentEntry.paymentMethod = paymentMethod || 'other';
    
    // Update status based on payment
    if (amountToPay >= rentEntry.rentAmount) {
      rentEntry.status = 'paid';
    } else if (amountToPay > 0) {
      rentEntry.status = 'partial';
    }
    
    await rentEntry.save();
    await rentEntry.populate('property tenant');
    
    res.json(rentEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete rent entry
exports.deleteRentEntry = async (req, res) => {
  try {
    const rentEntry = await RentEntry.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!rentEntry) {
      return res.status(404).json({ message: 'Rent entry not found' });
    }
    res.json({ message: 'Rent entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const rentEntries = await RentEntry.find({ owner: req.userId });
    
    const totalDue = rentEntries
      .filter(entry => entry.status === 'pending' || entry.status === 'overdue' || entry.status === 'partial')
      .reduce((sum, entry) => sum + (entry.rentAmount - (entry.paidAmount || 0)), 0);
    
    const totalPaid = rentEntries
      .reduce((sum, entry) => sum + (entry.paidAmount || 0), 0);
    
    const totalAmount = rentEntries.reduce((sum, entry) => sum + entry.rentAmount, 0);
    
    const partialPaid = rentEntries
      .filter(entry => entry.status === 'partial')
      .reduce((sum, entry) => sum + (entry.paidAmount || 0), 0);
    
    const overdueCount = rentEntries.filter(entry => entry.status === 'overdue').length;
    const pendingCount = rentEntries.filter(entry => entry.status === 'pending').length;
    const partialCount = rentEntries.filter(entry => entry.status === 'partial').length;
    const paidCount = rentEntries.filter(entry => entry.status === 'paid').length;

    res.json({
      totalAmount,
      totalPaid,
      totalDue,
      partialPaid,
      overdueCount,
      pendingCount,
      partialCount,
      paidCount,
      totalEntries: rentEntries.length,
      collectionRate: totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
