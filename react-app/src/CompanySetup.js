import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert, Modal } from 'react-bootstrap';

// API Base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5222';

/**
 * CompanySetup Component
 * 
 * MongoDB Logo Storage Options:
 * 
 * 1. Base64 String (Used here - Simple, included in JSON):
 *    - Store base64Data directly in document
 *    - Good for small images (<16MB)
 *    - Easy to retrieve and display
 * 
 * 2. MongoDB Binary Type (Server-side):
 *    const { Binary } = require('mongodb');
 *    logo: {
 *      fileName: "logo.png",
 *      fileType: "image/png",
 *      binaryData: new Binary(Buffer.from(base64Data.split(',')[1], 'base64'))
 *    }
 * 
 * 3. GridFS (For files >16MB):
 *    - Use GridFS bucket to store large files
 *    - Returns file ID to reference in document
 *    - Example: logoFileId: ObjectId("...")
 * 
 * 4. External Storage + URL (Recommended for production):
 *    - Upload to AWS S3, Cloudinary, etc.
 *    - Store only URL in MongoDB
 *    - Better performance and scalability
 */

const CompanySetup = () => {
  // Country and city data
  const countryData = {
    India: {
      currency: 'INR',
      cities: ['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow']
    },
    Bangladesh: {
      currency: 'BDT',
      cities: ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Barisal', 'Rangpur', 'Mymensingh']
    }
  };

  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyCode: '',
    address: '',
    country: '',
    city: '',
    zipCode: '',
    currency: '',
    contactPersonName: '',
    phone: '',
    email: '',
    website: '',
    // Invoicing Information
    taxId: '',
    gstNumber: '',
    panNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    // Branding
    themeColor: '#0d6efd',
    fontColor: '#000000',
    logo: null
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  const [companiesList, setCompaniesList] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Auto-load saved companies list on component mount
  React.useEffect(() => {
    loadCompaniesList();
  }, []);

  const loadCompaniesList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/CompanySetup`);
      if (response.ok) {
        const data = await response.json();
        setCompaniesList(data);
      } else {
        console.error('Failed to load companies:', response.statusText);
        setAlertVariant('warning');
        setAlertMessage('Failed to load companies from server');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error loading companies list:', error);
      setAlertVariant('danger');
      setAlertMessage('Error connecting to server');
      setShowAlert(true);
    }
  };

  const loadCompanyForEdit = (company) => {
    setShowAlert(false); // Clear any existing alerts
    setCompanyData({
      companyName: company.companyName || '',
      companyCode: company.companyCode || '',
      address: company.address?.street || company.address || '',
      country: company.address?.country || company.country || '',
      city: company.address?.city || company.city || '',
      zipCode: company.address?.zipCode || company.zipCode || '',
      currency: company.currency || '',
      contactPersonName: company.contact?.personName || company.contactPersonName || '',
      phone: company.contact?.phone || company.phone || '',
      email: company.contact?.email || company.email || '',
      website: company.contact?.website || company.website || '',
      taxId: company.invoicing?.taxId || company.taxId || '',
      gstNumber: company.invoicing?.gstNumber || company.gstNumber || '',
      panNumber: company.invoicing?.panNumber || company.panNumber || '',
      bankName: company.invoicing?.banking?.bankName || company.bankName || '',
      accountNumber: company.invoicing?.banking?.accountNumber || company.accountNumber || '',
      ifscCode: company.invoicing?.banking?.ifscCode || company.ifscCode || '',
      themeColor: company.branding?.themeColor || company.themeColor || '#0d6efd',
      fontColor: company.branding?.fontColor || company.fontColor || '#000000',
      logo: company.branding?.logo || company.logo || null
    });
    setIsEditMode(true);
    setEditingCompanyId(company._id || company.companyCode);
    setShowModal(true);
  };

  const deleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/CompanySetup/${companyId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Reload the companies list
          await loadCompaniesList();
          
          setAlertVariant('success');
          setAlertMessage('Company deleted successfully!');
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
        } else {
          const errorData = await response.json();
          setAlertVariant('danger');
          setAlertMessage(errorData.message || 'Failed to delete company');
          setShowAlert(true);
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        setAlertVariant('danger');
        setAlertMessage('Error deleting company: ' + error.message);
        setShowAlert(true);
      }
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAlert(false); // Clear any existing alerts
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowAlert(false); // Clear alerts when closing modal
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const resetForm = () => {
    setCompanyData({
      companyName: '',
      companyCode: '',
      address: '',
      country: '',
      city: '',
      zipCode: '',
      currency: '',
      contactPersonName: '',
      phone: '',
      email: '',
      website: '',
      taxId: '',
      gstNumber: '',
      panNumber: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      themeColor: '#0d6efd',
      fontColor: '#000000',
      logo: null
    });
    setIsEditMode(false);
    setEditingCompanyId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const currency = selectedCountry ? countryData[selectedCountry].currency : '';
    
    setCompanyData(prev => ({
      ...prev,
      country: selectedCountry,
      currency: currency,
      city: '' // Reset city when country changes
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setAlertVariant('warning');
        setAlertMessage('File size should not exceed 2MB');
        setShowAlert(true);
        return;
      }

      // Convert file to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyData(prev => ({
          ...prev,
          logo: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            base64Data: reader.result // This contains the base64 string with data URI prefix
          }
        }));
      };
      reader.onerror = () => {
        setAlertVariant('danger');
        setAlertMessage('Error reading file');
        setShowAlert(true);
      };
      reader.readAsDataURL(file); // Converts to base64
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!companyData.companyName || !companyData.companyCode || !companyData.email || !companyData.country) {
        setAlertVariant('danger');
        setAlertMessage('Please fill in all required fields (Company Name, Company Code, Country, Email)');
        setShowAlert(true);
        return;
      }

      // Prepare MongoDB-ready JSON structure
      const mongoDBDocument = {
        companyName: companyData.companyName,
        companyCode: companyData.companyCode,
        address: {
          street: companyData.address,
          city: companyData.city,
          zipCode: companyData.zipCode,
          country: companyData.country
        },
        currency: companyData.currency,
        contact: {
          personName: companyData.contactPersonName,
          phone: companyData.phone,
          email: companyData.email,
          website: companyData.website
        },
        invoicing: {
          taxId: companyData.taxId,
          gstNumber: companyData.gstNumber,
          panNumber: companyData.panNumber,
          banking: {
            bankName: companyData.bankName,
            accountNumber: companyData.accountNumber,
            ifscCode: companyData.ifscCode
          }
        },
        branding: {
          themeColor: companyData.themeColor,
          fontColor: companyData.fontColor,
          logo: companyData.logo ? {
            fileName: companyData.logo.fileName,
            fileType: companyData.logo.fileType,
            fileSize: companyData.logo.fileSize,
            base64Data: companyData.logo.base64Data,
          } : null
        }
      };

      let response;
      if (isEditMode) {
        // Update existing company using PUT
        response = await fetch(`${API_BASE_URL}/api/CompanySetup/${editingCompanyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mongoDBDocument)
        });
      } else {
        // Add new company using POST
        response = await fetch(`${API_BASE_URL}/api/CompanySetup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mongoDBDocument)
        });
      }

      if (response.ok) {
        const savedCompany = await response.json();
        
        // Log MongoDB structure to console
        console.log('MongoDB Document Structure:');
        console.log(JSON.stringify(savedCompany, null, 2));
        
        setAlertVariant('success');
        setAlertMessage(isEditMode 
          ? `Company "${companyData.companyName}" updated successfully!`
          : `Company "${companyData.companyName}" added successfully!`
        );
        setShowAlert(true);

        // Reload the companies list
        await loadCompaniesList();

        // Reset form after successful save
        setTimeout(() => {
          closeModal();
          setShowAlert(false);
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        setAlertVariant('danger');
        setAlertMessage(errorData.message || `Failed to ${isEditMode ? 'update' : 'save'} company`);
        setShowAlert(true);
        // Keep modal open to show error
      }

    } catch (error) {
      console.error('Error saving company:', error);
      setAlertVariant('danger');
      setAlertMessage('Error saving company: ' + error.message);
      setShowAlert(true);
      // Keep modal open to show error
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header with Title and Action Buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">
          <i className="fas fa-building me-2"></i>
          Company Management
        </h3>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => {
            // Export all companies
            const blob = new Blob([JSON.stringify(companiesList, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `all-companies-${new Date().getTime()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}>
            <i className="fas fa-download me-2"></i>
            Export
          </Button>
          <Button variant="success" onClick={openAddModal}>
            <i className="fas fa-plus me-2"></i>
            Add Company
          </Button>
        </div>
      </div>

      {/* Companies List Table */}
      {companiesList.length > 0 && (
        <Card className="shadow-sm mb-4">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th className="border-0 px-4 py-3">Company Name</th>
                    <th className="border-0 px-4 py-3">Code</th>
                    <th className="border-0 px-4 py-3">Country</th>
                    <th className="border-0 px-4 py-3">Email</th>
                    <th className="border-0 px-4 py-3">Currency</th>
                    <th className="border-0 px-4 py-3">Last Updated</th>
                    <th className="border-0 px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companiesList.map((company, index) => (
                    <tr key={company._id || company.companyCode || index}>
                      <td className="px-4 py-3">
                        <strong>{company.companyName}</strong>
                        {(company.address?.city || company.city) && (
                          <><br/><small className="text-muted">{company.address?.city || company.city}</small></>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-secondary">{company.companyCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        {company.address?.country || company.country}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${company.contact?.email || company.email}`} className="text-decoration-none">
                          {company.contact?.email || company.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-info text-dark">{company.currency}</span>
                      </td>
                      <td className="px-4 py-3">
                        <small className="text-muted">
                          {new Date(company.metadata?.lastUpdated).toLocaleDateString()}
                        </small>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => loadCompanyForEdit(company)}
                            title="Edit Company"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => deleteCompany(company._id || company.companyCode)}
                            title="Delete Company"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Company Form Modal */}
      <Modal show={showModal} onHide={closeModal} size="xl" backdrop="static" keyboard={false}>
        <Modal.Header closeButton className={`text-white ${isEditMode ? 'bg-warning' : 'bg-primary'}`}>
          <Modal.Title>
            <i className={`fas ${isEditMode ? 'fa-edit' : 'fa-plus'} me-2`}></i>
            {isEditMode ? `Edit Company: ${companyData.companyName}` : 'Add New Company'}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Alert inside modal */}
          {showAlert && (
            <Alert variant={alertVariant} dismissible onClose={() => setShowAlert(false)} className="mb-3">
              {alertMessage}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit} id="company-form">
            {/* Basic Company Information */}
            <Row className="mb-3">
              <Col>
                <h5 className="text-primary mb-3 border-bottom pb-2">
                  <i className="fas fa-building me-2"></i>
                  Basic Information
                </h5>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="companyName"
                    value={companyData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Company Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="companyCode"
                    value={companyData.companyCode}
                    onChange={handleInputChange}
                    placeholder="Enter company code"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Address Information */}
            <Row className="mb-3">
              <Col>
                <h5 className="text-primary mb-3 border-bottom pb-2">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Address Information
                </h5>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={companyData.address}
                    onChange={handleInputChange}
                    placeholder="Enter complete address"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Country <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="country"
                    value={companyData.country}
                    onChange={handleCountryChange}
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="India">India</option>
                    <option value="Bangladesh">Bangladesh</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Select
                    name="city"
                    value={companyData.city}
                    onChange={handleInputChange}
                    disabled={!companyData.country}
                  >
                    <option value="">Select City</option>
                    {companyData.country && countryData[companyData.country].cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </Form.Select>
                  {!companyData.country && (
                    <Form.Text className="text-muted">
                      <small>Select country first</small>
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>ZIP Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="zipCode"
                    value={companyData.zipCode}
                    onChange={handleInputChange}
                    placeholder="Enter ZIP code"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Currency</Form.Label>
                  <Form.Control
                    type="text"
                    name="currency"
                    value={companyData.currency}
                    readOnly
                    placeholder="Auto-filled"
                    className="bg-light"
                  />
                  <Form.Text className="text-muted">
                    <small>Based on country</small>
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Contact Information */}
            <Row className="mb-3">
              <Col>
                <h5 className="text-primary mb-3 border-bottom pb-2">
                  <i className="fas fa-phone me-2"></i>
                  Contact Information
                </h5>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Contact Person Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="contactPersonName"
                    value={companyData.contactPersonName}
                    onChange={handleInputChange}
                    placeholder="Enter contact person name"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={companyData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={companyData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="url"
                    name="website"
                    value={companyData.website}
                    onChange={handleInputChange}
                    placeholder="Enter website URL"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Invoicing Information */}
            <Row className="mb-3">
              <Col>
                <h5 className="text-primary mb-3 border-bottom pb-2">
                  <i className="fas fa-file-invoice me-2"></i>
                  Invoicing Information <small className="text-muted">(Optional)</small>
                </h5>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Tax ID / TIN</Form.Label>
                  <Form.Control
                    type="text"
                    name="taxId"
                    value={companyData.taxId}
                    onChange={handleInputChange}
                    placeholder="Enter tax identification number"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>GST Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="gstNumber"
                    value={companyData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="Enter GST number"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>PAN Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="panNumber"
                    value={companyData.panNumber}
                    onChange={handleInputChange}
                    placeholder="Enter PAN number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankName"
                    value={companyData.bankName}
                    onChange={handleInputChange}
                    placeholder="Enter bank name"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Account Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="accountNumber"
                    value={companyData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter account number"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>IFSC / Swift Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="ifscCode"
                    value={companyData.ifscCode}
                    onChange={handleInputChange}
                    placeholder="Enter IFSC/Swift code"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Company Logo */}
            <Row className="mb-3">
              <Col>
                <h5 className="text-primary mb-3 border-bottom pb-2">
                  <i className="fas fa-palette me-2"></i>
                  Branding
                </h5>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Upload Logo</Form.Label>
                  <Form.Control
                    type="file"
                    name="logo"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  <Form.Text className="text-muted">
                    Supported formats: JPG, PNG, GIF (Max size: 2MB)
                  </Form.Text>
                  {companyData.logo && (
                    <div className="mt-3">
                      <img 
                        src={companyData.logo.base64Data} 
                        alt="Company Logo Preview" 
                        style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                      />
                      <div className="mt-2">
                        <small className="text-muted">
                          {companyData.logo.fileName} ({(companyData.logo.fileSize / 1024).toFixed(2)} KB)
                        </small>
                      </div>
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Theme Color</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="color"
                      name="themeColor"
                      value={companyData.themeColor}
                      onChange={handleInputChange}
                      style={{ width: '60px', height: '38px' }}
                    />
                    <Form.Control
                      type="text"
                      name="themeColor"
                      value={companyData.themeColor}
                      onChange={handleInputChange}
                      placeholder="#0d6efd"
                    />
                  </div>
                  <Form.Text className="text-muted">
                    This color will be used for headers and branding elements
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Font Color</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="color"
                      name="fontColor"
                      value={companyData.fontColor}
                      onChange={handleInputChange}
                      style={{ width: '60px', height: '38px' }}
                    />
                    <Form.Control
                      type="text"
                      name="fontColor"
                      value={companyData.fontColor}
                      onChange={handleInputChange}
                      placeholder="#000000"
                    />
                  </div>
                  <Form.Text className="text-muted">
                    This color will be used for text in branding elements
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        
        <Modal.Footer>
          <div className="d-flex gap-2 w-100 justify-content-between">
            <Button 
              variant="outline-danger" 
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all fields?')) {
                  resetForm();
                }
              }}
            >
              <i className="fas fa-undo me-2"></i>
              Reset
            </Button>
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={closeModal}>
                <i className="fas fa-times me-2"></i>
                Cancel
              </Button>
              <Button 
                variant={isEditMode ? "warning" : "primary"} 
                type="submit"
                form="company-form"
              >
                <i className={`fas ${isEditMode ? 'fa-edit' : 'fa-save'} me-2`}></i>
                {isEditMode ? 'Update Company' : 'Add Company'}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CompanySetup;