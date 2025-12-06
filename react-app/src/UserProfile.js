import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Tab, Tabs } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  const [activeTab, setActiveTab] = useState('profile');
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Get current user from localStorage or session
  const [currentUser, setCurrentUser] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    roleName: '',
    roleDescription: '',
    useSso: false
  });

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Load current user data from localStorage or API
    const loadUserProfile = async () => {
      try {
        // You may need to adjust this based on how you store logged-in user data
        const userId = localStorage.getItem('userId');
        if (userId) {
          const response = await fetch(`${apiBaseUrl}/api/Usermaster/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            setProfileForm({
              fullName: userData.fullName || '',
              email: userData.email || '',
              phone: userData.phone || ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [apiBaseUrl]);

  const showAlertMessage = (message, variant = 'success') => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (!profileForm.fullName || !profileForm.email) {
      showAlertMessage('Please fill in all required fields', 'danger');
      return;
    }

    if (!profileForm.email.includes('@')) {
      showAlertMessage('Please enter a valid email address', 'danger');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const payload = {
        fullName: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone
      };

      const response = await fetch(`${apiBaseUrl}/api/Usermaster/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      showAlertMessage('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Profile update error:', error);
      showAlertMessage('Error updating profile: ' + error.message, 'danger');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showAlertMessage('Please fill in all password fields', 'danger');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showAlertMessage('New passwords do not match', 'danger');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showAlertMessage('New password must be at least 6 characters long', 'danger');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showAlertMessage('New password must be different from current password', 'danger');
      return;
    }

    try {
      
      const payload = {

       
        userId : localStorage.getItem('userId'),
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        updatedBy: localStorage.getItem('username') || 'system'
      };

      const response = await fetch(`${apiBaseUrl}/api/Usermaster/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to change password');
      }

      showAlertMessage('Password changed successfully!', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      showAlertMessage('Error changing password: ' + error.message, 'danger');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <Card className="shadow">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-user-circle me-2"></i>
                My Profile
              </h4>
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => navigate('/')}
                title="Close"
              >
                <i className="fas fa-times me-2"></i>
                Close
              </Button>
            </Card.Header>

            <Card.Body>
              {showAlert && (
                <Alert variant={alertVariant} dismissible onClose={() => setShowAlert(false)}>
                  {alertMessage}
                </Alert>
              )}

              {/* User Info Summary */}
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="bg-light">
                    <Card.Body>
                      <Row>
                        <Col md={3} className="text-center">
                          <div className="mb-2">
                            <i className="fas fa-user-circle fa-5x text-primary"></i>
                          </div>
                          <h5>{currentUser.fullName}</h5>
                          <p className="text-muted mb-0">{currentUser.roleName}</p>
                        </Col>
                        <Col md={9}>
                          <Row>
                            <Col md={6}>
                              <p><strong>Username:</strong> {currentUser.username}</p>
                              <p><strong>Email:</strong> {currentUser.email}</p>
                            </Col>
                            <Col md={6}>
                              <p><strong>Phone:</strong> {currentUser.phone || 'Not provided'}</p>
                              <p><strong>Role:</strong> {currentUser.roleName}</p>
                            </Col>
                          </Row>
                          {currentUser.roleDescription && (
                            <div className="mt-2">
                              <strong>Role Description:</strong>
                              <p className="text-muted mb-0">{currentUser.roleDescription}</p>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Tabs for Profile Edit and Password Change */}
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="profile" title={<><i className="fas fa-user me-2"></i>Edit Profile</>}>
                  <Form onSubmit={handleProfileUpdate}>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="fullName"
                            value={profileForm.fullName}
                            onChange={handleProfileChange}
                            placeholder="Enter full name"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={profileForm.email}
                            onChange={handleProfileChange}
                            placeholder="Enter email"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                            placeholder="Enter phone number"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Username</Form.Label>
                          <Form.Control
                            type="text"
                            value={currentUser.username}
                            disabled
                            className="bg-light"
                          />
                          <Form.Text className="text-muted">
                            Username cannot be changed
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-end">
                      <Button variant="primary" type="submit">
                        <i className="fas fa-save me-2"></i>
                        Update Profile
                      </Button>
                    </div>
                  </Form>
                </Tab>

                {/* Change Password Tab - Only show for non-SSO users */}
                {!currentUser.useSso && (
                  <Tab eventKey="password" title={<><i className="fas fa-key me-2"></i>Change Password</>}>
                    <Form onSubmit={handlePasswordUpdate}>
                      <Row className="mb-3">
                        <Col md={12}>
                          <Alert variant="info">
                            <i className="fas fa-info-circle me-2"></i>
                            Password must be at least 6 characters long and different from your current password.
                          </Alert>
                        </Col>
                      </Row>

                      <Row className="mb-3">
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label>Current Password <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="password"
                              name="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter current password"
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>New Password <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="password"
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter new password"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Confirm New Password <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="password"
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="Confirm new password"
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="text-end">
                        <Button variant="warning" type="submit">
                          <i className="fas fa-key me-2"></i>
                          Change Password
                        </Button>
                      </div>
                    </Form>
                  </Tab>
                )}
              </Tabs>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
