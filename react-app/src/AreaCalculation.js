import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const AreaCalculation = () => {
  const [configData, setConfigData] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [addingToSection, setAddingToSection] = useState(null);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [floorFilter, setFloorFilter] = useState('All');
  const [newComponent, setNewComponent] = useState({
    name: '',
    Formula: '',
    Area: '',
    Volume: '',
    Percentage: '',
    Thickness: '',
    Labour: 'no',
    Material: 'no',
    Category: '',
    'Mixture': '',
    'Applicable Floors': []
  });

  const floorSections = ['Foundation', 'Basement', 'Floors'];
  const categoryOptions = ['Earthwork', 'Concrete', 'Mixture'];

  useEffect(() => {
    loadCalculations();
    loadGradeOptions();
  }, []);

  const loadGradeOptions = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const response = await fetch(`${apiUrl}/api/RccConfiguration`);
      
      if (!response.ok) {
        console.error('Failed to load RCC configurations, status:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('RCC Configuration data:', data);
      
      // Extract unique grade values (lowercase 'grade' field)
      const grades = [];
      if (Array.isArray(data)) {
        data.forEach(config => {
          if (config.grade && !grades.includes(config.grade)) {
            grades.push(config.grade);
          }
        });
      } else if (data.grade && !grades.includes(data.grade)) {
        grades.push(data.grade);
      }
      
      console.log('Extracted grades:', grades);
      setGradeOptions(grades);
    } catch (error) {
      console.error('Error loading grade options:', error);
    }
  };

  const loadCalculations = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const response = await fetch(`${apiUrl}/api/AreaCalculation`);
      
      if (!response.ok) {
        throw new Error('Failed to load area calculations');
      }
      
      const data = await response.json();
      console.log('Area Calculation raw data:', data);
      
      // Handle both array and single object responses
      const configArray = Array.isArray(data) ? data : [data];
      
      // Store all section configs indexed by section name
      const sectionConfigs = {};
      
      // Parse all configs and extract components
      const allComponents = [];
      configArray.forEach(configObject => {
        console.log('Config object:', configObject);
        
        // Extract metadata fields
        const { version, description, last_updated, _id, ...componentData } = configObject;
        
        // Check if using old structure (calculation_components)
        if (configObject.calculation_components) {
          Object.entries(configObject.calculation_components).forEach(([name, details]) => {
            allComponents.push({
              name,
              ...details,
              'Applicable Floors': details['Applicable Floors'] || []
            });
          });
        } else {
          // New structure: each section is a separate document or grouped
          // Look for "Applicable Floors" field to identify sections
          const applicableFloor = configObject['Applicable Floors'];
          
          if (applicableFloor) {
            // Store the config for this section
            sectionConfigs[applicableFloor] = configObject;
          }
          
          Object.entries(componentData).forEach(([key, value]) => {
            // Skip metadata fields
            if (key === 'Applicable Floors' || typeof value !== 'object') return;
            
            allComponents.push({
              name: key,
              ...value,
              'Applicable Floors': applicableFloor ? [applicableFloor] : (value['Applicable Floors'] || [])
            });
          });
        }
      });
      
      console.log('Parsed components array:', allComponents);
      setComponents(allComponents);
      setConfigData(sectionConfigs); // Store configs by section
    } catch (error) {
      console.error('Error loading calculations:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error loading calculations: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index) => {
    setEditingRow(index);
    setEditedData({ ...components[index] });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const handleSaveEdit = async (index) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      
      // Update the components array
      const updatedComponents = [...components];
      updatedComponents[index] = editedData;
      
      // Get the section this component belongs to
      const section = editedData['Applicable Floors'] && editedData['Applicable Floors'][0];
      if (!section) {
        throw new Error('Component must have an Applicable Floor');
      }
      
      // Group all components by section
      const componentsBySection = updatedComponents.reduce((acc, comp) => {
        const compSection = comp['Applicable Floors'] && comp['Applicable Floors'][0];
        if (!acc[compSection]) acc[compSection] = [];
        acc[compSection].push(comp);
        return acc;
      }, {});
      
      // Prepare the document for this specific section
      const sectionComponents = {};
      componentsBySection[section]?.forEach(comp => {
        const { name, 'Applicable Floors': _, originalIndex, ...details } = comp;
        sectionComponents[name] = details;
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
        ? `${apiUrl}/api/AreaCalculation/${configData[section]._id}`
        : `${apiUrl}/api/AreaCalculation`;
      
      const method = configData?.[section]?._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfigData)
      });

      if (!response.ok) {
        throw new Error('Failed to update calculation');
      }

      const responseData = await response.json();
      
      // Update configData for this section
      setConfigData(prev => ({
        ...prev,
        [section]: responseData
      }));
      
      setComponents(updatedComponents);
      setEditingRow(null);
      setEditedData({});
      
      setAlertMessage({
        show: true,
        type: 'success',
        message: 'Calculation component updated successfully!'
      });
      
      setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error updating calculation:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error updating calculation: ${error.message}`
      });
      
      setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 5000);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm(`Are you sure you want to delete "${components[index].name}"?`)) {
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      
      // Get the section this component belongs to
      const deletedComponent = components[index];
      const section = deletedComponent['Applicable Floors'] && deletedComponent['Applicable Floors'][0];
      
      // Remove the component
      const updatedComponents = components.filter((_, i) => i !== index);
      
      // Group remaining components by section
      const componentsBySection = updatedComponents.reduce((acc, comp) => {
        const compSection = comp['Applicable Floors'] && comp['Applicable Floors'][0];
        if (!acc[compSection]) acc[compSection] = [];
        acc[compSection].push(comp);
        return acc;
      }, {});
      
      // Prepare the document for this section
      const sectionComponents = {};
      componentsBySection[section]?.forEach(comp => {
        const { name, 'Applicable Floors': _, originalIndex, ...details } = comp;
        sectionComponents[name] = details;
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
        ? `${apiUrl}/api/AreaCalculation/${configData[section]._id}`
        : `${apiUrl}/api/AreaCalculation`;
      
      const method = configData?.[section]?._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfigData)
      });

      if (!response.ok) {
        throw new Error('Failed to delete calculation');
      }

      const responseData = await response.json();
      
      // Update configData for this section
      setConfigData(prev => ({
        ...prev,
        [section]: responseData
      }));
      
      setComponents(updatedComponents);
      
      setAlertMessage({
        show: true,
        type: 'success',
        message: 'Calculation component deleted successfully!'
      });
      
      setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error deleting calculation:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error deleting calculation: ${error.message}`
      });
      
      setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 5000);
    }
  };

  const handleAddNew = (section) => {
    setAddingToSection(section);
    setNewComponent({
      name: '',
      Area: '',
      Volume: '',
      Percentage: '',
      Thickness: '',
      Labour: 'no',
      Material: 'no',
      Category: '',
      'Mixture': '',
      'Applicable Floors': [section]
    });
  };

  const handleCancelAdd = () => {
    setAddingToSection(null);
    setNewComponent({
      name: '',
      Area: '',
      Volume: '',
      Percentage: '',
      Thickness: '',
      Labour: 'no',
      Material: 'no',
      Category: '',
      'Applicable Floors': []
    });
  };

  const handleSaveNew = async () => {
    if (!newComponent.name) {
      setAlertMessage({
        show: true,
        type: 'danger',
        message: 'Component name is required!'
      });
      setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 3000);
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      
      // Get the section for the new component
      const section = newComponent['Applicable Floors'] && newComponent['Applicable Floors'][0];
      if (!section) {
        throw new Error('Component must have an Applicable Floor');
      }
      
      // Add new component to array
      const updatedComponents = [...components, newComponent];
      
      // Group all components by section
      const componentsBySection = updatedComponents.reduce((acc, comp) => {
        const compSection = comp['Applicable Floors'] && comp['Applicable Floors'][0];
        if (!acc[compSection]) acc[compSection] = [];
        acc[compSection].push(comp);
        return acc;
      }, {});
      
      // Prepare the document for this specific section
      const sectionComponents = {};
      componentsBySection[section]?.forEach(comp => {
        const { name, 'Applicable Floors': _, originalIndex, ...details } = comp;
        sectionComponents[name] = details;
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
        ? `${apiUrl}/api/AreaCalculation/${configData[section]._id}`
        : `${apiUrl}/api/AreaCalculation`;
      
      const method = configData?.[section]?._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedConfigData)
      });

      if (!response.ok) {
        throw new Error('Failed to add calculation');
      }

      const responseData = await response.json();
      
      // Update configData for this section
      setConfigData(prev => ({
        ...prev,
        [section]: responseData
      }));
      
      setComponents(updatedComponents);
      setAddingToSection(null);
      setNewComponent({
        name: '',
        Area: '',
        Volume: '',
        Percentage: '',
        Thickness: '',
        Labour: 'no',
        Material: 'no',
        Category: '',
        'Mixture': '',
        'Applicable Floors': []
      });
      
      setAlertMessage({
        show: true,
        type: 'success',
        message: 'New calculation component added successfully!'
      });
      
      setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 3000);
    } catch (error) {
      console.error('Error adding calculation:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error adding calculation: ${error.message}`
      });
      
      setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 5000);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleNewFieldChange = (field, value) => {
    setNewComponent({ ...newComponent, [field]: value });
  };

  // Group components by section
  const getComponentsBySection = (section) => {
    return components
      .map((comp, index) => ({ ...comp, originalIndex: index }))
      .filter(comp => comp['Applicable Floors'] && comp['Applicable Floors'].includes(section));
  };

  // Move row up within section
  const moveRowUp = async (section, sectionIndex) => {
    if (sectionIndex === 0) return;

    const sectionComponents = getComponentsBySection(section);
    const currentComp = sectionComponents[sectionIndex];
    const previousComp = sectionComponents[sectionIndex - 1];

    const updatedComponents = [...components];
    [updatedComponents[currentComp.originalIndex], updatedComponents[previousComp.originalIndex]] = 
    [updatedComponents[previousComp.originalIndex], updatedComponents[currentComp.originalIndex]];

    await saveComponentsOrder(updatedComponents);
  };

  // Move row down within section
  const moveRowDown = async (section, sectionIndex) => {
    const sectionComponents = getComponentsBySection(section);
    if (sectionIndex === sectionComponents.length - 1) return;

    const currentComp = sectionComponents[sectionIndex];
    const nextComp = sectionComponents[sectionIndex + 1];

    const updatedComponents = [...components];
    [updatedComponents[currentComp.originalIndex], updatedComponents[nextComp.originalIndex]] = 
    [updatedComponents[nextComp.originalIndex], updatedComponents[currentComp.originalIndex]];

    await saveComponentsOrder(updatedComponents);
  };

  // Save reordered components
  const saveComponentsOrder = async (updatedComponents) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      
      setComponents(updatedComponents);
      
      // Group all components by section
      const componentsBySection = updatedComponents.reduce((acc, comp) => {
        const compSection = comp['Applicable Floors'] && comp['Applicable Floors'][0];
        if (!acc[compSection]) acc[compSection] = [];
        acc[compSection].push(comp);
        return acc;
      }, {});
      
      // Save each section separately
      const savePromises = Object.entries(componentsBySection).map(async ([section, sectionComps]) => {
        const sectionComponents = {};
        sectionComps.forEach(comp => {
          const { name, 'Applicable Floors': _, originalIndex, ...details } = comp;
          sectionComponents[name] = details;
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
          ? `${apiUrl}/api/AreaCalculation/${configData[section]._id}`
          : `${apiUrl}/api/AreaCalculation`;
        
        const method = configData?.[section]?._id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedConfigData)
        });

        if (!response.ok) {
          throw new Error(`Failed to update order for ${section}`);
        }

        return { section, data: await response.json() };
      });
      
      const results = await Promise.all(savePromises);
      
      // Update configData for all sections
      const updatedConfigData = { ...configData };
      results.forEach(({ section, data }) => {
        updatedConfigData[section] = data;
      });
      setConfigData(updatedConfigData);
    } catch (error) {
      console.error('Error updating order:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error updating order: ${error.message}`
      });
      setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 5000);
    }
  };

  return (
    <Container fluid style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#1976d2', fontWeight: 600, margin: 0 }}>Area Calculation Master</h2>
      </div>

      {/* Filter Section */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
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

      {/* Alert Message */}
      {alertMessage.show && (
        <Alert 
          variant={alertMessage.type} 
          dismissible 
          onClose={() => setAlertMessage({ show: false, type: '', message: '' })}
          style={{ position: 'sticky', top: '1rem', zIndex: 1000 }}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* Data Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'auto' }}>
          <Table hover responsive bordered style={{ marginBottom: 0, fontSize: '0.9rem' }}>
            <thead style={{ background: '#1976d2', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem', width: '140px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Applicable Floor</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem', width: '200px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Component Name</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem', width: '250px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Formula</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem', width: '100px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Labour</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem', width: '100px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Material</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem', width: '120px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Category</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem', width: '120px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>Mixture</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem', width: '200px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Render sections */}
              {floorSections
                .filter(section => floorFilter === 'All' || floorFilter === section)
                .map(section => {
                const sectionComponents = getComponentsBySection(section);
                
                return (
                  <React.Fragment key={section}>
                    {/* Section Header */}
                    <tr style={{ background: 'linear-gradient(to right, #e8f5e9, #f1f8f4)', borderTop: '2px solid #4caf50' }}>
                      <td colSpan="8" style={{ padding: '0.8rem 1rem', fontWeight: 700, color: '#2e7d32', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{section}</span>
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => handleAddNew(section)}
                            disabled={addingToSection !== null}
                          >
                            <FaPlus /> Add to {section}
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Add New Row for this section */}
                    {addingToSection === section && (
                      <tr style={{ background: '#fff3cd' }}>
                        <td style={{ padding: '0.4rem' }}>
                          <div style={{ fontSize: '0.8rem', padding: '0.3rem', fontWeight: 600 }}>{section}</div>
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <Form.Control
                            size="sm"
                            value={newComponent.name}
                            onChange={(e) => handleNewFieldChange('name', e.target.value)}
                            placeholder="Component name"
                          />
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <Form.Control
                            size="sm"
                            value={newComponent.Formula || ''}
                            onChange={(e) => handleNewFieldChange('Formula', e.target.value)}
                            placeholder="Formula"
                            style={{ fontSize: '0.8rem' }}
                          />
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <Form.Select
                            size="sm"
                            value={newComponent.Labour}
                            onChange={(e) => handleNewFieldChange('Labour', e.target.value)}
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </Form.Select>
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <Form.Select
                            size="sm"
                            value={newComponent.Material}
                            onChange={(e) => handleNewFieldChange('Material', e.target.value)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </Form.Select>
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <Form.Select
                            size="sm"
                            value={newComponent.Category}
                            onChange={(e) => handleNewFieldChange('Category', e.target.value)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <option value="">Select...</option>
                            {categoryOptions.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </Form.Select>
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          {newComponent.Category !== 'Earthwork' && (
                            <Form.Select
                              size="sm"
                              value={newComponent['Mixture'] || ''}
                              onChange={(e) => handleNewFieldChange('Mixture', e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                            >
                              <option value="">Select...</option>
                              {gradeOptions.map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                              ))}
                            </Form.Select>
                          )}
                        </td>
                        <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                          <Button variant="success" size="sm" onClick={handleSaveNew} className="me-1">
                            <FaSave />
                          </Button>
                          <Button variant="secondary" size="sm" onClick={handleCancelAdd}>
                            <FaTimes />
                          </Button>
                        </td>
                      </tr>
                    )}

                    {/* Existing Rows in this section */}
                    {sectionComponents.map((component, sectionIndex) => {
                      const globalIndex = component.originalIndex;
                      return (
                        <tr key={globalIndex} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#555', verticalAlign: 'middle' }}>
                            {section}
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 500, color: '#1976d2', fontSize: '0.9rem', verticalAlign: 'middle' }}>
                            {editingRow === globalIndex ? (
                              <Form.Control
                                size="sm"
                                value={editedData.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                              />
                            ) : (
                              component.name
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', verticalAlign: 'middle' }}>
                            {editingRow === globalIndex ? (
                              <Form.Control
                                size="sm"
                                value={editedData.Formula || ''}
                                onChange={(e) => handleFieldChange('Formula', e.target.value)}
                                style={{ fontSize: '0.85rem' }}
                              />
                            ) : (
                              component.Formula || '-'
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            {editingRow === globalIndex ? (
                              <Form.Select
                                size="sm"
                                value={editedData.Labour}
                                onChange={(e) => handleFieldChange('Labour', e.target.value)}
                              >
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </Form.Select>
                            ) : (
                              component.Labour
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            {editingRow === globalIndex ? (
                              <Form.Select
                                size="sm"
                                value={editedData.Material}
                                onChange={(e) => handleFieldChange('Material', e.target.value)}
                                style={{ fontSize: '0.85rem' }}
                              >
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </Form.Select>
                            ) : (
                              component.Material
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            {editingRow === globalIndex ? (
                              <Form.Select
                                size="sm"
                                value={editedData.Category}
                                onChange={(e) => handleFieldChange('Category', e.target.value)}
                                style={{ fontSize: '0.85rem' }}
                              >
                                <option value="">Select...</option>
                                {categoryOptions.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </Form.Select>
                            ) : (
                              component.Category
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.85rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            {editingRow === globalIndex ? (
                              editedData.Category !== 'Earthwork' ? (
                                <Form.Select
                                  size="sm"
                                  value={editedData['Mixture'] || ''}
                                  onChange={(e) => handleFieldChange('Mixture', e.target.value)}
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  <option value="">Select...</option>
                                  {gradeOptions.map(grade => (
                                    <option key={grade} value={grade}>{grade}</option>
                                  ))}
                                </Form.Select>
                              ) : '-'
                            ) : (
                              component.Category !== 'Earthwork' ? (component['Mixture'] || '-') : '-'
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            {editingRow === globalIndex ? (
                              <>
                                <Button variant="success" size="sm" onClick={() => handleSaveEdit(globalIndex)} className="me-1">
                                  <FaSave />
                                </Button>
                                <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                                  <FaTimes />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm" 
                                  onClick={() => moveRowUp(section, sectionIndex)}
                                  disabled={sectionIndex === 0}
                                  className="me-1"
                                >
                                  <FaArrowUp />
                                </Button>
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm" 
                                  onClick={() => moveRowDown(section, sectionIndex)}
                                  disabled={sectionIndex === sectionComponents.length - 1}
                                  className="me-1"
                                >
                                  <FaArrowDown />
                                </Button>
                                <Button variant="outline-primary" size="sm" onClick={() => handleEdit(globalIndex)} className="me-1">
                                  <FaEdit />
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(globalIndex)}>
                                  <FaTrash />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default AreaCalculation;
