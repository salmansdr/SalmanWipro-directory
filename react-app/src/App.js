
import React, { useState, useEffect } from 'react';
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
          <nav className={`construction-nav${menuOpen ? ' open' : ''}`}>
            <ul>
              <li><NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink></li>
              <li><NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink></li>
              <li><NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink></li>
              <li><NavLink to="/login" onClick={() => setMenuOpen(false)}>Login</NavLink></li>
            </ul>
          </nav>
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






// Project data restored from JSON
const COMPLETED_PROJECTS = [
  {
    id: 101,
    name: 'Sunrise Residency',
    location: 'Central Park',
    progress: 100,
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    floors: 10,
    flatsPerFloor: 5,
    sellingPrice: '₹75L - ₹1Cr',
    startDate: '2021-01-01',
    endDate: '2023-03-15',
    stages: [
      'Approval process', 'Planning & Design', 'Foundation work', 'Structural Framing', 'Roofing and Exterior', 'Interior Finishing', 'Fixtures and Fitting', 'Handover'
    ]
  },
  {
    id: 102,
    name: 'Lakeview Apartments',
    location: 'Lakeside',
    progress: 100,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    floors: 12,
    flatsPerFloor: 6,
    sellingPrice: '₹90L - ₹1.3Cr',
    startDate: '2020-06-10',
    endDate: '2022-12-01',
    stages: [
      'Approval process', 'Planning & Design', 'Foundation work', 'Structural Framing', 'Roofing and Exterior', 'Interior Finishing', 'Fixtures and Fitting', 'Handover'
    ]
  },
  {
    id: 103,
    name: 'Metro City Homes',
    location: 'Metro City',
    progress: 100,
    image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=400&q=80',
    floors: 15,
    flatsPerFloor: 8,
    sellingPrice: '₹1Cr - ₹1.5Cr',
    startDate: '2019-03-20',
    endDate: '2021-11-30',
    stages: [
      'Approval process', 'Planning & Design', 'Foundation work', 'Structural Framing', 'Roofing and Exterior', 'Interior Finishing', 'Fixtures and Fitting', 'Handover'
    ]
  },
  {
    id: 104,
    name: 'Hilltop Villas',
    location: 'Hill Area',
    progress: 100,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    floors: 6,
    flatsPerFloor: 4,
    sellingPrice: '₹1.2Cr - ₹2Cr',
    startDate: '2018-07-01',
    endDate: '2020-10-10',
    stages: [
      'Approval process', 'Planning & Design', 'Foundation work', 'Structural Framing', 'Roofing and Exterior', 'Interior Finishing', 'Fixtures and Fitting', 'Handover'
    ]
  }
];

const RUNNING_PROJECTS = [
  {
    id: 1,
    name: 'Skyline Heights',
    location: 'Downtown City',
    progress: 78,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    floors: 12,
    flatsPerFloor: 6,
    sellingPrice: '₹85L - ₹1.2Cr',
    startDate: '2024-01-15',
    endDate: '2026-06-30',
    stages: [
      'Approval process', 'Planning & Design', 'Foundation work', 'Structural Framing', 'Roofing and Exterior', 'Interior Finishing'
    ]
  },
  {
    id: 2,
    name: 'Green Valley Residency',
    location: 'Suburban Area',
    progress: 54,
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
    floors: 8,
    flatsPerFloor: 8,
    sellingPrice: '₹65L - ₹95L',
    startDate: '2023-09-01',
    endDate: '2025-12-15',
    stages: [
      'Approval process', 'Planning & Design', 'Foundation work', 'Structural Framing', 'Roofing and Exterior'
    ]
  },
  {
    id: 3,
    name: 'Oceanic Towers',
    location: 'Coastal Road',
    progress: 92,
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=400&q=80',
    floors: 15,
    flatsPerFloor: 4,
    sellingPrice: '₹1.1Cr - ₹1.8Cr',
    startDate: '2022-05-10',
    endDate: '2025-01-20',
    stages: [
      'Approval process', 'Planning & Design', 'Foundation work', 'Structural Framing', 'Roofing and Exterior', 'Interior Finishing', 'Fixtures and Fitting', 'Handover'
    ]
  }
];

const UPCOMING_PROJECTS = [
  {
    id: 201,
    name: 'Riverfront Residency',
    location: 'Riverside',
    progress: 0,
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
    floors: 9,
    flatsPerFloor: 7,
    sellingPrice: '₹70L - ₹1Cr',
    startDate: '2026-01-01',
    endDate: '2028-06-30',
    stages: []
  },
  {
    id: 202,
    name: 'Garden Estate',
    location: 'Green Belt',
    progress: 0,
    image: 'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=400&q=80',
    floors: 11,
    flatsPerFloor: 5,
    sellingPrice: '₹80L - ₹1.1Cr',
    startDate: '2026-09-15',
    endDate: '2029-02-28',
    stages: []
  }
];



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
  const currentTab = PROJECT_TABS_META.find(t => t.key === tab);
  let tabProjects = [];
  if (tab === 'completed') tabProjects = COMPLETED_PROJECTS;
  if (tab === 'running') tabProjects = RUNNING_PROJECTS;
  if (tab === 'upcoming') tabProjects = UPCOMING_PROJECTS;
  return (
    <div className="construction-home">
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


export default App;
