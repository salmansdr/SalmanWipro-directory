import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Table, InputGroup } from 'react-bootstrap';

const SupplierMaster = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    supplierCode: '',
    supplierName: '',
    contactPerson: '',
    mobileNumber: '',
    email: '',
    address: '',
    isActive: true
  });
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  useEffect(() => {
    loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Filter suppliers based on search term
    if (searchTerm.trim() === '') {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier => 
        supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchTerm, suppliers]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/Supplier`);
      if (response.ok) {
        const data = await response.json();
        console.log('Suppliers loaded:', data);
        setSuppliers(data);
        setFilteredSuppliers(data);
      } else {
        setAlertMessage({ show: true, type: 'danger', message: 'Failed to load suppliers' });
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

  const handleNewSupplier = () => {
    setFormData({
      _id: '',
      supplierCode: '',
      supplierName: '',
      contactPerson: '',
      mobileNumber: '',
      email: '',
      address: '',
      isActive: true
    });
    setEditMode(false);
    setViewMode('form');
  };

  const handleEdit = (supplier) => {
    setFormData(supplier);
    setEditMode(true);
    setViewMode('form');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validation
    if (!formData.supplierCode || !formData.supplierName || !formData.mobileNumber) {
      setAlertMessage({ show: true, type: 'danger', message: 'Please fill required fields: Supplier Code, Name, and Mobile Number' });
      return;
    }

    try {
      const url = editMode 
        ? `${apiBaseUrl}/api/Supplier/${formData._id}` 
        : `${apiBaseUrl}/api/Supplier`;
      
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
          message: editMode ? 'Supplier updated successfully!' : 'Supplier added successfully!' 
        });
        
        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        
        loadSuppliers();
        
        // If adding a new supplier, ask if user wants to add another
        if (!editMode) {
          const addAnother = window.confirm('Supplier added successfully! Do you want to add another supplier?');
          if (addAnother) {
            // Reset form for new entry
            setFormData({
              supplierCode: '',
              supplierName: '',
              mobileNumber: '',
              email: '',
              contactPerson: '',
              address: '',
              city: '',
              state: '',
              pincode: '',
              gst: '',
              panNumber: '',
              bankName: '',
              accountNumber: '',
              ifscCode: '',
              accountHolderName: '',
              isActive: true
            });
          } else {
            setViewMode('list');
          }
        } else {
          // For edit mode, just return to list
          setViewMode('list');
        }
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to save supplier: ${errorData}` });
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/Supplier/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertMessage({ show: true, type: 'success', message: 'Supplier deleted successfully!' });
        
        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        
        loadSuppliers();
      } else {
        setAlertMessage({ show: true, type: 'danger', message: 'Failed to delete supplier' });
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
  };

  return (
    <Container fluid className="mt-3">
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

      {viewMode === 'list' ? (
        // List View
        <Card>
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-people me-2"></i>
                Supplier Master
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                View and manage all suppliers
              </p>
            </div>
            <Button variant="light" onClick={handleNewSupplier}>
              <i className="bi bi-plus-circle me-2"></i>New Supplier
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
                    placeholder="Search by Supplier Code, Name, Mobile, or Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* Suppliers Table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading suppliers...</p>
              </div>
            ) : (
              <Table striped bordered hover responsive style={{ fontSize: '0.875rem' }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '12%' }}>Supplier Code</th>
                    <th style={{ width: '15%' }}>Supplier Name</th>
                    <th style={{ width: '13%' }}>Contact Person</th>
                    <th style={{ width: '11%' }}>Mobile</th>
                    <th style={{ width: '15%' }}>Email</th>
                    <th style={{ width: '18%' }}>Address</th>
                    <th style={{ width: '8%' }}>Status</th>
                    <th style={{ width: '8%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers available. Click "New Supplier" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <tr key={supplier._id}>
                        <td>{supplier.supplierCode}</td>
                        <td>{supplier.supplierName}</td>
                        <td>{supplier.contactPerson || '-'}</td>
                        <td>{supplier.mobileNumber}</td>
                        <td>{supplier.email || '-'}</td>
                        <td>{supplier.address || '-'}</td>
                        <td>
                          {supplier.isActive ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-secondary">Inactive</span>
                          )}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(supplier)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(supplier._id)}
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
                <i className="bi bi-people me-2"></i>
                {editMode ? 'Edit Supplier' : 'New Supplier'}
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                {editMode ? 'Update supplier information' : 'Create a new supplier'}
              </p>
            </div>
            <div>
              <Button variant="light" className="me-2" onClick={() => setViewMode('list')}>
                <i className="bi bi-arrow-left me-2"></i>Back to List
              </Button>
              <Button variant="success" onClick={handleSubmit}>
                <i className="bi bi-save me-2"></i>Save Supplier
              </Button>
            </div>
          </Card.Header>
          <Card.Body style={{ paddingBottom: '2rem' }}>
            <Form onSubmit={handleSubmit}>
              {/* Supplier Information */}
              <div className="mb-4">
                <h5 className="border-bottom pb-2 mb-3">Supplier Information</h5>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Supplier Code <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="supplierCode"
                        value={formData.supplierCode}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Supplier Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="supplierName"
                        value={formData.supplierName}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contact Person</Form.Label>
                      <Form.Control
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Contact Details */}
              <div className="mb-4">
                <h5 className="border-bottom pb-2 mb-3">Contact Details</h5>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mobile Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </Form.Group>
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

export default SupplierMaster;
