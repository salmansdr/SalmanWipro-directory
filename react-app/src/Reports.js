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
const CostReportPDF = ({ reportData, categoryWiseData, floorWiseData, includeMaterialDetails, processedDetailedData, detailedFloors, currencySymbol }) => {
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
                  <Text style={pdfStyles.colF5}>{row.materialCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                  <Text style={pdfStyles.colF6}>{row.labourCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                  <Text style={pdfStyles.colF7}>{row.totalCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                  <Text style={pdfStyles.colF8}>{row.costPerSft?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
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
                  <Text style={pdfStyles.colF5}>{row.materialCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                  <Text style={pdfStyles.colF6}>{row.labourCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                  <Text style={pdfStyles.colF7}>{row.totalCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                  <Text style={pdfStyles.colF8}>{row.costPerSft?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                  <Text style={pdfStyles.colF9}>{Math.round(row.percentileCost || 0)}%</Text>
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

      {/* Page 3: Material Details (conditional) */}
      {processedDetailedData && processedDetailedData.length > 0 && (
        <Page size="A4" orientation="landscape" style={pdfStyles.page}>
          <View style={pdfStyles.header}>
            <Text style={pdfStyles.companyName}>{reportData?.companyDetails?.companyName || 'N/A'}</Text>
            <Text style={pdfStyles.companyAddress}>Material Details</Text>
          </View>

          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={{ width: '20%', paddingRight: 3 }}>Item</Text>
              {detailedFloors && detailedFloors.map((floor, idx) => (
                <Text key={idx} style={{ width: `${60 / (detailedFloors.length + 3)}%`, textAlign: 'right', paddingRight: 3 }}>{floor}</Text>
              ))}
              <Text style={{ width: '8%', textAlign: 'right', paddingRight: 3 }}>Total</Text>
              <Text style={{ width: '6%', textAlign: 'center', paddingRight: 3 }}>Unit</Text>
              <Text style={{ width: '8%', textAlign: 'right', paddingRight: 3 }}>Rate</Text>
              <Text style={{ width: '10%', textAlign: 'right' }}>{`Amount (${currencySymbol || '₹'})`}</Text>
            </View>
            {processedDetailedData.map((row, index) => {
              if (row.isGroupHeader) {
                return (
                  <View key={index} style={pdfStyles.floorGroupHeader}>
                    <Text style={{ width: '100%', paddingLeft: 5 }}>{row.category}</Text>
                  </View>
                );
              }
              if (row.isSubtotal) {
                return (
                  <View key={index} style={pdfStyles.floorSubtotal}>
                    <Text style={{ width: '20%', paddingLeft: 5 }}>Subtotal</Text>
                    {detailedFloors && detailedFloors.map((floor, idx) => (
                      <Text key={idx} style={{ width: `${60 / (detailedFloors.length + 3)}%` }}></Text>
                    ))}
                    <Text style={{ width: '8%' }}></Text>
                    <Text style={{ width: '6%' }}></Text>
                    <Text style={{ width: '8%' }}></Text>
                    <Text style={{ width: '10%', textAlign: 'right', paddingRight: 5 }}>{row.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                  </View>
                );
              }
              if (row.isGrandTotal) {
                return (
                  <View key={index} style={pdfStyles.tableRowTotal}>
                    <Text style={{ width: '20%', paddingLeft: 5 }}>Grand Total</Text>
                    {detailedFloors && detailedFloors.map((floor, idx) => (
                      <Text key={idx} style={{ width: `${60 / (detailedFloors.length + 3)}%` }}></Text>
                    ))}
                    <Text style={{ width: '8%' }}></Text>
                    <Text style={{ width: '6%' }}></Text>
                    <Text style={{ width: '8%' }}></Text>
                    <Text style={{ width: '10%', textAlign: 'right', paddingRight: 5 }}>{row.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</Text>
                  </View>
                );
              }
              return (
                <View key={index} style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
                  <Text style={{ width: '20%', paddingLeft: 3 }}>{row.item}</Text>
                  {detailedFloors && detailedFloors.map((floor, idx) => (
                    <Text key={idx} style={{ width: `${60 / (detailedFloors.length + 3)}%`, textAlign: 'right', paddingRight: 3 }}>
                      {row[floor] ? row[floor].toFixed(2) : '0.00'}
                    </Text>
                  ))}
                  <Text style={{ width: '8%', textAlign: 'right', paddingRight: 3 }}>{row.total?.toFixed(2) || '0.00'}</Text>
                  <Text style={{ width: '6%', textAlign: 'center', paddingRight: 3 }}>{row.unit || ''}</Text>
                  <Text style={{ width: '8%', textAlign: 'right', paddingRight: 3 }}>{row.rate?.toFixed(2) || '0.00'}</Text>
                  <Text style={{ width: '10%', textAlign: 'right', paddingRight: 5 }}>{row.amount?.toFixed(2) || '0.00'}</Text>
                </View>
              );
            })}
          </View>

          <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
        </Page>
      )}
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
  const [detailedMaterialData, setDetailedMaterialData] = useState([]);
  const [detailedFloors, setDetailedFloors] = useState([]);
  const [includeMaterialDetails, setIncludeMaterialDetails] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
  
  // Refs for Handsontable instances
  const summaryTableRef = useRef(null);
  const floorWiseTableRef = useRef(null);
  const detailedTableRef = useRef(null);

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

  // Fetch detailed material report data
  useEffect(() => {
    const fetchDetailedMaterialReport = async () => {
      if (selectedEstimationId) {
        try {
          console.log('Fetching detailed material report for:', selectedEstimationId);
          const response = await fetch(`${apiUrl}/api/ProjectEstimation/report-by-material/${selectedEstimationId}`);
          console.log('Detailed material report response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Detailed material report data:', data);
            
            if (data.data && Array.isArray(data.data)) {
              setDetailedMaterialData(data.data);
              setDetailedFloors(data.floors || []);
              console.log('Set detailed material data:', data.data.length, 'items');
            } else {
              console.warn('Invalid data structure:', data);
              setDetailedMaterialData([]);
              setDetailedFloors([]);
            }
          } else {
            const errorText = await response.text();
            console.error('Failed to fetch detailed material report:', response.status, errorText);
            setDetailedMaterialData([]);
            setDetailedFloors([]);
          }
        } catch (error) {
          console.error('Error fetching detailed material report:', error);
          setDetailedMaterialData([]);
          setDetailedFloors([]);
        }
      } else {
        setDetailedMaterialData([]);
        setDetailedFloors([]);
      }
    };
    
    fetchDetailedMaterialReport();
  }, [selectedEstimationId, apiUrl]);

  // Process detailed material data to add category group headers
  const [processedDetailedData, setProcessedDetailedData] = useState([]);
  
  useEffect(() => {
    if (detailedMaterialData && detailedMaterialData.length > 0 && Array.isArray(detailedFloors) && detailedFloors.length > 0) {
      const grouped = [];
      let currentCategory = null;
      let categorySubtotal = 0;
      let grandTotal = 0;

      detailedMaterialData.forEach((item, index) => {
        // Add subtotal for previous category when category changes
        if (currentCategory !== null && currentCategory !== item.category) {
          grouped.push({
            isSubtotal: true,
            category: currentCategory,
            item: 'Subtotal',
            ...detailedFloors.reduce((acc, floor) => ({ ...acc, [floor]: '' }), {}),
            total: '',
            unit: '',
            rate: '',
            amount: categorySubtotal,
            remarks: ''
          });
          categorySubtotal = 0;
        }

        // Add category group header when category changes
        if (currentCategory !== item.category) {
          grouped.push({
            isGroupHeader: true,
            category: item.category,
            item: '',
            ...detailedFloors.reduce((acc, floor) => ({ ...acc, [floor]: '' }), {}),
            total: '',
            unit: '',
            rate: '',
            amount: '',
            remarks: ''
          });
          currentCategory = item.category;
        }
        
        // Add the actual item row
        grouped.push({
          ...item,
          isGroupHeader: false,
          isSubtotal: false,
          isGrandTotal: false
        });

        // Accumulate amounts
        categorySubtotal += parseFloat(item.amount) || 0;
        grandTotal += parseFloat(item.amount) || 0;
      });

      // Add the last category subtotal
      if (currentCategory !== null) {
        grouped.push({
          isSubtotal: true,
          category: currentCategory,
          item: 'Subtotal',
          ...detailedFloors.reduce((acc, floor) => ({ ...acc, [floor]: '' }), {}),
          total: '',
          unit: '',
          rate: '',
          amount: categorySubtotal,
          remarks: ''
        });
      }

      // Add grand total row
      if (detailedMaterialData.length > 0) {
        grouped.push({
          isGrandTotal: true,
          category: '',
          item: 'Grand Total',
          ...detailedFloors.reduce((acc, floor) => ({ ...acc, [floor]: '' }), {}),
          total: '',
          unit: '',
          rate: '',
          amount: grandTotal,
          remarks: ''
        });
      }

      setProcessedDetailedData(grouped);
    } else {
      setProcessedDetailedData([]);
    }
  }, [detailedMaterialData, detailedFloors]);

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
        setDetailedMaterialData([]);
        setDetailedFloors([]);
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
            setDetailedMaterialData([]);
            setDetailedFloors([]);
          }
        } catch (error) {
          console.error('Error fetching report data:', error);
          setReportData(null);
          setCategoryWiseData([]);
          setFloorWiseData([]);
          setDetailedMaterialData([]);
          setDetailedFloors([]);
        }
      } else {
        setReportData(null);
        setCategoryWiseData([]);
        setFloorWiseData([]);
        setDetailedMaterialData([]);
        setDetailedFloors([]);
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
          if (col === 'I' && ws3[cellRef].v != null) {
            // Round percentage in grandTotal row
            ws3[cellRef].v = Math.round(ws3[cellRef].v);
            ws3[cellRef].z = '0';
          } else if (col !== 'A' && col !== 'B' && col !== 'C' && col !== 'D' && ws3[cellRef].v != null) {
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
    
    // ===== SHEET 4: Material Details =====
    if (includeMaterialDetails && processedDetailedData && processedDetailedData.length > 0 && detailedFloors && detailedFloors.length > 0) {
      const ws4Data = [];
      
      // Add title and headers
      ws4Data.push(['Material Details Report']);
      ws4Data.push([]);
      
      // Add column headers
      const materialHeaders = [
        'Item',
        ...detailedFloors,
        'Total',
        'Unit',
        'Rate',
        `Amount (${currencySymbol})`,
        'Remarks'
      ];
      ws4Data.push(materialHeaders);
    
    // Add data rows with category grouping
    processedDetailedData.forEach(row => {
      if (row.isGroupHeader) {
        // Category group header
        const groupRow = [row.category];
        for (let i = 1; i < materialHeaders.length; i++) {
          groupRow.push('');
        }
        ws4Data.push(groupRow);
      } else if (row.isSubtotal) {
        // Subtotal row
        const subtotalRow = ['Subtotal'];
        if (Array.isArray(detailedFloors)) {
          detailedFloors.forEach(() => subtotalRow.push(''));
        }
        subtotalRow.push(''); // Total
        subtotalRow.push(''); // Unit
        subtotalRow.push(''); // Rate
        subtotalRow.push(row.amount);
        subtotalRow.push('');
        ws4Data.push(subtotalRow);
      } else if (row.isGrandTotal) {
        // Grand total row
        const grandTotalRow = ['Grand Total'];
        if (Array.isArray(detailedFloors)) {
          detailedFloors.forEach(() => grandTotalRow.push(''));
        }
        grandTotalRow.push(''); // Total
        grandTotalRow.push(''); // Unit
        grandTotalRow.push(''); // Rate
        grandTotalRow.push(row.amount);
        grandTotalRow.push('');
        ws4Data.push(grandTotalRow);
      } else {
        // Regular data row
        const dataRow = [row.item];
        if (Array.isArray(detailedFloors)) {
          detailedFloors.forEach(floor => dataRow.push(row[floor] || 0));
        }
        dataRow.push(row.total);
        dataRow.push(row.unit);
        dataRow.push(row.rate);
        dataRow.push(row.amount);
        dataRow.push(row.remarks || '');
        ws4Data.push(dataRow);
      }
    });
    
    const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
    
    // Set column widths
    ws4['!cols'] = [
      { wch: 30 }, // Item
      ...(Array.isArray(detailedFloors) ? detailedFloors.map(() => ({ wch: 15 })) : []),
      { wch: 15 }, // Total
      { wch: 10 }, // Unit
      { wch: 12 }, // Rate
      { wch: 18 }, // Amount
      { wch: 20 }  // Remarks
    ];
    
    // Apply styling
    const materialRange = XLSX.utils.decode_range(ws4['!ref']);
    
    // Title row styling (row 0)
    for (let C = materialRange.s.c; C <= materialRange.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws4[cellAddress]) ws4[cellAddress] = { t: 's', v: '' };
      ws4[cellAddress].s = {
        font: { bold: true, sz: 16, color: { rgb: '1a365d' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
    
    // Merge title row
    ws4['!merges'] = ws4['!merges'] || [];
    ws4['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: materialHeaders.length - 1 } });
    
    // Header row styling (row 2)
    for (let C = materialRange.s.c; C <= materialRange.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: C });
      if (!ws4[cellAddress]) continue;
      ws4[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }
    
    // Data rows styling
    let dataRowIndex = 3;
    processedDetailedData.forEach((row, index) => {
      for (let C = materialRange.s.c; C <= materialRange.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: dataRowIndex, c: C });
        if (!ws4[cellAddress]) ws4[cellAddress] = { t: 's', v: '' };
        
        if (row.isGroupHeader) {
          // Category group header styling
          ws4[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4a5568' } },
            alignment: { horizontal: C === 0 ? 'left' : 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        } else if (row.isSubtotal) {
          // Subtotal row styling
          ws4[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'e9ecef' } },
            alignment: { horizontal: C === 0 ? 'left' : 'right', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
          // Format amount
          if (C === materialHeaders.length - 2) {
            ws4[cellAddress].z = '#,##0.00';
          }
        } else if (row.isGrandTotal) {
          // Grand total row styling
          ws4[cellAddress].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: 'dee2e6' } },
            alignment: { horizontal: C === 0 ? 'left' : 'right', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: '000000' } },
              bottom: { style: 'medium', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
          // Format amount
          if (C === materialHeaders.length - 2) {
            ws4[cellAddress].z = '#,##0.00';
          }
        } else {
          // Regular data row styling
          ws4[cellAddress].s = {
            alignment: { horizontal: C === 0 || C === materialRange.e.c ? 'left' : 'right', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: 'D3D3D3' } },
              bottom: { style: 'thin', color: { rgb: 'D3D3D3' } },
              left: { style: 'thin', color: { rgb: 'D3D3D3' } },
              right: { style: 'thin', color: { rgb: 'D3D3D3' } }
            }
          };
          // Format numeric columns
          if (C > 0 && C < materialHeaders.length - 1) {
            ws4[cellAddress].z = '#,##0.00';
          }
        }
      }
      dataRowIndex++;
    });
    
    XLSX.utils.book_append_sheet(wb, ws4, 'Material Details');
    }
    
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
              <Card.Header className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                <h4 className="mb-0 section-heading">Cost Tracking</h4>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  {isDataReady && processedDetailedData.length > 0 && (
                    <Form.Check 
                      type="checkbox"
                      id="include-material-details"
                      label="Include Material Details"
                      checked={includeMaterialDetails}
                      onChange={(e) => setIncludeMaterialDetails(e.target.checked)}
                      className="me-2"
                    />
                  )}
                  {isDataReady ? (
                    <>
                      <PDFDownloadLink 
                        document={<CostReportPDF 
                          reportData={reportData} 
                          categoryWiseData={categoryWiseData} 
                          floorWiseData={floorWiseData}
                          includeMaterialDetails={includeMaterialDetails}
                          processedDetailedData={processedDetailedData}
                          detailedFloors={detailedFloors}
                          currencySymbol={currencySymbol}
                        />} 
                        fileName={`Cost_Report_${reportData?.projectDetails?.projectName || 'Report'}.pdf`}
                        style={{ textDecoration: 'none' }}
                      >
                        {({ loading, url, blob }) => (
                          <Button 
                            variant="primary" 
                            size="sm"
                            disabled={loading}
                            onClick={(e) => {
                              if (!loading && url) {
                                // On mobile, open in new tab; on desktop, show modal
                                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                                if (isMobile) {
                                  // Let the PDFDownloadLink handle it
                                  e.preventDefault();
                                  window.open(url, '_blank');
                                } else {
                                  e.preventDefault();
                                  setShowPdfModal(true);
                                }
                              }
                            }}
                          >
                            <i className="bi bi-file-earmark-pdf me-2"></i>
                            {loading ? 'Generating...' : 'View PDF'}
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
                    <div style={{ overflow: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
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
                    <div style={{ overflow: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
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
                  <Tab eventKey="detailed" title="Detailed Material">
                    <div style={{ overflow: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
                      {Array.isArray(processedDetailedData) && processedDetailedData.length > 0 ? (
                        <HotTable
                          ref={detailedTableRef}
                          data={processedDetailedData}
                          colHeaders={[
                            'Item',
                            ...(Array.isArray(detailedFloors) ? detailedFloors : []),
                            'Total',
                            'Unit',
                            'Rate',
                            `Amount (${currencySymbol})`,
                            'Remarks'
                          ]}
                          columns={[
                            { data: 'item', type: 'text', readOnly: true, width: 250 },
                            ...(Array.isArray(detailedFloors) ? detailedFloors.map(floor => ({
                              data: floor,
                              type: 'numeric',
                              numericFormat: { pattern: '0,0.00' },
                              readOnly: true,
                              width: 100
                            })) : []),
                            { 
                              data: 'total', 
                              type: 'numeric', 
                              numericFormat: { pattern: '0,0.00' },
                              readOnly: true,
                              width: 100,
                              className: 'htRight fw-bold'
                            },
                            { data: 'unit', type: 'text', readOnly: true, width: 80 },
                            { 
                              data: 'rate', 
                              type: 'numeric', 
                              numericFormat: { pattern: '0,0.00' },
                              readOnly: true,
                              width: 80
                            },
                            { 
                              data: 'amount', 
                              type: 'numeric', 
                              numericFormat: { pattern: '0,0.00' },
                              readOnly: true,
                              width: 120,
                              className: 'htRight fw-bold'
                            },
                            { data: 'remarks', type: 'text', readOnly: true, width: 120 }
                          ]}
                          rowHeaders={true}
                          width="100%"
                          height={processedDetailedData.length * 40 + 50}
                          autoRowSize={false}
                          autoColumnSize={true}
                          licenseKey="non-commercial-and-evaluation"
                          stretchH="all"
                          className="htMiddle"
                          filters={true}
                          dropdownMenu={true}
                          beforeOnCellMouseDown={(event, coords) => {
                            // Only allow dropdown menu for first column (0)
                            if (coords.col > 0) {
                              event.stopImmediatePropagation();
                            }
                          }}
                          afterGetColHeader={(col, TH) => {
                            // Remove dropdown button from columns after the first one
                            if (col > 0) {
                              const button = TH.querySelector('.changeType');
                              if (button) {
                                button.parentElement.removeChild(button);
                              }
                            }
                          }}
                          cells={(row, col) => {
                            const cellProperties = {};
                            
                            // Style for group headers (category names)
                            if (processedDetailedData[row]?.isGroupHeader) {
                              cellProperties.className = 'htCenter htMiddle fw-bold bg-light';
                              cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                if (col === 0) {
                                  td.innerHTML = `<strong>${processedDetailedData[row].category}</strong>`;
                                  td.style.backgroundColor = '#4a5568';
                                  td.style.color = '#ffffff';
                                  td.style.fontWeight = 'bold';
                                  td.style.padding = '10px 8px';
                                } else {
                                  td.innerHTML = '';
                                  td.style.backgroundColor = '#4a5568';
                                }
                                return td;
                              };
                            }
                            
                            // Style for subtotal rows
                            if (processedDetailedData[row]?.isSubtotal) {
                              cellProperties.className = 'htRight htMiddle fw-bold';
                              cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                td.style.backgroundColor = '#e9ecef';
                                td.style.fontWeight = 'bold';
                                if (col === 0) {
                                  td.innerHTML = '<strong>Subtotal</strong>';
                                  td.style.textAlign = 'left';
                                } else if (value && typeof value === 'number') {
                                  const formattedValue = value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  td.innerHTML = formattedValue;
                                  td.style.textAlign = 'right';
                                } else {
                                  td.innerHTML = '';
                                }
                                return td;
                              };
                            }
                            
                            // Style for grand total row
                            if (processedDetailedData[row]?.isGrandTotal) {
                              cellProperties.className = 'htRight htMiddle fw-bold';
                              cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                td.style.backgroundColor = '#dee2e6';
                                td.style.fontWeight = 'bold';
                                td.style.fontSize = '1.05em';
                                if (col === 0) {
                                  td.innerHTML = '<strong>Grand Total</strong>';
                                  td.style.textAlign = 'left';
                                } else if (value && typeof value === 'number') {
                                  const formattedValue = value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  td.innerHTML = formattedValue;
                                  td.style.textAlign = 'right';
                                } else {
                                  td.innerHTML = '';
                                }
                                return td;
                              };
                            }
                            
                            return cellProperties;
                          }}
                        />
                      ) : (
                        <p className="text-muted">No detailed material data available. Please select an estimation.</p>
                      )}
                    </div>
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
              <CostReportPDF 
                reportData={reportData} 
                categoryWiseData={categoryWiseData} 
                floorWiseData={floorWiseData}
                includeMaterialDetails={includeMaterialDetails}
                processedDetailedData={processedDetailedData}
                detailedFloors={detailedFloors}
                currencySymbol={currencySymbol}
              />
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
