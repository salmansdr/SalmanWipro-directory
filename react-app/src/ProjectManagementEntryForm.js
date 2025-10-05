
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Dropdown, DropdownButton } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';


const statusOptions = ['Upcoming', 'Running', 'Completed'];

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

const docNames = ['Master Plan', 'Site Plan', 'Booking Form', 'Brochure'];
const indoorAmenities = ['Gym', 'Club House', 'Indoor Games', 'Yoga Room', 'Library'];

const outdoorAmenities = ['Swimming Pool', 'Garden', 'Children Play Area', 'Jogging Track', 'Tennis Court'];


function ProjectManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  // Determine if editing (Edit button) or viewing (hyperlink)
  const isEdit = location.state && location.state.edit === true;
  // Master section state
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  // const [image, setImage] = useState(null); // Removed unused image state
  const [floors, setFloors] = useState(1);
  const [flatsPerFloor, setFlatsPerFloor] = useState(1);
  const [sellingPrice, setSellingPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Upcoming');
  // Populate form fields if editing or viewing
  useEffect(() => {
    if (location.state && location.state.project) {
      const p = location.state.project;
      setProjectName(p.name || '');
      setProjectLocation(p.location || '');
      setFloors(p.floors || 1);
      setFlatsPerFloor(p.flatsPerFloor || 1);
      setSellingPrice(p.sellingPrice || '');
      setStartDate(p.startDate || '');
      setEndDate(p.endDate || '');
      setStatus(p.status || 'Upcoming');
      // TODO: Populate stages, docs, amenities if needed
    }
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
    setDocs(docs.map((d, i) => i === idx ? { ...d, file } : d));
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


  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Save logic here
    alert('Project saved!');
  };

  return (
    <Container className="py-4">
      <div className="mb-3">
        <Button variant="outline-secondary" onClick={() => navigate('/project-management')}>
          &larr; Back to Project Management
        </Button>
      </div>
      <Card className="mb-4 shadow-sm">
        <Card.Header as="h3" className="bg-primary text-white">Project Management</Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* 1. Master Section */}
            <Card className="mb-4">
              <Card.Header as="h5" className="bg-info text-white">Project Details</Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}><Form.Group><Form.Label>Project Name</Form.Label><Form.Control value={projectName} onChange={e => setProjectName(e.target.value)} required /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label>Location</Form.Label><Form.Control value={projectLocation} onChange={e => setProjectLocation(e.target.value)} required /></Form.Group></Col>
                </Row>
                <Row className="mb-3">
                  {/* Project Image input removed since image state is not used */}
                  <Col md={3}><Form.Group><Form.Label>Number of Floors</Form.Label><Form.Control type="number" min={1} value={floors} onChange={e => setFloors(Number(e.target.value))} required /></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label>Flats per Floor</Form.Label><Form.Control type="number" min={1} value={flatsPerFloor} onChange={e => setFlatsPerFloor(Number(e.target.value))} required /></Form.Group></Col>
                </Row>
                <Row className="mb-3">
                  <Col md={12}><Form.Group><Form.Label>Selling Price Details</Form.Label><Form.Control as="textarea" rows={2} value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} required /></Form.Group></Col>
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
                      <Form.Group className="d-flex align-items-center justify-content-between">
                        <Form.Label className="mb-0">{doc.name}</Form.Label>
                        <Form.Control type="file" accept=".pdf,.doc,.docx" style={{maxWidth: '60%'}} onChange={e => handleDocUpload(idx, e.target.files[0])} />
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

            {/* 5. Save & Submit Section */}
            {(!location.state || isEdit) && (
              <div className="d-flex justify-content-end gap-3">
                <Button variant="secondary" type="button">Save</Button>
                <Button variant="primary" type="submit">Submit</Button>
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ProjectManagement;
