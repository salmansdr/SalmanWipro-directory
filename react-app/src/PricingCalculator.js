import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
import './Styles/WizardSteps.css';

function PricingCalculator() {


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



  // Step state for wizard
  const [step, setStep] = useState(1);

  // Cost level state
  const [costLevel, setCostLevel] = useState('basic');

  // Open/close state for cost categories (all collapsed by default)
  const [openCategory, setOpenCategory] = useState([]);

  // Toggle category open/close
  const toggleCategory = (category) => {
    setOpenCategory(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="wizard-container calculator-container" style={{ maxWidth: '900px' }}>
            {sampleCostData.map(cat => {
              const catLevel = costLevel;
              const isOpen = openCategory.includes(cat.category);
              const total = cat.details.reduce((sum, item) => sum + item.qty * item.rate[catLevel], 0);
              const catCostDisplay = `₹${total.toLocaleString('en-IN')}`;
              return (
                <div key={cat.category} className="cost-category mb-4">
                  <div
                    className="cost-category-header d-flex align-items-center justify-content-between"
                    style={{ cursor: 'pointer', background: '#f7f7f7', borderRadius: '8px', padding: '0.7rem 1.2rem', boxShadow: '0 1px 4px rgba(33,150,243,0.07)' }}
                    onClick={() => toggleCategory(cat.category)}
                  >
                    <div className="row w-100 align-items-center gx-2 gy-2">
                      <div className="col-4 d-flex align-items-center" style={{ minWidth: '120px', maxWidth: '180px' }}>
                        <span style={{ fontSize: '1.2rem', color: '#1976d2', marginRight: '8px' }}>
                          {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                        <h5 style={{ margin: 0, wordBreak: 'break-word' }}>{cat.category}</h5>
                      </div>
                      <div className="col-5 d-flex flex-column flex-md-row">
                        {costLevels.map(level => (
                          <div className="form-check mb-2 mb-md-0 me-md-3" key={level.key}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name={`level-${cat.category}`}
                              checked={catLevel === level.key}
                              onChange={() => setCostLevel(level.key)}
                            />
                            <label className="form-check-label ms-2">{level.label}</label>
                          </div>
                        ))}
                      </div>
                      <div className="col-3 d-flex align-items-center justify-content-end">
                        <span style={{ fontWeight: 'bold', color: '#1976d2', fontSize: '1.1rem' }}>{catCostDisplay}</span>
                      </div>
                    </div>
                    {/* Removed duplicate cost column below header row */}
                  </div>
                  {isOpen && (
                    <div className="cost-category-details" style={{ marginTop: '0.7rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(33,150,243,0.08)', padding: '0.7rem 1.2rem' }}>
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th style={{width: '140px'}}>Item</th>
                            <th style={{width: '80px'}}>Qty</th>
                            <th style={{width: '80px'}}>Unit</th>
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
      {/* Total Estimated Cost Row */}
      <div className="total-estimated-cost" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1976d2', margin: '2rem 0 1.5rem 0', textAlign: 'right' }}>
        Total Estimated Cost: ₹{sampleCostData.reduce((sum, cat) => sum + cat.details.reduce((catSum, item) => catSum + item.qty * item.rate[costLevel], 0), 0).toLocaleString('en-IN')}
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-nav-btns mt-4">
        <Button disabled={step === 1} onClick={() => setStep(step-1)} className="me-2">Back</Button>
        <Button disabled={step === 4} onClick={() => setStep(step+1)}>Next</Button>
      </div>
    </div>
  );
}

export default PricingCalculator;

