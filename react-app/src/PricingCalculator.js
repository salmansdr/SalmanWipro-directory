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
  // Per-floor BHK configuration state
  const [floorBHKConfigs, setFloorBHKConfigs] = useState({});

  // Handler to copy config from one floor to another
  function copyFloorConfig(fromIdx, toIdx) {
    setFloorBHKConfigs(prev => ({
      ...prev,
      [toIdx]: prev[fromIdx] ? [...prev[fromIdx]] : [...bhkRows]
    }));
  }
  // New state for build-up and carpet area percentages
  const [buildupPercent, setBuildupPercent] = useState(90);
  const [carpetPercent, setCarpetPercent] = useState(80);

  
  // Responsive mobile detection
  //const isMobile = window.innerWidth <= 600 || window.matchMedia('(max-width: 600px)').matches;
  // Declare all required state variables
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [step, setStep] = useState(1);
  const [selectedCity, setSelectedCity] = useState('');
  const [floors, setFloors] = useState(1);
  const [lift, setLift] = useState(false);
  const [costLevel, setCostLevel] = useState('basic');
  const [openCategory, setOpenCategory] = useState([]);

  // Rectangle visualization for Step 1
  const plotArea = width && depth ? Number(width) * Number(depth) : '';
  let rectangleVisualization = null;


  // At the top of your component
const defaultBHKs = [
  { type: '1 BHK', units: 2, area: 400, rooms: '1 Bed, 1 Living, 1 Kitchen, 1 Bath' },
  { type: '2 BHK', units: 2, area: 600, rooms: '2 Bed, 1 Living, 1 Kitchen, 2 Bath' },
  { type: '3 BHK', units: 1, area: 900, rooms: '3 Bed, 1 Living, 1 Kitchen, 3 Bath' }
];
  // Default BHK config for new floors
  const [bhkRows, setBhkRows] = useState(defaultBHKs);

  // Helper to get BHK config for a floor
  const getFloorRows = floorIdx => floorBHKConfigs[floorIdx] || (floorIdx === 0 ? bhkRows : defaultBHKs);

  // Handler to update BHK config for a floor
  function handleFloorCellChange(floorIdx, idx, field, value) {
    if (floorIdx === 0) {
      const updated = [...bhkRows];
      updated[idx][field] = field === 'units' || field === 'area' ? Number(value) : value;
      setBhkRows(updated);
    } else {
      setFloorBHKConfigs(prev => {
        const rows = [...getFloorRows(floorIdx)];
        rows[idx][field] = field === 'units' || field === 'area' ? Number(value) : value;
        return { ...prev, [floorIdx]: rows };
      });
    }
  }

  // Handler to add/remove row for a floor
  function handleFloorAddRow(floorIdx) {
    if (floorIdx === 0) {
      setBhkRows([...getFloorRows(floorIdx), { type: '', units: 1, area: 400, rooms: '' }]);
    } else {
      setFloorBHKConfigs(prev => {
        const rows = [...getFloorRows(floorIdx), { type: '', units: 1, area: 400, rooms: '' }];
        return { ...prev, [floorIdx]: rows };
      });
    }
  }
  function handleFloorRemoveRow(floorIdx, idx) {
    if (floorIdx === 0) {
      setBhkRows(getFloorRows(floorIdx).filter((_, i) => i !== idx));
    } else {
      setFloorBHKConfigs(prev => {
        const rows = [...getFloorRows(floorIdx)].filter((_, i) => i !== idx);
        return { ...prev, [floorIdx]: rows };
      });
    }
  }
  function handleFloorAdjust(floorIdx) {
    const rows = getFloorRows(floorIdx);
    const gridTotalArea = rows.reduce((sum, row) => sum + row.units * row.area, 0);
    if (gridTotalArea === 0 || totalCarpetArea === 0) return;
    const scale = totalCarpetArea / gridTotalArea;
    if (floorIdx === 0) {
      setBhkRows(rows.map(row => ({ ...row, area: Math.round(row.area * scale) })));
    } else {
      setFloorBHKConfigs(prev => ({
        ...prev,
        [floorIdx]: rows.map(row => ({ ...row, area: Math.round(row.area * scale) }))
      }));
    }
  }
