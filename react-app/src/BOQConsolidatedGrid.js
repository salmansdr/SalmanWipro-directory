import React, { useState } from 'react';

// BOQConsolidatedGrid: Renders a consolidated table for BOQ items (civil + finishing materials)
// Props:
//   data: Array of items (each item should have at least: material, totalQty, unit, and optionally category)
//
// Example usage:
// <BOQConsolidatedGrid data={boqItems} />


const BOQConsolidatedGrid = ({ data, brandRateMap }) => {
  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  // State for rate and brand per row (keyed by category+material)
  const [rowState, setRowState] = useState({});

  if (!data || data.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>No BOQ data available.</div>;
  }

  // Group data by category
  const grouped = data.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});



  // Helper to get brand options for a row
  // Use normalized fields for lookup, original for display
  const getBrandOptions = (materialNorm, unitNorm) => {
    const key = `${materialNorm}__${unitNorm}`;
    if (brandRateMap && brandRateMap[key] && Array.isArray(brandRateMap[key].brands)) {
      return ['Select', ...brandRateMap[key].brands.map(b => b.brand_name)];
    }
    return ['Select'];
  };

  const getDefaultBrand = (materialNorm, unitNorm) => {
    const key = `${materialNorm}__${unitNorm}`;
    if (brandRateMap && brandRateMap[key] && brandRateMap[key].default_brand) {
      return brandRateMap[key].default_brand;
    }
    return 'Select';
  };

  const getRateForBrand = (materialNorm, unitNorm, brandName) => {
    const key = `${materialNorm}__${unitNorm}`;
    if (brandRateMap && brandRateMap[key] && Array.isArray(brandRateMap[key].brands)) {
      const found = brandRateMap[key].brands.find(b => b.brand_name === brandName);
      return found ? found.rate_per_unit : '';
    }
    return '';
  };


  const handleBrandChange = (rowKey, materialNorm, unitNorm, value) => {
    // When brand changes, auto-set rate if available
    const rate = getRateForBrand(materialNorm, unitNorm, value);
    setRowState(prev => ({
      ...prev,
      [rowKey]: {
        ...prev[rowKey],
        brand: value,
        rate: rate !== '' ? rate : prev[rowKey]?.rate || ''
      }
    }));
  };

  const handleRateChange = (rowKey, value) => {
    const num = Number(value);
    setRowState(prev => ({ ...prev, [rowKey]: { ...prev[rowKey], rate: isNaN(num) ? '' : num } }));
  };

  // Get unique categories for filter dropdown
  const categoryOptions = Object.keys(grouped);

  return (
    <div>
      {/* DEBUG: Show number of data rows for troubleshooting */}
      <div style={{ color: '#d81b60', fontWeight: 600, marginBottom: 8, fontSize: 16 }}>DEBUG: Data rows: {Array.isArray(data) ? data.length : 0}</div>
      <div className="step5-table-responsive" style={{ margin: '2rem 0', background: '#fff', padding: 0, maxHeight: 600, overflowY: 'auto' }}>
      {/* Standardized filter textbox */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px 0' }}>
        <label htmlFor="boqFilterText" style={{ fontWeight: 400, marginRight: 4, whiteSpace: 'nowrap' }}>Filter:</label>
        <input
          id="boqFilterText"
          type="text"
          value={categoryFilter === 'All' ? '' : categoryFilter}
          onChange={e => setCategoryFilter(e.target.value || 'All')}
          placeholder="Type to filter..."
          style={{ width: 140, minWidth: 0, padding: '6px 10px', borderRadius: 4, border: '1px solid #bdbdbd', fontSize: '1em' }}
        />
      </div>
      <table
        className="step5-material-table"
        style={{
          width: '100%',
          fontSize: '0.93rem',
          background: '#fff',
          borderCollapse: 'collapse',
          borderSpacing: 0,
          border: '1px solid #d0d7e1',
          boxShadow: '0 2px 8px rgba(33,150,243,0.07)',
          borderRadius: '8px'
        }}
      >
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
            }}>Total Qty</th>
            <th style={{
              padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
              position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
            }}>Unit</th>
            <th style={{
              padding: '8px 6px', fontWeight: 600, color: '#1976d2', border: '1px solid #d0d7e1', fontSize: '0.98em',
              position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2
            }}>Brand Name</th>
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
          {Object.entries(grouped)
            .filter(([category]) => categoryFilter === 'All' || category === categoryFilter)
            .map(([category, items]) => {
              // Calculate subtotal for this category
              let subTotal = 0;
              const rows = items.map((item, idx) => {
                const rowKey = `${category}__${item.material}`;
                let brand = rowState[rowKey]?.brand;
                let rate = rowState[rowKey]?.rate;
                if (!brand || brand === 'Select') {
                  brand = getDefaultBrand(item.materialNorm || item.material, item.unitNorm || item.unit);
                  if ((rate === undefined || rate === '') && brand && brand !== 'Select') {
                    rate = getRateForBrand(item.materialNorm || item.material, item.unitNorm || item.unit, brand);
                  }
                }
                if (rate === undefined) rate = '';
                const qty = Math.round(item.totalQty);
                const cost = rate && qty ? Math.round(rate * qty) : '';
                if (cost) subTotal += Number(cost);
                const brandOptions = getBrandOptions(item.materialNorm || item.material, item.unitNorm || item.unit);
                return (
                  <tr key={rowKey}>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{category}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{item.material}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px', textAlign: 'right' }}>{qty}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{item.unit}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>
                      <select value={brand} onChange={e => handleBrandChange(rowKey, item.materialNorm || item.material, item.unitNorm || item.unit, e.target.value)} style={{ width: '100%' }}>
                        {brandOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>
                      <input
                        type="number"
                        value={rate}
                        min={0}
                        onChange={e => handleRateChange(rowKey, e.target.value)}
                        style={{ width: 80, textAlign: 'right', border: '1px solid #ccc', borderRadius: 4, padding: '2px 6px', fontSize: '0.95em' }}
                      />
                    </td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px', textAlign: 'right', fontWeight: 500 }}>{cost ? cost.toLocaleString('en-IN') : ''}</td>
                  </tr>
                );
              });
              // Subtotal row for this category
              return [
                <tr key={category} style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                  <td colSpan={7} style={{ border: '1px solid #d0d7e1', fontSize: '0.97em', padding: '7px 6px' }}>{category}</td>
                </tr>,
                ...rows,
                <tr key={category + '-subtotal'} style={{ background: '#e3f2fd', fontWeight: 600 }}>
                  <td colSpan={6} style={{ textAlign: 'right', border: '1px solid #d0d7e1', padding: '7px 6px' }}>Sub Total</td>
                  <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px', textAlign: 'right', color: '#1976d2', fontWeight: 700 }}>₹{subTotal ? subTotal.toLocaleString('en-IN') : ''}</td>
                </tr>
              ];
            })}
          {/* Grand Total row */}
          <tr style={{ background: '#1976d2', color: '#fff', fontWeight: 700 }}>
            <td colSpan={6} style={{ textAlign: 'right', border: '1px solid #1976d2', padding: '9px 6px', fontSize: '1.05em' }}>Grand Total</td>
            <td style={{ border: '1px solid #1976d2', padding: '9px 6px', textAlign: 'right', fontSize: '1.05em' }}>
              {(() => {
                let grand = 0;
                Object.entries(grouped)
                  .filter(([category]) => categoryFilter === 'All' || category === categoryFilter)
                  .forEach(([category, items]) => {
                    items.forEach(item => {
                      const rowKey = `${category}__${item.material}`;
                      let brand = rowState[rowKey]?.brand;
                      let rate = rowState[rowKey]?.rate;
                      if (!brand || brand === 'Select') {
                        brand = getDefaultBrand(item.materialNorm || item.material, item.unitNorm || item.unit);
                        if ((rate === undefined || rate === '') && brand && brand !== 'Select') {
                          rate = getRateForBrand(item.materialNorm || item.material, item.unitNorm || item.unit, brand);
                        }
                      }
                      if (rate === undefined) rate = '';
                      const qty = Math.round(item.totalQty);
                      const cost = rate && qty ? Math.round(rate * qty) : '';
                      if (cost) grand += Number(cost);
                    });
                  });
                return `₹${grand.toLocaleString('en-IN')}`;
              })()}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default BOQConsolidatedGrid;
