import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Table, InputGroup, Badge } from 'react-bootstrap';

const EnquiryDetails = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    resolution_notes: '',
    resolved_by: '',
    resolutionDate: new Date().toISOString().split('T')[0],
    status: 'New'
  });

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  useEffect(() => {
    loadEnquiries();
    // Get logged-in user name from localStorage
    const userName = localStorage.getItem('username') || 'Admin';
    setResolutionData(prev => ({ ...prev, resolved_by: userName }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Filter enquiries based on search term
    if (searchTerm.trim() === '') {
      setFilteredEnquiries(enquiries);
    } else {
      const filtered = enquiries.filter(enq => 
        (enq.name && enq.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (enq.email && enq.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (enq.projectname && enq.projectname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (enq.phoneno && enq.phoneno.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEnquiries(filtered);
    }
  }, [searchTerm, enquiries]);

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/Home`);
      if (response.ok) {
        const data = await response.json();
        console.log('Enquiries loaded:', data);
        const enquiryData = Array.isArray(data) ? data : [];
        setEnquiries(enquiryData);
        setFilteredEnquiries(enquiryData);
      } else {
        console.error('Failed to load enquiries');
        setEnquiries([]);
        setFilteredEnquiries([]);
      }
    } catch (error) {
      console.error('Error loading enquiries:', error);
      setEnquiries([]);
      setFilteredEnquiries([]);
    }
    setLoading(false);
  };

  const handleNameClick = (enquiry) => {
    console.log('Name clicked:', enquiry);
    setSelectedEnquiry(enquiry);
    setResolutionData({
      resolution_notes: enquiry.resolution_notes || '',
      resolved_by: localStorage.getItem('username') || 'Admin',
      resolutionDate: enquiry.resolutionDate ? new Date(enquiry.resolutionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: enquiry.status || 'New'
    });
    setShowResolutionModal(true);
  };

  const handleCloseModal = () => {
    setShowResolutionModal(false);
    setSelectedEnquiry(null);
  };

  const handleResolutionSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEnquiry) return;

    try {
      const updatePayload = {
        ...resolutionData,
        resolutionDate: new Date(resolutionData.resolutionDate).toISOString()
      };

      console.log('Updating enquiry:', selectedEnquiry._id, updatePayload);

      const response = await fetch(`${apiBaseUrl}/api/Home/${selectedEnquiry._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        alert('Resolution details updated successfully!');
        handleCloseModal();
        loadEnquiries(); // Reload the data
      } else {
        const errorText = await response.text();
        alert(`Failed to update: ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating resolution:', error);
      alert('Error updating resolution details');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResolutionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'New': 'danger',
      'In-progress': 'warning',
      'Resolved': 'success'
    };
    return <Badge bg={statusColors[status] || 'danger'}>{status || 'New'}</Badge>;
  };

  return (
    <div className="container-fluid mt-3">
      {/* Summary Cards */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="card text-white shadow-sm" style={{ backgroundColor: '#dc3545', borderRadius: '8px' }}>
            <div className="card-body py-3 px-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-1" style={{ fontSize: '0.9rem', fontWeight: '500' }}>New</h6>
                  <h3 className="mb-0" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
                    {enquiries.filter(e => e.status === 'New' || !e.status).length}
                  </h3>
                </div>
                <div style={{ opacity: '0.3' }}>
                  <i className="fas fa-exclamation-circle fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white shadow-sm" style={{ backgroundColor: '#ffc107', borderRadius: '8px' }}>
            <div className="card-body py-3 px-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-1" style={{ fontSize: '0.9rem', fontWeight: '500' }}>In-progress</h6>
                  <h3 className="mb-0" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
                    {enquiries.filter(e => e.status === 'In-progress').length}
                  </h3>
                </div>
                <div style={{ opacity: '0.3' }}>
                  <i className="fas fa-spinner fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white shadow-sm" style={{ backgroundColor: '#28a745', borderRadius: '8px' }}>
            <div className="card-body py-3 px-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-1" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Resolved</h6>
                  <h3 className="mb-0" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
                    {enquiries.filter(e => e.status === 'Resolved').length}
                  </h3>
                </div>
                <div style={{ opacity: '0.3' }}>
                  <i className="fas fa-check-circle fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">
              <i className="bi bi-envelope me-2"></i>
              Enquiry Details
            </h4>
          </div>
          <button 
            className="btn btn-light btn-sm" 
            onClick={loadEnquiries}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="card-body">
          {/* Search Bar */}
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by Name, Email, Project Name, or Phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          {/* Enquiries Table */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading enquiries...</p>
            </div>
          ) : (
            <Table striped bordered hover responsive style={{ fontSize: '0.875rem' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '10%' }}>Name</th>
                  <th style={{ width: '13%' }}>Email</th>
                  <th style={{ width: '11%' }}>Project Name</th>
                  <th style={{ width: '9%' }}>Phone No</th>
                  <th style={{ width: '15%' }}>Message</th>
                  <th style={{ width: '9%' }}>Enquiry Date</th>
                  <th style={{ width: '9%' }}>Created Date</th>
                  <th style={{ width: '8%' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      {searchTerm ? 'No enquiries found matching your search.' : 'No enquiries available.'}
                    </td>
                  </tr>
                ) : (
                  filteredEnquiries.map((enq) => (
                    <tr key={enq._id}>
                      <td>
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none"
                          onClick={() => handleNameClick(enq)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          {enq.name}
                        </Button>
                      </td>
                      <td>{enq.email || '-'}</td>
                      <td>{enq.projectname || '-'}</td>
                      <td>{enq.phoneno || '-'}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {enq.message || '-'}
                      </td>
                      <td>{enq.enquirydate ? new Date(enq.enquirydate).toLocaleDateString() : '-'}</td>
                      <td>{enq.createddate ? new Date(enq.createddate).toLocaleDateString() : '-'}</td>
                      <td>{getStatusBadge(enq.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      <Modal show={showResolutionModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Update Resolution Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEnquiry && (
            <>
              <div className="mb-3 p-3 bg-light rounded">
                <h6 className="mb-2">Enquiry Information</h6>
                <Row>
                  <Col md={6}>
                    <p className="mb-1"><strong>Name:</strong> {selectedEnquiry.name}</p>
                    <p className="mb-1"><strong>Email:</strong> {selectedEnquiry.email}</p>
                    <p className="mb-1"><strong>Phone:</strong> {selectedEnquiry.phoneno}</p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1"><strong>Project:</strong> {selectedEnquiry.projectname}</p>
                    <p className="mb-1"><strong>Enquiry Date:</strong> {selectedEnquiry.enquirydate ? new Date(selectedEnquiry.enquirydate).toLocaleDateString() : 'N/A'}</p>
                  </Col>
                </Row>
                <p className="mb-0 mt-2"><strong>Message:</strong> {selectedEnquiry.message}</p>
              </div>

              <Form onSubmit={handleResolutionSubmit}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="status"
                        value={resolutionData.status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="New">New</option>
                        <option value="In-progress">In-progress</option>
                        <option value="Resolved">Resolved</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Resolved By <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="resolved_by"
                        value={resolutionData.resolved_by}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Resolution Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        name="resolutionDate"
                        value={resolutionData.resolutionDate}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Resolution Notes <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="resolution_notes"
                    value={resolutionData.resolution_notes}
                    onChange={handleInputChange}
                    placeholder="Enter resolution details..."
                    required
                  />
                </Form.Group>

                <div className="d-flex justify-content-end gap-2">
                  <Button variant="secondary" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Update Resolution
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default EnquiryDetails;
