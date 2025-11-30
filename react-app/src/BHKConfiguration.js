import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const BHKConfiguration = () => {
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [isNewConfig, setIsNewConfig] = useState(false);
  const [copySourceId, setCopySourceId] = useState('');
  const [filterType, setFilterType] = useState('');

  // Fetch BHK configurations from API
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const response = await fetch(`${apiUrl}/api/RoomConfiguration`);
      
      if (!response.ok) {
        throw new Error('Failed to load BHK configurations');
      }
      
      const data = await response.json();
      setConfigurations(data);
    } catch (error) {
      console.error('Error loading configurations:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error loading configurations: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    const newConfig = {
      type: '',
      total_carpet_area_sqft: 0,
      bathroom_count: 0,
      rooms: []
    };
    setSelectedConfig(newConfig);
    setIsNewConfig(true);
    setCopySourceId('');
    setShowModal(true);
  };

  const handleEdit = (config) => {
    setSelectedConfig(config);
    setIsNewConfig(false);
    setCopySourceId('');
    setShowModal(true);
  };

  const handleCopyFrom = (sourceId) => {
    if (!sourceId) {
      const newConfig = {
        type: '',
        total_carpet_area_sqft: 0,
        bathroom_count: 0,
        rooms: []
      };
      setSelectedConfig(newConfig);
      return;
    }
    
    const sourceConfig = configurations.find(c => c._id === sourceId);
    if (sourceConfig) {
      const copiedConfig = {
        type: '',
        total_carpet_area_sqft: sourceConfig.total_carpet_area_sqft,
        bathroom_count: sourceConfig.bathroom_count,
        rooms: JSON.parse(JSON.stringify(sourceConfig.rooms)) // Deep copy
      };
      setSelectedConfig(copiedConfig);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this BHK configuration?')) {
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const response = await fetch(`${apiUrl}/api/RoomConfiguration/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      setAlertMessage({
        show: true,
        type: 'success',
        message: 'BHK configuration deleted successfully!'
      });

      loadConfigurations();
      
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error deleting configuration: ${error.message}`
      });
      
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 5000);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedConfig(null);
    setIsNewConfig(false);
    setCopySourceId('');
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!selectedConfig.type || selectedConfig.type.trim() === '') {
        setAlertMessage({
          show: true,
          type: 'danger',
          message: 'Please enter BHK Type'
        });
        setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 3000);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const method = isNewConfig ? 'POST' : 'PUT';
      const url = isNewConfig 
        ? `${apiUrl}/api/RoomConfiguration` 
        : `${apiUrl}/api/RoomConfiguration/${selectedConfig._id}`;
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      console.log('Save successful, setting alert message');
      setAlertMessage({
        show: true,
        type: 'success',
        message: isNewConfig ? 'New BHK configuration created successfully!' : 'Configuration updated successfully!'
      });
      
      if (isNewConfig) {
        setIsNewConfig(false);
        const result = await response.json();
        setSelectedConfig(result); // Update with the saved config including _id
      }

      loadConfigurations();
      
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating configuration:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error updating configuration: ${error.message}`
      });
      
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 5000);
    }
  };

  const handleRoomChange = (roomIndex, field, value) => {
    const updatedConfig = { ...selectedConfig };
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedConfig.rooms[roomIndex][parent][child] = Number(value) || 0;
    } else {
      updatedConfig.rooms[roomIndex][field] = value;
    }
    setSelectedConfig(updatedConfig);
  };

  const handleAddRoom = () => {
    const updatedConfig = { ...selectedConfig };
    const newRoom = {
      name: 'New Room',
      dimensions_ft: {
        length: 0,
        width: 0,
        height: 9
      },
      Door: {
        count: 0,
        width: 0,
        height: 0
      },
      Window: {
        count: 0,
        width: 0,
        height: 0
      },
      area_sqft: 0
    };
    updatedConfig.rooms = [...updatedConfig.rooms, newRoom];
    setSelectedConfig(updatedConfig);
  };

  const handleRemoveRoom = (roomIndex) => {
    if (!window.confirm('Are you sure you want to remove this room?')) {
      return;
    }
    const updatedConfig = { ...selectedConfig };
    updatedConfig.rooms = updatedConfig.rooms.filter((_, index) => index !== roomIndex);
    setSelectedConfig(updatedConfig);
  };

  const handleMoveRoomUp = (roomIndex) => {
    if (roomIndex === 0) return; // Already at top
    const updatedConfig = { ...selectedConfig };
    const rooms = [...updatedConfig.rooms];
    // Swap with previous room
    [rooms[roomIndex - 1], rooms[roomIndex]] = [rooms[roomIndex], rooms[roomIndex - 1]];
    updatedConfig.rooms = rooms;
    setSelectedConfig(updatedConfig);
  };

  const handleMoveRoomDown = (roomIndex) => {
    if (roomIndex === selectedConfig.rooms.length - 1) return; // Already at bottom
    const updatedConfig = { ...selectedConfig };
    const rooms = [...updatedConfig.rooms];
    // Swap with next room
    [rooms[roomIndex], rooms[roomIndex + 1]] = [rooms[roomIndex + 1], rooms[roomIndex]];
    updatedConfig.rooms = rooms;
    setSelectedConfig(updatedConfig);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <Container fluid style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#1976d2', fontWeight: 600, margin: 0 }}>BHK Configuration Master</h2>
        <Button variant="primary" onClick={handleNew}>
          <FaPlus /> New BHK
        </Button>
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
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <Table hover responsive style={{ marginBottom: 0 }}>
            <thead>
              <tr style={{ background: '#e3f2fd' }}>
                <th style={{ padding: '1rem', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: '#1976d2', fontSize: '0.95rem' }}>BHK Type</span>
                    <Form.Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      size="sm"
                    >
                      <option value="">All</option>
                      {[...new Set(configurations.map(c => c.type))].sort().map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Form.Select>
                  </div>
                </th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#1976d2', fontSize: '0.95rem', verticalAlign: 'bottom' }}>
                  Carpet Area (sq ft)
                </th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#1976d2', fontSize: '0.95rem', verticalAlign: 'bottom' }}>
                  Created Date
                </th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#1976d2', fontSize: '0.95rem', verticalAlign: 'bottom' }}>
                  Modified Date
                </th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#1976d2', fontSize: '0.95rem', textAlign: 'center', verticalAlign: 'bottom' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {configurations.filter(config => !filterType || config.type === filterType).length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                    {filterType ? `No BHK configurations found for "${filterType}"` : 'No BHK configurations found'}
                  </td>
                </tr>
              ) : (
                configurations.filter(config => !filterType || config.type === filterType).map((config) => (
                  <tr key={config._id}>
                    <td style={{ padding: '1rem' }}>{config.type}</td>
                    <td style={{ padding: '1rem' }}>{config.total_carpet_area_sqft}</td>
                    <td style={{ padding: '1rem' }}>{formatDate(config.createdDate)}</td>
                    <td style={{ padding: '1rem' }}>{formatDate(config.modifiedDate)}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEdit(config)}
                      >
                        <FaEdit /> Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(config._id)}
                      >
                        <FaTrash /> Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl" centered>
        <Modal.Header closeButton style={{ background: '#e3f2fd', borderBottom: '2px solid #1976d2' }}>
          <Modal.Title style={{ color: '#1976d2', fontWeight: 600, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span>{isNewConfig ? 'New BHK Configuration' : `Edit BHK Configuration - ${selectedConfig?.type}`}</span>
              {/* Alert Message in Header */}
              {alertMessage.show && (
                <Alert 
                  variant={alertMessage.type} 
                  dismissible 
                  onClose={() => setAlertMessage({ show: false, type: '', message: '' })}
                  style={{ margin: 0, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                  {alertMessage.message}
                </Alert>
              )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          
          {selectedConfig && (
            <div>
              {/* Copy From Existing - Only for New BHK */}
              {isNewConfig && (
                <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: 6, marginBottom: '1.5rem', border: '1px solid #ffc107' }}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: 600, color: '#856404' }}>
                      <FaPlus /> Copy from Existing BHK (Optional)
                    </Form.Label>
                    <Form.Select
                      value={copySourceId}
                      onChange={(e) => {
                        setCopySourceId(e.target.value);
                        handleCopyFrom(e.target.value);
                      }}
                      style={{ maxWidth: '400px' }}
                    >
                      <option value="">-- Start from scratch --</option>
                      {configurations.map(config => (
                        <option key={config._id} value={config._id}>
                          {config.type} ({config.total_carpet_area_sqft} sq ft)
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Select an existing BHK to copy all room configurations
                    </Form.Text>
                  </Form.Group>
                </div>
              )}
              
              {/* Basic Information */}
              <Row className="mb-4">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: 600 }}>BHK Type</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={selectedConfig.type}
                      onChange={(e) => setSelectedConfig({ ...selectedConfig, type: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: 600 }}>Total Carpet Area (sq ft)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={selectedConfig.total_carpet_area_sqft}
                      onChange={(e) => setSelectedConfig({ ...selectedConfig, total_carpet_area_sqft: Number(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label style={{ fontWeight: 600 }}>Calculated Area (sq ft)</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={selectedConfig.rooms?.reduce((sum, room) => {
                        const roomArea = (room.dimensions_ft?.length || 0) * (room.dimensions_ft?.width || 0);
                        return sum + roomArea;
                      }, 0).toFixed(2) || '0.00'}
                      disabled
                      style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
                      title="Sum of all room areas"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Rooms Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h5 style={{ color: '#1976d2', fontWeight: 600, margin: 0 }}>Room Details</h5>
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={handleAddRoom}
                >
                  <FaPlus /> Add Room
                </Button>
              </div>
              {selectedConfig.rooms && selectedConfig.rooms.map((room, index) => (
                <div 
                  key={index} 
                  style={{ 
                    background: '#f9f9f9', 
                    padding: '1rem', 
                    borderRadius: 6, 
                    marginBottom: '1rem',
                    border: '1px solid #e0e0e0',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <Form.Control
                      type="text"
                      value={room.name}
                      onChange={(e) => handleRoomChange(index, 'name', e.target.value)}
                      style={{ 
                        fontWeight: 600, 
                        color: '#388e3c',
                        border: '1px solid #ddd',
                        maxWidth: '300px'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleMoveRoomUp(index)}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <FaArrowUp />
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleMoveRoomDown(index)}
                        disabled={index === selectedConfig.rooms.length - 1}
                        title="Move Down"
                      >
                        <FaArrowDown />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveRoom(index)}
                        title="Remove Room"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Length (ft)</Form.Label>
                        <Form.Control 
                          type="number" 
                          step="0.1"
                          value={room.dimensions_ft?.length || 0}
                          onChange={(e) => handleRoomChange(index, 'dimensions_ft.length', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Width (ft)</Form.Label>
                        <Form.Control 
                          type="number" 
                          step="0.1"
                          value={room.dimensions_ft?.width || 0}
                          onChange={(e) => handleRoomChange(index, 'dimensions_ft.width', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Height (ft)</Form.Label>
                        <Form.Control 
                          type="number" 
                          step="0.1"
                          value={room.dimensions_ft?.height || 0}
                          onChange={(e) => handleRoomChange(index, 'dimensions_ft.height', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Area (sq ft)</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={((room.dimensions_ft?.length || 0) * (room.dimensions_ft?.width || 0)).toFixed(2)}
                          disabled
                          style={{ backgroundColor: '#f0f0f0', color: '#555' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Door and Window Details - Side by Side */}
                  <Row>
                    <Col md={6}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <strong style={{ color: '#555', minWidth: '60px' }}>Door:</strong>
                        <Form.Control 
                          type="number" 
                          placeholder="Count"
                          value={room.Door?.count || 0}
                          onChange={(e) => handleRoomChange(index, 'Door.count', e.target.value)}
                          style={{ width: '70px' }}
                          size="sm"
                          title="Count"
                        />
                        <Form.Control 
                          type="number" 
                          step="0.1"
                          placeholder="Width"
                          value={room.Door?.width || 0}
                          onChange={(e) => handleRoomChange(index, 'Door.width', e.target.value)}
                          style={{ width: '70px' }}
                          size="sm"
                          title="Width (ft)"
                        />
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>×</span>
                        <Form.Control 
                          type="number" 
                          step="0.1"
                          placeholder="Height"
                          value={room.Door?.height || 0}
                          onChange={(e) => handleRoomChange(index, 'Door.height', e.target.value)}
                          style={{ width: '70px' }}
                          size="sm"
                          title="Height (ft)"
                        />
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>ft</span>
                        <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.25rem' }}>=</span>
                        <Form.Control 
                          type="text" 
                          value={((room.Door?.count || 0) * (room.Door?.width || 0) * (room.Door?.height || 0)).toFixed(2)}
                          disabled
                          style={{ width: '80px', backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, textAlign: 'center' }}
                          size="sm"
                          title="Total Door Area (sq ft)"
                        />
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>sq ft</span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <strong style={{ color: '#555', minWidth: '70px' }}>Window:</strong>
                        <Form.Control 
                          type="number" 
                          placeholder="Count"
                          value={room.Window?.count || 0}
                          onChange={(e) => handleRoomChange(index, 'Window.count', e.target.value)}
                          style={{ width: '70px' }}
                          size="sm"
                          title="Count"
                        />
                        <Form.Control 
                          type="number" 
                          step="0.1"
                          placeholder="Width"
                          value={room.Window?.width || 0}
                          onChange={(e) => handleRoomChange(index, 'Window.width', e.target.value)}
                          style={{ width: '70px' }}
                          size="sm"
                          title="Width (ft)"
                        />
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>×</span>
                        <Form.Control 
                          type="number" 
                          step="0.1"
                          placeholder="Height"
                          value={room.Window?.height || 0}
                          onChange={(e) => handleRoomChange(index, 'Window.height', e.target.value)}
                          style={{ width: '70px' }}
                          size="sm"
                          title="Height (ft)"
                        />
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>ft</span>
                        <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.25rem' }}>=</span>
                        <Form.Control 
                          type="text" 
                          value={((room.Window?.count || 0) * (room.Window?.width || 0) * (room.Window?.height || 0)).toFixed(2)}
                          disabled
                          style={{ width: '80px', backgroundColor: '#e3f2fd', color: '#1976d2', fontWeight: 600, textAlign: 'center' }}
                          size="sm"
                          title="Total Window Area (sq ft)"
                        />
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>sq ft</span>
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BHKConfiguration;
