import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// Register Handsontable modules
registerAllModules();

/**
 * RCC Configuration Component
 * Handles Material Calculation (Volume-based) for Core Materials
 * Used for cement, steel, sand calculations for RCC work
 * 
 * Can be used as:
 * 1. Standalone page (no props) - manages its own state
 * 2. Child component with props:
 *    - itemForm: The form state object containing materialCalculation
 *    - setItemForm: Function to update the form state
 */
const RccConfiguration = ({ itemForm: itemFormProp, setItemForm: setItemFormProp }) => {
  // Internal state for standalone mode
  const [internalItemForm, setInternalItemForm] = useState({
    materialCalculation: []
  });

  // Use props if provided, otherwise use internal state
  const itemForm = itemFormProp || internalItemForm;
  const setItemForm = setItemFormProp || setInternalItemForm;
  const isStandalone = !itemFormProp;
  const [materialItems, setMaterialItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [showBricks, setShowBricks] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");
  const hotTableRef = useRef(null);

  // Fetch material items and RCC configuration from API
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
    const fetchMaterialItems = async () => {
      try {
        const endpoint = `${apiUrl}/api/MaterialItems/category/Civil`;
        const response = await fetch(endpoint);
        const data = await response.json();
        setMaterialItems(data);
      } catch (error) {
        console.error('Error fetching material items:', error);
      }
    };

    const fetchUnits = async () => {
      try {
        const endpoint = `${apiUrl}/api/MaterialItems/units`;
        const response = await fetch(endpoint);
        const data = await response.json();
        // Extract unit values from the array of objects
        const unitValues = Array.isArray(data) ? data.map(item => item.unit) : [];
        setUnits(unitValues);
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };

    const fetchRccConfig = async () => {
      try {
        const endpoint = `${apiUrl}/api/RccConfiguration`;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch RCC configuration');
        const data = await response.json();
        // Map API data to grid row structure and store IDs
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(row => ({
            _id: row._id || null,
            grade: row.grade || '',
            unit: row.unit || '',
            steel_sku: row.steel?.material || '',
            steel_kg_per_cuft: row.steel?.quantity || '',
            cement_sku: row.cement?.material || '',
            cement_cft_per_cuft: row.cement?.quantity || '',
            sand_sku: row.sand?.material || '',
            sand_kg_per_cft: row.sand?.quantity || '',
            aggregate_sku: row.aggregate?.material || '',
            aggregate_kg_per_cft: row.aggregate?.quantity || '',
            bricks_sku: row.bricks?.material || '',
            bricks_qty_per_cuft: row.bricks?.quantity || ''
          }));
          setItemForm(prev => ({
            ...prev,
            materialCalculation: mapped
          }));
        }
      } catch (error) {
        console.error('Error fetching RCC configuration:', error);
      }
    };

    fetchMaterialItems();
    fetchUnits();
    fetchRccConfig();
  }, [setItemForm]);

  // Filter materials by sub_category
  const getFilteredMaterials = (subCategory) => {
    return materialItems.filter(item => 
      item.sub_category && item.sub_category.toLowerCase() === subCategory.toLowerCase()
    );
  };

  // Get material ID by material name
  const getMaterialId = (materialName, subCategory) => {
    const item = materialItems.find(
      item => item.material === materialName && 
      item.sub_category && 
      item.sub_category.toLowerCase() === subCategory.toLowerCase()
    );
    return item ? item._id : null;
  };

  // Add new row
  const addRow = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const newRow = {
      _id: null,
      grade: '',
      unit: '',
      steel_sku: '',
      steel_kg_per_cuft: 0,
      cement_sku: '',
      cement_cft_per_cuft: 0,
      sand_sku: '',
      sand_kg_per_cft: 0,
      aggregate_sku: '',
      aggregate_kg_per_cft: 0,
      bricks_sku: '',
      bricks_qty_per_cuft: 0
    };
    
    setItemForm(prev => {
      const currentCalc = Array.isArray(prev.materialCalculation) ? prev.materialCalculation : [];
      return {
        ...prev,
        materialCalculation: [...currentCalc, newRow]
      };
    });
  };


  // Remove a row and delete from API if it has an ID
  const removeRow = async (index) => {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const rowData = hotInstance.getSourceDataAtRow(index);
    
    if (!window.confirm('Are you sure you want to delete this row?')) {
      return;
    }
    
    // Delete from API if ID exists
    if (rowData && rowData._id) {
      try {
        const endpoint = `${apiUrl}/api/RccConfiguration/${rowData._id}`;
        const response = await fetch(endpoint, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete RCC configuration');
      } catch (error) {
        setStatusType('danger');
        setStatusMessage('Error deleting configuration: ' + error.message);
        return;
      }
    }
    
    // Remove from UI
    hotInstance.alter('remove_row', index, 1);
    
    setTimeout(() => {
      const updatedData = hotInstance.getSourceData();
      setItemForm(prev => ({
        ...prev,
        materialCalculation: updatedData
      }));
    }, 100);
  };

  // Handle cell changes
  const handleAfterChange = (changes, source) => {
    if (!changes || source === 'loadData') return;
    
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const updatedData = hotInstance.getSourceData();
    setItemForm(prev => ({
      ...prev,
      materialCalculation: updatedData
    }));
  };

  // Get Handsontable columns configuration
  const getColumns = () => {
    const steelItems = getFilteredMaterials('Steel').map(item => item.material);
    const cementItems = getFilteredMaterials('Cement').map(item => item.material);
    const sandItems = getFilteredMaterials('Sand').map(item => item.material);
    const aggregateItems = getFilteredMaterials('Aggregate').map(item => item.material);
    const bricksItems = getFilteredMaterials('Bricks').map(item => item.material);

    return [
      {
        data: 'grade',
        title: 'Grade',
        type: 'text',
        width: 80,
        className: 'htCenter htMiddle'
      },
      {
        data: 'unit',
        title: 'Unit',
        type: 'dropdown',
        source: units,
        width: 80,
        className: 'htCenter htMiddle'
      },
      {
        data: 'steel_sku',
        title: 'Steel SKU',
        type: 'dropdown',
        source: steelItems,
        width: 150,
        className: 'htCenter htMiddle'
      },
      {
        data: 'steel_kg_per_cuft',
        title: 'KG/Cuft',
        type: 'numeric',
        numericFormat: {
          pattern: '0.00'
        },
        width: 70,
        className: 'htCenter htMiddle'
      },
      {
        data: 'cement_sku',
        title: 'Cement SKU',
        type: 'dropdown',
        source: cementItems,
        width: 150,
        className: 'htCenter htMiddle'
      },
      {
        data: 'cement_cft_per_cuft',
        title: 'Cft/Cuft',
        type: 'numeric',
        numericFormat: {
          pattern: '0.00'
        },
        width: 70,
        className: 'htCenter htMiddle'
      },
      {
        data: 'sand_sku',
        title: 'Sand SKU',
        type: 'dropdown',
        source: sandItems,
        width: 150,
        className: 'htCenter htMiddle'
      },
      {
        data: 'sand_kg_per_cft',
        title: 'KG/Cuft',
        type: 'numeric',
        numericFormat: {
          pattern: '0.00'
        },
        width: 70,
        className: 'htCenter htMiddle'
      },
      {
        data: 'aggregate_sku',
        title: 'Aggregate SKU',
        type: 'dropdown',
        source: aggregateItems,
        width: 150,
        className: 'htCenter htMiddle'
      },
      {
        data: 'aggregate_kg_per_cft',
        title: 'KG/Cuft',
        type: 'numeric',
        numericFormat: {
          pattern: '0.00'
        },
        width: 70,
        className: 'htCenter htMiddle'
      },
      {
        data: 'bricks_sku',
        title: 'Bricks SKU',
        type: 'dropdown',
        source: bricksItems,
        width: 150,
        className: 'htCenter htMiddle'
      },
      {
        data: 'bricks_qty_per_cuft',
        title: 'Qty/Cuft',
        type: 'numeric',
        numericFormat: {
          pattern: '0.00'
        },
        width: 90,
        className: 'htCenter htMiddle'
      },
      {
        data: 'action',
        title: 'Action',
        type: 'text',
        readOnly: true,
        width: 100,
        className: 'htCenter',
        renderer: (instance, td, row, col, prop, value, cellProperties) => {
          td.innerHTML = '';
          td.style.padding = '4px';
          td.style.textAlign = 'center';
          td.style.verticalAlign = 'middle';
          
          const deleteButton = document.createElement('button');
          deleteButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>`;
          deleteButton.style.border = 'none';
          deleteButton.style.background = '#dc3545';
          deleteButton.style.color = 'white';
          deleteButton.style.padding = '6px 10px';
          deleteButton.style.borderRadius = '4px';
          deleteButton.style.cursor = 'pointer';
          deleteButton.style.fontSize = '12px';
          deleteButton.style.height = '28px';
          deleteButton.style.display = 'inline-flex';
          deleteButton.style.alignItems = 'center';
          deleteButton.style.justifyContent = 'center';
          deleteButton.title = 'Delete Row';
          
          deleteButton.onclick = () => {
            removeRow(row);
          };
          
          td.appendChild(deleteButton);
          return td;
        }
      }
    ];
  };

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage("");
        setStatusType("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Save configuration to API (create or update)
  const handleSave = async () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) {
      setStatusType('danger');
      setStatusMessage('Table not initialized.');
      return;
    }
    
    const rows = hotInstance.getSourceData();

    // Grade validation: not empty and not duplicate
    const gradeSet = new Set();
    for (let i = 0; i < rows.length; i++) {
      const grade = rows[i].grade?.trim();
      if (!grade) {
        setStatusType('danger');
        setStatusMessage(`Grade value cannot be empty (row ${i + 1}).`);
        return;
      }
      if (gradeSet.has(grade)) {
        setStatusType('danger');
        setStatusMessage(`Duplicate grade value '${grade}' found (row ${i + 1}).`);
        return;
      }
      gradeSet.add(grade);
    }

    // Material SKU validation
    const steelItems = getFilteredMaterials('Steel').map(item => item.material);
    const cementItems = getFilteredMaterials('Cement').map(item => item.material);
    const sandItems = getFilteredMaterials('Sand').map(item => item.material);
    const aggregateItems = getFilteredMaterials('Aggregate').map(item => item.material);
    const bricksItems = getFilteredMaterials('Bricks').map(item => item.material);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.steel_sku && !steelItems.includes(row.steel_sku)) {
        setStatusType('danger');
        setStatusMessage(`Invalid Steel SKU in row ${i + 1}: ${row.steel_sku}`);
        return;
      }
      if (row.cement_sku && !cementItems.includes(row.cement_sku)) {
        setStatusType('danger');
        setStatusMessage(`Invalid Cement SKU in row ${i + 1}: ${row.cement_sku}`);
        return;
      }
      if (row.sand_sku && !sandItems.includes(row.sand_sku)) {
        setStatusType('danger');
        setStatusMessage(`Invalid Sand SKU in row ${i + 1}: ${row.sand_sku}`);
        return;
      }
      if (row.aggregate_sku && !aggregateItems.includes(row.aggregate_sku)) {
        setStatusType('danger');
        setStatusMessage(`Invalid Aggregate SKU in row ${i + 1}: ${row.aggregate_sku}`);
        return;
      }
      if (row.bricks_sku && !bricksItems.includes(row.bricks_sku)) {
        setStatusType('danger');
        setStatusMessage(`Invalid Bricks SKU in row ${i + 1}: ${row.bricks_sku}`);
        return;
      }
    }

    try {
      let updatedRows = [...rows];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const steelId = getMaterialId(row.steel_sku, 'Steel');
        const cementId = getMaterialId(row.cement_sku, 'Cement');
        const sandId = getMaterialId(row.sand_sku, 'Sand');
        const aggregateId = getMaterialId(row.aggregate_sku, 'Aggregate');
        const bricksId = getMaterialId(row.bricks_sku, 'Bricks');
        const payload = {
          grade: row.grade,
          unit: row.unit || '',
          steel: {
            materialId: steelId === undefined ? null : steelId,
            quantity: parseFloat(row.steel_kg_per_cuft) || 0,
            unit: 'KG',
            material: row.steel_sku || ''
          },
          cement: {
            materialId: cementId === undefined ? null : cementId,
            quantity: parseFloat(row.cement_cft_per_cuft) || 0,
            unit: 'bag',
            material: row.cement_sku || ''
          },
          sand: {
            materialId: sandId === undefined ? null : sandId,
            quantity: parseFloat(row.sand_kg_per_cft) || 0,
            unit: 'Cft',
            material: row.sand_sku || ''
          },
          aggregate: {
            materialId: aggregateId === undefined ? null : aggregateId,
            quantity: parseFloat(row.aggregate_kg_per_cft) || 0,
            unit: 'Cft',
            material: row.aggregate_sku || ''
          },
          bricks: {
            materialId: bricksId === undefined ? null : bricksId,
            quantity: parseFloat(row.bricks_qty_per_cuft) || 0,
            unit: 'Nos',
            material: row.bricks_sku || ''
          }
        };
        let endpoint = `${apiUrl}/api/RccConfiguration`;
        let method = 'POST';
        if (row._id) {
          endpoint = `${apiUrl}/api/RccConfiguration/${row._id}`;
          method = 'PUT';
        }
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Failed to save RCC configuration for grade ${row.grade}`);
        // If new row (POST), update _id in grid
        if (method === 'POST') {
          const result = await response.json();
          if (result && result._id) {
            updatedRows[i]._id = result._id;
          }
        }
      }
      setItemForm(prev => ({
        ...prev,
        materialCalculation: updatedRows
      }));
      setStatusType('success');
      setStatusMessage('Configuration saved to server!');
    } catch (error) {
      setStatusType('danger');
      setStatusMessage('Error saving configuration: ' + error.message);
    }
  };



  return (
    <>
      {isStandalone && (
        <Container fluid className="py-4">
          <h2 className="mb-4">RCC Configuration</h2>
          {renderContent()}
        </Container>
      )}
      {!isStandalone && renderContent()}
    </>
  );

  function renderContent() {
    return (
      <Row className="mb-4">
        <Col md={12}>
        <Card className="border-primary">
          <Card.Header className="bg-primary text-white">
            <h6 className="mb-0">
              <i className="fas fa-cubes me-2"></i>
              Material Calculation (Volume-based)
              <Badge bg="light" text="primary" size="sm" className="ms-2">Required</Badge>
            </h6>
            
          </Card.Header>
          <Card.Body>
            <Row>
              <Col>
                
                
                {/* Add New Row Button */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <Button 
                        variant="outline-success" 
                        size="sm"
                        onClick={addRow}
                        className="me-2"
                      >
                        <i className="fas fa-plus me-1"></i>
                        Add Row
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={handleSave}
                        className="me-2"
                      >
                        <i className="fas fa-save me-1"></i>
                        Save Configuration
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setShowBricks(!showBricks)}
                      >
                        <i className={`fas fa-${showBricks ? 'eye-slash' : 'eye'} me-1`}></i>
                        {showBricks ? 'Hide' : 'Show'} Bricks
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                {statusMessage && (
                  <div className={`alert alert-${statusType} position-fixed w-100`} style={{ top: 0, left: 0, zIndex: 9999, borderRadius: 0, textAlign: 'center' }}>
                    {statusMessage}
                  </div>
                )}

                {/* Handsontable Grid */}
                <div style={{ marginTop: '10px' }}>
                  <HotTable
                    key={showBricks ? 'with-bricks' : 'without-bricks'}
                    ref={hotTableRef}
                    data={itemForm.materialCalculation || []}
                    columns={getColumns()}
                    colHeaders={true}
                    nestedHeaders={[
                      [
                        { label: 'Grade', rowspan: 2 },
                        { label: 'Unit', rowspan: 2 },
                        { label: 'Steel', colspan: 2 },
                        { label: 'Cement', colspan: 2 },
                        { label: 'Sand', colspan: 2 },
                        { label: 'Aggregate', colspan: 2 },
                        { label: 'Bricks', colspan: 2 },
                        { label: 'Action', rowspan: 2 }
                      ],
                      [
                        { label: '', colspan: 1 },
                        { label: '', colspan: 1 },
                         { label: 'SKU', colspan: 1 },
                        { label: 'KG', colspan: 1 },
                        { label: 'SKU', colspan: 1 },
                        { label: 'Bag', colspan: 1 },
                       { label: 'SKU', colspan: 1 },
                        { label: 'Cft', colspan: 1 },
                        { label: 'SKU', colspan: 1 },
                        { label: 'Cft', colspan: 1 },
                        { label: 'SKU', colspan: 1 },
                        { label: 'Pcs', colspan: 1 }
                      ]
                    ]}
                    rowHeaders={true}
                    height="auto"
                    licenseKey="non-commercial-and-evaluation"
                    stretchH="all"
                    hiddenColumns={{
                      columns: showBricks ? [] : [10, 11],
                      indicators: false
                    }}
                    afterChange={handleAfterChange}
                    afterInit={() => {
                      // Add custom styling to header groups
                      setTimeout(() => {
                        const headers = document.querySelectorAll('.ht_clone_top thead tr:first-child th');
                        if (headers[2]) headers[2].style.backgroundColor = '#d1e7dd'; // Steel - success-subtle
                        if (headers[3]) headers[3].style.backgroundColor = '#cff4fc'; // Cement - info-subtle
                        if (headers[4]) headers[4].style.backgroundColor = '#fff3cd'; // Sand - warning-subtle
                        if (headers[5]) headers[5].style.backgroundColor = '#e2e3e5'; // Aggregate - secondary-subtle
                        if (headers[6]) headers[6].style.backgroundColor = '#f8d7da'; // Bricks - danger-subtle
                      }, 100);
                    }}
                    contextMenu={false}
                    manualColumnResize={true}
                    manualRowResize={true}
                  />
                </div>
                
                {/* Empty state */}
                {(!Array.isArray(itemForm.materialCalculation) || !itemForm.materialCalculation?.length) && (
                  <div className="text-center text-muted py-4" style={{ border: '1px solid #dee2e6', borderTop: 'none' }}>
                    No material configuration found. Click "Add Row" to add configuration.
                  </div>
                )}
                
               
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
    );
  }
};

export default RccConfiguration;
