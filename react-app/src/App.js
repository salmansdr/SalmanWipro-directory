

import React, { useState } from 'react';
//import Hero from './Hero';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Reports from './Reports';
import ProjectManagement from './ProjectManagement';
import Login from './Login';

import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './Styles/App.css';



// ...existing code...






function App() {
  const [menuOpen, setMenuOpen] = useState(false);
 
  return (
    <Router>
      <div className="construction-app">
        <header className="construction-header">
          <div>
            <div className="header-title">🏗️ BuildPro Construction</div>
            <div className="powered-signature">Powered by Salman and Reza Kawsar</div>
          </div>
          <button
            className={`hamburger-btn${menuOpen ? ' open' : ''}`}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
             <span className="bar" style={{ background: '#1976d2' }}></span>
                <span className="bar" style={{ background: 'rgba(40, 198, 45, 1)' }}></span>
                <span className="bar" style={{ background: '#ffb300' }}></span>
          </button>
          <nav className="construction-nav">
            <ul className="desktop-menu">
              <li><NavLink to="/" end>Home</NavLink></li>
              <li><NavLink to="/project-management">Project Management</NavLink></li>
              <li><NavLink to="/reports">Reports</NavLink></li>
              <li><NavLink to="/about">About</NavLink></li>
              <li><NavLink to="/contact">Contact</NavLink></li>
              <li><NavLink to="/login">Login</NavLink></li>
            </ul>
          </nav>
          {menuOpen && (
            <div className="menu-popup" onClick={() => setMenuOpen(false)}>
              <div className="menu-popup-content" onClick={e => e.stopPropagation()}>
                <button className="close-popup-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>&#10005;</button>
                <ul>
                  <li><NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink></li>
                  <li><NavLink to="/project-management" onClick={() => setMenuOpen(false)}>Project Management</NavLink></li>
                  <li><NavLink to="/reports" onClick={() => setMenuOpen(false)}>Reports</NavLink></li>
                  <li><NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink></li>
                  <li><NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink></li>
                  <li><NavLink to="/login" onClick={() => setMenuOpen(false)}>Login</NavLink></li>
                </ul>
              </div>
            </div>
          )}
        </header>
        <main className="construction-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project-management" element={<ProjectManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Home />} />
          </Routes>

 <a
        href="https://wa.me/9874592300"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="WhatsApp"
      >
        <img src={process.env.PUBLIC_URL + '/social/whatsapp.png'} alt="WhatsApp" className="whatsapp-img" />
      </a>
        </main>

     
      
      <footer className="construction-footer">
        <div className="footer-social-section">
          <div className="footer-heading">Follow us on</div>
          <a href="https://facebook.com/salmansdr" target="_blank" rel="noopener noreferrer" className="footer-icon facebook" aria-label="Facebook">
            <img src={process.env.PUBLIC_URL + '/social/Facebook.PNG'} alt="Facebook" className="social-img" />
          </a>
          <a href="https://instagram.com/syedsalman1206" target="_blank" rel="noopener noreferrer" className="footer-icon instagram" aria-label="Instagram">
            <img src={process.env.PUBLIC_URL + '/social/instagram.PNG'} alt="Instagram" className="social-img" />
          </a>
          <a href="https://x.com/@salman13965660" target="_blank" rel="noopener noreferrer" className="footer-icon x" aria-label="X">
            <img src={process.env.PUBLIC_URL + '/social/x.PNG'} alt="X" className="social-img" />
          </a>
          <a href="https://linkedin.com/syed-salman-155239219" target="_blank" rel="noopener noreferrer" className="footer-icon linkedin" aria-label="LinkedIn">
            <img src={process.env.PUBLIC_URL + '/social/linkedin.PNG'} alt="LinkedIn" className="social-img" />
          </a>
          <a href="https://youtube.com/sample" target="_blank" rel="noopener noreferrer" className="footer-icon youtube" aria-label="YouTube">
            <img src={process.env.PUBLIC_URL + '/social/youtube.PNG'} alt="YouTube" className="social-img" />
          </a>
        </div>
      </footer>
    </div>
  </Router>
  );
}







  export default App;
