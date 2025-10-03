import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <ul>
  <li><Link to="/">Home</Link></li>
  <li><Link to="/map">Map</Link></li>
  <li><Link to="/community">Community</Link></li>
  <li><Link to="/news">News</Link></li>
  <li><Link to="/dam-openings">Dam Openings</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
