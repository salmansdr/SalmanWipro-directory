import React, { useState, useEffect } from 'react';

import { Container, Row, Col, Card, Form } from 'react-bootstrap';


const PHASES = [
  'Site Preparation',
  'Foundation',
  'Framing',
  'Roofing',
  'Electrical & Plumbing',
  'Interior Finishing',
  'Landscaping',
];

// Sample cost data for demonstration
const samplePhaseCosts = {
  'Site Preparation': { estimated: 500000, actual: 520000 },
  'Foundation': { estimated: 1200000, actual: 1250000 },
  'Framing': { estimated: 2000000, actual: 1950000 },
  'Roofing': { estimated: 800000, actual: 850000 },
  'Electrical & Plumbing': { estimated: 900000, actual: 950000 },
  'Interior Finishing': { estimated: 1500000, actual: 1600000 },
  'Landscaping': { estimated: 400000, actual: 390000 },
};

function Reports() {
  const [projects, setProjects] = useState([]);
  const [estimations, setEstimations] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEstimationId, setSelectedEstimationId] = useState('');
  const [selectedEstimationRef, setSelectedEstimationRef] = useState('');
  const [reportData, setReportData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  // Fetch all estimations grouped by project
  useEffect(() => {
    const fetchEstimations = async () => {
      try {
        const companyId = localStorage.getItem('selectedCompanyId');
        const endpoint = companyId 
          ? `${apiUrl}/api/ProjectEstimation?companyId=${companyId}`
          : `${apiUrl}/api/ProjectEstimation`;
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          const estimationsList = Array.isArray(data) ? data : [data];
          setEstimations(estimationsList);
          
          // Extract unique projects from estimations
          const uniqueProjects = [];
          const projectMap = new Map();
          
          estimationsList.forEach(est => {
            if (est.projectId && !projectMap.has(est.projectId)) {
              projectMap.set(est.projectId, {
                _id: est.projectId,
                name: est.projectName || 'Unnamed Project',
                estimations: []
              });
            }
            if (est.projectId) {
              const project = projectMap.get(est.projectId);
              project.estimations.push({
                _id: est._id,
                estimationRef: est.estimationRef,
                description: est.description
              });
            }
          });
          
          setProjects(Array.from(projectMap.values()));
        }
      } catch (error) {
        console.error('Error fetching estimations:', error);
      }
    };
    
    fetchEstimations();
  }, [apiUrl]);

  // Get filtered estimations for selected project
  const filteredEstimations = selectedProjectId
    ? projects.find(p => p._id === selectedProjectId)?.estimations || []
    : [];

  // Fetch report data when estimation is selected
  useEffect(() => {
    const fetchReportData = async () => {
      if (selectedEstimationId) {
        try {
          const response = await fetch(`${apiUrl}/api/ProjectEstimation/report/${selectedEstimationId}`);
          if (response.ok) {
            const data = await response.json();
            setReportData(data);
          } else {
            console.error('Failed to fetch report data');
            setReportData(null);
          }
        } catch (error) {
          console.error('Error fetching report data:', error);
          setReportData(null);
        }
      } else {
        setReportData(null);
      }
    };
    
    fetchReportData();
  }, [selectedEstimationId, apiUrl]);

  useEffect(() => {
    if (selectedEstimationId) {
      const estimation = estimations.find(e => e._id === selectedEstimationId);
      setSelectedProject(estimation);
      setSelectedEstimationRef(estimation?.estimationRef || '');
    } else {
      setSelectedProject(null);
      setSelectedEstimationRef('');
    }
  }, [selectedEstimationId, estimations]);

  return (
    <Container className="construction-report py-4">
      <Card className="mb-4 shadow-sm">
         <Card.Header as="h3" className="bg-primary text-white">Building Construction Report
</Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group className="report-dropdown-section" controlId="project-select">
                <Form.Label className="dropdown-label">Select Project:</Form.Label>
                <Form.Select
                  className="modern-dropdown"
                  value={selectedProjectId}
                  onChange={e => {
                    setSelectedProjectId(e.target.value);
                    setSelectedEstimationId(''); // Reset estimation when project changes
                  }}
                >
                  <option value="">-- Select Project --</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="report-dropdown-section" controlId="estimation-select">
                <Form.Label className="dropdown-label">Select Estimation:</Form.Label>
                <Form.Select
                  className="modern-dropdown"
                  value={selectedEstimationId}
                  onChange={e => setSelectedEstimationId(e.target.value)}
                  disabled={!selectedProjectId}
                >
                  <option value="">-- Select Estimation Ref --</option>
                  {filteredEstimations.map(est => (
                    <option key={est._id} value={est._id}>
                      {est.estimationRef} {est.description ? `- ${est.description}` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {reportData && (
            <Card className="mb-4 report-summary-section card-style shadow">
              <Card.Header className="bg-light">
                <h4 className="mb-0 section-heading text-primary">Project Summary</h4>
              </Card.Header>
              <Card.Body>
                {/* Company Details */}
                <div className="mb-3 pb-2 border-bottom">
                                   <Row className="g-2">
                    <Col md={5}>
                      <div>
                        <small className="text-muted d-block">Company Name:</small>
                        <span className="text-dark">{reportData.companyDetails?.companyName || 'N/A'}</span>
                      </div>
                    </Col>
                    <Col md={7}>
                      <div>
                        <small className="text-muted d-block">Address:</small>
                        <span className="text-dark" style={{lineHeight: '1.4'}}>
                          {(() => {
                            try {
                              const addr = JSON.parse(reportData.companyDetails?.address || '{}');
                              const parts = [];
                              if (addr.street) parts.push(addr.street);
                              if (addr.city || addr.zipCode) parts.push(`${addr.city}${addr.city && addr.zipCode ? ', ' : ''}${addr.zipCode}`);
                              if (addr.country) parts.push(addr.country);
                              return parts.join(' | ');
                            } catch {
                              return reportData.companyDetails?.address || 'N/A';
                            }
                          })()}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Project Details */}
                <div>
                  
                  <Row className="g-2">
                    <Col md={3}>
                      <div>
                        <small className="text-muted d-block">Project Name:</small>
                        <span className="text-dark">{reportData.projectDetails?.projectName || 'N/A'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div>
                        <small className="text-muted d-block">Location:</small>
                        <span className="text-dark">{reportData.projectDetails?.location || 'N/A'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div>
                        <small className="text-muted d-block">Project Type:</small>
                        <span className="text-dark">{reportData.projectDetails?.projectType || 'N/A'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div>
                        <small className="text-muted d-block">Construction Area:</small>
                        <span className="fs-5 fw-bold text-primary">{reportData.projectDetails?.constructionArea || 'N/A'}</span>
                        {reportData.projectDetails?.constructionArea && <span className="text-muted ms-1">sq ft</span>}
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          )}

          {selectedProject && (
            <Card className="mb-4 report-phase-table-section card-style">
              <Card.Header>
                <h4 className="mb-0 section-heading">Phase Cost Tracking</h4>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Phase</th>
                        <th>Estimated Cost (₹)</th>
                        <th>Actual Cost (₹)</th>
                        <th>Variance (₹)</th>
                        <th>Variance (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PHASES.map(phase => {
                        const est = samplePhaseCosts[phase]?.estimated || 0;
                        const act = samplePhaseCosts[phase]?.actual || 0;
                        const variance = act - est;
                        const variancePerc = est ? ((variance / est) * 100).toFixed(2) : '0.00';
                        return (
                          <tr key={phase}>
                            <td>{phase}</td>
                            <td>{est.toLocaleString()}</td>
                            <td>{act.toLocaleString()}</td>
                            <td className={variance > 0 ? 'text-danger' : 'text-success'}>{variance.toLocaleString()}</td>
                            <td className={variance > 0 ? 'text-danger' : 'text-success'}>{variancePerc}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Reports;
