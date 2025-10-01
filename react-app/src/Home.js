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
    <div className="container-fluid mt-3 px-3">
      <div className="row">
        {projects.map((proj) => (
          <div key={proj.id} className="col-12 col-md-6 col-lg-3 mb-4">
            <div className="card h-100 shadow-sm d-flex flex-column">
              <img
                src={proj.image.startsWith('http') ? proj.image : process.env.PUBLIC_URL + '/' + proj.image}
                alt={proj.name}
                className="card-img-top"
                style={{ marginTop: 0, paddingTop: 0, borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}
              />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{proj.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">{proj.location}</h6>
                <div className="mb-2">{proj.status}</div>
                {proj.status === 'running' && (
                  <div className="mb-2">
                    <span className="fw-bold">Progress: {proj.progress}%</span>
                  </div>
                )}
                <button
                  type="button"
                  className={`btn btn-outline-primary mt-auto`}
                  id={proj.id}
                  onClick={() => proj.onKnowMore()}
                >
                  More Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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
    if (status) filtered = filtered.filter(p => p.status && p.status.toLowerCase() === status.toLowerCase());
    setFilteredProjects(filtered);
  }

  return (
    <div className="container-fluid px-0">
      <Hero />
      {/* Search Section */}
      <div className="card mt-4 mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-6">
              <div className="mb-3">
                <label htmlFor="location-select" className="form-label">By Location</label>
                <select
                  id="location-select"
                  className="form-select"
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
            </div>
            <div className="col-12 col-md-6">
              <div className="mb-3">
                <label htmlFor="status-select" className="form-label">By Status</label>
                <select
                  id="status-select"
                  className="form-select"
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