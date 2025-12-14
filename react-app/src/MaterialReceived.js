import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Alert, InputGroup } from 'react-bootstrap';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

registerAllModules();

const MaterialReceived = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [grns, setGrns] = useState([]);
  const [filteredGrns, setFilteredGrns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredPOs, setFilteredPOs] = useState([]);
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [materialItems, setMaterialItems] = useState([]);
  const [units, setUnits] = useState([]);
  const hotTableRef = useRef(null);
  const poDropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    _id: '',
    grnNumber: '',
    grnDate: '',
    poNumber: '',
    poId: '',
    supplierId: '',
    supplierName: '',
    receivedBy: '',
    vehicleNumber: '',
    driverName: '',
    driverContact: '',
    invoiceNumber: '',
    invoiceDate: '',
    remarks: '',
    status: 'Pending',
    companyCode: '',
    companyName: '',
    createdBy: '',
    modifiedBy: '',
    items: []
  });

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  // Handle click outside to close PO dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (poDropdownRef.current && !poDropdownRef.current.contains(event.target)) {
        setShowPODropdown(false);
      }
    };

    if (showPODropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPODropdown]);

  useEffect(() => {
    if (viewMode === 'list') {
      loadGrns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    // Filter GRNs based on search term
    if (searchTerm.trim() === '') {
      setFilteredGrns(grns);
    } else {
      const filtered = grns.filter(grn => 
        grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGrns(filtered);
    }
  }, [searchTerm, grns]);

  useEffect(() => {
    if (viewMode === 'form') {
      loadPurchaseOrders();
      loadDropdownData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    // Filter POs based on search term
    if (poSearchTerm.trim() === '') {
      setFilteredPOs(purchaseOrders);
    } else {
      const filtered = purchaseOrders.filter(po =>
        po.poNumber.toLowerCase().includes(poSearchTerm.toLowerCase())
      );
      setFilteredPOs(filtered);
    }
  }, [poSearchTerm, purchaseOrders]);

  const loadDropdownData = async () => {
    try {
      // Load Material Items
      const itemsResponse = await fetch(`${apiBaseUrl}/api/MaterialItems`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setMaterialItems(Array.isArray(itemsData) ? itemsData : []);
      }

      // Load Units
      const unitsResponse = await fetch(`${apiBaseUrl}/api/MaterialItems/units`);
      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json();
        let unitsArray = Array.isArray(unitsData) ? unitsData : (unitsData.units || []);
        
        if (unitsArray.length > 0 && typeof unitsArray[0] === 'object') {
          unitsArray = unitsArray.map(u => u.unit || u);
        }
        
        const uniqueUnits = [...new Set(unitsArray.filter(u => u))];
        setUnits(uniqueUnits.length > 0 ? uniqueUnits : ['pcs', 'kg', 'bag', 'cft', 'sqm', 'cum', 'ltr', 'nos']);
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      setUnits(['pcs', 'kg', 'bag', 'cft', 'sqm', 'cum', 'ltr', 'nos']);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/PurchaseOrder`);
      if (response.ok) {
        const data = await response.json();
        // Filter only approved POs
        const approvedPOs = data.filter(po => po.status === 'Approved');
        setPurchaseOrders(approvedPOs);
        setFilteredPOs(approvedPOs);
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  const handlePOSelect = (po) => {
    setFormData(prev => ({
      ...prev,
      poNumber: po.poNumber,
      poId: po._id || '',
      supplierId: po.supplierId || '',
      supplierName: po.supplierName || '',
      items: po.items.map(item => ({
        itemCode: item.itemName || item.itemCode || '',
        itemId: item.itemCode || '',
        itemName: item.itemName || '',
        unit: item.unit || '',
        orderedQty: item.purchaseQty || 0,
        receivedQty: 0,
        rate: item.rate || 0,
        amount: 0
      }))
    }));
    setPoSearchTerm(po.poNumber);
    setShowPODropdown(false);
  };

  const loadGrns = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/MaterialReceived`);
      if (response.ok) {
        const data = await response.json();
        setGrns(data);
        setFilteredGrns(data);
      }
    } catch (error) {
      console.error('Error loading GRNs:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get user and company info from localStorage
    const userId = localStorage.getItem('userId');
    const companyId = localStorage.getItem('selectedCompanyId');
    const companyName = localStorage.getItem('companyName') || '';
    
    try {
      // Clean items - remove itemCode, itemName from each item
      const cleanedItems = formData.items.map(({ itemCode, itemName, ...rest }) => rest);
      
      // Prepare data - exclude fields populated by backend
      const { 
        supplierName, 
        status, 
        poNumber,
        supplierEmail,
        createdByUserName,
        createdByEmail,
        modifiedByUserName,
        modifiedByEmail,
        ...formDataWithoutExcluded 
      } = formData;
      
      const dataToSend = {
        ...formDataWithoutExcluded,
        items: cleanedItems,
        companyCode: companyId,
        companyName: companyName,
        createdBy: editMode ? formData.createdBy : userId,
        modifiedBy: userId
      };
      
      const url = editMode 
        ? `${apiBaseUrl}/api/MaterialReceived/${formData._id}`
        : `${apiBaseUrl}/api/MaterialReceived`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Update formData with the auto-generated GRN number from response
        if (!editMode && responseData.grnNumber) {
          setFormData(prev => ({
            ...prev,
            grnNumber: responseData.grnNumber
          }));
        }
        
        setAlertMessage({ 
          show: true, 
          type: 'success', 
          message: editMode ? 'GRN updated successfully!' : 'GRN created successfully!' 
        });
        handleReset();
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
          setViewMode('list');
        }, 1500);
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to save: ${errorData}` });
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
  };

  const handleReset = () => {
    setFormData({
      _id: '',
      grnNumber: '',
      grnDate: '',
      poNumber: '',
      poId: '',
      supplierId: '',
      supplierName: '',
      receivedBy: '',
      vehicleNumber: '',
      driverName: '',
      driverContact: '',
      invoiceNumber: '',
      invoiceDate: '',
      remarks: '',
      status: 'Pending',
      companyCode: '',
      companyName: '',
      createdBy: '',
      modifiedBy: '',
      items: []
    });
    setEditMode(false);
  };

  const handleNewGrn = () => {
    handleReset();
    setPoSearchTerm('');
    setViewMode('form');
  };

  const handleViewGrn = (grn) => {
    setFormData(grn);
    setPoSearchTerm(grn.poNumber || '');
    setEditMode(true);
    setViewMode('form');
  };

  const handleDelete = async (_id) => {
    if (!window.confirm('Are you sure you want to delete this GRN?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/MaterialReceived/${_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertMessage({ show: true, type: 'success', message: 'GRN deleted successfully!' });
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        loadGrns();
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to delete: ${errorData}` });
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
  };

  return (
    <Container fluid className="mt-3">
      {alertMessage.show && (
        <Alert 
          variant={alertMessage.type} 
          onClose={() => setAlertMessage({ show: false, type: '', message: '' })} 
          dismissible
        >
          {alertMessage.message}
        </Alert>
      )}

      {viewMode === 'list' ? (
        // List View - Display all GRNs
        <Card>
          <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-box-seam me-2"></i>
                Material Received Notes (GRN)
              </h4>
              
            </div>
            <Button variant="light" onClick={handleNewGrn}>
              <i className="bi bi-plus-circle me-2"></i>New GRN
            </Button>
          </Card.Header>
          <Card.Body>
            {/* Search Bar */}
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by GRN Number, PO Number, Supplier Name, or Invoice Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* GRN Table */}
            <Table striped bordered hover responsive style={{ fontSize: '0.875rem' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '12%' }}>GRN Number</th>
                  <th style={{ width: '10%' }}>GRN Date</th>
                  <th style={{ width: '14%' }}>PO Number</th>
                  <th style={{ width: '16%' }}>Supplier Name</th>
                  <th style={{ width: '12%' }}>Invoice Number</th>
                  <th style={{ width: '10%' }}>Invoice Date</th>
                  <th style={{ width: '12%' }}>Received By</th>
                  <th style={{ width: '14%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrns.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      {searchTerm ? 'No GRNs found matching your search.' : 'No GRNs available. Click "New GRN" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredGrns.map((grn) => (
                    <tr key={grn._id}>
                      <td>
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none"
                          onClick={() => handleViewGrn(grn)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          {grn.grnNumber}
                        </Button>
                      </td>
                      <td>{grn.grnDate ? new Date(grn.grnDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{grn.poNumber}</td>
                      <td>{grn.supplierName}</td>
                      <td>{grn.invoiceNumber}</td>
                      <td>{grn.invoiceDate ? new Date(grn.invoiceDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{grn.receivedBy}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewGrn(grn)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(grn._id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : (
        // Form View - Create/Edit GRN
        <Card>
          <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-box-seam me-2"></i>
                {editMode ? 'Edit Material Received Note' : 'New Material Received Note'}
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                Record and track material receipts from suppliers at construction sites
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="light" onClick={() => setViewMode('list')}>
                <i className="bi bi-arrow-left me-2"></i>Back to List
              </Button>
              <Button variant="light" type="submit" form="grnForm" className="border border-white">
                <i className="bi bi-save me-2"></i>{editMode ? 'Update' : 'Save'} GRN
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Form id="grnForm" onSubmit={handleSubmit}>
            {/* GRN Header Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Receipt Details</h5>
              <Row>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>GRN Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="grnNumber"
                      value={formData.grnNumber}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                      placeholder="Auto-generated"
                    />
                   
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>GRN Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="grnDate"
                      value={formData.grnDate}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>PO Number <span className="text-danger">*</span></Form.Label>
                    <div className="position-relative" ref={poDropdownRef}>
                      <Form.Control
                        type="text"
                        value={poSearchTerm}
                        onChange={(e) => {
                          setPoSearchTerm(e.target.value);
                          setShowPODropdown(true);
                        }}
                        onFocus={() => setShowPODropdown(true)}
                        placeholder="Search PO number"
                        required
                      />
                      {showPODropdown && filteredPOs.length > 0 && (
                        <Card 
                          className="position-absolute shadow-lg border" 
                          style={{ 
                            zIndex: 1000, 
                            maxHeight: '200px', 
                            overflowY: 'auto',
                            marginTop: '2px',
                            width: '100%'
                          }}
                        >
                          <Card.Body className="p-2">
                            {filteredPOs.map((po) => (
                              <div
                                key={po._id}
                                onClick={() => handlePOSelect(po)}
                                style={{
                                  padding: '8px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <div><strong>{po.poNumber}</strong></div>
                                <small className="text-muted">{po.supplierName}</small>
                              </div>
                            ))}
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Received By <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="receivedBy"
                      value={formData.receivedBy}
                      onChange={handleInputChange}
                      placeholder="Name of receiving person"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Supplier & Invoice Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Supplier & Invoice Information</h5>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Supplier Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="supplierName"
                      value={formData.supplierName}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                      placeholder="Auto-filled from PO"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Invoice Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={handleInputChange}
                      placeholder="Enter invoice number"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Invoice Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="invoiceDate"
                      value={formData.invoiceDate}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Transport Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Transport Details</h5>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vehicle Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleInputChange}
                      placeholder="Enter vehicle registration number"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Driver Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="driverName"
                      value={formData.driverName}
                      onChange={handleInputChange}
                      placeholder="Enter driver name"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Driver Contact Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="driverContact"
                      value={formData.driverContact}
                      onChange={handleInputChange}
                      placeholder="Enter driver contact number"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Materials Received */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Materials Received</h5>
              <HotTable
                ref={hotTableRef}
                data={[
                  ...(formData.items.length > 0 ? formData.items : [{
                    itemCode: '',
                    itemName: '',
                    unit: '',
                    orderedQty: 0,
                    receivedQty: 0,
                    rate: 0,
                    amount: 0
                  }]),
                  {
                    itemCode: 'Total:',
                    itemName: '',
                    unit: '',
                    orderedQty: '',
                    receivedQty: '',
                    rate: '',
                    amount: (formData.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
                    action: '',
                    isTotalRow: true
                  }
                ]}
                colHeaders={['Material', 'Unit', 'Ordered Qty', 'Received Qty', 'Rate (INR)', 'Amount (INR)', 'Action']}
                columns={[
                  {
                    data: 'itemCode',
                    type: 'dropdown',
                    source: materialItems.map(item => {
                      const itemData = item.itemData || item;
                      return itemData.material || '';
                    }),
                    strict: false,
                    filter: false,
                    width: 250,
                    renderer: (instance, td, row, col, prop, value, cellProperties) => {
                      const rowData = instance.getSourceDataAtRow(row);
                      if (rowData && rowData.itemName) {
                        td.innerHTML = rowData.itemName;
                        return td;
                      }
                      const materialItem = materialItems.find(item => {
                        const itemData = item.itemData || item;
                        return itemData.material === value;
                      });
                      if (materialItem) {
                        td.innerHTML = value;
                        return td;
                      }
                      td.innerHTML = value || '';
                      return td;
                    }
                  },
                  {
                    data: 'unit',
                    type: 'dropdown',
                    source: units,
                    strict: false,
                    width: 100
                  },
                  {
                    data: 'orderedQty',
                    type: 'numeric',
                    numericFormat: {
                      pattern: '0,0.00'
                    },
                    width: 120
                  },
                  {
                    data: 'receivedQty',
                    type: 'numeric',
                    numericFormat: {
                      pattern: '0,0.00'
                    },
                    width: 120
                  },
                  {
                    data: 'rate',
                    type: 'numeric',
                    numericFormat: {
                      pattern: '0,0.00'
                    },
                    width: 100,
                    readOnly: true,
                    className: 'htRight htMiddle bg-light'
                  },
                  {
                    data: 'amount',
                    type: 'numeric',
                    numericFormat: {
                      pattern: '0,0.00'
                    },
                    width: 120,
                    readOnly: true,
                    className: 'htRight htMiddle bg-light'
                  },
                  {
                    data: 'action',
                    width: 100,
                    readOnly: true,
                    renderer: (instance, td, row, col, prop, value, cellProperties) => {
                      const rowData = instance.getSourceDataAtRow(row);
                      
                      // Don't show buttons for total row
                      if (rowData && rowData.isTotalRow) {
                        td.innerHTML = '';
                        return td;
                      }
                      
                      td.innerHTML = '';
                      td.style.textAlign = 'center';
                      
                      // Add row button
                      const addBtn = document.createElement('button');
                      addBtn.className = 'btn btn-success btn-sm me-1';
                      addBtn.innerHTML = '<i class="bi bi-plus"></i>';
                      addBtn.onclick = () => {
                        const currentData = instance.getSourceData();
                        const newItems = currentData.filter(item => !item.isTotalRow).map(item => ({
                          itemCode: item.itemCode || '',
                          itemName: item.itemName || '',
                          unit: item.unit || '',
                          orderedQty: item.orderedQty || 0,
                          receivedQty: item.receivedQty || 0,
                          rate: item.rate || 0,
                          amount: item.amount || 0,
                          itemId: item.itemId || ''
                        }));
                        
                        newItems.splice(row + 1, 0, {
                          itemCode: '',
                          itemName: '',
                          unit: '',
                          orderedQty: 0,
                          receivedQty: 0,
                          rate: 0,
                          amount: 0
                        });
                        setFormData(prev => ({ ...prev, items: newItems }));
                      };
                      td.appendChild(addBtn);
                      
                      // Delete row button
                      if (formData.items.length > 0) {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'btn btn-danger btn-sm';
                        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
                        deleteBtn.onclick = () => {
                          const currentData = instance.getSourceData();
                          const newItems = currentData.filter((item, index) => 
                            index !== row && !item.isTotalRow)
                            .map(item => ({
                              itemCode: item.itemCode || '',
                              itemName: item.itemName || '',
                              unit: item.unit || '',
                              orderedQty: item.orderedQty || 0,
                              receivedQty: item.receivedQty || 0,
                              rate: item.rate || 0,
                              amount: item.amount || 0,
                              itemId: item.itemId || ''
                            }));
                          setFormData(prev => ({ ...prev, items: newItems }));
                        };
                        td.appendChild(deleteBtn);
                      }
                      
                      return td;
                    }
                  }
                ]}
                cells={(row, col) => {
                  const itemsToDisplay = formData.items.length > 0 ? formData.items : [{
                    itemCode: '',
                    itemName: '',
                    unit: '',
                    orderedQty: 0,
                    receivedQty: 0,
                    rate: 0,
                    amount: 0
                  }];
                  const dataRow = [...itemsToDisplay, { isTotalRow: true }][row];
                  const cellProperties = {};
                  
                  if (dataRow && dataRow.isTotalRow) {
                    cellProperties.readOnly = true;
                    cellProperties.type = 'text';
                  }
                  
                  return cellProperties;
                }}
                afterRenderer={(td, row, col, prop, value, cellProperties) => {
                  const itemsToDisplay = formData.items.length > 0 ? formData.items : [{
                    itemCode: '',
                    itemName: '',
                    unit: '',
                    orderedQty: 0,
                    receivedQty: 0,
                    rate: 0,
                    amount: 0
                  }];
                  const dataRow = [...itemsToDisplay, { isTotalRow: true }][row];
                  if (dataRow && dataRow.isTotalRow) {
                    td.style.borderTop = '2px solid #0d6efd';
                    td.style.fontWeight = 'bold';
                    td.style.backgroundColor = '#f8f9fa';
                    
                    if (col === 0) {
                      td.style.textAlign = 'right';
                      td.style.paddingRight = '15px';
                    } else if (col === 5) {
                      td.style.textAlign = 'right';
                      td.style.color = '#0d6efd';
                      const totalAmount = (formData.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                      td.innerHTML = totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    }
                  }
                }}
                width="100%"
                height="200"
                licenseKey="non-commercial-and-evaluation"
                stretchH="all"
                afterChange={(changes, source) => {
                  if (!changes || source === 'loadData') return;

                  changes.forEach(([row, prop, oldValue, newValue]) => {
                    const currentItems = formData.items.length > 0 ? formData.items : [{
                      itemCode: '',
                      itemName: '',
                      unit: '',
                      orderedQty: 0,
                      receivedQty: 0,
                      rate: 0,
                      amount: 0
                    }];
                    
                    const newItems = [...currentItems];
                    
                    if (!newItems[row]) {
                      newItems[row] = {
                        itemCode: '',
                        itemName: '',
                        unit: '',
                        orderedQty: 0,
                        receivedQty: 0,
                        rate: 0,
                        amount: 0
                      };
                    }

                    // Handle material selection
                    if (prop === 'itemCode' && newValue) {
                      const selectedItem = materialItems.find(item => {
                        const itemData = item.itemData || item;
                        return itemData.material === newValue;
                      });
                      
                      if (selectedItem) {
                        const itemData = selectedItem.itemData || selectedItem;
                        newItems[row] = {
                          ...newItems[row],
                          itemCode: itemData.material || '',
                          itemId: itemData._id || itemData.materialId || '',
                          itemName: itemData.material || '',
                          unit: itemData.unit || '',
                          rate: itemData.defaultRate || 0
                        };
                        // Calculate amount
                        const receivedQty = parseFloat(newItems[row].receivedQty) || 0;
                        const rate = parseFloat(newItems[row].rate) || 0;
                        newItems[row].amount = receivedQty * rate;
                      }
                    }

                    // Handle receivedQty or rate changes - calculate amount
                    if (prop === 'receivedQty' || prop === 'rate') {
                      newItems[row][prop] = newValue;
                      const receivedQty = parseFloat(newItems[row].receivedQty) || 0;
                      const rate = parseFloat(newItems[row].rate) || 0;
                      newItems[row].amount = receivedQty * rate;
                    }

                    // Handle other field changes
                    if (prop !== 'itemCode' && prop !== 'receivedQty' && prop !== 'rate') {
                      newItems[row][prop] = newValue;
                    }

                    setFormData(prev => ({ ...prev, items: newItems }));
                  });
                }}
              />
            </div>

            {/* Remarks */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Quality Check & Remarks</h5>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Quality Inspection Notes / Remarks</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="Enter quality check results, damages observed, storage location, or any other relevant notes"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default MaterialReceived;
