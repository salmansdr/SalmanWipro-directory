import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Table, Modal, Badge } from 'react-bootstrap';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [userForm, setUserForm] = useState({
    id: null,
    username: '',
    email: '',
    fullName: '',
    roleId: '',
    phone: '',
    status: 'active',
    password: '',
    confirmPassword: '',
    useSso: false,
    companyIds: []
  });

  // Load users, roles, and companies from API on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/RoleManagement`);
        if (response.ok) {
          const data = await response.json();
          setRoles(data);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    
    const loadCompanies = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/CompanySetup`);
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      }
    };
    
    const loadUsers = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/Usermaster`);
        if (response.ok) {
          const data = await response.json();
          // Map role names from roleId
          const usersWithRoleNames = data.map(user => ({
            ...user,
            roleName: user.roleId?.name || roles.find(r => r._id === user.roleId)?.name || 'N/A'
          }));
          setUsers(usersWithRoleNames);
        } else {
          console.warn('API not available, using empty state');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        showAlertMessage('Error loading users: ' + error.message, 'danger');
        setUsers([]);
      }
    };
    
    loadRoles();
    loadCompanies();
    loadUsers();
  }, [apiBaseUrl, roles]);



  const showAlertMessage = (message, variant = 'success') => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCompanySelection = (companyId) => {
    setUserForm(prev => {
      const currentIds = prev.companyIds || [];
      const isSelected = currentIds.includes(companyId);
      
      return {
        ...prev,
        companyIds: isSelected
          ? currentIds.filter(id => id !== companyId)
          : [...currentIds, companyId]
      };
    });
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      // Extract company IDs from companies array if it contains objects
      const companyIds = user.companies 
        ? user.companies.map(c => typeof c === 'string' ? c : c._id)
        : (user.companyIds || []);
      
      setUserForm({
        ...user,
        roleId: user.roleId?._id || user.roleId || '',
        companyIds: companyIds
      });
    } else {
      setEditingUser(null);
      setUserForm({
        id: null,
        username: '',
        email: '',
        fullName: '',
        roleId: '',
        phone: '',
        status: 'active',
        password: '',
        confirmPassword: '',
        useSso: false,
        companyIds: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setUserForm({
      id: null,
      username: '',
      email: '',
      fullName: '',
      roleId: '',
      phone: '',
      status: 'active',
      password: '',
      confirmPassword: '',
      useSso: false,
      companyIds: []
    });
  };

  const validateForm = () => {
    if (!userForm.username || !userForm.email || !userForm.fullName) {
      showAlertMessage('Please fill in all required fields', 'danger');
      return false;
    }

    if (!userForm.roleId) {
      showAlertMessage('Please select a role', 'danger');
      return false;
    }

    if (!userForm.email.includes('@')) {
      showAlertMessage('Please enter a valid email address', 'danger');
      return false;
    }

    // Check for duplicate username (except when editing same user)
    const existingUser = users.find(user => 
      user.username === userForm.username && user.id !== userForm.id
    );
    if (existingUser) {
      showAlertMessage('Username already exists', 'danger');
      return false;
    }

    // Check for duplicate email (except when editing same user)
    const existingEmail = users.find(user => 
      user.email === userForm.email && user.id !== userForm.id
    );
    if (existingEmail) {
      showAlertMessage('Email already exists', 'danger');
      return false;
    }

    // Password validation for new users only (skip if SSO is enabled)
    if (!editingUser && !userForm.useSso) {
      if (!userForm.password) {
        showAlertMessage('Password is required for new users', 'danger');
        return false;
      }
      if (userForm.password !== userForm.confirmPassword) {
        showAlertMessage('Passwords do not match', 'danger');
        return false;
      }
      if (userForm.password.length < 6) {
        showAlertMessage('Password must be at least 6 characters long', 'danger');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        username: userForm.username,
        email: userForm.email,
        fullName: userForm.fullName,
        roleId: userForm.roleId,
        phone: userForm.phone,
        status: userForm.status,
        useSso: userForm.useSso || false,
        companyIds: userForm.companyIds || []
      };
      
      // Include password only when SSO is not enabled
      // If SSO is enabled, explicitly set password to empty string to clear it
      if (userForm.useSso) {
        payload.password = '';
      } else if (!editingUser && userForm.password) {
        payload.password = userForm.password;
      }
      
      
      let response;
      if (editingUser) {
        // PUT for update
       
        response = await fetch(`${apiBaseUrl}/api/Usermaster/${editingUser._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // POST for new user
       
        response = await fetch(`${apiBaseUrl}/api/Usermaster`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

     
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        throw new Error(errorData.message || `Failed to save user (${response.status})`);
      }

      const savedUser = await response.json();
      
      
      // Update local state
      if (editingUser) {
        setUsers(users.map(u => u._id === savedUser._id ? savedUser : u));
        showAlertMessage('User updated successfully!', 'success');
      } else {
        setUsers([...users, savedUser]);
        showAlertMessage('User created successfully!', 'success');
      }

      closeModal();
    } catch (error) {
      
      showAlertMessage('Error saving user: ' + error.message, 'danger');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/Usermaster/${userId}/deactivate`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to deactivate user');
        }

        const updatedUser = await response.json();
        setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
        showAlertMessage('User deactivated successfully!', 'success');
      } catch (error) {
        showAlertMessage('Error deactivating user: ' + error.message, 'danger');
      }
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const endpoint = currentStatus === 'active' ? 'deactivate' : 'activate';
      const response = await fetch(`${apiBaseUrl}/api/Usermaster/${userId}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
      showAlertMessage('User status updated successfully!', 'success');
    } catch (error) {
      showAlertMessage('Error updating user status: ' + error.message, 'danger');
    }
  };

  

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <Card className="shadow">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-users me-2"></i>
                User Management
              </h4>
              <div className="d-flex gap-2">
                
                <Button variant="success" size="sm" onClick={() => openModal()}>
                  <i className="fas fa-plus me-2"></i>
                  Add User
                </Button>
              </div>
            </Card.Header>

            <Card.Body>
              {/* Users Statistics */}
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="bg-primary text-white">
                    <Card.Body className="text-center">
                      <h4>{users.length}</h4>
                      <small>Total Users</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="bg-success text-white">
                    <Card.Body className="text-center">
                      <h4>{users.filter(u => u.status === 'active').length}</h4>
                      <small>Active Users</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="bg-warning text-white">
                    <Card.Body className="text-center">
                      <h4>{users.filter(u => u.roleName?.toLowerCase().includes('admin')).length}</h4>
                      <small>Administrators</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="bg-info text-white">
                    <Card.Body className="text-center">
                      <h4>{users.filter(u => u.status === 'inactive').length}</h4>
                      <small>Inactive Users</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Users Table */}
              <div className="table-responsive">
                <Table striped hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Companies</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.username}</strong>
                        </td>
                        <td>{user.fullName}</td>
                        <td>
                          <a href={`mailto:${user.email}`}>{user.email}</a>
                        </td>
                        <td>
                          <Badge bg="primary">
                            {user.roleName || 'N/A'}
                          </Badge>
                        </td>
                        <td>
                          {user.companies && user.companies.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {user.companies.map((company, idx) => (
                                <Badge key={idx} bg="info" className="me-1">
                                  {company.companyName || company.companyCode || company}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">No companies</span>
                          )}
                        </td>
                        <td>
                          <Badge bg={user.status === 'active' ? 'success' : 'danger'}>
                            {user.status}
                          </Badge>
                        </td>
                        <td>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => openModal(user)}
                              title="Edit User"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button 
                              variant={user.status === 'active' ? 'outline-warning' : 'outline-success'} 
                              size="sm" 
                              onClick={() => handleStatusToggle(user._id, user.status)}
                              title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              <i className={`fas fa-${user.status === 'active' ? 'pause' : 'play'}`}></i>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete(user._id)}
                              title="Delete User"
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {users.length === 0 && (
                <div className="text-center py-4">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No users found</h5>
                  <p className="text-muted">Click "Add User" to create your first user</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-user me-2"></i>
            {editingUser ? 'Edit User' : 'Add New User'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Alert Message in Modal */}
            {showAlert && (
              <Alert 
                variant={alertVariant} 
                dismissible 
                onClose={() => setShowAlert(false)}
                className="mb-3"
              >
                {alertMessage}
              </Alert>
            )}

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={userForm.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={userForm.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={userForm.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={userForm.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Role <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="roleId"
                    value={userForm.roleId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={userForm.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Companies</Form.Label>
                  <div style={{ 
                    border: '1px solid #ced4da', 
                    borderRadius: '0.375rem', 
                    padding: '10px', 
                    maxHeight: '150px', 
                    overflowY: 'auto' 
                  }}>
                    {companies.length === 0 ? (
                      <div className="text-muted text-center py-2">No companies available</div>
                    ) : (
                      companies.map(company => (
                        <Form.Check
                          key={company._id}
                          type="checkbox"
                          id={`company-${company._id}`}
                          label={company.companyName}
                          checked={userForm.companyIds?.includes(company._id) || false}
                          onChange={() => handleCompanySelection(company._id)}
                          className="mb-2"
                        />
                      ))
                    )}
                  </div>
                  <Form.Text className="text-muted">
                    Select the companies this user can access
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Authentication Method - always display */}
            <hr />
            <h6>Authentication Method</h6>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    label="Enable Single Sign-On (SSO) - User will login with Google/Microsoft account"
                    name="useSso"
                    checked={userForm.useSso}
                    onChange={(e) => setUserForm(prev => ({ ...prev, useSso: e.target.checked }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Password fields - only shown when SSO is not enabled */}
            {!userForm.useSso && (
                  <>
                    <h6>Password</h6>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>
                            Password <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={userForm.password}
                            onChange={handleInputChange}
                            placeholder="Enter password"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>
                            Confirm Password <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={userForm.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm password"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <i className="fas fa-save me-2"></i>
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;