
import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin, isAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) {
      const success = onLogin(username, password);
      if (!success) {
        setError('Invalid username or password');
      } else {
        setError('');
        // navigation will happen via useEffect
      }
    }
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
                  <button type="submit" className="btn btn-primary px-4" disabled={isAuthenticated}>Login</button>
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

