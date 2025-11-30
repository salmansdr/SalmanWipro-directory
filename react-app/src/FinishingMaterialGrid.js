import React, { useState, useCallback, useEffect } from 'react';
import { evaluate } from 'mathjs';

// Utility to evaluate formulas with context
function evaluateFinishingFormula(formula, context, item = {}) {
  try {
    const expr = formula.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      if (Object.prototype.hasOwnProperty.call(context, match)) {
        return context[match];
      }
      if (Object.prototype.hasOwnProperty.call(item, match)) {
        return item[match];
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




const FinishingMaterialGrid = ({ summaryContext, data, onDataChange, materialRateConfig }) => {
  const [baseQtys, setBaseQtys] = useState({});
  const [wastages, setWastages] = useState({});
  // Removed rates and setRates as Rate/Unit and Cost columns are not used
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [originalFormulas, setOriginalFormulas] = useState({});

  // Load original formulas from JSON file when component mounts
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/FinsishingMaterialCalculation.json')
      .then(res => res.json())
      .then(json => {
        const formulaMap = {};
        Object.entries(json).forEach(([category, items]) => {
          items.forEach((item) => {
            const key = `${category}-${item.material}`;
            formulaMap[key] = item.quantity_formula;
          });
        });
        setOriginalFormulas(formulaMap);
      });
  }, []);

  // Sync persisted manual base quantities with local state when data changes
  useEffect(() => {
    if (data) {
      const newBaseQtys = {};
      const newWastages = {};
      
      Object.entries(data).forEach(([category, items]) => {
        items.forEach((item, itemIndex) => {
          const itemId = `${category}-${itemIndex}-${item.quantity_formula}`;
          
          // Load persisted manual base quantity if it exists
          // If manual_base_qty is undefined, we should NOT set anything in newBaseQtys
          // so that it falls back to formula calculation
          if (item.manual_base_qty !== undefined) {
            newBaseQtys[itemId] = item.manual_base_qty;
          }
          
          // Load persisted wastage if it exists
          if (item.wastage_percent !== undefined) {
            newWastages[itemId] = item.wastage_percent;
          }
        });
      });
      
      // Replace the entire state instead of merging to ensure cleared values are actually cleared
      setBaseQtys(newBaseQtys);
      setWastages(newWastages);
    }
  }, [data]);

  // Function to fix corrupted formulas by restoring from original JSON
  const fixCorruptedFormulas = useCallback(() => {
    if (data && onDataChange && Object.keys(originalFormulas).length > 0) {
      const fixedData = { ...data };
      let hasChanges = false;
      
      Object.entries(fixedData).forEach(([category, items]) => {
        items.forEach((item, itemIndex) => {
          // Check if formula is corrupted (missing or "0")
          if (!item.quantity_formula || item.quantity_formula === "0") {
            const originalKey = `${category}-${item.material}`;
            const originalFormula = originalFormulas[originalKey];
            
            if (originalFormula) {
              console.log(`Fixing corrupted formula for ${category} - ${item.material}: "${item.quantity_formula}" → "${originalFormula}"`);
              fixedData[category][itemIndex] = {
                ...item,
                quantity_formula: originalFormula
              };
              hasChanges = true;
            }
          }
        });
      });
      
      if (hasChanges) {
        console.log('Fixed corrupted formulas, updating data...');
        onDataChange(fixedData);
      }
    }
  }, [data, onDataChange, originalFormulas]);

  // Auto-fix corrupted formulas when original formulas are loaded or data changes
  useEffect(() => {
    if (Object.keys(originalFormulas).length > 0) {
      fixCorruptedFormulas();
    }
  }, [originalFormulas, fixCorruptedFormulas]);

  // Helper function to get materials from MaterialRate.json filtered by category
  const getMaterialsForCategory = useCallback((category) => {
    if (!materialRateConfig) return [];
    
    // Dynamic category matching: try exact match first, then case-insensitive match
    let targetCategory = null;
    
    // 1. Try exact match
    if (materialRateConfig[category]) {
      targetCategory = category;
    } else {
      // 2. Try case-insensitive match
      const availableCategories = Object.keys(materialRateConfig);
      targetCategory = availableCategories.find(cat => 
        cat.toLowerCase() === category.toLowerCase()
      );
      
      // 3. Try partial match (contains)
      if (!targetCategory) {
        targetCategory = availableCategories.find(cat => 
          cat.toLowerCase().includes(category.toLowerCase()) || 
          category.toLowerCase().includes(cat.toLowerCase())
        );
      }
    }
    
    // Get materials from the matched category in MaterialRate.json
    if (targetCategory && materialRateConfig[targetCategory] && Array.isArray(materialRateConfig[targetCategory])) {
      return materialRateConfig[targetCategory].map(item => ({
        material: item.material,
        unit: item.unit,
        brands: item.brands || [],
        default_brand: item.default_brand
      }));
    }
    
    return [];
  }, [materialRateConfig]);

  // Handler for material selection change
  const handleMaterialChange = useCallback((category, originalMaterial, newMaterial, itemIndex, quantityFormula) => {
    // Check if the new material is already used in the same category
    if (data && data[category]) {
      const isDuplicate = data[category].some((item, idx) => 
        idx !== itemIndex && item.material === newMaterial
      );
      
      if (isDuplicate) {
        alert(`"${newMaterial}" is already added to ${category} category. Please select a different material.`);
        return; // Don't proceed with the change
      }
    }
    
    // Update the actual data structure
    if (onDataChange && data) {
      const updatedData = { ...data };
      if (updatedData[category]) {
        // Create stable item identifier
        const itemId = `${category}-${itemIndex}-${quantityFormula}`;
        const oldKey = `${category}-${originalMaterial}`;
        const newKey = `${category}-${newMaterial}`;
        
        // IMPORTANT: Clear stored baseQty values to force recalculation from formula
        // This ensures that when material changes, the base quantity is recalculated
        // based on the formula rather than using the old stored value
        setBaseQtys(prev => {
          const newState = { ...prev };
          // Remove all old keys to force fresh calculation
          delete newState[oldKey];
          delete newState[newKey];
          delete newState[itemId];
          // Also remove manual_base_qty to force formula recalculation
          return newState;
        });
        
        // Transfer wastage values since they should persist across material changes
        if (wastages[oldKey] !== undefined && wastages[itemId] === undefined) {
          setWastages(prev => {
            const newState = { ...prev };
            newState[itemId] = prev[oldKey];
            // Clean up old key
            delete newState[oldKey];
            return newState;
          });
        }
        
        // Update the material in the data structure using index-based update
        updatedData[category] = updatedData[category].map((item, idx) => {
          if (idx === itemIndex) {
            // Get the new material details from MaterialRate.json if available
            const availableMaterials = getMaterialsForCategory(category);
            const newMaterialDetails = availableMaterials.find(mat => mat.material === newMaterial);
            
            return { 
              ...item, 
              material: newMaterial,
              // Keep the original formula - this is important!
              unit: newMaterialDetails?.unit || item.unit,
              // Clear manual_base_qty to force recalculation with new material
              manual_base_qty: undefined
            };
          }
          return item;
        });
        
        // Call onDataChange to update parent state - this should trigger re-render
        onDataChange(updatedData);
      }
    }
  }, [onDataChange, data, wastages, getMaterialsForCategory]);

  // Handler for deleting a material item
  const handleDeleteItem = useCallback((category, itemIndex) => {
    if (onDataChange && data) {
      const updatedData = { ...data };
      if (updatedData[category] && updatedData[category].length > itemIndex) {
        // Remove the item at the specified index
        updatedData[category] = updatedData[category].filter((_, idx) => idx !== itemIndex);
        
        // If category becomes empty, remove the category entirely
        if (updatedData[category].length === 0) {
          delete updatedData[category];
        }
        
        // Clean up related state entries for the deleted item
        const itemId = `${category}-${itemIndex}-${data[category][itemIndex]?.quantity_formula}`;
        const materialKey = `${category}-${data[category][itemIndex]?.material}`;
        
        setBaseQtys(prev => {
          const newState = { ...prev };
          delete newState[itemId];
          delete newState[materialKey];
          return newState;
        });
        
        setWastages(prev => {
          const newState = { ...prev };
          delete newState[itemId];
          delete newState[materialKey];
          return newState;
        });
        
        // Update parent state
        onDataChange(updatedData);
      }
    }
  }, [onDataChange, data]);

  // Handler for adding a new item to a category
  const handleAddItem = useCallback((category) => {
    if (onDataChange && data) {
      const updatedData = { ...data };
      
      // Ensure the category exists
      if (!updatedData[category]) {
        updatedData[category] = [];
      }
      
      // Create a new item with default values - no material pre-selected
      const newItem = {
        material: '', // Empty string means "Select Material" will be shown
        quantity_formula: '0',
        unit: 'unit',
        wastage_percent: 0
      };
      
      // Add the new item to the category
      updatedData[category] = [...updatedData[category], newItem];
      
      // Update parent state
      onDataChange(updatedData);
    }
  }, [onDataChange, data]);

  // Helper function to get materials already used in a category (excluding current item)
  const getUsedMaterialsInCategory = useCallback((category, excludeIndex = -1) => {
    if (!data || !data[category]) return [];
    return data[category]
      .filter((_, idx) => idx !== excludeIndex)
      .map(item => item.material)
      .filter(material => material !== ''); // Exclude empty materials
  }, [data]);

  if (!data) return <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>Loading finishing material data...</div>;

  const grouped = groupFinishingMaterialData(data);
  
  // Get unique categories for filter dropdown
  const categoryOptions = Object.keys(data);

  // Helper function to check if a material exists in MaterialRate data
  const isMaterialInRate = (category, materialName) => {
    const materials = getMaterialsForCategory(category);
    return materials.some(mat => mat.material.toLowerCase() === materialName.toLowerCase());
  };

  // Helper function to get all available materials for a category
  const getAvailableMaterials = (category) => {
    return getMaterialsForCategory(category);
  };

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
                position: 'sticky', top: 0, background: '#eaf4fb', zIndex: 2,
                width: '50px'
              }}>Action</th>
              {/* Removed Rate/Unit and Cost columns */}
          </tr>
        </thead>
        <tbody>
          {grouped
            .filter(({ category }) => categoryFilter === 'All' || category === categoryFilter)
            .map(({ category, items }) => (
              <React.Fragment key={category}>
                <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                  <td colSpan={7} style={{ border: '1px solid #d0d7e1', fontSize: '0.97em', padding: '7px 6px' }}>{category}</td>
                  <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleAddItem(category)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#28a745',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title={`Add new item to ${category}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
                {items.map((item, itemIndex) => {
                // Create a unique identifier based on category, index, and original formula
                // This ensures each item has a stable identity regardless of material changes
                const itemId = `${category}-${itemIndex}-${item.quantity_formula}`;
                const key = `${category}-${item.material}`; // Current key for backward compatibility
                const defaultBaseQty = evaluateFinishingFormula(item.quantity_formula, summaryContext, item);
                
                // Use itemId for state management - check manual_base_qty first, then local state, then formula calculation
                const baseQty = item.manual_base_qty !== undefined ? 
                  item.manual_base_qty : 
                  (baseQtys[itemId] !== undefined ? 
                    (baseQtys[itemId] === '' ? '' : parseFloat(baseQtys[itemId]) || 0) : 
                    (defaultBaseQty || 0));
                
                const wastage = item.wastage_percent !== undefined ? 
                  parseFloat(item.wastage_percent) : 
                  (wastages[itemId] !== undefined ? parseFloat(wastages[itemId]) : 
                   (wastages[key] !== undefined ? parseFloat(wastages[key]) : 0));
                const totalQty = baseQty * (1 + (wastage || 0) / 100);
                // Removed rate and cost as Rate/Unit and Cost columns are not used
                // Handler to update parent data directly
                const handleBaseQtyChange = (e) => {
                  const value = e.target.value;
                  setBaseQtys(prev => ({ ...prev, [itemId]: value }));
                  
                  // Persist the manual base quantity to the parent data structure
                  if (onDataChange) {
                    const newData = { ...data };
                    newData[category] = newData[category].map((mat, idx) =>
                      idx === itemIndex ? { 
                        ...mat, 
                        // Store user's manual base quantity separate from formula
                        manual_base_qty: value === '' ? undefined : parseFloat(value) || 0
                      } : mat
                    );
                    onDataChange(newData);
                  }
                };
                const handleWastageChange = (e) => {
                  const value = e.target.value;
                  setWastages(prev => ({ ...prev, [itemId]: value }));
                  if (onDataChange) {
                    const newData = { ...data };
                    newData[category] = newData[category].map((mat, idx) =>
                      idx === itemIndex ? { ...mat, wastage_percent: value } : mat
                    );
                    onDataChange(newData);
                  }
                };
                
                // Handler to reset base quantity to original formula-calculated value
                const handleResetBaseQty = () => {
                  // Remove manual override to fall back to formula calculation
                  setBaseQtys(prev => {
                    const newState = { ...prev };
                    delete newState[itemId];
                    return newState;
                  });
                  
                  // Remove manual_base_qty from data structure
                  if (onDataChange) {
                    const newData = { ...data };
                    newData[category] = newData[category].map((mat, idx) =>
                      idx === itemIndex ? { 
                        ...mat, 
                        manual_base_qty: undefined
                      } : mat
                    );
                    onDataChange(newData);
                  }
                };
                return (
                  <tr key={itemId}>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{category}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={item.material}
                          onChange={(e) => handleMaterialChange(category, item.material, e.target.value, itemIndex, item.quantity_formula)}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                            minWidth: '150px',
                            maxWidth: '200px',
                            color: item.material === '' ? '#999' : '#333'
                          }}
                        >
                          {/* Show "Select Material" when no material is selected */}
                          {item.material === '' && (
                            <option value="" disabled style={{ color: '#999' }}>
                              Select Material
                            </option>
                          )}
                          
                          {/* Current material as option (only if material is selected) */}
                          {item.material !== '' && (
                            <option value={item.material}>{item.material}</option>
                          )}
                          
                          {/* Available materials from MaterialRate.json */}
                          {getMaterialsForCategory(category)
                            .filter(mat => {
                              // Don't duplicate current material
                              if (mat.material === item.material) return false;
                              // Don't show materials already used in this category
                              const usedMaterials = getUsedMaterialsInCategory(category, itemIndex);
                              return !usedMaterials.includes(mat.material);
                            })
                            .map(mat => (
                              <option key={mat.material} value={mat.material}>
                                {mat.material} {mat.unit && `(${mat.unit})`}
                              </option>
                            ))}
                          
                          {/* Show message if no alternatives available */}
                          {(() => {
                            const availableMats = getMaterialsForCategory(category);
                            const usedMaterials = getUsedMaterialsInCategory(category, itemIndex);
                            const unusedMats = availableMats.filter(mat => 
                              mat.material !== item.material && !usedMaterials.includes(mat.material)
                            );
                            
                            if (availableMats.length === 0 && item.material === '') {
                              return <option disabled>No materials available</option>;
                            } else if (unusedMats.length === 0 && item.material === '') {
                              return <option disabled>All materials already used in this category</option>;
                            }
                            return null;
                          })()}
                        </select>
                        {isMaterialInRate(category, item.material) ? (
                          <span 
                            title="Material available in MaterialRate.json"
                            style={{ 
                              color: '#4caf50', 
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}
                          >✓</span>
                        ) : (
                          <span 
                            title={`Material not found in MaterialRate.json. Available materials: ${getAvailableMaterials(category).map(m => m.material).join(', ')}`}
                            style={{ 
                              color: '#ff9800', 
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >⚠</span>
                        )}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{item.quantity_formula}</td>
                    <td style={{ textAlign: 'right', border: '1px solid #d0d7e1', padding: '7px 6px' }}>
                      <input
                        type="number"
                        value={baseQty || ''}
                        min="0"
                        step="0.01"
                        style={{ width: 80, textAlign: 'right', border: '1px solid #ccc', borderRadius: 4, padding: '2px 6px', fontSize: '0.95em' }}
                        onChange={handleBaseQtyChange}
                        placeholder="0"
                      />
                    </td>
                    <td style={{ textAlign: 'right', border: '1px solid #d0d7e1', padding: '7px 6px' }}>
                      <input
                        type="number"
                        value={wastage}
                        min="0"
                        step="0.01"
                        style={{ width: 60, textAlign: 'right', border: '1px solid #ccc', borderRadius: 4, padding: '2px 6px', fontSize: '0.95em' }}
                        onChange={handleWastageChange}
                      />
                    </td>
                    <td style={{ textAlign: 'right',  border: '1px solid #d0d7e1', padding: '7px 6px' }}>{totalQty ? totalQty.toFixed(0).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px' }}>{item.unit}</td>
                    <td style={{ border: '1px solid #d0d7e1', padding: '7px 6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Reset Button - only show if user has made manual changes */}
                        {item.manual_base_qty !== undefined && (
                          <button
                            onClick={handleResetBaseQty}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              color: '#6f42c1',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            title="Reset to original formula value"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
                            </svg>
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteItem(category, itemIndex)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: '#dc3545',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="Delete this item"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                    {/* Removed Rate/Unit and Cost columns */}
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
