

import React, { useState } from 'react';
import Hero from './Hero';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';

function Login() {
  return (
    <div className="construction-login">
      <h2>Login</h2>
      <form className="login-form">
        <label>
          Username:
          <input type="text" name="username" />
        </label>
        <label>
          Password:
          <input type="password" name="password" />
        </label>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function About() {
  return (
    <div className="construction-about">
      <h2>About Project</h2>
      <p>This portal helps manage building construction projects efficiently.</p>
    </div>
  );
}


function App() {
  const [menuOpen, setMenuOpen] = useState(false);
 
  return (
    <Router>
      <div className="construction-app">
        <header className="construction-header">
          <div className="header-title">🏗️ BuildPro Construction</div>
          <div className="powered-signature">Powered by Salman and Reza Kwsar</div>
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
          <a href="https://facebook.com/sample" target="_blank" rel="noopener noreferrer" className="footer-icon facebook" aria-label="Facebook">
            <img src={process.env.PUBLIC_URL + '/social/Facebook.PNG'} alt="Facebook" className="social-img" />
          </a>
          <a href="https://instagram.com/sample" target="_blank" rel="noopener noreferrer" className="footer-icon instagram" aria-label="Instagram">
            <img src={process.env.PUBLIC_URL + '/social/instagram.PNG'} alt="Instagram" className="social-img" />
          </a>
          <a href="https://x.com/sample" target="_blank" rel="noopener noreferrer" className="footer-icon x" aria-label="X">
            <img src={process.env.PUBLIC_URL + '/social/x.PNG'} alt="X" className="social-img" />
          </a>
          <a href="https://linkedin.com/sample" target="_blank" rel="noopener noreferrer" className="footer-icon linkedin" aria-label="LinkedIn">
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

function Contact() {
  return (
    <div className="construction-contact">
      <h2>Contact Us</h2>
      <p>Email: info@construction.com</p>
    </div>
  );
}




function ProjectSection({ title, projects, showProgress = true }) {
  const [selected, setSelected] = useState(null);
  return (
    <section className="project-section">
      <h1>{title}</h1>
      <div className="project-card-list">
        {projects.map((proj, idx) => (
          <div
            key={proj.id}
            className={`project-card${selected === idx ? ' selected' : ''}`}
            tabIndex={0}
          >
            <img src={proj.image} alt={proj.name} className="project-img" />
            <div className="project-info">
              <div className="project-title">{proj.name}</div>
              <div className="project-location">{proj.location}</div>
              <div className="project-location">{proj.status}</div>
              {proj.status === 'running' && (
                <div className="project-progress horizontal-thermometer">
                  <span className="progress-label">Progress: {proj.progress + '%'}</span>
                  {/*
                  <span className="thermometer-bar-horizontal">
                    <span className="thermometer-bg-horizontal">
                      <span className="thermometer-fill-horizontal" style={{width: proj.progress + '%'}}></span>
                    </span>
                    <span className="thermometer-bulb-horizontal"></span>
                  </span>
                  <span className="progress-percent-horizontal">{proj.progress}%</span>
                  */}
                </div>
              )}
              <button
                className={`more-details-link${showProgress ? ' below-status' : ''}`}
                onClick={() => setSelected(idx)}
                type="button"
              >
                More Details
              </button>
            </div>
          </div>
        ))}
      </div>
      {selected !== null && (
        <>
          <div style={{width: '100%'}}><hr className="details-divider" /></div>
          <div className="project-details">
            <h2>{projects[selected].name} Details</h2>
            <ul>
              <li><b>Location:</b> {projects[selected].location}</li>
              <li><b>Floors:</b> {projects[selected].floors}</li>
              <li><b>Flats per Floor:</b> {projects[selected].flatsPerFloor}</li>
              <li><b>Selling Price:</b> {projects[selected].sellingPrice}</li>
              <li><b>Project Start Date:</b> {projects[selected].startDate}</li>
              <li><b>Project End Date:</b> {projects[selected].endDate}</li>
              {projects[selected].stages.length > 0 && (
                <li><b>Stages Finished:</b>
                  <ol className="stage-list">
                    {projects[selected].stages.map((stage, i) => (
                      <li key={i}>{stage}</li>
                    ))}
                  </ol>
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}



const PROJECT_TABS_META = [
  { key: 'completed', label: 'Completed', icon: '🏆', showProgress: false },
  { key: 'running', label: 'Running', icon: '🏗️', showProgress: true },
  { key: 'upcoming', label: 'Upcoming', icon: '🚧', showProgress: false },
];





function Home() {
  const [tab, setTab] = useState('completed'); // 'completed' is Home
  const [projectsData, setProjectsData] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchStatus, setSearchStatus] = useState('completed');
  const [filteredProjects, setFilteredProjects] = useState(null);
  const currentTab = PROJECT_TABS_META.find(t => t.key === tab);
  let tabProjects = [];

  React.useEffect(() => {
    setTab('completed'); // Ensure Home is active on mount
    fetch(process.env.PUBLIC_URL + '/projects.json')
      .then(res => res.json())
      .then(data => {
        setProjectsData(data);
        // Show completed projects by default
        setFilteredProjects(data.completed);
      });
  }, []);

  if (!projectsData) return <div>Loading...</div>;

  // Gather all unique locations and statuses from projects.json
  const allProjects = [
    ...projectsData.completed,
    ...projectsData.running,
    ...projectsData.upcoming
  ];
  const uniqueLocations = Array.from(new Set(allProjects.map(p => p.location)));
  //const uniqueStatuses = ['completed', 'running', 'upcoming'];

  // Filtering logic
  function handleSearch() {
    let results = allProjects;
    // If both dropdowns are 'All' or empty, show all
    const locationSelected = searchLocation && searchLocation !== 'All';
    const statusSelected = searchStatus && searchStatus !== 'All';

    if (locationSelected && statusSelected) {
      // AND condition: both filters must match
      results = results.filter(p => {
        let statusMatch = false;
        if (searchStatus === 'completed') statusMatch = projectsData.completed.some(c => c.id === p.id);
        if (searchStatus === 'running') statusMatch = projectsData.running.some(r => r.id === p.id);
        if (searchStatus === 'upcoming') statusMatch = projectsData.upcoming.some(u => u.id === p.id);
        return p.location === searchLocation && statusMatch;
      });
    } else if (locationSelected) {
      // Only location filter
      results = results.filter(p => p.location === searchLocation);
    } else if (statusSelected) {
      // Only status filter
      results = results.filter(p => {
        if (searchStatus === 'completed') return projectsData.completed.some(c => c.id === p.id);
        if (searchStatus === 'running') return projectsData.running.some(r => r.id === p.id);
        if (searchStatus === 'upcoming') return projectsData.upcoming.some(u => u.id === p.id);
        return true;
      });
    }
    // If neither selected, results remain allProjects
    setFilteredProjects(results);
  }

  function handleReset() {
    setSearchLocation('');
    setSearchStatus('');
    setFilteredProjects(null);
  }

  // Determine which projects to show
  if (filteredProjects !== null) {
    tabProjects = filteredProjects;
  } else {
    if (tab === 'completed') tabProjects = projectsData.completed;
    if (tab === 'running') tabProjects = projectsData.running;
    if (tab === 'upcoming') tabProjects = projectsData.upcoming;
  }

  return (
    <div className="construction-home">
      <Hero />
      {/* Search Section */}
      <div className="project-search-section card-style">
        <div className="search-row side-by-side compact-row">
          <div className="search-group">
            <div className="search-label">By Location</div>
            <select
              id="location-select"
              className="search-select"
              value={searchLocation}
              onChange={e => setSearchLocation(e.target.value)}
            >
              <option value="">All</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
         
          <div className="search-group">
            <div className="search-label">By Status</div>
            <select
              id="status-select"
              className="search-select"
              value={searchStatus}
              onChange={e => setSearchStatus(e.target.value)}
            >
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="upcoming">Upcoming</option>
              <option value="">All</option>
            </select>
          </div>
          <div className="search-btn-group">
            <button className="search-btn icon-btn" onClick={handleSearch} title="Search">
              <span role="img" aria-label="search">🔍</span>
            </button>
            <button className="reset-btn icon-btn" onClick={handleReset} title="Reset">
              <span role="img" aria-label="reset">♻️</span>
            </button>
          </div>
        </div>
      </div>
      {/* End Search Section */}
      {/*
      <div className="project-mini-menu">
        {PROJECT_TABS_META.map(t => (
          <button
            key={t.key}
            className={`mini-menu-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => { setTab(t.key); setFilteredProjects(null); }}
            type="button"
          >
            <span className="mini-menu-icon">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      */}
      <ProjectSection
        title={`${currentTab.icon} ${currentTab.label} Projects`}
        projects={tabProjects}
        showProgress={currentTab.showProgress}
      />
    </div>
  );
}
  export default App;
