const Property = require('../../models/Property');
const Tenant = require('../../models/Tenant');
const RentEntry = require('../../models/RentEntry');

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
         (year === currentDate.getFullYear() && month <= currentDate.getMonth() + 1)) {
    
    // Check if entry already exists for this month/year
    const existing = await RentEntry.findOne({
      tenant: tenantId,
      property: propertyId,
      month,
      year
    });

    if (!existing) {
      const dueDate = new Date(year, month, 5); // Due on 5th of each month
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

// Get all properties for the logged-in user
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.userId })
      .populate('currentTenant', 'name phone')
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single property
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, owner: req.userId })
      .populate('currentTenant', 'name phone');
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new property
exports.createProperty = async (req, res) => {
  try {
    const property = new Property({
      ...req.body,
      owner: req.userId
    });
    await property.save();
    await property.populate('currentTenant', 'name phone');
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update property
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('currentTenant', 'name phone');
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign tenant to property and generate rent entries
exports.assignTenant = async (req, res) => {
  try {
    const { tenantId } = req.body;
    const propertyId = req.params.id;

    // Validate property ownership
    const property = await Property.findOne({ _id: propertyId, owner: req.userId });
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Validate tenant ownership
    const tenant = await Tenant.findOne({ _id: tenantId, owner: req.userId });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (!tenant.moveInDate) {
      return res.status(400).json({ message: 'Tenant must have a move-in date' });
    }

    // Update property with tenant
    property.currentTenant = tenantId;
    property.status = 'occupied';
    await property.save();

    // Populate tenant details
    await property.populate('currentTenant', 'name phone');

    // Generate rent entries from move-in date
    const entries = await generateRentEntriesForTenant(tenantId, propertyId, req.userId);

    res.json({
      message: 'Tenant assigned successfully',
      property,
      entriesGenerated: entries.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete property
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
