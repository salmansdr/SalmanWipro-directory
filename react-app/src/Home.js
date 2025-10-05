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
  // All hooks at the top
  const [tab, setTab] = useState('completed');
  const [projectsData, setProjectsData] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchStatus, setSearchStatus] = useState('completed');
  const [filteredProjects, setFilteredProjects] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  // Enquire Now form state
  const [enqName, setEnqName] = useState('');
  const [enqEmail, setEnqEmail] = useState('');
  const [enqProject, setEnqProject] = useState('');
  const [enqPhone, setEnqPhone] = useState('');
  const [enqMessage, setEnqMessage] = useState('');
  const [enqError, setEnqError] = useState('');
  const [enqSuccess, setEnqSuccess] = useState('');

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

  // Simple email and phone validation
  function validateEmail(email) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }
  function validatePhone(phone) {
    return /^[0-9]{10}$/.test(phone);
  }

  function handleEnquireSubmit(e) {
    e.preventDefault();
    setEnqError('');
    setEnqSuccess('');
    if (!enqName || !validateEmail(enqEmail) || !validatePhone(enqPhone) || !enqProject || !enqMessage) {
      setEnqError('Please fill all fields with valid email and 10-digit phone number.');
      return;
    }
    // Send email using mailto
    const subject = encodeURIComponent(`Enquiry for ${enqProject}`);
    const body = encodeURIComponent(`Name: ${enqName}\nEmail: ${enqEmail}\nPhone: ${enqPhone}\nProject: ${enqProject}\nMessage: ${enqMessage}`);
    window.location.href = `mailto:${enqEmail}?subject=${subject}&body=${body}`;
    // Send WhatsApp message
    const whatsappMsg = encodeURIComponent(`Enquiry for ${enqProject}:\n${enqMessage}\nName: ${enqName}, Phone: ${enqPhone}, Email: ${enqEmail}`);
    window.open(`https://wa.me/${enqPhone}?text=${whatsappMsg}`, '_blank');
    setEnqSuccess('Your enquiry has been sent!');
    setEnqName(''); setEnqEmail(''); setEnqProject(''); setEnqPhone(''); setEnqMessage('');
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

      {/* Enquire Now Section */}
      <div className="container mt-3 mb-5">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">Enquire Now</h4>
          </div>
          <div className="card-body">
            <form className="row g-3" onSubmit={handleEnquireSubmit} autoComplete="off">
              <div className="col-12 col-md-6">
                <input type="text" className="form-control" id="enq-name" placeholder="Name" required value={enqName} onChange={e => setEnqName(e.target.value)} />
              </div>
              <div className="col-12 col-md-6">
                <input type="email" className="form-control" id="enq-email" placeholder="Email" required value={enqEmail} onChange={e => setEnqEmail(e.target.value)} />
              </div>
              <div className="col-12 col-md-6">
                <select className="form-select" id="enq-project" required value={enqProject} onChange={e => setEnqProject(e.target.value)}>
                  <option value="">Select project</option>
                  {allProjects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <input type="tel" className="form-control" id="enq-phone" placeholder="Phone No." pattern="[0-9]{10}" maxLength={10} required value={enqPhone} onChange={e => setEnqPhone(e.target.value)} />
              </div>
              <div className="col-12">
                <textarea className="form-control" id="enq-message" placeholder="Message" rows="3" style={{resize: 'vertical'}} required value={enqMessage} onChange={e => setEnqMessage(e.target.value)}></textarea>
              </div>
              {enqError && (
                <div className="col-12">
                  <div className="alert alert-danger py-2 mb-0">{enqError}</div>
                </div>
              )}
              {enqSuccess && (
                <div className="col-12">
                  <div className="alert alert-success py-2 mb-0">{enqSuccess}</div>
                </div>
              )}
              <div className="col-12 d-flex justify-content-end">
                <button type="submit" className="btn btn-success px-4">Submit</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;