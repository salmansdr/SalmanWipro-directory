

import React from 'react';
//import Hero from './Hero';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Reports from './Reports';
import CostReport from './CostReport';
import ProjectManagement from './ProjectManagement';
import ProjectManagementEntryForm from './ProjectManagementEntryForm';
import PricingCalculator from './PricingCalculator';
import Login from './Login';

import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Styles/App.css';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';



// ...existing code...






function App() {
  const [expanded, setExpanded] = React.useState(false);
 
  return (
    <Router>
  <div className="bg-light min-vh-100" style={{ padding: 0 }}>
       
          <Navbar expand="lg" className="shadow-sm" style={{width: '100%', backgroundColor: '#003366', margin: 0}} expanded={expanded} onToggle={setExpanded}>
            <Container fluid style={{width: '100%'}}>
              <Navbar.Brand as={NavLink} to="/" className="d-flex flex-column align-items-start" onClick={() => setExpanded(false)}>
                <div className="d-flex align-items-center">
                  <span style={{ fontSize: '1.7rem', marginRight: '0.7rem', color: 'white' }}>🏗️</span>
                  <span style={{ color: 'white' }}>BuildPro</span>
                </div>
                <small className="fw-light mt-1" style={{ color: 'white', fontSize: '0.75rem' }}>Powered by Salman & Kawsar</small>
              </Navbar.Brand>

              <Navbar.Toggle aria-controls="mainNavbar" className="navbar-toggler-icon-white" />
              <Navbar.Collapse id="mainNavbar">
                <Nav className="ms-auto mb-2 mb-lg-0">
                  <Nav.Link as={NavLink} to="/" end onClick={() => setExpanded(false)} style={{ color: 'white' }}>Home</Nav.Link>
                  <NavDropdown title={<span style={{ color: 'white' }}>Project Management</span>} id="project-management-nav-dropdown" menuVariant="light" className="dropdown-white-caret">
                    <NavDropdown.Item as={NavLink} to="/project-management" onClick={() => setExpanded(false)}>Project Management</NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} to="/pricing-calculator" onClick={() => setExpanded(false)}>Pricing Calculator</NavDropdown.Item>
                  </NavDropdown>
                  <NavDropdown title={<span style={{ color: 'white' }}>Reports</span>} id="reports-nav-dropdown" menuVariant="light" className="dropdown-white-caret">
                    
                    <NavDropdown.Item as={NavLink} to="/reports" onClick={() => setExpanded(false)}>Cost Report</NavDropdown.Item>
                  </NavDropdown>
                  <Nav.Link as={NavLink} to="/about" onClick={() => setExpanded(false)} style={{ color: 'white' }}>About</Nav.Link>
                  <Nav.Link as={NavLink} to="/contact" onClick={() => setExpanded(false)} style={{ color: 'white' }}>Contact</Nav.Link>
                  <Nav.Link as={NavLink} to="/login" onClick={() => setExpanded(false)} style={{ color: 'white' }}>Login</Nav.Link>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
       
  <main className="container py-4 px-3">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project-management" element={<ProjectManagement />} />
            <Route path="/ProjectManagementEntryForm" element={<ProjectManagementEntryForm />} />
            <Route path="/pricing-calculator" element={<PricingCalculator />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/cost-report" element={<CostReport />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Home />} />
          </Routes>

 <a
        href="https://wa.me/9874592300"
        target="_blank"
        rel="noopener noreferrer"
        className="position-fixed bottom-0 end-0 m-4 rounded-circle shadow"
        style={{ zIndex: 999 }}
        aria-label="WhatsApp"
      >
        <img src={process.env.PUBLIC_URL + '/social/whatsapp.png'} alt="WhatsApp" className="img-fluid rounded-circle" style={{ width: '48px', height: '48px' }} />
      </a>
        </main>

     
      
      <footer className="bg-light pt-3 pb-2 shadow-sm">
        <div className="container">
          <div className="row align-items-center justify-content-center">
            <div className="col-12 col-md-10 d-flex align-items-center justify-content-end">
              <span className="fw-bold text-secondary me-2">Follow us on</span>
              <nav className="d-flex flex-row gap-2">
                <a href="https://facebook.com/salmansdr" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-0 m-0">
                  <img src={process.env.PUBLIC_URL + '/social/Facebook.PNG'} alt="Facebook" className="img-fluid rounded me-1" style={{ width: '32px', height: '32px' }} />
                </a>
                <a href="https://instagram.com/syedsalman1206" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-0 m-0">
                  <img src={process.env.PUBLIC_URL + '/social/instagram.PNG'} alt="Instagram" className="img-fluid rounded me-1" style={{ width: '32px', height: '32px' }} />
                </a>
                <a href="https://x.com/@salman13965660" target="_blank" rel="noopener noreferrer" aria-label="X" className="p-0 m-0">
                  <img src={process.env.PUBLIC_URL + '/social/x.PNG'} alt="X" className="img-fluid rounded me-1" style={{ width: '32px', height: '32px' }} />
                </a>
                <a href="https://linkedin.com/syed-salman-155239219" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-0 m-0">
                  <img src={process.env.PUBLIC_URL + '/social/linkedin.PNG'} alt="LinkedIn" className="img-fluid rounded me-1" style={{ width: '32px', height: '32px' }} />
                </a>
                <a href="https://youtube.com/sample" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-0 m-0">
                  <img src={process.env.PUBLIC_URL + '/social/youtube.PNG'} alt="YouTube" className="img-fluid rounded me-1" style={{ width: '32px', height: '32px' }} />
                </a>
              </nav>
            </div>
          </div>
        </div>
      </footer>

  </div>
  </Router>
  );
}







  export default App;
