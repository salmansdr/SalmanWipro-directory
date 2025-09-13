
import React, { useState } from 'react';
import Hero from './Hero';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';


function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Router>
      <div className="construction-app">
        <header className="construction-header">
          <div className="header-title">🏗️ BuildPro Construction</div>
          <button
            className={`hamburger-btn${menuOpen ? ' open' : ''}`}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;







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
              {showProgress && (
                <>
                  <div className="project-progress">
                    <span>Progress: </span>
                    <span className="progress-bar">
                      <span className="progress-bar-inner" style={{width: proj.progress + '%'}}></span>
                    </span>
                    <span className="progress-percent">{proj.progress}%</span>
                  </div>
                  <hr className="progress-divider" />
                </>
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
  const [tab, setTab] = useState('completed');
  const [projectsData, setProjectsData] = useState(null);
  const currentTab = PROJECT_TABS_META.find(t => t.key === tab);
  let tabProjects = [];

  React.useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/projects.json')
      .then(res => res.json())
      .then(data => setProjectsData(data));
  }, []);

  if (!projectsData) return <div>Loading...</div>;

  if (tab === 'completed') tabProjects = projectsData.completed;
  if (tab === 'running') tabProjects = projectsData.running;
  if (tab === 'upcoming') tabProjects = projectsData.upcoming;
  return (
    <div className="construction-home">
      <Hero />
      <div className="project-mini-menu">
        {PROJECT_TABS_META.map(t => (
          <button
            key={t.key}
            className={`mini-menu-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
            type="button"
          >
            <span className="mini-menu-icon">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      <ProjectSection
        title={`${currentTab.icon} ${currentTab.label} Projects`}
        projects={tabProjects}
        showProgress={currentTab.showProgress}
      />
    </div>
  );
}
