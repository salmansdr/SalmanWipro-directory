
import React, { useState } from 'react';
import Hero from './Hero';
import MoreDetails from './MoreDetails';

const PROJECT_TABS_META = [
  { key: 'completed', label: 'Completed', icon: '🏆', showProgress: false },
  { key: 'running', label: 'Running', icon: '🏗️', showProgress: true },
  { key: 'upcoming', label: 'Upcoming', icon: '🚧', showProgress: false },
];

function ProjectSection({ title, projects, showProgress = true }) {
  return (
    <section className="project-section">
      <div className="project-card-list">
        {projects.map((proj, idx) => (
          <div
            key={proj.id}
            className={`project-card`}
            tabIndex={0}
          >
            <img src={proj.image.startsWith('http') ? proj.image : process.env.PUBLIC_URL + '/' + proj.image} alt={proj.name} className="project-img" />
            <div className="project-info">
              <div className="project-title">{proj.name}</div>
              <div className="project-location">{proj.location}</div>
              <div className="project-location">{proj.status}</div>
              {proj.status === 'running' && (
                <div className="project-progress horizontal-thermometer">
                  <span className="progress-label">Progress: {proj.progress + '%'} </span>
                </div>
              )}
              <button
                className={`more-details-link${showProgress ? ' below-status' : ''}`}
                id={proj.id}
                onClick={() => proj.onKnowMore()}
                type="button"
              >
                More Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Home() {
  const [tab, setTab] = useState('completed');
  const [projectsData, setProjectsData] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchStatus, setSearchStatus] = useState('completed');
  const [filteredProjects, setFilteredProjects] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const currentTab = PROJECT_TABS_META.find(t => t.key === tab);
  let tabProjects = [];

  React.useEffect(() => {
    setTab('completed');
    fetch(process.env.PUBLIC_URL + '/projects.json')
      .then(res => res.json())
      .then(data => {
        setProjectsData(data);
        setFilteredProjects(data.completed);
      });
  }, []);

  if (!projectsData) return <div>Loading...</div>;

  const allProjects = [
    ...projectsData.completed,
    ...projectsData.running,
    ...projectsData.upcoming
  ];
  const uniqueLocations = Array.from(new Set(allProjects.map(p => p.location)));

  if (filteredProjects !== null) {
    tabProjects = filteredProjects;
  } else {
    if (tab === 'completed') tabProjects = projectsData.completed;
    if (tab === 'running') tabProjects = projectsData.running;
    if (tab === 'upcoming') tabProjects = projectsData.upcoming;
  }

  const projectsWithNav = tabProjects.map((proj) => ({
    ...proj,
    onKnowMore: () => {
      setSelectedProject(proj.id);
      setShowDetails(true);
    }
  }));

  const handleBack = () => {
    setShowDetails(false);
    setSelectedProject(null);
  };

  if (showDetails && selectedProject) {
    return <MoreDetails onBack={handleBack} projectId={selectedProject} allProjects={allProjects} />;
  }

  function handleSearch(location, status) {
    let filtered = allProjects;
    if (location) filtered = filtered.filter(p => p.location === location);
    if (status) filtered = filtered.filter(p => p.status === status);
    setFilteredProjects(filtered);
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
              onChange={e => {
                const newLocation = e.target.value;
                setSearchLocation(newLocation);
                handleSearch(newLocation, searchStatus);
              }}
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
              onChange={e => {
                const newStatus = e.target.value;
                setSearchStatus(newStatus);
                handleSearch(searchLocation, newStatus);
              }}
            >
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="upcoming">Upcoming</option>
              <option value="">All</option>
            </select>
          </div>
        </div>
      </div>
      {/* End Search Section */}
      <ProjectSection
        title={`${currentTab.icon} ${currentTab.label} Projects`}
        projects={projectsWithNav}
        showProgress={currentTab.showProgress}
      />
    </div>
  );
}

export default Home;