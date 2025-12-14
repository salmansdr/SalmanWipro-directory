
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Dropdown, DropdownButton, Alert, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';


const statusOptions = ['Upcoming', 'Running', 'Completed','Closed'];

const stageNames = [
  'Approval process',
  'Planning & Design',
  'Foundation work',
  'Structural Framing',
  'Roofing and Exterior',
  'Interior Finishing',
  'Fixtures and Fitting',
  'Handover'
];

const docNames = ['Master Plan', 'Site Plan', 'Booking Form', 'Brochure', 'Project Image'];
const indoorAmenities = ['Gym', 'Club House', 'Indoor Games', 'Yoga Room', 'Library'];

const outdoorAmenities = ['Swimming Pool', 'Garden', 'Children Play Area', 'Jogging Track', 'Tennis Court'];


function ProjectManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  // Determine if editing (Edit button) or viewing (hyperlink)
  const isEdit = location.state && location.state.edit === true;
  // Master section state
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [landArea, setLandArea] = useState('');
  const [constructionArea, setConstructionArea] = useState('');
  // const [image, setImage] = useState(null); // Removed unused image state
  const [floors, setFloors] = useState(1);
  const [flatsPerFloor, setFlatsPerFloor] = useState(1);
  const [basementCount, setBasementCount] = useState(0);
  const [sellingPrice, setSellingPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [showViewer, setShowViewer] = useState(false);
  const [viewerContent, setViewerContent] = useState({ type: '', data: '', name: '' });
  const [loading, setLoading] = useState(false);

  // Populate form fields - fetch from API if ID is provided
  useEffect(() => {
    const loadProjectData = async () => {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      
      // Check if we have project data in location.state
      if (location.state && location.state.project) {
        const projectId = location.state.project._id;
        
        // Fetch fresh data from API
        if (projectId) {
          try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/api/Projects/${projectId}`);
            
            if (!response.ok) {
              throw new Error('Failed to load project data');
            }
            
            const p = await response.json();
            populateFormFields(p);
          } catch (error) {
            console.error('Error loading project:', error);
            setAlertMessage({
              show: true,
              type: 'danger',
              message: `Error loading project: ${error.message}`
            });
            // Fallback to location.state data
            populateFormFields(location.state.project);
          } finally {
            setLoading(false);
          }
        } else {
          // No ID, use location.state data directly
          populateFormFields(location.state.project);
        }
      }
    };

    const populateFormFields = (p) => {
      setProjectName(p.name || '');
      setProjectType(p.projectType || '');
      setProjectLocation(p.location || '');
      setLandArea(p.landArea || '');
      setConstructionArea(p.constructionArea || '');
      setFloors(p.floors || 1);
      setFlatsPerFloor(p.flatsPerFloor || 1);
      setBasementCount(p.basementCount || 0);
      setSellingPrice(p.sellingPrice || '');
      setStartDate(p.startDate || '');
      setEndDate(p.endDate || '');
      setStatus(p.status || 'Upcoming');
      
      // Populate stages from database
      if (p.stages && Array.isArray(p.stages)) {
        const updatedStages = stageNames.map(name => {
          const dbStage = p.stages.find(s => typeof s === 'string' ? s === name : s.name === name);
          if (dbStage) {
            // If stage exists in DB
            if (typeof dbStage === 'string') {
              // Old format: just stage name means involvement=true
              return { name, involvement: true, status: false };
            } else {
              // New format: object with involvement and status
              return { 
                name, 
                involvement: dbStage.involvement || true, 
                status: dbStage.status || false 
              };
            }
          }
          return { name, involvement: false, status: false };
        });
        setStages(updatedStages);
      }
      
      // Populate amenities from database
      if (p.amenities && Array.isArray(p.amenities)) {
        const indoorAmenity = p.amenities.find(a => a.type === 'indoor');
        const outdoorAmenity = p.amenities.find(a => a.type === 'outdoor');
        
        if (indoorAmenity && indoorAmenity.items) {
          setSelectedIndoor(indoorAmenity.items);
        }
        
        if (outdoorAmenity && outdoorAmenity.items) {
          setSelectedOutdoor(outdoorAmenity.items);
        }
      }
      
      // Populate documents from database
      if (p.projectdocuments && Array.isArray(p.projectdocuments)) {
        const updatedDocs = docNames.map(docName => {
          const dbDoc = p.projectdocuments.find(d => d.name === docName);
          if (dbDoc) {
            // Create a File-like object from the database data
            return {
              name: docName,
              file: {
                name: dbDoc.fileName || docName,
                type: dbDoc.contentType || 'application/octet-stream',
                data: dbDoc.data, // base64 data
                isFromDB: true // flag to indicate this is from database
              }
            };
          }
          return { name: docName, file: null };
        });
        setDocs(updatedDocs);
      }
    };

    loadProjectData();
  }, [location.state]);

  // Stages section state
  const [stages, setStages] = useState(stageNames.map(name => ({ name, involvement: false, status: false })));

  // Documentation section state
  const [docs, setDocs] = useState(docNames.map(name => ({ name, file: null })));

  // Amenities section state
  const [selectedIndoor, setSelectedIndoor] = useState([]);
  const [selectedOutdoor, setSelectedOutdoor] = useState([]);
  const [showIndoor, setShowIndoor] = useState(false);
  const [showOutdoor, setShowOutdoor] = useState(false);
  const indoorRef = useRef(null);
  const outdoorRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (indoorRef.current && !indoorRef.current.contains(event.target)) {
        setShowIndoor(false);
      }
      if (outdoorRef.current && !outdoorRef.current.contains(event.target)) {
        setShowOutdoor(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleStageChange = (idx, field) => {
    setStages(stages.map((s, i) => i === idx ? { ...s, [field]: !s[field] } : s));
  };
  const handleDocUpload = (idx, file) => {
    if (!file) return; // Ignore if no file selected (user cancelled)
    setDocs(docs.map((d, i) => i === idx ? { ...d, file } : d));
  };
  const handleRemoveDoc = (idx) => {
    setDocs(docs.map((d, i) => i === idx ? { ...d, file: null } : d));
  };
  const handleIndoorSelect = (item) => {
    setSelectedIndoor(selectedIndoor.includes(item)
      ? selectedIndoor.filter(i => i !== item)
      : [...selectedIndoor, item]);
  };
  const handleOutdoorSelect = (item) => {
    setSelectedOutdoor(selectedOutdoor.includes(item)
      ? selectedOutdoor.filter(i => i !== item)
      : [...selectedOutdoor, item]);
  };

  const handleViewDocument = (file) => {
    setViewerContent({
      type: file.type,
      data: file.data || URL.createObjectURL(file),
      name: file.name
    });
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setViewerContent({ type: '', data: '', name: '' });
  };


  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const project = location.state?.project;
      const projectId = project?._id;

      // Convert document files to base64 for MongoDB binary storage
      const projectDocuments = await Promise.all(
        docs
          .filter(d => d.file)
          .map(async (d) => {
            // If file is from database, keep it as is
            if (d.file.isFromDB) {
              return {
                name: d.name,
                fileName: d.file.name,
                contentType: d.file.type,
                data: d.file.data
              };
            } else {
              // Convert new file to base64
              return {
                name: d.name,
                fileName: d.file.name,
                contentType: d.file.type,
                data: await convertFileToBase64(d.file)
              };
            }
          })
      );

      // Get user and company info from localStorage
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      const companyId = localStorage.getItem('selectedCompanyId');

      // Prepare project data
      const projectData = {
        name: projectName,
        projectType: projectType,
        location: projectLocation,
        landArea: landArea,
        constructionArea: constructionArea,
        floors: floors,
        flatsPerFloor: flatsPerFloor,
        basementCount: basementCount,
        sellingPrice: sellingPrice,
        startDate: startDate,
        endDate: endDate,
        status: status.toLowerCase(),
        stages: stages
          .filter(s => s.involvement)
          .map(s => ({
            name: s.name,
            involvement: s.involvement,
            status: s.status
          })),
        projectdocuments: projectDocuments,
        amenities: [
          { type: 'indoor', items: selectedIndoor },
          { type: 'outdoor', items: selectedOutdoor }
        ],
        companyId: companyId,
        createdBy: projectId ? project.createdBy : (username|| userId ),
        modifiedBy:username|| userId 
      };

      // Determine if POST (new) or PUT (update)
      const method = projectId ? 'PUT' : 'POST';
      const url = projectId ? `${apiUrl}/api/projects/${projectId}` : `${apiUrl}/api/projects`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${projectId ? 'update' : 'create'} project`);
      }

      // Show success message
      setAlertMessage({
        show: true,
        type: 'success',
        message: `Project ${projectId ? 'updated' : 'created'} successfully!`
      });

      // Auto-dismiss after 3 seconds and navigate
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
        navigate('/project-management');
      }, 3000);
    } catch (error) {
      console.error('Error saving project:', error);
      
      // Show error message
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error saving project: ${error.message}`
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 5000);
    }
  };

  return (
    <Container className="py-4">
      <div className="mb-3">
        <Button variant="outline-secondary" onClick={() => navigate('/project-management')}>
          &larr; Back to Project Management
        </Button>
      </div>

      {/* Alert Message */}
      {alertMessage.show && (
        <Alert 
          variant={alertMessage.type} 
          dismissible 
          onClose={() => setAlertMessage({ show: false, type: '', message: '' })}
          style={{ position: 'sticky', top: '1rem', zIndex: 1000 }}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Alert variant="info" className="text-center">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Loading project data...
        </Alert>
      )}

      <Card className="mb-4 shadow-sm">
        <Card.Header as="h3" className="bg-primary text-white">Project Management</Card.Header>
        <Card.Body>
          <Form>
            {/* 1. Master Section */}
            <Card className="mb-4">
              <Card.Header as="h5" className="bg-info text-white">Project Details</Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={4}><Form.Group><Form.Label>Project Name</Form.Label><Form.Control value={projectName} onChange={e => setProjectName(e.target.value)} required /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Project Type</Form.Label><Form.Control value={projectType} onChange={e => setProjectType(e.target.value)} placeholder="e.g., Residential, Commercial" /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Project Address</Form.Label><Form.Control value={projectLocation} onChange={e => setProjectLocation(e.target.value)} required /></Form.Group></Col>
                </Row>
                <Row className="mb-3">
                  <Col md={4}><Form.Group><Form.Label>Land Area (Katha/Sq ft)</Form.Label><Form.Control value={landArea} onChange={e => setLandArea(e.target.value)} placeholder="e.g., 5 Katha / 3500 sq ft" /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Construction Area (Sq ft)</Form.Label><Form.Control type="number" value={constructionArea} onChange={e => setConstructionArea(e.target.value)} placeholder="Total construction area" /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Number of Floors</Form.Label><Form.Control type="number" min={1} value={floors} onChange={e => setFloors(Number(e.target.value))} required /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Flats per Floor</Form.Label><Form.Control type="number" min={1} value={flatsPerFloor} onChange={e => setFlatsPerFloor(Number(e.target.value))} required /></Form.Group></Col>
                </Row>
                <Row className="mb-3">
                  {/* Project Image input removed since image state is not used */}
                  <Col md={4}><Form.Group><Form.Label>Basement Count</Form.Label><Form.Control type="number" min={0} value={basementCount} onChange={e => setBasementCount(Number(e.target.value))} /></Form.Group></Col>
                  <Col md={8}><Form.Group><Form.Label>Selling Price Details</Form.Label><Form.Control as="textarea" rows={2} value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} required /></Form.Group></Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}><Form.Group><Form.Label>Project Start Date</Form.Label><Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label>Estimate End Date</Form.Label><Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required /></Form.Group></Col>
                </Row>
                <Row className="mb-3">
                  <Col md={4}><Form.Group><Form.Label>Status</Form.Label><Form.Select value={status} onChange={e => setStatus(e.target.value)}>{statusOptions.map(opt => <option key={opt}>{opt}</option>)}</Form.Select></Form.Group></Col>
                </Row>
              </Card.Body>
            </Card>

            {/* 2. Project Stages Section */}
            <Card className="mb-4">
              <Card.Header as="h5" className="bg-info text-white">Project Stages</Card.Header>
              <Card.Body>
                <table className="table table-bordered table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Stage Name</th>
                      <th>Involvement</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((stage, idx) => (
                      <tr key={stage.name}>
                        <td>{stage.name}</td>
                        <td><Form.Check type="checkbox" checked={stage.involvement} onChange={() => handleStageChange(idx, 'involvement')} /></td>
                        <td><Form.Check type="checkbox" checked={stage.status} onChange={() => handleStageChange(idx, 'status')} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card.Body>
            </Card>

            {/* 3. Documentation Section */}
            <Card className="mb-4">
              <Card.Header as="h5" className="bg-info text-white">Project Documentation</Card.Header>
              <Card.Body>
                <Row>
                  {docs.map((doc, idx) => (
                    <Col md={6} className="mb-3" key={doc.name}>
                      <Form.Group className="d-flex flex-column align-items-start justify-content-between">
                        <div className="d-flex w-100 align-items-center justify-content-between">
                          <Form.Label className="mb-0">{doc.name}</Form.Label>
                          <Form.Control
                            type="file"
                            accept=".pdf,.doc,.docx,image/*"
                            capture="environment"
                            style={{maxWidth: '60%'}}
                            onChange={e => handleDocUpload(idx, e.target.files[0])}
                          />
                        </div>
                        {/* Show preview or file name below input for better visibility */}
                        {doc.file && (
                          <div className="mt-2 w-100" style={{wordBreak: 'break-all'}}>
                            {doc.file.isFromDB ? (
                              // Display file from database
                              <>
                                {doc.file.type && doc.file.type.startsWith('image/') ? (
                                  <img
                                    src={doc.file.data}
                                    alt="Preview"
                                    onClick={() => handleViewDocument(doc.file)}
                                    style={{maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(33,150,243,0.08)', cursor: 'pointer'}}
                                    title="Click to view fullscreen"
                                  />
                                ) : (
                                  <div className="d-flex align-items-center gap-2">
                                    <Button
                                      variant="link"
                                      className="text-success p-0"
                                      onClick={() => handleViewDocument(doc.file)}
                                      style={{ textDecoration: 'none' }}
                                    >
                                      ✓ {doc.file.name}
                                    </Button>
                                    <a 
                                      href={doc.file.data} 
                                      download={doc.file.name}
                                      className="btn btn-sm btn-outline-primary"
                                      title="Download"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Download
                                    </a>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleRemoveDoc(idx)}
                                      title="Remove file"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                )}
                              </>
                            ) : (
                              // Display newly uploaded file
                              <>
                                {doc.file.type && doc.file.type.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(doc.file)}
                                    alt="Preview"
                                    onClick={() => handleViewDocument(doc.file)}
                                    style={{maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(33,150,243,0.08)', cursor: 'pointer'}}
                                    title="Click to view fullscreen"
                                  />
                                ) : (
                                  <div className="d-flex align-items-center gap-2">
                                    <Button
                                      variant="link"
                                      className="text-secondary p-0"
                                      onClick={() => handleViewDocument(doc.file)}
                                      style={{ textDecoration: 'none' }}
                                    >
                                      {doc.file.name}
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleRemoveDoc(idx)}
                                      title="Remove file"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

            {/* 4. Amenities Section */}
            <Card className="mb-4">
              <Card.Header as="h5" className="bg-info text-white">Amenities</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group ref={indoorRef}>
                      <Form.Label>Indoor Amenities</Form.Label>
                      <DropdownButton
                        title="Select Indoor Amenities"
                        variant="outline-primary"
                        className="w-100"
                        style={{ minWidth: '320px', maxWidth: '100%' }}
                        show={showIndoor}
                        onToggle={setShowIndoor}
                      >
                        {indoorAmenities.map(item => (
                          <Dropdown.Item key={item} active={selectedIndoor.includes(item)} onClick={e => { e.stopPropagation(); handleIndoorSelect(item); }} style={{ minWidth: '280px', display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.5rem 1rem' }}>
                            <Form.Check type="checkbox" checked={selectedIndoor.includes(item)} readOnly style={{marginBottom: 0}} />
                            <span style={{marginBottom: 0}}>{item}</span>
                          </Dropdown.Item>
                        ))}
                      </DropdownButton>
                      <div className="mt-2"><span className="fw-light">Selected:</span> {selectedIndoor.join(', ')}</div>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group ref={outdoorRef}>
                      <Form.Label>Outdoor Amenities</Form.Label>
                      <DropdownButton
                        title="Select Outdoor Amenities"
                        variant="outline-primary"
                        className="w-100"
                        style={{ minWidth: '320px', maxWidth: '100%' }}
                        show={showOutdoor}
                        onToggle={setShowOutdoor}
                      >
                        {outdoorAmenities.map(item => (
                          <Dropdown.Item key={item} active={selectedOutdoor.includes(item)} onClick={e => { e.stopPropagation(); handleOutdoorSelect(item); }} style={{ minWidth: '280px', display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.5rem 1rem' }}>
                            <Form.Check type="checkbox" checked={selectedOutdoor.includes(item)} readOnly style={{marginBottom: 0}} />
                            <span style={{marginBottom: 0}}>{item}</span>
                          </Dropdown.Item>
                        ))}
                      </DropdownButton>
                      <div className="mt-2"><span className="fw-light">Selected:</span> {selectedOutdoor.join(', ')}</div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* 5. Save Section */}
            {(!location.state || isEdit) && (
              <div className="d-flex justify-content-end gap-3">
                <Button variant="primary" type="button" onClick={handleSave}>Save</Button>
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>

      {/* Document Viewer Modal */}
      <Modal show={showViewer} onHide={handleCloseViewer} size="xl" centered>
        <Modal.Header closeButton style={{ background: '#e3f2fd', borderBottom: '2px solid #1976d2' }}>
          <Modal.Title style={{ color: '#1976d2', fontWeight: 600 }}>
            {viewerContent.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, maxHeight: '80vh', overflow: 'auto' }}>
          {viewerContent.type && viewerContent.type.startsWith('image/') ? (
            <img 
              src={viewerContent.data} 
              alt={viewerContent.name}
              style={{ width: '100%', height: 'auto' }}
            />
          ) : viewerContent.type && viewerContent.type === 'application/pdf' ? (
            <iframe
              src={viewerContent.data}
              title={viewerContent.name}
              style={{ width: '100%', height: '80vh', border: 'none' }}
            />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Preview not available for this file type.</p>
              <a 
                href={viewerContent.data} 
                download={viewerContent.name}
                className="btn btn-primary"
              >
                Download {viewerContent.name}
              </a>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseViewer}>
            Close
          </Button>
          <a 
            href={viewerContent.data} 
            download={viewerContent.name}
            className="btn btn-primary"
          >
            Download
          </a>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ProjectManagement;
