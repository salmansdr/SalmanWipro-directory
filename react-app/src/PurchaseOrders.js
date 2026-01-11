import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Alert, Badge, InputGroup, Modal, Pagination, Dropdown, DropdownButton } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { getPagePermissions } from './utils/menuSecurity';
import axiosClient from './api/axiosClient';

registerAllModules();

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 5,
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
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
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
    padding: 4,
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #cccccc',
    padding: 4,
    fontSize: 7.5,
  },
  tableRowTotal: {
    flexDirection: 'row',
    borderTop: '2 solid #000',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 8,
  },
  col1: { width: '5%' },
  col2: { width: '25%' },
  col3: { width: '15%' },
  col4: { width: '12%' },
  col5: { width: '13%', textAlign: 'right' },
  col6: { width: '13%', textAlign: 'right' },
  col7: { width: '12%', textAlign: 'center' },
  // Office copy column widths (with requisition number)
  col2Office: { width: '20%' },
  col3Office: { width: '12%' },
  col4Office: { width: '10%' },
  col5Office: { width: '11%', textAlign: 'right' },
  col6Office: { width: '11%', textAlign: 'right' },
  col7Office: { width: '10%', textAlign: 'center' },
  col8Office: { width: '12%', textAlign: 'center' },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    width: '30%',
    textAlign: 'center',
    paddingTop: 30,
  },
  footerLabel: {
    fontSize: 9,
    borderTop: '1 solid #000',
    paddingTop: 5,
  },
  terms: {
    marginTop: 15,
    fontSize: 8,
  },
  termsTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 10,
  },
  termItem: {
    marginBottom: 3,
    lineHeight: 1.4,
  },
  remarksSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  remarksSectionTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 5,
    color: '#2c3e50',
  },
  sectionContent: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#34495e',
  },
});

