import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Table, Modal, Badge } from 'react-bootstrap';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');

  const [userForm, setUserForm] = useState({
    id: null,
    username: '',
    email: '',
    fullName: '',
    role: 'user',
    department: '',
    phone: '',
    status: 'active',
    password: '',
    confirmPassword: ''
  });

  // Available roles
  const roles = [
    { value: 'admin', label: 'Administrator', color: 'danger' },
    { value: 'manager', label: 'Manager', color: 'warning' },
    { value: 'user', label: 'User', color: 'primary' },
    { value: 'readonly', label: 'Read Only', color: 'secondary' }
  ];

  // Available departments
  const departments = [
    'Engineering',
    'Construction',
    'Project Management',
    'Finance',
    'Human Resources',
    'Quality Assurance',
    'Safety',
    'Procurement'
  ];

  // Load users from localStorage on component mount
  useEffect(() => {
    const loadUsers = () => {
      try {
        const savedUsers = localStorage.getItem('userManagement');
        if (savedUsers) {
          setUsers(JSON.parse(savedUsers));
        } else {
          // Initialize with default admin user
          const defaultUsers = [
            {
              id: 1,
              username: 'salmansdr',
            email: 'salman@buildpro.com',
            fullName: 'Salman SDR',
            role: 'admin',
            department: 'Engineering',
            phone: '+91-9874592300',
            status: 'active',
            createdDate: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          }
        ];
        setUsers(defaultUsers);
        localStorage.setItem('userManagement', JSON.stringify(defaultUsers));
      }
    } catch (error) {
      showAlertMessage('Error loading users: ' + error.message, 'danger');
      }
    };
    loadUsers();
  }, []);

  const saveUsers = (updatedUsers) => {
    try {
      localStorage.setItem('userManagement', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    } catch (error) {
      showAlertMessage('Error saving users: ' + error.message, 'danger');
    }
  };

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

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        ...user,
        password: '',
        confirmPassword: ''
      });
    } else {
      setEditingUser(null);
      setUserForm({
        id: null,
        username: '',
        email: '',
        fullName: '',
        role: 'user',
        department: '',
        phone: '',
        status: 'active',
        password: '',
        confirmPassword: ''
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
      role: 'user',
      department: '',
      phone: '',
      status: 'active',
      password: '',
      confirmPassword: ''
    });
  };

  const validateForm = () => {
    if (!userForm.username || !userForm.email || !userForm.fullName) {
      showAlertMessage('Please fill in all required fields', 'danger');
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

    // Password validation for new users
    if (!editingUser && !userForm.password) {
      showAlertMessage('Password is required for new users', 'danger');
      return false;
    }

    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      showAlertMessage('Passwords do not match', 'danger');
      return false;
    }

    if (userForm.password && userForm.password.length < 6) {
      showAlertMessage('Password must be at least 6 characters long', 'danger');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let updatedUsers;
      
      if (editingUser) {
        // Update existing user
        updatedUsers = users.map(user => 
          user.id === editingUser.id 
            ? { 
                ...user, 
                ...userForm, 
                modifiedDate: new Date().toISOString(),
                modifiedBy: localStorage.getItem('currentUser') || 'System'
              }
            : user
        );
        showAlertMessage('User updated successfully!', 'success');
      } else {
        // Add new user
        const newUser = {
          ...userForm,
          id: Date.now(), // Simple ID generation
          createdDate: new Date().toISOString(),
          createdBy: localStorage.getItem('currentUser') || 'System',
          lastLogin: null
        };
        updatedUsers = [...users, newUser];
        showAlertMessage('User created successfully!', 'success');
      }

      saveUsers(updatedUsers);
      closeModal();
    } catch (error) {
      showAlertMessage('Error saving user: ' + error.message, 'danger');
    }
  };

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const updatedUsers = users.filter(user => user.id !== userId);
        saveUsers(updatedUsers);
        showAlertMessage('User deleted successfully!', 'success');
      } catch (error) {
        showAlertMessage('Error deleting user: ' + error.message, 'danger');
      }
    }
  };

  const handleStatusToggle = (userId) => {
    try {
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              status: user.status === 'active' ? 'inactive' : 'active',
              modifiedDate: new Date().toISOString(),
              modifiedBy: localStorage.getItem('currentUser') || 'System'
            }
          : user
      );
      saveUsers(updatedUsers);
      showAlertMessage('User status updated successfully!', 'success');
    } catch (error) {
      showAlertMessage('Error updating user status: ' + error.message, 'danger');
    }
  };

  const getRoleBadgeVariant = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.color : 'secondary';
  };

  const exportUsers = () => {
    try {
      const dataStr = JSON.stringify(users, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      showAlertMessage('Users exported successfully!', 'success');
    } catch (error) {
      showAlertMessage('Error exporting users: ' + error.message, 'danger');
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
                <Button variant="light" size="sm" onClick={exportUsers}>
                  <i className="fas fa-download me-2"></i>
                  Export
                </Button>
                <Button variant="success" size="sm" onClick={() => openModal()}>
                  <i className="fas fa-plus me-2"></i>
                  Add User
                </Button>
              </div>
            </Card.Header>

            <Card.Body>
              {showAlert && (
                <Alert variant={alertVariant} dismissible onClose={() => setShowAlert(false)}>
                  {alertMessage}
                </Alert>
              )}

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
                      <h4>{users.filter(u => u.role === 'admin').length}</h4>
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
                      <th>Department</th>
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
                          <Badge bg={getRoleBadgeVariant(user.role)}>
                            {roles.find(r => r.value === user.role)?.label || user.role}
                          </Badge>
                        </td>
                        <td>{user.department}</td>
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
                              onClick={() => handleStatusToggle(user.id)}
                              title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              <i className={`fas fa-${user.status === 'active' ? 'pause' : 'play'}`}></i>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete(user.id)}
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
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    name="role"
                    value={userForm.role}
                    onChange={handleInputChange}
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    name="department"
                    value={userForm.department}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
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

            {/* Password fields */}
            <hr />
            <h6>Password {editingUser ? '(Leave blank to keep current password)' : ''}</h6>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Password {!editingUser && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required={!editingUser}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Confirm Password {!editingUser && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={userForm.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    required={!editingUser}
                  />
                </Form.Group>
              </Col>
            </Row>
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