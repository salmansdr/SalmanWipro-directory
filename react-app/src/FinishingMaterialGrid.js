import React, { useEffect, useState } from 'react';
import { evaluate } from 'mathjs';

// Utility to evaluate formulas with context
function evaluateFinishingFormula(formula, context) {
  try {
    const expr = formula.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      if (Object.prototype.hasOwnProperty.call(context, match)) {
        return context[match];
      }
      return 0;
    });
    return evaluate(expr);
  } catch (e) {
    return 0;
  }
}

// Group finishing material data by node (category)
function groupFinishingMaterialData(json) {
  return Object.entries(json).map(([category, items]) => ({
    category,
    items
  }));
}



const FinishingMaterialGrid = ({ summaryContext }) => {
  const [data, setData] = useState(null);
    const [baseQtys, setBaseQtys] = useState({});
    const [wastages, setWastages] = useState({});
    const [rates, setRates] = useState({});
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/FinsishingMaterialCalculation.json')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(() => setData(null));
  }, []);

  if (!data) return <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>Loading finishing material data...</div>;

  const grouped = groupFinishingMaterialData(data);
  // Get unique categories for filter dropdown
  const categoryOptions = Object.keys(data);

  return (
  <div className="step5-table-responsive" style={{ margin: '2rem 0', background: '#fff', padding: 0, maxHeight: 600, overflowY: 'auto' }}>
      
      <table className="step5-material-table" style={{ width: '100%', fontSize: '0.93rem', background: '#fff', borderCollapse: 'collapse', borderSpacing: 0, border: '1px solid #d0d7e1' }}>
        <thead style={{ background: '#eaf4fb' }}>
          <tr>
            <th style={{
              padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
              position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2,
              minWidth: 120
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
                Category
                <span
                  style={{ cursor: 'pointer', marginLeft: 4, display: 'flex', alignItems: 'center' }}
                  onClick={e => { e.stopPropagation(); setShowCategoryDropdown(v => !v); }}
                  title="Filter by Category"
                >
                  {/* Funnel SVG icon, blue */}
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="#1976d2" style={{ display: 'block' }}>
                    <path d="M3 5a1 1 0 0 1 1-1h12a1 1 0 0 1 .8 1.6l-4.6 6.4V16a1 1 0 0 1-1.447.894l-2-1A1 1 0 0 1 8 15v-3.01L3.2 6.6A1 1 0 0 1 3 5z"/>
                  </svg>
                </span>
                {showCategoryDropdown && (
                  <div
                    style={{
                      position: 'absolute', top: 28, left: 0, background: '#fff', border: '1px solid #b0c4d7', borderRadius: 6,
                      boxShadow: '0 2px 8px #d0d7e1', zIndex: 10, minWidth: 120, padding: '4px 0',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ padding: '2px 12px', cursor: 'pointer', color: categoryFilter === 'All' ? '#1976d2' : '#333', fontWeight: categoryFilter === 'All' ? 600 : 400 }}
                      onClick={() => { setCategoryFilter('All'); setShowCategoryDropdown(false); }}
                    >All</div>
                    {categoryOptions.map(cat => (
                      <div
                        key={cat}
                        style={{ padding: '2px 12px', cursor: 'pointer', color: categoryFilter === cat ? '#1976d2' : '#333', fontWeight: categoryFilter === cat ? 600 : 400 }}
                        onClick={() => { setCategoryFilter(cat); setShowCategoryDropdown(false); }}
                      >{cat}</div>
                    ))}
                  </div>
                )}
              </span>
            </th>
              <th style={{
                padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
                position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
              }}>Material</th>
              <th style={{
                padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
                position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
              }}>Formula</th>
              <th style={{
                padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
                position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
              }}>Base Qty</th>
              <th style={{
                padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
                position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
              }}>Wastage (%)</th>
              <th style={{
                padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
                position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
              }}>Total Qty</th>
              <th style={{
                padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
                position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
              }}>Unit</th>
              <th style={{
                padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
                position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
              }}>Rate/Unit</th>
              <th style={{
                padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
                position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
              }}>Cost (₹)</th>
          </tr>
        </thead>
        <tbody>
          {grouped
            .filter(({ category }) => categoryFilter === 'All' || category === categoryFilter)
            .map(({ category, items }) => (
              <React.Fragment key={category}>
                <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                  <td colSpan={9} style={{ border: '1px solid #d0d7e1', fontSize: '0.97em', padding: '7px 6px' }}>{category}</td>
                </tr>
                {items.map((item) => {
                const key = `${category}-${item.material}`;
                const defaultBaseQty = evaluateFinishingFormula(item.quantity_formula, summaryContext);
                const baseQty = baseQtys[key] !== undefined ? parseFloat(baseQtys[key]) : defaultBaseQty;
                const wastage = wastages[key] !== undefined ? parseFloat(wastages[key]) : (item.wastage_percent || 0);
                const totalQty = baseQty * (1 + (wastage || 0) / 100);
                const rate = rates[key] !== undefined ? parseFloat(rates[key]) : '';
                const cost = totalQty && rate ? totalQty * rate : 0;
                return (
                  <tr key={item.material}>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{category}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{item.material}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{item.quantity_formula}</td>
                    <td style={{ textAlign: 'right', border: '1px solid #d0d7e1', padding: '7px 6px' }}>
                      <input
                        type="number"
                        value={baseQty}
                        min="0"
                        step="0.01"
                        style={{ width: 80, textAlign: 'right', border: '1px solid #ccc', borderRadius: 4, padding: '2px 6px', fontSize: '0.95em' }}
                        onChange={e => setBaseQtys(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    </td>
                    <td style={{ textAlign: 'right', border: '1px solid #d0d7e1', padding: '7px 6px' }}>
                      <input
                        type="number"
                        value={wastage}
                        min="0"
                        step="0.01"
                        style={{ width: 60, textAlign: 'right', border: '1px solid #ccc', borderRadius: 4, padding: '2px 6px', fontSize: '0.95em' }}
                        onChange={e => setWastages(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    </td>
                    <td style={{ textAlign: 'right',  border: '1px solid #d0d7e1', padding: '7px 6px' }}>{totalQty ? totalQty.toFixed(0).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{item.unit}</td>
                    <td style={{ textAlign: 'right', border: '1px solid #d0d7e1', padding: '7px 6px' }}>
                      <input
                        type="number"
                        value={rate}
                        min="0"
                        step="0.01"
                        style={{ width: 80, textAlign: 'right', border: '1px solid #ccc', borderRadius: 4, padding: '2px 6px', fontSize: '0.95em' }}
                        onChange={e => setRates(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder="Rate"
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, border: '1px solid #d0d7e1', padding: '7px 6px', color: '#388e3c' }}>
                      {cost ? `₹${cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinishingMaterialGrid;
