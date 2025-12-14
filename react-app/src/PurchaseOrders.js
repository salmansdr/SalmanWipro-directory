import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Alert, Badge, InputGroup, Modal } from 'react-bootstrap';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
  col2: { width: '35%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
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
const PurchaseOrderPDF = ({ poData, currency }) => {
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

  const total = (poData.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <Document>
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
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.col1}>S/L</Text>
            <Text style={pdfStyles.col2}>Item Name</Text>
            <Text style={pdfStyles.col3}>Brand</Text>
            <Text style={pdfStyles.col4}>Quantity Unit</Text>
            <Text style={pdfStyles.col5}>Rate ({currency || 'INR'})</Text>
            <Text style={pdfStyles.col6}>Amount ({currency || 'INR'})</Text>
          </View>
          {(poData.items || []).map((item, index) => (
            <View key={index} style={pdfStyles.tableRow}>
              <Text style={pdfStyles.col1}>{index + 1}</Text>
              <Text style={pdfStyles.col2}>{item.itemName || ''}</Text>
              <Text style={pdfStyles.col3}>{item.brand || ''}</Text>
              <Text style={pdfStyles.col4}>{item.purchaseQty || 0} {item.unit || ''}</Text>
              <Text style={pdfStyles.col5}>{Number(item.rate || 0).toFixed(2)}</Text>
              <Text style={pdfStyles.col6}>{Number(item.amount || 0).toFixed(2)}</Text>
            </View>
          ))}
          <View style={pdfStyles.tableRowTotal}>
            <Text style={{ width: '60%' }}></Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>Grand Total</Text>
            <Text style={{ width: '20%', textAlign: 'right' }}>{formatCurrency(total)}</Text>
          </View>
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const hotTableRef = useRef(null);
  
  // Dropdown data
  const [materialItems, setMaterialItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materialRequirements, setMaterialRequirements] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [currency, setCurrency] = useState('');
  const [userName] = useState(localStorage.getItem('username') || 'Admin User');
  const [userFullName] = useState(localStorage.getItem('fullName') || 'Admin User');
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [companyId] = useState(localStorage.getItem('selectedCompanyId') || '');
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showApproverDetails, setShowApproverDetails] = useState(true);
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
    supplierId: '',
    supplierName: '',
    supplierEmail: '',
    supplierContactPerson: '',
    supplierMobileNumber: '',
    projectId: '',
    projectName: '',
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
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoryDropdown && !event.target.closest('.category-dropdown-wrapper')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown]);

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
  }, [searchTerm, purchaseOrders]);

  const loadDropdownData = async () => {
    try {
      // Load Material Items
      const itemsResponse = await fetch(`${apiBaseUrl}/api/materialitems`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setMaterialItems(Array.isArray(itemsData) ? itemsData : []);
      }

      // Load Suppliers
      const suppliersResponse = await fetch(`${apiBaseUrl}/api/Supplier`);
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      }

      // Load Projects
      const companyId = localStorage.getItem('selectedCompanyId') || '1';
      const projectsResponse = await fetch(`${apiBaseUrl}/api/Projects/basic?companyId=${companyId}`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }

      // Load Users for approver dropdown
      const usersResponse = await fetch(`${apiBaseUrl}/api/Usermaster`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      // Load Units
      const unitsResponse = await fetch(`${apiBaseUrl}/api/MaterialItems/units`);
      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json();
        // Handle different response formats and extract unit strings
        let unitsArray = Array.isArray(unitsData) ? unitsData : (unitsData.units || []);
        // If units are objects with 'unit' property, extract the unit strings
        if (unitsArray.length > 0 && typeof unitsArray[0] === 'object' && unitsArray[0].unit) {
          unitsArray = unitsArray.map(item => item.unit);
        }
        setUnits(unitsArray);
      } else {
        // Fallback to default units
        setUnits(['bag', 'cft', 'kg', 'pcs', 'litre', 'box', 'ft', 'sqft', 'meter', 'sq meter', 'running meter', 'nos', 'set', 'roll', 'sheet', 'cum']);
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/PurchaseOrder?companyId=${companyId}`);
      //const response = await fetch(`${apiBaseUrl}/api/PurchaseOrder`);
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
        setFilteredOrders(data);
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
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
      deliveryLocation: prev.purchaseType === 'project' && selectedProject ? (selectedProject.location || '') : prev.deliveryLocation
    }));

    // Fetch material requirements if project is selected
    if (selectedProject && selectedProject._id) {
      await fetchMaterialRequirements(selectedProject._id);
    } else {
      setMaterialRequirements([]);
      setAvailableCategories([]);
      setSelectedCategories([]);
    }
  };

  const fetchMaterialRequirements = async (projectId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/ProjectEstimation/report-by-project/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.materialRequirements && Array.isArray(data.materialRequirements) && data.materialRequirements.length > 0) {
          setMaterialRequirements(data.materialRequirements);
          
          // Extract distinct subcategories
          const distinctCategories = [...new Set(
            data.materialRequirements
              .map(item => item.subCategory)
              .filter(cat => cat) // Remove null/undefined
          )].sort();
          
          setAvailableCategories(distinctCategories);
        } else {
          // No material requirements found
          setMaterialRequirements([]);
          setAvailableCategories([]);
          setSelectedCategories([]);
        }
      } else {
        // API call failed or no data
        setMaterialRequirements([]);
        setAvailableCategories([]);
        setSelectedCategories([]);
      }
    } catch (error) {
      console.error('Error fetching material requirements:', error);
      setMaterialRequirements([]);
      setAvailableCategories([]);
      setSelectedCategories([]);
      setAlertMessage({ show: true, type: 'warning', message: 'Failed to load material requirements' });
    }
  };

  const handleCategorySelection = (category) => {
    const newSelected = selectedCategories.includes(category)
      ? selectedCategories.filter(cat => cat !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newSelected);
    
    // Filter and populate items based on selected categories
    if (newSelected.length > 0) {
      const filteredItems = materialRequirements
        .filter(item => newSelected.includes(item.subCategory))
        .map(item => {
          // Find the material item to get the _id
          const materialItem = materialItems.find(mi => {
            const itemData = mi.itemData || mi;
            return itemData.material === item.materialName;
          });
          const itemData = materialItem?.itemData || materialItem;
          
          return {
            itemCode: itemData?._id || itemData?.materialId || '',
            unit: item.unit || '',
            boqQty: item.totalQty || 0,
            purchaseQty: item.totalQty || 0, // Default to BOQ quantity
            rate: item.materialRate || '',
            amount: item.materialRate && item.totalQty ? (item.totalQty * item.materialRate).toFixed(2) : ''
          };
        });
      
      setFormData(prev => ({
        ...prev,
        items: filteredItems
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: []
      }));
    }
  };

  const toggleCategoryDropdown = () => {
    setShowCategoryDropdown(!showCategoryDropdown);
  };

  const filteredCategories = availableCategories.filter(cat =>
    cat.toLowerCase().includes(categoryFilter.toLowerCase())
  );

  const handlePurchaseTypeChange = (e) => {
    const purchaseType = e.target.value;
    
    setFormData(prev => {
      // If switching to general, clear project name and delivery location
      if (purchaseType === 'general') {
        setMaterialRequirements([]);
        setAvailableCategories([]);
        setSelectedCategories([]);
        setCategoryFilter('');
        setShowCategoryDropdown(false);
        return {
          ...prev,
          purchaseType: purchaseType,
          projectId: '',
          projectName: '',
          deliveryLocation: '',
          items: []
        };
      }
      // If switching to project, keep existing data
      return {
        ...prev,
        purchaseType: purchaseType
      };
    });
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
        approverUserId: approverUserId,
        approverComments: approverCommentsArray,
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
          // Find the material ID if itemCode contains the name
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
            brand: item.brand,
            unit: item.unit,
            boqQty: item.boqQty,
            purchaseQty: item.purchaseQty,
            rate: item.rate,
            amount: item.amount
          };
        }) || [],
        companyId: companyId,
        createdBy: editMode ? formData.createdBy : userId,
        modifiedBy: userId
      };
      
      console.log('Submit Data:', submitData);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        try {
          const savedData = await response.json();
          
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
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          // Show success alert even if parsing fails
          const statusMessage = status === 'Draft' ? 'saved' : 'submitted';
          setAlertMessage({ 
            show: true, 
            type: 'success', 
            message: editMode 
              ? `Purchase Order ${statusMessage} successfully!` 
              : `Purchase Order ${statusMessage} successfully!` 
          });
        }
        
        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        
        // Reload purchase orders list
        loadPurchaseOrders();
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to save: ${errorData}` });
      }
    } catch (error) {
      console.error('Error submitting purchase order:', error);
      setAlertMessage({ show: true, type: 'danger', message: 'Error saving purchase order: ' + error.message });
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
      const response = await fetch(`${apiBaseUrl}/api/PurchaseOrder/UpdateApprovalStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: formData._id,
          status: status,
          comments: approverDetails.approverComments || '',
          commentedBy: userFullName
        }),
      });

      if (response.ok) {
        setAlertMessage({ 
          show: true, 
          type: 'success', 
          message: `Purchase Order ${status === 'Approved' ? 'approved' : 'rejected'} successfully!` 
        });

        // Update formData status
        setFormData(prev => ({
          ...prev,
          status: status
        }));

        // Clear approver comments
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
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to update status: ${errorData}` });
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      setAlertMessage({ show: true, type: 'danger', message: 'Error updating approval status: ' + error.message });
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
      supplierId: '',
      supplierName: '',
      supplierEmail: '',
      supplierContactPerson: '',
      supplierMobileNumber: '',
      projectId: '',
      projectName: '',
      deliveryDate: '',
      deliveryLocation: '',
      modeOfPayment: '',
      remarks: '',
      TermsCondition: '',
      status: 'Draft',
      items: []
    });
    setMaterialRequirements([]);
    setAvailableCategories([]);
    setSelectedCategories([]);
    setCategoryFilter('');
    setShowCategoryDropdown(false);
    setEditMode(false);
  };

  const handleNewPO = async () => {
    handleReset();
    setIsViewMode(false);
    
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

  const handleViewPO = (po) => {
    // Transform items: if itemCode is an ObjectId, convert to material name
    const transformedPO = {
      ...po,
      items: po.items?.map(item => {
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
    setEditMode(false);
    setIsViewMode(true);
    setViewMode('form');
  };

  const handleEditPO = (po) => {
    // Transform items: if itemCode is an ObjectId, convert to material name
    const transformedPO = {
      ...po,
      items: po.items?.map(item => {
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
    setEditMode(true);
    // Set view mode to true for ApprovalRequest status (read-only except approver section)
    setIsViewMode(po.status === 'ApprovalRequest');
    setViewMode('form');
  };

  const handleDelete = async (_id) => {
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
            <Button variant="light" onClick={handleNewPO}>
              <i className="bi bi-plus-circle me-2"></i>New Purchase Order
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
                    placeholder="Search by PO Number, Supplier Name, or Supplier Code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* Purchase Orders Table */}
            <Table striped bordered hover responsive style={{ fontSize: '0.875rem' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '13%' }}>PO Number</th>
                  <th style={{ width: '8%' }}>PO Date</th>
                  <th style={{ width: '12%' }}>Supplier Name</th>
                  <th style={{ width: '12%' }}>Project Name</th>
                  <th style={{ width: '8%' }}>Delivery Date</th>
                  <th style={{ width: '10%' }}>Mode of Payment</th>
                  <th style={{ width: '7%' }}>Status</th>
                  <th style={{ width: '10%' }}>Created By</th>
                  <th style={{ width: '10%' }}>Modified By</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">
                      {searchTerm ? 'No purchase orders found matching your search.' : 'No purchase orders available. Click "New Purchase Order" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((po) => (
                    <tr key={po._id}>
                      <td>
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none"
                          onClick={() => handleViewPO(po)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          {po.poNumber}
                        </Button>
                      </td>
                      <td>{po.poDate ? new Date(po.poDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{po.supplierName}</td>
                      <td>{po.projectName}</td>
                      <td>{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{po.modeOfPayment}</td>
                      <td>{getStatusBadge(po.status)}</td>
                      <td>{po.createdByUserName || '-'}</td>
                      <td>{po.modifiedByUserName || '-'}</td>
                      <td>
                        {/* Approved: Hide all action buttons */}
                        {po.status !== 'Approved' && (
                          <>
                            {/* Draft or Rejected: Show buttons only if user is creator or modifier */}
                            {(po.status === 'Draft' || po.status === 'Rejected') && 
                             (po.createdBy === userId || po.modifiedBy === userId) && (
                              <>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  className="me-2"
                                  onClick={() => handleEditPO(po)}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                {po.status === 'Rejected' && (
                                  <Button 
                                    variant="outline-warning" 
                                    size="sm" 
                                    className="me-2"
                                    onClick={() => handleConvertToDraft(po._id)}
                                    title="Convert to Draft"
                                  >
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                  </Button>
                                )}
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDelete(po._id)}
                                  title="Delete"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </>
                            )}
                            
                            {/* ApprovalRequest: Show only Edit button if user is the approver */}
                            {po.status === 'ApprovalRequest' && po.approverUserId === userId && (
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => handleEditPO(po)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil"></i>
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
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
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
                  {editMode ? 'Edit Purchase Order' : 'New Purchase Order'}
                </h4>
              </div>
              <div>
                <Button variant="light" className="me-2" onClick={() => setViewMode('list')}>
                  <i className="bi bi-arrow-left me-2"></i>Back to List
                </Button>
                {formData._id && (
                  <Button variant="info" className="me-2" onClick={() => setShowPDFModal(true)}>
                    <i className="bi bi-file-pdf me-2"></i>View PDF
                  </Button>
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
                <Col md={3}>
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
                <Col md={3}>
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
                <Col md={formData.purchaseType === 'project' ? 3 : 6}>
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
                {formData.purchaseType === 'project' && availableCategories.length > 0 && (
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Material Categories</Form.Label>
                      <div className="position-relative category-dropdown-wrapper" style={{ maxWidth: '400px' }}>
                        <div 
                          className="form-control d-flex justify-content-between align-items-center"
                          onClick={!isViewMode ? toggleCategoryDropdown : undefined}
                          style={{ 
                            cursor: isViewMode ? 'not-allowed' : 'pointer',
                            backgroundColor: isViewMode ? '#e9ecef' : 'white',
                            paddingRight: '10px'
                          }}
                        >
                          <span className={selectedCategories.length > 0 ? 'text-dark' : 'text-muted'}>
                            {selectedCategories.length > 0 
                              ? `${selectedCategories.length} category(ies) selected` 
                              : 'Select categories...'}
                          </span>
                          <i className={`bi bi-chevron-${showCategoryDropdown ? 'up' : 'down'}`}></i>
                        </div>
                        
                        {showCategoryDropdown && (
                          <Card 
                            className="position-absolute shadow-lg border" 
                            style={{ 
                              zIndex: 1000, 
                              maxHeight: '300px', 
                              overflowY: 'auto',
                              marginTop: '2px',
                              width: '100%'
                            }}
                          >
                            <Card.Body className="p-2">
                              <Form.Control
                                type="text"
                                placeholder="Search categories..."
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="mb-2"
                                autoFocus
                              />
                              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {filteredCategories.length > 0 ? (
                                  filteredCategories.map((category, index) => (
                                    <Form.Check
                                      key={index}
                                      type="checkbox"
                                      id={`category-${index}`}
                                      label={category}
                                      checked={selectedCategories.includes(category)}
                                      onChange={() => handleCategorySelection(category)}
                                      className="mb-2"
                                    />
                                  ))
                                ) : (
                                  <div className="text-muted text-center py-2">
                                    No categories found
                                  </div>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        )}
                      </div>
                      <Form.Text className="text-muted">
                        {selectedCategories.length > 0 
                          ? `${materialRequirements.filter(item => selectedCategories.includes(item.subCategory)).length} items will be added to order`
                          : 'Select one or more categories to populate order items'
                        }
                      </Form.Text>
                    </Form.Group>
                  </Col>
                )}
              </Row>
            </div>

            {/* Items Section */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Order Items</h5>
              <HotTable
                ref={hotTableRef}
                data={[
                  ...((formData.items && formData.items.length > 0) ? formData.items : [{
                    itemCode: '',
                    brand: '',
                    unit: '',
                    boqQty: 0,
                    purchaseQty: 0,
                    rate: '',
                    amount: ''
                  }]),
                  {
                  itemCode: 'Total:',
                  description: '',
                  brand: '',
                  unit: '',
                  boqQty: '',
                  purchaseQty: '',
                  rate: '',
                  amount: (formData.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
                  action: '',
                  isTotalRow: true
                }]}
                colHeaders={isViewMode 
                  ? ['Material', 'Brand', 'Unit', 'BOQ Qty', 'Purchase Qty', `Rate (${currency})`, `Amount (${currency})`]
                  : ['Material', 'Brand', 'Unit', 'BOQ Qty', 'Purchase Qty', `Rate (${currency})`, `Amount (${currency})`, 'Action']
                }
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
                    width: 200,
                    renderer: (instance, td, row, col, prop, value, cellProperties) => {
                      const rowData = instance.getSourceDataAtRow(row);
                      
                      // If itemName exists (data from backend), use it
                      if (rowData && rowData.itemName) {
                        td.innerHTML = rowData.itemName;
                        return td;
                      }
                      
                      // If value is already a material name (from dropdown selection), show it
                      const materialItem = materialItems.find(item => {
                        const itemData = item.itemData || item;
                        return itemData.material === value;
                      });
                      
                      if (materialItem) {
                        td.innerHTML = value;
                        return td;
                      }
                      
                      // If value is an ID, lookup the material name
                      const itemById = materialItems.find(item => {
                        const itemData = item.itemData || item;
                        return (itemData._id || itemData.materialId) === value;
                      });
                      
                      if (itemById) {
                        const itemData = itemById.itemData || itemById;
                        td.innerHTML = itemData.material || '';
                      } else {
                        td.innerHTML = value || '';
                      }
                      
                      return td;
                    }
                  },
                  {
                    data: 'brand',
                    type: 'text',
                    width: 120
                  },
                  {
                    data: 'unit',
                    type: 'dropdown',
                    source: units,
                    width: 80
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
                    width: 100
                  },
                  {
                    data: 'amount',
                    type: 'numeric',
                    numericFormat: {
                      pattern: '0,0.00'
                    },
                    width: 120,
                    readOnly: true
                  },
                  ...(!isViewMode ? [{
                    data: 'action',
                    width: 100,
                    readOnly: true,
                    renderer: (instance, td, row, col, prop, value, cellProperties) => {
                      td.innerHTML = '';
                      td.style.textAlign = 'center';
                      
                      // Calculate actual data row count (including default blank row)
                      const actualRowCount = formData.items.length > 0 ? formData.items.length : 1;
                      
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
                          brand: item.brand || '',
                          unit: item.unit || '',
                          boqQty: item.boqQty || 0,
                          purchaseQty: item.purchaseQty || 0,
                          rate: item.rate || '',
                          amount: item.amount || '',
                          itemId: item.itemId || ''
                        }));
                        
                        // Insert new blank row after current row
                        newItems.splice(row + 1, 0, {
                          itemCode: '',
                          brand: '',
                          unit: '',
                          boqQty: 0,
                          purchaseQty: 0,
                          rate: '',
                          amount: ''
                        });
                        setFormData(prev => ({ ...prev, items: newItems }));
                      };
                      td.appendChild(addBtn);
                      
                      // Delete row button - only show if there are actual items or more than 1 row
                      if (formData.items.length > 0) {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'btn btn-danger btn-sm';
                        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
                        deleteBtn.onclick = () => {
                          // Get current data from the grid
                          const currentData = instance.getSourceData();
                          const newItems = currentData.filter((item, index) => 
                            index !== row && !item.isTotalRow
                          ).map(item => ({
                            itemCode: item.itemCode || '',
                            brand: item.brand || '',
                            unit: item.unit || '',
                            boqQty: item.boqQty || 0,
                            purchaseQty: item.purchaseQty || 0,
                            rate: item.rate || '',
                            amount: item.amount || '',
                            itemId: item.itemId || ''
                          }));
                          setFormData(prev => ({ ...prev, items: newItems }));
                        };
                        td.appendChild(deleteBtn);
                      }
                      
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
                  { row: (formData.items.length > 0 ? formData.items.length : 1), col: 0, rowspan: 1, colspan: isViewMode ? 5 : 6 }
                ]}
                cells={(row, col) => {
                  const cellProperties = {};
                  const itemsToDisplay = formData.items.length > 0 ? formData.items : [{
                    itemCode: '',
                    unit: '',
                    boqQty: 0,
                    purchaseQty: 0,
                    rate: '',
                    amount: ''
                  }];
                  const dataRow = [...itemsToDisplay, { isTotalRow: true }][row];
                  
                  // Make all cells readonly in view mode
                  if (isViewMode) {
                    cellProperties.readOnly = true;
                  }
                  
                  if (dataRow && dataRow.isTotalRow) {
                    cellProperties.readOnly = true;
                    cellProperties.type = 'text';  // Override dropdown type for total row
                    if (col === 0) {
                      // Merged cell - no special class needed, will be handled by renderer
                      cellProperties.className = 'htRight htMiddle bg-light fw-bold';
                    } else if (col === 6) {
                      // Amount column - right align
                      cellProperties.className = 'htRight htMiddle bg-light fw-bold';
                    } else {
                      cellProperties.className = 'htCenter htMiddle bg-light fw-bold';
                    }
                  }
                  
                  return cellProperties;
                }}
                afterRenderer={(td, row, col, prop, value, cellProperties) => {
                  const itemsToDisplay = formData.items.length > 0 ? formData.items : [{
                    itemCode: '',
                    brand: '',
                    unit: '',
                    boqQty: 0,
                    purchaseQty: 0,
                    rate: '',
                    amount: ''
                  }];
                  const dataRow = [...itemsToDisplay, { isTotalRow: true }][row];
                  if (dataRow && dataRow.isTotalRow) {
                    // Style total row with stronger visual separation
                    td.style.borderTop = '2px solid #0d6efd';
                    td.style.fontWeight = 'bold';
                    td.style.backgroundColor = '#f8f9fa';
                    
                    if (col === 0) {
                      // First column in merged cell - show "Total:"
                      td.style.textAlign = 'right';
                      td.style.paddingRight = '15px';
                    } else if (col === 6) {
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
                    // Get current items or initialize with empty array
                    const currentItems = formData.items.length > 0 ? formData.items : [{
                      itemCode: '',
                      brand: '',
                      unit: '',
                      boqQty: 0,
                      purchaseQty: 0,
                      rate: '',
                      amount: ''
                    }];
                    
                    // Skip if this is the total row
                    if (row >= currentItems.length) return;
                    
                    const newItems = [...currentItems];
                    
                    // Ensure row exists
                    if (!newItems[row]) {
                      newItems[row] = {
                        itemCode: '',
                        brand: '',
                        unit: '',
                        boqQty: 0,
                        purchaseQty: 0,
                        rate: '',
                        amount: ''
                      };
                    }

                    // Handle item code selection
                    if (prop === 'itemCode' && newValue) {
                      const selectedItem = materialItems.find(item => {
                        const itemData = item.itemData || item;
                        return itemData.material === newValue;
                      });
                      
                      if (selectedItem) {
                        const itemData = selectedItem.itemData || selectedItem;
                        newItems[row] = {
                          ...newItems[row],
                          itemCode: itemData.material || '',  // Store material name for display
                          itemId: itemData._id || itemData.materialId || '',  // Store ID separately
                          materialName: itemData.material || '',
                          brand: itemData.default_brand || '',
                          unit: itemData.unit || '',
                          rate: itemData.defaultRate || 0,
                          boqQty: newItems[row].boqQty || 0,
                          purchaseQty: newItems[row].purchaseQty || newItems[row].boqQty || 1,
                          amount: (newItems[row].purchaseQty || newItems[row].boqQty || 1) * (itemData.defaultRate || 0)
                        };
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
                  <i className="bi bi-person-check"></i>
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
            Purchase Order PDF - {formData.poNumber}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '80vh', padding: 0 }}>
          <PDFViewer width="100%" height="100%">
            <PurchaseOrderPDF poData={formData} currency={currency} />
          </PDFViewer>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PurchaseOrders;
