import React, { useState, useEffect } from 'react';
import { propertyAPI, tenantAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './CRUDPages.css';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: '',
    monthlyRent: '',
    description: '',
    status: 'available'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const [propResponse, tenantResponse] = await Promise.all([
        propertyAPI.getAll(),
        tenantAPI.getAll()
      ]);<br/>     
      setProperties(propResponse.data);
      setTenants(tenantResponse.data.filter(t => t.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await propertyAPI.update(editingId, formData);
      } else {
        await propertyAPI.create(formData);
      }
      resetForm();
      fetchProperties();
    } catch (error) {
      alert('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAssignTenant = async () => {
    if (!selectedTenant) {
      alert('Please select a tenant');
      return;
    }
    try {
      await propertyAPI.assignTenant(selectedProperty._id, selectedTenant);
      alert('Tenant assigned successfully! Rent entries have been generated.');
      setShowAssignModal(false);
      setSelectedProperty(null);
      setSelectedTenant('');
      fetchProperties();
    } catch (error) {
      alert('Failed to assign tenant: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (property) => {
    setFormData(property);
    setEditingId(property._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyAPI.delete(id);
        fetchProperties();
      } catch (error) {
        alert('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      address: '',
      city: '',
      state: '',
      zipCode: '',
      propertyType: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: '',
      monthlyRent: '',
      description: '',
      status: 'available'
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>Properties</h1>
          <button onClick={() => setShowForm(!showForm)} className="add-btn">
            {showForm ? 'Cancel' : '+ Add Property'}
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h2>{editingId ? 'Edit Property' : 'Add New Property'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Zip Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Property Type</label>
                  <select name="propertyType" value={formData.propertyType} onChange={handleChange}>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Rent</label>
                  <input
                    type="number"
                    name="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <button type="submit" className="submit-btn">
                {editingId ? 'Update Property' : 'Add Property'}
              </button>
            </form>
          </div>
        )}

        <div className="items-grid">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <p className="no-items">No properties found. Add your first property above.</p>
          ) : (
            properties.map((property) => (
              <div key={property._id} className="item-card">
                <div className="item-header">
                  <h3>{property.address}</h3>
                  <span className={`badge ${property.status}`}>{property.status}</span>
                </div>
                <div className="item-body">
                  <p><strong>Location:</strong> {property.city}, {property.state} {property.zipCode}</p>
                  <p><strong>Type:</strong> {property.propertyType}</p>
                  <p><strong>Beds:</strong> {property.bedrooms} | <strong>Baths:</strong> {property.bathrooms}</p>
                  {property.squareFeet && <p><strong>Sq Ft:</strong> {property.squareFeet}</p>}
                  {property.monthlyRent && (
                    <p className="monthly-rent"><strong>Monthly Rent:</strong> <span className="rent-amount">${(property.monthlyRent || 0).toFixed(2)}</span></p>
                  )}
                  {property.currentTenant && typeof property.currentTenant === 'object' && property.currentTenant.name ? (
                    <div className="tenant-info">
                      <p><strong>Current Tenant:</strong> {property.currentTenant.name}</p>
                      <p><strong>Phone:</strong> {property.currentTenant.phone}</p>
                    </div>
                  ) : property.currentTenant ? (
                    <p className="no-tenant-info"><strong>Tenant:</strong> Assigned (ID: {property.currentTenant})</p>
                  ) : null}
                  {property.description && <p className="description">{property.description}</p>}
                </div>
                <div className="item-actions">
                  {property.status === 'available' && (
                    <button 
                      onClick={() => {
                        setSelectedProperty(property);
                        setShowAssignModal(true);
                      }} 
                      className="assign-btn"
                    >
                      Assign Tenant
                    </button>
                  )}
                  <button onClick={() => handleEdit(property)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(property._id)} className="delete-btn">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {showAssignModal && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Assign Tenant to {selectedProperty?.address}</h2>
              <div className="form-group">
                <label>Select Tenant *</label>
                <select 
                  value={selectedTenant} 
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="modal-select"
                >
                  <option value="">Choose a tenant...</option>
                  {tenants.map(tenant => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.name} (Move-in: {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : 'Not set'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button onClick={handleAssignTenant} className="submit-btn">Assign & Generate Rent</button>
                <button onClick={() => setShowAssignModal(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Properties;
