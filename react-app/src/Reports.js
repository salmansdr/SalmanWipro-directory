import React, { useState, useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { Container, Row, Col, Card, Form, Tabs, Tab, Button, Modal } from 'react-bootstrap';
import 'handsontable/dist/handsontable.full.css';
import * as XLSX from 'xlsx-js-style';
import { registerAllModules } from 'handsontable/registry';
import { PDFDownloadLink, PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Register all Handsontable modules including export
registerAllModules();

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #4472C4',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 9,
    color: '#4a5568',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
    padding: 8,
  },
  projectInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: '30%',
    fontWeight: 'bold',
    color: '#2d3748',
  },
  infoValue: {
    width: '70%',
    color: '#4a5568',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4472C4',
    color: '#ffffff',
    fontWeight: 'bold',
    padding: 8,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    padding: 6,
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    borderBottom: '1 solid #e2e8f0',
    padding: 6,
    fontSize: 9,
  },
  tableRowTotal: {
    flexDirection: 'row',
    backgroundColor: '#dee2e6',
    fontWeight: 'bold',
    padding: 8,
    fontSize: 9,
    borderTop: '2 solid #4a5568',
  },
  floorGroupHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    padding: 6,
    fontSize: 9,
    borderTop: '1 solid #cbd5e0',
  },
  floorSubtotal: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    fontWeight: 'bold',
    padding: 6,
    fontSize: 9,
  },
  col1: { width: '25%', paddingRight: 5 },
  col2: { width: '15%', textAlign: 'right', paddingRight: 5 },
  col3: { width: '15%', textAlign: 'right', paddingRight: 5 },
  col4: { width: '15%', textAlign: 'right', paddingRight: 5 },
  col5: { width: '15%', textAlign: 'right', paddingRight: 5 },
  col6: { width: '15%', textAlign: 'right' },
  // Floor-wise columns (9 columns)
  colF1: { width: '15%', paddingRight: 3 },
  colF2: { width: '12%', paddingRight: 3 },
  colF3: { width: '8%', textAlign: 'right', paddingRight: 3 },
  colF4: { width: '7%', textAlign: 'center', paddingRight: 3 },
  colF5: { width: '12%', textAlign: 'right', paddingRight: 3 },
  colF6: { width: '12%', textAlign: 'right', paddingRight: 3 },
  colF7: { width: '12%', textAlign: 'right', paddingRight: 3 },
  colF8: { width: '11%', textAlign: 'right', paddingRight: 3 },
  colF9: { width: '11%', textAlign: 'right' },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#718096',
  },
});

