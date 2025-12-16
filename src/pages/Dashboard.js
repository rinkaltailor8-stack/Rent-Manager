import React, { useState, useEffect } from 'react';
import { rentAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const [statistics, setStatistics] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalDue: 0,
    partialPaid: 0,
    overdueCount: 0,
    pendingCount: 0,
    partialCount: 0,
    paidCount: 0,
    totalEntries: 0,
    collectionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await rentAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome to your Rent Management System</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card total-amount">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <h3>Total Rent Amount</h3>
              <p className="stat-value">${(statistics.totalAmount || 0).toFixed(2)}</p>
              <p className="stat-detail">All rent entries</p>
            </div>
          </div>

          <div className="stat-card paid">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Total Paid</h3>
              <p className="stat-value">${(statistics.totalPaid || 0).toFixed(2)}</p>
              <p className="stat-detail">{statistics.paidCount || 0} paid · {statistics.partialCount || 0} partial (${(statistics.partialPaid || 0).toFixed(2)})</p>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Total Due</h3>
              <p className="stat-value">${(statistics.totalDue || 0).toFixed(2)}</p>
              <p className="stat-detail">{statistics.pendingCount || 0} pending · {statistics.overdueCount || 0} overdue</p>
            </div>
          </div>

          <div className="stat-card collection">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Collection Rate</h3>
              <p className="stat-value">{statistics.collectionRate || 0}%</p>
              <p className="stat-detail">Payment efficiency</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${statistics.collectionRate || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="payment-summary">
          <h2>Payment Summary</h2>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Overdue Payments:</span>
              <span className="summary-value overdue">{statistics.overdueCount || 0} entries</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Pending Payments:</span>
              <span className="summary-value pending">{statistics.pendingCount || 0} entries</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Partial Payments:</span>
              <span className="summary-value partial">{statistics.partialCount || 0} entries</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completed Payments:</span>
              <span className="summary-value paid">{statistics.paidCount || 0} entries</span>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <a href="/properties" className="action-btn">
              <span className="action-icon">🏠</span>
              <span>Manage Properties</span>
            </a>
            <a href="/tenants" className="action-btn">
              <span className="action-icon">👥</span>
              <span>Manage Tenants</span>
            </a>
            <a href="/rent-entries" className="action-btn">
              <span className="action-icon">📝</span>
              <span>Rent Entries</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