// PDF Document Component
const PurchaseOrderPDF = ({ poData, currency, copyType = 'supplier' }) => {
  if (!poData) {
    return (
      <Document>
        <Page size="A4" style={pdfStyles.page}>
          <View style={{ padding: 50, textAlign: 'center' }}>
            <Text style={{ fontSize: 16 }}>No Data Available</Text>
          </View>
        </Page>
      </Document>
    );
  }

  // Extract company information from localStorage
  const companyName = localStorage.getItem('companyName') || '';
  
  // Parse address object
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
    companyAddress = '';
  }
  
  // Parse contact object
  let companyPhone = '';
  let companyEmail = '';
  let companyWebsite = '';
  try {
    const contactObj = JSON.parse(localStorage.getItem('companyContact') || '{}');
    companyPhone = contactObj.phone || '';
    companyEmail = contactObj.email || '';
    companyWebsite = contactObj.website || '';
  } catch (e) {
    
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount) => {
    return `${currency || 'INR'} ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Group items by itemCode and deliveryDate, then sum quantities and amounts
  // For office copy, also group by requisition number
  const groupedItems = (poData.items || []).reduce((acc, item) => {
    // Create unique key combining itemCode, deliveryDate, and requisitionNumber for office copy
    const key = copyType === 'office' 
      ? `${item.itemCode || item.itemName || ''}_${item.deliveryDate || ''}_${item.requisitionNumber || ''}`
      : `${item.itemCode || item.itemName || ''}_${item.deliveryDate || ''}`;
    
    if (!acc[key]) {
      acc[key] = {
        itemCode: item.itemCode,
        itemName: item.itemName || item.itemCode || '',
        description: item.description || '',
        unit: item.unit || '',
        purchaseQty: 0,
        rate: item.rate || 0,
        amount: 0,
        workScope: item.workScope || '',
        deliveryDate: item.deliveryDate || '',
        requisitionNumber: item.requisitionNumber || ''
      };
    }
    acc[key].purchaseQty += parseFloat(item.purchaseQty) || 0;
    acc[key].amount += parseFloat(item.amount) || 0;
    return acc;
  }, {});
  
  const mergedItems = Object.values(groupedItems);
  const total = mergedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <Document key={copyType}>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.companyName}>{companyName}</Text>
          <Text style={pdfStyles.companyAddress}>{companyAddress}</Text>
          <Text style={pdfStyles.companyAddress}>Phone: {companyPhone}  </Text>
          <Text style={pdfStyles.companyAddress}>E-mail: {companyEmail}  Web: {companyWebsite}</Text>
        </View>

        {/* Title */}
        <View style={pdfStyles.title}>
          <Text>PURCHASE ORDER</Text>
        </View>

        {/* PO Details */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Purchase Order No.</Text>
            <Text style={pdfStyles.value}>: {poData.poNumber || ''}</Text>
            <Text style={pdfStyles.label}>Purchase Order Date</Text>
            <Text style={pdfStyles.value}>: {formatDate(poData.poDate)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Supplier Name</Text>
            <Text style={pdfStyles.value}>: {poData.supplierName || ''}</Text>
            <Text style={pdfStyles.label}>Delivery Date</Text>
            <Text style={pdfStyles.value}>: {formatDate(poData.deliveryDate)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Supplier Address</Text>
            <Text style={pdfStyles.value}>: {poData.deliveryLocation || ''}</Text>
            <Text style={pdfStyles.label}>Mode of Payment</Text>
            <Text style={pdfStyles.value}>: {poData.modeOfPayment || ''}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Supplier Contact  No</Text>
            <Text style={pdfStyles.value}>: {poData.supplierMobileNumber || ''}</Text>
            <Text style={pdfStyles.label}>Project Name</Text>
            <Text style={pdfStyles.value}>: {poData.projectName || ''}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Sup Contact Person</Text>
            <Text style={pdfStyles.value}>: {poData.supplierContactPerson || ''}</Text>
            <Text style={pdfStyles.label}>Project Address</Text>
            <Text style={pdfStyles.value}>: {poData.projectAddress || poData.deliveryLocation || ''}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={pdfStyles.table}>
          <Text style={pdfStyles.sectionTitle}>Details of Products</Text>
          {copyType === 'office' ? (
            <>
              <View style={pdfStyles.tableHeader}>
                <Text style={pdfStyles.col1}>S/L</Text>
                <Text style={pdfStyles.col2Office}>{poData.itemType === 'Service' ? 'Work Scope' : 'Item Name'}</Text>
                <Text style={pdfStyles.col3Office}>Description</Text>
                <Text style={pdfStyles.col4Office}>Quantity Unit</Text>
                <Text style={pdfStyles.col5Office}>Rate ({currency || 'INR'})</Text>
                <Text style={pdfStyles.col6Office}>Amount ({currency || 'INR'})</Text>
                <Text style={pdfStyles.col7Office}>Delivery Date</Text>
                <Text style={pdfStyles.col8Office}>Req. No</Text>
              </View>
              {mergedItems.map((item, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.col1}>{index + 1}</Text>
                  <Text style={pdfStyles.col2Office}>{poData.itemType === 'Service' ? (item.workScope || '') : (item.itemName || '')}</Text>
                  <Text style={pdfStyles.col3Office}>{item.description || ''}</Text>
                  <Text style={pdfStyles.col4Office}>{item.purchaseQty || 0} {item.unit || ''}</Text>
                  <Text style={pdfStyles.col5Office}>{Number(item.rate || 0).toFixed(2)}</Text>
                  <Text style={pdfStyles.col6Office}>{Number(item.amount || 0).toFixed(2)}</Text>
                  <Text style={pdfStyles.col7Office}>{item.deliveryDate || ''}</Text>
                  <Text style={pdfStyles.col8Office}>{item.requisitionNumber || '-'}</Text>
                </View>
              ))}
              <View style={pdfStyles.tableRowTotal}>
                <Text style={{ width: '63%', textAlign: 'right', fontWeight: 'bold' }}>Grand Total</Text>
                <Text style={{ width: '13%', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(total)}</Text>
                <Text style={{ width: '24%' }}></Text>
              </View>
            </>
          ) : (
            <>
              <View style={pdfStyles.tableHeader}>
                <Text style={pdfStyles.col1}>S/L</Text>
                <Text style={pdfStyles.col2}>{poData.itemType === 'Service' ? 'Work Scope' : 'Item Name'}</Text>
                <Text style={pdfStyles.col3}>Description</Text>
                <Text style={pdfStyles.col4}>Quantity Unit</Text>
                <Text style={pdfStyles.col5}>Rate ({currency || 'INR'})</Text>
                <Text style={pdfStyles.col6}>Amount ({currency || 'INR'})</Text>
                <Text style={pdfStyles.col7}>Delivery Date</Text>
              </View>
              {mergedItems.map((item, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={pdfStyles.col1}>{index + 1}</Text>
                  <Text style={pdfStyles.col2}>{poData.itemType === 'Service' ? (item.workScope || '') : (item.itemName || '')}</Text>
                  <Text style={pdfStyles.col3}>{item.description || ''}</Text>
                  <Text style={pdfStyles.col4}>{item.purchaseQty || 0} {item.unit || ''}</Text>
                  <Text style={pdfStyles.col5}>{Number(item.rate || 0).toFixed(2)}</Text>
                  <Text style={pdfStyles.col6}>{Number(item.amount || 0).toFixed(2)}</Text>
                  <Text style={pdfStyles.col7}>{item.deliveryDate || ''}</Text>
                </View>
              ))}
              <View style={pdfStyles.tableRowTotal}>
                <Text style={{ width: '70%', textAlign: 'right', fontWeight: 'bold' }}>Grand Total</Text>
                <Text style={{ width: '13%', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(total)}</Text>
                <Text style={{ width: '12%' }}></Text>
              </View>
            </>
          )}
        </View>

        {/* Remarks Section */}
        {poData.remarks && (
          <View style={pdfStyles.remarksSection}>
            <Text style={pdfStyles.remarksSectionTitle}>Remarks / Special Instructions:</Text>
            <Text style={pdfStyles.sectionContent}>{poData.remarks}</Text>
          </View>
        )}

        {/* Terms & Conditions */}
        {poData.TermsCondition && (
          <View style={pdfStyles.terms}>
            <Text style={pdfStyles.termsTitle}>Terms & Conditions:</Text>
            <Text style={pdfStyles.sectionContent}>{poData.TermsCondition}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <View style={pdfStyles.footerItem}>
            <Text style={pdfStyles.footerLabel}>Prepared by</Text>
          </View>
          <View style={pdfStyles.footerItem}>
            <Text style={pdfStyles.footerLabel}>Recommended by</Text>
          </View>
          <View style={pdfStyles.footerItem}>
            <Text style={pdfStyles.footerLabel}>Approved by</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const PurchaseOrders = () => {
  const permissions = getPagePermissions('Purchase Orders');
  const location = useLocation();
  const navigate = useNavigate();
  // If navigating for approval, start directly in form mode
  const initialViewMode = (location.state?.action === 'approve') ? 'form' : 'list';
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isViewMode, setIsViewMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const hotTableRef = useRef(null);
  
  // Dropdown data
  const [materialItems, setMaterialItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [materialRequirements, setMaterialRequirements] = useState([]);
  const [componentRequirements, setComponentRequirements] = useState([]);
  const [currency, setCurrency] = useState('');
  const [userName] = useState(localStorage.getItem('username') || '');
  const [userFullName] = useState(localStorage.getItem('fullName') || '');
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [companyId] = useState(localStorage.getItem('selectedCompanyId') || '');
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [currentPdfCopyType, setCurrentPdfCopyType] = useState('supplier');
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(true);
  const [showApproverDetails, setShowApproverDetails] = useState(true);
  const [showRequisitionDropdown, setShowRequisitionDropdown] = useState(false);
  const requisitionDropdownRef = useRef(null);
  const [originalRequisitionNumbers, setOriginalRequisitionNumbers] = useState([]);
  const [approverDetails, setApproverDetails] = useState({
    approverId: '',
    approverName: '',
    approverEmail: '',
    approverComments: ''
  });
  
  const [formData, setFormData] = useState({
    _id: '',
    poNumber: '',
    poDate: '',
    purchaseType: 'project',
    itemType: 'Material',
    supplierId: '',
    supplierName: '',
    supplierEmail: '',
    supplierContactPerson: '',
    supplierMobileNumber: '',
    projectId: '',
    projectName: '',
    requisitions: [],  // Array of objects: { requisitionId, requisitionNumber, requisitionDate, createdBy }
    requisitionIds: [],  // Keep for backward compatibility and UI conditional rendering
    requisitionNumbers: [],  // Keep for backward compatibility and UI conditional rendering
    deliveryDate: '',
    deliveryLocation: '',
    modeOfPayment: '',
    remarks: '',
    TermsCondition: '',
    status: 'Draft',
    approverUserId: '',
    approverComments: [],
    items: []
  });

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  // Load currency from localStorage
  useEffect(() => {
    const currency = localStorage.getItem('companyCurrency');
    if (currency) {
      try {
        //const company = JSON.parse(companySetup);
        setCurrency(currency || 'INR');
      } catch (error) {
        console.error('Error parsing company setup:', error);
      }
    }

    // Check if navigated from Main.js with action to create new form
    if (location.state?.viewMode === 'form' && location.state?.action === 'new') {
      handleNewPO();
    }
    
    // Check if navigated from Main.js for approval - load directly without showing list
    if (location.state?.viewMode === 'form' && location.state?.action === 'approve' && location.state?.poNumber) {
      const loadPOForApproval = async () => {
        try {
          // Load dropdown data first (needed for form)
          await loadDropdownData();
          
          // Fetch only the specific purchase order by number
          const response = await axiosClient.get(`/api/PurchaseOrder?companyId=${companyId}`);
          if (response.status === 200) {
            const data = response.data;
            
            const poToApprove = data.find(
              po => po.poNumber === location.state.poNumber
            );
            
            if (poToApprove) {
              // Extract requisition data
              let requisitionIds = [];
              let requisitionNumbers = [];
              let requisitions = [];
              
              if (poToApprove.requisitions && Array.isArray(poToApprove.requisitions)) {
                requisitions = poToApprove.requisitions;
                requisitionIds = requisitions.map(req => req.requisitionId);
                requisitionNumbers = requisitions.map(req => req.requisitionNumber);
              } else {
                requisitionIds = Array.isArray(poToApprove.requisitionIds) ? poToApprove.requisitionIds : (poToApprove.requisitionId ? [poToApprove.requisitionId] : []);
                requisitionNumbers = Array.isArray(poToApprove.requisitionNumbers) ? poToApprove.requisitionNumbers : (poToApprove.requisitionNumber ? [poToApprove.requisitionNumber] : []);
              }
              
              // Transform items
              const transformedPO = {
                ...poToApprove,
                itemType: poToApprove.itemType || 'Material',
                requisitions: requisitions,
                requisitionIds: requisitionIds,
                requisitionNumbers: requisitionNumbers,
                items: poToApprove.items?.map(item => {
                  if (item.itemName) {
                    return {
                      ...item,
                      itemCode: item.itemName,
                      itemId: item.itemCode
                    };
                  }
                  
                  const materialItem = materialItems.find(mi => {
                    const itemData = mi.itemData || mi;
                    return (itemData._id || itemData.materialId) === item.itemCode;
                  });
                  
                  if (materialItem) {
                    const itemData = materialItem.itemData || materialItem;
                    return {
                      ...item,
                      itemCode: itemData.material || item.itemCode,
                      itemId: item.itemCode
                    };
                  }
                  
                  return item;
                }) || []
              };
              
              // Set approver details
              if (poToApprove.approverUserId) {
                const approver = users.find(u => u._id === poToApprove.approverUserId);
                setApproverDetails({
                  approverId: poToApprove.approverUserId,
                  approverName: approver ? approver.username : '',
                  approverEmail: approver ? approver.email : (poToApprove.approverEmail || ''),
                  approverComments: ''
                });
              }
              
              setFormData(transformedPO);
              setEditMode(false);
              setIsViewMode(poToApprove.status === 'ApprovalRequest');
              setOriginalRequisitionNumbers(requisitionNumbers);
            }
          }
        } catch (error) {
          console.error('Error loading purchase order for approval:', error);
          setAlertMessage({ show: true, type: 'danger', message: 'Failed to load purchase order for approval' });
        }
      };
      
      loadPOForApproval();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewMode === 'list') {
      loadPurchaseOrders();
    } else if (viewMode === 'form') {
      loadDropdownData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    // Filter orders based on search term
    if (searchTerm.trim() === '') {
      setFilteredOrders(purchaseOrders);
    } else {
      const filtered = purchaseOrders.filter(po => 
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchTerm, purchaseOrders]);

  const loadDropdownData = async () => {
    try {
      // Load Material Items
      try {
        const itemsResp = await axiosClient.get('/api/materialitems');
        const itemsData = itemsResp.data;
        setMaterialItems(Array.isArray(itemsData) ? itemsData : []);
      } catch (err) {
        setMaterialItems([]);
      }

      // Load Suppliers
      try {
        const suppliersResp = await axiosClient.get('/api/Supplier');
        const suppliersData = suppliersResp.data;
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      } catch (err) {
        setSuppliers([]);
      }

      // Load Projects
      const companyId = localStorage.getItem('selectedCompanyId') || '1';
      try {
        const projectsResp = await axiosClient.get(`/api/Projects/basic?companyId=${companyId}`);
        const projectsData = projectsResp.data;
        const activeProjects = Array.isArray(projectsData)
          ? projectsData.filter(project => project.status !== 'Completed')
          : [];
        setProjects(activeProjects);
      } catch (err) {
        setProjects([]);
      }

      // Load Approved Requisitions
      try {
        const requisitionsResp = await axiosClient.get(`/api/Requisition/approved?companyId=${companyId}`);
        const requisitionsData = requisitionsResp.data;
        setRequisitions(Array.isArray(requisitionsData) ? requisitionsData : []);
      } catch (err) {
        setRequisitions([]);
      }

      // Load Users for approver dropdown
      try {
        const usersResp = await axiosClient.get('/api/Usermaster');
        const usersData = usersResp.data;
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        setUsers([]);
      }

      // Load Units
      try {
        const unitsResp = await axiosClient.get('/api/MaterialItems/units');
        const unitsData = unitsResp.data;
        let unitsArray = Array.isArray(unitsData) ? unitsData : (unitsData.units || []);
        if (unitsArray.length > 0 && typeof unitsArray[0] === 'object' && unitsArray[0].unit) {
          unitsArray = unitsArray.map(item => item.unit);
        }
        setUnits(unitsArray);
      } catch (err) {
        // leave units as default empty
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const resp = await axiosClient.get(`/api/PurchaseOrder?companyId=${companyId}`);
      const data = resp.data;
      setPurchaseOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      const errMsg = error.code === 'ECONNABORTED' 
        ? 'Request timed out. The server is taking too long to respond.'
        : error?.response?.data || error.message || 'Failed to load purchase orders';
      setAlertMessage({ show: true, type: 'danger', message: errMsg });
      setPurchaseOrders([]);
      setFilteredOrders([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for supplier selection
    if (name === 'supplierName') {
      const selectedSupplier = suppliers.find(s => s.supplierName === value);
      setFormData(prev => ({
        ...prev,
        supplierName: value,
        supplierId: selectedSupplier?._id || '',
        supplierEmail: selectedSupplier?.email || '',
        supplierContactPerson: selectedSupplier?.contactPerson || '',
        supplierMobileNumber: selectedSupplier?.mobileNumber || ''
      }));
    } else if (name === 'deliveryDate') {
      // Special handling for delivery date - update empty delivery dates in grid items
      const convertedDate = value ? value.split('-').reverse().join('/') : '';
      setFormData(prev => ({
        ...prev,
        deliveryDate: value,
        items: prev.items.map(item => ({
          ...item,
          deliveryDate: (!item.deliveryDate || item.deliveryDate.trim() === '') ? convertedDate : item.deliveryDate
        }))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProjectChange = async (e) => {
    const projectName = e.target.value;
    const selectedProject = projects.find(p => p.name === projectName);
    
    // Extract projectCode from the selected project
    const projectId = selectedProject 
      ? ( selectedProject._id || '')
      : '';
    
    
    
    setFormData(prev => ({
      ...prev,
      projectName: projectName,
      projectId: projectId,
      deliveryLocation: prev.purchaseType === 'project' && selectedProject ? (selectedProject.location || '') : prev.deliveryLocation,
      items: [] // Clear grid items when project changes
    }));

    

    // Fetch material requirements if project is selected
    if (selectedProject && selectedProject._id) {
      await fetchMaterialRequirements(selectedProject._id);
    } else {
      setMaterialRequirements([]);
      setComponentRequirements([]);
      
      
    }
  };

  const fetchMaterialRequirements = async (projectId) => {
    try {
      const resp = await axiosClient.get(`/api/ProjectEstimation/report-by-project/${projectId}`);
      const data = resp.data;

      if (data && data.materialRequirements && Array.isArray(data.materialRequirements) && data.materialRequirements.length > 0) {
        setMaterialRequirements(data.materialRequirements);
      } else {
        setMaterialRequirements([]);
      }

      if (data && data.componentRequirements && Array.isArray(data.componentRequirements) && data.componentRequirements.length > 0) {
        setComponentRequirements(data.componentRequirements);
      } else {
        setComponentRequirements([]);
      }
    } catch (error) {
      console.error('Error fetching material requirements:', error);
      setMaterialRequirements([]);
      setComponentRequirements([]);
      setAlertMessage({ show: true, type: 'warning', message: 'Failed to load material requirements' });
    }
  };

  const handleRequisitionToggle = (requisitionNumber) => {
    const selectedRequisition = requisitions.find(req => req.requisitionNumber === requisitionNumber);
    if (!selectedRequisition) return;

    setFormData(prev => {
      const isCurrentlySelected = prev.requisitionNumbers.includes(requisitionNumber);
      
      // Check if requisition is locked and was not originally part of this PO
      const wasOriginallySelected = originalRequisitionNumbers.includes(requisitionNumber);
      if (selectedRequisition.isLocked && !isCurrentlySelected && !wasOriginallySelected) {
        alert('This requisition is locked and cannot be selected.');
        return prev;
      }
      
      let newRequisitions, newRequisitionNumbers, newRequisitionIds, newItems;

      if (isCurrentlySelected) {
        // Remove this requisition
        newRequisitions = prev.requisitions.filter(req => req.requisitionNumber !== requisitionNumber);
        newRequisitionNumbers = prev.requisitionNumbers.filter(num => num !== requisitionNumber);
        newRequisitionIds = prev.requisitionIds.filter(id => id !== selectedRequisition._id);
        // Remove items from this requisition
        newItems = prev.items.filter(item => item.requisitionNumber !== requisitionNumber);
      } else {
        // Add this requisition with complete details
        const requisitionObj = {
          requisitionId: selectedRequisition._id,
          requisitionNumber: selectedRequisition.requisitionNumber,
          requisitionDate: selectedRequisition.requisitionDate,
          createdBy: selectedRequisition.createdByName
        };
        newRequisitions = [...prev.requisitions, requisitionObj];
        newRequisitionNumbers = [...prev.requisitionNumbers, requisitionNumber];
        newRequisitionIds = [...prev.requisitionIds, selectedRequisition._id];
        
        // Check if there are existing items with data but without requisition numbers
        const hasManualItems = prev.items.some(item => 
          item.itemCode && item.itemCode.trim() !== '' && 
          (!item.requisitionNumber || item.requisitionNumber.trim() === '')
        );
        
        // If there are manual items without requisition, clear the grid and load only requisition items
        if (hasManualItems) {
          // Map new requisition items to PO items format
          const mappedItems = selectedRequisition.items.map(item => ({
            itemCode: item.itemName || item.workScope || item.itemCode,
            itemId: item.itemCode,
            workScope: item.workScope,
            description: item.description || '',
            unit: item.unit,
            boqQty: item.requisitionQty,
            balanceQty: item.balanceQty || 0,
            purchaseQty: '',
            rate: item.rate || '',
            amount: '',
            requisitionNumber: requisitionNumber,
            requisitionId: selectedRequisition._id || '',
            deliveryDate: prev.deliveryDate ? prev.deliveryDate.split('-').reverse().join('/') : ''
          }));
          newItems = mappedItems;
        } else {
          // No manual items, just add requisition items to existing items
          const mappedItems = selectedRequisition.items.map(item => ({
            itemCode: item.itemName || item.workScope || item.itemCode,
            itemId: item.itemCode,
            workScope: item.workScope,
            description: item.description || '',
            unit: item.unit,
            boqQty: item.requisitionQty,
            balanceQty: item.balanceQty || 0,
            purchaseQty: '',
            rate: item.rate || '',
            amount: '',
            requisitionNumber: requisitionNumber,
            requisitionId: selectedRequisition._id || '',
            deliveryDate: prev.deliveryDate ? prev.deliveryDate.split('-').reverse().join('/') : ''
          }));
          newItems = [...prev.items, ...mappedItems];
        }
      }

      return {
        ...prev,
        requisitions: newRequisitions,
        requisitionNumbers: newRequisitionNumbers,
        requisitionIds: newRequisitionIds,
        items: newItems
      };
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (requisitionDropdownRef.current && !requisitionDropdownRef.current.contains(event.target)) {
        setShowRequisitionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  

  

 

  // Common function to get dropdown items based on purchase type, item type, and project selection
  const getDropdownItems = () => {
    // If requisitions are selected, show only items from those requisitions
    if (formData.requisitionNumbers.length > 0) {
      const allItems = [];
      formData.requisitionNumbers.forEach(reqNum => {
        const selectedRequisition = requisitions.find(req => req.requisitionNumber === reqNum);
        if (selectedRequisition && selectedRequisition.items) {
          if (formData.itemType === 'Service') {
            allItems.push(...selectedRequisition.items.map(item => item.workScope || ''));
          } else {
            allItems.push(...selectedRequisition.items.map(item => item.itemName || ''));
          }
        }
      });
      return [...new Set(allItems)]; // Remove duplicates
    }
    
    // For general purchase type, show all materials
    if (formData.purchaseType === 'general') {
      if (formData.itemType === 'Service') {
        return componentRequirements.map(item => item.componentName || '');
      } else {
        return materialItems.map(item => {
          const itemData = item.itemData || item;
          return itemData.material || '';
        });
      }
    }
    
    // For project purchase type, show only project-specific materials/services
    if (formData.purchaseType === 'project' && formData.projectId) {
      if (formData.itemType === 'Service') {
        // Show only components from the selected project
        return componentRequirements.map(item => item.componentName || '');
      } else {
        // Show only materials from the selected project's materialRequirements
        return materialRequirements.map(item => item.materialName || '');
      }
    }
    
    // Default: return empty array for project type without project selected
    return [];
  };

  const handlePurchaseTypeChange = (e) => {
    const purchaseType = e.target.value;
    
    setFormData(prev => {
      // If switching to general, clear project name and delivery location
      if (purchaseType === 'general') {
        setMaterialRequirements([]);
        setComponentRequirements([]);
        return {
          ...prev,
          purchaseType: purchaseType,
          projectId: '',
          projectName: '',
          deliveryLocation: '',
          items: [],
          requisitions: [],
          requisitionIds: [],
          requisitionNumbers: []
        };
      }
      // If switching to project, clear items and requisitions
      return {
        ...prev,
        purchaseType: purchaseType,
        items: [],
        requisitions: [],
        requisitionIds: [],
        requisitionNumbers: []
      };
    });
  };

  const handleItemTypeChange = async (e) => {
    const itemType = e.target.value;
    setFormData(prev => ({
      ...prev,
      itemType: itemType,
      items: [],
      requisitions: [],
      requisitionNumbers: [],
      requisitionIds: []
    }));
  };

  // Common function to save purchase order with different status
  const savePurchaseOrder = async (status) => {
    // Validate mandatory fields
    if (!formData.poDate) {
      setAlertMessage({ show: true, type: 'danger', message: 'PO Date is required!' });
      return;
    }
    if (!formData.supplierId || !formData.supplierName) {
      setAlertMessage({ show: true, type: 'danger', message: 'Supplier Name is required!' });
      return;
    }
    if (formData.purchaseType === 'project' && !formData.projectName) {
      setAlertMessage({ show: true, type: 'danger', message: 'Project Name is required for project-type purchase orders!' });
      return;
    }
    if (!formData.deliveryDate) {
      setAlertMessage({ show: true, type: 'danger', message: 'Expected Delivery Date is required!' });
      return;
    }
    if (!formData.deliveryLocation) {
      setAlertMessage({ show: true, type: 'danger', message: 'Delivery Location is required!' });
      return;
    }
    if (!formData.modeOfPayment) {
      setAlertMessage({ show: true, type: 'danger', message: 'Mode of Payment is required!' });
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      setAlertMessage({ show: true, type: 'danger', message: 'At least one item is required!' });
      return;
    }
    
    // Validate grid items data
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      
      // Check if material is selected
      if (!item.itemCode || item.itemCode.trim() === '') {
        setAlertMessage({ show: true, type: 'danger', message: `Row ${i + 1}: Material is required!` });
        return;
      }
      
      // Check if unit is filled
      if (!item.unit || item.unit.trim() === '') {
        setAlertMessage({ show: true, type: 'danger', message: `Row ${i + 1}: Unit is required!` });
        return;
      }
      
      // Check if purchase quantity is valid
      const purchaseQty = parseFloat(item.purchaseQty);
      if (isNaN(purchaseQty) || purchaseQty <= 0) {
        setAlertMessage({ show: true, type: 'danger', message: `Row ${i + 1}: Purchase Qty must be greater than 0!` });
        return;
      }
      
      // Check if purchaseQty exceeds balanceQty for requisition items
      if (item.requisitionNumber && item.requisitionNumber.trim() !== '') {
        const balanceQty = parseFloat(item.balanceQty);
        if (!isNaN(balanceQty) && purchaseQty > balanceQty) {
          setAlertMessage({ show: true, type: 'danger', message: `Row ${i + 1}: Purchase Qty (${purchaseQty}) cannot exceed Balance Qty (${balanceQty}) for requisition ${item.requisitionNumber}!` });
          return;
        }
      }
      
      // Check if rate is valid
      const rate = parseFloat(item.rate);
      if (isNaN(rate) || rate <= 0) {
        setAlertMessage({ show: true, type: 'danger', message: `Row ${i + 1}: Rate must be greater than 0!` });
        return;
      }
      
      // Check if amount is calculated
      const amount = parseFloat(item.amount);
      if (isNaN(amount) || amount <= 0) {
        setAlertMessage({ show: true, type: 'danger', message: `Row ${i + 1}: Amount is invalid!` });
        return;
      }
      
      // Validate requisition data integrity
      if (item.requisitionNumber && item.requisitionNumber.trim() !== '') {
        if (!item.requisitionId || item.requisitionId.trim() === '') {
          setAlertMessage({ show: true, type: 'danger', message: `Row ${i + 1}: Requisition ID is missing for requisition ${item.requisitionNumber}!` });
          return;
        }
      }
    }
    
    // Additional validation for Submit
    if (status === 'ApprovalRequest' && !approverDetails.approverId) {
      setAlertMessage({ show: true, type: 'danger', message: 'Approver Name is required for submission!' });
      return;
    }
    
    try {
      const url = editMode 
        ? `${apiBaseUrl}/api/PurchaseOrder/${formData._id}?companyId=${companyId}`
        : `${apiBaseUrl}/api/PurchaseOrder?companyId=${companyId}`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      // Prepare approver comments array
      let approverCommentsArray = formData.approverComments || [];
      if (status === 'Submitted' && approverDetails.approverComments) {
        approverCommentsArray = [
          ...approverCommentsArray,
          {
            date: new Date().toISOString(),
            comment: approverDetails.approverComments,
            commentedBy: userName
          }
        ];
      }
      
      // Use approver user ID from approverDetails
      const approverUserId = approverDetails.approverId || formData.approverUserId;
      
      // Prepare data - exclude name fields and email, send only IDs/codes
      const submitData = {
        ...formData,
        status: status,
        itemType: formData.itemType || 'Material', // Explicitly include itemType
        approverUserId: approverUserId,
        approverComments: approverCommentsArray,
        requisitionIds: undefined,      // Remove old structure
        requisitionNumbers: undefined,  // Remove old structure
        supplierName: undefined,    // Remove supplierName
        supplierEmail: undefined,   // Remove supplierEmail
        supplierContactPerson: undefined,   // Remove supplierContactPerson
        supplierMobileNumber: undefined,    // Remove supplierMobileNumber
        approverFullName: undefined,   // Remove approverFullName
        approverEmail: undefined,      // Remove approverEmail
        createdByUserName: undefined,  // Remove createdByUserName
        createdByEmail: undefined,     // Remove createdByEmail
        modifiedByUserName: undefined, // Remove modifiedByUserName
        modifiedByEmail: undefined,    // Remove modifiedByEmail
            // Remove projectName
        // Remove itemName from each item
        items: formData.items?.map(item => {
          // For Service type, save workScope instead of itemCode
          if (formData.itemType === 'Service') {
            return {
              workScope: item.itemCode || item.workScope,
              description: item.description,
              unit: item.unit,
              boqQty: item.boqQty,
              balanceQty: item.balanceQty || 0,
              purchaseQty: item.purchaseQty,
              rate: item.rate,
              amount: item.amount,
              requisitionNumber: item.requisitionNumber || '',
              requisitionId: item.requisitionId || '',
              deliveryDate: item.deliveryDate || ''
            };
          }
          
          // For Material type, find the material ID
          let materialId = item.itemId || item.itemCode;
          if (!item.itemId) {
            const materialItem = materialItems.find(mi => {
              const itemData = mi.itemData || mi;
              return itemData.material === item.itemCode;
            });
            if (materialItem) {
              const itemData = materialItem.itemData || materialItem;
              materialId = itemData._id || itemData.materialId || item.itemCode;
            }
          }
          
          return {
            itemCode: materialId,
            description: item.description,
            unit: item.unit,
            boqQty: item.boqQty,
            balanceQty: item.balanceQty || 0,
            purchaseQty: item.purchaseQty,
            rate: item.rate,
            amount: item.amount,
            requisitionNumber: item.requisitionNumber || '',
            requisitionId: item.requisitionId || '',
            deliveryDate: item.deliveryDate || ''
          };
        }) || [],
        companyId: companyId,
        createdBy: editMode ? formData.createdBy : userId,
        modifiedBy: userId
      };
      
      const resp = await axiosClient({
        method: method,
        url: url.replace(apiBaseUrl, ''),
        data: submitData
      });

      const savedData = resp.data;
      
      // Only update _id, poNumber, status and approver info, keep existing formData (especially items)
      if (savedData) {
        setFormData(prev => ({
          ...prev,
          _id: savedData._id || prev._id,
          poNumber: savedData.poNumber || prev.poNumber,
          status: status,
          approverUserId: approverUserId,
          approverComments: approverCommentsArray
        }));
        
        // Clear approver comments input after submit
        if (status === 'Submitted') {
          setApproverDetails(prev => ({
            ...prev,
            approverComments: ''
          }));
        }
        
        // Switch to edit mode after successful create
        if (!editMode) {
          setEditMode(true);
        }
      }
      
      // Show success alert
      const statusMessage = status === 'Draft' ? 'saved' : 'submitted';
      setAlertMessage({ 
        show: true, 
        type: 'success', 
        message: editMode 
          ? `Purchase Order ${statusMessage} successfully!` 
          : `Purchase Order ${statusMessage} successfully!${savedData?.poNumber ? ' PO Number: ' + savedData.poNumber : ''}` 
      });
      
      // Auto-hide success alert after 3 seconds
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);
      
      // Reload purchase orders list
      loadPurchaseOrders();
    } catch (error) {
      // axios error handling
      const errMsg = error?.response?.data || error.message || 'Failed to save';
      setAlertMessage({ show: true, type: 'danger', message: `Failed to save: ${errMsg}` });
    }
  };

  // Wrapper function for Save button (Draft status)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    await savePurchaseOrder('Draft');
  };

  // Wrapper function for Submit button (Submitted status)
  const handleSubmitForApproval = async () => {
    await savePurchaseOrder('ApprovalRequest');
  };

  // Keep handleSubmit for form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    await savePurchaseOrder('Draft');
  };

  // Handle Approve/Reject actions
  const handleUpdateApprovalStatus = async (status) => {
    // Validate comments - required for both Approve and Reject
    if (!approverDetails.approverComments || !approverDetails.approverComments.trim()) {
      setAlertMessage({ show: true, type: 'danger', message: 'Comments are required!' });
      return;
    }

    try {
      await axiosClient.post('/api/PurchaseOrder/UpdateApprovalStatus', {
        _id: formData._id,
        status: status,
        comments: approverDetails.approverComments || '',
        commentedBy: userFullName
      });

      setAlertMessage({ 
        show: true, 
        type: 'success', 
        message: `Purchase Order ${status === 'Approved' ? 'approved' : 'rejected'} successfully!` 
      });

      setFormData(prev => ({
        ...prev,
        status: status
      }));

      setApproverDetails(prev => ({
        ...prev,
        approverComments: ''
      }));

      // Auto-hide success alert after 3 seconds
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
        // Redirect to list view
        setViewMode('list');
      }, 3000);

      // Reload purchase orders list
      loadPurchaseOrders();
    } catch (error) {
      console.error('Error updating approval status:', error);
      const errMsg = error?.response?.data || error.message || 'Failed to update approval status';
      setAlertMessage({ show: true, type: 'danger', message: errMsg });
    }
  };

  // Handle Convert to Draft for Rejected POs
  const handleConvertToDraft = async (_id) => {
    if (!window.confirm('Are you sure you want to convert this Purchase Order to Draft status?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/PurchaseOrder/UpdateStatusToDraft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id }),
      });

      if (response.ok) {
        setAlertMessage({ 
          show: true, 
          type: 'success', 
          message: 'Purchase Order status updated to Draft successfully!' 
        });

        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);

        // Reload purchase orders list
        loadPurchaseOrders();
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to update status: ${errorData}` });
      }
    } catch (error) {
      console.error('Error converting to draft:', error);
      setAlertMessage({ show: true, type: 'danger', message: 'Error updating status: ' + error.message });
    }
  };

  const handleReset = () => {
    setFormData({
      _id: '',
      poNumber: '',
      poDate: '',
      purchaseType: 'project',
      itemType: 'Material',
      supplierId: '',
      supplierName: '',
      supplierEmail: '',
      supplierContactPerson: '',
      supplierMobileNumber: '',
      projectId: '',
      projectName: '',
      requisitions: [],
      requisitionIds: [],
      requisitionNumbers: [],
      deliveryDate: '',
      deliveryLocation: '',
      modeOfPayment: '',
      remarks: '',
      TermsCondition: '',
      status: 'Draft',
      items: []
    });
    setMaterialRequirements([]);
    setEditMode(false);
  };

  const handleNewPO = async () => {
    handleReset();
    setIsViewMode(false);
    setOriginalRequisitionNumbers([]);
    
    // Fetch Terms & Condition from API
    try {
      const response = await fetch(`${apiBaseUrl}/api/TermsAndCondition?type=Purchaseorder`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prevData => ({
          ...prevData,
          TermsCondition: data[0].TermsCondition || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching terms and condition:', error);
    }
    
    setViewMode('form');
  };

  const handleViewPO = async (po) => {
    if (!permissions.view) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to view purchase orders' });
      return;
    }
    
    // If PO has a project, fetch material/component requirements first
    if (po.projectId) {
      await fetchMaterialRequirements(po.projectId);
    }
    
    // Extract requisition arrays from requisitions object or use old structure
    let requisitions = po.requisitions || [];
    let requisitionIds = [];
    let requisitionNumbers = [];
    
    if (requisitions.length > 0) {
      // New structure: extract from requisitions array
      requisitionIds = requisitions.map(req => req.requisitionId);
      requisitionNumbers = requisitions.map(req => req.requisitionNumber);
    } else {
      // Old structure: use separate arrays for backward compatibility
      requisitionIds = Array.isArray(po.requisitionIds) ? po.requisitionIds : (po.requisitionId ? [po.requisitionId] : []);
      requisitionNumbers = Array.isArray(po.requisitionNumbers) ? po.requisitionNumbers : (po.requisitionNumber ? [po.requisitionNumber] : []);
    }
    
    // Transform items: if itemCode is an ObjectId, convert to material name
    const transformedPO = {
      ...po,
      itemType: po.itemType || 'Material',
      // Set both new and old structure
      requisitions: requisitions,
      requisitionIds: requisitionIds,
      requisitionNumbers: requisitionNumbers,
      items: po.items?.map(item => {
        // For Service type, use workScope field
        if (po.itemType === 'Service' && item.workScope) {
          return {
            ...item,
            itemCode: item.workScope,
            workScope: item.workScope
          };
        }
        
        // If itemName exists (from backend), use it for itemCode
        if (item.itemName) {
          return {
            ...item,
            itemCode: item.itemName,
            itemId: item.itemCode // Store original ID
          };
        }
        
        // Otherwise, lookup material name by ID
        const materialItem = materialItems.find(mi => {
          const itemData = mi.itemData || mi;
          return (itemData._id || itemData.materialId) === item.itemCode;
        });
        
        if (materialItem) {
          const itemData = materialItem.itemData || materialItem;
          return {
            ...item,
            itemCode: itemData.material || item.itemCode,
            itemId: item.itemCode // Store original ID
          };
        }
        
        return item;
      }) || []
    };
    
    // Set approver details from saved data
    if (po.approverUserId) {
      const approver = users.find(u => u._id === po.approverUserId);
      setApproverDetails({
        approverId: po.approverUserId,
        approverName: approver ? approver.username : '',
        approverEmail: approver ? approver.email : (po.approverEmail || ''),
        approverComments: ''
      });
    } else {
      setApproverDetails({
        approverId: '',
        approverName: '',
        approverEmail: '',
        approverComments: ''
      });
    }
    
    setFormData(transformedPO);
    setOriginalRequisitionNumbers(requisitionNumbers);
    setEditMode(false);
    setIsViewMode(true);
    
    
    
    
    
    setViewMode('form');
  };

  const handleEditPO = async (po) => {
    if (!permissions.edit) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to edit purchase orders' });
      return;
    }
    
    // If PO has a project, fetch material/component requirements first
    if (po.projectId) {
      await fetchMaterialRequirements(po.projectId);
    }
   
    // Extract requisition arrays from requisitions object or use old structure
    let requisitions = po.requisitions || [];
    let requisitionIds = [];
    let requisitionNumbers = [];
    
    if (requisitions.length > 0) {
      // New structure: extract from requisitions array
      requisitionIds = requisitions.map(req => req.requisitionId);
      requisitionNumbers = requisitions.map(req => req.requisitionNumber);
    } else {
      // Old structure: use separate arrays for backward compatibility
      requisitionIds = Array.isArray(po.requisitionIds) ? po.requisitionIds : (po.requisitionId ? [po.requisitionId] : []);
      requisitionNumbers = Array.isArray(po.requisitionNumbers) ? po.requisitionNumbers : (po.requisitionNumber ? [po.requisitionNumber] : []);
    }
   
    // Transform items: if itemCode is an ObjectId, convert to material name
    const transformedPO = {
      ...po,
      itemType: po.itemType || 'Material',
      // Set both new and old structure
      requisitions: requisitions,
      requisitionIds: requisitionIds,
      requisitionNumbers: requisitionNumbers,
      items: po.items?.map(item => {
        // For Service type, use workScope field
        if (po.itemType === 'Service' && item.workScope) {
          return {
            ...item,
            itemCode: item.workScope,
            workScope: item.workScope
          };
        }
        
        // If itemName exists (from backend), use it for itemCode
        if (item.itemName) {
          return {
            ...item,
            itemCode: item.itemName,
            itemId: item.itemCode // Store original ID
          };
        }
        
        // Otherwise, lookup material name by ID
        const materialItem = materialItems.find(mi => {
          const itemData = mi.itemData || mi;
          return (itemData._id || itemData.materialId) === item.itemCode;
        });
        
        if (materialItem) {
          const itemData = materialItem.itemData || materialItem;
          return {
            ...item,
            itemCode: itemData.material || item.itemCode,
            itemId: item.itemCode // Store original ID
          };
        }
        
        return item;
      }) || []
    };
    
    // Set approver details from saved data
    if (po.approverUserId) {
      const approver = users.find(u => u._id === po.approverUserId);
      setApproverDetails({
        approverId: po.approverUserId,
        approverName: approver ? approver.username : '',
        approverEmail: approver ? approver.email : (po.approverEmail || ''),
        approverComments: ''
      });
    } else {
      setApproverDetails({
        approverId: '',
        approverName: '',
        approverEmail: '',
        approverComments: ''
      });
    }
    
    setFormData(transformedPO);
    setOriginalRequisitionNumbers(requisitionNumbers);
    setEditMode(true);
    // Set view mode to true for ApprovalRequest status (read-only except approver section)
    setIsViewMode(po.status === 'ApprovalRequest');
    
    console.log('transformedPO.itemType:', transformedPO.itemType);
    
    setViewMode('form');
  };

  const handleDelete = async (_id) => {
    if (!permissions.delete) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to delete purchase orders' });
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this Purchase Order?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/PurchaseOrder/${_id}?companyId=${companyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertMessage({ show: true, type: 'success', message: 'Purchase Order deleted successfully!' });
        
        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        
        loadPurchaseOrders();
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to delete: ${errorData}` });
      }
    } catch (error) {
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Draft': 'secondary',
      'Pending': 'warning',
      'Approved': 'success',
      'Received': 'info',
      'Cancelled': 'danger'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
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
      {/* Success/Error Alert */}
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
        // List View - Display all purchase orders
        <Card>
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-file-earmark-text me-2"></i>
                Purchase Orders
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                View and manage all purchase orders
              </p>
            </div>
            {permissions.edit && (
              <Button variant="light" onClick={handleNewPO}>
                <i className="bi bi-plus-circle me-2"></i>New Purchase Order
              </Button>
            )}
          </Card.Header>
          <Card.Body style={{ paddingBottom: '2rem' }}>
            {/* Search Bar */}
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by PO Number, Supplier Name, or Supplier Code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* Purchase Orders Table */}
            {(() => {
              const indexOfLastItem = currentPage * itemsPerPage;
              const indexOfFirstItem = indexOfLastItem - itemsPerPage;
              const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
              const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
              const paginate = (pageNumber) => setCurrentPage(pageNumber);
              
              return (
                <>
                  <Table striped bordered hover responsive style={{ fontSize: '0.775rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '15%' }}>PO Number</th>
                        <th style={{ width: '8%' }}>PO Date</th>
                        <th style={{ width: '12%' }}>Supplier Name</th>
                        <th style={{ width: '12%' }}>Project Name</th>
                        <th style={{ width: '8%' }}>Delivery Date</th>
                        <th style={{ width: '10%' }}>Mode of Payment</th>
                        <th style={{ width: '10%' }}>Item Type</th>
                        <th style={{ width: '5%' }}>Status</th>

                        <th style={{ width: '10%' }}>Created By</th>
                        <th style={{ width: '10%' }}>Modified By</th>
                        {(permissions.edit || permissions.delete) && (
                          <th style={{ width: '10%' }}>Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="12" className="text-center text-muted py-4">
                            {searchTerm ? 'No purchase orders found matching your search.' : 'No purchase orders available. Click "New Purchase Order" to create one.'}
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((po) => (
                    <tr key={po._id}>
                      <td>
                        {permissions.view ? (
                          <Button
                            variant="link"
                            className="p-0 text-decoration-none"
                            onClick={() => handleViewPO(po)}
                            style={{ fontSize: '0.690rem' }}
                          >
                            {po.poNumber}
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.690rem' }}>{po.poNumber}</span>
                        )}
                      </td>
                      <td>{po.poDate ? new Date(po.poDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{po.supplierName}</td>
                      <td>{po.projectName}</td>
                      <td>{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{po.modeOfPayment}</td>
                      <td>{po.itemType || 'Material'}</td>
                      <td>{getStatusBadge(po.status)}</td>
                      <td>{po.createdByUserName || '-'}</td>
                      <td>{po.modifiedByUserName || '-'}</td>
                      {(permissions.edit || permissions.delete) && (
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {/* Approved: Hide all action buttons */}
                          {po.status !== 'Approved' && (
                            <>
                              {/* Draft or Rejected: Show buttons only if user is creator or modifier AND has permissions */}
                              {(po.status === 'Draft' || po.status === 'Rejected') && 
                               (po.createdBy === userId || po.modifiedBy === userId) && (
                                <>
                                  {permissions.edit && (
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm" 
                                      className="me-1"
                                      style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                                      onClick={() => handleEditPO(po)}
                                      title="Edit"
                                    >
                                      <i className="bi bi-pencil" style={{ fontSize: '1rem' }}></i>
                                    </Button>
                                  )}
                                  {permissions.edit && po.status === 'Rejected' && (
                                    <Button 
                                      variant="outline-warning" 
                                      size="sm" 
                                      className="me-1"
                                      style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                                      onClick={() => handleConvertToDraft(po._id)}
                                      title="Convert to Draft"
                                    >
                                      <i className="bi bi-arrow-counterclockwise" style={{ fontSize: '1rem' }}></i>
                                    </Button>
                                  )}
                                  {permissions.delete && (
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                                      onClick={() => handleDelete(po._id)}
                                      title="Delete"
                                    >
                                      <i className="bi bi-trash" style={{ fontSize: '1rem' }}></i>
                                    </Button>
                                  )}
                                </>
                              )}
                              
                              {/* ApprovalRequest: Show only Edit button if user is the approver AND has edit permission */}
                              {permissions.edit && po.status === 'ApprovalRequest' && po.approverUserId === userId && (
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  className="me-1"
                                  style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                                  onClick={() => handleEditPO(po)}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil" style={{ fontSize: '1rem' }}></i>
                                </Button>
                              )}
                            </>
                          )}
                          
                          {/* Show dash if no actions available */}
                          {(po.status === 'Approved' || 
                            ((po.status === 'Draft' || po.status === 'Rejected') && po.createdBy !== userId && po.modifiedBy !== userId) ||
                            (po.status === 'ApprovalRequest' && po.approverUserId !== userId)) && (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      )}
                        </tr>
                      ))
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
        // Form View - Create/Edit purchase order
        <Card>
          <Card.Header className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  {isViewMode 
                    ? `Purchase Order - ${formData.status || 'Draft'}` 
                    : editMode 
                      ? 'Edit Purchase Order' 
                      : 'New Purchase Order'
                  }
                </h4>
              </div>
              <div>
                <Button variant="light" className="me-2" onClick={() => {
                  if (location.state?.fromDashboard) {
                    navigate('/main');
                  } else {
                    setViewMode('list');
                  }
                }}>
                  <i className="bi bi-arrow-left me-2"></i>Back to List
                </Button>
                {formData._id && (
                  <DropdownButton
                    variant="danger"
                    title={<><i className="bi bi-file-pdf me-2"></i>PDF</>}
                    className="me-2 d-inline-block"
                  >
                    <Dropdown.Item onClick={() => { setCurrentPdfCopyType('supplier'); setShowPDFModal(true); }}>
                      Supplier Copy
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => { setCurrentPdfCopyType('office'); setShowPDFModal(true); }}>
                      Office Copy
                    </Dropdown.Item>
                  </DropdownButton>
                )}
                {!isViewMode && (
                  <>
                    {/* Show Save and Submit buttons for new and Draft status */}
                    {(!formData.status || formData.status === 'Draft') && (
                      <>
                        <Button variant="success" className="me-2" onClick={handleSave}>
                          <i className="bi bi-save me-2"></i>Save
                        </Button>
                        <Button variant="warning" className="me-2" onClick={handleSubmitForApproval}>
                          <i className="bi bi-send me-2"></i>Submit
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card.Header>
          <Card.Body style={{ paddingBottom: '2rem' }}>
            <Form onSubmit={handleSubmit}>
            {/* Header Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Purchase Order Details</h5>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>PO Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="poNumber"
                      value={formData.poNumber}
                      placeholder="Auto-generated"
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>PO Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="poDate"
                      value={formData.poDate}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Expected Delivery Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mode of Payment <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="modeOfPayment"
                      value={formData.modeOfPayment}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      required
                    >
                      <option value="">Select mode of payment</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Online Payment">Online Payment</option>
                      <option value="UPI">UPI</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {formData._id && (
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.status || 'Draft'}
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                    </Form.Group>
                  </Col>
                )}
              </Row>
            </div>

            {/* Supplier Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Supplier & Project Information</h5>
              <Row>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Purchase Type <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="purchaseType"
                      value={formData.purchaseType}
                      onChange={handlePurchaseTypeChange}
                      disabled={isViewMode}
                      required
                    >
                      <option value="general">General</option>
                      <option value="project">Project</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Item Type <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="itemType"
                      value={formData.itemType}
                      onChange={handleItemTypeChange}
                      disabled={isViewMode}
                      required
                    >
                      <option value="Material">Material</option>
                      <option value="Service">Service</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={formData.purchaseType === 'project' ? 4 : 5}>
                  <Form.Group className="mb-3">
                    <Form.Label>Supplier Name <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="supplierName"
                      value={formData.supplierName}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      required
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier.supplierName}>
                          {supplier.supplierName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                {formData.purchaseType === 'project' && (
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Project Name <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleProjectChange}
                        disabled={isViewMode}
                        required
                      >
                        <option value="">Select project</option>
                        {projects.map((project) => (
                          <option key={project._id || project.id} value={project.name}>
                            {project.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}
                <Col md={formData.purchaseType === 'project' ? 3 : 5}>
                  <Form.Group className="mb-3">
                    <Form.Label>Requisition Number(s) (Optional)</Form.Label>
                    <div ref={requisitionDropdownRef} style={{ position: 'relative' }}>
                      <InputGroup
                        onClick={() => !isViewMode && setShowRequisitionDropdown(!showRequisitionDropdown)}
                        style={{ cursor: isViewMode ? 'not-allowed' : 'pointer' }}
                      >
                        <Form.Control
                          type="text"
                          value={formData.requisitionNumbers.length > 0 
                            ? `${formData.requisitionNumbers.length} selected` 
                            : 'Select requisition(s)'}
                          readOnly
                          style={{ 
                            cursor: isViewMode ? 'not-allowed' : 'pointer',
                            backgroundColor: 'white'
                          }}
                          disabled={isViewMode}
                        />
                        <InputGroup.Text style={{ cursor: isViewMode ? 'not-allowed' : 'pointer' }}>
                          <i className={`bi bi-chevron-${showRequisitionDropdown ? 'up' : 'down'}`}></i>
                        </InputGroup.Text>
                      </InputGroup>
                      
                      {showRequisitionDropdown && !isViewMode && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '350px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            border: '1px solid #ced4da',
                            borderRadius: '0.25rem',
                            zIndex: 1050,
                            boxShadow: '0 0.125rem 0.25rem rgba(0,0,0,0.075)'
                          }}
                        >
                          {(() => {
                            const filteredRequisitions = requisitions.filter(req => {
                              if (req.requisitionType !== formData.purchaseType) return false;
                              if (req.itemType !== formData.itemType) return false;
                              if (formData.purchaseType === 'project') {
                                return req.projectId === formData.projectId || req.projectName === formData.projectName;
                              }
                              return true;
                            });

                            if (filteredRequisitions.length === 0) {
                              return (
                                <div style={{ padding: '0.5rem', color: '#6c757d', textAlign: 'center' }}>
                                  No requisitions available
                                </div>
                              );
                            }

                            return (
                              <>
                                {/* Header Row */}
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr 0.8fr 0.8fr 0.6fr',
                                    gap: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: '#e9ecef',
                                    borderBottom: '2px solid #dee2e6',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1
                                  }}
                                >
                                  <div></div>
                                  <div>Requisition Number</div>
                                  <div>Date</div>
                                  <div>Created By</div>
                                  <div>Lock Status</div>
                                </div>
                                
                                {/* Data Rows */}
                                {filteredRequisitions.map((req) => {
                                  const wasOriginallySelected = originalRequisitionNumbers.includes(req.requisitionNumber);
                                  const isDisabled = req.isLocked && !wasOriginallySelected;
                                  
                                  return (
                                  <div
                                    key={req._id}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'auto 1fr 0.8fr 0.8fr 0.6fr',
                                      gap: '0.5rem',
                                      padding: '0.5rem 0.75rem',
                                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                                      borderBottom: '1px solid #f0f0f0',
                                      alignItems: 'center',
                                      opacity: isDisabled ? 0.5 : 1,
                                      backgroundColor: isDisabled ? '#f5f5f5' : 'white'
                                    }}
                                    onMouseEnter={(e) => !isDisabled && (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                                    onMouseLeave={(e) => !isDisabled && (e.currentTarget.style.backgroundColor = 'white')}
                                    onClick={() => !isDisabled && handleRequisitionToggle(req.requisitionNumber)}
                                  >
                                    <Form.Check
                                      type="checkbox"
                                      checked={formData.requisitionNumbers.includes(req.requisitionNumber)}
                                      onChange={() => {}}
                                      style={{ pointerEvents: 'none' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                      {req.requisitionNumber}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                      {req.requisitionDate || '-'}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                      {req.createdByName || '-'}
                                    </span>
                                    <span style={{ 
                                      fontSize: '0.85rem', 
                                      color: (req.isLocked && !wasOriginallySelected) ? '#dc3545' : '#198754',
                                      fontWeight: '500'
                                    }}>
                                      {(req.isLocked && !wasOriginallySelected) ? 'Locked' : 'Open'}
                                    </span>
                                  </div>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={formData.purchaseType === 'project'  ? 6 : 7}>
                  <Form.Group className="mb-3">
                    <Form.Label>Delivery Location <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="deliveryLocation"
                      value={formData.deliveryLocation}
                      onChange={handleInputChange}
                      placeholder={formData.purchaseType === 'project' ? 'Site address (auto-filled from project)' : 'Enter warehouse/head office address'}
                      disabled={isViewMode}
                      required
                      readOnly={formData.purchaseType === 'project' && formData.projectName !== ''}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Items Section */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Order Items</h5>
              <HotTable
                key={`${formData.projectId}-${formData.itemType}`}
                ref={hotTableRef}
                data={[
                  ...(() => {
                    if (formData.items && formData.items.length > 0) {
                      return formData.items;
                    } else {
                      // Only add default empty rows if there are NO items at all
                      const convertedDate = formData.deliveryDate ? 
                        formData.deliveryDate.split('-').reverse().join('/') : '';
                      return [
                        { itemCode: '', description: '', unit: '', boqQty: 0, purchaseQty: 0, rate: '', amount: '', deliveryDate: convertedDate },
                        { itemCode: '', description: '', unit: '', boqQty: 0, purchaseQty: 0, rate: '', amount: '', deliveryDate: convertedDate },
                        { itemCode: '', description: '', unit: '', boqQty: 0, purchaseQty: 0, rate: '', amount: '', deliveryDate: convertedDate }
                      ];
                    }
                  })(),
                  {
                    itemCode: 'Total:',
                    description: '',
                    unit: '',
                    boqQty: '',
                    purchaseQty: '',
                    rate: '',
                    amount: (formData.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
                    action: '',
                    isTotalRow: true
                  }
                ]}
                colHeaders={isViewMode 
                  ? [
                      formData.itemType === 'Service' ? 'Work Scope' : 'Material', 
                      'Description', 
                      'Unit', 
                      formData.requisitionNumbers.length > 0 ? 'Requisition Qty' : 'BOQ Qty',
                      ...(formData.requisitionNumbers.length > 0 ? ['Balance Qty'] : []),
                      'Purchase Qty', 
                      `Rate (${currency})`, 
                      `Amount (${currency})`,
                      'Delivery Date',
                      ...(formData.requisitionNumbers.length > 0 ? ['Requisition Number'] : [])
                    ]
                  : [
                      formData.itemType === 'Service' ? 'Work Scope' : 'Material', 
                      'Description', 
                      'Unit', 
                      formData.requisitionNumbers.length > 0 ? 'Requisition Qty' : 'BOQ Qty',
                      ...(formData.requisitionNumbers.length > 0 ? ['Balance Qty'] : []),
                      'Purchase Qty', 
                      `Rate (${currency})`, 
                      `Amount (${currency})`,
                      'Delivery Date',
                      ...(formData.requisitionNumbers.length > 0 ? ['Requisition Number'] : []),
                      'Action'
                    ]
                }
                columns={[
                  {
                    data: 'itemCode',
                    type: 'dropdown',
                    source: getDropdownItems(),
                    strict: true,
                    allowInvalid: false,
                    width: 200,
                    readOnly: formData.requisitionNumbers.length > 0
                  },
                  {
                    data: 'description',
                    type: 'text',
                    width: 250
                  },
                  {
                    data: 'unit',
                    type: 'dropdown',
                    source: units,
                    width: 80,
                    readOnly: formData.requisitionNumbers.length > 0
                  },
                  {
                    data: 'boqQty',
                    type: 'numeric',
                    numericFormat: {
                      pattern: '0,0.00'
                    },
                    width: 100,
                    readOnly: true,
                    className: 'htCenter htMiddle bg-light'
                  },
                  ...(formData.requisitionNumbers.length > 0 ? [{
                    data: 'balanceQty',
                    type: 'numeric',
                    numericFormat: {
                      pattern: '0,0.00'
                    },
                    width: 100,
                    readOnly: true,
                    className: 'htCenter htMiddle bg-light'
                  }] : []),
                  {
                    data: 'purchaseQty',
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
                    width: 80
                  },
                  {
                    data: 'amount',
                    type: 'numeric',
                    numericFormat: {
                      pattern: '0,0.00'
                    },
                    width: 90,
                    readOnly: true,
                    renderer: function(instance, td, row, col, prop, value, cellProperties) {
                      const rowData = instance.getSourceDataAtRow(row);
                      
                      // If this is the total row, handle specially
                      if (rowData && rowData.isTotalRow) {
                        Handsontable.renderers.NumericRenderer.apply(this, arguments);
                        return td;
                      }
                      
                      // For regular rows, only show amount if there's actual data
                      if (!value || value === 0 || value === '' || value === '0') {
                        // Check if the row has any data
                        if (rowData && (!rowData.itemCode || rowData.itemCode === '')) {
                          td.innerHTML = '';
                          td.className = 'htRight htMiddle';
                          return td;
                        }
                      }
                      
                      Handsontable.renderers.NumericRenderer.apply(this, arguments);
                      return td;
                    }
                  },
                  {
                    data: 'deliveryDate',
                    type: 'date',
                    dateFormat: 'DD/MM/YYYY',
                    correctFormat: true,
                    width: 120,
                    className: 'htCenter htMiddle'
                  },
                  ...(formData.requisitionNumbers.length > 0 ? [{
                    data: 'requisitionNumber',
                    type: 'text',
                    width: 150,
                    readOnly: true,
                    className: 'htCenter htMiddle bg-light'
                  }] : []),
                  ...(!isViewMode ? [{
                    data: 'action',
                    width: 130,
                    readOnly: true,
                    renderer: (instance, td, row, col, prop, value, cellProperties) => {
                      td.innerHTML = '';
                      td.style.textAlign = 'center';
                      
                      // Calculate actual data row count
                      const actualRowCount = (formData.items && formData.items.length > 0) ? formData.items.length : 3;
                      
                      // Don't show buttons for total row
                      if (row >= actualRowCount) {
                        return td;
                      }
                      
                      // Add row button
                      const addBtn = document.createElement('button');
                      addBtn.className = 'btn btn-success btn-sm me-1';
                      addBtn.innerHTML = '<i class="bi bi-plus"></i>';
                      addBtn.onclick = () => {
                        // Get current data from the grid
                        const currentData = instance.getSourceData();
                        const newItems = currentData.filter(item => !item.isTotalRow).map(item => ({
                          itemCode: item.itemCode || '',
                          description: item.description || '',
                          unit: item.unit || '',
                          boqQty: item.boqQty || 0,
                          balanceQty: item.balanceQty || 0,
                          purchaseQty: item.purchaseQty || 0,
                          rate: item.rate || '',
                          amount: item.amount || '',
                          itemId: item.itemId || '',
                          requisitionNumber: item.requisitionNumber || '',
                          requisitionId: item.requisitionId || '',
                          deliveryDate: item.deliveryDate || ''
                        }));
                        
                        // Insert new blank row after current row
                        newItems.splice(row + 1, 0, {
                          itemCode: '',
                          description: '',
                          unit: '',
                          boqQty: 0,
                          balanceQty: 0,
                          purchaseQty: 0,
                          rate: '',
                          amount: '',
                          requisitionNumber: '',
                          requisitionId: '',
                          deliveryDate: formData.deliveryDate ? formData.deliveryDate.split('-').reverse().join('/') : ''
                        });
                        setFormData(prev => ({ ...prev, items: newItems }));
                      };
                      td.appendChild(addBtn);
                      
                      // Delete row button - always show
                      const deleteBtn = document.createElement('button');
                      deleteBtn.className = 'btn btn-danger btn-sm';
                      deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
                      deleteBtn.onclick = () => {
                        // Get current data from the grid
                        const currentData = instance.getSourceData();
                        const deletedRow = currentData[row];
                        const deletedRequisitionNumber = deletedRow?.requisitionNumber;
                        
                        const newItems = currentData.filter((item, index) => 
                          index !== row && !item.isTotalRow
                        ).map(item => ({
                          itemCode: item.itemCode || '',
                          description: item.description || '',
                          unit: item.unit || '',
                          boqQty: item.boqQty || 0,
                          balanceQty: item.balanceQty || 0,
                          purchaseQty: item.purchaseQty || 0,
                          rate: item.rate || '',
                          amount: item.amount || '',
                          itemId: item.itemId || '',
                          requisitionNumber: item.requisitionNumber || '',
                          requisitionId: item.requisitionId || '',
                          deliveryDate: item.deliveryDate || ''
                        }));
                        
                        // Check if deleted requisition number exists in remaining items
                        if (deletedRequisitionNumber) {
                          const isRequisitionStillUsed = newItems.some(item => 
                            item.requisitionNumber === deletedRequisitionNumber
                          );
                          
                          // If requisition is no longer used, remove it from selections
                          if (!isRequisitionStillUsed) {
                            setFormData(prev => {
                              const deletedRequisition = requisitions.find(req => 
                                req.requisitionNumber === deletedRequisitionNumber
                              );
                              
                              return {
                                ...prev,
                                items: newItems,
                                requisitions: prev.requisitions.filter(req => 
                                  req.requisitionNumber !== deletedRequisitionNumber
                                ),
                                requisitionNumbers: prev.requisitionNumbers.filter(num => 
                                  num !== deletedRequisitionNumber
                                ),
                                requisitionIds: prev.requisitionIds.filter(id => 
                                  id !== deletedRequisition?._id
                                )
                              };
                            });
                            return;
                          }
                        }
                        
                        setFormData(prev => ({ ...prev, items: newItems }));
                      };
                      td.appendChild(deleteBtn);
                      
                      return td;
                    }
                  }] : [])
                ]}
                width="100%"
                height="200"
                licenseKey="non-commercial-and-evaluation"
                stretchH="all"
                fixedRowsTop={1}
                mergeCells={[
                  { 
                    row: (formData.items && formData.items.length > 0 ? formData.items.length : 3), 
                    col: 0, 
                    rowspan: 1, 
                    colspan: (() => {
                      // Material, Description, Unit, BOQ/Req Qty, Purchase Qty, Rate = 6 columns
                      // + Balance Qty (if requisitions selected) = +1
                      const baseColspan = 6;
                      const hasBalanceQty = formData.requisitionNumbers.length > 0 ? 1 : 0;
                      return baseColspan + hasBalanceQty;
                    })()
                  }
                ]}
                cells={(row, col) => {
                  const cellProperties = {};
                  const itemsToDisplay = (formData.items && formData.items.length > 0) ? formData.items : [
                    { itemCode: '', description: '', unit: '', boqQty: 0, purchaseQty: 0, rate: '', amount: '' },
                    { itemCode: '', description: '', unit: '', boqQty: 0, purchaseQty: 0, rate: '', amount: '' },
                    { itemCode: '', description: '', unit: '', boqQty: 0, purchaseQty: 0, rate: '', amount: '' }
                  ];
                  const dataRow = [...itemsToDisplay, { isTotalRow: true }][row];
                  
                  // Make all cells readonly in view mode
                  if (isViewMode) {
                    cellProperties.readOnly = true;
                  }
                  
                  if (dataRow && dataRow.isTotalRow) {
                    cellProperties.readOnly = true;
                    cellProperties.type = 'text';  // Override dropdown type for total row
                    // Calculate amount column index dynamically
                    // Without balanceQty: col 6, With balanceQty: col 7
                    const amountColIndex = formData.requisitionNumbers.length > 0 ? 7 : 6;
                    
                    if (col === 0) {
                      // Merged cell - no special class needed, will be handled by renderer
                      cellProperties.className = 'htRight htMiddle bg-light fw-bold';
                    } else if (col === amountColIndex) {
                      // Amount column - right align
                      cellProperties.className = 'htRight htMiddle bg-light fw-bold';
                    } else {
                      cellProperties.className = 'htCenter htMiddle bg-light fw-bold';
                    }
                  }
                  
                  return cellProperties;
                }}
                afterRenderer={(td, row, col, prop, value, cellProperties) => {
                  const itemsToDisplay = (formData.items && formData.items.length > 0) ? formData.items : [
                    { itemCode: '', description: '', unit: '', boqQty: 0, purchaseQty: 0, rate: '', amount: '' },
                    { itemCode: '', description: '', unit: '', boqQty: 0, purchaseQty: 0, rate: '', amount: '' },
                    { itemCode: '', description: '', unit: '', boqQty: 0, purchaseQty: 0, rate: '', amount: '' }
                  ];
                  const dataRow = [...itemsToDisplay, { isTotalRow: true }][row];
                  
                  if (dataRow && dataRow.isTotalRow) {
                    // Style total row with stronger visual separation
                    td.style.borderTop = '2px solid #0d6efd';
                    td.style.fontWeight = 'bold';
                    td.style.backgroundColor = '#f8f9fa';
                    
                    // Calculate amount column index dynamically
                    // Without balanceQty: col 6, With balanceQty: col 7
                    const amountColIndex = formData.requisitionNumbers.length > 0 ? 7 : 6;
                    
                    if (col === 0) {
                      // First column in merged cell - show "Total:"
                      td.style.textAlign = 'right';
                      td.style.paddingRight = '15px';
                    } else if (col === amountColIndex) {
                      // Amount column - ensure right alignment and format
                      td.style.textAlign = 'right';
                      td.style.color = '#0d6efd';
                      // Format the total amount with thousand separators
                      const totalAmount = (formData.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                      td.innerHTML = totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    }
                  }
                }}
                afterChange={(changes, source) => {
                  if (!changes || source === 'loadData') return;

                  changes.forEach(([row, prop, oldValue, newValue]) => {
                    // Get current items or initialize with 3 empty rows
                    const currentItems = formData.items.length > 0 ? formData.items : [
                      {
                        itemCode: '',
                        description: '',
                        unit: '',
                        boqQty: 0,
                        purchaseQty: 0,
                        rate: '',
                        amount: ''
                      },
                      {
                        itemCode: '',
                        description: '',
                        unit: '',
                        boqQty: 0,
                        purchaseQty: 0,
                        rate: '',
                        amount: ''
                      },
                      {
                        itemCode: '',
                        description: '',
                        unit: '',
                        boqQty: 0,
                        purchaseQty: 0,
                        rate: '',
                        amount: ''
                      }
                    ];
                    
                    // Skip if this is the total row
                    if (row >= currentItems.length) return;
                    
                    const newItems = [...currentItems];
                    
                    // Ensure row exists
                    if (!newItems[row]) {
                      newItems[row] = {
                        itemCode: '',
                        description: '',
                        unit: '',
                        boqQty: 0,
                        purchaseQty: 0,
                        rate: '',
                        amount: ''
                      };
                    }

                    // Handle item code selection
                    if (prop === 'itemCode') {
                      if (!newValue || newValue === '') {
                        // If itemCode is cleared/empty, clear the entire row
                        newItems[row] = {
                          itemCode: '',
                          description: '',
                          unit: '',
                          boqQty: 0,
                          purchaseQty: 0,
                          rate: '',
                          amount: ''
                        };
                      } else if (formData.itemType === 'Service') {
                        // Handle Service/Component selection
                        const selectedComponent = componentRequirements.find(item => 
                          item.componentName === newValue
                        );
                        
                        if (selectedComponent) {
                          newItems[row] = {
                            ...newItems[row],
                            itemCode: selectedComponent.componentName || '',
                            description: selectedComponent.componentName || '',
                            unit: selectedComponent.unit || '',
                            boqQty: selectedComponent.totalVolume || 0,
                            purchaseQty: selectedComponent.totalVolume || 0,
                            rate: newItems[row].rate || 0,
                            amount: (selectedComponent.totalVolume || 0) * (newItems[row].rate || 0)
                          };
                        }
                      } else {
                        // Handle Material selection
                        if (formData.purchaseType === 'project') {
                          // For project purchases, use materialRequirements
                          const selectedMaterial = materialRequirements.find(item => 
                            item.materialName === newValue
                          );
                          
                          if (selectedMaterial) {
                            newItems[row] = {
                              ...newItems[row],
                              itemCode: selectedMaterial.materialName || '',
                              itemId: selectedMaterial.materialId || '',
                              materialName: selectedMaterial.materialName || '',
                              description: selectedMaterial.materialName || '',
                              unit: selectedMaterial.unit || '',
                              rate: selectedMaterial.materialRate || 0,
                              boqQty: selectedMaterial.totalQty || 0,
                              purchaseQty: 0,
                              amount: 0
                            };
                          }
                        } else {
                          // For general purchases, use materialItems
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
                              materialName: itemData.material || '',
                              description: itemData.default_brand || '',
                              unit: itemData.unit || '',
                              rate: itemData.defaultRate || 0,
                              boqQty: 0,
                              purchaseQty: 0,
                              amount: 0
                            };
                          }
                        }
                      }
                    }

                    // Handle other field changes (brand, unit, etc.)
                    if (prop !== 'itemCode' && prop !== 'purchaseQty' && prop !== 'rate') {
                      newItems[row][prop] = newValue;
                    }

                    // Calculate amount when purchaseQty or rate changes
                    if (prop === 'purchaseQty' || prop === 'rate') {
                      newItems[row][prop] = newValue;
                      const qty = parseFloat(newItems[row].purchaseQty) || 0;
                      const rate = parseFloat(newItems[row].rate) || 0;
                      newItems[row].amount = qty * rate;
                    }

                    setFormData(prev => ({ ...prev, items: newItems }));
                  });
                }}
              />
            </div>

            {/* Remarks and Terms & Condition - Collapsible */}
            <Card className="mb-4" style={{ border: 'none' }}>
              <div 
                onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {showAdditionalInfo ? <FaChevronDown /> : <FaChevronRight />}
                  Additional Information
                </span>
              </div>
              {showAdditionalInfo && (
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Remarks / Special Instructions</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="remarks"
                          value={formData.remarks}
                          onChange={handleInputChange}
                          disabled={isViewMode}
                          placeholder="Enter any special instructions, delivery requirements, or additional notes"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Terms & Condition</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="TermsCondition"
                          value={formData.TermsCondition}
                          onChange={handleInputChange}
                          disabled={isViewMode}
                          placeholder="Terms and conditions for this purchase order"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              )}
            </Card>

            {/* Approver Details Panel */}
            <Card className="mb-4" style={{ border: 'none' }}>
              <div 
                onClick={() => setShowApproverDetails(!showApproverDetails)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {showApproverDetails ? <FaChevronDown /> : <FaChevronRight />}
                 
                  Approver Details
                </span>




              </div>
              {showApproverDetails && (
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Approver Name <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        value={approverDetails.approverId}
                        onChange={(e) => {
                          const selectedUser = users.find(u => u._id === e.target.value);
                          setApproverDetails({
                            ...approverDetails,
                            approverId: e.target.value,
                            approverName: selectedUser ? selectedUser.username : '',
                            approverEmail: selectedUser ? selectedUser.email : ''
                          });
                        }}
                        disabled={isViewMode || formData.status === 'ApprovalRequest'}
                      >
                        <option value="">Select approver</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.fullName || user.username}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Approver Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={approverDetails.approverEmail}
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                      />
                    </Form.Group>
                  </Col>
                  {formData.status !== 'Draft' && (
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Approver Comments</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={1}
                          value={approverDetails.approverComments}
                          onChange={(e) => setApproverDetails({
                            ...approverDetails,
                            approverComments: e.target.value
                          })}
                          disabled={isViewMode && formData.status !== 'ApprovalRequest'}
                          placeholder="Enter comments..."
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                {/* Approval Action Buttons */}
               
                {formData.status === 'ApprovalRequest'  && formData.approverUserId === userId && (
                  <div className="d-flex justify-content-end gap-2 mt-3 mb-3">
                    <Button variant="success" size="sm" onClick={() => handleUpdateApprovalStatus('Approved')}>
                      <i className="bi bi-check-circle me-2"></i>Approve
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleUpdateApprovalStatus('Rejected')}>
                      <i className="bi bi-x-circle me-2"></i>Reject
                    </Button>
                  </div>
                )}

                {/* Approval History Section */}
                {formData.approverComments && formData.approverComments.length > 0 && (
                  <div className="mt-4">
                    <h6 className="border-bottom pb-2 mb-3">
                      <i className="bi bi-clock-history me-2"></i>
                      Approval History
                    </h6>
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Table striped bordered hover size="sm">
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
                          <tr>
                            <th style={{ width: '5%' }}>#</th>
                            <th style={{ width: '15%' }}>Date</th>
                            <th style={{ width: '20%' }}>Commented By</th>
                            <th style={{ width: '12%' }}>Status</th>
                            <th style={{ width: '48%' }}>Comments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.approverComments.map((comment, index) => (
                            <tr key={index}>
                              <td className="text-center">{index + 1}</td>
                              <td>
                                <small>
                                  <i className="bi bi-calendar-event me-1"></i>
                                  {comment.date || 'N/A'}
                                </small>
                              </td>
                              <td>
                                <small>
                                  <i className="bi bi-person-circle me-1"></i>
                                  {comment.commentedBy || 'Unknown'}
                                </small>
                              </td>
                              <td>
                                <span className={`badge ${comment.status === 'Approved' ? 'bg-success' : comment.status === 'Rejected' ? 'bg-danger' : 'bg-secondary'}`}>
                                  {comment.status || 'Unknown'}
                                </span>
                              </td>
                              <td>
                                <small>{comment.comments || comment.comment || 'No comment'}</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                )}
              </Card.Body>
              )}
            </Card>

            </Form>
          </Card.Body>
        </Card>
      )}

      {/* PDF Viewer Modal */}
      <Modal show={showPDFModal} onHide={() => setShowPDFModal(false)} size="xl" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-file-pdf me-2"></i>
            Purchase Order PDF - {formData.poNumber} ({currentPdfCopyType === 'office' ? 'Office Copy' : 'Supplier Copy'})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '80vh', padding: 0 }}>
          <PDFViewer width="100%" height="100%" key={currentPdfCopyType}>
            <PurchaseOrderPDF poData={formData} currency={currency} copyType={currentPdfCopyType} />
          </PDFViewer>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PurchaseOrders;
