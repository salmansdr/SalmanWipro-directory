import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaFileExcel } from 'react-icons/fa';
import { Button, Form, Row, Col } from 'react-bootstrap';
import './Styles/WizardSteps.css';

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


const PricingCalculator = () => {
  const [step, setStep] = useState(1);
  const [selectedCity, setSelectedCity] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [floors, setFloors] = useState(1);
  const [lift, setLift] = useState(false);
  const [costLevel, setCostLevel] = useState('basic');
  const [openCategory, setOpenCategory] = useState([]);

  const plotArea = width && depth ? Number(width) * Number(depth) : '';

  const handleCircleClick = (s) => setStep(s);
  const toggleCategory = (cat) => {
    setOpenCategory((prev) =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

  // Excel download logic
  const handleDownloadExcel = () => {
    let csv = 'Category,Item,Qty,Unit,Rate,Amount\n';
    sampleCostData.forEach(cat => {
      cat.details.forEach(item => {
        csv += `${cat.category},${item.name},${item.qty},${item.unit},${item.rate[costLevel]},${item.qty * item.rate[costLevel]}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ConstructionReport.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="wizard-container calculator-container" style={{ maxWidth: '900px' }}>
      {/* Step Indicator */}
      <div className="wizard-indicator">
        {[1,2,3,4].map(s => (
          <span
            key={s}
            className={`wizard-circle${step === s ? ' active' : ''}`}
            onClick={() => handleCircleClick(s)}
          >{s}</span>
        ))}
      </div>
      {/* Step Content */}
      <div className="wizard-step-content">
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
          <>
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
            </Form>
            {(width && depth) && (
              <div className="plot-rectangle-container" style={{ margin: '2rem auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px' }}>
                <div style={{ position: 'relative', width: '340px', height: '220px', background: 'transparent', borderRadius: '12px', border: '1.5px solid #e0e0e0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {/* Left label (Depth) */}
                  <div style={{ position: 'absolute', left: '-38px', top: '50%', transform: 'translateY(-50%)', color: '#757575', fontWeight: 500, fontSize: '1rem' }}>
                    {Number(depth).toFixed(2)} ft
                  </div>
                  {/* Top label (Width) */}
                  <div style={{ position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)', color: '#757575', fontWeight: 500, fontSize: '1rem' }}>
                    {Number(width).toFixed(2)} ft
                  </div>
                  {/* Rectangle */}
                  <div style={{
                    width: `${Math.max(80, Math.min(260, Number(width) / 5))}px`,
                    height: `${Math.max(40, Math.min(140, Number(depth) / 5))}px`,
                    background: '#fffde7',
                    border: '3px solid #ffd600',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    transition: 'width 0.3s, height 0.3s'
                  }}>
                    <span style={{ color: '#616161', fontWeight: 700, fontSize: '1.15rem' }}>
                      {Number(plotArea).toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq ft
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {step === 3 && (
          <>
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
            {/* Building structure visual */}
            {floors && Number(floors) > 0 && (
              <div className="building-structure-stack" style={{ margin: '2rem auto', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '120px' }}>
                {Array.from({ length: Number(floors) + 1 }, (_, i) => {
                  const label = i === 0 ? 'Ground' : `${i} ${i === 1 ? 'Floor' : 'Floor'}`;
                  return (
                    <div key={label} style={{
                      width: '120px',
                      height: '38px',
                      background: '#fffde7',
                      border: '2.5px solid #ff9800',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      color: '#ff9800',
                      fontSize: '1rem',
                      marginBottom: '8px',
                    }}>
                      {i === 0 ? 'Ground' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Floor`}
                    </div>
                  );
                }).reverse()}
              </div>
            )}
          </>
        )}
        {step === 4 && (
          <div>
            <div className="cost-level-selector mb-3 d-flex align-items-end justify-content-end">
              <Button variant="outline-success" onClick={handleDownloadExcel} title="Download to Excel">
                <FaFileExcel size={22} style={{ verticalAlign: 'middle' }} />
              </Button>
            </div>
            {sampleCostData.map(cat => {
              // Per-category cost level state
              const [catLevel, setCatLevel] = [cat._level || costLevel, (level) => { cat._level = level; setCostLevel(level); }];
              const isOpen = openCategory.includes(cat.category);
              const total = cat.details.reduce((sum, item) => sum + item.qty * item.rate[catLevel], 0);
              return (
                <div key={cat.category} className="cost-category mb-4">
                  <div
                    className="cost-category-header d-flex align-items-center justify-content-between"
                    style={{ cursor: 'pointer', background: '#f7f7f7', borderRadius: '8px', padding: '0.7rem 1.2rem', boxShadow: '0 1px 4px rgba(33,150,243,0.07)' }}
                    onClick={() => toggleCategory(cat.category)}
                  >
                    <div className="d-flex flex-column flex-md-row align-items-md-center w-100">
                      <div className="d-flex align-items-center mb-2 mb-md-0" style={{ minWidth: '120px', maxWidth: '180px' }}>
                        <span style={{ marginRight: '1rem', fontSize: '1.2rem', color: '#1976d2' }}>
                          {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                        <h5 style={{ margin: 0 }}>{cat.category}</h5>
                      </div>
                      <div className="d-flex flex-column flex-md-row ms-md-4">
                        {costLevels.map(level => (
                          <div className="form-check mb-2 mb-md-0 me-md-3" key={level.key}>
                            <input type="radio" className="form-check-input" name={`level-${cat.category}`} checked={catLevel === level.key} onChange={() => setCatLevel(level.key)} />
                            <label className="form-check-label ms-2">{level.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#1976d2', fontSize: '1.15rem' }}>
                      ₹{total.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="cost-category-details" style={{ marginTop: '0.7rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(33,150,243,0.08)', padding: '0.7rem 1.2rem' }}>
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Rate</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.details.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.name}</td>
                              <td>{item.qty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                              <td>{item.unit}</td>
                              <td>₹{item.rate[catLevel].toLocaleString('en-IN')}</td>
                              <td style={{ color: '#388e3c', fontWeight: 600 }}>
                                ₹{(item.qty * item.rate[catLevel]).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Total Estimated Cost */}
            <div className="total-estimated-cost" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1976d2', margin: '2rem 0 1.5rem 0', textAlign: 'right' }}>
              Total Estimated Cost: ₹{
                sampleCostData.reduce((sum, cat) => sum + cat.details.reduce((catSum, item) => catSum + item.qty * item.rate[costLevel], 0), 0).toLocaleString('en-IN')
              }
            </div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Button variant="primary" size="lg">Submit</Button>
            </div>
          </div>
        )}
      </div>
      {/* Navigation Buttons */}
      <div className="wizard-nav-btns mt-4">
        <Button disabled={step === 1} onClick={() => setStep(step-1)} className="me-2">Back</Button>
        <Button disabled={step === 4} onClick={() => setStep(step+1)}>Next</Button>
      </div>
    </div>
  );
};

export default PricingCalculator;
