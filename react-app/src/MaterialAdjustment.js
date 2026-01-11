import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Modal } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import axiosClient from './api/axiosClient';

registerAllModules();

const MaterialAdjustment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [locations, setLocations] = useState([]);
  const [locationInventory, setLocationInventory] = useState([]);
  const [showAddRowsModal, setShowAddRowsModal] = useState(false);
  const [rowsToAdd, setRowsToAdd] = useState(1);
  const [showRemarksColumn, setShowRemarksColumn] = useState(false);
  const hotTableRef = useRef(null);
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
  const [formData, setFormData] = useState({
    _id: '',
    movementType: 'Adjustment',
    referenceNumber: '',
    referenceDate: new Date().toISOString().split('T')[0],
    sourceLocationId: '',
    sourceLocationName: '',
    remarks: '',
    receivedBy: '',
    companyId: '',
    companyName: '',
    createdBy: '',
    modifiedBy: '',
    items: []
  });

  const adjustmentTypes = [
    { value: 'Stock Adjustment', label: 'Stock Adjustment' },
    { value: 'Damage', label: 'Damage' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Lost', label: 'Lost' },
    { value: 'Found', label: 'Found' },
    { value: 'Quality Rejection', label: 'Quality Rejection' },
    { value: 'Other', label: 'Other' }
  ];

  useEffect(() => {
    loadDropdownData();
    
    // Check if editing an existing record
    if (location.state && location.state.record) {
      const record = location.state.record;
      setFormData({
        _id: record._id || '',
        movementType: 'Adjustment',
        adjustmentType: record.adjustmentType || 'Stock Adjustment',
        referenceNumber: record.referenceNumber || '',
        referenceDate: record.referenceDate ? record.referenceDate.split('T')[0] : new Date().toISOString().split('T')[0],
        sourceLocationId: record.sourceLocationId || '',
        sourceLocationName: record.sourceLocationName || '',
        remarks: record.remarks || '',
        receivedBy: record.receivedBy || localStorage.getItem('username') || 'User',
        companyId: record.companyId || localStorage.getItem('selectedCompanyId'),
        companyName: record.companyName || localStorage.getItem('companyName') || '',
        createdBy: record.createdBy || localStorage.getItem('userId'),
        modifiedBy: localStorage.getItem('userId'),
        items: record.items && record.items.length > 0 ? record.items : [
          { itemName: '', itemId: '', unit: '', adjustmentType: 'Stock Adjustment', currentStock: 0, receivedQty: 0, rate: 0, amount: 0, remarks: '' }
        ]
      });
      
      // Load inventory for the location
      if (record.sourceLocationId) {
        loadInventoryByLocation(record.sourceLocationId);
      }
    } else {
      initializeForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeForm = () => {
    const companyId = localStorage.getItem('selectedCompanyId');
    const companyName = localStorage.getItem('companyName') || '';
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username') || 'User';

    setFormData({
      _id: '',
      movementType: 'Adjustment',
      referenceNumber: '',
      referenceDate: new Date().toISOString().split('T')[0],
      sourceLocationId: '',
      sourceLocationName: '',
      remarks: '',
      receivedBy: username,
      companyId: companyId,
      companyName: companyName,
      createdBy: userId,
      modifiedBy: userId,
      items: [
        { itemName: '', itemId: '', unit: '', adjustmentType: 'Stock Adjustment', currentStock: 0, receivedQty: 0, rate: 0, amount: 0, remarks: '' }
      ]
    });
  };

  const loadInventoryByLocation = async (locationId) => {
    if (!locationId) {
      setLocationInventory([]);
      return;
    }
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/MaterialReceived/inventory-by-location?locationId=${locationId}`);
      if (response.ok) {
        const data = await response.json();
        
        setLocationInventory(data.inventory || []);
      } else {
        setLocationInventory([]);
      }
    } catch (error) {
      console.error('Error loading location inventory:', error);
      setLocationInventory([]);
    }
  };

  const loadDropdownData = async () => {
    try {
      const companyId = localStorage.getItem('selectedCompanyId');
      if (!companyId) {
        showAlert('error', 'Please select a company first');
        return;
      }

      // Load locations
      const locationsResponse = await axiosClient.get(`/api/LocationMaster`);
      const locationsData = locationsResponse.data || [];
      setLocations(Array.isArray(locationsData) ? locationsData : []);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      showAlert('error', 'Failed to load location data');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.adjustmentType) {
      showAlert('error', 'Please select adjustment type');
      return;
    }
    if (!formData.sourceLocationId) {
      showAlert('error', 'Please select location');
      return;
    }
    if (!formData.referenceDate) {
      showAlert('error', 'Please enter adjustment date');
      return;
    }
    if (!formData.items || formData.items.length === 0 || !formData.items.some(item => item.itemId)) {
      showAlert('error', 'Please add at least one item');
      return;
    }

    try {
      const companyId = localStorage.getItem('selectedCompanyId');
      const userId = localStorage.getItem('userId');

      const payload = {
        ...formData,
        movementType: 'Adjustment',
        companyId: companyId,
        modifiedBy: userId,
        items: formData.items
          .filter(item => item.itemId)
          .map(item => ({
            itemId: item.itemId,
            itemName: item.itemName,
            unit: item.unit,
            adjustmentType: item.adjustmentType || 'Stock Adjustment',
            currentStock: item.currentStock || 0,
            receivedQty: item.receivedQty || 0,
            rate: item.rate || 0,
            amount: item.amount || 0,
            remarks: item.remarks || ''
          }))
      };

      // Save to MaterialReceived collection
      if (formData._id) {
        // Update existing record
        await axiosClient.put(`/api/MaterialReceived/${formData._id}`, payload);
        showAlert('success', 'Adjustment updated successfully');
      } else {
        // Create new record
        await axiosClient.post('/api/MaterialReceived', payload);
        showAlert('success', 'Adjustment saved successfully');
      }
      
      // Redirect to Material Received page after 1.5 seconds
      setTimeout(() => {
        navigate('/material-received');
      }, 1500);
    } catch (error) {
      console.error('Error saving adjustment:', error);
      showAlert('error', error.response?.data?.message || 'Failed to save adjustment');
    }
  };

  const handleCancel = () => {
    navigate('/material-received');
  };

  const handleLocationChange = (e) => {
    const selectedLocationId = e.target.value;
    const selectedLocation = locations.find(loc => loc._id === selectedLocationId);
    
    setFormData({
      ...formData,
      sourceLocationId: selectedLocationId,
      sourceLocationName: selectedLocation ? selectedLocation.locationName : '',
      items: [
        { itemName: '', itemId: '', unit: '', adjustmentType: formData.adjustmentType, currentStock: 0, receivedQty: 0, rate: 0, amount: 0, remarks: '' }
      ]
    });
    
    // Load inventory for selected location
    loadInventoryByLocation(selectedLocationId);
  };

  const showAlert = (type, message) => {
    setAlertMessage({ show: true, type, message });
    setTimeout(() => {
      setAlertMessage({ show: false, type: '', message: '' });
    }, 5000);
  };

  // Handsontable columns configuration
  const columns = [
    {
      data: 'itemName',
      title: 'Item Name',
      type: 'dropdown',
      source: locationInventory.map(item => item.itemName),
      width: 250,
      strict: false
    },
    {
      data: 'unit',
      title: 'Unit',
      type: 'text',
      readOnly: true,
      width: 80
    },
    {
      data: 'adjustmentType',
      title: 'Adjustment Type',
      type: 'dropdown',
      source: adjustmentTypes.map(t => t.value),
      width: 150
    },
    {
      data: 'currentStock',
      title: 'Current Stock',
      type: 'numeric',
      numericFormat: { pattern: '0,0.00' },
      readOnly: true,
      width: 120
    },
    {
      data: 'receivedQty',
      title: 'Adjusted Qty (+/-)',
      type: 'numeric',
      numericFormat: { pattern: '0,0.00' },
      width: 120
    },
    {
      data: 'rate',
      title: 'Rate',
      type: 'numeric',
      numericFormat: { pattern: '0,0.00' },
      readOnly: true,
      width: 100
    },
    {
      data: 'amount',
      title: 'Amount',
      type: 'numeric',
      numericFormat: { pattern: '0,0.00' },
      readOnly: true,
      width: 120
    },
    ...(showRemarksColumn ? [{
      data: 'remarks',
      title: 'Remarks/Reason',
      type: 'text',
      width: 200
    }] : []),
    {
      data: 'action',
      title: 'Action',
      width: 130,
      readOnly: true,
      renderer: (instance, td, row, col, prop, value, cellProperties) => {
        // Clear existing content to prevent duplicate buttons
        td.innerHTML = '';
        td.style.textAlign = 'center';
        
        // Add row button
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-success btn-sm me-1';
        addBtn.innerHTML = '<i class="bi bi-plus"></i>';
        addBtn.onclick = () => {
          const currentData = instance.getSourceData();
          const newItems = currentData.map(item => ({
            itemName: item.itemName || '',
            itemId: item.itemId || '',
            unit: item.unit || '',
            adjustmentType: item.adjustmentType || 'Stock Adjustment',
            currentStock: item.currentStock || 0,
            receivedQty: item.receivedQty || 0,
            rate: item.rate || 0,
            amount: item.amount || 0,
            remarks: item.remarks || ''
          }));
          newItems.push({
            itemName: '',
            itemId: '',
            unit: '',
            adjustmentType: 'Stock Adjustment',
            currentStock: 0,
            receivedQty: 0,
            rate: 0,
            amount: 0,
            remarks: ''
          });
          setFormData(prev => ({ ...prev, items: newItems }));
        };
        td.appendChild(addBtn);
        
        // Bulk add rows button
        const bulkAddBtn = document.createElement('button');
        bulkAddBtn.className = 'btn btn-primary btn-sm me-1';
        bulkAddBtn.innerHTML = '<i class="bi bi-plus-square"></i>';
        bulkAddBtn.title = 'Add multiple rows';
        bulkAddBtn.onclick = () => {
          setShowAddRowsModal(true);
        };
        td.appendChild(bulkAddBtn);
        
        // Delete row button
        if (formData.items.length > 1 || row > 0) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn btn-danger btn-sm';
          deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
          deleteBtn.onclick = () => {
            const currentData = instance.getSourceData();
            const newItems = currentData
              .filter((_, index) => index !== row)
              .map(item => ({
                itemName: item.itemName || '',
                itemId: item.itemId || '',
                unit: item.unit || '',
                adjustmentType: item.adjustmentType || 'Stock Adjustment',
                currentStock: item.currentStock || 0,
                receivedQty: item.receivedQty || 0,
                rate: item.rate || 0,
                amount: item.amount || 0,
                remarks: item.remarks || ''
              }));
            setFormData(prev => ({ ...prev, items: newItems }));
          };
          td.appendChild(deleteBtn);
        }
        
        return td;
      }
    }
  ];

  // Handle changes in Handsontable
  const handleTableChange = (changes, source) => {
    if (!changes || source === 'loadData') return;

    const updatedItems = [...formData.items];

    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (prop === 'itemName' && newValue !== oldValue) {
        const selectedItem = locationInventory.find(item => item.itemName === newValue);
        console.log('Selected item:', selectedItem);
        if (selectedItem) {
          updatedItems[row] = {
            ...updatedItems[row],
            itemId: selectedItem.itemId,
            itemName: selectedItem.itemName,
            unit: selectedItem.unit,
            adjustmentType: updatedItems[row]?.adjustmentType || formData.adjustmentType,
            currentStock: selectedItem.stockQty || 0,
            receivedQty: 0,
            rate: selectedItem.rate || 0,
            amount: 0,
            remarks: updatedItems[row]?.remarks || ''
          };
        }
      } else if (prop === 'receivedQty') {
        const receivedQty = parseFloat(newValue) || 0;
        const rate = parseFloat(updatedItems[row]?.rate) || 0;
        updatedItems[row] = {
          ...updatedItems[row],
          receivedQty: receivedQty,
          amount: receivedQty * rate
        };
      } else if (prop === 'adjustmentType') {
        updatedItems[row] = {
          ...updatedItems[row],
          adjustmentType: newValue
        };
      } else {
        updatedItems[row] = {
          ...updatedItems[row],
          [prop]: newValue
        };
      }
    });

    setFormData({ ...formData, items: updatedItems });
  };

  return (
    <Container fluid className="py-4">
      {alertMessage.show && (
        <Alert variant={alertMessage.type === 'error' ? 'danger' : 'success'} dismissible onClose={() => setAlertMessage({ show: false, type: '', message: '' })}>
          {alertMessage.message}
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">
              <i className="bi bi-sliders me-2"></i>
              Material Adjustment Entry
            </h4>
            <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
              Stock adjustment entry
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="light" onClick={handleCancel}>
              <i className="bi bi-arrow-left me-2"></i>Back to List
            </Button>
            <Button variant="light" onClick={handleSubmit} className="border border-white">
              <i className="bi bi-save me-2"></i>Save
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Reference Number</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="Auto-generated"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={formData.referenceDate}
                  onChange={(e) => setFormData({ ...formData, referenceDate: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Location <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  size="sm"
                  value={formData.sourceLocationId}
                  onChange={handleLocationChange}
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>{loc.locationName}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Adjusted By</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  value={formData.receivedBy}
                  onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Items Grid */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Adjustment Items</h6>
              <Button 
                variant={showRemarksColumn ? "primary" : "outline-secondary"} 
                size="sm" 
                onClick={() => setShowRemarksColumn(!showRemarksColumn)}
              >
                <i className={`bi bi-${showRemarksColumn ? 'eye-slash' : 'eye'} me-2`}></i>
                {showRemarksColumn ? 'Hide' : 'Show'} Remarks
              </Button>
            </div>
            <div style={{ height: '400px', overflow: 'auto' }}>
              <HotTable
                ref={hotTableRef}
                data={formData.items}
                colHeaders={true}
                columns={columns}
                rowHeaders={true}
                width="100%"
                height="380"
                licenseKey="non-commercial-and-evaluation"
                stretchH="all"
                afterChange={handleTableChange}
                contextMenu={true}
                manualColumnResize={true}
              />
            </div>
          </div>

          {/* Remarks */}
          <Row className="g-3 mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Additional remarks..."
                />
              </Form.Group>
            </Col>
          </Row>

        </Card.Body>
      </Card>

      {/* Add Rows Modal */}
      <Modal show={showAddRowsModal} onHide={() => setShowAddRowsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Rows</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Number of rows to add:</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="100"
              value={rowsToAdd}
              onChange={(e) => setRowsToAdd(parseInt(e.target.value) || 1)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddRowsModal(false)}>
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const currentItems = formData.items || [];
              const newRows = Array(rowsToAdd).fill(null).map(() => ({
                itemName: '',
                itemId: '',
                unit: '',
                adjustmentType: formData.adjustmentType,
                currentStock: 0,
                receivedQty: 0,
                rate: 0,
                amount: 0,
                remarks: ''
              }));
              setFormData(prev => ({ ...prev, items: [...currentItems, ...newRows] }));
              setShowAddRowsModal(false);
              setRowsToAdd(1);
            }}
          >
            <i className="bi bi-check-circle me-2"></i>
            Add Rows
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MaterialAdjustment;
