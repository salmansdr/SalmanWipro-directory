import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './Styles/Home.css';

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '📊',
      title: 'BOQ Estimation',
      description: 'Comprehensive Bill of Quantities generation with accurate material, labour, and cost calculations for your construction projects.',
      color: '#667eea'
    },
    {
      icon: '📝',
      title: 'Material Requisition',
      description: 'Streamlined requisition workflow with approval management, ensuring timely procurement of construction materials.',
      color: '#14b8a6'
    },
    {
      icon: '🛒',
      title: 'Purchase Orders',
      description: 'Complete purchase order lifecycle management from creation to approval, with vendor tracking and delivery monitoring.',
      color: '#10b981'
    },
    {
      icon: '📦',
      title: 'Material Receipt',
      description: 'Track material deliveries against purchase orders with quality checks and inventory updates in real-time.',
      color: '#f59e0b'
    },
    {
      icon: '📤',
      title: 'Issue Register',
      description: 'Manage material distribution to project sites with floor-wise tracking and return management.',
      color: '#3b82f6'
    },
    {
      icon: '⚙️',
      title: 'Supply Chain Workflow',
      description: 'End-to-end supply chain automation with multi-level approvals and real-time status tracking.',
      color: '#8b5cf6'
    }
  ];

  const workflowSteps = [
    { step: 1, title: 'Project Estimation', desc: 'Create detailed BOQ with material & labour costs' },
    { step: 2, title: 'Material Requisition', desc: 'Raise requisition for required materials' },
    { step: 3, title: 'Approval Workflow', desc: 'Multi-level approval by authorized users' },
    { step: 4, title: 'Purchase Order', desc: 'Generate PO and send to suppliers' },
    { step: 5, title: 'Material Receipt', desc: 'Receive materials against PO' },
    { step: 6, title: 'Issue to Site', desc: 'Distribute materials to project floors' }
  ];

  return (
    <div className="home-page">
      {/* Promotional Banner Strip */}
      <section style={{
        background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
        color: 'white',
        padding: '1rem 0',
        position: 'relative',
        zIndex: 10
      }}>
        <Container>
          <Row className="align-items-center">
            <Col className="text-center">
              <div className="d-flex align-items-center justify-content-center flex-wrap gap-3">
                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>BuildPro Platform</span>
                <span style={{ fontSize: '1rem', opacity: 0.95 }}>Transform Construction Management with Confidence</span>
                <Button
                  variant="link"
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    padding: '0.25rem 1rem',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: '20px',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Learn More →
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Hero Banner Section */}
      <section className="hero-banner" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        minHeight: '65vh',
        display: 'flex',
        alignItems: 'center',
        padding: '4rem 0 3rem 0',
        margin: 0,
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="align-items-center">
            <Col lg={10} className="mx-auto text-center">
              <h1 className="hero-title mb-4" style={{
                fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
                fontWeight: '700',
                lineHeight: '1.2',
                letterSpacing: '-0.01em'
              }}>
                Construction Management System
              </h1>
              <p className="lead mb-5" style={{ 
                maxWidth: '900px', 
                margin: '0 auto 3rem',
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'rgba(255,255,255,0.95)',
                fontWeight: '400',
                lineHeight: '1.6'
              }}>
                Transform your construction project management with our comprehensive ERP solution. From BOQ estimation to material distribution, manage your entire supply chain seamlessly.
              </p>

              {/* CTA Buttons */}
              <div className="d-flex gap-3 justify-content-center flex-wrap mb-5">
                <Button 
                  size="lg" 
                  className="px-5 py-3"
                  onClick={() => navigate('/login')}
                  style={{ 
                    background: 'white',
                    color: '#667eea',
                    border: 'none',
                    borderRadius: '50px',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline-light"
                  size="lg" 
                  className="px-5 py-3"
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  style={{ 
                    background: 'transparent',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '50px',
                    fontWeight: '600',
                    fontSize: '1.1rem'
                  }}
                >
                  Learn More
                </Button>
              </div>
              
              {/* Quick Stats */}
              <Row className="mt-5 pt-4" style={{ maxWidth: '1100px', margin: '3rem auto 0' }}>
                <Col md={3} sm={6} className="mb-3">
                  <div className="stat-box p-4" style={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    borderRadius: '15px', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <h3 className="display-6 fw-bold mb-1" style={{ color: 'white' }}>100+</h3>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>Projects Managed</p>
                  </div>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <div className="stat-box p-4" style={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    borderRadius: '15px', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <h3 className="display-6 fw-bold mb-1" style={{ color: 'white' }}>500+</h3>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>Purchase Orders</p>
                  </div>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <div className="stat-box p-4" style={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    borderRadius: '15px', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <h3 className="display-6 fw-bold mb-1" style={{ color: 'white' }}>24/7</h3>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>Real-time Tracking</p>
                  </div>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <div className="stat-box p-4" style={{ 
                    background: 'rgba(255,255,255,0.15)', 
                    borderRadius: '15px', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <h3 className="display-6 fw-bold mb-1" style={{ color: 'white' }}>99%</h3>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>Accuracy Rate</p>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5" style={{ background: '#f8f9fa', padding: '5rem 0' }}>
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', color: '#1a1a2e' }}>Powerful Features</h2>
            <p className="lead" style={{ color: '#6c757d', fontSize: '1.2rem' }}>Everything you need to manage construction projects efficiently</p>
          </div>
          <Row className="g-4">
            {features.map((feature, index) => (
              <Col key={index} lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm feature-card" style={{ transition: 'all 0.3s' }}>
                  <Card.Body className="p-4">
                    <div 
                      className="feature-icon mb-3 d-flex align-items-center justify-content-center rounded-circle mx-auto"
                      style={{ 
                        width: '70px', 
                        height: '70px', 
                        background: `${feature.color}20`,
                        fontSize: '2rem'
                      }}
                    >
                      {feature.icon}
                    </div>
                    <h5 className="card-title text-center mb-3" style={{ color: feature.color, fontWeight: '600' }}>
                      {feature.title}
                    </h5>
                    <p className="card-text text-muted text-center">
                      {feature.description}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Workflow Section */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Supply Chain Workflow</h2>
            <p className="lead text-muted">Seamless process from estimation to material distribution</p>
          </div>
          
          {/* Flow Diagram */}
          <div className="workflow-container mb-5">
            <Row className="g-4 justify-content-center">
              {workflowSteps.map((item, index) => (
                <React.Fragment key={index}>
                  <Col lg={2} md={4} sm={6} className="text-center">
                    <div className="workflow-step">
                      <div 
                        className="step-number mb-3 mx-auto d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: '60px',
                          height: '60px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                        }}
                      >
                        {item.step}
                      </div>
                      <h6 className="fw-bold mb-2">{item.title}</h6>
                      <small className="text-muted">{item.desc}</small>
                    </div>
                  </Col>
                  {index < workflowSteps.length - 1 && (
                    <Col lg={1} className="d-none d-lg-flex align-items-center justify-content-center">
                      <i className="bi bi-arrow-right text-primary" style={{ fontSize: '2rem' }}></i>
                    </Col>
                  )}
                </React.Fragment>
              ))}
            </Row>
          </div>

          {/* Workflow Details */}
          <Row className="mt-5">
            <Col lg={10} className="mx-auto">
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h4 className="mb-4 text-center fw-bold">How It Works</h4>
                  <Row className="g-4">
                    <Col md={6}>
                      <div className="d-flex mb-3">
                        <div className="me-3">
                          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold">Estimation & Planning</h6>
                          <p className="text-muted mb-0">Create detailed BOQs with component-wise material calculations and cost breakdowns.</p>
                        </div>
                      </div>
                      <div className="d-flex mb-3">
                        <div className="me-3">
                          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold">Smart Procurement</h6>
                          <p className="text-muted mb-0">Automated requisition to PO conversion with supplier management and price tracking.</p>
                        </div>
                      </div>
                      <div className="d-flex">
                        <div className="me-3">
                          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold">Real-time Tracking</h6>
                          <p className="text-muted mb-0">Monitor material receipts, inventory levels, and distribution across project sites.</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex mb-3">
                        <div className="me-3">
                          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold">Approval Workflow</h6>
                          <p className="text-muted mb-0">Multi-level approval system with role-based access and notification management.</p>
                        </div>
                      </div>
                      <div className="d-flex mb-3">
                        <div className="me-3">
                          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold">Inventory Control</h6>
                          <p className="text-muted mb-0">Track stock levels, location-wise inventory, and material movement in real-time.</p>
                        </div>
                      </div>
                      <div className="d-flex">
                        <div className="me-3">
                          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h6 className="fw-bold">Analytics & Reports</h6>
                          <p className="text-muted mb-0">Comprehensive dashboards with cost analysis, purchase trends, and project insights.</p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Why Choose Us</h2>
            <p className="lead text-muted">Built for construction professionals, by construction experts</p>
          </div>
          <Row className="g-4">
            <Col lg={3} md={6}>
              <div className="text-center p-4">
                <div className="benefit-icon mb-3 mx-auto">
                  <i className="bi bi-lightning-charge-fill" style={{ fontSize: '3rem', color: '#f59e0b' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Efficiency</h5>
                <p className="text-muted">Reduce manual work and save time with automated workflows</p>
              </div>
            </Col>
            <Col lg={3} md={6}>
              <div className="text-center p-4">
                <div className="benefit-icon mb-3 mx-auto">
                  <i className="bi bi-graph-up-arrow" style={{ fontSize: '3rem', color: '#10b981' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Cost Savings</h5>
                <p className="text-muted">Optimize procurement and reduce material wastage significantly</p>
              </div>
            </Col>
            <Col lg={3} md={6}>
              <div className="text-center p-4">
                <div className="benefit-icon mb-3 mx-auto">
                  <i className="bi bi-shield-check" style={{ fontSize: '3rem', color: '#3b82f6' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Accuracy</h5>
                <p className="text-muted">Minimize errors with validated data and automated calculations</p>
              </div>
            </Col>
            <Col lg={3} md={6}>
              <div className="text-center p-4">
                <div className="benefit-icon mb-3 mx-auto">
                  <i className="bi bi-eye-fill" style={{ fontSize: '3rem', color: '#8b5cf6' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Transparency</h5>
                <p className="text-muted">Complete visibility across the entire procurement lifecycle</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', 
        color: 'white',
        padding: '4rem 0'
      }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <h2 className="fw-bold mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
                Ready to Transform Your Construction Management?
              </h2>
              <p className="lead mb-5" style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)' }}>
                Join leading construction companies using our platform to streamline operations and boost productivity.
              </p>
              <Button 
                size="lg" 
                className="px-5 py-3"
                onClick={() => navigate('/login')}
                style={{ 
                  background: '#38bdf8',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
                }}
              >
                <i className="bi bi-rocket-takeoff me-2"></i>
                Start Your Journey
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default Home;
