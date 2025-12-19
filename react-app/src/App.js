import ProjectEstimation from './ProjectEstimation';
import TestApiPage from './TestApiPage';
import SupplierMaster from './SupplierMaster';
import LocationMaster from './LocationMaster';
import EnquiryDetails from './EnquiryDetails';
import PurchaseOrders from './PurchaseOrders';
import MaterialReceived from './MaterialReceived';
import StoreRequisition from './StoreRequisition';
import StockDetails from './StockDetails';

import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Styles/App.css';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
import CompanySetup from './CompanySetup';
import UserManagement from './UserManagement';
import UserProfile from './UserProfile';
import RoleManagement from './RoleManagement';
import ItemMaster from './ItemMaster';
import RccConfiguration from './RccConfiguration';
import BHKConfiguration from './BHKConfiguration';
import AreaCalculation from './AreaCalculation';
import AreaCalculationHandsontable from './AreaCalculationHandsontable';
import BOQEstimation from './BOQEstimation';

// Import menu security utilities
import { 
  getFilteredMenuItems, 
  authenticateUser, 
  setUserRole, 
  clearUserRole
} from './utils/menuSecurity';

// Google OAuth Client ID - Replace with your actual Client ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

// Global security feature toggle
const SECURITY_ENABLED = true; // Set to false to disable security

// Avatar dropdown with profile and logout
function AvatarMenu({ onLogout }) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    setShow(false);
    navigate('/user-profile');
  };

  return (
    <NavDropdown
      title={
        <span className="ms-3" title="Profile">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#eee" />
            <circle cx="16" cy="13" r="6" fill="#bbb" />
            <ellipse cx="16" cy="25" rx="8" ry="5" fill="#bbb" />
          </svg>
        </span>
      }
      id="avatar-menu"
      align="end"
      show={show}
      onToggle={setShow}
      menuVariant="light"
    >
      <NavDropdown.Item onClick={handleProfileClick}>
        <i className="fas fa-user-circle me-2"></i>User Profile
      </NavDropdown.Item>
      <NavDropdown.Divider />
      <NavDropdown.Item onClick={() => { setShow(false); onLogout(); }}>
        <i className="fas fa-sign-out-alt me-2"></i>Logout
      </NavDropdown.Item>
    </NavDropdown>
  );
}

// WhatsApp button component - only shows on home page
function WhatsAppButton() {
  const location = useLocation();
  
  // Only show on home page
  if (location.pathname !== '/') {
    return null;
  }
  
  return (
    <a
      href="https://wa.me/9874592300"
      target="_blank"
      rel="noopener noreferrer"
      className="position-fixed end-0 rounded-circle shadow"
      style={{ 
        zIndex: 999, 
        top: '50%', 
        transform: 'translateY(-50%)', 
        right: '20px' 
      }}
      aria-label="WhatsApp"
    >
      <img src={process.env.PUBLIC_URL + '/social/whatsapp.png'} alt="WhatsApp" className="img-fluid rounded-circle" style={{ width: '48px', height: '48px' }} />
    </a>
  );
}

