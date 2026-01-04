import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Alert, Badge, InputGroup, Modal, Pagination, Spinner } from 'react-bootstrap';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
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
const RequisitionPDF = ({ poData, currency }) => {
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
          <Text>MATERIAL REQUISITION</Text>
        </View>

        {/* Requisition Details */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Requisition No.</Text>
            <Text style={pdfStyles.value}>: {poData.requisitionNumber || ''}</Text>
            <Text style={pdfStyles.label}>Requisition Date</Text>
            <Text style={pdfStyles.value}>: {formatDate(poData.requisitionDate)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Requisition Type</Text>
            <Text style={pdfStyles.value}>: {poData.purchaseType === 'project' ? 'Project' : 'General'}</Text>
            <Text style={pdfStyles.label}>Required By Date</Text>
            <Text style={pdfStyles.value}>: {formatDate(poData.deliveryDate)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Project Name</Text>
            <Text style={pdfStyles.value}>: {poData.projectName || 'N/A'}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={pdfStyles.table}>
          <Text style={pdfStyles.sectionTitle}>Material Details</Text>
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.col1}>S/L</Text>
            <Text style={{ width: '35%' }}>{poData.itemType === 'Service' ? 'Work Scope' : 'Material'}</Text>
            <Text style={{ width: '25%' }}>Description</Text>
            <Text style={{ width: '15%' }}>Unit</Text>
            <Text style={{ width: '10%' }}>BOQ Qty</Text>
            <Text style={{ width: '10%' }}>Requested Qty</Text>
          </View>
          {(poData.items || []).map((item, index) => (
            <View key={index} style={pdfStyles.tableRow}>
              <Text style={pdfStyles.col1}>{index + 1}</Text>
              <Text style={{ width: '35%' }}>{poData.itemType === 'Service' ? (item.workScope || '') : (item.itemName || '')}</Text>
              <Text style={{ width: '25%' }}>{item.description || ''}</Text>
              <Text style={{ width: '15%' }}>{item.unit || ''}</Text>
              <Text style={{ width: '10%' }}>{item.boqQty || 0}</Text>
              <Text style={{ width: '10%' }}>{item.requisitionQty || 0}</Text>
            </View>
          ))}
        </View>

        {/* Remarks Section */}
        {poData.remarks && (
          <View style={pdfStyles.remarksSection}>
            <Text style={pdfStyles.remarksSectionTitle}>Remarks / Special Instructions:</Text>
            <Text style={pdfStyles.sectionContent}>{poData.remarks}</Text>
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

const Requisition = () => {
  const permissions = getPagePermissions('Requisition');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const hotTableRef = useRef(null);
  
  // Dropdown data
  const [materialItems, setMaterialItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materialRequirements, setMaterialRequirements] = useState([]);
  const [componentRequirements, setComponentRequirements] = useState([]);
  const [currency, setCurrency] = useState('');
  const [userName] = useState(localStorage.getItem('username') || '');
  const [userFullName] = useState(localStorage.getItem('fullName') || '');
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [companyId] = useState(localStorage.getItem('selectedCompanyId') || '');
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(true);
  const [showApproverDetails, setShowApproverDetails] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [approverDetails, setApproverDetails] = useState({
    approverId: '',
    approverName: '',
    approverEmail: '',
    approverComments: ''
  });
  
  const [formData, setFormData] = useState({
    _id: '',
    requisitionNumber: '',
    requisitionDate: '',
    purchaseType: 'project',
    itemType: 'Material',
    projectId: '',
    projectName: '',
    deliveryDate: '',
    remarks: '',
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

  useEffect(() => {
    if (viewMode === 'list') {
      loadRequisitions();
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
        po.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.projectName && po.projectName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOrders(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchTerm, purchaseOrders]);

  const loadDropdownData = async () => {
    try {
      // Load Material Items
      const itemsResponse = await fetch(`${apiBaseUrl}/api/materialitems`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setMaterialItems(Array.isArray(itemsData) ? itemsData : []);
      }

      // Load Projects
      const companyId = localStorage.getItem('selectedCompanyId') || '1';
      const projectsResponse = await fetch(`${apiBaseUrl}/api/Projects/basic?companyId=${companyId}`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        // Filter out completed projects
        const activeProjects = Array.isArray(projectsData) 
          ? projectsData.filter(project => project.status !== 'Completed') 
          : [];
        setProjects(activeProjects);
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
        //setUnits(['bag', 'cft', 'kg', 'pcs', 'litre', 'box', 'ft', 'sqft', 'meter', 'sq meter', 'running meter', 'nos', 'set', 'roll', 'sheet', 'cum']);
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const loadRequisitions = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/Requisition?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        // Map prNumber and prDate to requisitionNumber and requisitionDate
        const mappedData = data.map(item => ({
          ...item,
          requisitionNumber: item.prNumber,
          requisitionDate: item.prDate,
          purchaseType: item.requisitionType
        }));
        setPurchaseOrders(mappedData);
        setFilteredOrders(mappedData);
      }
    } catch (error) {
      console.error('Error loading requisitions:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    setLoadingMaterials(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/ProjectEstimation/report-by-project/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Handle Material Requirements
        if (data.materialRequirements && Array.isArray(data.materialRequirements) && data.materialRequirements.length > 0) {
          setMaterialRequirements(data.materialRequirements);
        } else {
          setMaterialRequirements([]);
        }
        
        // Handle Component Requirements (for Service)
        if (data.componentRequirements && Array.isArray(data.componentRequirements) && data.componentRequirements.length > 0) {
          setComponentRequirements(data.componentRequirements);
        } else {
          setComponentRequirements([]);
        }
      } else {
        // API call failed or no data
        setMaterialRequirements([]);
        setComponentRequirements([]);
      }
    } catch (error) {
      console.error('Error fetching material requirements:', error);
      setMaterialRequirements([]);
      setComponentRequirements([]);
      setAlertMessage({ show: true, type: 'warning', message: 'Failed to load material requirements' });
    } finally {
      setLoadingMaterials(false);
    }
  };

  

  

 

  // Common function to get dropdown items based on purchase type, item type, and project selection
  const getDropdownItems = () => {
    // For general purchase type, show all materials
    if (formData.purchaseType === 'general') {
      if (formData.itemType === 'Service') {
        return componentRequirements.map(item => (item.componentName || '').trim());
      } else {
        return materialItems.map(item => {
          const itemData = item.itemData || item;
          return (itemData.material || '').trim();
        });
      }
    }
    
    // For project purchase type, show only project-specific materials/services
    if (formData.purchaseType === 'project' && formData.projectId) {
      if (formData.itemType === 'Service') {
        // Show only components from the selected project
        return componentRequirements.map(item => (item.componentName || '').trim());
      } else {
        // Show only materials from the selected project's materialRequirements
        return materialRequirements.map(item => (item.materialName || '').trim());
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

  const handleItemTypeChange = async (e) => {
    const itemType = e.target.value;
    setFormData(prev => ({
      ...prev,
      itemType: itemType,
      items: []
    }));
  };

  // Common function to save requisition with different status
  const saveRequisition = async (status) => {
    // Validate mandatory fields
    if (!formData.requisitionDate) {
      setAlertMessage({ show: true, type: 'danger', message: 'Requisition Date is required!' });
      return;
    }
    if (formData.purchaseType === 'project' && !formData.projectName) {
      setAlertMessage({ show: true, type: 'danger', message: 'Project Name is required for project-type requisitions!' });
      return;
    }
    if (!formData.deliveryDate) {
      setAlertMessage({ show: true, type: 'danger', message: 'Required By Date is required!' });
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
      
      // Check if requested quantity is valid
      const requisitionQty = parseFloat(item.requisitionQty);
      if (isNaN(requisitionQty) || requisitionQty <= 0) {
        setAlertMessage({ show: true, type: 'danger', message: `Row ${i + 1}: Requested Qty must be greater than 0!` });
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
        ? `${apiBaseUrl}/api/Requisition/${formData._id}?companyId=${companyId}`
        : `${apiBaseUrl}/api/Requisition?companyId=${companyId}`;
      
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
        prNumber: formData.requisitionNumber,  // Map to prNumber for API
        prDate: formData.requisitionDate,      // Map to prDate for API
        requisitionType: formData.purchaseType, // Map to requisitionType for API
        requisitionNumber: undefined,          // Remove original field
        requisitionDate: undefined,            // Remove original field
        purchaseType: undefined,               // Remove original field
        status: status,
        itemType: formData.itemType || 'Material', // Explicitly include itemType
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
          // For Service type, save workScope instead of itemCode
          if (formData.itemType === 'Service') {
            return {
              workScope: item.itemCode || item.workScope,
              description: item.description,
              unit: item.unit,
              boqQty: item.boqQty,
              requisitionQty: item.requisitionQty,
              rate: item.rate,
              amount: item.amount
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
            requisitionQty: item.requisitionQty,
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
          
          // Only update _id, requisitionNumber, status and approver info, keep existing formData (especially items)
          if (savedData) {
            setFormData(prev => ({
              ...prev,
              _id: savedData._id || prev._id,
              requisitionNumber: savedData.prNumber || prev.requisitionNumber,  // Map from prNumber
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
              ? `Requisition ${statusMessage} successfully!` 
              : `Requisition ${statusMessage} successfully!${savedData?.prNumber ? ' Requisition Number: ' + savedData.prNumber : ''}` 
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
        
        // Reload requisitions list
        loadRequisitions();
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
    await saveRequisition('Draft');
  };

  // Wrapper function for Submit button (Submitted status)
  const handleSubmitForApproval = async () => {
    await saveRequisition('ApprovalRequest');
  };

  // Keep handleSubmit for form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    await saveRequisition('Draft');
  };

  // Handle Approve/Reject actions
  const handleUpdateApprovalStatus = async (status) => {
    // Validate comments - required for both Approve and Reject
    if (!approverDetails.approverComments || !approverDetails.approverComments.trim()) {
      setAlertMessage({ show: true, type: 'danger', message: 'Comments are required!' });
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/Requisition/UpdateApprovalStatus`, {
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
          message: `Requisition ${status === 'Approved' ? 'approved' : 'rejected'} successfully!` 
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

        // Reload requisitions list
        loadRequisitions();
      } else {
        const errorData = await response.text();
        setAlertMessage({ show: true, type: 'danger', message: `Failed to update status: ${errorData}` });
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      setAlertMessage({ show: true, type: 'danger', message: 'Error updating approval status: ' + error.message });
    }
  };

  // Handle Convert to Draft for Rejected Requisitions
  const handleConvertToDraft = async (_id) => {
    if (!window.confirm('Are you sure you want to convert this Requisition to Draft status?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/Requisition/UpdateStatusToDraft`, {
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
          message: 'Requisition status updated to Draft successfully!' 
        });

        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);

        // Reload requisitions list
        loadRequisitions();
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
      requisitionNumber: '',
      requisitionDate: '',
      purchaseType: 'project',
      itemType: 'Material',
      projectId: '',
      projectName: '',
      deliveryDate: '',
      remarks: '',
      status: 'Draft',
      items: []
    });
    setMaterialRequirements([]);
    setEditMode(false);
  };

  const handleNewRequisition = async () => {
    handleReset();
    setIsViewMode(false);
    
    // Fetch Terms & Condition from API
    try {
      const response = await fetch(`${apiBaseUrl}/api/TermsAndCondition?type=Requisition`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prevData => ({
          ...prevData,
          TermsCondition: data[0]?.TermsCondition || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching terms and condition:', error);
    }
    
    setViewMode('form');
  };

  const handleViewRequisition = async (po) => {
    if (!permissions.view) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to view requisitions' });
      return;
    }
    
   
    
    // If PO has a project, fetch material/component requirements first
    if (po.projectId) {
      await fetchMaterialRequirements(po.projectId);
    }
    
    // Transform items: if itemCode is an ObjectId, convert to material name
    const transformedPO = {
      ...po,
      itemType: po.itemType || 'Material',
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
    setEditMode(false);
    setIsViewMode(true);
    
    
    
    
    
    setViewMode('form');
  };

  const handleEditRequisition = async (po) => {
    if (!permissions.edit) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to edit requisitions' });
      return;
    }
    
    // If PO has a project, fetch material/component requirements first
    if (po.projectId) {
      await fetchMaterialRequirements(po.projectId);
    }
   
    // Transform items: if itemCode is an ObjectId, convert to material name
    const transformedPO = {
      ...po,
      itemType: po.itemType || 'Material',
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
    setEditMode(true);
    // Set view mode to true for ApprovalRequest status (read-only except approver section)
    setIsViewMode(po.status === 'ApprovalRequest');
    
    console.log('transformedPO.itemType:', transformedPO.itemType);
    
    setViewMode('form');
  };

  const handleDelete = async (_id) => {
    if (!permissions.delete) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to delete requisitions' });
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this Requisition?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/Requisition/${_id}?companyId=${companyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertMessage({ show: true, type: 'success', message: 'Requisition deleted successfully!' });
        
        // Auto-hide success alert after 3 seconds
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        
        loadRequisitions();
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
        // List View - Display all requisitions
        <Card>
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">
                <i className="bi bi-file-earmark-text me-2"></i>
                Material Requisitions
              </h4>
              <p className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                View and manage all material requisitions
              </p>
            </div>
            {permissions.edit && (
              <Button variant="light" onClick={handleNewRequisition}>
                <i className="bi bi-plus-circle me-2"></i>New Requisition
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
                    placeholder="Search by Requisition Number or Project Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* Requisitions Table */}
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
                        <th style={{ width: '15%' }}>Requisition Number</th>
                        <th style={{ width: '10%' }}>Requisition Date</th>
                        <th style={{ width: '12%' }}>Requisition Type</th>
                        <th style={{ width: '15%' }}>Project Name</th>
                        <th style={{ width: '10%' }}>Required By Date</th>
                        <th style={{ width: '10%' }}>Item Type</th>
                        <th style={{ width: '8%' }}>Status</th>
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
                          <td colSpan="10" className="text-center text-muted py-4">
                            {searchTerm ? 'No requisitions found matching your search.' : 'No requisitions available. Click "New Requisition" to create one.'}
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
                            onClick={() => handleViewRequisition(po)}
                            style={{ fontSize: '0.690rem' }}
                          >
                            {po.requisitionNumber}
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.690rem' }}>{po.requisitionNumber}</span>
                        )}
                      </td>
                      <td>{po.requisitionDate ? new Date(po.requisitionDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{po.purchaseType === 'project' ? 'Project' : 'General'}</td>
                      <td>{po.projectName || '-'}</td>
                      <td>{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-GB') : ''}</td>
                      <td>{po.itemType || 'Material'}</td>
                      <td>{getStatusBadge(po.status)}</td>
                      <td>{po.createdByUserName || '-'}</td>
                      <td>{po.modifiedByUserName || '-'}</td>
                      {(permissions.edit || permissions.delete) && (
                        <td>
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
                                      className="me-2"
                                      onClick={() => handleEditRequisition(po)}
                                      title="Edit"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </Button>
                                  )}
                                  {permissions.edit && po.status === 'Rejected' && (
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
                                  {permissions.delete && (
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => handleDelete(po._id)}
                                      title="Delete"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </Button>
                                  )}
                                </>
                              )}
                              
                              {/* ApprovalRequest: Show only Edit button if user is the approver AND has edit permission */}
                              {permissions.edit && po.status === 'ApprovalRequest' && po.approverUserId === userId && (
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  className="me-2"
                                  onClick={() => handleEditRequisition(po)}
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
        // Form View - Create/Edit requisition
        <Card>
          <Card.Header className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  {isViewMode 
                    ? `Material Requisition - ${formData.status || 'Draft'}` 
                    : editMode 
                      ? 'Edit Material Requisition' 
                      : 'New Material Requisition'
                  }
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
              <h5 className="border-bottom pb-2 mb-3">Requisition Details</h5>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Requisition Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="requisitionNumber"
                      value={formData.requisitionNumber}
                      placeholder="Auto-generated"
                      readOnly
                      style={{ backgroundColor: '#e9ecef' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Requisition Date <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      name="requisitionDate"
                      value={formData.requisitionDate}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Required By Date <span className="text-danger">*</span></Form.Label>
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

            {/* Project Information */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Project Information</h5>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Requisition Type (Project / General) <span className="text-danger">*</span></Form.Label>
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
                {formData.purchaseType === 'project' && (
                  <Col md={6}>
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
              </Row>
            </div>

            {/* Items Section */}
            <div className="mb-4" style={{ position: 'relative' }}>
              <h5 className="border-bottom pb-2 mb-3">Material Details</h5>
              
              {/* Loading Overlay */}
              {loadingMaterials && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}>
                  <div className="text-center">
                    <Spinner animation="border" role="status" variant="primary">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <div className="mt-2" style={{ color: '#0d6efd', fontWeight: 500 }}>
                      Loading materials...
                    </div>
                  </div>
                </div>
              )}
              
              <HotTable
                key={`${formData.projectId}-${formData.itemType}`}
                ref={hotTableRef}
                data={[
                  ...((formData.items && formData.items.length > 0) ? formData.items : [
                    {
                      itemCode: '',
                      description: '',
                      unit: '',
                      boqQty: 0,
                      requisitionQty: 0,
                      rate: '',
                      amount: ''
                    },
                    {
                      itemCode: '',
                      description: '',
                      unit: '',
                      boqQty: 0,
                      requisitionQty: 0,
                      rate: '',
                      amount: ''
                    },
                    {
                      itemCode: '',
                      description: '',
                      unit: '',
                      boqQty: 0,
                      requisitionQty: 0,
                      rate: '',
                      amount: ''
                    }
                  ])
                ]}
                colHeaders={isViewMode 
                  ? [
                      formData.itemType === 'Service' ? 'Work Scope' : 'Material', 
                      'Description', 
                      'Unit', 
                      ...(formData.purchaseType === 'project' ? ['BOQ Qty'] : []), 
                      'Requested Qty', 
                      `Rate (${currency})`, 
                      `Amount (${currency})`
                    ]
                  : [
                      formData.itemType === 'Service' ? 'Work Scope' : 'Material', 
                      'Description', 
                      'Unit', 
                      ...(formData.purchaseType === 'project' ? ['BOQ Qty'] : []), 
                      'Requested Qty', 
                      `Rate (${currency})`, 
                      `Amount (${currency})`, 
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
                    width: 200
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
                    width: 80
                  },
                  ...(formData.purchaseType === 'project' ? [{
                    data: 'boqQty',
                    type: 'numeric',
                    numericFormat: {
                      pattern: '0,0.00'
                    },
                    width: 100,
                    readOnly: true,
                    className: 'htCenter htMiddle bg-light'
                  }] : []),
                  {
                    data: 'requisitionQty',
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
                      td.style.verticalAlign = 'middle';
                      
                      // Add row button
                      const addBtn = document.createElement('button');
                      addBtn.className = 'btn btn-success btn-sm me-1';
                      addBtn.innerHTML = '<i class="bi bi-plus"></i>';
                      addBtn.onclick = () => {
                        // Get current data from the grid
                        const currentData = instance.getSourceData();
                        const newItems = currentData.map(item => ({
                          itemCode: item.itemCode || '',
                          description: item.description || '',
                          unit: item.unit || '',
                          boqQty: item.boqQty || 0,
                          requisitionQty: item.requisitionQty || 0,
                          rate: item.rate || '',
                          amount: item.amount || '',
                          itemId: item.itemId || ''
                        }));
                        
                        // Insert new blank row after current row
                        newItems.splice(row + 1, 0, {
                          itemCode: '',
                          description: '',
                          unit: '',
                          boqQty: 0,
                          requisitionQty: 0,
                          rate: '',
                          amount: ''
                        });
                        setFormData(prev => ({ ...prev, items: newItems }));
                      };
                      td.appendChild(addBtn);
                      
                      // Delete row button - only show if there are actual items
                      if (formData.items.length > 0) {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'btn btn-danger btn-sm';
                        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
                        deleteBtn.onclick = () => {
                          // Get current data from the grid
                          const currentData = instance.getSourceData();
                          const newItems = currentData.filter((item, index) => 
                            index !== row
                          ).map(item => ({
                            itemCode: item.itemCode || '',
                            description: item.description || '',
                            unit: item.unit || '',
                            boqQty: item.boqQty || 0,
                            requisitionQty: item.requisitionQty || 0,
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
                afterChange={(changes, source) => {
                  if (!changes || source === 'loadData') return;

                  changes.forEach(([row, prop, oldValue, newValue]) => {
                    const currentItems = formData.items.length > 0 ? formData.items : [
                      {
                        itemCode: '',
                        description: '',
                        unit: '',
                        boqQty: 0,
                        requisitionQty: 0,
                        rate: '',
                        amount: ''
                      },
                      {
                        itemCode: '',
                        description: '',
                        unit: '',
                        boqQty: 0,
                        requisitionQty: 0,
                        rate: '',
                        amount: ''
                      },
                      {
                        itemCode: '',
                        description: '',
                        unit: '',
                        boqQty: 0,
                        requisitionQty: 0,
                        rate: '',
                        amount: ''
                      }
                    ];
                    
                    const newItems = [...currentItems];
                    
                    if (!newItems[row]) {
                      newItems[row] = {
                        itemCode: '',
                        description: '',
                        unit: '',
                        boqQty: 0,
                        requisitionQty: 0,
                        rate: '',
                        amount: ''
                      };
                    }

                    if (prop === 'itemCode') {
                      if (!newValue || newValue === '') {
                        newItems[row] = {
                          itemCode: '',
                          description: '',
                          unit: '',
                          boqQty: 0,
                          requisitionQty: 0,
                          rate: '',
                          amount: ''
                        };
                      } else if (formData.itemType === 'Service') {
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
                            requisitionQty: selectedComponent.totalVolume || 0,
                            rate: newItems[row].rate || 0,
                            amount: (selectedComponent.totalVolume || 0) * (newItems[row].rate || 0)
                          };
                        }
                      } else {
                        if (formData.purchaseType === 'project') {
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
                              requisitionQty: 0,
                              amount: 0
                            };
                          }
                        } else {
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
                              requisitionQty: 0,
                              amount: 0
                            };
                          }
                        }
                      }
                    }

                    if (prop !== 'itemCode' && prop !== 'requisitionQty' && prop !== 'rate') {
                      newItems[row][prop] = newValue;
                    }

                    if (prop === 'requisitionQty' || prop === 'rate') {
                      newItems[row][prop] = newValue;
                      const qty = parseFloat(newItems[row].requisitionQty) || 0;
                      const rate = parseFloat(newItems[row].rate) || 0;
                      newItems[row].amount = qty * rate;
                    }

                    setFormData(prev => ({ ...prev, items: newItems }));
                  });
                }}
              />
              <div className="mt-2 d-flex justify-content-end">
                <strong className="me-3">Total Amount:</strong>
                <span className="text-primary">
                  {currency} {((formData.items || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Remarks - Collapsible */}
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
                  Remarks / Special Instructions
                </span>
              </div>
              {showAdditionalInfo && (
                <Card.Body>
                  <Form.Group className="mb-3">
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
            Material Requisition PDF - {formData.requisitionNumber}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '80vh', padding: 0 }}>
          <PDFViewer width="100%" height="100%">
            <RequisitionPDF poData={formData} currency={currency} />
          </PDFViewer>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Requisition;