const totalCarpetArea = Number(width) && Number(depth) ? Number(width) * Number(depth) * (carpetPercent/100) : 0;

  if (width && depth) {
    // Responsive base sizes
    const OUTER_WIDTH = Math.min(window.innerWidth * 0.96, 800);
    const OUTER_HEIGHT = Math.min(window.innerWidth * 0.60, 320);
    const MAX_WIDTH = OUTER_WIDTH * 0.8;
    const MAX_HEIGHT = OUTER_HEIGHT * 0.8;
    // Rectangle sizes (clamped for mobile)
    // Increase scale so rectangles are always visible, even for small SBA
  const SCALE_FACTOR = 0.5; // Even higher scale for maximum visibility
    const sbaWidth = Math.max(120, Math.min(MAX_WIDTH, Number(width) * SCALE_FACTOR));
    const sbaHeight = Math.max(60, Math.min(MAX_HEIGHT, Number(depth) * SCALE_FACTOR));
    const buaWidth = Math.max(90, Math.min(sbaWidth - 24, (Number(width) * (buildupPercent/100)) * SCALE_FACTOR));
    const buaHeight = Math.max(45, Math.min(sbaHeight - 24, (Number(depth) * (buildupPercent/100)) * SCALE_FACTOR));
    const caWidth = Math.max(60, Math.min(buaWidth - 24, (Number(width) * (carpetPercent/100)) * SCALE_FACTOR));
    const caHeight = Math.max(30, Math.min(buaHeight - 24, (Number(depth) * (carpetPercent/100)) * SCALE_FACTOR));

  


    rectangleVisualization = (
      <div
        className="ner"
        style={{
          margin: '2rem auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '320px',
          width: '100%',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 'min(96vw, 800px)',
            height: 'min(80vw, 280px)',
            maxWidth: '800px',
            maxHeight: '280px',
            background: 'transparent',
            borderRadius: '12px',
            border: '1.5px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'relative', width: `${sbaWidth}px`, height: `${sbaHeight}px`, margin: '0 auto' }}>
            {/* SBA Rectangle */}
            <div style={{
              width: '100%',
              height: '100%',
              background: '#fffde7',
              border: '3px solid #ffd600',
              borderRadius: '6px',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ color: '#616161', fontWeight: 400, fontSize: '.80rem', textAlign: 'center' }}>
                Super Built-up<br />{Number(plotArea).toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq ft
              </span>
              {/* SBA width label (top edge) */}
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#616161', fontWeight: 400, background: '#fffde7', padding: '0 4px', borderRadius: '3px' }}>
                {Number(width).toFixed(2)} ft
              </span>
              {/* SBA height label (left border, vertical) */}
              <span style={{
                position: 'absolute',
                left: '-23px',
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                fontSize: '0.55rem',
                color: '#616161',
                fontWeight: 400,
                background: '#fffde7',
                padding: '0 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap'
              }}>
                {Number(depth).toFixed(2)} ft
              </span>
            </div>
            {/* Build-up area Rectangle */}
            <div style={{
              width: `${buaWidth}px`,
              height: `${buaHeight}px`,
              background: '#e3f2fd',
              border: '2px solid #1976d2',
              borderRadius: '6px',
              position: 'absolute',
              top: `${(sbaHeight - buaHeight) / 2}px`,
              left: `${(sbaWidth - buaWidth) / 2}px`,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ color: '#1976d2', fontWeight: 400, fontSize: '.80rem', textAlign: 'center' }}>
                Build-up Area<br />{(plotArea * (buildupPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq ft
              </span>
              {/* BUA width label (top edge) */}
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#1976d2', fontWeight: 400, background: '#e3f2fd', padding: '0 4px', borderRadius: '3px' }}>
                {(Number(width) * (buildupPercent/100)).toFixed(2)} ft
              </span>
              {/* BUA height label (left border, vertical) */}
              <span style={{
                position: 'absolute',
                left: '-23px',
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                fontSize: '0.55rem',
                color: '#1976d2',
                fontWeight: 400,
                background: '#e3f2fd',
                padding: '0 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap'
              }}>
                {(Number(depth) * (buildupPercent/100)).toFixed(2)} ft
              </span>
            </div>
            {/* Carpet area Rectangle */}
            <div style={{
              width: `${caWidth}px`,
              height: `${caHeight}px`,
              background: '#fce4ec',
              border: '2px solid #d81b60',
              borderRadius: '6px',
              position: 'absolute',
              top: `${(sbaHeight - caHeight) / 2}px`,
              left: `${(sbaWidth - caWidth) / 2}px`,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ color: '#d81b60', fontWeight: 400, fontSize: '.80rem', textAlign: 'center' }}>
                Carpet Area<br />{(plotArea * (carpetPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq ft
              </span>
              {/* Carpet width label (top edge) */}
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#d81b60', fontWeight: 400, background: '#fce4ec', padding: '0 4px', borderRadius: '3px' }}>
                {(Number(width) * (carpetPercent/100)).toFixed(2)} ft
              </span>
              {/* Carpet height label (left border, vertical) */}
              <span style={{
                position: 'absolute',
                left: '-23px',
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                fontSize: '0.55rem',
                color: '#d81b60',
                fontWeight: 400,
                background: '#fce4ec',
                padding: '0 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap'
              }}>
                {(Number(depth) * (carpetPercent/100)).toFixed(2)} ft
              </span>
            </div>
            {/* Grid below Carpet Area Rectangle */}
            
          </div>
        </div>
      </div>
    );
  }

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
      <h2 className="text-center text-primary mb-4" style={{ fontWeight: 700, letterSpacing: '1px' }}>Project Estimation Calculator</h2>
      {/* Step Indicator */}
      <div className="wizard-indicator">
        {[1,2,3].map(s => (
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
            <Row className="mb-3">
              <Col md={4} sm={12}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.95rem' }}>Select City</Form.Label>
                  <Form.Select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                    <option value="">Select City</option>
                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2} sm={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.95rem' }}>SBA Width (ft)</Form.Label>
                  <Form.Control type="number" value={width} onChange={e => setWidth(e.target.value)} min={1} />
                </Form.Group>
              </Col>
              <Col md={2} sm={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.95rem' }}>SBA Length (ft)</Form.Label>
                  <Form.Control type="number" value={depth} onChange={e => setDepth(e.target.value)} min={1} />
                </Form.Group>
              </Col>
              <Col md={2} sm={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.95rem' }}>Build-up Area (%)</Form.Label>
                  <Form.Control type="number" value={buildupPercent} min={1} max={100} onChange={e => setBuildupPercent(Number(e.target.value))} />
                </Form.Group>
              </Col>
              <Col md={2} sm={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.95rem' }}>Carpet Area (%)</Form.Label>
                  <Form.Control type="number" value={carpetPercent} min={1} max={100} onChange={e => setCarpetPercent(Number(e.target.value))} />
                </Form.Group>
              </Col>
            </Row>
            {/* Out side Rectangle */}
            {rectangleVisualization}

 {/* Area Definitions Grid */}

<div style={{
  width: '100%',
  maxWidth: '600px',
  margin: '2rem auto',
  background: '#fafafa',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #e0e0e0',
  padding: '12px 8px',
  fontSize: '.95rem',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch'
}}>
  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead>
      <tr style={{ background: '#f5f5f5' }}>
        <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, color: '#333', borderBottom: '1px solid #e0e0e0' }}>Type</th>
        <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, color: '#333', borderBottom: '1px solid #e0e0e0' }}>Area (sq ft)</th>
        <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, color: '#333', borderBottom: '1px solid #e0e0e0' }}>Definition</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style={{ padding: '8px', color: '#616161' }}>Super Built-up</td>
        <td style={{ padding: '8px', color: '#616161' }}>
          {Number(width) && Number(depth) ? (Number(width) * Number(depth)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
        </td>
        <td style={{ padding: '8px', color: '#616161' }}>Total area including common spaces (lobby, stairs, etc.)</td>
      </tr>
      <tr>
        <td style={{ padding: '8px', color: '#1976d2' }}>Build-up Area</td>
        <td style={{ padding: '8px', color: '#1976d2' }}>
          {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (buildupPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
        </td>
        <td style={{ padding: '8px', color: '#1976d2' }}>Usable area including walls, balcony, etc.</td>
      </tr>
      <tr>
        <td style={{ padding: '8px', color: '#d81b60' }}>Carpet Area</td>
        <td style={{ padding: '8px', color: '#d81b60' }}>
          {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (carpetPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
        </td>
        <td style={{ padding: '8px', color: '#d81b60' }}>Actual area within walls (where carpet can be laid)</td>
      </tr>
    </tbody>
  </table>
</div>



          </Form>
        )}

        {step === 2 && (
          <>
            {/* Top summary section for area values */}
            <div className="d-flex justify-content-center" style={{ marginBottom: '2rem' }}>
              <div className="row w-100" style={{ maxWidth: 600 }}>
                <div className="col-12 col-md-4 mb-3 mb-md-0">
                  <div style={{ background: '#e3f2fd', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(33,150,243,0.07)', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1976d2', fontSize: '0.85rem' }}>Super Built-up</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>
                      {Number(width) && Number(depth) ? (Number(width) * Number(depth)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4 mb-3 mb-md-0">
                  <div style={{ background: '#e8f5e9', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(76,175,80,0.07)', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#388e3c', fontSize: '0.85rem' }}>Build-up Area</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>
                      {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (buildupPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div style={{ background: '#fce4ec', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(233,30,99,0.07)', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#d81b60', fontSize: '0.85rem' }}>Carpet Area</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>
                      {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (carpetPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Controls section */}
            <div className="d-flex justify-content-center">
              <div style={{ width: '100%', maxWidth: 600, padding: '0 16px' }}>
                <Form>
                  <Row style={{ marginBottom: '2.5rem', marginTop: '-1.5rem' }}>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label>Number of Floors</Form.Label>
                        <Form.Control type="number" value={floors} onChange={e => setFloors(e.target.value)} min={1} />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label>Lift Requirement</Form.Label>
                        <Form.Check type="switch" label="Lift Required" checked={lift} onChange={e => setLift(e.target.checked)} />
                      </Form.Group>
                    </Col>
                  </Row>
                  {/* Dynamic Section Rendering for Floors */}
                  <div style={{ marginBottom: '2rem' }}>
                    {[...Array(Number(floors) + 1).keys()].map(floorIdx => (
                      <div key={floorIdx} className="section-responsive" style={{
                        background: floorIdx === 0 ? '#e3f2fd' : '#fff',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: '1px solid #e0e0e0',
                        padding: '18px 8px',
                        marginBottom: '1.5rem',
                        maxWidth: '100%',
                        overflowX: 'auto'
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 12, color: floorIdx === 0 ? '#1976d2' : '#388e3c' }}>
                          {floorIdx === 0
                            ? 'Ground Floor'
                            : `${floorIdx === 1 ? '1st' : floorIdx === 2 ? '2nd' : floorIdx === 3 ? '3rd' : floorIdx + 'th'} Floor`}
                        </div>
                        {floorIdx === 0 ? (
                          <div style={{ width: '100%', overflowX: 'auto' }}>
                            <table style={{ minWidth: 320, width: '100%', borderCollapse: 'collapse', fontSize: '0.97rem' }}>
                              <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Type</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Area (sq ft)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Super Built-up</td>
                                  <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                    {Number(width) && Number(depth) ? (Number(width) * Number(depth)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ marginTop: 0, width: '100%', overflowX: 'auto' }}>
                            <div style={{ fontWeight: 500, fontSize: '0.98rem', marginBottom: 8, color: floorIdx === 0 ? '#1976d2' : '#388e3c' }}>BHK Configuration</div>
                            {floorIdx > 1 && (
                              <Form.Select size="sm" style={{ maxWidth: 140, marginBottom: 8 }} onChange={e => copyFloorConfig(Number(e.target.value), floorIdx)} defaultValue="">
                                <option value="">Copy from...</option>
                                {[...Array(Number(floors) + 1).keys()].filter(i => i !== 0 && i !== floorIdx).map(i => (
                                  <option key={i} value={i}>{i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`}</option>
                                ))}
                              </Form.Select>
                            )}
                            <table style={{ minWidth: 480, width: '100%', borderCollapse: 'collapse', fontSize: '0.97rem' }}>
                              <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>BHK Type</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}># of Units</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Carpet Area (Sq ft)</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Total Area</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Typical Rooms</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {(floorBHKConfigs[floorIdx] || bhkRows).map((row, idx) => (
                                  <tr key={idx}>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      <Form.Select value={row.type} onChange={e => handleFloorCellChange(floorIdx, idx, 'type', e.target.value)} size="sm">
                                        <option value="">Select</option>
                                        <option value="1 BHK">1 BHK</option>
                                        <option value="2 BHK">2 BHK</option>
                                        <option value="3 BHK">3 BHK</option>
                                        <option value="4 BHK">4 BHK</option>
                                      </Form.Select>
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      <Form.Control type="number" value={row.units} min={1} size="sm" onChange={e => handleFloorCellChange(floorIdx, idx, 'units', e.target.value)} />
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      <Form.Control type="number" value={row.area} min={1} size="sm" onChange={e => handleFloorCellChange(floorIdx, idx, 'area', e.target.value)} />
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      {(row.units * row.area).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      <Form.Control type="text" value={row.rooms} size="sm" onChange={e => handleFloorCellChange(floorIdx, idx, 'rooms', e.target.value)} />
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                                      <Button variant="outline-danger" size="sm" onClick={() => handleFloorRemoveRow(floorIdx, idx)} disabled={getFloorRows(floorIdx).length === 1}>Remove</Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                              <Button variant="outline-primary" size="sm" onClick={() => handleFloorAddRow(floorIdx)}>Add Row</Button>
                              <div style={{ fontWeight: 600, color: (() => {
                                const rows = getFloorRows(floorIdx);
                                const gridTotalArea = rows.reduce((sum, row) => sum + row.units * row.area, 0);
                                return gridTotalArea === totalCarpetArea ? '#388e3c' : '#d81b60';
                              })() }}>
                                Total Area: {(() => {
                                  const rows = getFloorRows(floorIdx);
                                  return rows.reduce((sum, row) => sum + row.units * row.area, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                })()} sq ft
                                {(() => {
                                  const rows = getFloorRows(floorIdx);
                                  const gridTotalArea = rows.reduce((sum, row) => sum + row.units * row.area, 0);
                                  return gridTotalArea !== totalCarpetArea ? (
                                    <span style={{ marginLeft: 8, color: '#d81b60', fontWeight: 500 }}>
                                      (Carpet Area: {totalCarpetArea.toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                              <Button variant="warning" size="sm" onClick={() => handleFloorAdjust(floorIdx)}>Adjust</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* BHK Grid Section (unchanged) */}
                  
                </Form>
              </div>
            </div>
          </>
        )}


        {step === 3 && (
          <>
            

            {/* Wrap all cost-related elements in a fragment to avoid adjacent JSX error */}
            <>
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
                        <div className="d-flex align-items-center mb-2 mb-md-0" style={{ minWidth: '170px', maxWidth: '240px' }}>
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
            </>
          </>
        )}
        </div>
      {/* Navigation Buttons */}
      <div className="wizard-nav-btns mt-4">
        <Button disabled={step === 1} onClick={() => setStep(step-1)} className="me-2">Back</Button>
        <Button disabled={step === 3} onClick={() => setStep(step+1)}>Next</Button>
      </div>
    </div>
  );
};

export default PricingCalculator;
