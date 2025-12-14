import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Alert, Badge, InputGroup } from 'react-bootstrap';

const StoreRequisition = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [requisitions, setRequisitions] = useState([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    _id: '',
    requisitionNumber: '',
    requisitionDate: '',
    requestedBy: '',
    department: '',
    projectName: '',
    projectCode: '',
    requiredDate: '',
    purpose: '',
    priority: '',
    remarks: '',
    status: 'Pending',
    items: []
  });

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  useEffect(() => {
    if (viewMode === 'list') {
      loadRequisitions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    // Filter requisitions based on search term
    if (searchTerm.trim() === '') {
      setFilteredRequisitions(requisitions);
    } else {
      const filtered = requisitions.filter(req => 
        req.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.projectCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRequisitions(filtered);
    }
  }, [searchTerm, requisitions]);

  const loadRequisitions = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/StoreRequisition`);
      if (response.ok) {
        const data = await response.json();
        setRequisitions(data);
        setFilteredRequisitions(data);
      }
    } catch (error) {
      console.error('Error loading requisitions:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editMode 
        ? `${apiBaseUrl}/api/StoreRequisition/${formData._id}`
        : `${apiBaseUrl}/api/StoreRequisition`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setAlertMessage({ 
          show: true, 
          type: 'success', 
          message: editMode ? 'Requisition updated successfully!' : 'Requisition created successfully!' 
        });
        handleReset();
        setTimeout(() => {
          setViewMode('list');
        }, 1500);
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to save: ${errorData}` });
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
  };

  const handleReset = () => {
    setFormData({
      _id: '',
      requisitionNumber: '',
      requisitionDate: '',
      requestedBy: '',
      department: '',
      projectName: '',
      projectCode: '',
      requiredDate: '',
      purpose: '',
      priority: '',
      remarks: '',
      status: 'Pending',
      items: []
    });
    setEditMode(false);
  };

  const handleNewRequisition = () => {
    handleReset();
    setViewMode('form');
  };

  const handleViewRequisition = (req) => {
    setFormData(req);
    setEditMode(true);
    setViewMode('form');
  };

  const handleDelete = async (_id) => {
    if (!window.confirm('Are you sure you want to delete this Requisition?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/StoreRequisition/${_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertMessage({ show: true, type: 'success', message: 'Requisition deleted successfully!' });
        loadRequisitions();
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to delete: ${errorData}` });
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'danger',
      'Issued': 'info',
      'Completed': 'primary'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      'Low': 'secondary',
      'Normal': 'info',
      'High': 'warning',
      'Urgent': 'danger'
    };
    return <Badge bg={priorityColors[priority] || 'secondary'}>{priority}</Badge>;
  };

  return (
    <Container fluid className="mt-3">
      {alertMessage.show && (
        <Alert 
          variant={alertMessage.type} 
          onClose={() => setAlertMessage({ show: false, type: '', message: '' })} 
          dismissible
        >
          {alertMessage.message}
        </Alert>
      )}

      {viewMode === 'list' ? (
        // List View - Display all requisitions
        <Card>
          <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-clipboard-check me-2"></i>
                Store Requisitions
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                View and manage all material requisitions
              </p>
            </div>
            <Button variant="light" onClick={handleNewRequisition}>
              <i className="bi bi-plus-circle me-2"></i>New Requisition
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
                    placeholder="Search by Requisition Number, Requested By, Project Name, or Project Code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* Requisitions Table */}
            <Table striped bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '12%' }}>Req. Number</th>
                  <th style={{ width: '10%' }}>Req. Date</th>
                  <th style={{ width: '12%' }}>Requested By</th>
                  <th style={{ width: '10%' }}>Department</th>
                  <th style={{ width: '15%' }}>Project Name</th>
                  <th style={{ width: '10%' }}>Required Date</th>
                  <th style={{ width: '8%' }}>Priority</th>
                  <th style={{ width: '8%' }}>Status</th>
                  <th style={{ width: '12%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequisitions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      {searchTerm ? 'No requisitions found matching your search.' : 'No requisitions available. Click "New Requisition" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredRequisitions.map((req) => (
                    <tr key={req._id}>
                      <td>{req.requisitionNumber}</td>
                      <td>{req.requisitionDate ? new Date(req.requisitionDate).toLocaleDateString() : ''}</td>
                      <td>{req.requestedBy}</td>
                      <td>{req.department}</td>
                      <td>{req.projectName}</td>
                      <td>{req.requiredDate ? new Date(req.requiredDate).toLocaleDateString() : ''}</td>
                      <td>{getPriorityBadge(req.priority)}</td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td>
                        <Button 
                          variant="info" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewRequisition(req)}
                        >
                          <i className="bi bi-eye me-1"></i>View
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDelete(req._id)}
                        >
                          <i className="bi bi-trash me-1"></i>Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        // Form View - Create/Edit requisition
        <Card>
          <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-clipboard-check me-2"></i>
                {editMode ? 'Edit Store Requisition' : 'New Store Requisition'}
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                Request materials from store/warehouse for construction site requirements
              </p>
            </div>
            <Button variant="light" onClick={() => setViewMode('list')}>
              <i className="bi bi-arrow-left me-2"></i>Back to List
            </Button>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
            {/* Requisition Header */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Requisition Details</h5>
              <Row>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Requisition Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="requisitionNumber"
                      value={formData.requisitionNumber}
                      onChange={handleInputChange}
                      placeholder="Enter requisition no. (e.g., REQ-2024-001)"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Requisition Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="requisitionDate"
                      value={formData.requisitionDate}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Required Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="requiredDate"
                      value={formData.requiredDate}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Priority <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select priority</option>
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Issued">Issued</option>
                      <option value="Completed">Completed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Requester Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Requester Information</h5>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Requested By <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="requestedBy"
                      value={formData.requestedBy}
                      onChange={handleInputChange}
                      placeholder="Enter name of requester"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Department <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select department</option>
                      <option value="Civil">Civil Works</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Finishing">Finishing</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Painting">Painting</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Purpose of Requisition <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      placeholder="Enter purpose (e.g., Foundation work)"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Project Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Project Information</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Project Code <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="projectCode"
                      value={formData.projectCode}
                      onChange={handleInputChange}
                      placeholder="Enter project code"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Project Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      placeholder="Enter project name"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Materials Required */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Materials Required</h5>
              <Table striped bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '15%' }}>Item Code</th>
                    <th style={{ width: '30%' }}>Item Description</th>
                    <th style={{ width: '10%' }}>Unit</th>
                    <th style={{ width: '12%' }}>Requested Qty</th>
                    <th style={{ width: '12%' }}>Available Stock</th>
                    <th style={{ width: '11%' }}>Approved Qty</th>
                    <th style={{ width: '5%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      Click "Add Item" button to add materials to this requisition
                    </td>
                  </tr>
                </tbody>
              </Table>
              <Button variant="outline-info" size="sm">
                <i className="bi bi-plus-circle me-2"></i>Add Item
              </Button>
            </div>

            {/* Approval Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Additional Information</h5>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Remarks / Special Instructions</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="Enter any special instructions, quality requirements, or additional notes"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" type="button" onClick={handleReset}>
                <i className="bi bi-x-circle me-2"></i>Reset
              </Button>
              <Button variant="info" type="submit">
                <i className="bi bi-save me-2"></i>{editMode ? 'Update' : 'Submit'} Requisition
              </Button>
            </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default StoreRequisition;
