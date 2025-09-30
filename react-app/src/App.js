

import React from 'react';
//import Hero from './Hero';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Reports from './Reports';
import CostReport from './CostReport';
import ProjectManagement from './ProjectManagement';
import PricingCalculator from './PricingCalculator';
import Login from './Login';

import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Styles/App.css';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Row, Col } from 'react-bootstrap';



// ...existing code...






function App() {
  //const [menuOpen, setMenuOpen] = useState(false);
 
  return (
    <Router>
  <Container fluid className="construction-app" style={{background: '#f8f8faff', minHeight: '100vh'}}>
       
          <Navbar bg="light" expand="lg" className="shadow-sm" style={{width: '100%'}}>
            <Container fluid style={{width: '100%'}}>
              <Navbar.Brand as={NavLink} to="/" className="d-flex flex-column align-items-start">
  <div className="d-flex align-items-center">
    <span style={{ fontSize: '1.7rem', marginRight: '0.7rem' }}>🏗️</span>
    <span>BuildPro Construction</span>
  </div>
  <span className="powered-signature" style={{ color: 'white', fontWeight: 600, fontSize: '1.05rem', marginTop: '2px' }}>
    Powered by Salman and Reza Kawsar
  </span>
</Navbar.Brand>

              <Navbar.Toggle aria-controls="mainNavbar" />
              <Navbar.Collapse id="mainNavbar">
                <Nav className="ms-auto mb-2 mb-lg-0">
                  <Nav.Link as={NavLink} to="/" end>Home</Nav.Link>
                  <NavDropdown title="Project Management" id="project-management-nav-dropdown" menuVariant="light" className="menu-dropdown">
                    <NavDropdown.Item as={NavLink} to="/project-management">Project Management</NavDropdown.Item>
                    <NavDropdown.Item as={NavLink} to="/pricing-calculator">Pricing Calculator</NavDropdown.Item>
                  </NavDropdown>
                  <NavDropdown title="Reports" id="reports-nav-dropdown" menuVariant="light" className="menu-dropdown">
                    <NavDropdown.Item as={NavLink} to="/reports">Reports</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={NavLink} to="/cost-report">Cost Report</NavDropdown.Item>
                  </NavDropdown>
                  <Nav.Link as={NavLink} to="/about">About</Nav.Link>
                  <Nav.Link as={NavLink} to="/contact">Contact</Nav.Link>
                  <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
       
        <main className="construction-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project-management" element={<ProjectManagement />} />
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
        className="whatsapp-float"
        aria-label="WhatsApp"
      >
        <img src={process.env.PUBLIC_URL + '/social/whatsapp.png'} alt="WhatsApp" className="whatsapp-img" />
      </a>
        </main>

     
      
      <footer className="construction-footer bg-light pt-3 pb-2 shadow-sm">
  <Container>
    <Row className="align-items-center justify-content-center">
      <Col xs={12} md={10} className="d-flex align-items-center justify-content-end">
        <span className="footer-heading fw-bold text-secondary me-2">Follow us on</span>
        <Nav className="flex-row" style={{ gap: '4px' }}>
          <Nav.Link href="https://facebook.com/salmansdr" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-0 m-0">
            <img src={process.env.PUBLIC_URL + '/social/Facebook.PNG'} alt="Facebook" className="social-img" />
          </Nav.Link>
          <Nav.Link href="https://instagram.com/syedsalman1206" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-0 m-0">
            <img src={process.env.PUBLIC_URL + '/social/instagram.PNG'} alt="Instagram" className="social-img" />
          </Nav.Link>
          <Nav.Link href="https://x.com/@salman13965660" target="_blank" rel="noopener noreferrer" aria-label="X" className="p-0 m-0">
            <img src={process.env.PUBLIC_URL + '/social/x.PNG'} alt="X" className="social-img" />
          </Nav.Link>
          <Nav.Link href="https://linkedin.com/syed-salman-155239219" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-0 m-0">
            <img src={process.env.PUBLIC_URL + '/social/linkedin.PNG'} alt="LinkedIn" className="social-img" />
          </Nav.Link>
          <Nav.Link href="https://youtube.com/sample" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-0 m-0">
            <img src={process.env.PUBLIC_URL + '/social/youtube.PNG'} alt="YouTube" className="social-img" />
          </Nav.Link>
        </Nav>
      </Col>
    </Row>
  </Container>
</footer>

  </Container>
  </Router>
  );
}







  export default App;
