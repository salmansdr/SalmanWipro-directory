import React, { useState, useEffect } from 'react';


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
    <div className="construction-report">
      <h2>Building Construction Report</h2>
      <div className="report-dropdown-section">
        <label htmlFor="project-select" className="dropdown-label">Select Project:</label>
        <select
          id="project-select"
          className="modern-dropdown"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">-- Select --</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {selectedProject && (
        <div className="report-summary-section card-style">
          <h3 className="section-heading">Project Summary</h3>
          <div className="summary-grid">
            <div><span className="summary-label">Location:</span> {selectedProject.location}</div>
            <div><span className="summary-label">Start Date:</span> {selectedProject.startDate}</div>
            <div><span className="summary-label">End Date:</span> {selectedProject.endDate}</div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="report-phase-table-section card-style">
          <h3 className="section-heading">Phase Cost Tracking</h3>
          <div className="phase-grid">
            <div className="phase-grid-header">Phase</div>
            <div className="phase-grid-header">Estimated Cost (₹)</div>
            <div className="phase-grid-header">Actual Cost (₹)</div>
            <div className="phase-grid-header">Variance (₹)</div>
            <div className="phase-grid-header">Variance (%)</div>
            {PHASES.map(phase => {
              const est = samplePhaseCosts[phase]?.estimated || 0;
              const act = samplePhaseCosts[phase]?.actual || 0;
              const variance = act - est;
              const variancePerc = est ? ((variance / est) * 100).toFixed(2) : '0.00';
              return [
                <div key={phase + '-name'} className="phase-grid-cell phase-name">{phase}</div>,
                <div key={phase + '-est'} className="phase-grid-cell phase-est">{est.toLocaleString()}</div>,
                <div key={phase + '-act'} className="phase-grid-cell phase-act">{act.toLocaleString()}</div>,
                <div key={phase + '-var'} className={`phase-grid-cell phase-var${variance > 0 ? ' over' : ' under'}`}>{variance.toLocaleString()}</div>,
                <div key={phase + '-varp'} className={`phase-grid-cell phase-varp${variance > 0 ? ' over' : ' under'}`}>{variancePerc}%</div>
              ];
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
