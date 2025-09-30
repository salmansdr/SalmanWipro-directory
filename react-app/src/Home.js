
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import Hero from './Hero';
import MoreDetails from './MoreDetails';

const PROJECT_TABS_META = [
  { key: 'completed', label: 'Completed', icon: '🏆', showProgress: false },
  { key: 'running', label: 'Running', icon: '🏗️', showProgress: true },
  { key: 'upcoming', label: 'Upcoming', icon: '🚧', showProgress: false },
];

function ProjectSection({ title, projects, showProgress = true }) {
  return (
  <Container className="project-section mt-3">
  <Row xs={1} md={4} className="no-gutters tight-card-row">
    {projects.map((proj) => (
      <Col key={proj.id}>
        <Card className="h-100 project-card shadow-sm">
          <Card.Img
            variant="top"
            src={proj.image.startsWith('http') ? proj.image : process.env.PUBLIC_URL + '/' + proj.image}
            alt={proj.name}
            className="project-img"
          />
          <Card.Body className="project-info">
            <Card.Title className="project-title">{proj.name}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted project-location">{proj.location}</Card.Subtitle>
            <div className="project-location">{proj.status}</div>
            {proj.status === 'running' && (
              <div className="project-progress horizontal-thermometer">
                <span className="progress-label">Progress: {proj.progress}%</span>
              </div>
            )}
            <Button
              variant="outline-primary"
              className={`more-details-link${showProgress ? ' below-status' : ''} mt-2`}
              id={proj.id}
              onClick={() => proj.onKnowMore()}
            >
              More Details
            </Button>
          </Card.Body>
        </Card>
      </Col>
    ))}
  </Row>
</Container>

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
    <Container fluid className="construction-home">
      <Hero />
      {/* Search Section */}
      <Card className="project-search-section card-style mt-4 mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} md={6}>
              <Form.Group controlId="location-select">
                <Form.Label className="search-label">By Location</Form.Label>
                <Form.Select
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
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group controlId="status-select">
                <Form.Label className="search-label">By Status</Form.Label>
                <Form.Select
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
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      {/* End Search Section */}
      <ProjectSection
        title={`${currentTab.icon} ${currentTab.label} Projects`}
        projects={projectsWithNav}
        showProgress={currentTab.showProgress}
      />
    </Container>
  );
}

export default Home;