// PDF Document Component
const CostReportPDF = ({ reportData, categoryWiseData, floorWiseData }) => {
  // Comprehensive validation
  if (!reportData || !categoryWiseData || !Array.isArray(categoryWiseData) || categoryWiseData.length === 0 || 
      !floorWiseData || !Array.isArray(floorWiseData) || floorWiseData.length === 0) {
    return (
      <Document>
        <Page size="A4" style={pdfStyles.page}>
          <View style={{ padding: 50, textAlign: 'center' }}>
            <Text style={{ fontSize: 16, color: '#e53e3e', marginBottom: 10 }}>No Data Available</Text>
            <Text style={{ fontSize: 12, color: '#718096' }}>Please ensure the report has cost data before generating PDF.</Text>
          </View>
        </Page>
      </Document>
    );
  }

  // Filter out invalid rows that might cause rendering issues
  const validCategoryData = categoryWiseData.filter(row => 
    row && (row.category || row.isGrandTotal) && 
    typeof row.materialCost === 'number' && 
    typeof row.labourCost === 'number' && 
    typeof row.totalCost === 'number'
  );

  const validFloorData = floorWiseData.filter(row => 
    row && (row.componentName || row.isGroupHeader || row.isSubtotal || row.isGrandTotal) &&
    typeof row.materialCost === 'number' && 
    typeof row.labourCost === 'number' && 
    typeof row.totalCost === 'number'
  );

  // If after filtering we have no valid data, show error
  if (validCategoryData.length === 0 || validFloorData.length === 0) {
    return (
      <Document>
        <Page size="A4" style={pdfStyles.page}>
          <View style={{ padding: 50, textAlign: 'center' }}>
            <Text style={{ fontSize: 16, color: '#e53e3e', marginBottom: 10 }}>Invalid Data</Text>
            <Text style={{ fontSize: 12, color: '#718096' }}>The report data contains invalid entries that cannot be rendered.</Text>
          </View>
        </Page>
      </Document>
    );
  }

  let formattedAddress = 'N/A';
  try {
    const addr = JSON.parse(reportData?.companyDetails?.address || '{}');
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city || addr.zipCode) parts.push(`${addr.city}${addr.city && addr.zipCode ? ', ' : ''}${addr.zipCode}`);
    if (addr.country) parts.push(addr.country);
    formattedAddress = parts.join(' | ') || 'N/A';
  } catch {
    formattedAddress = reportData?.companyDetails?.address || 'N/A';
  }

  return (
    <Document>
      {/* Page 1: Project Information & Summary */}
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.companyName}>{reportData?.companyDetails?.companyName || 'N/A'}</Text>
          <Text style={pdfStyles.companyAddress}>{formattedAddress}</Text>
        </View>

        <View style={pdfStyles.projectInfo}>
          <Text style={pdfStyles.sectionTitle}>Project Information</Text>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Project Name:</Text>
            <Text style={pdfStyles.infoValue}>{reportData?.projectDetails?.projectName || 'N/A'}</Text>
          </View>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Project Address:</Text>
            <Text style={pdfStyles.infoValue}>{reportData?.projectDetails?.location || 'N/A'}</Text>
          </View>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Project Type:</Text>
            <Text style={pdfStyles.infoValue}>{reportData?.projectDetails?.projectType || 'N/A'}</Text>
          </View>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Construction Area:</Text>
            <Text style={pdfStyles.infoValue}>{reportData?.projectDetails?.constructionArea || 'N/A'} sq ft</Text>
          </View>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Currency:</Text>
            <Text style={pdfStyles.infoValue}>{reportData?.companyDetails?.currency || 'N/A'}</Text>
          </View>
        </View>

        <Text style={pdfStyles.sectionTitle}>Project Summary (Category-wise)</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.col1}>Name of Item</Text>
            <Text style={pdfStyles.col2}>Material Cost</Text>
            <Text style={pdfStyles.col3}>Labour Cost</Text>
            <Text style={pdfStyles.col4}>Total Cost</Text>
            <Text style={pdfStyles.col5}>Cost/Sqft</Text>
            <Text style={pdfStyles.col6}>Percentile</Text>
          </View>
          {validCategoryData.map((row, index) => {
            if (row.isGrandTotal) {
              return (
                <View key={index} style={pdfStyles.tableRowTotal}>
                  <Text style={pdfStyles.col1}>Grand Total</Text>
                  <Text style={pdfStyles.col2}>{row.materialCost?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.col3}>{row.labourCost?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.col4}>{row.totalCost?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.col5}>{row.costPerSft?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.col6}>{row.percentileCost?.toFixed(2) || '0.00'}%</Text>
                </View>
              );
            }
            return (
              <View key={index} style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
                <Text style={pdfStyles.col1}>{row.category}</Text>
                <Text style={pdfStyles.col2}>{row.materialCost?.toFixed(2) || '0.00'}</Text>
                <Text style={pdfStyles.col3}>{row.labourCost?.toFixed(2) || '0.00'}</Text>
                <Text style={pdfStyles.col4}>{row.totalCost?.toFixed(2) || '0.00'}</Text>
                <Text style={pdfStyles.col5}>{row.costPerSft?.toFixed(2) || '0.00'}</Text>
                <Text style={pdfStyles.col6}>{row.percentileCost?.toFixed(2) || '0.00'}%</Text>
              </View>
            );
          })}
        </View>

        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>

      {/* Page 2: Floor-wise Details */}
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.companyName}>{reportData?.companyDetails?.companyName || 'N/A'}</Text>
          <Text style={pdfStyles.companyAddress}>Floor-wise Cost Details</Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.colF1}>Component Name</Text>
            <Text style={pdfStyles.colF2}>Category</Text>
            <Text style={pdfStyles.colF3}>Quantity</Text>
            <Text style={pdfStyles.colF4}>Unit</Text>
            <Text style={pdfStyles.colF5}>Material Cost</Text>
            <Text style={pdfStyles.colF6}>Labour Cost</Text>
            <Text style={pdfStyles.colF7}>Total Cost</Text>
            <Text style={pdfStyles.colF8}>Cost/Sqft</Text>
            <Text style={pdfStyles.colF9}>Percentile</Text>
          </View>
          {validFloorData.map((row, index) => {
            if (row.isGroupHeader) {
              return (
                <View key={index} style={pdfStyles.floorGroupHeader}>
                  <Text style={{ width: '100%' }}>{row.floorName}</Text>
                </View>
              );
            }
            if (row.isSubtotal) {
              return (
                <View key={index} style={pdfStyles.floorSubtotal}>
                  <Text style={pdfStyles.colF1}>Subtotal</Text>
                  <Text style={pdfStyles.colF2}></Text>
                  <Text style={pdfStyles.colF3}></Text>
                  <Text style={pdfStyles.colF4}></Text>
                  <Text style={pdfStyles.colF5}>{row.materialCost?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.colF6}>{row.labourCost?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.colF7}>{row.totalCost?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.colF8}>{row.costPerSft?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.colF9}>{row.percentileCost?.toFixed(2) || '0.00'}%</Text>
                </View>
              );
            }
            if (row.isGrandTotal) {
              return (
                <View key={index} style={pdfStyles.tableRowTotal}>
                  <Text style={pdfStyles.colF1}>Grand Total</Text>
                  <Text style={pdfStyles.colF2}></Text>
                  <Text style={pdfStyles.colF3}></Text>
                  <Text style={pdfStyles.colF4}></Text>
                  <Text style={pdfStyles.colF5}>{row.materialCost?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.colF6}>{row.labourCost?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.colF7}>{row.totalCost?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.colF8}>{row.costPerSft?.toFixed(2) || '0.00'}</Text>
                  <Text style={pdfStyles.colF9}>{row.percentileCost?.toFixed(2) || '0.00'}%</Text>
                </View>
              );
            }
            return (
              <View key={index} style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
                <Text style={pdfStyles.colF1}>{row.componentName}</Text>
                <Text style={pdfStyles.colF2}>{row.category}</Text>
                <Text style={pdfStyles.colF3}>{row.totalQuantity?.toFixed(2) || '0.00'}</Text>
                <Text style={pdfStyles.colF4}>{row.unit || ''}</Text>
                <Text style={pdfStyles.colF5}>{row.materialCost?.toFixed(2) || '0.00'}</Text>
                <Text style={pdfStyles.colF6}>{row.labourCost?.toFixed(2) || '0.00'}</Text>
                <Text style={pdfStyles.colF7}>{row.totalCost?.toFixed(2) || '0.00'}</Text>
                <Text style={pdfStyles.colF8}>{row.costPerSft?.toFixed(2) || '0.00'}</Text>
                <Text style={pdfStyles.colF9}>{row.percentileCost?.toFixed(2) || '0.00'}%</Text>
              </View>
            );
          })}
        </View>

        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};

