import React, { useState, useEffect } from 'react';
import { tenantAPI, propertyAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './CRUDPages.css';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    moveInDate: '',
    status: 'active',
    notes: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const [tenantResponse, propertyResponse] = await Promise.all([
        tenantAPI.getAll(),
        propertyAPI.getAll()
      ]);
      setTenants(tenantResponse.data);
      // Only show properties that are available and don't have a tenant assigned
      setProperties(propertyResponse.data.filter(p => p.status === 'available' && !p.currentTenant));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        emergencyContact: { ...formData.emergencyContact, [field]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await tenantAPI.update(editingId, formData);
      } else {
        await tenantAPI.create(formData);
      }
      resetForm();
      fetchTenants();
    } catch (error) {
      alert('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAssignProperty = async () => {
    if (!selectedProperty) {
      alert('Please select a property');
      return;
    }
    if (!selectedTenant.moveInDate) {
      alert('Please set a move-in date for this tenant before assigning a property');
      return;
    }
    try {
      await tenantAPI.assignProperty(selectedTenant._id, selectedProperty);
      alert('Property assigned successfully! Rent entries have been generated.');
      setShowAssignModal(false);
      setSelectedTenant(null);
      setSelectedProperty('');
      fetchTenants();
    } catch (error) {
      alert('Failed to assign property: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (tenant) => {
    setFormData({
      ...tenant,
      emergencyContact: tenant.emergencyContact || { name: '', phone: '', relationship: '' }
    });
    setEditingId(tenant._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await tenantAPI.delete(id);
        fetchTenants();
      } catch (error) {
        alert('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      moveInDate: '',
      status: 'active',
      notes: '',
      emergencyContact: { name: '', phone: '', relationship: '' }
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>Tenants</h1>
          <button onClick={() => setShowForm(!showForm)} className="add-btn">
            {showForm ? 'Cancel' : '+ Add Tenant'}
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h2>{editingId ? 'Edit Tenant' : 'Add New Tenant'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Move-in Date</label>
                  <input
                    type="date"
                    name="moveInDate"
                    value={formData.moveInDate ? formData.moveInDate.split('T')[0] : ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

           

              <h3 style={{ marginTop: '20px', marginBottom: '15px', color: '#667eea' }}>Emergency Contact</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="emergency.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="emergency.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Relationship</label>
                  <input
                    type="text"
                    name="emergency.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <button type="submit" className="submit-btn">
                {editingId ? 'Update Tenant' : 'Add Tenant'}
              </button>
            </form>
          </div>
        )}

        <div className="items-grid">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading tenants...</p>
            </div>
          ) : tenants.length === 0 ? (
            <p className="no-items">No tenants found. Add your first tenant above.</p>
          ) : (
            tenants.map((tenant) => (
              <div key={tenant._id} className="item-card">
                <div className="item-header">
                  <h3>{tenant.name}</h3>
                  <span className={`badge ${tenant.status}`}>{tenant.status}</span>
                </div>
                <div className="item-body">
                  <p><strong>Phone:</strong> {tenant.phone}</p>
                  {tenant.moveInDate && (
                    <p><strong>Move-in:</strong> {new Date(tenant.moveInDate).toLocaleDateString()}</p>
                  )}
                  {tenant.currentProperty ? (
                    <p className="current-property">
                      <strong>Property:</strong> {tenant.currentProperty.address}, {tenant.currentProperty.city}
                      <span className="property-rent"> (${(tenant.currentProperty.monthlyRent || 0).toFixed(2)}/mo)</span>
                    </p>
                  ) : (
                    <p className="no-property"><strong>Property:</strong> <span className="not-assigned">Not assigned</span></p>
                  )}
                  {tenant.emergencyContact?.name && (
                    <p><strong>Emergency:</strong> {tenant.emergencyContact.name} ({tenant.emergencyContact.phone})</p>
                  )}
                  {tenant.notes && <p className="description">{tenant.notes}</p>}
                  
                  {tenant.rentStats && tenant.rentStats.totalEntries > 0 && (
                    <div className="rent-stats">
                      <h4>💰 Payment Status</h4>
                      <div className="stats-row">
                        <div className="stat-item">
                          <span className="stat-label">Total Amount:</span>
                          <span className="stat-amount total">${(tenant.rentStats.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Paid:</span>
                          <span className="stat-amount paid">${(tenant.rentStats.totalPaid || 0).toFixed(2)}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Remaining:</span>
                          <span className="stat-amount remaining">${(tenant.rentStats.remaining || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      {(tenant.rentStats.overdueCount || 0) > 0 && (
                        <p className="overdue-warning">⚠️ {tenant.rentStats.overdueCount} overdue · ${(tenant.rentStats.overdueAmount || 0).toFixed(2)}</p>
                      )}
                      <p className="entry-count">{tenant.rentStats.totalEntries} rent entries total</p>
                    </div>
                  )}
                </div>
                <div className="item-actions">
                  {!tenant.currentProperty && tenant.moveInDate && (
                    <button 
                      onClick={() => {
                        setSelectedTenant(tenant);
                        setShowAssignModal(true);
                      }} 
                      className="assign-btn"
                    >
                      Assign Property
                    </button>
                  )}
                  <button onClick={() => handleEdit(tenant)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(tenant._id)} className="delete-btn">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {showAssignModal && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Assign Property to {selectedTenant?.name}</h2>
              <p className="modal-info">
                Move-in Date: <strong>{selectedTenant?.moveInDate ? new Date(selectedTenant.moveInDate).toLocaleDateString() : 'Not set'}</strong>
              </p>
              <div className="form-group">
                <label>Select Property *</label>
                <select 
                  value={selectedProperty} 
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="modal-select"
                >
                  <option value="">Choose a property...</option>
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.address}, {property.city} - ${property.monthlyRent}/month
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button onClick={handleAssignProperty} className="submit-btn">Assign & Generate Rent</button>
                <button onClick={() => setShowAssignModal(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Tenants;
