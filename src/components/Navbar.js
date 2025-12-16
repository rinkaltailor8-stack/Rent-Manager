import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <span>💰</span> Rent Manager
        </Link>
        
        <ul className="navbar-menu">
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/properties">Properties</Link>
          </li>
          <li>
            <Link to="/tenants">Tenants</Link>
          </li>
          <li>
            <Link to="/rent-entries">Rent Entries</Link>
          </li>
        </ul>

        <div className="navbar-user">
          <span className="user-name">👤 {user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