function Reports() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEstimationId, setSelectedEstimationId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [floorWiseData, setFloorWiseData] = useState([]);
  const [categoryWiseData, setCategoryWiseData] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
  
  // Refs for Handsontable instances
  const summaryTableRef = useRef(null);
  const floorWiseTableRef = useRef(null);

  // Check if data is ready for PDF export
  useEffect(() => {
    const ready = reportData && 
                  categoryWiseData && Array.isArray(categoryWiseData) && categoryWiseData.length > 0 &&
                  floorWiseData && Array.isArray(floorWiseData) && floorWiseData.length > 0 &&
                  categoryWiseData.some(row => row && typeof row.materialCost === 'number') &&
                  floorWiseData.some(row => row && typeof row.materialCost === 'number');
    setIsDataReady(ready);
    console.log('Data ready status:', ready, {
      hasReportData: !!reportData,
      categoryCount: categoryWiseData?.length || 0,
      floorCount: floorWiseData?.length || 0
    });
  }, [reportData, categoryWiseData, floorWiseData]);

  // Process floor-wise data to add group headers, subtotals, and grand total
  useEffect(() => {
    if (reportData && reportData.floorWiseCosts) {
      const processedData = [];
      let currentFloor = null;
      let floorSubtotal = {
        materialCost: 0,
        labourCost: 0,
        totalCost: 0,
        costPerSft: 0,
        percentileCost: 0
      };
      let grandTotal = {
        materialCost: 0,
        labourCost: 0,
        totalCost: 0,
        costPerSft: 0,
        percentileCost: 0
      };

      reportData.floorWiseCosts.forEach((item, index) => {
        // Add subtotal row when floor changes (except for the first floor)
        if (currentFloor !== null && currentFloor !== item.floorName) {
          processedData.push({
            isSubtotal: true,
            floorName: currentFloor,
            componentName: 'Subtotal',
            category: '',
            materialCost: floorSubtotal.materialCost,
            labourCost: floorSubtotal.labourCost,
            totalCost: floorSubtotal.totalCost,
            costPerSft: floorSubtotal.costPerSft,
            percentileCost: floorSubtotal.percentileCost
          });
          // Reset subtotal for new floor
          floorSubtotal = {
            materialCost: 0,
            labourCost: 0,
            totalCost: 0,
            costPerSft: 0,
            percentileCost: 0
          };
        }

        // Add floor header row when floor changes
        if (currentFloor !== item.floorName) {
          currentFloor = item.floorName;
          processedData.push({
            isGroupHeader: true,
            floorName: item.floorName,
            componentName: '',
            category: '',
            materialCost: null,
            labourCost: null,
            totalCost: null,
            costPerSft: null,
            percentileCost: null
          });
        }

        // Add the actual data row
        processedData.push({
          ...item,
          isGroupHeader: false,
          isSubtotal: false,
          isGrandTotal: false
        });

        // Accumulate subtotal and grand total
        floorSubtotal.materialCost += item.materialCost || 0;
        floorSubtotal.labourCost += item.labourCost || 0;
        floorSubtotal.totalCost += item.totalCost || 0;
        floorSubtotal.costPerSft += item.costPerSft || 0;
        floorSubtotal.percentileCost += item.percentileCost || 0;

        grandTotal.materialCost += item.materialCost || 0;
        grandTotal.labourCost += item.labourCost || 0;
        grandTotal.totalCost += item.totalCost || 0;
        grandTotal.costPerSft += item.costPerSft || 0;
        grandTotal.percentileCost += item.percentileCost || 0;
      });

      // Add the last floor's subtotal
      if (currentFloor !== null) {
        processedData.push({
          isSubtotal: true,
          floorName: currentFloor,
          componentName: 'Subtotal',
          category: '',
          materialCost: floorSubtotal.materialCost,
          labourCost: floorSubtotal.labourCost,
          totalCost: floorSubtotal.totalCost,
          costPerSft: floorSubtotal.costPerSft,
          percentileCost: floorSubtotal.percentileCost
        });
      }

      // Add grand total row at the end
      if (reportData.floorWiseCosts.length > 0) {
        processedData.push({
          isGrandTotal: true,
          floorName: '',
          componentName: 'Grand Total',
          category: '',
          materialCost: grandTotal.materialCost,
          labourCost: grandTotal.labourCost,
          totalCost: grandTotal.totalCost,
          costPerSft: grandTotal.costPerSft,
          percentileCost: grandTotal.percentileCost
        });
      }

      setFloorWiseData(processedData);
    } else {
      setFloorWiseData([]);
    }
  }, [reportData]);

  // Process category-wise data to add grand total
  useEffect(() => {
    if (reportData && reportData.categoryWiseCosts) {
      const processedData = [...reportData.categoryWiseCosts];
      
      // Calculate grand total
      const grandTotal = {
        category: 'Grand Total',
        materialCost: 0,
        labourCost: 0,
        totalCost: 0,
        costPerSft: 0,
        percentileCost: 0,
        isGrandTotal: true
      };

      reportData.categoryWiseCosts.forEach(item => {
        grandTotal.materialCost += item.materialCost || 0;
        grandTotal.labourCost += item.labourCost || 0;
        grandTotal.totalCost += item.totalCost || 0;
        grandTotal.costPerSft += item.costPerSft || 0;
        grandTotal.percentileCost += item.percentileCost || 0;
      });

      processedData.push(grandTotal);
      setCategoryWiseData(processedData);
    } else {
      setCategoryWiseData([]);
    }
  }, [reportData]);

  // Fetch all estimations grouped by project
  useEffect(() => {
    const fetchEstimations = async () => {
      try {
        const companyId = localStorage.getItem('selectedCompanyId');
        const endpoint = companyId 
          ? `${apiUrl}/api/ProjectEstimation?companyId=${companyId}`
          : `${apiUrl}/api/ProjectEstimation`;
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          const estimationsList = Array.isArray(data) ? data : [data];
          
          // Extract unique projects from estimations
          const projectMap = new Map();
          
          estimationsList.forEach(est => {
            if (est.projectId && !projectMap.has(est.projectId)) {
              projectMap.set(est.projectId, {
                _id: est.projectId,
                name: est.projectName || 'Unnamed Project',
                estimations: []
              });
            }
            if (est.projectId) {
              const project = projectMap.get(est.projectId);
              project.estimations.push({
                _id: est._id,
                estimationRef: est.estimationRef,
                description: est.description
              });
            }
          });
          
          setProjects(Array.from(projectMap.values()));
        }
      } catch (error) {
        console.error('Error fetching estimations:', error);
      }
    };
    
    fetchEstimations();
  }, [apiUrl]);

  // Get filtered estimations for selected project
  const filteredEstimations = selectedProjectId
    ? projects.find(p => p._id === selectedProjectId)?.estimations || []
    : [];

  // Fetch report data when estimation is selected
  useEffect(() => {
    const fetchReportData = async () => {
      if (selectedEstimationId) {
        // Reset processed data immediately when estimation changes to prevent stale data
        setCategoryWiseData([]);
        setFloorWiseData([]);
        setIsDataReady(false);
        
        try {
          const response = await fetch(`${apiUrl}/api/ProjectEstimation/report/${selectedEstimationId}`);
          if (response.ok) {
            const data = await response.json();
            setReportData(data);
            // Extract currency symbol from company details
            if (data.companyDetails?.currency) {
              setCurrencySymbol(data.companyDetails.currency);
            }
          } else {
            console.error('Failed to fetch report data');
            setReportData(null);
            setCategoryWiseData([]);
            setFloorWiseData([]);
          }
        } catch (error) {
          console.error('Error fetching report data:', error);
          setReportData(null);
          setCategoryWiseData([]);
          setFloorWiseData([]);
        }
      } else {
        setReportData(null);
        setCategoryWiseData([]);
        setFloorWiseData([]);
      }
    };
    
    fetchReportData();
  }, [selectedEstimationId, apiUrl]);

  // Export all tabs to a single Excel file with 3 sheets
  const exportAllToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Format address from JSON string to readable format
    let formattedAddress = 'N/A';
    try {
      const addr = JSON.parse(reportData?.companyDetails?.address || '{}');
      const parts = [];
      if (addr.street) parts.push(addr.street);
      if (addr.city || addr.zipCode) parts.push(`${addr.city}${addr.city && addr.zipCode ? ', ' : ''}${addr.zipCode}`);
      if (addr.country) parts.push(addr.country);
      formattedAddress = parts.join(' | ') || 'N/A';
    } catch {
      formattedAddress = reportData?.companyDetails?.address || 'N/A';
    }
    
    // ===== SHEET 1: Project Information =====
    const projectInfoData = [
      // Company Name Header - centered across all columns
      [reportData?.companyDetails?.companyName || 'N/A', '', '', '', '', ''],
      // Address - centered across all columns
      [formattedAddress, '', '', '', '', ''],
      // Empty row
      ['', '', '', '', '', ''],
      // Project Info Row 1
      ['Project Name', reportData?.projectDetails?.projectName || 'N/A', '', '', '', ''],
      // Project Info Row 2
      ['Project Address', reportData?.projectDetails?.location || 'N/A', '', '', '', ''],
      // Project Info Row 3
      ['Project Type', reportData?.projectDetails?.projectType || 'N/A', '', '', '', ''],
      // Project Info Row 4
      ['Construction Area', `${reportData?.projectDetails?.constructionArea || 'N/A'} sq ft`, '', '', '', ''],
      // Project Info Row 5
      ['Currency', reportData?.companyDetails?.currency || 'N/A', '', '', '', '']
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(projectInfoData);
    
    // Style for Project Information sheet
    ws1['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    
    // Merge cells
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Company name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Address
      { s: { r: 3, c: 1 }, e: { r: 3, c: 5 } }, // Project Name value
      { s: { r: 4, c: 1 }, e: { r: 4, c: 5 } }, // Project Address value
      { s: { r: 5, c: 1 }, e: { r: 5, c: 5 } }, // Project Type value
      { s: { r: 6, c: 1 }, e: { r: 6, c: 5 } }, // Construction Area value
      { s: { r: 7, c: 1 }, e: { r: 7, c: 5 } }  // Currency value
    ];
    
    // Company Name styling (Row 1)
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'].forEach(cell => {
      if (!ws1[cell]) ws1[cell] = {};
      ws1[cell].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    });
    
    // Address styling (Row 2)
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'].forEach(cell => {
      if (!ws1[cell]) ws1[cell] = {};
      ws1[cell].s = {
        font: { sz: 11 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    });
    
    // Project info labels styling (Column A, Rows 4-8)
    ['A4', 'A5', 'A6', 'A7', 'A8'].forEach(cell => {
      if (!ws1[cell]) ws1[cell] = {};
      ws1[cell].s = {
        font: { bold: true },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    });
    
    // Project info values styling (Rows 4-8, Columns B-F)
    ['B4', 'C4', 'D4', 'E4', 'F4', 'B5', 'C5', 'D5', 'E5', 'F5', 'B6', 'C6', 'D6', 'E6', 'F6', 'B7', 'C7', 'D7', 'E7', 'F7', 'B8', 'C8', 'D8', 'E8', 'F8'].forEach(cell => {
      if (!ws1[cell]) ws1[cell] = {};
      ws1[cell].s = {
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    });
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Project Information');
    
    // ===== SHEET 2: Project Summary =====
    // Create header section with company and project info
    const categorySummaryData = [
      // Company Name Header - centered across all columns
      [reportData?.companyDetails?.companyName || 'N/A', '', '', '', '', ''],
      // Address - centered across all columns
      [formattedAddress, '', '', '', '', ''],
      // Empty row
      ['', '', '', '', '', ''],
      // Project Info Row 1
      ['Project Name', reportData?.projectDetails?.projectName || 'N/A', '', '', '', ''],
      // Project Info Row 2
      ['Project Address', reportData?.projectDetails?.location || 'N/A', '', '', '', ''],
      // Project Info Row 3
      ['Project Type', reportData?.projectDetails?.projectType || 'N/A', '', '', '', ''],
      // Empty row
      ['', '', '', '', '', ''],
      // Section Header
      ['PROJECT SUMMARY', '', '', '', '', ''],
      // Empty row
      ['', '', '', '', '', ''],
      // Table Headers
      ['S.L No', 'Name of Item', `Material Cost (${currencySymbol})`, `Labour Cost (${currencySymbol})`, `Total Cost (${currencySymbol})`, 'Percentile Cost (%)']
    ];
    
    // Add category data rows with serial numbers
    categoryWiseData.forEach((row, index) => {
      if (row.isGrandTotal) {
        categorySummaryData.push(['', 'Grand Total', row.materialCost || 0, row.labourCost || 0, row.totalCost || 0, row.percentileCost || 0]);
      } else {
        categorySummaryData.push([
          String(index + 1).padStart(2, '0'),
          row.category,
          row.materialCost || 0,
          row.labourCost || 0,
          row.totalCost || 0,
          row.percentileCost || 0
        ]);
      }
    });
    
    const ws2 = XLSX.utils.aoa_to_sheet(categorySummaryData);
    
    ws2['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    
    // Merge cells and apply styling
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Company name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Address
      { s: { r: 3, c: 1 }, e: { r: 3, c: 5 } }, // Project Name value
      { s: { r: 4, c: 1 }, e: { r: 4, c: 5 } }, // Project Address value
      { s: { r: 5, c: 1 }, e: { r: 5, c: 5 } }, // Project Type value
      { s: { r: 7, c: 0 }, e: { r: 7, c: 5 } }  // PROJECT SUMMARY header
    ];
    
    // Company Name styling (Row 1)
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'].forEach(cell => {
      if (!ws2[cell]) ws2[cell] = {};
      ws2[cell].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    });
    
    // Address styling (Row 2)
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'].forEach(cell => {
      if (!ws2[cell]) ws2[cell] = {};
      ws2[cell].s = {
        font: { sz: 11 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    });
    
    // Project info labels styling (Rows 4-6, Column A)
    ['A4', 'A5', 'A6'].forEach(cell => {
      if (!ws2[cell]) ws2[cell] = {};
      ws2[cell].s = {
        font: { bold: true },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    });
    
    // Project info values styling (Rows 4-6, Columns B-F)
    ['B4', 'C4', 'D4', 'E4', 'F4', 'B5', 'C5', 'D5', 'E5', 'F5', 'B6', 'C6', 'D6', 'E6', 'F6'].forEach(cell => {
      if (!ws2[cell]) ws2[cell] = {};
      ws2[cell].s = {
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    });
    
    // PROJECT SUMMARY header styling (Row 8)
    ['A8', 'B8', 'C8', 'D8', 'E8', 'F8'].forEach(cell => {
      if (!ws2[cell]) ws2[cell] = {};
      ws2[cell].s = {
        font: { bold: true, sz: 12 },
        fill: { fgColor: { rgb: "D3D3D3" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    });
    
    // Table Header row styling (Row 10)
    const headerStyle = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "D3D3D3" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    
    ['A10', 'B10', 'C10', 'D10', 'E10', 'F10'].forEach(cell => {
      if (!ws2[cell]) ws2[cell] = {};
      ws2[cell].s = headerStyle;
    });
    
    // Data rows styling (starting from row 11)
    categoryWiseData.forEach((row, index) => {
      const rowNum = index + 11; // Row 11 onwards for data
      const isGrandTotal = row.isGrandTotal;
      
      if (isGrandTotal) {
        const grandTotalStyle = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "DEE2E6" } },
          alignment: { horizontal: "right", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
        
        ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
          const cellRef = `${col}${rowNum}`;
          if (!ws2[cellRef]) ws2[cellRef] = {};
          ws2[cellRef].s = {
            ...grandTotalStyle,
            alignment: { horizontal: (col === 'A' || col === 'B') ? 'left' : 'right', vertical: 'center' }
          };
          if (col !== 'A' && col !== 'B' && ws2[cellRef].v != null) {
            ws2[cellRef].z = '#,##0.00';
          }
        });
      } else {
        const regularStyle = {
          alignment: { horizontal: "right", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
        
        ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
          const cellRef = `${col}${rowNum}`;
          if (!ws2[cellRef]) ws2[cellRef] = {};
          ws2[cellRef].s = {
            ...regularStyle,
            alignment: { horizontal: (col === 'A' || col === 'B') ? (col === 'A' ? 'center' : 'left') : 'right', vertical: 'center' }
          };
          if (col !== 'A' && col !== 'B' && ws2[cellRef].v != null) {
            ws2[cellRef].z = '#,##0.00';
          }
        });
      }
    });
    
    XLSX.utils.book_append_sheet(wb, ws2, 'Project Summary');
    
    // ===== SHEET 3: Floor-wise Details =====
    const floorHeaders = ['Category','Component Name',  'Quantity', 'Unit', `Material Cost (${currencySymbol})`, `Labour Cost (${currencySymbol})`, `Total Cost (${currencySymbol})`, `Cost Per Sqft (${currencySymbol})`, 'Percentile Cost (%)'];
    const floorData = [];
    
    floorWiseData.forEach((row, index) => {
      if (row.isGroupHeader) {
        floorData.push([row.floorName, '', '', '', '', '', '', '', '']);
      } else if (row.isSubtotal) {
        floorData.push(['Subtotal', '', '', '', row.materialCost || 0, row.labourCost || 0, row.totalCost || 0, row.costPerSft || 0, row.percentileCost || 0]);
      } else if (row.isGrandTotal) {
        floorData.push(['Grand Total', '', '', '', row.materialCost || 0, row.labourCost || 0, row.totalCost || 0, row.costPerSft || 0, row.percentileCost || 0]);
      } else {
        floorData.push([row.category,row.componentName,  row.totalQuantity || '', row.unit || '', row.materialCost || 0, row.labourCost || 0, row.totalCost || 0, row.costPerSft || 0, row.percentileCost || 0]);
      }
    });
    
    const ws3 = XLSX.utils.aoa_to_sheet([floorHeaders, ...floorData]);
    
    ws3['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    
    // Header row styling
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'].forEach(cell => {
      if (!ws3[cell]) ws3[cell] = {};
      ws3[cell].s = headerStyle;
    });
    
    // Data rows styling
    ws3['!merges'] = [];
    let currentRow = 2;
    
    floorWiseData.forEach((row, index) => {
      const rowNum = currentRow + index;
      
      if (row.isGroupHeader) {
        const groupHeaderStyle = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "F8F9FA" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
        
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
          const cellRef = `${col}${rowNum}`;
          if (!ws3[cellRef]) ws3[cellRef] = { v: '' };
          ws3[cellRef].s = groupHeaderStyle;
        });
        
        ws3['!merges'].push({ s: { r: rowNum - 1, c: 0 }, e: { r: rowNum - 1, c: 8 } });
        
      } else if (row.isSubtotal) {
        const subtotalStyle = {
          font: { bold: true, sz: 10 },
          fill: { fgColor: { rgb: "E9ECEF" } },
          alignment: { horizontal: "right", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
        
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
          const cellRef = `${col}${rowNum}`;
          if (!ws3[cellRef]) ws3[cellRef] = {};
          ws3[cellRef].s = {
            ...subtotalStyle,
            alignment: { horizontal: (col === 'A' || col === 'B' || col === 'C' || col === 'D') ? 'left' : 'right', vertical: 'center' }
          };
          if (col !== 'A' && col !== 'B' && col !== 'C' && col !== 'D' && ws3[cellRef].v != null) {
            ws3[cellRef].z = '#,##0.00';
          }
        });
        
      } else if (row.isGrandTotal) {
        const grandTotalStyle = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "DEE2E6" } },
          alignment: { horizontal: "right", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
        
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
          const cellRef = `${col}${rowNum}`;
          if (!ws3[cellRef]) ws3[cellRef] = {};
          ws3[cellRef].s = {
            ...grandTotalStyle,
            alignment: { horizontal: (col === 'A' || col === 'B' || col === 'C' || col === 'D') ? 'left' : 'right', vertical: 'center' }
          };
          if (col !== 'A' && col !== 'B' && col !== 'C' && col !== 'D' && ws3[cellRef].v != null) {
            ws3[cellRef].z = '#,##0.00';
          }
        });
        
      } else {
        const regularStyle = {
          alignment: { horizontal: "right", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
        
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
          const cellRef = `${col}${rowNum}`;
          if (!ws3[cellRef]) ws3[cellRef] = {};
          ws3[cellRef].s = {
            ...regularStyle,
            alignment: { horizontal: (col === 'A' || col === 'B') ? 'left' : (col === 'C' || col === 'D' ? 'center' : 'right'), vertical: 'center' }
          };
          if (col !== 'A' && col !== 'B' && col !== 'C' && col !== 'D' && ws3[cellRef].v != null) {
            ws3[cellRef].z = '#,##0.00';
          }
        });
      }
    });
    
    XLSX.utils.book_append_sheet(wb, ws3, 'Floor-wise Details');
    
    // Write the file
    XLSX.writeFile(wb, `Cost_Report_${reportData?.projectDetails?.projectName || 'Report'}.xlsx`, { cellStyles: true });
  };

  return (
    <Container className="construction-report py-4">
      <Card className="mb-4 shadow-sm">
         <Card.Header as="h3" className="bg-primary text-white">Building Construction Report
</Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group className="report-dropdown-section" controlId="project-select">
                <Form.Label className="dropdown-label">Select Project:</Form.Label>
                <Form.Select
                  className="modern-dropdown"
                  value={selectedProjectId}
                  onChange={e => {
                    setSelectedProjectId(e.target.value);
                    setSelectedEstimationId(''); // Reset estimation when project changes
                  }}
                >
                  <option value="">-- Select Project --</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="report-dropdown-section" controlId="estimation-select">
                <Form.Label className="dropdown-label">Select Estimation:</Form.Label>
                <Form.Select
                  className="modern-dropdown"
                  value={selectedEstimationId}
                  onChange={e => setSelectedEstimationId(e.target.value)}
                  disabled={!selectedProjectId}
                >
                  <option value="">-- Select Estimation Ref --</option>
                  {filteredEstimations.map(est => (
                    <option key={est._id} value={est._id}>
                      {est.estimationRef} {est.description ? `- ${est.description}` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {reportData && (
            <Card className="mb-4 report-summary-section card-style shadow">
              <Card.Header className="bg-light">
                <h4 className="mb-0 section-heading text-primary">Project Summary</h4>
              </Card.Header>
              <Card.Body>
                {/* Company Details */}
                <div className="mb-3 pb-2 border-bottom">
                                   <Row className="g-2">
                    <Col md={5}>
                      <div>
                        <small className="text-muted d-block">Company Name:</small>
                        <span className="text-dark">{reportData.companyDetails?.companyName || 'N/A'}</span>
                      </div>
                    </Col>
                    <Col md={7}>
                      <div>
                        <small className="text-muted d-block">Address:</small>
                        <span className="text-dark" style={{lineHeight: '1.4'}}>
                          {(() => {
                            try {
                              const addr = JSON.parse(reportData.companyDetails?.address || '{}');
                              const parts = [];
                              if (addr.street) parts.push(addr.street);
                              if (addr.city || addr.zipCode) parts.push(`${addr.city}${addr.city && addr.zipCode ? ', ' : ''}${addr.zipCode}`);
                              if (addr.country) parts.push(addr.country);
                              return parts.join(' | ');
                            } catch {
                              return reportData.companyDetails?.address || 'N/A';
                            }
                          })()}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Project Details */}
                <div>
                  
                  <Row className="g-2">
                    <Col md={3}>
                      <div>
                        <small className="text-muted d-block">Project Name:</small>
                        <span className="text-dark">{reportData.projectDetails?.projectName || 'N/A'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div>
                        <small className="text-muted d-block">Location:</small>
                        <span className="text-dark">{reportData.projectDetails?.location || 'N/A'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div>
                        <small className="text-muted d-block">Project Type:</small>
                        <span className="text-dark">{reportData.projectDetails?.projectType || 'N/A'}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div>
                        <small className="text-muted d-block">Construction Area:</small>
                        <span className="text-dark">{reportData.projectDetails?.constructionArea || 'N/A'}</span>
                        {reportData.projectDetails?.constructionArea && <span className="text-muted ms-1">sq ft</span>}
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>
          )}

          {reportData && (
            <Card className="mb-4 report-phase-table-section card-style">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0 section-heading">Cost Tracking</h4>
                <div className="d-flex gap-2">
                  {isDataReady ? (
                    <>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => setShowPdfModal(true)}
                      >
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        View PDF
                      </Button>
                      <PDFDownloadLink 
                        document={<CostReportPDF reportData={reportData} categoryWiseData={categoryWiseData} floorWiseData={floorWiseData} />} 
                        fileName={`Cost_Report_${reportData?.projectDetails?.projectName || 'Report'}.pdf`}
                        style={{ textDecoration: 'none' }}
                      >
                        {({ loading }) => (
                          <Button 
                            variant="danger" 
                            size="sm"
                            disabled={loading}
                          >
                            <i className="bi bi-download me-2"></i>
                            {loading ? 'Generating...' : 'Download PDF'}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    </>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="sm"
                      disabled
                      title="No data available for PDF export"
                    >
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      View PDF
                    </Button>
                  )}
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={exportAllToExcel}
                    disabled={!reportData}
                  >
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    Export to Excel
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                  <Tab eventKey="summary" title="Summary">
                    <div style={{ overflow: 'auto' }}>
                      <HotTable
                        ref={summaryTableRef}
                        data={categoryWiseData}
                        colHeaders={['Category', `Material Cost (${currencySymbol})`, `Labour Cost (${currencySymbol})`, `Total Cost (${currencySymbol})`, `Cost Per Sqft (${currencySymbol})`, 'Percentile Cost (%)']}
                        columns={[
                          { data: 'category', type: 'text', readOnly: true },
                          { 
                            data: 'materialCost', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0,0.00' },
                            readOnly: true 
                          },
                          { 
                            data: 'labourCost', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0,0.00' },
                            readOnly: true 
                          },
                          { 
                            data: 'totalCost', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0,0.00' },
                            readOnly: true,
                            className: 'htRight fw-bold'
                          },
                          { 
                            data: 'costPerSft', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0,0.00' },
                            readOnly: true 
                          },
                          { 
                            data: 'percentileCost', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0.00' },
                            readOnly: true 
                          }
                        ]}
                        rowHeaders={true}
                        width="100%"
                        height={categoryWiseData.length * 40 + 50}
                        autoRowSize={false}
                        autoColumnSize={true}
                        licenseKey="non-commercial-and-evaluation"
                        stretchH="all"
                        className="htMiddle"
                        cells={(row, col) => {
                          const cellProperties = {};
                          
                          // Style for grand total row
                          if (categoryWiseData[row]?.isGrandTotal) {
                            cellProperties.className = 'htRight htMiddle fw-bold';
                            cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                              td.style.backgroundColor = '#dee2e6';
                              td.style.fontWeight = 'bold';
                              td.style.fontSize = '1.05em';
                              if (col === 0) {
                                td.innerHTML = '<strong>Grand Total</strong>';
                                td.style.textAlign = 'left';
                              } else {
                                // Format numeric values
                                const formattedValue = value != null ? value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
                                td.innerHTML = formattedValue;
                                td.style.textAlign = 'right';
                              }
                              return td;
                            };
                          }
                          
                          return cellProperties;
                        }}
                      />
                    </div>
                  </Tab>
                  <Tab eventKey="floorwise" title="Floor-wise">
                    <div style={{ overflow: 'auto' }}>
                      <HotTable
                        ref={floorWiseTableRef}
                        data={floorWiseData}
                        colHeaders={['Component Name', 'Category', 'Quantity', 'Unit', `Material Cost (${currencySymbol})`, `Labour Cost (${currencySymbol})`, `Total Cost (${currencySymbol})`, `Cost Per Sqft (${currencySymbol})`, 'Percentile Cost (%)']}
                        columns={[
                          { data: 'componentName', type: 'text', readOnly: true },
                          { data: 'category', type: 'text', readOnly: true },
                          { 
                            data: 'totalQuantity', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0,0.00' },
                            readOnly: true 
                          },
                          { data: 'unit', type: 'text', readOnly: true },
                          { 
                            data: 'materialCost', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0,0.00' },
                            readOnly: true 
                          },
                          { 
                            data: 'labourCost', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0,0.00' },
                            readOnly: true 
                          },
                          { 
                            data: 'totalCost', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0,0.00' },
                            readOnly: true,
                            className: 'htRight fw-bold'
                          },
                          { 
                            data: 'costPerSft', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0,0.00' },
                            readOnly: true 
                          },
                          { 
                            data: 'percentileCost', 
                            type: 'numeric', 
                            numericFormat: { pattern: '0.00' },
                            readOnly: true 
                          }
                        ]}
                        rowHeaders={true}
                        width="100%"
                        height={floorWiseData.length * 40 + 50}
                        autoRowSize={false}
                        autoColumnSize={true}
                        licenseKey="non-commercial-and-evaluation"
                        stretchH="all"
                        className="htMiddle"
                        filters={true}
                        dropdownMenu={true}
                        beforeOnCellMouseDown={(event, coords) => {
                          // Only allow dropdown menu for first two columns (0 and 1)
                          if (coords.col > 1) {
                            event.stopImmediatePropagation();
                          }
                        }}
                        afterGetColHeader={(col, TH) => {
                          // Remove dropdown button from columns after the first two
                          if (col > 1) {
                            const button = TH.querySelector('.changeType');
                            if (button) {
                              button.parentElement.removeChild(button);
                            }
                          }
                        }}
                        cells={(row, col) => {
                          const cellProperties = {};
                          
                          // Style for group headers (floor names)
                          if (floorWiseData[row]?.isGroupHeader) {
                            cellProperties.className = 'htCenter htMiddle fw-bold bg-light';
                            cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                              if (col === 0) {
                                td.innerHTML = `<strong>${floorWiseData[row].floorName}</strong>`;
                                td.style.backgroundColor = '#f8f9fa';
                                td.style.fontWeight = 'bold';
                              } else {
                                td.innerHTML = '';
                                td.style.backgroundColor = '#f8f9fa';
                              }
                              return td;
                            };
                          }
                          
                          // Style for subtotal rows
                          if (floorWiseData[row]?.isSubtotal) {
                            cellProperties.className = 'htRight htMiddle fw-bold';
                            cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                              td.style.backgroundColor = '#e9ecef';
                              td.style.fontWeight = 'bold';
                              if (col === 0) {
                                td.innerHTML = '<strong>Subtotal</strong>';
                                td.style.textAlign = 'left';
                              } else if (col === 1) {
                                td.innerHTML = '';
                              } else {
                                // Format numeric values
                                const formattedValue = value != null ? value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
                                td.innerHTML = formattedValue;
                                td.style.textAlign = 'right';
                              }
                              return td;
                            };
                          }
                          
                          // Style for grand total row
                          if (floorWiseData[row]?.isGrandTotal) {
                            cellProperties.className = 'htRight htMiddle fw-bold';
                            cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                              td.style.backgroundColor = '#dee2e6';
                              td.style.fontWeight = 'bold';
                              td.style.fontSize = '1.05em';
                              if (col === 0) {
                                td.innerHTML = '<strong>Grand Total</strong>';
                                td.style.textAlign = 'left';
                              } else if (col === 1) {
                                td.innerHTML = '';
                              } else {
                                // Format numeric values
                                const formattedValue = value != null ? value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
                                td.innerHTML = formattedValue;
                                td.style.textAlign = 'right';
                              }
                              return td;
                            };
                          }
                          
                          return cellProperties;
                        }}
                      />
                    </div>
                  </Tab>
                  <Tab eventKey="detailed" title="Detailed">
                    <p className="text-muted">Detailed cost breakdown will be displayed here.</p>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>

      {/* PDF Viewer Modal */}
      <Modal 
        show={showPdfModal} 
        onHide={() => setShowPdfModal(false)} 
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Cost Report PDF Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '80vh', padding: 0 }}>
          {isDataReady ? (
            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
              <CostReportPDF reportData={reportData} categoryWiseData={categoryWiseData} floorWiseData={floorWiseData} />
            </PDFViewer>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <p className="text-muted">No data available to generate PDF</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Reports;