function App() {
  const [expanded, setExpanded] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [themeColor, setThemeColor] = useState('#003366');
  const [fontColor, setFontColor] = useState('#ffffff');
  const AUTH_KEY = 'isAuthenticated';
  const AUTH_USER_KEY = 'authUser';
  const AUTH_TIME_KEY = 'authTime';
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Check authentication state on load
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (!SECURITY_ENABLED) return true;
    const auth = localStorage.getItem(AUTH_KEY) === 'true';
    const lastAuthTime = parseInt(localStorage.getItem(AUTH_TIME_KEY), 10);
    const now = Date.now();
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    
    
    // If not authenticated, or expired, force logout
    if (!auth) {
      // Clean up any stale data
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TIME_KEY);
      clearUserRole();
     
      return false;
    }
    if (!lastAuthTime || now - lastAuthTime > ONE_DAY_MS) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TIME_KEY);
      clearUserRole();
      
      return false;
    }
    if (!storedUser) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TIME_KEY);
      clearUserRole();
      
      return false;
    }
    
    return true;
  });

  // Get filtered menu items based on authentication and role
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // Load menu items on mount and when authentication changes
  React.useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setMenuLoading(true);
        const items = await getFilteredMenuItems(isAuthenticated);
        
        setMenuItems(items);
      } catch (error) {
        console.error('Error loading menu items:', error);
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };
    loadMenuItems();
  }, [isAuthenticated]);

  // Load company data from localStorage
  React.useEffect(() => {
    const loadCompanyData = () => {
      const name = localStorage.getItem('companyName') || 'BuildPro';
      const logo = localStorage.getItem('companyLogo') || '';
      const color = localStorage.getItem('companyThemeColor') || '#003366';
      const font = localStorage.getItem('companyFontColor') || '#ffffff';
      setCompanyName(name);
      setCompanyLogo(logo);
      setThemeColor(color);
      setFontColor(font);
      
    };
    loadCompanyData();

    // Listen for storage changes (when company is selected)
    window.addEventListener('storage', loadCompanyData);
    return () => window.removeEventListener('storage', loadCompanyData);
  }, [isAuthenticated]);

  // Handler for login success
  const handleLogin = async (username, password, userData) => {
    if (!SECURITY_ENABLED) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(AUTH_USER_KEY, username);
      localStorage.setItem(AUTH_TIME_KEY, Date.now().toString());
      setUserRole('admin'); // Default role when security is disabled
      return true;
    }
    
    // If userData is provided (from API login), use it
    if (userData) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(AUTH_USER_KEY, username);
      localStorage.setItem(AUTH_TIME_KEY, Date.now().toString());
      
      // Store user role and permissions from API response
      if (userData.roleName) {
        setUserRole(userData.roleName);
      }
      
      // Reload menu items with new permissions
      const items = await getFilteredMenuItems(true);
      setMenuItems(items);
      return true;
    }
    
    // Fallback to JSON config authentication (legacy)
    const user = await authenticateUser(username, password);
    if (user) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(AUTH_USER_KEY, username);
      localStorage.setItem(AUTH_TIME_KEY, Date.now().toString());
      setUserRole(user.role);
      const items = await getFilteredMenuItems(true);
      setMenuItems(items);
      return true;
    }
    
    setIsAuthenticated(false);
    localStorage.setItem(AUTH_KEY, 'false');
    return false;
  };

  // Handler for logout
  const handleLogout = async () => {
    if (!SECURITY_ENABLED) return;
    setIsAuthenticated(false);
    localStorage.setItem(AUTH_KEY, 'false');
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TIME_KEY);
    
    // Clear user data from localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPermissions');
    
    clearUserRole(); // Clear user role
    const items = await getFilteredMenuItems(false);
    setMenuItems(items); // Update menu items
  };

  // On mount, check if session expired
  React.useEffect(() => {
    if (!SECURITY_ENABLED) return;
    const auth = localStorage.getItem(AUTH_KEY) === 'true';
    const lastAuthTime = parseInt(localStorage.getItem(AUTH_TIME_KEY), 10);
    const now = Date.now();
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    if (!auth || !lastAuthTime || now - lastAuthTime > ONE_DAY_MS || !storedUser) {
      setIsAuthenticated(false);
      localStorage.setItem(AUTH_KEY, 'false');
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TIME_KEY);
      clearUserRole();
    }
  }, [ONE_DAY_MS]);

  // Render navigation link
  const renderNavLink = (item) => (
    <Nav.Link 
      key={item.id}
      as={NavLink} 
      to={item.path} 
      end={item.path === '/'} 
      onClick={() => setExpanded(false)} 
      style={{ color: fontColor }}
    >
      {item.icon && <span className="me-2">{item.icon}</span>}
      {item.label}
    </Nav.Link>
  );

  // Render navigation dropdown
  const renderNavDropdown = (item) => (
    <NavDropdown 
      key={item.id}
      title={<span style={{ color: fontColor }}>{item.icon && <span className="me-2">{item.icon}</span>}{item.label}</span>} 
      id={`${item.id}-nav-dropdown`} 
      menuVariant="light" 
      className="dropdown-white-caret"
    >
      {(item.filteredSubmenu || item.submenu || []).map(subItem => (
        <NavDropdown.Item 
          key={subItem.id}
          as={NavLink} 
          to={subItem.path} 
          onClick={() => setExpanded(false)}
        >
          {subItem.icon && <i className={`${subItem.icon} me-2`}></i>}
          {subItem.label}
        </NavDropdown.Item>
      ))}
    </NavDropdown>
  );

  // Use basename only in production (GitHub Pages), not in development
  const basename = process.env.NODE_ENV === 'production' ? '/SalmanWipro-directory' : '/';

  return (
    <Router basename={basename}>
      <div className="bg-light min-vh-100" style={{ padding: 0 }}>
        <Navbar expand="lg" className="shadow-sm" style={{width: '100%', backgroundColor: themeColor, margin: 0}} expanded={expanded} onToggle={setExpanded}>
          <Container fluid style={{width: '100%'}}>
            <Navbar.Brand as={NavLink} to="/" className="d-flex flex-column align-items-start" onClick={() => setExpanded(false)}>
              <div className="d-flex align-items-center">
                {companyLogo ? (
                  <img 
                    src={companyLogo} 
                    alt="Company Logo" 
                    style={{ height: '2.5rem', marginRight: '0.7rem', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: '1.7rem', marginRight: '0.7rem', color: fontColor }}>🏗️</span>
                )}
                <span style={{ color: fontColor }}>{companyName}</span>
              </div>
              <small className="fw-light mt-1" style={{ color: fontColor, fontSize: '0.75rem' }}>Powered by Salman & Kawsar</small>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="mainNavbar" className="navbar-toggler-icon-white" />
            <Navbar.Collapse id="mainNavbar">
              <Nav className="ms-auto mb-2 mb-lg-0 align-items-center">
                {menuLoading ? (
                  <Nav.Link style={{ color: fontColor }}>Loading...</Nav.Link>
                ) : (
                  <>
                    {menuItems.map(item => {
                      if (item.type === 'dropdown') {
                        return renderNavDropdown(item);
                      } else {
                        return renderNavLink(item);
                      }
                    })}
                    {(!isAuthenticated && SECURITY_ENABLED) && (
                      <Nav.Link as={NavLink} to="/login" onClick={() => setExpanded(false)} style={{ color: fontColor }}>Login</Nav.Link>
                    )}
                    {(isAuthenticated && SECURITY_ENABLED) && <AvatarMenu onLogout={handleLogout} />}
                  </>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
          <main className="container py-4 px-3">
            <Routes>
              <Route path="/" element={<Home />} />
              {isAuthenticated && <Route path="/project-management" element={<ProjectManagement />} />}
              {isAuthenticated && <Route path="/ProjectManagementEntryForm" element={<ProjectManagementEntryForm />} />}
              {isAuthenticated && <Route path="/project-estimation" element={<ProjectEstimation />} />}
              {isAuthenticated && <Route path="/enquiry-details" element={<EnquiryDetails />} />}
              {isAuthenticated && <Route path="/boq-estimation" element={<BOQEstimation />} />}
              {isAuthenticated && <Route path="/pricing-calculator" element={<PricingCalculator />} />}
              {isAuthenticated && <Route path="/purchase-orders" element={<PurchaseOrders />} />}
              {isAuthenticated && <Route path="/material-received" element={<MaterialReceived />} />}
              {isAuthenticated && <Route path="/store-requisition" element={<StoreRequisition />} />}
              {isAuthenticated && <Route path="/reports" element={<Reports />} />}
              {isAuthenticated && <Route path="/stock-details" element={<StockDetails />} />}
              {isAuthenticated && <Route path="/cost-report" element={<CostReport />} />}
              {isAuthenticated && <Route path="/item-master" element={<ItemMaster />} />}
              {isAuthenticated && <Route path="/supplier-master" element={<SupplierMaster />} />}
              {isAuthenticated && <Route path="/location-master" element={<LocationMaster />} />}
              {isAuthenticated && <Route path="/rcc-configuration" element={<RccConfiguration />} />}
              {isAuthenticated && <Route path="/bhk-configuration" element={<BHKConfiguration />} />}
              {isAuthenticated && <Route path="/area-calculation" element={<AreaCalculation />} />}
              {isAuthenticated && <Route path="/area-calculation-excel" element={<AreaCalculationHandsontable />} />}
              {isAuthenticated && <Route path="/company-setup" element={<CompanySetup />} />}
              {isAuthenticated && <Route path="/user-management" element={<UserManagement />} />}
              {isAuthenticated && <Route path="/user-profile" element={<UserProfile />} />}
              {isAuthenticated && <Route path="/role-management" element={<RoleManagement />} />}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login onLogin={handleLogin} isAuthenticated={isAuthenticated} />} />
              <Route path="/TestApiPage" element={<TestApiPage />} />
              <Route path="*" element={<Home />} />
            </Routes>
            <WhatsAppButton />
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

// Wrap App with GoogleOAuthProvider
function AppWithProviders() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
}

export default AppWithProviders;
