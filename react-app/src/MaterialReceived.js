import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Alert, Badge, InputGroup } from 'react-bootstrap';

const MaterialReceived = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [grns, setGrns] = useState([]);
  const [filteredGrns, setFilteredGrns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    _id: '',
    grnNumber: '',
    grnDate: '',
    poNumber: '',
    supplierName: '',
    receivedBy: '',
    vehicleNumber: '',
    driverName: '',
    driverContact: '',
    invoiceNumber: '',
    invoiceDate: '',
    remarks: '',
    status: 'Pending',
    items: []
  });

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  useEffect(() => {
    if (viewMode === 'list') {
      loadGrns();
    }
  }, [viewMode]);

  useEffect(() => {
    // Filter GRNs based on search term
    if (searchTerm.trim() === '') {
      setFilteredGrns(grns);
    } else {
      const filtered = grns.filter(grn => 
        grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGrns(filtered);
    }
  }, [searchTerm, grns]);

  const loadGrns = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/MaterialReceived`);
      if (response.ok) {
        const data = await response.json();
        setGrns(data);
        setFilteredGrns(data);
      }
    } catch (error) {
      console.error('Error loading GRNs:', error);
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
        ? `${apiBaseUrl}/api/MaterialReceived/${formData._id}`
        : `${apiBaseUrl}/api/MaterialReceived`;
      
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
          message: editMode ? 'GRN updated successfully!' : 'GRN created successfully!' 
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
      grnNumber: '',
      grnDate: '',
      poNumber: '',
      supplierName: '',
      receivedBy: '',
      vehicleNumber: '',
      driverName: '',
      driverContact: '',
      invoiceNumber: '',
      invoiceDate: '',
      remarks: '',
      status: 'Pending',
      items: []
    });
    setEditMode(false);
  };

  const handleNewGrn = () => {
    handleReset();
    setViewMode('form');
  };

  const handleViewGrn = (grn) => {
    setFormData(grn);
    setEditMode(true);
    setViewMode('form');
  };

  const handleDelete = async (_id) => {
    if (!window.confirm('Are you sure you want to delete this GRN?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/MaterialReceived/${_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertMessage({ show: true, type: 'success', message: 'GRN deleted successfully!' });
        loadGrns();
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
      'Completed': 'success',
      'Partially Received': 'info',
      'Rejected': 'danger'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
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
        // List View - Display all GRNs
        <Card>
          <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-box-seam me-2"></i>
                Material Received Notes (GRN)
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                View and manage all material receipts
              </p>
            </div>
            <Button variant="light" onClick={handleNewGrn}>
              <i className="bi bi-plus-circle me-2"></i>New GRN
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
                    placeholder="Search by GRN Number, PO Number, Supplier Name, or Invoice Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* GRN Table */}
            <Table striped bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '12%' }}>GRN Number</th>
                  <th style={{ width: '10%' }}>GRN Date</th>
                  <th style={{ width: '12%' }}>PO Number</th>
                  <th style={{ width: '15%' }}>Supplier Name</th>
                  <th style={{ width: '12%' }}>Invoice Number</th>
                  <th style={{ width: '10%' }}>Invoice Date</th>
                  <th style={{ width: '10%' }}>Received By</th>
                  <th style={{ width: '8%' }}>Status</th>
                  <th style={{ width: '11%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrns.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      {searchTerm ? 'No GRNs found matching your search.' : 'No GRNs available. Click "New GRN" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredGrns.map((grn) => (
                    <tr key={grn._id}>
                      <td>{grn.grnNumber}</td>
                      <td>{grn.grnDate ? new Date(grn.grnDate).toLocaleDateString() : ''}</td>
                      <td>{grn.poNumber}</td>
                      <td>{grn.supplierName}</td>
                      <td>{grn.invoiceNumber}</td>
                      <td>{grn.invoiceDate ? new Date(grn.invoiceDate).toLocaleDateString() : ''}</td>
                      <td>{grn.receivedBy}</td>
                      <td>{getStatusBadge(grn.status)}</td>
                      <td>
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewGrn(grn)}
                        >
                          <i className="bi bi-eye me-1"></i>View
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDelete(grn._id)}
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
        // Form View - Create/Edit GRN
        <Card>
          <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-box-seam me-2"></i>
                {editMode ? 'Edit Material Received Note' : 'New Material Received Note'}
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                Record and track material receipts from suppliers at construction sites
              </p>
            </div>
            <Button variant="light" onClick={() => setViewMode('list')}>
              <i className="bi bi-arrow-left me-2"></i>Back to List
            </Button>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
            {/* GRN Header Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Receipt Details</h5>
              <Row>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>GRN Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="grnNumber"
                      value={formData.grnNumber}
                      onChange={handleInputChange}
                      placeholder="Enter GRN number (e.g., GRN-2024-001)"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>GRN Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="grnDate"
                      value={formData.grnDate}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>PO Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="poNumber"
                      value={formData.poNumber}
                      onChange={handleInputChange}
                      placeholder="Reference PO number"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Received By <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="receivedBy"
                      value={formData.receivedBy}
                      onChange={handleInputChange}
                      placeholder="Name of receiving person"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Partially Received">Partially Received</option>
                      <option value="Rejected">Rejected</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Supplier & Invoice Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Supplier & Invoice Information</h5>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Supplier Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="supplierName"
                      value={formData.supplierName}
                      onChange={handleInputChange}
                      placeholder="Enter supplier name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Invoice Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleInputChange}
                      placeholder="Enter invoice number"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Invoice Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="invoiceDate"
                      value={formData.invoiceDate}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Transport Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Transport Details</h5>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vehicle Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleInputChange}
                      placeholder="Enter vehicle registration number"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Driver Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="driverName"
                      value={formData.driverName}
                      onChange={handleInputChange}
                      placeholder="Enter driver name"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Driver Contact Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="driverContact"
                      value={formData.driverContact}
                      onChange={handleInputChange}
                      placeholder="Enter driver contact number"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Materials Received */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Materials Received</h5>
              <Table striped bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '15%' }}>Item Code</th>
                    <th style={{ width: '25%' }}>Item Description</th>
                    <th style={{ width: '10%' }}>Unit</th>
                    <th style={{ width: '10%' }}>Ordered Qty</th>
                    <th style={{ width: '10%' }}>Received Qty</th>
                    <th style={{ width: '10%' }}>Accepted Qty</th>
                    <th style={{ width: '10%' }}>Rejected Qty</th>
                    <th style={{ width: '5%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      Click "Add Item" button to record received materials
                    </td>
                  </tr>
                </tbody>
              </Table>
              <Button variant="outline-success" size="sm">
                <i className="bi bi-plus-circle me-2"></i>Add Item
              </Button>
            </div>

            {/* Remarks */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Quality Check & Remarks</h5>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Quality Inspection Notes / Remarks</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="Enter quality check results, damages observed, storage location, or any other relevant notes"
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
              <Button variant="success" type="submit">
                <i className="bi bi-save me-2"></i>{editMode ? 'Update' : 'Save'} GRN
              </Button>
            </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default MaterialReceived;
