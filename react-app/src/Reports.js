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
  const [selectedId, setSelectedId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/projects.json')
      .then(res => res.json())
      .then(data => {
        const all = [...data.completed, ...data.running, ...data.upcoming];
        setProjects(all);
      });
  }, []);

  useEffect(() => {
    if (selectedId) {
      setSelectedProject(projects.find(p => p.id === Number(selectedId)));
    } else {
      setSelectedProject(null);
    }
  }, [selectedId, projects]);

  return (
    <Container className="construction-report py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h2 className="mb-0">Building Construction Report</h2>
        </Card.Header>
        <Card.Body>
          <Form.Group as={Row} className="mb-4 report-dropdown-section" controlId="project-select">
            <Form.Label column sm={3} className="dropdown-label">Select Project:</Form.Label>
            <Col sm={9}>
              <Form.Select
                className="modern-dropdown"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">-- Select --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Form.Group>

          {selectedProject && (
            <Card className="mb-4 report-summary-section card-style">
              <Card.Header>
                <h4 className="mb-0 section-heading">Project Summary</h4>
              </Card.Header>
              <Card.Body>
                <Row className="summary-grid">
                  <Col><span className="summary-label">Location:</span> {selectedProject.location}</Col>
                  <Col><span className="summary-label">Start Date:</span> {selectedProject.startDate}</Col>
                  <Col><span className="summary-label">End Date:</span> {selectedProject.endDate}</Col>
                </Row>
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
