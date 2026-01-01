import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Alert, InputGroup, Modal, Pagination } from 'react-bootstrap';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { getPagePermissions } from './utils/menuSecurity';

registerAllModules();

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 10,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  companyAddress: {
    fontSize: 9,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    padding: 5,
    backgroundColor: '#cccccc',
  },
  section: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '25%',
    fontSize: 9,
    fontWeight: 'bold',
  },
  value: {
    width: '25%',
    fontSize: 9,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1 solid #000',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #cccccc',
    padding: 5,
    fontSize: 9,
  },
  tableRowTotal: {
    flexDirection: 'row',
    borderTop: '2 solid #000',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 9,
  },
  col1: { width: '5%' },
  col2: { width: '30%' },
  col3: { width: '15%' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '20%', textAlign: 'right' },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    width: '30%',
    textAlign: 'center',
    paddingTop: 40,
  },
  footerLabel: {
    fontSize: 9,
    borderTop: '1 solid #000',
    paddingTop: 5,
  },
  remarksSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  remarksSectionTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  chargesSection: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#e7f3ff',
  },
  chargesSectionTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 5,
  },
  chargeRow: {
    flexDirection: 'row',
    marginBottom: 3,
    fontSize: 9,
  },
  chargeLabel: {
    width: '60%',
  },
  chargeValue: {
    width: '40%',
    textAlign: 'right',
  },
});

// Helper to get company info and currency (match PurchaseOrders.js behavior)
const getCompanyInfo = () => {
  const companyName = localStorage.getItem('companyName') || '';
  let companyAddress = '';
  try {
    const addressObj = JSON.parse(localStorage.getItem('companyAddress') || '{}');
    const addressParts = [];
    if (addressObj.street) addressParts.push(addressObj.street);
    if (addressObj.city) addressParts.push(addressObj.city);
    if (addressObj.zipCode) addressParts.push(addressObj.zipCode);
    if (addressObj.country) addressParts.push(addressObj.country);
    companyAddress = addressParts.join(', ') || '';
  } catch (e) {
    companyAddress = localStorage.getItem('companyAddress') || '';
  }

  let companyPhone = '';
  let companyEmail = '';
  let companyWebsite = '';
  try {
    const contactObj = JSON.parse(localStorage.getItem('companyContact') || '{}');
    companyPhone = contactObj.phone || '';
    companyEmail = contactObj.email || '';
    companyWebsite = contactObj.website || '';
  } catch (e) {
    // ignore
  }

  const currency = localStorage.getItem('companyCurrency') || 'INR';
  return { companyName, companyAddress, companyPhone, companyEmail, companyWebsite, currency };
};

