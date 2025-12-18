import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Alert, InputGroup, Modal } from 'react-bootstrap';
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
  const [showMovementTypeModal, setShowMovementTypeModal] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredPOs, setFilteredPOs] = useState([]);
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [materialItems, setMaterialItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [locationInventory, setLocationInventory] = useState([]);
  const [poItems, setPoItems] = useState([]); // Store original PO items for dropdown
  const hotTableRef = useRef(null);
  const poDropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    _id: '',
    movementType: '',
    referenceNumber: '',
    referenceDate: '',
    // Receipt fields
    poNumber: '',
    poId: '',
    supplierId: '',
    supplierName: '',
    invoiceNumber: '',
    invoiceDate: '',
    receivingLocationId: '',
    receivingLocationName: '',
    receivedBy: '',
    vehicleNumber: '',
    driverName: '',
    driverContact: '',
    // Only keep these location fields
    sourceLocationId: '',
    sourceLocationName: '',
    destinationLocationId: '',
    destinationLocationName: '',
    transportReference: '',
    // Other fields
    projectId: '',
    projectName: '',
    mainPurpose: '',
    originalGrnPo: '',
    remarks: '',
    companyCode: '',
    companyName: '',
    createdBy: '',
    modifiedBy: '',
    items: []
  });

  const movementTypes = [
    { 
      value: 'Receipt', 
      label: 'Receipt', 
      description: 'GRN from supplier against PO',
      icon: 'bi bi-box-arrow-in-down',
      color: '#28a745'
    },
    { 
      value: 'Transfer', 
      label: 'Transfer', 
      description: 'Warehouse to site',
      icon: 'bi bi-arrow-left-right',
      color: '#17a2b8'
    },
    { 
      value: 'Issue', 
      label: 'Issue', 
      description: 'Disbursement to project',
      icon: 'bi bi-box-arrow-right',
      color: '#ffc107'
    },
    { 
      value: 'Return', 
      label: 'Return', 
      description: 'Return to supplier',
      icon: 'bi bi-arrow-return-left',
      color: '#dc3545'
    }
  ];

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
        grn.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      // Load Suppliers
      const suppliersResponse = await fetch(`${apiBaseUrl}/api/Supplier`);
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      }

      // Load Locations
      const locationsResponse = await fetch(`${apiBaseUrl}/api/LocationMaster`);
      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        setLocations(Array.isArray(locationsData) ? locationsData : []);
      }

      // Load Projects
      const projectsResponse = await fetch(`${apiBaseUrl}/api/Projects/running`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
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

  const loadPurchaseOrdersBySupplier = async (supplierId) => {
    try {
      const companyId = localStorage.getItem('selectedCompanyId');
      const response = await fetch(`${apiBaseUrl}/api/PurchaseOrder/supplier/${supplierId}?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        // API returns an object with 'orders' array
        const ordersArray = data.orders || [];
        // Filter only approved POs
        const approvedPOs = ordersArray.filter(po => po.status === 'Approved');
        setPurchaseOrders(approvedPOs);
        setFilteredPOs(approvedPOs);
      } else {
        setPurchaseOrders([]);
        setFilteredPOs([]);
      }
    } catch (error) {
      console.error('Error loading purchase orders by supplier:', error);
      setPurchaseOrders([]);
      setFilteredPOs([]);
    }
  };

  const handlePOSelect = (po) => {
    const mappedItems = po.items.map(item => ({
      itemCode: item.itemName || item.itemCode || '',
      itemId: item.itemCode || '',
      itemName: item.itemName || '',
      unit: item.unit || '',
      orderedQty: item.purchaseQty || 0,
      receivedQty: 0,
      rate: item.rate || 0,
      amount: 0
    }));
    
    setPoItems(mappedItems); // Store original PO items
    setFormData(prev => ({
      ...prev,
      poNumber: po.poNumber,
      poId: po._id || '',
      supplierId: po.supplierId || '',
      supplierName: po.supplierName || '',
      items: mappedItems
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
        
        // Update formData with the auto-generated reference number from response
        if (!editMode && responseData.referenceNumber) {
          setFormData(prev => ({
            ...prev,
            referenceNumber: responseData.referenceNumber
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
    setPoItems([]);
    setFormData({
      _id: '',
      movementType: '',
      referenceNumber: '',
      referenceDate: '',
      // Receipt fields
      poNumber: '',
      poId: '',
      supplierId: '',
      supplierName: '',
      invoiceNumber: '',
      invoiceDate: '',
      receivingLocationId: '',
      receivingLocationName: '',
      receivedBy: '',
      vehicleNumber: '',
      driverName: '',
      driverContact: '',
      // Only keep these location fields
      sourceLocationId: '',
      sourceLocationName: '',
      destinationLocationId: '',
      destinationLocationName: '',
      transportReference: '',
      // Other fields
      projectId: '',
      projectName: '',
      mainPurpose: '',
      originalGrnPo: '',
      remarks: '',
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
    setShowMovementTypeModal(true);
  };

  const handleMovementTypeSelect = (movementType) => {
    setFormData(prev => ({ ...prev, movementType }));
    setShowMovementTypeModal(false);
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

  // Dynamic header fields rendering based on movement type
  const renderHeaderFields = () => {
    const movementType = formData.movementType;

    switch (movementType) {
      case 'Receipt':
        return (
          <>
            {/* Supplier & PO Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Supplier & PO Information</h5>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Supplier <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="supplierId"
                      value={formData.supplierId}
                      onChange={(e) => {
                        const selectedSupplier = suppliers.find(s => s._id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          supplierId: e.target.value,
                          supplierName: selectedSupplier?.supplierName || '',
                          poNumber: '',
                          poId: '',
                          items: []
                        }));
                        setPoSearchTerm('');
                        if (e.target.value) {
                          loadPurchaseOrdersBySupplier(e.target.value);
                        } else {
                          setPurchaseOrders([]);
                          setFilteredPOs([]);
                        }
                      }}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>{s.supplierName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Purchase Order # <span className="text-danger">*</span></Form.Label>
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
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Challan/Invoice # <span className="text-danger">*</span></Form.Label>
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
              </Row>
              <Row>
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
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Receiving Location <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="receivingLocationId"
                      value={formData.receivingLocationId}
                      onChange={(e) => {
                        const selectedLocation = locations.find(l => l._id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          receivingLocationId: e.target.value,
                          receivingLocationName: selectedLocation?.locationName || ''
                        }));
                      }}
                      required
                    >
                      <option value="">Select Location</option>
                      {locations.map(l => (
                        <option key={l._id} value={l._id}>{l.locationName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
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
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Remarks</Form.Label>
                    <Form.Control
                      type="text"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="Enter any additional notes"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </>
        );

      case 'Transfer':
        return (
          <div className="mb-4">
            <h5 className="border-bottom pb-2 mb-3">Transfer Information</h5>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Source Location <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="sourceLocationId"
                    value={formData.sourceLocationId}
                    onChange={(e) => {
                      const selectedLocation = locations.find(l => l._id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        sourceLocationId: e.target.value,
                        sourceLocationName: selectedLocation?.locationName || '',
                        items: [] // Clear items when location changes
                      }));
                      loadInventoryByLocation(e.target.value);
                    }}
                    required
                  >
                    <option value="">Select Source Location</option>
                    {locations.map(l => (
                      <option key={l._id} value={l._id}>{l.locationName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Destination Location <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="receivingLocationId"
                    value={formData.receivingLocationId}
                    onChange={(e) => {
                      const selectedLocation = locations.find(l => l._id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        receivingLocationId: e.target.value,
                        receivingLocationName: selectedLocation?.locationName || ''
                      }));
                    }}
                    required
                  >
                    <option value="">Select Destination Location</option>
                    {locations
                      .filter(l => l._id !== formData.sourceLocationId)
                      .map(l => (
                        <option key={l._id} value={l._id}>{l.locationName}</option>
                      ))
                    }
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Enter any additional notes"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        );

      case 'Issue': // Disbursement to project
        return (
          <div className="mb-4">
            <h5 className="border-bottom pb-2 mb-3">Issue Information</h5>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Source Location <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="sourceLocationId"
                    value={formData.sourceLocationId}
                    onChange={(e) => {
                      const selectedLocation = locations.find(l => l._id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        sourceLocationId: e.target.value,
                        sourceLocationName: selectedLocation?.locationName || '',
                        items: [] // Clear items when location changes
                      }));
                      loadInventoryByLocation(e.target.value);
                    }}
                    required
                  >
                    <option value="">Select Source Location</option>
                    {locations.map(l => (
                      <option key={l._id} value={l._id}>{l.locationName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Project <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="projectId"
                    value={formData.projectId}
                    onChange={async (e) => {
                      const selectedProject = projects.find(p => p._id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        projectId: e.target.value,
                        projectName: selectedProject?.name || ''
                      }));
                      setSelectedFloor('');
                      setEvents([]);
                      setSelectedEvent('');
                      setFloors([]);
                      if (e.target.value) {
                        try {
                          const res = await fetch(`${apiBaseUrl}/api/PriceEstimationForMaterialAndLabour/by-project/${e.target.value}`);
                          if (res.ok) {
                            const data = await res.json();
                            const floorList = (data.records && data.records[0] && data.records[0].floors) || [];
                            setFloors(floorList);
                          } else {
                            setFloors([]);
                          }
                        } catch {
                          setFloors([]);
                        }
                      }
                    }}
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Floor <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="floor"
                    value={selectedFloor}
                    onChange={e => {
                      setSelectedFloor(e.target.value);
                      setSelectedEvent('');
                      const floorObj = floors.find(f => f.floorName === e.target.value);
                      if (floorObj && floorObj.components) {
                        setEvents(Object.keys(floorObj.components));
                      } else {
                        setEvents([]);
                      }
                    }}
                    required
                    disabled={floors.length === 0}
                  >
                    <option value="">Select Floor</option>
                    {floors.map(f => (
                      <option key={f.floorName} value={f.floorName}>{f.floorName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Event <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="event"
                    value={selectedEvent}
                    onChange={e => setSelectedEvent(e.target.value)}
                    required
                    disabled={events.length === 0}
                  >
                    <option value="">Select Event</option>
                    {events.map(ev => (
                      <option key={ev} value={ev}>{ev}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Enter any additional notes"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        );

      case 'Return': // Return to supplier
        return (
          <div className="mb-4">
            <h5 className="border-bottom pb-2 mb-3">Return Information</h5>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Source Location <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="sourceLocationId"
                    value={formData.sourceLocationId}
                    onChange={(e) => {
                      const selectedLocation = locations.find(l => l._id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        sourceLocationId: e.target.value,
                        sourceLocationName: selectedLocation?.locationName || '',
                        items: [] // Clear items when location changes
                      }));
                      loadInventoryByLocation(e.target.value);
                    }}
                    required
                  >
                    <option value="">Select Source Location</option>
                    {locations.map(l => (
                      <option key={l._id} value={l._id}>{l.locationName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={(e) => {
                      const selectedSupplier = suppliers.find(s => s._id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        supplierId: e.target.value,
                        supplierName: selectedSupplier?.supplierName || ''
                      }));
                      // Load POs for selected supplier for reference
                      if (e.target.value) {
                        loadPurchaseOrdersBySupplier(e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.supplierName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Enter any additional notes"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        );

      default:
        return (
          <div className="mb-4">
            <p className="text-muted">Please select a movement type to continue.</p>
          </div>
        );
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
                Inventory Movement
              </h4>
              
            </div>
            <Button variant="light" onClick={handleNewGrn}>
              <i className="bi bi-plus-circle me-2"></i>New
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
                    placeholder="Search by Reference Number, PO Number, Supplier Name, or Invoice Number..."
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
                  <th style={{ width: '10%' }}>Movement Type</th>
                  <th style={{ width: '11%' }}>Reference Number</th>
                  <th style={{ width: '9%' }}>Reference Date</th>
                  <th style={{ width: '12%' }}>PO Number</th>
                  <th style={{ width: '15%' }}>Supplier Name</th>
                  <th style={{ width: '11%' }}>Invoice Number</th>
                  <th style={{ width: '9%' }}>Invoice Date</th>
                  <th style={{ width: '11%' }}>Received By</th>
                  <th style={{ width: '12%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrns.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      {searchTerm ? 'No Reference Number found matching your search.' : 'No Reference Numbers available. Click "New Reference" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredGrns.map((grn) => {
                    const movementTypeData = movementTypes.find(it => it.value === grn.movementType);
                    return (
                    <tr key={grn._id}>
                      <td>
                        {movementTypeData ? (
                          <span className="badge" style={{ backgroundColor: movementTypeData.color, fontSize: '0.75rem' }}>
                            <i className={`${movementTypeData.icon} me-1`}></i>
                            {movementTypeData.label}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none"
                          onClick={() => handleViewGrn(grn)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          {grn.referenceNumber}
                        </Button>
                      </td>
                      <td>{grn.referenceDate ? new Date(grn.referenceDate).toLocaleDateString('en-GB') : ''}</td>
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
                  );
                  })
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
                {editMode ? `Edit ${formData.movementType || 'Material'} Note` : `New ${formData.movementType || 'Material'} Entry`}
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                {formData.movementType && movementTypes.find(it => it.value === formData.movementType)?.description}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="light" onClick={() => setViewMode('list')}>
                <i className="bi bi-arrow-left me-2"></i>Back to List
              </Button>
              <Button variant="light" type="submit" form="grnForm" className="border border-white">
                <i className="bi bi-save me-2"></i>{editMode ? 'Update' : 'Save'}
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Form id="grnForm" onSubmit={handleSubmit}>
            {/* Common Header Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Transaction Details</h5>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reference Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="referenceNumber"
                      value={formData.referenceNumber}
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                      placeholder="Auto-generated"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reference Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="referenceDate"
                      value={formData.referenceDate}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Dynamic Movement Type Specific Fields */}
            {renderHeaderFields()}

            {/* Materials/Items */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Materials Received</h5>
              
              {/* Instruction message for Receipt case */}
              {formData.movementType === 'Receipt' && !formData.poId && (
                <Alert variant="info" className="mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Please select a Purchase Order above to load materials for receiving.
                </Alert>
              )}
              
              {/* Instruction message for non-Receipt cases */}
              {formData.movementType !== 'Receipt' && !formData.sourceLocationId && (
                <Alert variant="info" className="mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Please select a Source Location above to load available materials from inventory.
                </Alert>
              )}
              
              <HotTable
                ref={hotTableRef}
                data={
                  formData.movementType === 'Receipt'
                    ? [
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
                      ]
                    : (formData.items.length > 0 ? formData.items : [{
                        itemCode: '',
                        itemName: '',
                        unit: '',
                        stockQty: 0,
                        receivedQty: 0
                      }])
                }
                colHeaders={
                  formData.movementType === 'Receipt'
                    ? ['Material', 'Unit', 'Ordered Qty', 'Qty', 'Rate (INR)', 'Amount (INR)', 'Action']
                    : ['Material', 'Unit', 'Stock Qty', 'Qty', 'Action']
                }
                columns={
                  formData.movementType === 'Receipt'
                    ? [
                        {
                          data: 'itemCode',
                          type: 'dropdown',
                          source: poItems.length > 0 
                            ? poItems.map(item => item.itemName || item.itemCode || '')
                            : [],
                          strict: false,
                          filter: false,
                          width: 250,
                          renderer: (instance, td, row, col, prop, value, cellProperties) => {
                            const rowData = instance.getSourceDataAtRow(row);
                            if (rowData && rowData.itemName) {
                              td.innerHTML = rowData.itemName;
                              return td;
                            }
                            td.innerHTML = value || '';
                            return td;
                          }
                        },
                        {
                          data: 'unit',
                          type: 'text',
                          readOnly: true,
                          className: 'htMiddle bg-light',
                          width: 100
                        },
                        {
                          data: 'orderedQty',
                          type: 'numeric',
                          numericFormat: {
                            pattern: '0,0.00'
                          },
                          readOnly: true,
                          className: 'htRight htMiddle bg-light',
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
                      ]
                    : [
                        {
                          data: 'itemCode',
                          type: 'dropdown',
                          source: formData.sourceLocationId && locationInventory.length > 0 
                            ? locationInventory
                                .filter(item => item.locationId === formData.sourceLocationId)
                                .map(item => item.itemName || '')
                            : [],
                          strict: false,
                          filter: false,
                          width: 250,
                          renderer: (instance, td, row, col, prop, value, cellProperties) => {
                            const rowData = instance.getSourceDataAtRow(row);
                            if (rowData && rowData.itemName) {
                              td.innerHTML = rowData.itemName;
                              return td;
                            }
                            const inventoryItem = locationInventory.find(item => item.itemName === value);
                            if (inventoryItem) {
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
                          data: 'stockQty',
                          type: 'numeric',
                          numericFormat: {
                            pattern: '0,0.00'
                          },
                          width: 120,
                          readOnly: true,
                          className: 'htRight htMiddle bg-light'
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
                          data: 'action',
                          width: 100,
                          readOnly: true,
                          renderer: (instance, td, row, col, prop, value, cellProperties) => {
                            td.innerHTML = '';
                            td.style.textAlign = 'center';
                            
                            // Add row button
                            const addBtn = document.createElement('button');
                            addBtn.className = 'btn btn-success btn-sm me-1';
                            addBtn.innerHTML = '<i class="bi bi-plus"></i>';
                            addBtn.onclick = () => {
                              const currentData = instance.getSourceData();
                              const newItems = currentData.map(item => ({
                                itemCode: item.itemCode || '',
                                itemName: item.itemName || '',
                                unit: item.unit || '',
                                stockQty: item.stockQty || 0,
                                receivedQty: item.receivedQty || 0,
                                itemId: item.itemId || ''
                              }));
                              
                              newItems.splice(row + 1, 0, {
                                itemCode: '',
                                itemName: '',
                                unit: '',
                                stockQty: 0,
                                receivedQty: 0
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
                                const newItems = currentData.filter((item, index) => index !== row)
                                  .map(item => ({
                                    itemCode: item.itemCode || '',
                                    itemName: item.itemName || '',
                                    unit: item.unit || '',
                                    stockQty: item.stockQty || 0,
                                    receivedQty: item.receivedQty || 0,
                                    itemId: item.itemId || ''
                                  }));
                                setFormData(prev => ({ ...prev, items: newItems }));
                              };
                              td.appendChild(deleteBtn);
                            }
                            
                            return td;
                          }
                        }
                      ]
                }
                cells={(row, col) => {
                  if (formData.movementType === 'Receipt') {
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
                  }
                  return {};
                }}
                afterRenderer={(td, row, col, prop, value, cellProperties) => {
                  if (formData.movementType === 'Receipt') {
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
                  }
                }}
                width="100%"
                height="200"
                licenseKey="non-commercial-and-evaluation"
                stretchH="all"
                afterChange={(changes, source) => {
                  if (!changes || source === 'loadData') return;

                  changes.forEach(([row, prop, oldValue, newValue]) => {
                    if (formData.movementType === 'Receipt') {
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
                        // Find the item from the original PO items
                        const selectedItem = poItems.find(item => 
                          (item.itemName || item.itemCode) === newValue
                        );
                        
                        if (selectedItem) {
                          // Keep the existing item data from PO
                          newItems[row] = {
                            ...selectedItem,
                            receivedQty: newItems[row].receivedQty || 0
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
                    } else {
                      // For other movement types (Transfer, Issue, Return)
                      const currentItems = formData.items.length > 0 ? formData.items : [{
                        itemCode: '',
                        itemName: '',
                        unit: '',
                        stockQty: 0,
                        receivedQty: 0
                      }];
                      
                      const newItems = [...currentItems];
                      
                      if (!newItems[row]) {
                        newItems[row] = {
                          itemCode: '',
                          itemName: '',
                          unit: '',
                          stockQty: 0,
                          receivedQty: 0
                        };
                      }

                      // Handle material selection
                      if (prop === 'itemCode' && newValue) {
                        const inventoryItem = locationInventory.find(item => 
                          item.itemName === newValue && item.locationId === formData.sourceLocationId
                        );
                        
                        if (inventoryItem) {
                          // Find the material item to get unit information
                          const materialItem = materialItems.find(item => {
                            const itemData = item.itemData || item;
                            return itemData._id === inventoryItem.itemId || itemData.material === inventoryItem.itemName;
                          });
                          
                          const itemData = materialItem ? (materialItem.itemData || materialItem) : null;
                          
                          newItems[row] = {
                            ...newItems[row],
                            itemCode: inventoryItem.itemName || '',
                            itemId: inventoryItem.itemId || '',
                            itemName: inventoryItem.itemName || '',
                            unit: itemData?.unit || '',
                            stockQty: inventoryItem.stockQty || 0
                          };
                        }
                      }

                      // Handle other field changes
                      if (prop !== 'itemCode') {
                        newItems[row][prop] = newValue;
                      }

                      setFormData(prev => ({ ...prev, items: newItems }));
                    }
                  });
                }}
              />
            </div>

            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Movement Type Selection Modal */}
      <Modal 
        show={showMovementTypeModal} 
        onHide={() => setShowMovementTypeModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="bi bi-ui-checks me-2"></i>
            Select Transaction Type
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted mb-4">
            Choose the type of inventory transaction you want to create:
          </p>
          <Row className="g-3">
            {movementTypes.map((movementType) => (
              <Col md={6} key={movementType.value}>
                <Card 
                  className="h-100 shadow-sm border-2 cursor-pointer hover-card"
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderColor: movementType.color
                  }}
                  onClick={() => handleMovementTypeSelect(movementType.value)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-start">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ 
                          width: '60px', 
                          height: '60px',
                          backgroundColor: movementType.color + '20',
                          color: movementType.color
                        }}
                      >
                        <i className={`${movementType.icon}`} style={{ fontSize: '1.8rem' }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="mb-2" style={{ color: movementType.color }}>
                          {movementType.label}
                        </h5>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                          {movementType.description}
                        </p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMovementTypeModal(false)}>
            <i className="bi bi-x-circle me-2"></i>Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MaterialReceived;
