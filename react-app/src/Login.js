
import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function Login({ onLogin, isAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/Usermaster/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid username or password');
      }

      const userData = await response.json();
      
      // Store user data in localStorage
      localStorage.setItem('userId', userData._id);
      localStorage.setItem('username', userData.username);
      localStorage.setItem('userRole', userData.roleName);
      localStorage.setItem('userPermissions', JSON.stringify(userData.rolePermissions || []));
      
      // Call parent onLogin handler
      if (onLogin) {
        onLogin(username, password, userData);
      }
      
      setError('');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      // Decode JWT token to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      const email = decoded.email;
      const name = decoded.name;

      console.log('Google login successful:', { email, name });

      // Call API to verify user exists in database
      const response = await fetch(`${apiBaseUrl}/api/Usermaster/sso-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          name,
          provider: 'google' 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'User not registered in system');
      }

      const userData = await response.json();
      
      // Store user data in localStorage
      localStorage.setItem('userId', userData._id);
      localStorage.setItem('username', userData.username);
      localStorage.setItem('userRole', userData.roleName);
      localStorage.setItem('userPermissions', JSON.stringify(userData.rolePermissions || []));
      
      // Call parent onLogin handler
      if (onLogin) {
        onLogin(userData.username, null, userData);
      }
      
      setError('');
      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message || 'Google login failed. User may not be registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <Container fluid className="d-flex align-items-start justify-content-center min-vh-100" style={{overflow: 'hidden', paddingTop: '4vh'}}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5} xxl={4}>
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white text-center py-3">
              <h4 className="mb-0">Sign In</h4>
            </div>
            <div className="card-body p-4">
              <form className="row g-3" onSubmit={handleSubmit} autoComplete="off">
                <div className="col-12 col-md-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    id="login-username"
                    placeholder="Username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    disabled={isAuthenticated}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    id="login-password"
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isAuthenticated}
                  />
                </div>
                <div className="col-12 text-end">
                  <button type="button" className="btn btn-link p-0 text-primary small" style={{textDecoration: 'underline'}} tabIndex={0}>Forgot Password?</button>
                </div>
                {error && (
                  <div className="col-12">
                    <div className="alert alert-danger py-2 mb-0">{error}</div>
                  </div>
                )}
                <div className="col-12 d-grid">
                  <button type="submit" className="btn btn-primary px-4" disabled={isAuthenticated || loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </div>
                
                {/* Divider */}
                <div className="col-12">
                  <div className="d-flex align-items-center">
                    <hr className="flex-grow-1" />
                    <span className="px-3 text-muted small">OR</span>
                    <hr className="flex-grow-1" />
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <div className="col-12 d-flex justify-content-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signin_with"
                    size="large"
                    width="100%"
                  />
                </div>

                {/* Info Text */}
                <div className="col-12 text-center">
                  <p className="text-muted small mb-0">
                    Sign in with your registered email account
                  </p>
                </div>
              </form>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;

