import { exportCostDataToExcel } from './excelUtils';
import React, { useState } from 'react';
import { Button, Form, Row, Col, Container, ProgressBar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara'
];

const costLevels = [
  { key: 'basic', label: 'Basic' },
  { key: 'deluxe', label: 'Deluxe' },
  { key: 'premium', label: 'Premium' }
];

const sampleCostData = [
  {
    category: 'Civil',
    details: [
      { name: 'Brickwork', qty: 100, unit: 'sqft', rate: { basic: 50, deluxe: 70, premium: 90 } },
      { name: 'Concrete', qty: 50, unit: 'cft', rate: { basic: 80, deluxe: 100, premium: 120 } }
    ]
  },
  {
    category: 'Door & Window',
    details: [
      { name: 'Wooden Door', qty: 10, unit: 'nos', rate: { basic: 3000, deluxe: 4000, premium: 5000 } },
      { name: 'Aluminum Window', qty: 8, unit: 'nos', rate: { basic: 2500, deluxe: 3500, premium: 4500 } }
    ]
  },
  {
    category: 'Electrical',
    details: [
      { name: 'Wiring', qty: 200, unit: 'mtr', rate: { basic: 20, deluxe: 30, premium: 40 } },
      { name: 'Switches', qty: 30, unit: 'nos', rate: { basic: 100, deluxe: 150, premium: 200 } }
    ]
  },
  {
    category: 'Flooring',
    details: [
      { name: 'Tiles', qty: 120, unit: 'sqft', rate: { basic: 40, deluxe: 60, premium: 80 } }
    ]
  },
  {
    category: 'Plumbing',
    details: [
      { name: 'Pipes', qty: 60, unit: 'mtr', rate: { basic: 30, deluxe: 45, premium: 60 } }
    ]
  },
  {
    category: 'Finishes',
    details: [
      { name: 'Paint', qty: 200, unit: 'sqft', rate: { basic: 10, deluxe: 20, premium: 30 } }
    ]
  },
  {
    category: 'Miscellaneous',
    details: [
      { name: 'Cleaning', qty: 1, unit: 'job', rate: { basic: 500, deluxe: 700, premium: 900 } }
    ]
  }
];

function WizardSteps() {
  const [step, setStep] = useState(1);
  const [selectedCity, setSelectedCity] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [floors, setFloors] = useState(1);
  const [lift, setLift] = useState(false);
  const [costLevel, setCostLevel] = useState('basic');

  const plotArea = width && depth ? Number(width) * Number(depth) : '';

  const handleCircleClick = (s) => setStep(s);

  return (
    <Container className="my-4 p-4 bg-white rounded shadow" style={{maxWidth: 600}}>
      {/* Step Indicator */}
      <Row className="justify-content-center mb-4">
        {[1,2,3,4].map(s => (
          <Col key={s} xs="auto">
            <Button
              variant={step === s ? "primary" : "outline-primary"}
              className="rounded-circle"
              style={{width: 40, height: 40, fontWeight: 700, fontSize: '1.2rem'}}
              onClick={() => handleCircleClick(s)}
            >
              {s}
            </Button>
          </Col>
        ))}
      </Row>
      <ProgressBar now={step * 25} className="mb-4" />

      {/* Step Content */}
      <div className={`wizard-step-content${step === 4 ? ' step-4' : ''}`}>
        {step === 1 && (
          <Form>
            <Form.Group>
              <Form.Label>Select City</Form.Label>
              <Form.Select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                <option value="">Select City</option>
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </Form.Select>
            </Form.Group>
          </Form>
        )}
        {step === 2 && (
          <Form>
            <Row>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Width (ft)</Form.Label>
                  <Form.Control type="number" value={width} onChange={e => setWidth(e.target.value)} min={1} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Depth (ft)</Form.Label>
                  <Form.Control type="number" value={depth} onChange={e => setDepth(e.target.value)} min={1} />
                </Form.Group>
              </Col>
            </Row>
            {plotArea && (
              <div className="alert alert-info mt-3">Plot Area: <b>{plotArea} sqft</b></div>
            )}
          </Form>
        )}
        {step === 3 && (
          <Form>
            <Row>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Number of Floors</Form.Label>
                  <Form.Control type="number" value={floors} onChange={e => setFloors(e.target.value)} min={1} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label>Lift Requirement</Form.Label>
                  <Form.Check type="switch" label="Lift Required" checked={lift} onChange={e => setLift(e.target.checked)} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
        {step === 4 && (
          <div>
            <div className="d-flex justify-content-end mb-3">
              <Button variant="success" onClick={() => exportCostDataToExcel(sampleCostData, costLevel)}>
                <i className="bi bi-file-earmark-excel" style={{marginRight: '0.5rem'}}></i>
                Download Excel
              </Button>
            </div>
            <div className="mb-3">
              {sampleCostData.map(cat => (
                <div key={cat.category} className="mb-4 p-3 bg-white rounded shadow-sm border position-relative">
                  <div className="mb-2 d-flex align-items-center">
                    <span style={{fontSize: '1.5rem', color: '#1976d2', marginRight: '0.5rem'}}>
                      <i className="bi bi-grid-3x3-gap"></i>
                    </span>
                    <span className="fw-bold text-primary" style={{fontSize: '1.15rem'}}>{cat.category}</span>
                  </div>
                  <div className="cost-level-selector mb-2">
                    {/*
                    {costLevels.map(level => (
                      <Form.Check
                        key={level.key}
                        // type="radio"
                        // name={`costLevel-${cat.category}`}
                        id={`costLevel-${cat.category}-${level.key}`}
                        //label={level.label}
                        value={level.key}
                        checked={costLevel === level.key}
                        onChange={() => setCostLevel(level.key)}
                        className="d-inline-block me-3"
                        style={{fontSize: '1rem'}}
                      />
                    ))}
                    */}
                  </div>
                </div>
              ))}
            </div>
            {sampleCostData.map(cat => (
              <div key={cat.category} className="mb-4">
                <h5 className="text-primary d-flex align-items-center" style={{fontSize: '1.12rem'}}>
                  <span style={{fontSize: '1.3rem', marginRight: '0.5rem', color: '#90caf9'}}>
                    <i className="bi bi-table"></i>
                  </span>
                  {cat.category}
                </h5>
                <table className="table table-bordered table-sm mb-0">
                  <thead style={{background: '#e3f2fd'}}>
                    <tr>
                      <th style={{background: '#e3f2fd', color: '#1976d2'}}>Item</th>
                      <th style={{background: '#e3f2fd', color: '#1976d2'}}>Qty</th>
                      <th style={{background: '#e3f2fd', color: '#1976d2'}}>Unit</th>
                      <th style={{background: '#e3f2fd', color: '#1976d2'}}>Rate</th>
                      <th style={{background: '#e3f2fd', color: '#1976d2'}}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.details.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>{item.qty}</td>
                        <td>{item.unit}</td>
                        <td>{item.rate[costLevel]}</td>
                        <td>{item.qty * item.rate[costLevel]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Navigation Buttons */}
      <div className="d-flex justify-content-between mt-4">
        <Button disabled={step === 1} onClick={() => setStep(step-1)} variant="secondary">Back</Button>
        <Button disabled={step === 4} onClick={() => setStep(step+1)} variant="primary">Next</Button>
      </div>
    </Container>
  );
}

export default WizardSteps;