const formatCurrency = (amount, currency) => {
  return `${currency || 'INR'} ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
// Receipt Note PDF Component
const ReceiptNotePDF = ({ data }) => {
  if (!data) return null;

  const { companyName, companyAddress, companyPhone, currency } = getCompanyInfo();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  const materialTotal = (data.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalCharges = (data.charges || []).filter(c => (parseFloat(c.amount) || 0) > 0).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const totalDiscount = Math.abs((data.charges || []).filter(c => (parseFloat(c.amount) || 0) < 0).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0));
  const netPayable = materialTotal + totalCharges - totalDiscount;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.companyName}>{companyName}</Text>
          <Text style={pdfStyles.companyAddress}>{companyAddress}</Text>
          <Text style={pdfStyles.companyAddress}>Phone: {companyPhone}</Text>
        </View>

        <View style={pdfStyles.title}>
          <Text>GOODS RECEIPT NOTE (GRN)</Text>
        </View>

        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>GRN Number</Text>
            <Text style={pdfStyles.value}>: {data.referenceNumber || ''}</Text>
            <Text style={pdfStyles.label}>GRN Date</Text>
            <Text style={pdfStyles.value}>: {formatDate(data.referenceDate)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>PO Number</Text>
            <Text style={pdfStyles.value}>: {data.poNumber || ''}</Text>
            <Text style={pdfStyles.label}>Invoice Number</Text>
            <Text style={pdfStyles.value}>: {data.invoiceNumber || ''}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Supplier Name</Text>
            <Text style={pdfStyles.value}>: {data.supplierName || ''}</Text>
            <Text style={pdfStyles.label}>Invoice Date</Text>
            <Text style={pdfStyles.value}>: {formatDate(data.invoiceDate)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Work Order Type</Text>
            <Text style={pdfStyles.value}>: {data.workOrderType || ''}</Text>
            <Text style={pdfStyles.label}>Vehicle Number</Text>
            <Text style={pdfStyles.value}>: {data.vehicleNumber || ''}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.col1}>S/N</Text>
            <Text style={pdfStyles.col2}>Item Name</Text>
            <Text style={pdfStyles.col3}>Unit</Text>
            <Text style={pdfStyles.col4}>Ordered Qty</Text>
            <Text style={pdfStyles.col5}>Received Qty</Text>
            <Text style={pdfStyles.col6}>Amount ({currency || 'INR'})</Text>
          </View>
          {(data.items || []).map((item, index) => (
            <View key={index} style={pdfStyles.tableRow}>
              <Text style={pdfStyles.col1}>{index + 1}</Text>
              <Text style={pdfStyles.col2}>{item.itemName || ''}</Text>
              <Text style={pdfStyles.col3}>{item.unit || ''}</Text>
              <Text style={pdfStyles.col4}>{Number(item.orderedQty || 0).toFixed(2)}</Text>
              <Text style={pdfStyles.col5}>{Number(item.receivedQty || 0).toFixed(2)}</Text>
              <Text style={pdfStyles.col6}>{Number(item.amount || 0).toFixed(2)}</Text>
            </View>
          ))}
          <View style={pdfStyles.tableRowTotal}>
            <Text style={{ width: '65%' }}></Text>
            <Text style={{ width: '15%', textAlign: 'right' }}>Material Total</Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>{formatCurrency(materialTotal, currency)}</Text>
          </View>
        </View>

        {data.charges && data.charges.length > 0 && (
          <View style={pdfStyles.chargesSection}>
            <Text style={pdfStyles.chargesSectionTitle}>Charges & Discounts:</Text>
            {data.charges.map((charge, idx) => (
              <View key={idx} style={pdfStyles.chargeRow}>
                <Text style={pdfStyles.chargeLabel}>{charge.chargeType}: {charge.description || ''}</Text>
                <Text style={pdfStyles.chargeValue}>{formatCurrency(Number(charge.amount || 0), currency)}</Text>
              </View>
            ))}
            <View style={[pdfStyles.chargeRow, { marginTop: 5, borderTop: '1 solid #000', paddingTop: 5 }]}>
              <Text style={[pdfStyles.chargeLabel, { fontWeight: 'bold' }]}>Net Payable Amount:</Text>
              <Text style={[pdfStyles.chargeValue, { fontWeight: 'bold' }]}>{formatCurrency(netPayable, currency)}</Text>
            </View>
          </View>
        )}

        {data.remarks && (
          <View style={pdfStyles.remarksSection}>
            <Text style={pdfStyles.remarksSectionTitle}>Remarks:</Text>
            <Text style={pdfStyles.sectionContent}>{data.remarks}</Text>
          </View>
        )}

        <View style={pdfStyles.footer}>
          <View style={pdfStyles.footerItem}>
            <Text style={pdfStyles.footerLabel}>Verified By</Text>
          </View>
          <View style={pdfStyles.footerItem}>
            <Text style={pdfStyles.footerLabel}>Inspector</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const WCCReceived = () => {
  const permissions = getPagePermissions('Material Movement');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [grns, setGrns] = useState([]);
  const [filteredGrns, setFilteredGrns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [editMode, setEditMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredPOs, setFilteredPOs] = useState([]);
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [floors, setFloors] = useState([]);
  const currency = localStorage.getItem('companyCurrency') || 'INR';
  const [selectedFloor, setSelectedFloor] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [poItems, setPoItems] = useState([]); // Store original PO items for dropdown
  const [openingBalanceItems, setOpeningBalanceItems] = useState([]);
  const [showAddRowsModal, setShowAddRowsModal] = useState(false);
  const [rowsToAdd, setRowsToAdd] = useState(1);
  const hotTableRef = useRef(null);
  const poDropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    _id: '',
    movementType: 'Receipt', // Fixed to Receipt for Work Order Completion
    referenceNumber: '',
    referenceDate: '',
    // Receipt fields
    poNumber: '',
    poId: '',
    supplierId: '',
    supplierName: '',
    invoiceNumber: '',
    invoiceDate: '',
    workOrderType: 'Labour', // Default to Labour
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
    floor: '',
    event: '',
    mainPurpose: '',
    originalGrnPo: '',
    remarks: '',
    companyName: '',
    createdBy: '',
    modifiedBy: '',
    items: [],
    // Charges for Receipt type
    charges: []
  });

  // Movement type is fixed to Receipt for Work Order Completion
  const movementTypes = [
    { 
      value: 'Receipt', 
      label: 'Receipt', 
      description: 'Work Order Completion Receipt',
      icon: 'bi bi-box-arrow-in-down',
      color: '#28a745'
    }
  ];

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  // Memoize PDF content to prevent unnecessary re-renders
  const pdfContent = useMemo(() => {
    if (!showPDFModal) return null;
    return <ReceiptNotePDF data={formData} />;
  }, [showPDFModal, formData]);

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
    // Filter GRNs based on search term and movement type filter
    let filtered = grns;
    
    // Apply movement type filter
    if (movementTypeFilter && movementTypeFilter !== 'All') {
      filtered = filtered.filter(grn => grn.movementType === movementTypeFilter);
    }
    
    // Apply supplier filter
    if (supplierFilter && supplierFilter !== 'All') {
      filtered = filtered.filter(grn => grn.supplierName === supplierFilter);
    }
    
    // Apply search term filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(grn => 
        grn.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredGrns(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, grns, movementTypeFilter, supplierFilter]);

  useEffect(() => {
    if (viewMode === 'form') {
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

  // Removed loadInventoryByLocation - not needed for Work Order Completion

  

  const loadDropdownData = async () => {
    try {
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
      const companyId = localStorage.getItem('selectedCompanyId');
      const projectsResponse = await fetch(`${apiBaseUrl}/api/Projects/running?companyId=${companyId}`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
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
      lotNo: '',
      lotControlled: item.lotControlled || false,
      orderedQty: item.purchaseQty || 0,
      totalReceivedQty: item.totalReceivedQty || 0,
      balanceQty: item.balanceQty || 0,
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
      projectId: po.projectId || '',
      items: mappedItems
    }));
    setPoSearchTerm(''); // Clear search to show all POs
    setShowPODropdown(false);
  };

  const loadGrns = async () => {
    try {
      const companyId = localStorage.getItem('selectedCompanyId');
      const response = await fetch(`${apiBaseUrl}/api/ServiceReceived?companyId=${companyId}`);
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
      // Validation
      // Check if there are any items
      if (!formData.items || formData.items.length === 0) {
        setAlertMessage({ show: true, type: 'danger', message: 'Please add at least one item with received quantity.' });
        return;
      }
      
      // Check each item for valid received quantity and lot number
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        const receivedQty = parseFloat(item.receivedQty) || 0;
        const balanceQty = parseFloat(item.balanceQty) || 0;
        
        // Check if received quantity is greater than 0
        if (receivedQty <= 0) {
          setAlertMessage({ 
            show: true, 
            type: 'danger', 
            message: `Row ${i + 1} (${item.itemName || 'Unknown Item'}): Received Qty must be greater than 0.` 
          });
          return;
        }
        
        // Check if lot number is required for lot controlled items
        if (item.lotControlled && (!item.lotNo || item.lotNo.trim() === '')) {
          setAlertMessage({ 
            show: true, 
            type: 'danger', 
            message: `Row ${i + 1} (${item.itemName || 'Unknown Item'}): Lot No is required for lot controlled items.` 
          });
          return;
        }
        
        // Check if received quantity exceeds pending quantity (only for PO-based receipts, not opening balance)
        if (receivedQty > balanceQty) {
          setAlertMessage({ 
            show: true, 
            type: 'danger', 
            message: `Row ${i + 1} (${item.itemName || 'Unknown Item'}): Received Qty (${receivedQty}) cannot be greater than Pending Qty (${balanceQty}).` 
          });
          return;
        }
      }
      
      // Clean items - remove itemCode, itemName from each item
      const cleanedItems = formData.items.map(({ itemCode, itemName, ...rest }) => rest);
      
      // Calculate material total
      const materialTotal = (formData.items || []).reduce((sum, item) => 
        sum + (parseFloat(item.amount) || 0), 0);
      
      // Split charges and discounts
      let chargesArray = [];
      let discountsArray = [];
      
      if (formData.charges && formData.charges.length > 0) {
        formData.charges.forEach(charge => {
          if (charge.chargeType && charge.chargeType !== '') {
            if (charge.chargeType === 'Discount/Rebate (-)' || (parseFloat(charge.amount) || 0) < 0) {
              // Discount - store as positive value in discounts array
              discountsArray.push({
                chargeType: charge.chargeType,
                description: charge.description || '',
                amount: Math.abs(parseFloat(charge.amount) || 0)
              });
            } else {
              // Regular charge
              chargesArray.push({
                chargeType: charge.chargeType,
                description: charge.description || '',
                amount: parseFloat(charge.amount) || 0
              });
            }
          }
        });
      }
      
      // Prepare data - exclude fields populated by backend
      const { 
        supplierName, 
        supplierEmail,
        createdByUserName,
        createdByEmail,
        modifiedByUserName,
        modifiedByEmail,
        charges,
        ...formDataWithoutExcluded 
      } = formData;
      
      const dataToSend = {
        ...formDataWithoutExcluded,
        items: cleanedItems,
        materialTotal: materialTotal,
        charges: chargesArray,
        discounts: discountsArray,
        floor: selectedFloor || formData.floor || '',
        event: selectedEvent || formData.event || '',
        companyId: companyId,
        companyName: companyName,
        createdBy: editMode ? formData.createdBy : userId,
        modifiedBy: userId
      };
      
      const url = editMode 
        ? `${apiBaseUrl}/api/ServiceReceived/${formData._id}`
        : `${apiBaseUrl}/api/ServiceReceived`;
      
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
    setPurchaseOrders([]);
    setFilteredPOs([]);
    setOpeningBalanceItems([]);
    setFormData({
      _id: '',
      movementType: 'Receipt',
      referenceNumber: '',
      referenceDate: '',
      // Receipt fields
      poNumber: '',
      poId: '',
      supplierId: '',
      supplierName: '',
      invoiceNumber: '',
      invoiceDate: '',
      workOrderType: 'Labour',
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
      floor: '',
      event: '',
      mainPurpose: '',
      originalGrnPo: '',
      remarks: '',
      companyName: '',
      createdBy: '',
      modifiedBy: '',
      items: []
    });
    setSelectedFloor('');
    setSelectedEvent('');
    setEditMode(false);
  };

  const handleNewGrn = () => {
    if (!permissions.edit) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to create new material movements' });
      return;
    }
    
    handleReset();
    setPoSearchTerm('');
    setFormData(prev => ({ ...prev, movementType: 'Receipt' }));
    setViewMode('form');
  };

  const handleViewGrn = (grn) => {
    if (!permissions.view) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to view material movements' });
      return;
    }
    
    // Merge charges and discounts arrays back into single charges array
    const mergedCharges = [];
    
    // Add regular charges
    if (grn.charges && grn.charges.length > 0) {
      grn.charges.forEach(charge => {
        mergedCharges.push({
          chargeType: charge.chargeType,
          description: charge.description || '',
          amount: parseFloat(charge.amount) || 0
        });
      });
    }
    
    // Add discounts (convert to negative amounts)
    if (grn.discounts && grn.discounts.length > 0) {
      grn.discounts.forEach(discount => {
        mergedCharges.push({
          chargeType: discount.chargeType || 'Discount/Rebate (-)',
          description: discount.description || '',
          amount: -(Math.abs(parseFloat(discount.amount) || 0))
        });
      });
    }
    
    // Populate poItems for Receipt type to enable dropdown
    if (grn.movementType === 'Receipt' && grn.poId) {
      // Fetch latest PO items with updated received quantities
      fetch(`${apiBaseUrl}/api/PurchaseOrder/items/${grn.poId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.items) {
            const itemsForDropdown = data.items.map(item => ({
              itemCode: item.itemName || item.itemCode || '',
              itemId: item.itemCode || '',
              itemName: item.itemName || '',
              unit: item.unit || '',
              orderedQty: item.purchaseQty || 0,
              totalReceivedQty: item.totalReceivedQty || 0,
              balanceQty: item.balanceQty || 0,
              receivedQty: 0,
              rate: item.rate || 0,
              amount: 0
            }));
            setPoItems(itemsForDropdown);
          }
        })
        .catch(error => {
          console.error('Error loading PO items:', error);
          setPoItems([]);
        });
    }
    
    // Populate poItems for Return type to enable dropdown
    if (grn.movementType === 'Return' && grn.items && grn.items.length > 0) {
      const itemsForDropdown = grn.items.map(item => ({
        itemCode: item.itemId || item.itemCode || '',
        itemName: item.itemName || '',
        unit: item.unit || '',
        orderedQty: item.orderedQty || 0,
        receivedQty: item.receivedQty || 0,
        rate: item.rate || 0,
        amount: item.amount || 0
      }));
      setPoItems(itemsForDropdown);
      
      // Load POs for the supplier
      if (grn.supplierId) {
        loadPurchaseOrdersBySupplier(grn.supplierId);
      }
    }
    
    // Populate locationInventory for Transfer/Issue/Return types - removed for Work Order Completion
    
    // Set floor and event for Issue type
    if (grn.movementType === 'Issue') {
      setSelectedFloor(grn.floor || '');
      setSelectedEvent(grn.event || '');
      
      // Load floors if projectId exists
      if (grn.projectId) {
        fetch(`${apiBaseUrl}/api/PriceEstimationForMaterialAndLabour/by-project/${grn.projectId}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.records && data.records[0] && data.records[0].floors) {
              const floorList = data.records[0].floors;
              setFloors(floorList);
              
              // Load events if floor exists
              if (grn.floor) {
                const floorObj = floorList.find(f => f.floorName === grn.floor);
                if (floorObj && floorObj.components) {
                  setEvents(Object.keys(floorObj.components));
                }
              }
            }
          })
          .catch(() => {});
      }
    }
    
    setFormData({
      ...grn,
      charges: mergedCharges.length > 0 ? mergedCharges : []
    });
    setPoSearchTerm(grn.movementType === 'Return' ? (grn.originalGrnPo || '') : (grn.poNumber || ''));
    
    setEditMode(true);
    setViewMode('form');
  };

  const handleDelete = async (_id) => {
    if (!permissions.delete) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to delete material movements' });
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this GRN?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/ServiceReceived/${_id}`, {
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
                <Col md={3}>
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
                      disabled={editMode}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>{s.supplierName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Purchase Order # <span className="text-danger">*</span></Form.Label>
                    <div className="position-relative" ref={poDropdownRef}>
                      <Form.Control
                        type="text"
                        value={formData.poNumber || poSearchTerm}
                        onChange={(e) => {
                          setPoSearchTerm(e.target.value);
                          setFormData(prev => ({ ...prev, poNumber: '', poId: '', items: [] }));
                          setPoItems([]);
                          setShowPODropdown(true);
                        }}
                        onFocus={() => setShowPODropdown(true)}
                        placeholder="Search PO number"
                        required
                        disabled={editMode}
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
                                <div>{po.poNumber}</div>
                                
                              </div>
                            ))}
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={3}>
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
                <Col md={3}>
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
            
            {/* Receiving Information - Always visible for Receipt */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Receiving Information</h5>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Work Order Type <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="workOrderType"
                      value={formData.workOrderType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Labour">Labour</option>
                      <option value="Subcontract">Subcontract</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Verified By <span className="text-danger">*</span></Form.Label>
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
            </Row>
          </div>
        );

      case 'Issue': // Disbursement to project
        return (
          <div className="mb-4">
            <h5 className="border-bottom pb-2 mb-3">Issue Information</h5>
            <Row>
              <Col md={3}>
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
              <Col md={3}>
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
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Floor <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="floor"
                    value={selectedFloor}
                    onChange={e => {
                      setSelectedFloor(e.target.value);
                      setSelectedEvent('');
                      setFormData(prev => ({ ...prev, floor: e.target.value, event: '' }));
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
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Event <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="event"
                    value={selectedEvent}
                    onChange={e => {
                      setSelectedEvent(e.target.value);
                      setFormData(prev => ({ ...prev, event: e.target.value }));
                    }}
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
                        supplierName: selectedSupplier?.supplierName || '',
                        originalGrnPo: '',
                        items: []
                      }));
                      setPoSearchTerm('');
                      // Load POs for selected supplier
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
                  <Form.Label>Purchase Order # (Reference)</Form.Label>
                  <div className="position-relative" ref={poDropdownRef}>
                    <Form.Control
                      type="text"
                      value={formData.originalGrnPo || poSearchTerm}
                      onChange={(e) => {
                        setPoSearchTerm(e.target.value);
                        setFormData(prev => ({ ...prev, originalGrnPo: '' }));
                        setPoItems([]);
                        setShowPODropdown(true);
                      }}
                      onFocus={() => setShowPODropdown(true)}
                      placeholder="Search PO number (optional)"
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
                              onClick={async () => {
                                try {
                                  // Fetch material received records for this PO
                                  const companyId = localStorage.getItem('selectedCompanyId');
                                  const response = await fetch(`${apiBaseUrl}/api/ServiceReceived/by-po/${po._id}?companyId=${companyId}`);
                                  
                                  if (!response.ok) {
                                    setAlertMessage({
                                      show: true,
                                      type: 'danger',
                                      message: 'Failed to fetch material received records for this PO'
                                    });
                                    return;
                                  }
                                  
                                  const result = await response.json();
                                  
                                  if (!result.data || result.data.length === 0) {
                                    setAlertMessage({
                                      show: true,
                                      type: 'warning',
                                      message: 'No material received records found for this PO'
                                    });
                                    return;
                                  }
                                  
                                  // Get the first GRN record (most recent)
                                  const grnRecord = result.data[0];
                                  
                                  // Find the correct supplier from the GRN record
                                  const correctSupplier = suppliers.find(s => s.supplierName === grnRecord.supplierName);
                                  const correctLocation = locations.find(l => l.locationName === grnRecord.receivingLocationName);
                                  
                                  let message = '';
                                  let needsUpdate = false;
                                  
                                  // Check and update supplier if needed
                                  if (formData.supplierId !== grnRecord.supplierId) {
                                    if (correctSupplier) {
                                      needsUpdate = true;
                                      message += `Supplier set to "${grnRecord.supplierName}". `;
                                    } else {
                                      setAlertMessage({
                                        show: true,
                                        type: 'danger',
                                        message: `Supplier "${grnRecord.supplierName}" from PO not found in supplier list`
                                      });
                                      return;
                                    }
                                  }
                                  
                                  // Check and update location if needed
                                  if (formData.sourceLocationId !== grnRecord.receivingLocationId) {
                                    if (correctLocation) {
                                      needsUpdate = true;
                                      message += `Location set to "${grnRecord.receivingLocationName}". `;
                                    } else {
                                      setAlertMessage({
                                        show: true,
                                        type: 'danger',
                                        message: `Location "${grnRecord.receivingLocationName}" from PO not found in location list`
                                      });
                                      return;
                                    }
                                  }
                                  
                                  // Map items from GRN record with lot numbers
                                  const mappedItems = grnRecord.items.map(item => ({
                                    itemCode: item.itemName || '',
                                    itemId: item.itemId || '',
                                    itemName: item.itemName || '',
                                    unit: item.unit || '',
                                    lotNo: item.lotNo || '',
                                    lotControlled: item.lotControlled !== undefined ? item.lotControlled : false,
                                    orderedQty: item.orderedQty || 0,
                                    receivedQty: 0,
                                    rate: item.rate || 0,
                                    amount: 0
                                  }));
                                  
                                  // Store items in poItems for dropdown source
                                  setPoItems(mappedItems);
                                  
                                  // Update form data with correct supplier, location, and empty grid (user will select manually)
                                  setFormData(prev => ({
                                    ...prev,
                                    supplierId: correctSupplier?._id || prev.supplierId,
                                    supplierName: correctSupplier?.supplierName || prev.supplierName,
                                    sourceLocationId: correctLocation?._id || prev.sourceLocationId,
                                    sourceLocationName: correctLocation?.locationName || prev.sourceLocationName,
                                    originalGrnPo: po.poNumber,
                                    items: [{
                                      itemCode: '',
                                      itemName: '',
                                      unit: '',
                                      lotNo: '',
                                      lotControlled: false,
                                      orderedQty: 0,
                                      receivedQty: 0,
                                      rate: 0,
                                      amount: 0
                                    }]
                                  }));
                                  
                                  setPoSearchTerm('');
                                  setShowPODropdown(false);
                                  
                                  // Show success message
                                  if (needsUpdate) {
                                    setAlertMessage({
                                      show: true,
                                      type: 'success',
                                      message: message + 'Items loaded successfully for grid selection.'
                                    });
                                  } else {
                                    setAlertMessage({
                                      show: true,
                                      type: 'success',
                                      message: 'Items loaded successfully for grid selection.'
                                    });
                                  }
                                  
                                } catch (error) {
                                  console.error('Error fetching material received records:', error);
                                  setAlertMessage({
                                    show: true,
                                    type: 'danger',
                                    message: 'Error loading material received records: ' + error.message
                                  });
                                }
                              }}
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

  // Check view permission
  if (!permissions.view) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Access Denied
          </Alert.Heading>
          <p className="mb-0">
            You do not have permission to view this page. Please contact your administrator if you believe this is an error.
          </p>
        </Alert>
      </Container>
    );
  }

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
                Work Progress
              </h4>
              
            </div>
            {permissions.edit && (
              <Button variant="light" onClick={handleNewGrn}>
                <i className="bi bi-plus-circle me-2"></i>New
              </Button>
            )}
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
            {(() => {
              const indexOfLastItem = currentPage * itemsPerPage;
              const indexOfFirstItem = indexOfLastItem - itemsPerPage;
              const currentItems = filteredGrns.slice(indexOfFirstItem, indexOfLastItem);
              const totalPages = Math.ceil(filteredGrns.length / itemsPerPage);
              const paginate = (pageNumber) => setCurrentPage(pageNumber);
              
              return (
                <>
                  <Table striped bordered hover responsive style={{ fontSize: '0.875rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '8%' }}>
                          <div className="d-flex flex-column">
                            <span>Type</span>
                            <div className="mt-1">
                              <InputGroup size="sm">
                                <Form.Select
                                  value={movementTypeFilter}
                                  onChange={(e) => setMovementTypeFilter(e.target.value)}
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  <option value="All">All</option>
                                  {movementTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </Form.Select>
                                {movementTypeFilter !== 'All' && (
                                  <Button 
                                    variant="outline-light" 
                                    size="sm"
                                    onClick={() => setMovementTypeFilter('All')}
                                    title="Clear filter"
                                  >
                                    <i className="fas fa-times"></i>
                                  </Button>
                                )}
                              </InputGroup>
                            </div>
                          </div>
                        </th>
                        <th style={{ width: '15%', verticalAlign: 'top' }}>Reference Number</th>
                        <th style={{ width: '9%', verticalAlign: 'top' }}>Reference Date</th>
                        <th style={{ width: '12%', verticalAlign: 'top' }}>PO Number</th>
                        <th style={{ width: '12%', verticalAlign: 'top' }}>
                          <div className="d-flex flex-column">
                            <span>Supplier Name</span>
                            <div className="mt-1">
                              <InputGroup size="sm">
                                <Form.Select
                                  value={supplierFilter}
                                  onChange={(e) => setSupplierFilter(e.target.value)}
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  <option value="All">All</option>
                                  {Array.from(new Set(grns.map(grn => grn.supplierName).filter(Boolean))).sort().map(supplier => (
                                    <option key={supplier} value={supplier}>{supplier}</option>
                                  ))}
                                </Form.Select>
                                {supplierFilter !== 'All' && (
                                  <Button 
                                    variant="outline-light" 
                                    size="sm"
                                    onClick={() => setSupplierFilter('All')}
                                    title="Clear filter"
                                  >
                                    <i className="fas fa-times"></i>
                                  </Button>
                                )}
                              </InputGroup>
                            </div>
                          </div>
                        </th>
                        <th style={{ width: '11%', verticalAlign: 'top' }}>Invoice Number</th>
                        <th style={{ width: '9%', verticalAlign: 'top' }}>Invoice Date</th>
                        
                        {(permissions.edit || permissions.delete) && (
                          <th style={{ width: '10%', verticalAlign: 'top' }}>Actions</th>
                        )}
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
                        currentItems.map((grn) => {
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
                        {permissions.view ? (
                          <Button
                            variant="link"
                            className="p-0 text-decoration-none"
                            onClick={() => handleViewGrn(grn)}
                            style={{ fontSize: '0.875rem' }}
                          >
                            {grn.referenceNumber}
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.875rem' }}>{grn.referenceNumber}</span>
                        )}
                      </td>
                      <td>{grn.referenceDate ? new Date(grn.referenceDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{grn.poNumber}</td>
                      <td>{grn.supplierName}</td>
                      <td>{grn.invoiceNumber}</td>
                      <td>{grn.invoiceDate ? new Date(grn.invoiceDate).toLocaleDateString('en-GB') : ''}</td>
                      
                      {(permissions.edit || permissions.delete) && (
                        <td>
                          {permissions.edit && (
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-2"
                              onClick={() => handleViewGrn(grn)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                          )}
                          {permissions.delete && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDelete(grn._id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                  })
                      )}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <Pagination.First 
                          onClick={() => paginate(1)} 
                          disabled={currentPage === 1} 
                        />
                        <Pagination.Prev 
                          onClick={() => paginate(currentPage - 1)} 
                          disabled={currentPage === 1} 
                        />
                        
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1;
                          if (
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <Pagination.Item
                                key={page}
                                active={page === currentPage}
                                onClick={() => paginate(page)}
                              >
                                {page}
                              </Pagination.Item>
                            );
                          } else if (
                            page === currentPage - 2 || 
                            page === currentPage + 2
                          ) {
                            return <Pagination.Ellipsis key={page} />;
                          }
                          return null;
                        })}
                        
                        <Pagination.Next 
                          onClick={() => paginate(currentPage + 1)} 
                          disabled={currentPage === totalPages} 
                        />
                        <Pagination.Last 
                          onClick={() => paginate(totalPages)} 
                          disabled={currentPage === totalPages} 
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              );
            })()}
          </Card.Body>
        </Card>
      ) : (
        // Form View - Create/Edit GRN
        <Card>
          <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-box-seam me-2"></i>
                {editMode ? `Edit ${formData.movementType || 'Material'} Note` : `New Work Progress Entry`}
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                {formData.movementType && movementTypes.find(it => it.value === formData.movementType)?.description}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="light" onClick={() => setViewMode('list')}>
                <i className="bi bi-arrow-left me-2"></i>Back to List
              </Button>
              {editMode && formData._id && (
                <Button variant="info" onClick={() => setShowPDFModal(true)}>
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  View GRN
                </Button>
              )}
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

            {/* Dynamic Movement Type Specific Fields */}
            {renderHeaderFields()}

            {/* Materials/Items */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Work Completion Details</h5>
              
              {/* Instruction message */}
              {!formData.poId && (
                <Alert variant="info" className="mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Please select a Purchase Order above to load activities.
                </Alert>
              )}
              
              <HotTable
                ref={hotTableRef}
                className="handsontable-container"
                viewportRowRenderingOffset={30}
                data={[
                  ...(formData.items.length > 0 ? formData.items : [{
                    itemCode: '',
                    itemName: '',
                    unit: '',
                    lotNo: '',
                    orderedQty: 0,
                    receivedQty: 0,
                    rate: 0,
                    amount: 0
                  }]),
                  {
                    itemCode: 'Total:',
                    itemName: '',
                    unit: '',
                    lotNo: '',
                    orderedQty: '',
                    receivedQty: '',
                    rate: '',
                    amount: (formData.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
                    action: '',
                    isTotalRow: true
                  }
                ]}
                colHeaders={['Activity', 'Work Description', 'Unit', 'PO Qty','Complt. Till Now','Pending', 'WCC Qty', `Rate (${currency})`, `Amount (${currency})`, 'Action']}
                columns={[
                        {
                          data: 'itemName',
                          type: 'autocomplete',
                          source: openingBalanceItems.length > 0 
                            ? openingBalanceItems.map(item => item.itemName || '')
                            : [],
                          strict: true,
                          filter: false,
                          visibleRows: 10,
                          width: 200
                        },
                        {
                          data: 'lotNo',
                          type: 'text',
                          width: 120,
                          renderer: (instance, td, row, col, prop, value, cellProperties) => {
                            const rowData = instance.getSourceDataAtRow(row);
                            if (rowData && rowData.isTotalRow) {
                              td.innerHTML = '';
                              cellProperties.readOnly = true;
                            } else {
                              td.innerHTML = value || '';
                              // Make it yellow if item is lot controlled, disabled if not
                              if (rowData && rowData.lotControlled) {
                                td.style.backgroundColor = '#fffacd';
                                cellProperties.readOnly = false;
                              } else {
                                td.style.backgroundColor = '#f0f0f0';
                                cellProperties.readOnly = true;
                              }
                            }
                            return td;
                          }
                        },
                        {
                          data: 'unit',
                          type: 'text',
                          readOnly: true,
                          className: 'htMiddle bg-light',
                          width: 80
                        },
                        {
                          data: 'orderedQty',
                          type: 'numeric',
                          numericFormat: {
                            pattern: '0,0.00'
                          },
                          readOnly: true,
                          className: 'htRight htMiddle bg-light',
                          width: 90
                        },
                        {
                          data: 'totalReceivedQty',
                          type: 'numeric',
                          numericFormat: {
                            pattern: '0,0.00'
                          },
                          readOnly: true,
                          className: 'htRight htMiddle bg-light',
                          width: 100
                        },
                        {
                          data: 'balanceQty',
                          type: 'numeric',
                          numericFormat: {
                            pattern: '0,0.00'
                          },
                          readOnly: true,
                          className: 'htRight htMiddle bg-light',
                          width: 90
                        },
                        {
                          data: 'receivedQty',
                          type: 'numeric',
                          numericFormat: {
                            pattern: '0,0.00'
                          },
                          width: 100
                        },
                        {
                          data: 'rate',
                          type: 'numeric',
                          numericFormat: {
                            pattern: '0,0.00'
                          },
                          width: 100
                        },
                        {
                          data: 'amount',
                          type: 'numeric',
                          numericFormat: {
                            pattern: '0,0.00'
                          },
                          width: 100,
                          readOnly: true,
                          className: 'htRight htMiddle bg-light'
                        },
                        {
                          data: 'action',
                          width: 100,
                          readOnly: true,
                          renderer: (instance, td, row, col, prop, value, cellProperties) => {
                            const rowData = instance.getSourceDataAtRow(row);
                            if (rowData && rowData.isTotalRow) {
                              td.innerHTML = '';
                            } else {
                              // Clear existing content to prevent duplicate buttons
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
                                  itemId: item.itemId || '',
                                  unit: item.unit || '',
                                  lotNo: item.lotNo || '',
                                  lotControlled: item.lotControlled !== undefined ? item.lotControlled : false,
                                  receivedQty: item.receivedQty || 0,
                                  rate: item.rate || 0,
                                  amount: item.amount || 0
                                }));
                                
                                newItems.splice(row + 1, 0, {
                                  itemCode: '',
                                  itemName: '',
                                  itemId: '',
                                  unit: '',
                                  lotNo: '',
                                  lotControlled: false,
                                  receivedQty: 0,
                                  rate: 0,
                                  amount: 0
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
                                    .filter(item => !item.isTotalRow)
                                    .filter((_, index) => index !== row)
                                    .map(item => ({
                                      itemCode: item.itemCode || '',
                                      itemName: item.itemName || '',
                                      itemId: item.itemId || '',
                                      unit: item.unit || '',
                                      lotNo: item.lotNo || '',
                                      lotControlled: item.lotControlled !== undefined ? item.lotControlled : false,
                                      receivedQty: item.receivedQty || 0,
                                      rate: item.rate || 0,
                                      amount: item.amount || 0
                                    }));
                                  setFormData(prev => ({ ...prev, items: newItems }));
                                };
                                td.appendChild(deleteBtn);
                              }
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
                    } else if (col === 8) {
                      td.style.textAlign = 'right';
                      td.style.color = '#0d6efd';
                      const totalAmount = (formData.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                      td.innerHTML = totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    }
                  }
                }}
                width="100%"
                height="auto"
                licenseKey="non-commercial-and-evaluation"
                stretchH="all"
                fixedRowsTop={0}
                rowHeaders={true}
                rowHeaderWidth={35}
                contextMenu={true}
                afterRemoveRow={(index, amount) => {
                  // Update formData.items when rows are deleted via context menu
                  const hotInstance = hotTableRef.current?.hotInstance;
                  if (!hotInstance) return;
                  
                  const currentData = hotInstance.getSourceData();
                  const newItems = currentData.filter(item => !item.isTotalRow);
                  setFormData(prev => ({ ...prev, items: newItems }));
                }}
                afterChange={(changes, source) => {
                  if (!changes || source === 'loadData') return;

                  // Get current data from the grid instance once
                  const hotInstance = hotTableRef.current?.hotInstance;
                  if (!hotInstance) return;
                  
                  const currentData = hotInstance.getSourceData();
                  const currentItems = currentData.filter(item => !item.isTotalRow);
                  const newItems = currentItems.map(item => ({...item})); // Deep copy
                  
                  // Process all changes, updating newItems array
                  changes.forEach(([row, prop, oldValue, newValue]) => {
                    // Ensure row exists in newItems
                    while (newItems.length <= row) {
                      newItems.push({
                        itemCode: '',
                        itemName: '',
                        unit: '',
                        orderedQty: 0,
                        receivedQty: 0,
                        rate: 0,
                        amount: 0
                      });
                    }

                    // Handle material selection
                    if (prop === 'itemName' && newValue) {
                      // Find the item from the original PO items
                      const selectedItem = poItems.find(item => 
                          (item.itemName || item.itemCode) === newValue
                        );
                        
                        if (selectedItem) {
                          const existingReceivedQty = newItems[row]?.receivedQty || 0;
                          const existingLotNo = newItems[row]?.lotNo || '';
                          // Keep the existing item data from PO
                          newItems[row] = {
                            ...selectedItem,
                            lotNo: existingLotNo,
                            receivedQty: existingReceivedQty
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
                    if (prop !== 'itemName' && prop !== 'receivedQty' && prop !== 'rate') {
                      newItems[row][prop] = newValue;
                    }
                  });
                  
                  // Update state once after processing all changes
                  setFormData(prev => ({ ...prev, items: newItems }));
                }}
              />
            </div>

            </Form>
          </Card.Body>
        </Card>
      )}

      {/* PDF Modal */}
      <Modal show={showPDFModal} onHide={() => setShowPDFModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Goods Receipt Note (GRN)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '80vh' }}>
            {showPDFModal && (
              <PDFViewer width="100%" height="100%" showToolbar={true}>
                {pdfContent}
              </PDFViewer>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPDFModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Multiple Rows Modal */}
      <Modal show={showAddRowsModal} onHide={() => setShowAddRowsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-plus-square me-2"></i>
            Add Multiple Rows
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Number of rows to add:</Form.Label>
            <Form.Select
              value={rowsToAdd}
              onChange={(e) => setRowsToAdd(parseInt(e.target.value))}
            >
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddRowsModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              const currentItems = formData.items.length > 0 ? formData.items : [];
              const newRows = Array(rowsToAdd).fill(null).map(() => ({
                itemCode: '',
                itemName: '',
                itemId: '',
                unit: '',
                receivedQty: 0,
                rate: 0,
                amount: 0
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

export default WCCReceived;
