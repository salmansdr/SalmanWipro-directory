import React, { useState } from 'react';
import Hero from './Hero';
import MoreDetails from './MoreDetails';

const PROJECT_TABS_META = [
  { key: 'completed', label: 'Completed', icon: '🏆', showProgress: false },
  { key: 'running', label: 'Running', icon: '🏗️', showProgress: true },
  { key: 'upcoming', label: 'Upcoming', icon: '🚧', showProgress: true },
];

function ProjectSection({ title, projects, showProgress = true }) {
  return (
    <div className="container-fluid mt-3 px-3">
      <div className="row">
        {projects.map((proj, index) => {
          // Extract Project Image from projectdocuments array
          let projectImage = proj.image;
          if (!projectImage && proj.projectdocuments && Array.isArray(proj.projectdocuments)) {
            const imageDoc = proj.projectdocuments.find(doc => doc.name === 'Project Image');
            if (imageDoc && imageDoc.data) {
              projectImage = imageDoc.data; // This is base64 data
            }
          }

          return (
            <div key={`${proj.id}-${index}`} className="col-12 col-md-6 col-lg-3 mb-4">
              <div className="card h-100 shadow-sm d-flex flex-column">
                {projectImage && (
                  <img
                    src={projectImage.startsWith('http') ? projectImage : (projectImage.startsWith('data:') ? projectImage : process.env.PUBLIC_URL + '/' + projectImage)}
                    alt={proj.name}
                    className="card-img-top"
                    style={{ marginTop: 0, paddingTop: 0, borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem', objectFit: 'cover', height: '200px' }}
                  />
                )}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{proj.name}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">{proj.location}</h6>
                  <div className="mb-2">{proj.status}</div>
                  {showProgress && (proj.status === 'running' || proj.status === 'upcoming') && (
                    <div className="mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold" style={{ fontSize: '0.875rem' }}>Progress</span>
                        <span className="fw-bold text-primary">{proj.completionStatus || 0}%</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div
                          className={`progress-bar ${
                            (proj.completionStatus || 0) < 50 ? 'bg-info' :
                            (proj.completionStatus || 0) < 80 ? 'bg-primary' :
                            'bg-success'
                          }`}
                          role="progressbar"
                          style={{ width: `${proj.completionStatus || 0}%` }}
                          aria-valuenow={proj.completionStatus || 0}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className={`btn btn-outline-primary mt-auto`}
                    id={proj._id}
                    onClick={() => proj.onKnowMore()}
                  >
                    More Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Home() {
  // All hooks at the top
  const [tab, setTab] = useState('completed');
  const [projectsData, setProjectsData] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchStatus, setSearchStatus] = useState(''); // Changed to empty string to show "All" initially
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
  const [enqLoading, setEnqLoading] = useState(false);

  const currentTab = PROJECT_TABS_META.find(t => t.key === tab);
  let tabProjects = [];

  React.useEffect(() => {
    setTab('completed');
    // Get companyId from localStorage
    const companyId = localStorage.getItem('selectedCompanyId');
    
    // Updated to call API instead of local file
    // Use environment variable for API URL, fallback to localhost for development
    const apiUrl = process.env.REACT_APP_API_URL || 'https://localhost:7777';
    const endpoint = companyId 
      ? `${apiUrl}/api/Projects/all-data?companyId=${companyId}`
      : `${apiUrl}/api/Projects/all-data`;
    
    
    
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
       
        let processedData;
        
        // Check if API returns a flat array of projects
        if (Array.isArray(data)) {
          // Log first project to check structure
         
          
          // Group projects by status
          processedData = {
            completed: data.filter(project => project.status === 'completed'),
            running: data.filter(project => project.status === 'running'),
            upcoming: data.filter(project => project.status === 'upcoming')
          };
          
        } else {
          // API returns object with completed, running, upcoming arrays
          processedData = data;
          
        }
        
        setProjectsData(processedData);
        // Set filtered projects to all projects initially
        const allProjectsArray = [
          ...(processedData.completed || []),
          ...(processedData.running || []),
          ...(processedData.upcoming || [])
        ];
        setFilteredProjects(allProjectsArray);
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
        setProjectsData(null);
        setFilteredProjects([]);
      });
    
    // Previous local file approach - kept for future use:
    // fetch(process.env.PUBLIC_URL + '/projects.json')
    //   .then(res => res.json())
    //   .then(data => {
    //     setProjectsData(data);
    //     setFilteredProjects(data.completed);
    //   });
  }, []);

  if (!projectsData) return <div>Loading...</div>;

  const allProjects = [
    ...(projectsData.completed || []),
    ...(projectsData.running || []),
    ...(projectsData.upcoming || [])
  ];
  const uniqueLocations = Array.from(new Set(allProjects.map(p => p.location)));

  if (filteredProjects !== null) {
    tabProjects = filteredProjects;
  } else {
    if (tab === 'completed') tabProjects = projectsData.completed || [];
    if (tab === 'running') tabProjects = projectsData.running || [];
    if (tab === 'upcoming') tabProjects = projectsData.upcoming || [];
  }

  // Update currentTab for display when showing filtered results
  const displayTab = filteredProjects !== null ? 
    (searchStatus ? { key: searchStatus, label: searchStatus.charAt(0).toUpperCase() + searchStatus.slice(1), icon: '🔍' } : { key: 'all', label: 'All', icon: '🔍' }) : 
    currentTab;

  const projectsWithNav = tabProjects.map((proj) => ({
    ...proj,
    onKnowMore: () => {
      
      setSelectedProject(proj._id || proj.id);
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
    
    
    // If both filters are empty, show all projects
    if (!location && !status) {
      setFilteredProjects(allProjects);
      setTab('all');
      return;
    }
    
    let filtered = allProjects;
    
    if (location) {
      filtered = filtered.filter(p => p.location === location);
      
    }
    
    if (status) {
      filtered = filtered.filter(p => p.status && p.status.toLowerCase() === status.toLowerCase());
     
    }
    
   
    setFilteredProjects(filtered);
    
    // Set appropriate tab
    if (status) {
      setTab(status);
    } else {
      setTab('all');
    }
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
    
    setEnqLoading(true);
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
    
    // First, check if record already exists
    const searchUrl = `${apiBaseUrl}/api/Home/search?projectName=${encodeURIComponent(enqProject)}&email=${encodeURIComponent(enqEmail)}`;
    
    fetch(searchUrl)
      .then(response => {
        
        // If 404, treat as no record found and proceed with POST
        if (response.status === 404) {
         
          return null;
        }
        // If other error status
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(existingData => {
        
        
        if (existingData) {
          // Record already exists
          const enquiryDate = existingData.enquiryDate || existingData[0]?.enquiryDate;
          const formattedDate = enquiryDate ? new Date(enquiryDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : '';
          
          setEnqLoading(false);
          setEnqSuccess(`Your enquiry information about this project is saved in our database on ${formattedDate}. Team will contact you.`);
          setEnqName(''); 
          setEnqEmail(''); 
          setEnqProject(''); 
          setEnqPhone(''); 
          setEnqMessage('');
        } else {
          // No existing record, proceed with POST
          // Prepare enquiry data as JSON with all columns
          const enquiryData = {
            name: enqName,
            Email: enqEmail,
            ProjectName: enqProject,
            phoneNo: enqPhone,
            message: enqMessage,
            enquiryDate: new Date().toISOString()
          };
          
          const requestPayload = {
            subject: `New Enquiry for ${enqProject}`,
            enquiryData: enquiryData
          };
          
          
          fetch(`${apiBaseUrl}/api/Home`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            setEnqLoading(false);
            setEnqSuccess('Your enquiry has been sent!');
            setEnqName(''); 
            setEnqEmail(''); 
            setEnqProject(''); 
            setEnqPhone(''); 
            setEnqMessage('');
          })
          .catch(error => {
            setEnqLoading(false);
            console.error('Error sending email:', error);
            setEnqError('Failed to send enquiry. Please try again.');
          });
        }
      })
      .catch(error => {
        setEnqLoading(false);
        console.error('Error checking existing enquiry:', error);
        setEnqError('Failed to process enquiry. Please try again.');
      });
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
                  <option value="">All</option>
                  <option value="completed">Completed</option>
                  <option value="running">Running</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Search Section */}
      <ProjectSection
        title={`${displayTab.icon} ${displayTab.label} Projects`}
        projects={projectsWithNav}
        showProgress={displayTab.showProgress}
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
                  {allProjects.map((p, index) => (
                    <option key={`${p.id}-${index}`} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <input type="tel" className="form-control" id="enq-phone" placeholder="Phone No." pattern="[0-9]{10}" maxLength={10} required value={enqPhone} onChange={e => setEnqPhone(e.target.value)} />
              </div>
              <div className="col-12">
                <textarea className="form-control" id="enq-message" placeholder="Message" rows="3" style={{resize: 'vertical'}} required value={enqMessage} onChange={e => setEnqMessage(e.target.value)}></textarea>
              </div>
              {enqLoading && (
                <div className="col-12">
                  <div className="alert alert-info py-2 mb-0 d-flex align-items-center">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending message, might take some time...
                  </div>
                </div>
              )}
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
                <button type="submit" className="btn btn-success px-4" disabled={enqLoading}>
                  {enqLoading ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;