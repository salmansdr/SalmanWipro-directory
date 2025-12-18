import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Table, InputGroup } from 'react-bootstrap';

const LocationMaster = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    locationType: '',
    locationName: '',
    contactPersonName: '',
    phoneNo: '',
    isActive: true,
    createdBy: 'System',
    modifiedBy: 'System'
  });
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  useEffect(() => {
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Filter locations based on search term
    if (searchTerm.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter(location => 
        location.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.locationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.contactPersonName && location.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (location.phoneNo && location.phoneNo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredLocations(filtered);
    }
  }, [searchTerm, locations]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/LocationMaster`);
      if (response.ok) {
        const data = await response.json();
        console.log('Locations loaded:', data);
        setLocations(data);
        setFilteredLocations(data);
      } else {
        setAlertMessage({ show: true, type: 'danger', message: 'Failed to load locations' });
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNewLocation = () => {
    setFormData({
      _id: '',
      locationType: '',
      locationName: '',
      contactPersonName: '',
      phoneNo: '',
      isActive: true,
      createdBy: 'System',
      modifiedBy: 'System'
    });
    setEditMode(false);
    setViewMode('form');
  };

  const handleEdit = (location) => {
    setFormData({
      ...location,
      modifiedBy: 'System'
    });
    setEditMode(true);
    setViewMode('form');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validation
    if (!formData.locationType || !formData.locationName || !formData.phoneNo) {
      setAlertMessage({ show: true, type: 'danger', message: 'Please fill required fields: Location Type, Location Name, and Phone Number' });
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);
      return;
    }

    try {
      const url = editMode 
        ? `${apiBaseUrl}/api/LocationMaster/${formData._id}` 
        : `${apiBaseUrl}/api/LocationMaster`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      // Prepare data with metadata
      const dataToSend = {
        ...formData,
        modifiedBy: 'System',
        createdBy: editMode ? formData.createdBy : 'System'
      };
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setAlertMessage({ 
          show: true, 
          type: 'success', 
          message: editMode ? 'Location updated successfully!' : 'Location added successfully!' 
        });
        
        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        
        loadLocations();
        
        // Auto navigate back to list after 2 seconds for success
        setTimeout(() => {
          if (!editMode) {
            // Reset form for new entry
            setFormData({
              _id: '',
              locationType: '',
              locationName: '',
              contactPersonName: '',
              phoneNo: '',
              isActive: true,
              createdBy: 'System',
              modifiedBy: 'System'
            });
          } else {
            // For edit mode, return to list
            setViewMode('list');
          }
        }, 2000);
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to save location: ${errorData}` });
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/LocationMaster/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertMessage({ show: true, type: 'success', message: 'Location deleted successfully!' });
        
        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        
        loadLocations();
      } else {
        setAlertMessage({ show: true, type: 'danger', message: 'Failed to delete location' });
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
  };

  return (
    <Container fluid className="mt-3">
      {viewMode === 'list' ? (
        // List View
        <Card>
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-geo-alt me-2"></i>
                Location Master
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                View and manage all locations (Warehouse & Site)
              </p>
            </div>
            <Button variant="light" onClick={handleNewLocation}>
              <i className="bi bi-plus-circle me-2"></i>New Location
            </Button>
          </Card.Header>
          <Card.Body>
            {/* Search Bar */}
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by Location Name, Type, Contact Person, or Phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* Locations Table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading locations...</p>
              </div>
            ) : (
              <Table striped bordered hover responsive style={{ fontSize: '0.875rem' }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '15%' }}>Location Type</th>
                    <th style={{ width: '20%' }}>Location Name</th>
                    <th style={{ width: '18%' }}>Contact Person</th>
                    <th style={{ width: '15%' }}>Phone No</th>
                    <th style={{ width: '12%' }}>Status</th>
                    <th style={{ width: '10%' }}>Created By</th>
                    <th style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        {searchTerm ? 'No locations found matching your search.' : 'No locations available. Click "New Location" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLocations.map((location) => (
                      <tr key={location._id}>
                        <td>
                          {location.locationType === 'WareHouse' ? (
                            <span className="badge bg-info">
                              <i className="bi bi-building me-1"></i>WareHouse
                            </span>
                          ) : (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-tools me-1"></i>Site
                            </span>
                          )}
                        </td>
                        <td>{location.locationName}</td>
                        <td>{location.contactPersonName || '-'}</td>
                        <td>{location.phoneNo}</td>
                        <td>
                          {location.isActive ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-secondary">Inactive</span>
                          )}
                        </td>
                        <td>{location.createdBy || '-'}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(location)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(location._id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      ) : (
        // Form View
        <Card>
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-geo-alt me-2"></i>
                {editMode ? 'Edit Location' : 'New Location'}
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                {editMode ? 'Update location information' : 'Create a new location'}
              </p>
            </div>
            <div>
              <Button variant="light" className="me-2" onClick={() => setViewMode('list')}>
                <i className="bi bi-arrow-left me-2"></i>Back to List
              </Button>
              <Button variant="success" onClick={handleSubmit}>
                <i className="bi bi-save me-2"></i>Save Location
              </Button>
            </div>
          </Card.Header>
          <Card.Body style={{ paddingBottom: '2rem' }}>
            {/* Success/Error Alert */}
            {alertMessage.show && (
              <Alert 
                variant={alertMessage.type} 
                onClose={() => setAlertMessage({ show: false, type: '', message: '' })} 
                dismissible
              >
                {alertMessage.message}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              {/* Location Information */}
              <div className="mb-4">
                <h5 className="border-bottom pb-2 mb-3">Location Information</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location Type <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="locationType"
                        value={formData.locationType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Location Type</option>
                        <option value="WareHouse">WareHouse</option>
                        <option value="Site">Site</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="locationName"
                        value={formData.locationName}
                        onChange={handleInputChange}
                        placeholder="Enter location name"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Contact Details */}
              <div className="mb-4">
                <h5 className="border-bottom pb-2 mb-3">Contact Details</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Person Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={handleInputChange}
                        placeholder="Enter contact person name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone No <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="phoneNo"
                        value={formData.phoneNo}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Status */}
              <div className="mb-3">
                <h5 className="border-bottom pb-2 mb-3">Status</h5>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default LocationMaster;
