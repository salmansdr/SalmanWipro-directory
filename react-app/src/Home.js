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
      {/* Hero Banner Section */}
      <section className="hero-banner" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        padding: '3rem 0',
        margin: 0
      }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={10} className="mx-auto text-center">
              <div className="mb-4">
                <i className="bi bi-building" style={{ fontSize: '4rem', opacity: 0.9 }}></i>
              </div>
              <h1 className="display-3 fw-bold mb-4 animate__animated animate__fadeInDown">
                Construction Management System
              </h1>
              <p className="lead mb-5 fs-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                Transform your construction project management with our comprehensive ERP solution. 
                From BOQ estimation to material distribution, manage your entire supply chain seamlessly.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Button 
                  variant="light" 
                  size="lg" 
                  className="px-5 py-3 shadow-lg"
                  onClick={() => navigate('/login')}
                  style={{ borderRadius: '50px', fontWeight: '600' }}
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Get Started
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg" 
                  className="px-5 py-3 shadow"
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  style={{ borderRadius: '50px', fontWeight: '600', borderWidth: '2px' }}
                >
                  <i className="bi bi-arrow-down-circle me-2"></i>
                  Learn More
                </Button>
              </div>
              
              {/* Quick Stats */}
              <Row className="mt-5 pt-4">
                <Col md={3} sm={6} className="mb-3">
                  <div className="stat-box p-3" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', backdropFilter: 'blur(10px)' }}>
                    <h3 className="display-6 fw-bold mb-0">100+</h3>
                    <p className="mb-0 opacity-75">Projects Managed</p>
                  </div>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <div className="stat-box p-3" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', backdropFilter: 'blur(10px)' }}>
                    <h3 className="display-6 fw-bold mb-0">500+</h3>
                    <p className="mb-0 opacity-75">Purchase Orders</p>
                  </div>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <div className="stat-box p-3" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', backdropFilter: 'blur(10px)' }}>
                    <h3 className="display-6 fw-bold mb-0">24/7</h3>
                    <p className="mb-0 opacity-75">Real-time Tracking</p>
                  </div>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <div className="stat-box p-3" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', backdropFilter: 'blur(10px)' }}>
                    <h3 className="display-6 fw-bold mb-0">99%</h3>
                    <p className="mb-0 opacity-75">Accuracy Rate</p>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Powerful Features</h2>
            <p className="lead text-muted">Everything you need to manage construction projects efficiently</p>
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
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', color: 'white' }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <h2 className="display-5 fw-bold mb-3">Ready to Transform Your Construction Management?</h2>
              <p className="lead mb-4">
                Join leading construction companies using our platform to streamline operations and boost productivity.
              </p>
              <Button 
                variant="light" 
                size="lg" 
                className="px-5 py-3"
                onClick={() => navigate('/login')}
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
