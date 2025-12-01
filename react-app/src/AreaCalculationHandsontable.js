import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Button, Form, Alert } from 'react-bootstrap';
import { FaPlus, FaSave, FaFileExcel, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// Register all Handsontable modules
registerAllModules();

const AreaCalculationHandsontable = () => {
  const [configData, setConfigData] = useState({});
  const [floorFilter, setFloorFilter] = useState('All');
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [gradeOptions, setGradeOptions] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [unitOptions, setUnitOptions] = useState([]);
  
  const hotTableRefs = {
    Foundation: useRef(null),
    Basement: useRef(null),
    Floors: useRef(null)
  };

  const floorSections = ['Foundation', 'Basement', 'Floors'];
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  const loadGradeOptions = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/RccConfiguration`);
      if (!response.ok) throw new Error('Failed to fetch grade options');
      
      const data = await response.json();
      const configArray = Array.isArray(data) ? data : [data];
      
      const grades = [];
      configArray.forEach(config => {
        // Extract grade field directly from each config document
        if (config.grade && !grades.includes(config.grade)) {
          grades.push(config.grade);
        }
      });
      
      setGradeOptions(grades);
    } catch (error) {
      console.error('Error loading grade options:', error);
    }
  }, [apiBaseUrl]);

  const loadUnitOptions = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/MaterialItems/units`);
      if (!response.ok) throw new Error('Failed to fetch unit options');
      
      const data = await response.json();
      const units = Array.isArray(data) ? data.map(item => item.unit) : [];
      
      setUnitOptions(units);
    } catch (error) {
      console.error('Error loading unit options:', error);
    }
  }, [apiBaseUrl]);

  const loadCalculations = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/AreaCalculation`);
      if (!response.ok) throw new Error('Failed to fetch calculations');
      
      const data = await response.json();
      const configArray = Array.isArray(data) ? data : [data];
      
      const sectionConfigs = {};
      
      configArray.forEach(configObject => {
        const applicableFloor = configObject['Applicable Floors'];
        if (applicableFloor) {
          sectionConfigs[applicableFloor] = configObject;
        }
      });
      
      setConfigData(sectionConfigs);
    } catch (error) {
      console.error('Error loading calculations:', error);
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadCalculations();
    loadGradeOptions();
    loadUnitOptions();
  }, [loadCalculations, loadGradeOptions, loadUnitOptions]);

  // Convert config data to table rows for a specific section
  const getTableDataForSection = (section) => {
    if (!configData[section]) return [];
    
    // List of metadata fields to exclude from component rows
    const metadataFields = ['_id', 'version', 'description', 'last_updated', 'Applicable Floors', 
                           'createdDate', 'modifiedDate', 'createdBy', 'modifiedBy', '__v'];
    
    const components = { ...configData[section] };
    
    // Remove all metadata fields
    metadataFields.forEach(field => {
      delete components[field];
    });
    
    return Object.entries(components).map(([name, details]) => {
      // Only include if details is an object with component properties
      if (typeof details === 'object' && details !== null) {
        return {
          name,
          Unit: details.Unit || '',
          Labour: details.Labour || 'no',
          PricePerUnit: details.PricePerUnit || '',
          Material: details.Material || 'no',
          Category: details.Category || '',
          Mixture: details.Mixture || ''
        };
      }
      return null;
    }).filter(row => row !== null); // Remove any null entries
  };

  // Column definitions for Handsontable
  const getColumns = () => [
    {
      data: 'name',
      title: 'Component Name',
      width: 200,
      type: 'text'
    },
    {
      data: 'Unit',
      title: 'Unit',
      width: 120,
      type: 'dropdown',
      source: unitOptions
    },
    {
      data: 'Labour',
      title: 'Labour',
      width: 100,
      type: 'dropdown',
      source: ['yes', 'no']
    },
    {
      data: 'PricePerUnit',
      title: 'Price/Unit',
      width: 120,
      type: 'numeric',
      numericFormat: {
        pattern: '0,0.00'
      }
    },
    {
      data: 'Material',
      title: 'Material',
      width: 100,
      type: 'dropdown',
      source: ['yes', 'no']
    },
    {
      data: 'Category',
      title: 'Category',
      width: 120,
      type: 'dropdown',
      source: ['Earthwork', 'Civil','Electrical', 'Plumbing','Tiles', 'Painting','Finishing', 'Doors & Windows' ,'Miscellaneous' ]
    },
    {
      data: 'Mixture',
      title: 'Mixture',
      width: 120,
      type: 'dropdown',
      source: gradeOptions
    }
  ];

  // Handle changes in the table
  const handleAfterChange = (changes, source, section) => {
    if (source === 'loadData' || !changes) return;
    if (source === 'labour_change' || source === 'material_change') return; // Prevent infinite loop
    
    const hotInstance = hotTableRefs[section].current?.hotInstance;
    if (hotInstance) {
      changes.forEach(([row, prop, oldValue, newValue]) => {
        // Clear Price/Unit when Labour changes to 'no'
        if (prop === 'Labour') {
          if (newValue !== 'yes') {
            hotInstance.setDataAtRowProp(row, 'PricePerUnit', '', 'labour_change');
          }
          // Force re-render of the row to update cell properties
          setTimeout(() => hotInstance.render(), 0);
        }
        // Clear Mixture when Material changes to 'no'
        if (prop === 'Material') {
          if (newValue !== 'yes') {
            hotInstance.setDataAtRowProp(row, 'Mixture', '', 'material_change');
          }
          // Force re-render of the row to update cell properties
          setTimeout(() => hotInstance.render(), 0);
        }
      });
    }
    
    // Changes will be auto-saved when user clicks Save button
    console.log('Data changed in section:', section, changes);
  };

  // Save data for a specific section
  const handleSaveSection = async (section) => {
    try {
      const hotInstance = hotTableRefs[section].current?.hotInstance;
      if (!hotInstance) return;

      const sourceData = hotInstance.getSourceData();
      
      // Convert table data back to config format
      const sectionComponents = {};
      sourceData.forEach(row => {
        if (row.name && row.name.trim() !== '') {
          const { name, ...details } = row;
          sectionComponents[name] = details;
        }
      });

      const updatedConfigData = {
        ...(configData?.[section]?._id && { _id: configData[section]._id }),
        'Applicable Floors': section,
        version: '1.0',
        description: `Construction estimation components for ${section}`,
        last_updated: new Date().toISOString().split('T')[0],
        ...sectionComponents
      };

      const url = configData?.[section]?._id 
        ? `${apiBaseUrl}/api/AreaCalculation/${configData[section]._id}`
        : `${apiBaseUrl}/api/AreaCalculation`;
      
      const method = configData?.[section]?._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfigData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${section}`);
      }

      const savedData = await response.json();
      
      setConfigData(prev => ({
        ...prev,
        [section]: savedData
      }));
      
      setAlertMessage({ 
        show: true, 
        type: 'success', 
        message: `${section} saved successfully!` 
      });
      
      setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error saving section:', error);
      setAlertMessage({ 
        show: true, 
        type: 'danger', 
        message: `Error saving ${section}: ${error.message}` 
      });
    }
  };

  // Add new row to a section
  const handleAddRow = (section) => {
    const hotInstance = hotTableRefs[section].current?.hotInstance;
    if (hotInstance) {
      const rowCount = hotInstance.countRows();
      hotInstance.alter('insert_row_below', rowCount);
    }
  };

  // Delete selected rows
  // eslint-disable-next-line no-unused-vars
  const handleDeleteRows = async (section) => {
    const hotInstance = hotTableRefs[section].current?.hotInstance;
    if (!hotInstance) {
      alert('Table instance not found');
      return;
    }

    const selected = hotInstance.getSelected();
    console.log('Selected:', selected);
    
    if (!selected || selected.length === 0) {
      alert('Please select rows to delete by clicking on cells or row numbers');
      return;
    }

    // Extract unique row indices from all selections
    const rowsToDelete = new Set();
    selected.forEach(([startRow, , endRow]) => {
      for (let row = startRow; row <= endRow; row++) {
        rowsToDelete.add(row);
      }
    });

    const sortedRows = Array.from(rowsToDelete).sort((a, b) => b - a); // Sort descending
    const rowCount = sortedRows.length;
    
    if (window.confirm(`Delete ${rowCount} row(s)?`)) {
      try {
        // Remove rows from the table (start from bottom to preserve indices)
        sortedRows.forEach(rowIndex => {
          hotInstance.alter('remove_row', rowIndex, 1);
        });
        
        // Get the updated data immediately after deletion
        const updatedTableData = hotInstance.getSourceData();
        
        // Convert table data to config format
        const sectionComponents = {};
        updatedTableData.forEach(row => {
          if (row.name && row.name.trim() !== '') {
            const { name, ...details } = row;
            sectionComponents[name] = details;
          }
        });

        const updatedConfigData = {
          ...(configData?.[section]?._id && { _id: configData[section]._id }),
          'Applicable Floors': section,
          version: '1.0',
          description: `Construction estimation components for ${section}`,
          last_updated: new Date().toISOString().split('T')[0],
          ...sectionComponents
        };

        const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
        const url = configData?.[section]?._id 
          ? `${apiUrl}/api/AreaCalculation/${configData[section]._id}`
          : `${apiUrl}/api/AreaCalculation`;
        
        const method = configData?.[section]?._id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedConfigData)
        });

        if (!response.ok) {
          throw new Error(`Failed to delete from ${section}`);
        }

        const savedData = await response.json();
        
        setConfigData(prev => ({
          ...prev,
          [section]: savedData
        }));
        
        setAlertMessage({ 
          show: true, 
          type: 'success', 
          message: `${rowCount} row(s) deleted successfully from ${section}!` 
        });
        
        setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 3000);
      } catch (error) {
        console.error('Error deleting rows:', error);
        setAlertMessage({ 
          show: true, 
          type: 'danger', 
          message: `Error deleting rows: ${error.message}` 
        });
      }
    }
  };

  // Export section to Excel
  const handleExportToExcel = (section) => {
    const hotInstance = hotTableRefs[section].current?.hotInstance;
    if (!hotInstance) {
      alert(`Table instance not found for ${section}`);
      return;
    }

    // Check if there's data
    const rowCount = hotInstance.countRows();
    if (rowCount === 0) {
      alert(`No data to export for ${section}`);
      return;
    }

    const exportPlugin = hotInstance.getPlugin('exportFile');
    if (!exportPlugin) {
      alert('Export plugin not available');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const filename = `AreaCalculation_${section}_${today}`;
    
    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      columnHeaders: true,
      exportHiddenColumns: false,
      exportHiddenRows: false,
      fileExtension: 'csv',
      filename: filename,
      mimeType: 'text/csv',
      rowDelimiter: '\r\n',
      rowHeaders: true
    });
  };

  // Export all sections to Excel
  // eslint-disable-next-line no-unused-vars
  const handleExportAllToExcel = () => {
    const sectionsWithData = floorSections.filter(section => {
      const hotInstance = hotTableRefs[section].current?.hotInstance;
      return hotInstance && hotInstance.countRows() > 0;
    });

    if (sectionsWithData.length === 0) {
      alert('No data to export in any section');
      return;
    }

    sectionsWithData.forEach((section, index) => {
      setTimeout(() => {
        handleExportToExcel(section);
      }, index * 1000); // 1 second delay between each export
    });

    setAlertMessage({
      show: true,
      type: 'info',
      message: `Exporting ${sectionsWithData.length} section(s)...`
    });
    setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 3000);
  };

  // Toggle section collapse/expand
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderSectionTable = (section) => {
    const data = getTableDataForSection(section);
    const isCollapsed = collapsedSections[section];
    
    return (
      <div key={section} style={{ marginBottom: '2rem' }}>
        <div 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '0.75rem 1rem',
            fontWeight: 600,
            fontSize: '1.1rem',
            borderRadius: '4px 4px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => toggleSection(section)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
            {section} ({data.length} items)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
            <Button 
              size="sm" 
              variant="light"
              onClick={() => handleAddRow(section)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <FaPlus /> Add Row
            </Button>
            <Button 
              size="sm" 
              variant="info"
              onClick={() => handleExportToExcel(section)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <FaFileExcel /> Export
            </Button>
            <Button 
              size="sm" 
              variant="success"
              onClick={() => handleSaveSection(section)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <FaSave /> Save
            </Button>
          </div>
        </div>
        
        {!isCollapsed && (
          <div style={{ border: '1px solid #ddd', borderTop: 'none' }}>
            <HotTable
              ref={hotTableRefs[section]}
              data={data}
              columns={getColumns()}
              colHeaders={true}
              rowHeaders={true}
              width="100%"
              height="auto"
              licenseKey="non-commercial-and-evaluation"
              stretchH="all"
              contextMenu={['row_above', 'row_below', 'remove_row', 'undo', 'redo', 'copy', 'cut']}
              manualRowMove={true}
              manualColumnMove={false}
              manualColumnResize={true}
              manualRowResize={true}
              selectionMode="multiple"
              outsideClickDeselects={false}
              afterChange={(changes, source) => handleAfterChange(changes, source, section)}
              cells={function(row, col) {
                const cellProperties = {};
                
                // Get physical row index
                const visualRow = this.instance.toVisualRow(row);
                const data = this.instance.getSourceData();
                const rowData = data[visualRow];
                
                if (!rowData) return cellProperties;
                
                const prop = this.instance.colToProp(col);
                
                // Make Mixture dropdown conditional on Material
                if (prop === 'Mixture') {
                  if (rowData.Material !== 'yes') {
                    cellProperties.readOnly = true;
                    cellProperties.className = 'htDimmed';
                  } else {
                    cellProperties.readOnly = false;
                    cellProperties.className = '';
                  }
                }
                
                // Make Price/Unit conditional on Labour
                if (prop === 'PricePerUnit') {
                  if (rowData.Labour !== 'yes') {
                    cellProperties.readOnly = true;
                    cellProperties.className = 'htDimmed';
                  } else {
                    cellProperties.readOnly = false;
                    cellProperties.className = '';
                  }
                }
                
                return cellProperties;
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Container fluid style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#1976d2', fontWeight: 600, margin: 0 }}>
          Area Calculation Master
        </h2>
      </div>

      {alertMessage.show && (
        <Alert 
          variant={alertMessage.type} 
          onClose={() => setAlertMessage({ show: false, type: '', message: '' })} 
          dismissible
        >
          {alertMessage.message}
        </Alert>
      )}

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Form.Label style={{ marginBottom: 0, fontWeight: 500 }}>Filter by Floor:</Form.Label>
        <Form.Select 
          style={{ width: '200px' }}
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
        >
          <option value="All">All Floors</option>
          {floorSections.map(section => (
            <option key={section} value={section}>{section}</option>
          ))}
        </Form.Select>
      </div>

      {floorSections
        .filter(section => floorFilter === 'All' || floorFilter === section)
        .map(section => renderSectionTable(section))
      }

      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h6 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Excel-like Features:</h6>
        <ul style={{ marginBottom: 0, paddingLeft: '1.5rem' }}>
          <li>Click any cell to edit</li>
          <li>Use Tab/Enter to navigate between cells</li>
          <li>Right-click for context menu (copy, paste, insert/remove rows)</li>
          <li>Drag row numbers to reorder</li>
          <li>Copy/paste from Excel works!</li>
          <li>Use Ctrl+Z / Ctrl+Y for undo/redo</li>
        </ul>
      </div>
    </Container>
  );
};

export default AreaCalculationHandsontable;
