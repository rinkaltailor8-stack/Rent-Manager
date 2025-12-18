import React, { useState, useEffect, useMemo } from 'react';
import { rentAPI, propertyAPI, tenantAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './CRUDPages.css';
import './TableView.css';

const RentEntries = () => {
  const [rentEntries, setRentEntries] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    property: '',
    tenant: '',
    rentAmount: '',
    dueDate: '',
    status: 'pending',
    paymentMethod: 'other',
    lateFee: 0,
    notes: ''
  });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paidAmount: '',
    paymentMethod: 'cash',
    paidDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rentRes, propRes, tenantRes] = await Promise.all([
        rentAPI.getAll(),
        propertyAPI.getAll(),
        tenantAPI.getAll()
      ]);
      setRentEntries(rentRes.data);
      setProperties(propRes.data);
      setTenants(tenantRes.data);
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
        await rentAPI.update(editingId, formData);
      } else {
        await rentAPI.create(formData);
      }
      resetForm();
      fetchData();
    } catch (error) {
      alert('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const openPaymentDialog = (entry) => {
    setSelectedEntry(entry);
    setPaymentData({
      paidAmount: entry.rentAmount - (entry.paidAmount || 0),
      paymentMethod: 'cash',
      paidDate: new Date().toISOString().split('T')[0]
    });
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentData.paidAmount || paymentData.paidAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    try {
      await rentAPI.markAsPaid(
        selectedEntry._id, 
        parseFloat(paymentData.paidAmount),
        paymentData.paymentMethod,
        paymentData.paidDate
      );
      setShowPaymentDialog(false);
      setSelectedEntry(null);
      fetchData();
    } catch (error) {
      alert('Failed to record payment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (entry) => {
    setFormData({
      property: entry.property._id || entry.property,
      tenant: entry.tenant._id || entry.tenant,
      rentAmount: entry.rentAmount,
      dueDate: entry.dueDate.split('T')[0],
      status: entry.status,
      paymentMethod: entry.paymentMethod,
      lateFee: entry.lateFee,
      notes: entry.notes
    });
    setEditingId(entry._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rent entry?')) {
      try {
        await rentAPI.delete(id);
        fetchData();
      } catch (error) {
        alert('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      property: '',
      tenant: '',
      rentAmount: '',
      dueDate: '',
      status: 'pending',
      paymentMethod: 'other',
      lateFee: 0,
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const paymentStats = useMemo(() => {
    const totalDue = rentEntries
      .filter(entry => entry.status === 'pending' || entry.status === 'overdue' || entry.status === 'partial')
      .reduce((sum, entry) => sum + (entry.rentAmount - (entry.paidAmount || 0)), 0);
    
    const totalPaid = rentEntries
      .reduce((sum, entry) => sum + (entry.paidAmount || 0), 0);
    
    const totalAmount = rentEntries.reduce((sum, entry) => sum + entry.rentAmount, 0);
    
    return { totalDue, totalPaid, totalAmount };
  }, [rentEntries]);

  // Calculate payment totals per tenant
  const tenantPaymentStats = useMemo(() => {
    const stats = {};
    rentEntries.forEach(entry => {
      const tenantId = entry.tenant?._id;
      if (tenantId) {
        if (!stats[tenantId]) {
          stats[tenantId] = {
            totalAmount: 0,
            totalPaid: 0,
            remaining: 0
          };
        }
        stats[tenantId].totalAmount += entry.rentAmount;
        stats[tenantId].totalPaid += (entry.paidAmount || 0);
        stats[tenantId].remaining = stats[tenantId].totalAmount - stats[tenantId].totalPaid;
      }
    });
    return stats;
  }, [rentEntries]);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Rent Entries</h1>
            <div className="header-stats">
              <span className="stat-item">Total: ${paymentStats.totalAmount.toFixed(2)}</span>
              <span className="stat-item paid">Paid: ${paymentStats.totalPaid.toFixed(2)}</span>
              <span className="stat-item due">Due: ${paymentStats.totalDue.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="add-btn">
            {showForm ? 'Cancel' : '+ Add Rent Entry'}
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h2>{editingId ? 'Edit Rent Entry' : 'Add New Rent Entry'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Property *</label>
                  <select
                    name="property"
                    value={formData.property}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop._id} value={prop._id}>
                        {prop.address}, {prop.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tenant *</label>
                  <select
                    name="tenant"
                    value={formData.tenant}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Tenant</option>
                    {tenants.map(tenant => (
                      <option key={tenant._id} value={tenant._id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount ($) *</label>
                  <input
                    type="number"
                    name="rentAmount"
                    value={formData.rentAmount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Late Fee ($)</label>
                  <input
                    type="number"
                    name="lateFee"
                    value={formData.lateFee}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
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
                {editingId ? 'Update Entry' : 'Add Entry'}
              </button>
            </form>
          </div>
        )}

        <div className="table-container">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading rent entries...</p>
            </div>
          ) : rentEntries.length === 0 ? (
            <p className="no-items">No rent entries found. Add your first entry above.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Property</th>
                  <th>Tenant</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rentEntries.map((entry) => {
                  const paidAmount = entry.paidAmount || 0;
                  const remaining = entry.rentAmount - paidAmount;
                  
                  return (
                    <tr key={entry._id} className={`row-${entry.status}`}>
                      <td>
                        {entry.month && entry.year ? 
                          new Date(entry.year, entry.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })
                          : '-'
                        }
                      </td>
                      <td>{entry.property?.address || 'N/A'}</td>
                      <td>{entry.tenant?.name || 'N/A'}</td>
                      <td className="amount">${entry.rentAmount.toFixed(2)}</td>
                      <td className="amount paid">${paidAmount.toFixed(2)}</td>
                      <td className="amount remaining">${remaining.toFixed(2)}</td>
                      <td>{new Date(entry.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${entry.status}`}>{entry.status}</span>
                      </td>
                      <td className="actions">
                        {(entry.status === 'pending' || entry.status === 'overdue' || entry.status === 'partial') && (
                          <button onClick={() => openPaymentDialog(entry)} className="btn-pay" title="Record Payment">
                            💵 Pay
                          </button>
                        )}
                        <button onClick={() => handleEdit(entry)} className="btn-edit" title="Edit">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(entry._id)} className="btn-delete" title="Delete">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && rentEntries.length > 0 && Object.keys(tenantPaymentStats).length > 0 && (
          <div className="tenant-payment-summary">
            <h3>💰 Payment Summary by Tenant</h3>
            <div className="summary-cards">
              {Object.entries(tenantPaymentStats).map(([tenantId, stats]) => {
                const tenant = rentEntries.find(e => e.tenant?._id === tenantId)?.tenant;
                if (!tenant) return null;
                return (
                  <div key={tenantId} className="tenant-summary-card">
                    <div className="summary-header">
                      <h4>{tenant.name}</h4>
                      <span className="entry-count">{rentEntries.filter(e => e.tenant?._id === tenantId).length} entries</span>
                    </div>
                    <div className="summary-stats">
                      <div className="stat-item">
                        <span className="label">Total Amount:</span>
                        <span className="value total">${stats.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Paid:</span>
                        <span className="value paid">${stats.totalPaid.toFixed(2)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Remaining:</span>
                        <span className="value remaining">${stats.remaining.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="progress-wrapper">
                      <div className="progress-bar-small">
                        <div 
                          className="progress-fill-small" 
                          style={{ width: `${(stats.totalPaid / stats.totalAmount * 100).toFixed(1)}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{(stats.totalPaid / stats.totalAmount * 100).toFixed(1)}% paid</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showPaymentDialog && selectedEntry && (
          <div className="modal-overlay" onClick={() => setShowPaymentDialog(false)}>
            <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
              <h2>💰 Record Payment</h2>
              <div className="payment-info">
                <p><strong>Tenant:</strong> {selectedEntry.tenant?.name}</p>
                <p><strong>Property:</strong> {selectedEntry.property?.address}</p>
                <p><strong>Period:</strong> {selectedEntry.month && selectedEntry.year ? 
                  new Date(selectedEntry.year, selectedEntry.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
                  : 'N/A'
                }</p>
                <p><strong>Total Amount:</strong> ${selectedEntry.rentAmount.toFixed(2)}</p>
                <p><strong>Already Paid:</strong> ${(selectedEntry.paidAmount || 0).toFixed(2)}</p>
                <p className="remaining-highlight"><strong>Remaining:</strong> ${(selectedEntry.rentAmount - (selectedEntry.paidAmount || 0)).toFixed(2)}</p>
              </div>
              
              <div className="form-group">
                <label>Payment Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedEntry.rentAmount - (selectedEntry.paidAmount || 0)}
                  value={paymentData.paidAmount}
                  onChange={(e) => setPaymentData({...paymentData, paidAmount: e.target.value})}
                  placeholder="Enter amount"
                />
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Payment Date *</label>
                <input
                  type="date"
                  value={paymentData.paidDate}
                  onChange={(e) => setPaymentData({...paymentData, paidDate: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="modal-actions">
                <button onClick={handlePaymentSubmit} className="submit-btn">Record Payment</button>
                <button onClick={() => setShowPaymentDialog(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RentEntries;
