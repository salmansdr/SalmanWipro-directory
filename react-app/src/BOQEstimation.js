import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Container, Form, Row, Col, Card, Alert, Spinner, Tabs, Tab, Button, Modal, Dropdown, DropdownButton } from 'react-bootstrap';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import Handsontable from 'handsontable';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import * as XLSX from 'xlsx-js-style';

// Register all Handsontable modules
registerAllModules();

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a365d',
    textAlign: 'center',
  },
  floorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#2d3748',
    backgroundColor: '#e2e8f0',
    padding: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#2d3748',
    backgroundColor: '#f7fafc',
    padding: 6,
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4472C4',
    color: '#ffffff',
    fontWeight: 'bold',
    padding: 6,
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    padding: 5,
    fontSize: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    borderBottom: '1 solid #e2e8f0',
    padding: 5,
    fontSize: 8,
  },
  col1: { width: '40%', paddingRight: 4 },
  col2: { width: '15%', paddingRight: 4, textAlign: 'right' },
  col3: { width: '15%', paddingRight: 4, textAlign: 'right' },
  col4: { width: '15%', paddingRight: 4, textAlign: 'right' },
  col5: { width: '15%', paddingRight: 4, textAlign: 'right' },
  // Material grid columns
  matCol1: { width: '18%', paddingRight: 3 },
  matCol2: { width: '8%', paddingRight: 2, textAlign: 'right', fontSize: 7 },
  matCol3: { width: '7%', paddingRight: 3, textAlign: 'right' },
  matCol4: { width: '7%', paddingRight: 3, textAlign: 'right' },
  matCol5: { width: '7%', paddingRight: 3, textAlign: 'right' },
  matCol6: { width: '8%', paddingRight: 2, textAlign: 'right', fontSize: 7 },
  matCol7: { width: '7%', paddingRight: 3, textAlign: 'right' },
  matCol8: { width: '7%', paddingRight: 3, textAlign: 'right' },
  matCol9: { width: '10%', paddingRight: 5, textAlign: 'right' },
  matCol10: { width: '10%', paddingRight: 5, textAlign: 'right' },
  matCol11: { width: '11%', paddingRight: 3, textAlign: 'right' },
  tableRowGroupHeader: {
    flexDirection: 'row',
    backgroundColor: '#4a5568',
    color: '#ffffff',
    fontWeight: 'bold',
    padding: 5,
    fontSize: 8,
  },
  tableRowGrandTotal: {
    flexDirection: 'row',
    backgroundColor: '#2d3748',
    color: '#ffffff',
    fontWeight: 'bold',
    padding: 6,
    fontSize: 9,
    borderTop: '2 solid #1a202c',
  },
});

// BOQ PDF Document Component
const BOQPDFDocument = ({ floors, floorDataCache, materialDataCache, currency }) => {
  // Use currency string directly like in the grid
  const currencyDisplay = currency || 'INR';

  const renderFloorData = (floorName) => {
    // Safely access cache data with null checks
    const floorCache = floorDataCache?.[floorName];
    const materialCache = materialDataCache?.[floorName];
    
    // Get quantity data - handle both direct array and gridData property
    let quantityData = [];
    if (Array.isArray(floorCache)) {
      quantityData = floorCache;
    } else if (floorCache && Array.isArray(floorCache.gridData)) {
      quantityData = floorCache.gridData;
    }

    // Get material data - handle both direct array and cached object
    let materialData = [];
    if (Array.isArray(materialCache)) {
      materialData = materialCache;
    } else if (materialCache && Array.isArray(materialCache.data)) {
      materialData = materialCache.data;
    }

    // Filter only group header rows from quantity data where quantity > 0
    const componentDetails = quantityData.filter(row => 
      row && row.isGroupHeader && row.quantity != null && !isNaN(row.quantity) && parseFloat(row.quantity) > 0
    ) || [];
    
    // Filter valid material rows (both group headers and children)
    const validMaterialData = materialData.filter(row => row && row.component) || [];

    // Calculate grand total for material data
    const grandTotal = validMaterialData.reduce((acc, row) => {
      // Material and Total amounts are on both group headers and children
      acc.materialAmount += parseFloat(row.materialAmount) || 0;
      acc.totalAmount += parseFloat(row.totalAmount) || 0;
      // Labour amount only on group headers
      if (row.isGroupHeader) {
        acc.labourAmount += parseFloat(row.labourAmount) || 0;
      }
      return acc;
    }, { materialAmount: 0, labourAmount: 0, totalAmount: 0 });

    // Skip rendering if no data
    if (componentDetails.length === 0 && validMaterialData.length === 0) {
      return null;
    }

    return (
      <View key={floorName}>
        <Text style={pdfStyles.floorTitle}>{floorName || 'Unknown Floor'}</Text>

        {/* Component Details Section */}
        {componentDetails.length > 0 && (
          <>
            <Text style={pdfStyles.sectionTitle}>Component Details</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={pdfStyles.col1}>Component</Text>
                <Text style={pdfStyles.col2}>Quantity</Text>
                <Text style={pdfStyles.col3}>Unit</Text>
              </View>
              {componentDetails.map((row, index) => (
                <View key={`comp-${index}`} style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
                  <Text style={pdfStyles.col1}>{row.component || ''}</Text>
                  <Text style={pdfStyles.col2}>
                    {row.quantity != null && !isNaN(row.quantity) ? parseFloat(row.quantity).toFixed(2) : '0.00'}
                  </Text>
                  <Text style={pdfStyles.col3}>{row.unit || ''}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Estimation Details Section */}
        {validMaterialData.length > 0 && (
          <>
            <Text style={pdfStyles.sectionTitle}>Estimation Details</Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={pdfStyles.matCol1}>Component</Text>
                <Text style={pdfStyles.matCol2}>Volume</Text>
                <Text style={pdfStyles.matCol3}>Cons. Rate</Text>
                <Text style={pdfStyles.matCol4}>Qty</Text>
                <Text style={pdfStyles.matCol5}>Wastage %</Text>
                <Text style={pdfStyles.matCol6}>Total Qty</Text>
                <Text style={pdfStyles.matCol7}>Rate</Text>
                <Text style={pdfStyles.matCol8}>Labour Rate</Text>
                <Text style={pdfStyles.matCol9}>Material Amt</Text>
                <Text style={pdfStyles.matCol10}>Labour Amt</Text>
                <Text style={pdfStyles.matCol11}>Total Amt ({currencyDisplay})</Text>
              </View>
              {validMaterialData.map((row, index) => {
                const isGroupHeader = row.isGroupHeader;
                const rowStyle = isGroupHeader ? pdfStyles.tableRowGroupHeader : (index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt);
                
                // Helper function to format numbers or return empty string
                const formatNum = (value) => {
                  return (value != null && !isNaN(value)) ? parseFloat(value).toFixed(2) : '';
                };
                
                return (
                  <View key={`mat-${index}`} style={rowStyle}>
                    <Text style={pdfStyles.matCol1}>{row.component || ''}</Text>
                    <Text style={pdfStyles.matCol2}>
                      {isGroupHeader ? `${formatNum(row.volume)} ${row.unit || ''}` : ''}
                    </Text>
                    <Text style={pdfStyles.matCol3}>
                      {!isGroupHeader ? formatNum(row.consumptionRate) : ''}
                    </Text>
                    <Text style={pdfStyles.matCol4}>
                      {!isGroupHeader ? formatNum(row.materialQty) : ''}
                    </Text>
                    <Text style={pdfStyles.matCol5}>
                      {!isGroupHeader ? formatNum(row.wastage) : ''}
                    </Text>
                    <Text style={pdfStyles.matCol6}>
                      {!isGroupHeader ? `${formatNum(row.totalQty)} ${row.uom || ''}` : ''}
                    </Text>
                    <Text style={pdfStyles.matCol7}>
                      {!isGroupHeader ? formatNum(row.materialRate) : ''}
                    </Text>
                    <Text style={pdfStyles.matCol8}>
                      {isGroupHeader ? formatNum(row.labourRate) : ''}
                    </Text>
                    <Text style={pdfStyles.matCol9}>
                      {formatNum(row.materialAmount)}
                    </Text>
                    <Text style={pdfStyles.matCol10}>
                      {isGroupHeader ? formatNum(row.labourAmount) : ''}
                    </Text>
                    <Text style={pdfStyles.matCol11}>
                      {formatNum(row.totalAmount)}
                    </Text>
                  </View>
                );
              })}
              {/* Grand Total Row */}
              <View style={pdfStyles.tableRowGrandTotal}>
                <Text style={pdfStyles.matCol1}>Grand Total</Text>
                <Text style={pdfStyles.matCol2}></Text>
                <Text style={pdfStyles.matCol3}></Text>
                <Text style={pdfStyles.matCol4}></Text>
                <Text style={pdfStyles.matCol5}></Text>
                <Text style={pdfStyles.matCol6}></Text>
                <Text style={pdfStyles.matCol7}></Text>
                <Text style={pdfStyles.matCol8}></Text>
                <Text style={pdfStyles.matCol9}>{grandTotal.materialAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={pdfStyles.matCol10}>{grandTotal.labourAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={pdfStyles.matCol11}>{grandTotal.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  // Validate inputs
  if (!floors || !Array.isArray(floors) || floors.length === 0) {
    return (
      <Document>
        <Page size="A4" style={pdfStyles.page}>
          <View style={{ padding: 50, textAlign: 'center' }}>
            <Text style={{ fontSize: 16, color: '#e53e3e' }}>No floors available</Text>
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      {floors.map(floor => (
        <Page key={floor} size="A4" style={pdfStyles.page}>
          <Text style={pdfStyles.header}>BOQ Estimation Report</Text>
          {renderFloorData(floor)}
        </Page>
      ))}
    </Document>
  );
};

const BOQEstimation = ({ selectedFloor, estimationMasterId, floorsList, onSaveComplete, isExpandedView = false, onToggleExpandedView }) => {
  // eslint-disable-next-line no-unused-vars
  const [estimations, setEstimations] = useState([]);
  const [floors, setFloors] = useState([]);
  const [localSelectedFloor, setLocalSelectedFloor] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [activeTab, setActiveTab] = useState('quantity');
  const [quantityData, setQuantityData] = useState(null);
  const [materialData, setMaterialData] = useState(null);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [rccConfigData, setRccConfigData] = useState([]);
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState('');
  const [materialItems, setMaterialItems] = useState([]);
  const [materialCacheVersion, setMaterialCacheVersion] = useState(0); // Track when material cache is updated
  const [showCopyFloorModal, setShowCopyFloorModal] = useState(false);
  const [copySourceFloor, setCopySourceFloor] = useState('');
  const [copyTargetFloors, setCopyTargetFloors] = useState([]);
  const [indirectExpenseData, setIndirectExpenseData] = useState(null);
  const [indirectExpenseConfig, setIndirectExpenseConfig] = useState(null);
  const [currency, setCurrency] = useState('INR');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFloors, setPdfFloors] = useState([]);
  
  const quantityTableRef = useRef(null);
  const materialTableRef = useRef(null);
  const indirectExpenseTableRef = useRef(null);
  
  const floorDataCache = useRef({});
  const materialDataCache = useRef({}); // Cache for material grid data
  const indirectExpenseCache = useRef({}); // Cache for indirect expense data
  const initialLoadDone = useRef(false);
  const previousFloorRef = useRef(''); // Track previous floor for saving data before switching
  const previousTabRef = useRef('quantity'); // Track previous tab for saving material data
  const allComponentsRef = useRef({}); // Store all components from AreaCalculation
  const materialEditedFlags = useRef({}); // Track which floors have edited material data

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';

  const loadEstimations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/ProjectEstimation`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch estimations');
      }

      const data = await response.json();
      const estimationList = Array.isArray(data) ? data : [data];
      
      setEstimations(estimationList);
      setLoading(false);
    } catch (error) {
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error loading estimations: ${error.message}`
      });
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const loadGradeOptions = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/RccConfiguration`);
      if (!response.ok) throw new Error('Failed to fetch grade options');
      
      const data = await response.json();
      
      const configArray = Array.isArray(data) ? data : [data];
      
      // Store full RCC configuration data
      setRccConfigData(configArray);
      
      const grades = [];
      configArray.forEach(config => {
        // Extract grade field directly from each config document
        if (config.grade && !grades.includes(config.grade)) {
          grades.push(config.grade);
        }
      });
      
      setGradeOptions(grades);
    } catch (error) {
      // Error loading grade options
    }
  }, [apiBaseUrl]);

  const loadIndirectExpenseConfig = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/IndirectExpenseLogic`);
      if (!response.ok) throw new Error('Failed to fetch indirect expense configuration');
      
      const result = await response.json();
      const data = result.data && result.data.length > 0 ? result.data[0] : result;
      
      setIndirectExpenseConfig(data);
    } catch (error) {
      console.error('Error loading indirect expense configuration:', error);
    }
  }, [apiBaseUrl]);

  const loadMaterialItems = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/MaterialItems`);
      if (!response.ok) throw new Error('Failed to fetch material items');
      
      const data = await response.json();
      const itemsArray = Array.isArray(data) ? data : [data];
      
      setMaterialItems(itemsArray);
    } catch (error) {
      // Error loading material items
    }
  }, [apiBaseUrl]);

  const mapFloorName = useCallback((floor) => {
    if (floor === 'Foundation') return 'Foundation';
    if (floor.includes('Basement')) return 'Basement';
    // For any other floor (Ground Floor, 1st Floor, etc.)
    return 'Floors';
  }, []);

  // eslint-disable-next-line no-unused-vars
  const getFloorNameFromIndex = (index) => {
    // Map floor index to floor name (matching the PricingCalculator dropdown)
    if (index === 0) return 'Foundation';
    // Add logic to map other indices based on basementCount
    // For now, return the index as string
    return `Floor ${index}`;
  };

  // Extract components from floor data object
  const extractComponentsFromFloorData = useCallback((floorData) => {
    const metadataFields = ['_id', 'version', 'description', 'last_updated', 'Applicable Floors', 
                           'createdDate', 'modifiedDate', 'createdBy', 'modifiedBy', '__v', 
                           'estimationMasterId', 'floorName', 'recordCount'];
    
    const componentsList = [];
    Object.entries(floorData).forEach(([key, value]) => {
      if (!metadataFields.includes(key) && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        componentsList.push({
          component: key,
          category: value.Category || '',
          labour: value.Labour || 'no',
          material: value.Material || 'no',
          mixture: value.Mixture || '',
          unit: value.Unit || 'cu m',
          labourRate: parseFloat(value.PricePerUnit) || 0,
          instruction: value.Instruction || ''
        });
      }
    });
    
    return componentsList;
  }, []);

  // Load ALL floor data on page load and cache it
  const loadAllFloorsData = useCallback(async (estimationId) => {
    try {
      setLoading(true);
      
      // First, load PricePerUnit from AreaCalculation API to get labour rates
      let pricePerUnitMap = {};
      try {
        const areaCalcUrl = `${apiBaseUrl}/api/AreaCalculation`;
        const areaCalcResponse = await fetch(areaCalcUrl);
        
        if (areaCalcResponse.ok) {
          const areaCalculations = await areaCalcResponse.json();
          const calculationsArray = Array.isArray(areaCalculations) ? areaCalculations : [areaCalculations];
          
          // Build a map of component -> PricePerUnit for each floor category
          // Also store all components for "Add Component" feature
          calculationsArray.forEach(floorConfig => {
            const applicableFloors = floorConfig['Applicable Floors'];
            if (applicableFloors) {
              const metadataFields = ['_id', 'version', 'description', 'last_updated', 'Applicable Floors', 
                                     'createdDate', 'modifiedDate', 'createdBy', 'modifiedBy', '__v', 
                                     'estimationMasterId', 'floorName', 'recordCount'];
              
              // Store all components for this floor category
              if (!allComponentsRef.current[applicableFloors]) {
                allComponentsRef.current[applicableFloors] = [];
              }
              
              Object.entries(floorConfig).forEach(([key, value]) => {
                if (!metadataFields.includes(key) && typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  const pricePerUnit = parseFloat(value.PricePerUnit) || 0;
                  if (!pricePerUnitMap[applicableFloors]) {
                    pricePerUnitMap[applicableFloors] = {};
                  }
                  pricePerUnitMap[applicableFloors][key] = pricePerUnit;
                  
                  // Store component details for "Add Component" feature
                  allComponentsRef.current[applicableFloors].push({
                    component: key,
                    category: value.Category || '',
                    labour: value.Labour || 'no',
                    material: value.Material || 'no',
                    mixture: value.Mixture || '',
                    unit: value.Unit || 'cu m',
                    labourRate: pricePerUnit,
                    instruction: value.Instruction || ''
                  });
                }
              });
            }
          });
        }
      } catch (error) {
        // Error loading PricePerUnit from AreaCalculation
      }
      
      // Try to fetch from EstimationMaterialFloorWise API first
      try {
        const url = `${apiBaseUrl}/api/EstimationMaterialFloorWise/by-estimation-master/${estimationId}`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle new nested format: { records: [{ estimationMasterId, floors: [{floorName, components}] }] }
          let floorsArray = null;
          
          if (data && data.records && Array.isArray(data.records) && data.records.length > 0) {
            // Data wrapped in records array
            const record = data.records[0];
            if (record.floors && Array.isArray(record.floors)) {
              floorsArray = record.floors;
            }
          } else if (data && data.floors && Array.isArray(data.floors)) {
            // Direct floors array
            floorsArray = data.floors;
          }
          
          if (floorsArray && floorsArray.length > 0) {
            
            // Process each floor from nested format
            floorsArray.forEach(floorData => {
              const floorName = floorData.floorName;
              if (floorName && floorData.components) {
                // Get the floor category to look up PricePerUnit
                const floorCategory = mapFloorName(floorName);
                const categoryPrices = pricePerUnitMap[floorCategory] || {};
                
                // Convert components object to array format
                const componentsList = Object.keys(floorData.components).map(compName => {
                  const comp = floorData.components[compName];
                  
                  // Use Category from database first, fallback to allComponentsRef
                  const componentInfo = allComponentsRef.current[floorCategory]?.find(c => c.component === compName);
                  const category = comp.Category || componentInfo?.category || null;
                  
                  // Use PricePerUnit from EstimationMaterialFloorWise if available, otherwise from AreaCalculation
                  const labourRate = parseFloat(comp.PricePerUnit) || categoryPrices[compName] || 0;
                  const instruction = comp.Instruction || componentInfo?.instruction || '';
                  
                  return {
                    component: compName,
                    unit: comp.Unit || 'cu m',
                    mixture: comp.Mixture || '',
                    labourRate: labourRate,
                    category: category, // Include category
                    instruction: instruction // Include instruction
                  };
                });
                
                // Convert rows to gridData format
                let gridData = null;
                const hasData = Object.keys(floorData.components).some(compName => 
                  floorData.components[compName].rows && floorData.components[compName].rows.length > 0
                );
                
                if (hasData) {
                  gridData = [];
                  Object.keys(floorData.components).forEach((compName, index) => {
                    const comp = floorData.components[compName];
                    const labourRate = parseFloat(comp.PricePerUnit) || categoryPrices[compName] || 0;
                    
                    // Use Category from database first, fallback to allComponentsRef
                    const componentInfo = allComponentsRef.current[floorCategory]?.find(c => c.component === compName);
                    const category = comp.Category || componentInfo?.category || null;
                    const instruction = comp.Instruction || componentInfo?.instruction || '';
                    
                    // Add group header with total quantity
                    gridData.push({
                      srNo: index + 1,
                      component: compName,
                      quantity: comp.TotalQuantity || 0,  // Restore total quantity
                      unit: comp.Unit || 'cu m',
                      mixture: comp.Mixture || '',
                      labourRate: labourRate,
                      category: category, // Include category from DB or fallback
                      instruction: instruction, // Include instruction
                      isGroupHeader: true,
                      groupIndex: index
                    });
                    
                    // Add detail rows
                    if (comp.rows && comp.rows.length > 0) {
                      comp.rows.forEach(row => {
                        gridData.push({
                          component: row.childComponent || '',  // Load child component name
                          no: row.no || 0,
                          length: row.length || 0,
                          widthBreadth: row.widthBreadth || 0,
                          heightDepth: row.heightDepth || 0,
                          quantity: row.quantity || 0,
                          isDeduction: row.isDeduction || false,
                          isGroupHeader: false,
                          groupIndex: index,
                          unit: comp.Unit || 'cu m',
                          mixture: comp.Mixture || ''
                        });
                      });
                    } else {
                      // Add one empty row
                      gridData.push({
                        component: '',
                        no: 0,
                        isGroupHeader: false,
                        groupIndex: index,
                        unit: comp.Unit || 'cu m',
                        mixture: comp.Mixture || ''
                      });
                    }
                  });
                }
                
                floorDataCache.current[floorName] = {
                  components: componentsList,
                  gridData: gridData
                };
              }
            });
            
            setLoading(false);
            initialLoadDone.current = true;
            return;
          }
        }
      } catch (error) {
        // EstimationMaterialFloorWise error, falling back to AreaCalculation
      }
      
      // Fallback: Load from AreaCalculation API
      const url = `${apiBaseUrl}/api/AreaCalculation`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch area calculations');
      }
      
      const areaCalculations = await response.json();
      
      const calculationsArray = Array.isArray(areaCalculations) ? areaCalculations : [areaCalculations];
      
      // Cache data for each floor category
      calculationsArray.forEach(floorConfig => {
        const applicableFloors = floorConfig['Applicable Floors'];
        if (applicableFloors) {
          const componentsList = extractComponentsFromFloorData(floorConfig);
          
          // Cache for all floors that map to this category
          floorsList.forEach(floor => {
            const mappedCategory = mapFloorName(floor);
            if (mappedCategory === applicableFloors) {
              floorDataCache.current[floor] = {
                components: componentsList,
                gridData: null // Fresh from DB, no user modifications yet
              };
            }
          });
        }
      });
      
      setLoading(false);
    } catch (error) {
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error loading floor data: ${error.message}`
      });
      setLoading(false);
    }
  }, [apiBaseUrl, floorsList, mapFloorName, extractComponentsFromFloorData]);

  // Load material data from API
  const loadMaterialDataFromAPI = useCallback(async (estimationId) => {
    try {
      const url = `${apiBaseUrl}/api/PriceEstimationForMaterialAndLabour/by-estimation-master/${estimationId}`;
      const response = await fetch(url);
      
      if (!response.ok) {

        return;
      }
      
      const data = await response.json();

      
      let floorsArray = null;
      
      if (data && data.records && Array.isArray(data.records) && data.records.length > 0) {
        const record = data.records[0];
        if (record.floors && Array.isArray(record.floors)) {
          floorsArray = record.floors;
        }
      } else if (data && data.floors && Array.isArray(data.floors)) {
        floorsArray = data.floors;
      }
      
      if (floorsArray && floorsArray.length > 0) {
        floorsArray.forEach(floorData => {
          const floorName = floorData.floorName;
          if (floorName && floorData.components) {
            // Get the floor category to look up category from AreaCalculation
            const floorCategory = mapFloorName(floorName);
            
            // Convert API format to grid format
            const materialGridData = [];
            
            Object.keys(floorData.components).forEach(compName => {
              // Skip GRAND TOTAL component from database
              if (compName === 'GRAND TOTAL') return;
              
              const comp = floorData.components[compName];
              
              // Find category from allComponentsRef (AreaCalculationLogic)
              const componentInfo = allComponentsRef.current[floorCategory]?.find(c => c.component === compName);
              const category = componentInfo?.category || '';
              
              // Add group header
              materialGridData.push({
                component: compName,
                category: category,
                volume: parseFloat(comp.volume) || 0,
                unit: comp.unit || 'Cum',
                materialQty: '',
                wastage: '',
                totalQty: '',
                uom: '',
                materialRate: '',
                labourRate: parseFloat(comp.labourRate) || 0,
                materialAmount: parseFloat(comp.materialAmount) || 0,
                labourAmount: parseFloat(comp.labourAmount) || 0,
                totalAmount: parseFloat(comp.totalAmount) || 0,
                remarks: comp.remarks || '',
                isGroupHeader: true
              });
              
              // Add material child rows
              if (comp.materials && comp.materials.length > 0) {
                comp.materials.forEach(mat => {
                  // Skip GRAND TOTAL material rows from database
                  if (mat.material === 'GRAND TOTAL') return;
                  
                  materialGridData.push({
                    component: mat.material || '',
                    materialId: mat.materialId || '',
                    volume: '',
                    unit: '',
                    consumptionRate: mat.consumptionRate || 0,
                    materialQty: mat.materialQty || 0,
                    wastage: mat.wastage || 0,
                    totalQty: mat.totalQty || 0,
                    uom: mat.uom || '',
                    materialRate: mat.materialRate || 0,
                    labourRate: '',
                    materialAmount: mat.materialAmount || 0,
                    labourAmount: '',
                    totalAmount: mat.totalAmount || 0,
                    remarks: mat.remarks || '',
                    isGroupHeader: false
                  });
                });
              }
            });
            
            // Filter out any grand total rows from API data (double check)
            const cleanedData = materialGridData.filter(row => !row.isGrandTotal && row.component !== 'GRAND TOTAL');
            
            // Only cache if there's actual data - don't cache empty arrays
            if (cleanedData.length > 0) {
              materialDataCache.current[floorName] = cleanedData;
            }
          }

          // Load Expense (indirect expense) data if exists
          if (floorName && floorData.Expense) {
            const expenseData = [];
            let totalIndirectExpense = 0;

            Object.keys(floorData.Expense).forEach(expenseHead => {
              const exp = floorData.Expense[expenseHead];
              const amount = parseFloat(exp.amount) || 0;
              totalIndirectExpense += amount;

              expenseData.push({
                expenseHead: expenseHead,
                allocationPercent: parseFloat(exp.allocationPercent) || 0,
                amount: amount
              });
            });

            if (expenseData.length > 0) {
              // Calculate floor total from components
              let floorTotalAmount = 0;
              if (floorData.components) {
                Object.keys(floorData.components).forEach(compName => {
                  if (compName !== 'GRAND TOTAL') {
                    const comp = floorData.components[compName];
                    floorTotalAmount += parseFloat(comp.totalAmount) || 0;
                  }
                });
              }

              const grandTotal = floorTotalAmount + totalIndirectExpense;

              indirectExpenseCache.current[floorName] = {
                floorTotalAmount: parseFloat(floorTotalAmount.toFixed(2)),
                expenses: expenseData,
                totalIndirectExpense: parseFloat(totalIndirectExpense.toFixed(2)),
                grandTotal: parseFloat(grandTotal.toFixed(2))
              };
            }
          }
        });
        
        // Only increment version if we actually cached some data
        if (Object.keys(materialDataCache.current).length > 0) {
          setMaterialCacheVersion(prev => prev + 1);
        }
      }
    } catch (error) {
      // Error loading material data
    }
  }, [apiBaseUrl, mapFloorName]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateGroupTotal = useCallback((groupIndex) => {
    const hotInstance = quantityTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const sourceData = hotInstance.getSourceData();
    let total = 0;
    let headerRowIndex = -1;
    
    // Calculate total and find header row index
    sourceData.forEach((row, index) => {
      if (row.groupIndex === groupIndex) {
        if (row.isGroupHeader) {
          headerRowIndex = index;
        } else if (!row.isGroupHeader) {
          const qty = parseFloat(row.quantity) || 0;
          // Subtract if deduction row, otherwise add
          total += row.isDeduction ? -qty : qty;
        }
      }
    });
    
    // Update group header row quantity directly in the table
    if (headerRowIndex >= 0) {
      hotInstance.setDataAtRowProp(headerRowIndex, 'quantity', total.toFixed(2));
    }
  }, []); // No dependencies - uses table instance directly

  const initializeQuantityData = useCallback((componentsList) => {
    const initialData = [];
    
    componentsList.forEach((comp, index) => {
      // Add group header row
      initialData.push({
        srNo: index + 1,
        component: comp.component,
        no: '',
        length: '',
        widthBreadth: '',
        heightDepth: '',
        quantity: 0,
        unit: comp.unit || 'cu m',
        mixture: comp.mixture || '',
        labourRate: comp.labourRate || 0,
        category: comp.category || null, // Include category from AreaCalculation
        instruction: comp.instruction || '', // Include instruction from AreaCalculation
        isGroupHeader: true,
        isDeduction: false,
        groupIndex: index
      });
      
      // Add one default detail row
      initialData.push({
        srNo: '',
        component: '',
        no: 0,
        length: '',
        widthBreadth: '',
        heightDepth: '',
        quantity: '',
        unit: comp.unit || 'cu m',
        mixture: comp.mixture || '',
        isGroupHeader: false,
        isDeduction: false,
        groupIndex: index,
        parentSrNo: index + 1
      });
    });
    
    // Create completely new array reference
    const newData = JSON.parse(JSON.stringify(initialData)); // Deep clone
    setQuantityData(newData);
    
    // Calculate totals after data is loaded
    setTimeout(() => {
      componentsList.forEach((comp, index) => {
        updateGroupTotal(index);
      });
    }, 100);
  }, [updateGroupTotal]);

  // Get missing components for current floor
  const getMissingComponents = useCallback(() => {
    if (!localSelectedFloor) return [];
    
    const floorCategory = mapFloorName(localSelectedFloor);
    const allComps = allComponentsRef.current[floorCategory] || [];
    
    // Get currently added component names from quantityData
    const existingComponents = new Set();
    quantityData.forEach(row => {
      if (row.isGroupHeader && row.component) {
        existingComponents.add(row.component);
      }
    });
    
    // Filter out already added components and remove duplicates
    const seen = new Set();
    const uniqueComponents = [];
    
    allComps.forEach(comp => {
      if (!existingComponents.has(comp.component) && !seen.has(comp.component)) {
        seen.add(comp.component);
        uniqueComponents.push(comp);
      }
    });
    
    return uniqueComponents;
  }, [localSelectedFloor, quantityData, mapFloorName]);

  // Handle opening Add Component modal
  const handleOpenAddComponentModal = useCallback(() => {
    const missing = getMissingComponents();
    setAvailableComponents(missing);
    setSelectedComponent('');
    setShowAddComponentModal(true);
  }, [getMissingComponents]);

  // Handle adding selected component
  const handleAddComponent = useCallback(() => {
    if (!selectedComponent) {
      setAlertMessage({
        show: true,
        type: 'warning',
        message: 'Please select a component to add'
      });
      return;
    }
    
    // Find the selected component details
    const floorCategory = mapFloorName(localSelectedFloor);
    const allComps = allComponentsRef.current[floorCategory] || [];
    const componentToAdd = allComps.find(c => c.component === selectedComponent);
    
    if (!componentToAdd) return;
    
    // Find the correct position to insert based on AreaCalculation order
    const allCompNames = allComps.map(c => c.component);
    const targetIndex = allCompNames.indexOf(selectedComponent);
    
    // Find where to insert in quantityData
    let insertPosition = 0;
    const currentData = [...quantityData];
    
    // Get current group headers
    const existingGroupHeaders = currentData.filter(row => row.isGroupHeader);
    
    // Find insertion point
    for (let i = 0; i < existingGroupHeaders.length; i++) {
      const headerName = existingGroupHeaders[i].component;
      const headerIndexInAll = allCompNames.indexOf(headerName);
      
      if (headerIndexInAll > targetIndex) {
        // Insert before this group
        insertPosition = currentData.indexOf(existingGroupHeaders[i]);
        break;
      }
    }
    
    // If insertPosition is still 0, insert at the end
    if (insertPosition === 0 && existingGroupHeaders.length > 0) {
      insertPosition = currentData.length;
    }
    
    // Create new group header and detail row
    const newGroupIndex = existingGroupHeaders.length;
    const newSrNo = newGroupIndex + 1;
    
    const newGroupHeader = {
      srNo: newSrNo,
      component: componentToAdd.component,
      no: '',
      length: '',
      widthBreadth: '',
      heightDepth: '',
      quantity: 0,
      unit: componentToAdd.unit || 'cu m',
      mixture: componentToAdd.mixture || '',
      labourRate: componentToAdd.labourRate || 0,
      category: componentToAdd.category || null, // Include category
      instruction: componentToAdd.instruction || '', // Include instruction
      isGroupHeader: true,
      isDeduction: false,
      groupIndex: newGroupIndex
    };
    
    const newDetailRow = {
      srNo: '',
      component: '',
      no: 0,
      length: '',
      widthBreadth: '',
      heightDepth: '',
      quantity: '',
      unit: componentToAdd.unit || 'cu m',
      mixture: componentToAdd.mixture || '',
      isGroupHeader: false,
      isDeduction: false,
      groupIndex: newGroupIndex,
      parentSrNo: newSrNo
    };
    
    // Insert new rows
    currentData.splice(insertPosition, 0, newGroupHeader, newDetailRow);
    
    // Renumber all srNo and groupIndex
    let groupCounter = 0;
    currentData.forEach((row, idx) => {
      if (row.isGroupHeader) {
        groupCounter++;
        row.srNo = groupCounter;
        row.groupIndex = groupCounter - 1;
      } else {
        // Find parent group
        for (let i = idx - 1; i >= 0; i--) {
          if (currentData[i].isGroupHeader) {
            row.groupIndex = currentData[i].groupIndex;
            row.parentSrNo = currentData[i].srNo;
            break;
          }
        }
      }
    });
    
    // Update state
    setQuantityData(currentData);
    
    // Update cache
    if (localSelectedFloor && floorDataCache.current[localSelectedFloor]) {
      floorDataCache.current[localSelectedFloor].gridData = currentData;
    }
    
    setShowAddComponentModal(false);
    setSelectedComponent('');
    
    setAlertMessage({
      show: true,
      type: 'success',
      message: `Component "${selectedComponent}" added successfully`
    });
  }, [selectedComponent, quantityData, localSelectedFloor, mapFloorName]);

  // Save current material grid data to cache
  const saveCurrentMaterialDataToCache = useCallback((floorName) => {
    if (!floorName || floorName === '') return;
    
    const materialHotInstance = materialTableRef.current?.hotInstance;
    if (!materialHotInstance) {
      return;
    }
    
    const currentMaterialData = materialHotInstance.getSourceData();
    if (currentMaterialData && currentMaterialData.length > 0) {
      // Filter out grand total row before saving to cache
      const dataToCache = currentMaterialData.filter(row => !row.isGrandTotal);
      materialDataCache.current[floorName] = JSON.parse(JSON.stringify(dataToCache));
      // Mark this floor as having edited material data
      materialEditedFlags.current[floorName] = true;
    }
  }, []);

  // Save current grid data back to cache
  const saveCurrentFloorDataToCache = useCallback((floorName) => {
    if (!floorName || floorName === '') return;
    
    // Get current data from the table instance directly to avoid dependency on quantityData
    const hotInstance = quantityTableRef.current?.hotInstance;
    if (!hotInstance) {
      return;
    }
    
    const currentData = hotInstance.getSourceData();
    if (currentData && currentData.length > 0) {
      
      // Update cache with complete grid state
      floorDataCache.current[floorName] = {
        components: floorDataCache.current[floorName]?.components || [],
        gridData: JSON.parse(JSON.stringify(currentData)) // Store complete grid state
      };
    }
  }, []); // No dependencies - uses refs only

  // Handle opening Copy Floor modal
  const handleOpenCopyFloorModal = useCallback(() => {
    setCopySourceFloor('');
    setCopyTargetFloors([]); // Reset to empty array
    setShowCopyFloorModal(true);
  }, []);

  // Handle copying data from one floor to another
  const handleCopyFloorData = useCallback(() => {
    if (!copySourceFloor || !copyTargetFloors || copyTargetFloors.length === 0) {
      setAlertMessage({
        show: true,
        type: 'warning',
        message: 'Please select both source and target floor(s)'
      });
      return;
    }

    if (copyTargetFloors.includes(copySourceFloor)) {
      setAlertMessage({
        show: true,
        type: 'warning',
        message: 'Source floor cannot be in the target floors list'
      });
      return;
    }

    // Check if source floor has data
    const sourceCache = floorDataCache.current[copySourceFloor];
    if (!sourceCache || (!sourceCache.gridData || sourceCache.gridData.length === 0)) {
      setAlertMessage({
        show: true,
        type: 'warning',
        message: `No data found in ${copySourceFloor} to copy`
      });
      return;
    }

    // Check if any target floor has existing data
    const floorsWithData = copyTargetFloors.filter(floor => {
      const targetCache = floorDataCache.current[floor];
      return targetCache && targetCache.gridData && targetCache.gridData.length > 0;
    });

    // Show warning if any target has data
    if (floorsWithData.length > 0) {
      const confirmOverride = window.confirm(
        `Warning: The following floor(s) already have data:\n${floorsWithData.join(', ')}\n\nThis operation will override all existing data in the selected floor(s) with data from ${copySourceFloor}.\n\nDo you want to continue?`
      );
      
      if (!confirmOverride) {
        return;
      }
    }

    // Save current floor data before copying
    if (localSelectedFloor && localSelectedFloor !== '') {
      saveCurrentFloorDataToCache(localSelectedFloor);
      saveCurrentMaterialDataToCache(localSelectedFloor);
    }

    // Deep clone the source quantity data (Tab 1)
    const sourceGridData = JSON.parse(JSON.stringify(sourceCache.gridData));
    const sourceComponents = JSON.parse(JSON.stringify(sourceCache.components));

    // Copy to all selected target floors
    copyTargetFloors.forEach(targetFloor => {
      // Update target floor cache for quantity data
      floorDataCache.current[targetFloor] = {
        components: sourceComponents,
        gridData: sourceGridData
      };

      // Deep clone the source material data (Tab 2) if exists
      const sourceMaterialCache = materialDataCache.current[copySourceFloor];
      if (sourceMaterialCache && sourceMaterialCache.length > 0) {
        const sourceMaterialData = JSON.parse(JSON.stringify(sourceMaterialCache));
        materialDataCache.current[targetFloor] = sourceMaterialData;
      }

      // If we're copying to the current floor, refresh the display
      if (targetFloor === localSelectedFloor) {
        setQuantityData(sourceGridData);
        setMaterialCacheVersion(prev => prev + 1); // Refresh material grid if on Tab 2
      }
    });

    setShowCopyFloorModal(false);
    setCopySourceFloor('');
    setCopyTargetFloors([]);

    setAlertMessage({
      show: true,
      type: 'success',
      message: `Data copied successfully from ${copySourceFloor} to ${copyTargetFloors.join(', ')}`
    });
  }, [copySourceFloor, copyTargetFloors, localSelectedFloor, saveCurrentFloorDataToCache, saveCurrentMaterialDataToCache]);

  // Handle PDF generation for current floor
  const handlePDFCurrentFloor = useCallback(async () => {
    if (!localSelectedFloor) return;

    try {
      // Save current floor data to cache before generating PDF
      await saveCurrentFloorDataToCache();
      await saveCurrentMaterialDataToCache();

      setPdfFloors([localSelectedFloor]);
      setShowPdfModal(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error generating PDF: ${error.message}`
      });
    }
  }, [localSelectedFloor, saveCurrentFloorDataToCache, saveCurrentMaterialDataToCache]);

  // Handle PDF generation for all floors
  const handlePDFAllFloors = useCallback(async () => {
    try {
      // Save current floor data to cache before generating PDF
      await saveCurrentFloorDataToCache();
      await saveCurrentMaterialDataToCache();

      setPdfFloors(floors);
      setShowPdfModal(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error generating PDF: ${error.message}`
      });
    }
  }, [floors, saveCurrentFloorDataToCache, saveCurrentMaterialDataToCache]);

  // Handle Excel export for current floor
  const handleExcelCurrentFloor = useCallback(async () => {
    if (!localSelectedFloor) return;

    try {
      // Save current floor data to cache before generating Excel
      await saveCurrentFloorDataToCache();
      await saveCurrentMaterialDataToCache();

      const wb = XLSX.utils.book_new();
      const floorsToExport = [localSelectedFloor];
      
      floorsToExport.forEach(floorName => {
        const floorCache = floorDataCache.current?.[floorName];
        const materialCache = materialDataCache.current?.[floorName];
        
        let quantityData = [];
        if (Array.isArray(floorCache)) {
          quantityData = floorCache;
        } else if (floorCache && Array.isArray(floorCache.gridData)) {
          quantityData = floorCache.gridData;
        }

        let materialData = [];
        if (Array.isArray(materialCache)) {
          materialData = materialCache;
        } else if (materialCache && Array.isArray(materialCache.data)) {
          materialData = materialCache.data;
        }

        const componentDetails = quantityData.filter(row => 
          row && row.isGroupHeader && row.quantity != null && !isNaN(row.quantity) && parseFloat(row.quantity) > 0
        ) || [];
        
        const validMaterialData = materialData.filter(row => row && row.component) || [];

        // Build Excel data
        const excelData = [];
        
        // Component Details Section
        if (componentDetails.length > 0) {
          excelData.push(['Component Details']);
          excelData.push(['Component', 'Quantity', 'Unit']);
          componentDetails.forEach(row => {
            excelData.push([
              row.component || '',
              row.quantity != null && !isNaN(row.quantity) ? parseFloat(row.quantity).toFixed(2) : '',
              row.unit || ''
            ]);
          });
          excelData.push([]);
        }

        // Estimation Details Section
        if (validMaterialData.length > 0) {
          excelData.push(['Estimation Details']);
          excelData.push([
            'Component', 'Volume', 'Cons. Rate', 'Qty', 'Wastage %', 'Total Qty', 
            'Rate', 'Labour Rate', 'Material Amt', 'Labour Amt', `Total Amt (${currency})`
          ]);
          
          let grandTotal = { materialAmount: 0, labourAmount: 0, totalAmount: 0 };
          
          validMaterialData.forEach(row => {
            const isGroupHeader = row.isGroupHeader;
            const formatNum = (value) => value != null && !isNaN(value) ? parseFloat(value).toFixed(2) : '';
            
            excelData.push([
              row.component || '',
              isGroupHeader ? formatNum(row.volume) : '',
              !isGroupHeader ? formatNum(row.consumptionRate) : '',
              !isGroupHeader ? formatNum(row.materialQty) : '',
              !isGroupHeader ? formatNum(row.wastage) : '',
              !isGroupHeader ? formatNum(row.totalQty) : '',
              !isGroupHeader ? formatNum(row.materialRate) : '',
              isGroupHeader ? formatNum(row.labourRate) : '',
              formatNum(row.materialAmount),
              isGroupHeader ? formatNum(row.labourAmount) : '',
              formatNum(row.totalAmount)
            ]);
            
            grandTotal.materialAmount += parseFloat(row.materialAmount) || 0;
            grandTotal.totalAmount += parseFloat(row.totalAmount) || 0;
            if (isGroupHeader) {
              grandTotal.labourAmount += parseFloat(row.labourAmount) || 0;
            }
          });
          
          // Add Grand Total
          excelData.push([
            'Grand Total', '', '', '', '', '', '', '',
            grandTotal.materialAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            grandTotal.labourAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            grandTotal.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [
          { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, 
          { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
        ];
        
        // Apply styling
        let currentRow = 0;
        
        // Component Details section styling
        if (componentDetails.length > 0) {
          // Section header
          const sectionHeaderStyle = {
            font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "left", vertical: "center" }
          };
          ws[`A${currentRow + 1}`].s = sectionHeaderStyle;
          currentRow++;
          
          // Column headers
          const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
          ['A', 'B', 'C'].forEach(col => {
            const cell = `${col}${currentRow + 1}`;
            if (!ws[cell]) ws[cell] = {};
            ws[cell].s = headerStyle;
          });
          currentRow++;
          
          // Data rows
          componentDetails.forEach(() => {
            ['A', 'B', 'C'].forEach(col => {
              const cell = `${col}${currentRow + 1}`;
              if (!ws[cell]) ws[cell] = {};
              ws[cell].s = {
                alignment: { horizontal: col === 'A' ? 'left' : (col === 'B' ? 'right' : 'center'), vertical: 'center' },
                border: {
                  top: { style: "thin", color: { rgb: "000000" } },
                  bottom: { style: "thin", color: { rgb: "000000" } },
                  left: { style: "thin", color: { rgb: "000000" } },
                  right: { style: "thin", color: { rgb: "000000" } }
                }
              };
              if (col === 'B' && ws[cell].v != null) {
                ws[cell].z = '#,##0.00';
              }
            });
            currentRow++;
          });
          currentRow++; // Empty row
        }
        
        // Estimation Details section styling
        if (validMaterialData.length > 0) {
          // Section header
          const sectionHeaderStyle = {
            font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "left", vertical: "center" }
          };
          ws[`A${currentRow + 1}`].s = sectionHeaderStyle;
          currentRow++;
          
          // Column headers
          const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].forEach(col => {
            const cell = `${col}${currentRow + 1}`;
            if (!ws[cell]) ws[cell] = {};
            ws[cell].s = headerStyle;
          });
          currentRow++;
          
          // Data rows
          validMaterialData.forEach((row) => {
            const isGroupHeader = row.isGroupHeader;
            const rowStyle = isGroupHeader ? {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4A5568" } },
              alignment: { horizontal: "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            } : {
              alignment: { horizontal: "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
            
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].forEach(col => {
              const cell = `${col}${currentRow + 1}`;
              if (!ws[cell]) ws[cell] = {};
              ws[cell].s = {
                ...rowStyle,
                alignment: { 
                  horizontal: col === 'A' ? 'left' : 'right', 
                  vertical: 'center' 
                }
              };
              if (col !== 'A' && ws[cell].v != null && ws[cell].v !== '') {
                ws[cell].z = '#,##0.00';
              }
            });
            currentRow++;
          });
          
          // Grand Total row
          const grandTotalStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2D3748" } },
            alignment: { horizontal: "right", vertical: "center" },
            border: {
              top: { style: "medium", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
          
          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].forEach(col => {
            const cell = `${col}${currentRow + 1}`;
            if (!ws[cell]) ws[cell] = {};
            ws[cell].s = {
              ...grandTotalStyle,
              alignment: { 
                horizontal: col === 'A' ? 'left' : 'right', 
                vertical: 'center' 
              }
            };
          });
        }
        
        XLSX.utils.book_append_sheet(wb, ws, floorName.substring(0, 31));
      });

      XLSX.writeFile(wb, `BOQ_${localSelectedFloor}_${Date.now()}.xlsx`, { cellStyles: true });
      
      setAlertMessage({
        show: true,
        type: 'success',
        message: `Excel file generated successfully for ${localSelectedFloor}`
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error generating Excel: ${error.message}`
      });
    }
  }, [localSelectedFloor, saveCurrentFloorDataToCache, saveCurrentMaterialDataToCache, currency, floorDataCache, materialDataCache]);

  // Handle Excel export for all floors
  const handleExcelAllFloors = useCallback(async () => {
    try {
      // Save current floor data to cache before generating Excel
      await saveCurrentFloorDataToCache();
      await saveCurrentMaterialDataToCache();

      const wb = XLSX.utils.book_new();
      
      floors.forEach(floorName => {
        const floorCache = floorDataCache.current?.[floorName];
        const materialCache = materialDataCache.current?.[floorName];
        
        let quantityData = [];
        if (Array.isArray(floorCache)) {
          quantityData = floorCache;
        } else if (floorCache && Array.isArray(floorCache.gridData)) {
          quantityData = floorCache.gridData;
        }

        let materialData = [];
        if (Array.isArray(materialCache)) {
          materialData = materialCache;
        } else if (materialCache && Array.isArray(materialCache.data)) {
          materialData = materialCache.data;
        }

        const componentDetails = quantityData.filter(row => 
          row && row.isGroupHeader && row.quantity != null && !isNaN(row.quantity) && parseFloat(row.quantity) > 0
        ) || [];
        
        const validMaterialData = materialData.filter(row => row && row.component) || [];

        // Build Excel data
        const excelData = [];
        
        // Component Details Section
        if (componentDetails.length > 0) {
          excelData.push(['Component Details']);
          excelData.push(['Component', 'Quantity', 'Unit']);
          componentDetails.forEach(row => {
            excelData.push([
              row.component || '',
              row.quantity != null && !isNaN(row.quantity) ? parseFloat(row.quantity).toFixed(2) : '',
              row.unit || ''
            ]);
          });
          excelData.push([]);
        }

        // Estimation Details Section
        if (validMaterialData.length > 0) {
          excelData.push(['Estimation Details']);
          excelData.push([
            'Component', 'Volume', 'Cons. Rate', 'Qty', 'Wastage %', 'Total Qty', 
            'Rate', 'Labour Rate', 'Material Amt', 'Labour Amt', `Total Amt (${currency})`
          ]);
          
          let grandTotal = { materialAmount: 0, labourAmount: 0, totalAmount: 0 };
          
          validMaterialData.forEach(row => {
            const isGroupHeader = row.isGroupHeader;
            const formatNum = (value) => value != null && !isNaN(value) ? parseFloat(value).toFixed(2) : '';
            
            excelData.push([
              row.component || '',
              isGroupHeader ? formatNum(row.volume) : '',
              !isGroupHeader ? formatNum(row.consumptionRate) : '',
              !isGroupHeader ? formatNum(row.materialQty) : '',
              !isGroupHeader ? formatNum(row.wastage) : '',
              !isGroupHeader ? formatNum(row.totalQty) : '',
              !isGroupHeader ? formatNum(row.materialRate) : '',
              isGroupHeader ? formatNum(row.labourRate) : '',
              formatNum(row.materialAmount),
              isGroupHeader ? formatNum(row.labourAmount) : '',
              formatNum(row.totalAmount)
            ]);
            
            grandTotal.materialAmount += parseFloat(row.materialAmount) || 0;
            grandTotal.totalAmount += parseFloat(row.totalAmount) || 0;
            if (isGroupHeader) {
              grandTotal.labourAmount += parseFloat(row.labourAmount) || 0;
            }
          });
          
          // Add Grand Total
          excelData.push([
            'Grand Total', '', '', '', '', '', '', '',
            grandTotal.materialAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            grandTotal.labourAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            grandTotal.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ]);
        }

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [
          { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, 
          { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
        ];
        
        // Apply styling
        let currentRow = 0;
        
        // Component Details section styling
        if (componentDetails.length > 0) {
          // Section header
          const sectionHeaderStyle = {
            font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "left", vertical: "center" }
          };
          ws[`A${currentRow + 1}`].s = sectionHeaderStyle;
          currentRow++;
          
          // Column headers
          const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
          ['A', 'B', 'C'].forEach(col => {
            const cell = `${col}${currentRow + 1}`;
            if (!ws[cell]) ws[cell] = {};
            ws[cell].s = headerStyle;
          });
          currentRow++;
          
          // Data rows
          componentDetails.forEach(() => {
            ['A', 'B', 'C'].forEach(col => {
              const cell = `${col}${currentRow + 1}`;
              if (!ws[cell]) ws[cell] = {};
              ws[cell].s = {
                alignment: { horizontal: col === 'A' ? 'left' : (col === 'B' ? 'right' : 'center'), vertical: 'center' },
                border: {
                  top: { style: "thin", color: { rgb: "000000" } },
                  bottom: { style: "thin", color: { rgb: "000000" } },
                  left: { style: "thin", color: { rgb: "000000" } },
                  right: { style: "thin", color: { rgb: "000000" } }
                }
              };
              if (col === 'B' && ws[cell].v != null) {
                ws[cell].z = '#,##0.00';
              }
            });
            currentRow++;
          });
          currentRow++; // Empty row
        }
        
        // Estimation Details section styling
        if (validMaterialData.length > 0) {
          // Section header
          const sectionHeaderStyle = {
            font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "left", vertical: "center" }
          };
          ws[`A${currentRow + 1}`].s = sectionHeaderStyle;
          currentRow++;
          
          // Column headers
          const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].forEach(col => {
            const cell = `${col}${currentRow + 1}`;
            if (!ws[cell]) ws[cell] = {};
            ws[cell].s = headerStyle;
          });
          currentRow++;
          
          // Data rows
          validMaterialData.forEach((row) => {
            const isGroupHeader = row.isGroupHeader;
            const rowStyle = isGroupHeader ? {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4A5568" } },
              alignment: { horizontal: "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            } : {
              alignment: { horizontal: "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
            
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].forEach(col => {
              const cell = `${col}${currentRow + 1}`;
              if (!ws[cell]) ws[cell] = {};
              ws[cell].s = {
                ...rowStyle,
                alignment: { 
                  horizontal: col === 'A' ? 'left' : 'right', 
                  vertical: 'center' 
                }
              };
              if (col !== 'A' && ws[cell].v != null && ws[cell].v !== '') {
                ws[cell].z = '#,##0.00';
              }
            });
            currentRow++;
          });
          
          // Grand Total row
          const grandTotalStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2D3748" } },
            alignment: { horizontal: "right", vertical: "center" },
            border: {
              top: { style: "medium", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
          
          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].forEach(col => {
            const cell = `${col}${currentRow + 1}`;
            if (!ws[cell]) ws[cell] = {};
            ws[cell].s = {
              ...grandTotalStyle,
              alignment: { 
                horizontal: col === 'A' ? 'left' : 'right', 
                vertical: 'center' 
              }
            };
          });
        }
        
        XLSX.utils.book_append_sheet(wb, ws, floorName.substring(0, 31));
      });

      XLSX.writeFile(wb, `BOQ_All_Floors_${Date.now()}.xlsx`, { cellStyles: true });
      
      setAlertMessage({
        show: true,
        type: 'success',
        message: 'Excel file generated successfully for all floors'
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error generating Excel: ${error.message}`
      });
    }
  }, [floors, saveCurrentFloorDataToCache, saveCurrentMaterialDataToCache, currency, floorDataCache, materialDataCache]);

  const loadComponentsForFloor = useCallback(async (floor) => {
    try {
      
      // Check cache first
      if (floorDataCache.current[floor]) {
        const cachedData = floorDataCache.current[floor];
        
        // Check if cached data has gridData (user modified) or just components (fresh from DB)
        if (cachedData.gridData && Array.isArray(cachedData.gridData) && cachedData.gridData.length > 0) {
          const gridData = JSON.parse(JSON.stringify(cachedData.gridData));
          setQuantityData(gridData);
        } else if (cachedData.components) {
          initializeQuantityData(cachedData.components);
        } else if (Array.isArray(cachedData)) {
          // Old format - just component list
          initializeQuantityData(cachedData);
        } else {
          // No valid data - set to null to prevent rendering
          setQuantityData(null);
        }
        
        setLoadingData(false);
        return;
      }
      
      // If cache miss, load default data from AreaCalculation API
      try {
        const floorCategory = mapFloorName(floor);
        const defaultComponents = allComponentsRef.current[floorCategory];
        
        if (defaultComponents && defaultComponents.length > 0) {
          // Use the default components from AreaCalculation
          floorDataCache.current[floor] = {
            components: defaultComponents,
            gridData: null
          };
          
          initializeQuantityData(defaultComponents);
          setLoadingData(false);
          
          setAlertMessage({
            show: true,
            type: 'info',
            message: `Loaded default components for ${floor}. You can now add quantities.`
          });
          return;
        }
      } catch (error) {
        console.error('Error loading default components:', error);
      }
      
      // If still no data found, show warning
      setAlertMessage({
        show: true,
        type: 'warning',
        message: `Data not found in cache for ${floor}. Please refresh the page.`
      });
      setLoadingData(false);
    } catch (error) {
      setLoadingData(false);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error loading components: ${error.message}`
      });
    }
  }, [initializeQuantityData, mapFloorName]);

  useEffect(() => {
    loadEstimations();
    loadGradeOptions();
    loadMaterialItems();
    loadIndirectExpenseConfig();
  }, [loadEstimations, loadGradeOptions, loadMaterialItems, loadIndirectExpenseConfig]);

  // Load currency from localStorage
  useEffect(() => {
    const companyCurrency = localStorage.getItem('companyCurrency');
    if (companyCurrency) {
      setCurrency(companyCurrency);
    }
  }, []);

  // Load all floors data on initial mount when estimationMasterId is available
  useEffect(() => {
    if (estimationMasterId && floorsList && floorsList.length > 0 && !initialLoadDone.current) {
      initialLoadDone.current = true;
      
      loadAllFloorsData(estimationMasterId).then(() => {
        // After loading quantity data, also load material data
        loadMaterialDataFromAPI(estimationMasterId);
        
        // Don't auto-select floor - let user choose manually
        // if (!floorInitializedRef.current) {
        //   setLocalSelectedFloor('Foundation');
        //   floorInitializedRef.current = true;
        // }
      });
    }
  }, [estimationMasterId, floorsList, loadAllFloorsData, loadMaterialDataFromAPI]);

  // Initialize floors list from parent
  useEffect(() => {
    if (floorsList && floorsList.length > 0) {
      setFloors(floorsList);
    }
  }, [floorsList]);

  // Load data when localSelectedFloor changes (from cache)
  useEffect(() => {
    // Save previous floor's data to cache before switching
    if (previousFloorRef.current && previousFloorRef.current !== '' && previousFloorRef.current !== localSelectedFloor) {
      saveCurrentFloorDataToCache(previousFloorRef.current);
      saveCurrentMaterialDataToCache(previousFloorRef.current); // Also save material data
    }
    
    if (localSelectedFloor && localSelectedFloor !== '' && Object.keys(floorDataCache.current).length > 0) {
      setLoadingData(true);
      loadComponentsForFloor(localSelectedFloor);
      previousFloorRef.current = localSelectedFloor; // Update previous floor reference
    } else if (localSelectedFloor === '') {
      // Clear the table when "Select Floor" is chosen
      setQuantityData(null); // Use null instead of [] to prevent rendering
      setMaterialData(null); // Use null instead of [] to prevent rendering
      setLoadingData(false);
      previousFloorRef.current = '';
    }
  }, [localSelectedFloor, loadComponentsForFloor, saveCurrentFloorDataToCache, saveCurrentMaterialDataToCache]);

  // Function to get all cached data for saving
  const getAllCachedDataForSave = useCallback(() => {
    // Save current floor data first (both quantity and material)
    if (localSelectedFloor && localSelectedFloor !== '') {
      saveCurrentFloorDataToCache(localSelectedFloor);
      saveCurrentMaterialDataToCache(localSelectedFloor);
    }
    
    const allFloorsData = [];
    
    Object.keys(floorDataCache.current).forEach(floorName => {
      const floorCache = floorDataCache.current[floorName];
      const gridData = floorCache.gridData || [];
      const components = floorCache.components || [];
      
      // Extract component data from grid if it exists, otherwise use components
      const floorComponents = {};
      
      if (gridData.length > 0) {
        // Has user edits - extract from grid
        gridData.forEach(row => {
          if (row.isGroupHeader && row.component) {
            // Initialize component with basic info including total quantity and category
            floorComponents[row.component] = {
              Unit: row.unit || 'cu m',
              Mixture: row.mixture || '',
              Category: row.category || '',  // Use category from grid data
              Labour: 'yes',
              Material: 'yes',
              TotalQuantity: row.quantity || 0,  // Add total quantity from group header
              rows: []
            };
          } else if (!row.isGroupHeader && row.groupIndex !== undefined) {
            // Find the component name from header row
            const headerRow = gridData.find(r => r.isGroupHeader && r.groupIndex === row.groupIndex);
            if (headerRow && headerRow.component) {
              if (!floorComponents[headerRow.component].rows) {
                floorComponents[headerRow.component].rows = [];
              }
              floorComponents[headerRow.component].rows.push({
                childComponent: row.component || '',  // Add child component name
                no: row.no || 0,
                length: row.length || 0,
                widthBreadth: row.widthBreadth || 0,
                heightDepth: row.heightDepth || 0,
                quantity: row.quantity || 0,
                isDeduction: row.isDeduction || false
              });
            }
          }
        });
      } else {
        // No user edits yet - use component structure with empty rows
        components.forEach(comp => {
          floorComponents[comp.component] = {
            Unit: comp.unit || 'cu m',
            Mixture: comp.mixture || '',
            Category: comp.category || '',  // Use category from components
            Labour: 'yes',
            Material: 'yes',
            rows: []
          };
        });
      }
      
      allFloorsData.push({
        floorName: floorName,
        estimationMasterId: estimationMasterId,
        components: floorComponents
      });
    });
    
    return allFloorsData;
  }, [localSelectedFloor, estimationMasterId, saveCurrentFloorDataToCache, saveCurrentMaterialDataToCache]);

  // Function to get all cached material data for saving
  const getAllMaterialDataForSave = useCallback(() => {
    
    // Save current floor material data first
    if (localSelectedFloor && localSelectedFloor !== '') {
      saveCurrentMaterialDataToCache(localSelectedFloor);
    }
    
    const allFloorsMaterialData = [];
    
    // First, try to use edited material data from materialDataCache
    // If not available, generate from quantity data in floorDataCache
    
    const floorsToProcess = new Set([
      ...Object.keys(materialDataCache.current),
      ...Object.keys(floorDataCache.current)
    ]);
    
    floorsToProcess.forEach(floorName => {

      
      // Check if we have edited material data for this floor
      if (materialDataCache.current[floorName] && materialDataCache.current[floorName].length > 0) {

        const materialGridData = materialDataCache.current[floorName];
        
        // Convert grid data to API format
        const materialComponents = {};
        
        materialGridData.forEach(row => {
          // Skip grand total rows
          if (row.isGrandTotal) return;
          
          if (row.isGroupHeader) {
            materialComponents[row.component] = {
              volume: row.volume || 0,
              unit: row.unit || 'Cum',
              labourRate: row.labourRate || 0,
              labourAmount: row.labourAmount || 0,
              materialAmount: row.materialAmount || 0,
              totalAmount: row.totalAmount || 0,
              Category: row.category || '',
              remarks: row.remarks || '',
              materials: []
            };
          } else {
            // Find parent component
            const parentComponent = Object.keys(materialComponents).pop();
            if (parentComponent && materialComponents[parentComponent]) {
              materialComponents[parentComponent].materials.push({
                materialId: row.materialId || '',
                material: row.component || '',
                consumptionRate: row.consumptionRate || 0,
                materialQty: row.materialQty || 0,
                wastage: row.wastage || 0,
                totalQty: row.totalQty || 0,
                uom: row.uom || '',
                materialRate: row.materialRate || 0,
                materialAmount: row.materialAmount || 0,
                totalAmount: row.totalAmount || 0,
                remarks: row.remarks || ''
              });
            }
          }
        });
        
        const floorDataObject = {
          floorName: floorName,
          estimationMasterId: estimationMasterId,
          components: materialComponents
        };

        // Add Expense data if available for this floor
        if (indirectExpenseCache.current[floorName]) {
          const indirectExpenseData = indirectExpenseCache.current[floorName];
          const expenseObject = {};
          
          if (indirectExpenseData.expenses && indirectExpenseData.expenses.length > 0) {
            indirectExpenseData.expenses.forEach(exp => {
              expenseObject[exp.expenseHead] = {
                allocationPercent: exp.allocationPercent,
                amount: exp.amount
              };
            });
            
            floorDataObject.Expense = expenseObject;
          }
        }

        allFloorsMaterialData.push(floorDataObject);
        
        return; // Skip to next floor
      }
      
      // If no edited material data, generate from quantity data
      const floorCache = floorDataCache.current[floorName];
      if (!floorCache) {

        return;
      }
      
      const gridData = floorCache.gridData || [];
      

      
      if (gridData.length === 0) return;
      
      // Generate material data from this floor's quantity data
      const floorMaterialData = [];
      
      gridData.forEach((row) => {
        if (row.isGroupHeader) {

          const volumeQty = parseFloat(row.quantity) || 0;
          
          // Skip if volume is 0 or less
          if (volumeQty <= 0) {
            return;
          }
          
          // Check if this component has mixture (RCC work) or not (earth work, etc.)
          if (row.mixture) {
            // RCC component with material breakdown
            const mixture = row.mixture;
            const matchingConfig = rccConfigData.find(config => 
              config.grade && config.grade.toLowerCase() === mixture.toLowerCase()
            );
            
            if (matchingConfig) {
              const labourRateValue = parseFloat(row.labourRate) || 0;
              const labourAmountValue = (volumeQty * labourRateValue).toFixed(2);
              
              // Calculate material amounts for all child materials first
              const materials = [
                { name: 'Cement', data: matchingConfig.cement },
                { name: 'Steel', data: matchingConfig.steel },
                { name: 'Sand', data: matchingConfig.sand },
                { name: 'Aggregate 20mm', data: matchingConfig.aggregate_20mm },
                { name: 'Aggregate 40mm', data: matchingConfig.aggregate_40mm },
                { name: 'Water', data: matchingConfig.water },
                { name: 'Bricks', data: matchingConfig.bricks }
              ];
              
              let totalMaterialAmount = 0;
              const materialRowsForGroup = [];
              
              materials.forEach(material => {
                if (material.data && material.data.quantity) {
                  const matQty = parseFloat(material.data.quantity) || 0;
                  const materialQty = (volumeQty * matQty).toFixed(2);
                  const wastage = parseFloat(material.data.wastage) || 0;
                  const totalQty = (parseFloat(materialQty) * (1 + wastage / 100)).toFixed(2);
                  
                  const materialName = material.data.material || material.name;
                  const defaultRate = parseFloat(material.data.defaultRate) || 0;
                  
                  const materialAmt = parseFloat(totalQty * defaultRate);
                  totalMaterialAmount += materialAmt;
                  
                  materialRowsForGroup.push({
                    material: materialName,
                    consumptionRate: matQty,
                    materialQty: parseFloat(materialQty),
                    wastage: wastage,
                    totalQty: parseFloat(totalQty),
                    uom: material.data.unit || 'KG',
                    materialRate: defaultRate,
                    materialAmount: materialAmt.toFixed(2),
                    totalAmount: materialAmt.toFixed(2)
                  });
                }
              });
              
              // Add group header row with calculated total material amount
              const groupTotalAmount = totalMaterialAmount + parseFloat(labourAmountValue);
              
              floorMaterialData.push({
                component: row.component,
                category: row.category || '',
                volume: parseFloat(volumeQty.toFixed(2)),
                unit: 'Cum',
                labourRate: labourRateValue,
                labourAmount: parseFloat(labourAmountValue),
                materialAmount: parseFloat(totalMaterialAmount.toFixed(2)),
                totalAmount: parseFloat(groupTotalAmount.toFixed(2)),
                materials: materialRowsForGroup,
                isGroupHeader: true
              });
            }
          } else {
            // Non-RCC component (Earth Excavation, Backfilling, etc.) - show only labour
            const labourRateValue = parseFloat(row.labourRate) || 0;
            const labourAmountValue = parseFloat((volumeQty * labourRateValue).toFixed(2));
            const totalAmountValue = labourAmountValue;
            
            floorMaterialData.push({
              component: row.component,
              category: row.category || '',
              volume: parseFloat(volumeQty.toFixed(2)),
              unit: row.unit || 'Cum',
              labourRate: labourRateValue,
              labourAmount: labourAmountValue,
              materialAmount: 0,
              totalAmount: totalAmountValue,
              materials: [],
              isGroupHeader: true
            });
          }
        }
      });
      
      if (floorMaterialData.length === 0) return;
      
      // Group materials by component for API format
      const materialComponents = {};
      
      floorMaterialData.forEach(row => {
        // Skip grand total rows
        if (row.isGrandTotal) return;
        
        if (row.isGroupHeader) {
          materialComponents[row.component] = {
            volume: row.volume || 0,
            unit: row.unit || 'Cum',
            labourRate: row.labourRate || 0,
            labourAmount: row.labourAmount || 0,
            materialAmount: row.materialAmount || 0,
            totalAmount: row.totalAmount || 0,
            Category: row.category || '',
            remarks: row.remarks || '',
            materials: row.materials || []
          };
        }
      });
      
      const floorDataObject = {
        floorName: floorName,
        estimationMasterId: estimationMasterId,
        components: materialComponents
      };

      // Add Expense data if available for this floor
      if (indirectExpenseCache.current[floorName]) {
        const indirectExpenseData = indirectExpenseCache.current[floorName];
        const expenseObject = {};
        
        if (indirectExpenseData.expenses && indirectExpenseData.expenses.length > 0) {
          indirectExpenseData.expenses.forEach(exp => {
            expenseObject[exp.expenseHead] = {
              allocationPercent: exp.allocationPercent,
              amount: exp.amount
            };
          });
          
          floorDataObject.Expense = expenseObject;
        }
      }

      allFloorsMaterialData.push(floorDataObject);
    });
    
    return allFloorsMaterialData;
  }, [localSelectedFloor, estimationMasterId, saveCurrentMaterialDataToCache, rccConfigData]);

  // Function to calculate indirect expenses based on material data and allocation percentages
  const calculateIndirectExpenses = useCallback(() => {
    if (!indirectExpenseConfig || !materialDataCache.current || !floors || floors.length === 0) {
      return;
    }

    const indirectExpenseByFloor = {};

    floors.forEach(floorName => {
      // Skip if this floor already has expense data loaded from DB
      if (indirectExpenseCache.current[floorName] && 
          indirectExpenseCache.current[floorName].expenses && 
          indirectExpenseCache.current[floorName].expenses.length > 0) {
        // Keep existing DB data
        indirectExpenseByFloor[floorName] = indirectExpenseCache.current[floorName];
        return;
      }

      const materialData = materialDataCache.current[floorName];
      if (!materialData || !Array.isArray(materialData) || materialData.length === 0) {
        return;
      }

      // Calculate total amount for this floor
      let floorTotalAmount = 0;
      materialData.forEach(row => {
        if (row.isGroupHeader && !row.isGrandTotal) {
          floorTotalAmount += parseFloat(row.totalAmount) || 0;
        }
      });

      // Determine which allocation to use (Foundation, Basement, or Floors)
      let allocationArray = null;
      if (floorName === 'Foundation' && indirectExpenseConfig.Foundation) {
        allocationArray = indirectExpenseConfig.Foundation;
      } else if (floorName === 'Basement' && indirectExpenseConfig.Basement) {
        allocationArray = indirectExpenseConfig.Basement;
      } else if (indirectExpenseConfig.Floors) {
        // All other floors use the "Floors" allocation
        allocationArray = indirectExpenseConfig.Floors;
      }

      if (!allocationArray || !Array.isArray(allocationArray)) {
        return;
      }

      // Calculate amount for each expense head
      const expenseRows = allocationArray.map(expense => {
        const allocationPercent = parseFloat(expense.allocationPercent) || 0;
        const amount = (floorTotalAmount * allocationPercent) / 100;

        return {
          expenseHead: expense.head,
          allocationPercent: allocationPercent,
          amount: parseFloat(amount.toFixed(2))
        };
      });

      // Calculate total indirect expense for this floor
      const totalIndirectExpense = expenseRows.reduce((sum, row) => sum + row.amount, 0);

      indirectExpenseByFloor[floorName] = {
        floorTotalAmount: parseFloat(floorTotalAmount.toFixed(2)),
        expenses: expenseRows,
        totalIndirectExpense: parseFloat(totalIndirectExpense.toFixed(2)),
        grandTotal: parseFloat((floorTotalAmount + totalIndirectExpense).toFixed(2))
      };
    });

    // Store in cache
    indirectExpenseCache.current = indirectExpenseByFloor;

    // If current floor is selected, update the display data
    if (localSelectedFloor && indirectExpenseByFloor[localSelectedFloor]) {
      const floorData = indirectExpenseByFloor[localSelectedFloor];
      setIndirectExpenseData(floorData.expenses);
    }
  }, [indirectExpenseConfig, floors, localSelectedFloor]);

  // Recalculate indirect expenses when material data or config changes
  useEffect(() => {
    if (materialCacheVersion > 0 && indirectExpenseConfig) {
      calculateIndirectExpenses();
    }
  }, [materialCacheVersion, indirectExpenseConfig, calculateIndirectExpenses]);

  // Update indirect expense data when floor changes
  useEffect(() => {
    if (localSelectedFloor && indirectExpenseCache.current[localSelectedFloor]) {
      const floorData = indirectExpenseCache.current[localSelectedFloor];
      setIndirectExpenseData(floorData.expenses);
    } else {
      setIndirectExpenseData(null);
    }
  }, [localSelectedFloor]);

  // Handle indirect expense changes
  const handleIndirectExpenseChange = useCallback((changes, source) => {
    if (!changes || source === 'loadData') return;

    const hotInstance = indirectExpenseTableRef.current?.hotInstance;
    if (!hotInstance || !localSelectedFloor) return;

    const floorData = indirectExpenseCache.current[localSelectedFloor];
    if (!floorData) return;

    const floorTotalAmount = floorData.floorTotalAmount;

    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (prop === 'allocationPercent' && newValue !== oldValue) {
        const newPercent = parseFloat(newValue) || 0;
        const newAmount = (floorTotalAmount * newPercent) / 100;
        
        // Update the amount in the table
        hotInstance.setDataAtRowProp(row, 'amount', parseFloat(newAmount.toFixed(2)), 'internal');
        
        // Update cache
        const sourceData = hotInstance.getSourceData();
        const updatedExpenses = sourceData.map(rowData => ({
          expenseHead: rowData.expenseHead,
          allocationPercent: parseFloat(rowData.allocationPercent) || 0,
          amount: parseFloat(rowData.amount) || 0
        }));

        const totalIndirectExpense = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const grandTotal = floorTotalAmount + totalIndirectExpense;

        indirectExpenseCache.current[localSelectedFloor] = {
          floorTotalAmount: floorTotalAmount,
          expenses: updatedExpenses,
          totalIndirectExpense: parseFloat(totalIndirectExpense.toFixed(2)),
          grandTotal: parseFloat(grandTotal.toFixed(2))
        };

        // Update state to refresh summary cards
        setIndirectExpenseData([...updatedExpenses]);
      }
    });
  }, [localSelectedFloor]);

  // Function to get all indirect expense data for save
  // Function to clear cache and reload data (to be called after save)
  const refreshDataFromDatabase = useCallback(() => {
    floorDataCache.current = {};
    materialDataCache.current = {};
    indirectExpenseCache.current = {};
    initialLoadDone.current = false;
    if (estimationMasterId && floorsList && floorsList.length > 0) {
      loadAllFloorsData(estimationMasterId).then(() => {
        // After loading quantity data, also reload material data
        loadMaterialDataFromAPI(estimationMasterId);
        
        if (localSelectedFloor) {
          setLoadingData(true);
          loadComponentsForFloor(localSelectedFloor);
        }
      });
    }
  }, [estimationMasterId, floorsList, loadAllFloorsData, loadMaterialDataFromAPI, localSelectedFloor, loadComponentsForFloor]);

  // Expose the save function to parent via window globals
  useEffect(() => {
    // Always expose the functions to parent
    window.BOQEstimation_getAllCachedData = getAllCachedDataForSave;
    window.BOQEstimation_getAllMaterialData = getAllMaterialDataForSave;
    window.BOQEstimation_refreshData = refreshDataFromDatabase;
    
    // Cleanup on unmount
    return () => {
      delete window.BOQEstimation_getAllCachedData;
      delete window.BOQEstimation_getAllMaterialData;
      delete window.BOQEstimation_refreshData;
    };
  }, [getAllCachedDataForSave, getAllMaterialDataForSave, refreshDataFromDatabase]);

  const addRowToGroup = useCallback((groupIndex) => {
    const hotInstance = quantityTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const newData = [...quantityData];
    
    // Find the last detail row position for this group
    let insertIndex = newData.length;
    for (let i = 0; i < newData.length; i++) {
      if (newData[i].groupIndex === groupIndex && !newData[i].isGroupHeader) {
        insertIndex = i + 1;
      } else if (newData[i].groupIndex > groupIndex) {
        break;
      }
    }
    
    const parentSrNo = newData.find(row => row.isGroupHeader && row.groupIndex === groupIndex)?.srNo;
    const groupHeaderRow = newData.find(row => row.isGroupHeader && row.groupIndex === groupIndex);
    
    // Insert new row after last detail row
    newData.splice(insertIndex, 0, {
      srNo: '',
      component: '',
      no: 9,
      length: '',
      widthBreadth: '',
      heightDepth: '',
      quantity: '',
      unit: 'cu m',
      mixture: groupHeaderRow?.mixture || '',
      isGroupHeader: false,
      isDeduction: false,
      groupIndex: groupIndex,
      parentSrNo: parentSrNo
    });
    
    // Preserve scroll position
    const scrollTop = hotInstance.rootElement?.querySelector('.wtHolder')?.scrollTop || 0;
    const scrollLeft = hotInstance.rootElement?.querySelector('.wtHolder')?.scrollLeft || 0;
    
    // Update data without losing scroll
    hotInstance.loadData(newData);
    setQuantityData(newData);
    
    // Restore scroll position immediately after loadData
    requestAnimationFrame(() => {
      const holder = hotInstance.rootElement?.querySelector('.wtHolder');
      if (holder) {
        holder.scrollTop = scrollTop;
        holder.scrollLeft = scrollLeft;
      }
    });
  }, [quantityData]);

  const calculateQuantity = (row, col, value) => {
    const hotInstance = quantityTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const rowData = hotInstance.getSourceDataAtRow(row);
    if (rowData && !rowData.isGroupHeader) {
      const no = parseFloat(rowData.no) || 0;
      const length = parseFloat(rowData.length) || 0;
      const width = parseFloat(rowData.widthBreadth) || 0;
      const height = parseFloat(rowData.heightDepth) || 0;
      
      const quantity = no * length * width * height;
      hotInstance.setDataAtRowProp(row, 'quantity', quantity.toFixed(2));
    }
  };

  // eslint-disable-next-line no-unused-vars
  const deleteRow = (rowIndex) => {
    const hotInstance = quantityTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const rowData = hotInstance.getSourceDataAtRow(rowIndex);
    if (!rowData || rowData.isGroupHeader) return;
    
    if (window.confirm('Delete this row?')) {
      const groupIndex = rowData.groupIndex;
      
      // Use Handsontable's built-in alter method to remove the row
      hotInstance.alter('remove_row', rowIndex, 1);
      
      // Get updated data and sync state
      setTimeout(() => {
        const updatedData = hotInstance.getSourceData();
        setQuantityData(updatedData);
        updateGroupTotal(groupIndex);
      }, 100);
    }
  };

  const toggleDeduction = useCallback((rowIndex) => {
    const hotInstance = quantityTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const rowData = hotInstance.getSourceDataAtRow(rowIndex);
    if (!rowData || rowData.isGroupHeader) return;
    
    const groupIndex = rowData.groupIndex;
    
    // Toggle the deduction flag
    hotInstance.setDataAtRowProp(rowIndex, 'isDeduction', !rowData.isDeduction);
    
    // Update state and recalculate total
    setTimeout(() => {
      const updatedData = hotInstance.getSourceData();
      setQuantityData(updatedData);
      updateGroupTotal(groupIndex);
    }, 50);
  }, [updateGroupTotal]);

  const deleteGroup = useCallback((groupIndex) => {
    const hotInstance = quantityTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const currentData = hotInstance.getSourceData();
    
    // Find the group header
    const groupHeader = currentData.find(row => row.isGroupHeader && row.groupIndex === groupIndex);
    if (!groupHeader) return;
    
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${groupHeader.component}" and all its associated rows?`
    );
    
    if (!confirmDelete) return;
    
    // Filter out the group header and all child rows
    const updatedData = currentData.filter(row => row.groupIndex !== groupIndex);
    
    // Renumber remaining groups
    let groupCounter = 0;
    updatedData.forEach((row, idx) => {
      if (row.isGroupHeader) {
        groupCounter++;
        row.srNo = groupCounter;
        row.groupIndex = groupCounter - 1;
      } else {
        // Find parent group for child rows
        for (let i = idx - 1; i >= 0; i--) {
          if (updatedData[i].isGroupHeader) {
            row.groupIndex = updatedData[i].groupIndex;
            row.parentSrNo = updatedData[i].srNo;
            break;
          }
        }
      }
    });
    
    // Update state
    setQuantityData(updatedData);
    
    // Update cache
    if (localSelectedFloor && floorDataCache.current[localSelectedFloor]) {
      floorDataCache.current[localSelectedFloor].gridData = updatedData;
    }
    
    setAlertMessage({
      show: true,
      type: 'success',
      message: `Component "${groupHeader.component}" deleted successfully`
    });
  }, [localSelectedFloor]);

  // Expose rccConfigData to window for Handsontable renderer tooltip
  useEffect(() => {
    window.BOQ_rccConfigData = rccConfigData;
    return () => {
      delete window.BOQ_rccConfigData;
    };
  }, [rccConfigData]);

  // Generate material data for a specific floor from its quantity data
  const generateMaterialDataForFloor = useCallback((floorQuantityData) => {
    const materialRows = [];
    
    if (!floorQuantityData || floorQuantityData.length === 0) {
      return null; // Return null to prevent table rendering
    }
    
    if (!rccConfigData || rccConfigData.length === 0) {
      return null; // Return null to prevent table rendering
    }
    
    // Process each group row from floorQuantityData
    floorQuantityData.forEach((row, index) => {
      if (row.isGroupHeader) {
        
        const volumeQty = parseFloat(row.quantity) || 0;
        
        // Skip if volume is 0 or less
        if (volumeQty <= 0) {
          return;
        }
        
        // Check if this component has mixture (RCC work) or not (earth work, etc.)
        if (row.mixture) {
          // RCC component with material breakdown
          const mixture = row.mixture;
          const matchingConfig = rccConfigData.find(config => 
            config.grade && config.grade.toLowerCase() === mixture.toLowerCase()
          );
          
          if (matchingConfig) {
            const labourRateValue = parseFloat(row.labourRate) || 0;
            const labourAmountValue = (volumeQty * labourRateValue).toFixed(2);
            
            // Calculate material amounts for all child materials first
            const materials = [
              { name: 'Cement', data: matchingConfig.cement },
              { name: 'Steel', data: matchingConfig.steel },
              { name: 'Sand', data: matchingConfig.sand },
              { name: 'Aggregate 20mm', data: matchingConfig.aggregate_20mm },
              { name: 'Aggregate 40mm', data: matchingConfig.aggregate_40mm },
              { name: 'Water', data: matchingConfig.water },
              { name: 'Bricks', data: matchingConfig.bricks }
            ];
            
            let totalMaterialAmount = 0;
            const childMaterials = [];
            
            materials.forEach(material => {
              if (material.data && material.data.quantity) {
                const matQty = parseFloat(material.data.quantity) || 0;
                const materialQty = (volumeQty * matQty).toFixed(2);
                const wastage = parseFloat(material.data.wastage) || 0;
                const totalQty = (parseFloat(materialQty) * (1 + wastage / 100)).toFixed(2);
                
                const materialName = material.data.material || material.name;
                const materialId = material.data._id || material.data.materialId || '';
                const defaultRate = parseFloat(material.data.defaultRate) || 0;
                
                const materialAmt = parseFloat(totalQty * defaultRate);
                totalMaterialAmount += materialAmt;
                
                childMaterials.push({
                  component: materialName,
                  materialId: materialId,
                  volume: '',
                  unit: '',
                  consumptionRate: matQty,
                  materialQty: parseFloat(materialQty),
                  wastage: wastage,
                  totalQty: parseFloat(totalQty),
                  uom: material.data.unit || 'KG',
                  materialRate: defaultRate,
                  labourRate: '',
                  materialAmount: materialAmt.toFixed(2),
                  labourAmount: '',
                  totalAmount: materialAmt.toFixed(2),
                  remarks: '',
                  isGroupHeader: false
                });
              }
            });
            
            // Add group header row
            const groupTotalAmount = totalMaterialAmount + parseFloat(labourAmountValue);
            
            materialRows.push({
              component: row.component,
              volume: parseFloat(volumeQty.toFixed(2)),
              unit: 'Cum',
              consumptionRate: '',
              materialQty: '',
              wastage: '',
              totalQty: '',
              uom: '',
              materialRate: '',
              labourRate: labourRateValue,
              materialAmount: parseFloat(totalMaterialAmount.toFixed(2)),
              labourAmount: parseFloat(labourAmountValue),
              totalAmount: parseFloat(groupTotalAmount.toFixed(2)),
              remarks: '',
              isGroupHeader: true
            });
            
            // Add child material rows
            materialRows.push(...childMaterials);
          }
        } else {
          // Non-RCC component (Earth Excavation, Backfilling, etc.) - show only labour
          const labourRateValue = parseFloat(row.labourRate) || 0;
          const labourAmountValue = parseFloat((volumeQty * labourRateValue).toFixed(2));
          const totalAmountValue = labourAmountValue;
          
          materialRows.push({
            component: row.component,
            volume: parseFloat(volumeQty.toFixed(2)),
            unit: row.unit || 'Cum',
            consumptionRate: '',
            materialQty: '',
            wastage: '',
            totalQty: '',
            uom: '',
            materialRate: '',
            labourRate: labourRateValue,
            materialAmount: 0,
            labourAmount: labourAmountValue,
            totalAmount: totalAmountValue,
            remarks: '',
            isGroupHeader: true
          });
        }
      }
    });
    
    return materialRows;
  }, [rccConfigData]);

  // Generate material data from current quantityData (for backward compatibility)
  const generateMaterialData = useCallback(() => {
    return generateMaterialDataForFloor(quantityData);
  }, [quantityData, generateMaterialDataForFloor]);

  // Generate and cache material data for all floors
  const generateAllFloorsMaterialData = useCallback(() => {
    Object.keys(floorDataCache.current).forEach(floorName => {
      const floorCache = floorDataCache.current[floorName];
      const floorQuantityData = floorCache.gridData || [];
      
      if (floorQuantityData.length > 0 && !materialDataCache.current[floorName]) {
        // Only generate if not already cached
        const materials = generateMaterialDataForFloor(floorQuantityData);
        if (materials) { // Only cache if not null
          materialDataCache.current[floorName] = materials;
        }
      }
    });
  }, [generateMaterialDataForFloor]);

  // Update existing material cache based on quantity data changes
  const updateMaterialCacheFromQuantity = useCallback(() => {
    if (!localSelectedFloor) return;
    
    // Get the latest quantity data from cache (not from state)
    const floorCache = floorDataCache.current[localSelectedFloor];
    if (!floorCache || !floorCache.gridData || floorCache.gridData.length === 0) return;
    
    const currentQuantityData = floorCache.gridData;
    
    const existingMaterialData = materialDataCache.current[localSelectedFloor];
    if (!existingMaterialData || !Array.isArray(existingMaterialData) || existingMaterialData.length === 0) {
      // No existing cache, generate fresh
      const materials = generateMaterialDataForFloor(currentQuantityData);
      if (materials) { // Only cache and set if not null
        materialDataCache.current[localSelectedFloor] = materials;
        if (activeTab === 'material') {
          setMaterialData(materials);
        }
      }
      return;
    }
    

    // Always update volumes from quantity data changes
    // User edits to rates/wastage are preserved
    // Remove any existing grand total rows first
    const updatedMaterialData = JSON.parse(JSON.stringify(existingMaterialData)).filter(row => !row.isGrandTotal);
    
    // Process each quantity group header
    currentQuantityData.forEach(qtyRow => {
      if (qtyRow.isGroupHeader) {

        
        // Find matching material group header
        const matGroupIndex = updatedMaterialData.findIndex(
          m => m.isGroupHeader && m.component === qtyRow.component
        );
        

        
        if (matGroupIndex >= 0) {
          // Existing component - update volume and recalculate amounts
          const volumeQty = parseFloat(qtyRow.quantity) || 0;
          

          
          // Update volume
          updatedMaterialData[matGroupIndex].volume = parseFloat(volumeQty.toFixed(2));
          
          // Recalculate labour amount based on new volume (preserve user's labour rate)
          const labourRate = updatedMaterialData[matGroupIndex].labourRate || 0;
          const labourAmount = parseFloat((volumeQty * labourRate).toFixed(2));
          updatedMaterialData[matGroupIndex].labourAmount = labourAmount;
          
          // Recalculate child materials based on new volume (preserve user's rates and wastage)
          // Only recalculate for RCC components, preserve manual entries for others
          let totalMaterialAmount = 0;
          let childIndex = matGroupIndex + 1;
          let shouldRecalculateMaterialAmount = false;
          
          // Get RCC config if this is an RCC component
          let rccConfig = null;
          if (qtyRow.mixture && rccConfigData.length > 0) {
            rccConfig = rccConfigData.find(config =>
              config.grade && config.grade.toLowerCase() === qtyRow.mixture.toLowerCase()
            );
            // Only recalculate material amounts if we have RCC config
            shouldRecalculateMaterialAmount = !!rccConfig;
          }
          
          while (childIndex < updatedMaterialData.length && !updatedMaterialData[childIndex].isGroupHeader) {
            const childRow = updatedMaterialData[childIndex];
            
            // Use consumptionRate from the row if available, otherwise fall back to RCC config lookup
            let ratio = parseFloat(childRow.consumptionRate) || 0;
            
            // If no consumptionRate is set, try to get it from RCC config
            if (!ratio && rccConfig) {
              const materialConfigs = [
                { name: 'Cement', data: rccConfig.cement },
                { name: 'Steel', data: rccConfig.steel },
                { name: 'Sand', data: rccConfig.sand },
                { name: 'Aggregate 20mm', data: rccConfig.aggregate_20mm },
                { name: 'Aggregate 40mm', data: rccConfig.aggregate_40mm },
                { name: 'Water', data: rccConfig.water },
                { name: 'Bricks', data: rccConfig.bricks }
              ];
              
              const materialConfig = materialConfigs.find(m => 
                m.data && (m.data.material === childRow.component || m.name === childRow.component)
              );
              
              if (materialConfig && materialConfig.data) {
                ratio = parseFloat(materialConfig.data.quantity) || 0;
                // Update consumptionRate in the row for future reference
                updatedMaterialData[childIndex].consumptionRate = ratio;
              }
            }
            
            if (ratio > 0) {
              const newMaterialQty = parseFloat((volumeQty * ratio).toFixed(2));
              
              // Use existing wastage and rate (preserve user edits)
              const wastage = childRow.wastage || 0;
              const materialRate = childRow.materialRate || 0;
              
              const newTotalQty = parseFloat((newMaterialQty * (1 + wastage / 100)).toFixed(2));
              const newMaterialAmount = parseFloat((newTotalQty * materialRate).toFixed(2));
              
              // Update child row
              updatedMaterialData[childIndex].materialQty = newMaterialQty;
              updatedMaterialData[childIndex].totalQty = newTotalQty;
              updatedMaterialData[childIndex].materialAmount = newMaterialAmount;
              updatedMaterialData[childIndex].totalAmount = newMaterialAmount;
              
              totalMaterialAmount += newMaterialAmount;
            }
            
            childIndex++;
          }
          
          // Update group header material amount and total amount
          // Only update materialAmount if this is an RCC component, otherwise preserve the value from database/manual entry
          if (shouldRecalculateMaterialAmount) {
            updatedMaterialData[matGroupIndex].materialAmount = parseFloat(totalMaterialAmount.toFixed(2));
            updatedMaterialData[matGroupIndex].totalAmount = parseFloat((totalMaterialAmount + labourAmount).toFixed(2));
          } else {
            // For non-RCC components, preserve existing materialAmount and just update totalAmount
            const existingMaterialAmount = parseFloat(updatedMaterialData[matGroupIndex].materialAmount) || 0;
            updatedMaterialData[matGroupIndex].totalAmount = parseFloat((existingMaterialAmount + labourAmount).toFixed(2));
          }
          
        } else {
          // New component - generate and add to cache
          const newMaterialRows = generateMaterialDataForFloor([qtyRow]);
          if (newMaterialRows.length > 0) {
            // Insert after last material group
            // Remove grand total from new rows before adding
            const newRowsWithoutGrandTotal = newMaterialRows.filter(row => !row.isGrandTotal);
            updatedMaterialData.push(...newRowsWithoutGrandTotal);
          }
        }
      }
    });
    
    // Update cache with modified data
    materialDataCache.current[localSelectedFloor] = updatedMaterialData;
    

    
    // If material tab is active, update display immediately
    if (activeTab === 'material') {

      setMaterialData(updatedMaterialData);
    }
  }, [localSelectedFloor, rccConfigData, activeTab, generateMaterialDataForFloor]);

  // Watch for quantity data changes and update material cache
  // Only update when on quantity tab to avoid overwriting material tab edits
  useEffect(() => {
    if (activeTab === 'quantity' && quantityData && quantityData.length > 0 && localSelectedFloor) {
      updateMaterialCacheFromQuantity();
    }
  }, [quantityData, updateMaterialCacheFromQuantity, localSelectedFloor, activeTab]);

  // Generate material data for all floors when quantity data is loaded
  useEffect(() => {
    if (Object.keys(floorDataCache.current).length > 0 && rccConfigData.length > 0) {
      generateAllFloorsMaterialData();
    }
  }, [generateAllFloorsMaterialData, rccConfigData]);

  // Update material data when switching to material tab or floor changes
  useEffect(() => {
    if (activeTab === 'material') {
      if (!localSelectedFloor) {
        setMaterialData(null); // Use null instead of [] to prevent rendering
        return;
      }
      
      // Check if we have cached material data for this floor
      const cachedMaterial = materialDataCache.current[localSelectedFloor];
      if (cachedMaterial && Array.isArray(cachedMaterial) && cachedMaterial.length > 0) {
        
        // Filter out any grand total rows from cached data
        const dataWithoutGrandTotal = cachedMaterial.filter(row => !row.isGrandTotal);
        
        // Migrate old cached data to add materialId if missing
        const migratedData = dataWithoutGrandTotal.map(row => {
          if (!row.isGroupHeader && !row.isGrandTotal && row.component && !row.materialId && materialItems) {
            // Find material by name and populate materialId
            const foundMaterial = materialItems.find(item => item.material === row.component);
            if (foundMaterial) {
              return {
                ...row,
                materialId: foundMaterial._id || foundMaterial.materialId || ''
              };
            }
          }
          return row;
        });
        
        // Update cache with migrated data (without grand total)
        materialDataCache.current[localSelectedFloor] = migratedData;
        
        // Add grand total row for display
        const dataWithGrandTotal = [
          ...migratedData,
          {
            component: 'GRAND TOTAL',
            volume: '',
            unit: '',
            consumptionRate: '',
            materialQty: '',
            wastage: '',
            totalQty: '',
            uom: '',
            materialRate: '',
            labourRate: '',
            materialAmount: 0,
            labourAmount: 0,
            totalAmount: 0,
            remarks: '',
            isGrandTotal: true
          }
        ];
        
        setMaterialData(dataWithGrandTotal);
      } else {
        // No cache or invalid cache - generate from quantityData
        const materials = generateMaterialData();
        if (materials && Array.isArray(materials) && materials.length > 0) {
          materialDataCache.current[localSelectedFloor] = materials;
          
          // Add grand total row for display
          const dataWithGrandTotal = [
            ...materials,
            {
              component: 'GRAND TOTAL',
              volume: '',
              unit: '',
              consumptionRate: '',
              materialQty: '',
              wastage: '',
              totalQty: '',
              uom: '',
              materialRate: '',
              labourRate: '',
              materialAmount: 0,
              labourAmount: 0,
              totalAmount: 0,
              remarks: '',
              isGrandTotal: true
            }
          ];
          
          setMaterialData(dataWithGrandTotal);
        } else {
          // Generated material is null or empty - don't set it
          setMaterialData(null);
        }
      }
    }
  }, [activeTab, localSelectedFloor, generateMaterialData, materialCacheVersion, materialItems]);

  // Save material data to cache when switching away from material tab
  useEffect(() => {
    // If we're switching away from material tab, save the current data
    if (previousTabRef.current === 'material' && activeTab !== 'material' && localSelectedFloor) {

      saveCurrentMaterialDataToCache(localSelectedFloor);
    }
    
    // Update previous tab reference
    previousTabRef.current = activeTab;
  }, [activeTab, localSelectedFloor, saveCurrentMaterialDataToCache]);

  // Get available materials for a given category from MaterialItems API
  // eslint-disable-next-line no-unused-vars
  const getMaterialsByCategory = useCallback((categoryName) => {
    if (!categoryName || !materialItems || materialItems.length === 0) return [];
    
    // Filter materials by category name
    const filteredMaterials = materialItems.filter(item => 
      item.categoryName && item.categoryName.toLowerCase() === categoryName.toLowerCase()
    );
    
    // Return array of material names
    return filteredMaterials.map(item => item.material).filter(m => m);
  }, [materialItems]);

  // Helper function to update group header totals
  const updateGroupHeader = useCallback((hotInstance, allData, groupHeaderRow) => {
    const groupRowData = allData[groupHeaderRow];
    if (!groupRowData || !groupRowData.isGroupHeader) return;
    
    // Sum all child material amounts
    let totalMaterialAmount = 0;
    for (let i = groupHeaderRow + 1; i < allData.length; i++) {
      const childRow = allData[i];
      if (!childRow || childRow.isGroupHeader || childRow.isGrandTotal) break;
      totalMaterialAmount += parseFloat(childRow.materialAmount) || 0;
    }
    
    const labourAmount = parseFloat(groupRowData.labourAmount) || 0;
    const totalAmount = (totalMaterialAmount + labourAmount).toFixed(2);
    
    hotInstance.setDataAtRowProp(groupHeaderRow, 'materialAmount', totalMaterialAmount.toFixed(2), 'updateGroupHeader');
    hotInstance.setDataAtRowProp(groupHeaderRow, 'totalAmount', totalAmount, 'updateGroupHeader');
    
    // Update cache without grand total
    if (localSelectedFloor) {
      const currentData = hotInstance.getSourceData();
      const dataToCache = currentData.filter(row => !row.isGrandTotal);
      materialDataCache.current[localSelectedFloor] = dataToCache;
    }
  }, [localSelectedFloor]);

  // Helper function to recalculate child row amounts
  const recalculateChildRow = useCallback((row) => {
    const hotInstance = materialTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const rowData = hotInstance.getSourceDataAtRow(row);
    if (!rowData || rowData.isGroupHeader) return;
    
    // Find the parent group header to get volume
    const allData = hotInstance.getSourceData();
    let volume = 0;
    for (let i = row - 1; i >= 0; i--) {
      if (allData[i] && allData[i].isGroupHeader && !allData[i].isGrandTotal) {
        volume = parseFloat(allData[i].volume) || 0;
        break;
      }
    }
    
    // Calculate materialQty from consumptionRate and volume
    const consumptionRate = parseFloat(rowData.consumptionRate) || 0;
    const materialQty = (volume * consumptionRate).toFixed(2);
    
    const wastage = parseFloat(rowData.wastage) || 0;
    const totalQty = parseFloat(materialQty) * (1 + wastage / 100);
    
    const materialRate = parseFloat(rowData.materialRate) || 0;
    const labourRate = parseFloat(rowData.labourRate) || 0;
    
    const materialAmount = (totalQty * materialRate).toFixed(2);
    const labourAmount = (totalQty * labourRate).toFixed(2);
    const totalAmount = (parseFloat(materialAmount) + parseFloat(labourAmount)).toFixed(2);
    
    hotInstance.setDataAtRowProp(row, 'materialQty', materialQty, 'recalculate');
    hotInstance.setDataAtRowProp(row, 'totalQty', totalQty.toFixed(2), 'recalculate');
    hotInstance.setDataAtRowProp(row, 'materialAmount', materialAmount, 'recalculate');
    hotInstance.setDataAtRowProp(row, 'labourAmount', labourAmount, 'recalculate');
    hotInstance.setDataAtRowProp(row, 'totalAmount', totalAmount, 'recalculate');
  }, []);

  const getMaterialColumns = useMemo(() => [
    {
      data: 'component',
      title: 'Component',
      width: 160,
      type: 'dropdown',
      source: [],
      readOnly: function(row, col) {
        const instance = this.instance;
        const rowData = instance.getSourceDataAtRow(row);
        // Group headers are read-only, child rows are editable
        return rowData && rowData.isGroupHeader;
      }
    },
    {
      data: 'volume',
      title: 'Volume',
      width: 70,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'unit',
      title: 'Unit',
      width: 50,
      type: 'text',
      readOnly: true
    },
    {
      data: 'consumptionRate',
      title: 'Cons. Rate',
      width: 90,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: function(row, col) {
        const instance = this.instance;
        const rowData = instance.getSourceDataAtRow(row);
        // Group headers are read-only, child rows are editable
        return rowData && rowData.isGroupHeader;
      }
    },
    {
      data: 'materialQty',
      title: 'Qty',
      width: 60,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'wastage',
      title: 'Wastage (%)',
      width: 70,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: function(row, col) {
        const instance = this.instance;
        const rowData = instance.getSourceDataAtRow(row);
        return rowData && rowData.isGroupHeader;
      }
    },
    {
      data: 'totalQty',
      title: 'Total Qty',
      width: 70,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'uom',
      title: 'UOM',
      width: 50,
      type: 'text',
      readOnly: true
    },
    {
      data: 'materialRate',
      title: 'Rate',
      width: 60,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: false
    },
    {
      data: 'labourRate',
      title: 'Labour Rate',
      width: 80,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: false
    },
    {
      data: 'materialAmount',
      title: `Material Amt`,
      width: 90,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'labourAmount',
      title: `Labour Amt`,
      width: 90,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'totalAmount',
      title: `Total Amt (${currency})`,
      width: 90,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'remarks',
      title: 'Remarks',
      width: 120,
      type: 'text',
      readOnly: false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currency]);

  const getIndirectExpenseColumns = useMemo(() => [
    {
      data: 'expenseHead',
      title: 'Expense Head',
      width: 250,
      type: 'text',
      readOnly: true
    },
    {
      data: 'allocationPercent',
      title: 'Allocation (%)',
      width: 120,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: false
    },
    {
      data: 'amount',
      title: `Amount (${currency})`,
      width: 150,
      type: 'numeric',
      numericFormat: {
        pattern: '0,0.00'
      },
      readOnly: true
    }
  ], [currency]);

  const getQuantityColumns = useMemo(() => [
    {
      data: 'component',
      title: 'Component',
      width: 280,
      type: 'text',
      readOnly: false,
      renderer: function(instance, td, row, col, prop, value, cellProperties) {
        const rowData = instance.getSourceDataAtRow(row);
        
        // Detect group header by checking if srNo is a number (group headers have numeric srNo)
        const isGroupHeader = rowData && typeof rowData.srNo === 'number' && rowData.srNo > 0;
        
        if (isGroupHeader) {
          // Group header with instruction info icon
          td.innerHTML = '';
          td.style.padding = '8px 6px';
          td.style.background = '#f1f5f9';
          td.style.borderLeft = '3px solid #3b82f6';
          td.style.position = 'relative';
          
          // Create container
          const container = document.createElement('div');
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.gap = '8px';
          
          // Component name
          const componentSpan = document.createElement('span');
          componentSpan.textContent = rowData.component || value || '';
          componentSpan.style.fontSize = '13px';
          componentSpan.style.fontWeight = '600';
          componentSpan.style.color = '#1e293b';
          componentSpan.style.flex = '1';
          
          container.appendChild(componentSpan);
          
          // Add instruction info icon (if available)
          if (rowData.instruction && rowData.instruction.trim() !== '') {
            const infoIcon = document.createElement('span');
            infoIcon.innerHTML = '&#9432;';
            infoIcon.className = 'instruction-info-icon';
            infoIcon.style.cssText = `
              color: #3b82f6;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #dbeafe;
              flex-shrink: 0;
            `;
            infoIcon.title = 'Click to view instruction';
            
            // Create tooltip div
            const tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'boq-instruction-tooltip';
            tooltipDiv.style.cssText = `
              position: absolute;
              background: #1e293b;
              color: white;
              padding: 12px 16px;
              border-radius: 6px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              z-index: 10000;
              max-width: 350px;
              font-size: 12px;
              line-height: 1.5;
              display: none;
              top: 100%;
              left: 0;
              margin-top: 8px;
              white-space: normal;
              word-wrap: break-word;
            `;
            
            // Instruction content
            const instructionText = document.createElement('div');
            instructionText.textContent = rowData.instruction;
            instructionText.style.fontWeight = 'normal';
            tooltipDiv.appendChild(instructionText);
            
            // Arrow
            const arrow = document.createElement('div');
            arrow.style.cssText = `
              position: absolute;
              bottom: 100%;
              left: 20px;
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-bottom: 6px solid #1e293b;
            `;
            tooltipDiv.appendChild(arrow);
            
            // Show/hide tooltip on hover
            infoIcon.addEventListener('mouseenter', function(e) {
              tooltipDiv.style.display = 'block';
              
              // Position tooltip
              const iconRect = infoIcon.getBoundingClientRect();
              const tdRect = td.getBoundingClientRect();
              tooltipDiv.style.left = (iconRect.left - tdRect.left - 10) + 'px';
            });
            
            infoIcon.addEventListener('mouseleave', function(e) {
              // Delay hiding to allow moving to tooltip
              setTimeout(() => {
                if (!tooltipDiv.matches(':hover') && !infoIcon.matches(':hover')) {
                  tooltipDiv.style.display = 'none';
                }
              }, 100);
            });
            
            tooltipDiv.addEventListener('mouseenter', function() {
              tooltipDiv.style.display = 'block';
            });
            
            tooltipDiv.addEventListener('mouseleave', function() {
              tooltipDiv.style.display = 'none';
            });
            
            container.appendChild(infoIcon);
            td.appendChild(tooltipDiv);
          }
          
          td.appendChild(container);
        } else {
          // Regular cell
          Handsontable.renderers.TextRenderer.apply(this, arguments);
          td.style.background = 'white';
        }
        
        return td;
      }
    },
    {
      data: 'no',
      title: 'No.',
      width: 60,
      type: 'numeric',
      numericFormat: {
        pattern: '0'
      }
    },
    {
      data: 'length',
      title: 'Length (m)',
      width: 100,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      }
    },
    {
      data: 'widthBreadth',
      title: 'Width/Breadth (m)',
      width: 130,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      }
    },
    {
      data: 'heightDepth',
      title: 'Height/Depth (m)',
      width: 130,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      }
    },
    {
      data: 'quantity',
      title: 'Quantity',
      width: 100,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      className: 'htRight',
      readOnly: function(row, col) {
        const instance = this.instance;
        const rowData = instance.getSourceDataAtRow(row);
        // Group headers are read-only (auto-calculated), child rows are editable
        return rowData && rowData.isGroupHeader;
      }
    },
    {
      data: 'unit',
      title: 'Unit',
      width: 80,
      type: 'text',
      className: 'htCenter htMiddle',
      renderer: function(instance, td, row, col, prop, value, cellProperties) {
        const rowData = instance.getSourceDataAtRow(row);
        
        if (rowData && rowData.isGroupHeader) {
          // Show unit for group header rows only
          Handsontable.renderers.TextRenderer.apply(this, arguments);
        } else {
          // Hide unit for all child rows (both addition and deduction)
          td.innerHTML = '';
          td.style.textAlign = 'center';
          td.style.verticalAlign = 'middle';
        }
        
        return td;
      }
    },
    {
      data: 'mixture',
      title: 'Mixture',
      width: 120,
      type: 'dropdown',
      source: gradeOptions,
      className: 'htCenter htMiddle',
      renderer: function(instance, td, row, col, prop, value, cellProperties) {
        // Render the dropdown normally FIRST
        Handsontable.renderers.DropdownRenderer.apply(this, arguments);
        
        // Add info icon AFTER dropdown rendering
        if (value && value.trim() !== '' && window.BOQ_rccConfigData) {
          // Find matching RCC configuration
          const matchingConfig = window.BOQ_rccConfigData.find(config => {
            if (!config.grade) return false;
            
            const configGrade = config.grade.toLowerCase().trim();
            const cellValue = value.toLowerCase().trim();
            
            // Try exact match first
            if (configGrade === cellValue) return true;
            
            // Try partial match
            if (configGrade.includes(cellValue) || cellValue.includes(configGrade)) return true;
            
            // Try matching the core part (e.g., "M20")
            const coreMatch = cellValue.match(/\((.*?)(\)|$)/);
            if (coreMatch && configGrade.includes(coreMatch[1])) return true;
            
            return false;
          });
          
          if (matchingConfig) {
            // Wrap the existing content and add icon
            const existingContent = td.innerHTML;
            
            td.innerHTML = existingContent + `<span class="mixture-info-icon" style="color: #3b82f6; cursor: pointer; font-size: 16px; font-weight: bold; margin-left: 5px;">&#9432;</span>`;
            
            td.style.position = 'relative';
            
            // Create tooltip div
            const tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'boq-mixture-tooltip';
            tooltipDiv.style.cssText = `
              position: absolute;
              background: #2d3748;
              color: white;
              padding: 12px 16px;
              border-radius: 6px;
              font-size: 12px;
              z-index: 99999;
              min-width: 280px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              display: none;
              top: 100%;
              left: 0;
              margin-top: 5px;
              white-space: nowrap;
            `;
            
            tooltipDiv.innerHTML = `
              <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #4a5568; padding-bottom: 6px; color: #60a5fa;">
                Material Composition - ${matchingConfig.grade}
              </div>
              <div style="line-height: 1.8;">
                <div>🔹 <strong>Cement:</strong> ${matchingConfig.cement || 'N/A'} bags</div>
                <div>🔹 <strong>Sand:</strong> ${matchingConfig.sand || 'N/A'} cft</div>
                <div>🔹 <strong>Aggregate 20mm:</strong> ${matchingConfig.aggregate_20mm || 'N/A'} cft</div>
                <div>🔹 <strong>Aggregate 40mm:</strong> ${matchingConfig.aggregate_40mm || 'N/A'} cft</div>
                <div>🔹 <strong>Steel:</strong> ${matchingConfig.steel || 'N/A'} kg</div>
                <div>🔹 <strong>Water:</strong> ${matchingConfig.water || 'N/A'} liters</div>
              </div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #4a5568; font-size: 10px; color: #94a3b8; text-align: center;">
                Click icon to close
              </div>
            `;
            
            td.appendChild(tooltipDiv);
            
            // Find the info icon and attach click handler
            const infoIcon = td.querySelector('.mixture-info-icon');
            if (infoIcon) {
              let isTooltipVisible = false;
              infoIcon.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                isTooltipVisible = !isTooltipVisible;
                tooltipDiv.style.display = isTooltipVisible ? 'block' : 'none';
              };
            }
            
            // Close tooltip when clicking outside
            setTimeout(() => {
              document.addEventListener('click', function closeTooltip(e) {
                if (!td.contains(e.target)) {
                  tooltipDiv.style.display = 'none';
                }
              }, { once: false });
            }, 100);
          }
        }
        
        return td;
      }
    },
    {
      data: 'action',
      title: 'Action<br/><small style="font-size:9px;color:#666;">🟢Add 🔴Del 🟠No.Column 🔵Mix</small>',
      width: 150,
      type: 'text',
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value, cellProperties) => {
        td.innerHTML = '';
        td.style.padding = '2px';
        td.style.verticalAlign = 'middle';
        td.style.textAlign = 'center';
        
        const rowData = instance.getSourceDataAtRow(row);
        
        if (rowData && rowData.isGroupHeader) {
          // Get mixture value from the row
          const mixtureValue = rowData.mixture;
          
          // Check if there's matching RCC configuration
          let matchingConfig = null;
          if (mixtureValue && window.BOQ_rccConfigData) {
            matchingConfig = window.BOQ_rccConfigData.find(config => {
              if (!config.grade) return false;
              
              const configGrade = config.grade.toLowerCase().trim();
              const cellValue = mixtureValue.toLowerCase().trim();
              
              // Try exact match first
              if (configGrade === cellValue) return true;
              
              // Try partial match
              if (configGrade.includes(cellValue) || cellValue.includes(configGrade)) return true;
              
              // Try matching the core part (e.g., "M20")
              const coreMatch = cellValue.match(/\((.*?)(\)|$)/);
              if (coreMatch && configGrade.includes(coreMatch[1])) return true;
              
              return false;
            });
          }
          
          // Container for buttons
          const buttonContainer = document.createElement('div');
          buttonContainer.style.display = 'inline-flex';
          buttonContainer.style.gap = '3px';
          buttonContainer.style.alignItems = 'center';
          buttonContainer.style.justifyContent = 'center';
          
          // Add Row button for group headers
          const addButton = document.createElement('button');
          addButton.innerHTML = '+';
          addButton.style.border = 'none';
          addButton.style.background = '#28a745';
          addButton.style.color = 'white';
          addButton.style.padding = '4px 8px';
          addButton.style.borderRadius = '3px';
          addButton.style.cursor = 'pointer';
          addButton.style.fontSize = '16px';
          addButton.style.fontWeight = 'bold';
          addButton.style.height = '26px';
          addButton.style.width = '26px';
          addButton.style.display = 'inline-flex';
          addButton.style.alignItems = 'center';
          addButton.style.justifyContent = 'center';
          addButton.style.lineHeight = '1';
          addButton.title = 'Add Row';
          
          addButton.onclick = () => {
            addRowToGroup(rowData.groupIndex);
          };
          
          buttonContainer.appendChild(addButton);
          
          // Delete Group button
          const deleteButton = document.createElement('button');
          deleteButton.innerHTML = '🗑';
          deleteButton.style.border = 'none';
          deleteButton.style.background = '#dc3545';
          deleteButton.style.color = 'white';
          deleteButton.style.padding = '4px 8px';
          deleteButton.style.borderRadius = '3px';
          deleteButton.style.cursor = 'pointer';
          deleteButton.style.fontSize = '14px';
          deleteButton.style.height = '26px';
          deleteButton.style.width = '26px';
          deleteButton.style.display = 'inline-flex';
          deleteButton.style.alignItems = 'center';
          deleteButton.style.justifyContent = 'center';
          deleteButton.style.lineHeight = '1';
          deleteButton.title = 'Delete Group';
          
          deleteButton.onclick = () => {
            deleteGroup(rowData.groupIndex);
          };
          
          buttonContainer.appendChild(deleteButton);
          
          // Instruction info icon (if instruction exists) - ORANGE/AMBER color
          if (rowData.instruction && rowData.instruction.trim() !== '') {
            const instructionButton = document.createElement('button');
            instructionButton.innerHTML = '&#9432;';
            instructionButton.style.border = 'none';
            instructionButton.style.background = '#f59e0b'; // Amber/orange color
            instructionButton.style.color = 'white';
            instructionButton.style.padding = '2px 4px';
            instructionButton.style.borderRadius = '3px';
            instructionButton.style.cursor = 'pointer';
            instructionButton.style.fontSize = '14px';
            instructionButton.style.fontWeight = 'bold';
            instructionButton.style.height = '26px';
            instructionButton.style.width = '26px';
            instructionButton.style.display = 'inline-flex';
            instructionButton.style.alignItems = 'center';
            instructionButton.style.justifyContent = 'center';
            instructionButton.title = 'View Instruction';
            
            // Create tooltip div for instruction
            td.style.position = 'relative';
            td.style.overflow = 'visible';
            const instructionTooltip = document.createElement('div');
            instructionTooltip.className = 'boq-instruction-tooltip';
            instructionTooltip.style.cssText = `
              position: fixed;
              background: #1e293b;
              color: white;
              padding: 12px 16px;
              border-radius: 6px;
              font-size: 12px;
              z-index: 999999;
              max-width: 400px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              display: none;
              white-space: normal;
              word-wrap: break-word;
            `;
            
            instructionTooltip.innerHTML = `
              <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #475569; padding-bottom: 6px; color: #fbbf24;">
                📋 Instruction
              </div>
              <div style="line-height: 1.6;">
                ${rowData.instruction}
              </div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #475569; font-size: 10px; color: #94a3b8; text-align: center;">
                Click outside to close
              </div>
            `;
            
            instructionButton.onclick = (e) => {
              e.stopPropagation();
              e.preventDefault();
              const isVisible = instructionTooltip.style.display === 'block';
              
              if (!isVisible) {
                // Position tooltip near the button
                const rect = instructionButton.getBoundingClientRect();
                instructionTooltip.style.top = (rect.bottom + 5) + 'px';
                instructionTooltip.style.left = Math.max(10, rect.left - 150) + 'px';
                instructionTooltip.style.display = 'block';
              } else {
                instructionTooltip.style.display = 'none';
              }
            };
            
            buttonContainer.appendChild(instructionButton);
            td.appendChild(instructionTooltip);
            
            // Close tooltip when clicking outside
            document.addEventListener('click', function(e) {
              if (!instructionButton.contains(e.target) && !instructionTooltip.contains(e.target)) {
                instructionTooltip.style.display = 'none';
              }
            });
          }
          
          // Info icon for material composition (if config found) - placed AFTER instruction button
          if (matchingConfig) {
            const infoButton = document.createElement('button');
            infoButton.innerHTML = '&#9432;';
            infoButton.style.border = 'none';
            infoButton.style.background = '#3b82f6';
            infoButton.style.color = 'white';
            infoButton.style.padding = '2px 4px';
            infoButton.style.borderRadius = '3px';
            infoButton.style.cursor = 'pointer';
            infoButton.style.fontSize = '12px';
            infoButton.style.fontWeight = 'bold';
            infoButton.style.height = '20px';
            infoButton.style.width = '20px';
            infoButton.style.display = 'inline-flex';
            infoButton.style.alignItems = 'center';
            infoButton.style.justifyContent = 'center';
            infoButton.title = 'Material Composition';
            
            // Create tooltip div
            td.style.position = 'relative';
            td.style.overflow = 'visible';
            const tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'boq-mixture-tooltip';
            tooltipDiv.style.cssText = `
              position: fixed;
              background: #2d3748;
              color: white;
              padding: 12px 16px;
              border-radius: 6px;
              font-size: 12px;
              z-index: 999999;
              min-width: 280px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              display: none;
              white-space: nowrap;
            `;
            
            tooltipDiv.innerHTML = `
              <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #4a5568; padding-bottom: 6px; color: #60a5fa;">
                Material Composition - ${matchingConfig.grade}
              </div>
              <div style="line-height: 1.8;">
                ${matchingConfig.cement?.quantity ? `<div>🔹 <strong>Cement:</strong> ${matchingConfig.cement.quantity} ${matchingConfig.cement.unit || ''}</div>` : ''}
                ${matchingConfig.sand?.quantity ? `<div>🔹 <strong>Sand:</strong> ${matchingConfig.sand.quantity} ${matchingConfig.sand.unit || ''}</div>` : ''}
                ${matchingConfig.aggregate_20mm?.quantity ? `<div>🔹 <strong>Aggregate 20mm:</strong> ${matchingConfig.aggregate_20mm.quantity} ${matchingConfig.aggregate_20mm.unit || ''}</div>` : ''}
                ${matchingConfig.aggregate_40mm?.quantity ? `<div>🔹 <strong>Aggregate 40mm:</strong> ${matchingConfig.aggregate_40mm.unit || ''}</div>` : ''}
                ${matchingConfig.steel?.quantity ? `<div>🔹 <strong>Steel:</strong> ${matchingConfig.steel.quantity} ${matchingConfig.steel.unit || ''}</div>` : ''}
                ${matchingConfig.water?.quantity ? `<div>🔹 <strong>Water:</strong> ${matchingConfig.water.quantity} ${matchingConfig.water.unit || ''}</div>` : ''}
                ${matchingConfig.bricks?.quantity ? `<div>🔹 <strong>Bricks:</strong> ${matchingConfig.bricks.quantity} ${matchingConfig.bricks.unit || ''}</div>` : ''}
                ${matchingConfig.aggregate?.quantity ? `<div>🔹 <strong>Aggregate:</strong> ${matchingConfig.aggregate.quantity} ${matchingConfig.aggregate.unit || ''}</div>` : ''}
              </div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #4a5568; font-size: 10px; color: #94a3b8; text-align: center;">
                Click outside to close
              </div>
            `;
            
            infoButton.onclick = (e) => {
              e.stopPropagation();
              e.preventDefault();
              const isVisible = tooltipDiv.style.display === 'block';
              
              if (!isVisible) {
                // Position tooltip near the button
                const rect = infoButton.getBoundingClientRect();
                tooltipDiv.style.top = (rect.bottom + 5) + 'px';
                tooltipDiv.style.left = (rect.left - 100) + 'px';
                tooltipDiv.style.display = 'block';
              } else {
                tooltipDiv.style.display = 'none';
              }
            };
            
            buttonContainer.appendChild(infoButton);
            td.appendChild(tooltipDiv);
            
            // Close tooltip when clicking outside
            document.addEventListener('click', function(e) {
              if (!td.contains(e.target)) {
                tooltipDiv.style.display = 'none';
              }
            });
          }
          
          td.appendChild(buttonContainer);
        } else if (rowData && !rowData.isGroupHeader) {
          // Container for buttons - more compact
          const buttonContainer = document.createElement('div');
          buttonContainer.style.display = 'inline-flex';
          buttonContainer.style.gap = '3px';
          buttonContainer.style.alignItems = 'center';
          buttonContainer.style.justifyContent = 'center';
          
          // Toggle +/- button - smaller and cleaner
          const toggleButton = document.createElement('button');
          toggleButton.innerHTML = rowData.isDeduction ? '−' : '+';
          toggleButton.style.border = 'none';
          toggleButton.style.background = rowData.isDeduction ? '#dc3545' : '#28a745';
          toggleButton.style.color = 'white';
          toggleButton.style.padding = '0';
          toggleButton.style.borderRadius = '3px';
          toggleButton.style.cursor = 'pointer';
          toggleButton.style.fontSize = '16px';
          toggleButton.style.fontWeight = 'bold';
          toggleButton.style.width = '26px';
          toggleButton.style.height = '26px';
          toggleButton.style.display = 'inline-flex';
          toggleButton.style.alignItems = 'center';
          toggleButton.style.justifyContent = 'center';
          toggleButton.style.lineHeight = '1';
          toggleButton.title = rowData.isDeduction ? 'Deduction' : 'Addition';
          
          toggleButton.onclick = () => {
            toggleDeduction(row);
          };
          
          buttonContainer.appendChild(toggleButton);
          td.appendChild(buttonContainer);
        }
        
        return td;
      }
    }
  ], [gradeOptions, addRowToGroup, toggleDeduction, deleteGroup]);

  return (
    <Container fluid style={{ 
      padding: isExpandedView ? '1rem' : '0', 
      margin: '0', 
      maxWidth: '100%',
      height: isExpandedView ? '100vh' : 'auto',
      overflow: isExpandedView ? 'auto' : 'visible',
      position: isExpandedView ? 'fixed' : 'relative',
      top: isExpandedView ? 0 : 'auto',
      left: isExpandedView ? 0 : 'auto',
      right: isExpandedView ? 0 : 'auto',
      bottom: isExpandedView ? 0 : 'auto',
      zIndex: isExpandedView ? 9999 : 'auto',
      backgroundColor: isExpandedView ? 'white' : 'transparent'
    }}>
      {alertMessage.show && (
        <Alert 
          variant={alertMessage.type} 
          onClose={() => setAlertMessage({ show: false, type: '', message: '' })} 
          dismissible
        >
          {alertMessage.message}
        </Alert>
      )}

      <Card style={{ 
        height: '100%',
        border: 'none'
      }}>
        <Card.Body style={{ 
          padding: '0.5rem',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible'
        }}>
          {/* Header with Title and Toggle */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginBottom: '1rem', 
            paddingBottom: '0.5rem', 
            borderBottom: '1px solid #e0e0e0',
            flexShrink: 0,
            position: 'relative'
          }}>
            <h5 style={{ fontWeight: 600, color: '#1976d2', margin: 0, fontSize: '1.18rem', letterSpacing: '0.5px' }}>
              Floor Component
            </h5>
            {onToggleExpandedView && (
              <Form.Check 
                type="switch"
                id="expanded-view-toggle"
                label="Expanded View"
                checked={isExpandedView}
                onChange={(e) => onToggleExpandedView(e.target.checked)}
                style={{ fontSize: '14px', fontWeight: 500, position: 'absolute', right: 0 }}
              />
            )}
          </div>
          
          <Row style={{ flex: 1, overflow: 'visible', margin: 0 }}>
              <Col md={12}>
                {/* Select Floor Dropdown and Add Component Button */}
                <Row className="mb-3">
                  <Col md={3}>
                    <Form.Group>
                      <Form.Select
                        value={localSelectedFloor}
                        onChange={(e) => setLocalSelectedFloor(e.target.value)}
                        disabled={loading}
                      >
                          <option value="">Select Floor</option>
                          {floors.map((floor, index) => (
                            <option key={index} value={floor}>
                              {floor}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="d-flex align-items-end gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={handleOpenAddComponentModal}
                        disabled={!localSelectedFloor || !quantityData || quantityData.length === 0}
                        style={{ marginBottom: '0px' }}
                      >
                        + Add Component
                      </Button>
                      <Button 
                        variant="info" 
                        size="sm"
                        onClick={handleOpenCopyFloorModal}
                        disabled={!localSelectedFloor || floors.length < 2}
                        style={{ marginBottom: '0px' }}
                      >
                        Copy from Floor
                      </Button>
                      <DropdownButton
                        variant="danger"
                        size="sm"
                        title={<><i className="bi bi-file-earmark-pdf-fill"></i> PDF</>}
                        disabled={!localSelectedFloor}
                        style={{ marginBottom: '0px' }}
                      >
                        <Dropdown.Item onClick={handlePDFCurrentFloor}>
                          Current Floor
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handlePDFAllFloors}>
                          All Floors
                        </Dropdown.Item>
                      </DropdownButton>
                      <DropdownButton
                        variant="success"
                        size="sm"
                        title={<><i className="bi bi-file-earmark-excel-fill"></i> Excel</>}
                        disabled={!localSelectedFloor}
                        style={{ marginBottom: '0px' }}
                      >
                        <Dropdown.Item onClick={handleExcelCurrentFloor}>
                          Current Floor
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleExcelAllFloors}>
                          All Floors
                        </Dropdown.Item>
                      </DropdownButton>
                    </Col>
                  </Row>
                  
                  {!localSelectedFloor ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#666', fontSize: '1.1rem' }}>
                      Please select a floor to view BOQ data
                    </div>
                  ) : loading ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <Spinner animation="border" /> Loading floor data...
                    </div>
                  ) : (
                  <>
                    
                  <Tabs
                    id="boq-tabs"
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-3"
                  >
                    <Tab eventKey="quantity" title="Quantity Sheet">
                      <Card style={{ border: 'none' }}>
                        <Card.Body style={{ padding: '0.5rem' }}>
                          
                          {activeTab !== 'quantity' ? null : (
                          <>
                          {/* Legend for +/- buttons */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '20px', 
                            marginBottom: '15px', 
                            padding: '10px 15px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '6px',
                            border: '1px solid #dee2e6',
                            fontSize: '0.9rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ 
                                fontWeight: 'bold', 
                                color: '#28a745', 
                                fontSize: '16px',
                                border: '1px solid #28a745',
                                background: '#f0fff4',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                minWidth: '28px',
                                textAlign: 'center'
                              }}>+</span>
                              <span style={{ color: '#495057' }}>Addition (adds to total)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ 
                                fontWeight: 'bold', 
                                color: '#dc3545', 
                                fontSize: '16px',
                                border: '1px solid #dc3545',
                                background: '#fff5f5',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                minWidth: '28px',
                                textAlign: 'center'
                              }}>-</span>
                              <span style={{ color: '#495057' }}>Deduction (subtracts from total - e.g., doors, windows)</span>
                            </div>
                          </div>
                          
                          {/* Table container with overlay loading */}
                          <div style={{ position: 'relative', minHeight: '400px' }}>
                            {/* Loading overlay */}
                            {loadingData && (
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
                                  <Spinner animation="border" size="sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </Spinner>
                                  <div className="mt-2" style={{ fontSize: '14px', color: '#666' }}>Loading floor data...</div>
                                </div>
                              </div>
                            )}
                          
                          {/* Quantity Sheet Table */}
                          <div style={{ border: '2px solid #ddd', borderRadius: '4px' }}>
                            {loadingData ? (
                              <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Spinner animation="border" size="sm" /> Loading...
                              </div>
                            ) : !quantityData || !Array.isArray(quantityData) || quantityData.length === 0 ? (
                              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                No quantity data available for this floor. Click "Add Component" to get started.
                              </div>
                            ) : (
                              (() => {
                                // Additional validation before rendering table
                                try {
                                  const columns = getQuantityColumns;
                                  if (!columns || !Array.isArray(columns) || columns.length === 0) {
                                    return (
                                      <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>
                                        Table configuration error. Please refresh the page.
                                      </div>
                                    );
                                  }
                                  
                                  // Validate data structure
                                  if (!quantityData.every(row => row && typeof row === 'object')) {
                                    return (
                                      <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>
                                        Invalid data structure. Please refresh the page.
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <HotTable
                                      key={`quantity-${localSelectedFloor}`}
                                      ref={quantityTableRef}
                                      data={quantityData}
                                      columns={columns}
                              colHeaders={true}
                              rowHeaders={(index) => {
                                if (!quantityData || !Array.isArray(quantityData) || index >= quantityData.length) {
                                  return index + 1;
                                }
                                const rowData = quantityData[index];
                                if (!rowData) return index + 1;
                                
                                if (rowData.isGroupHeader) {
                                  // For group headers, show just the group number
                                  return rowData.srNo || (index + 1);
                                } else {
                                  // For child rows, show group.childNumber format
                                  const groupIndex = rowData.groupIndex;
                                  const headerRow = quantityData.find(r => r && r.groupIndex === groupIndex && r.isGroupHeader);
                                  const headerSrNo = headerRow ? headerRow.srNo : groupIndex;
                                  
                                  // Count child rows before this one in the same group
                                  let childPosition = 0;
                                  for (let i = 0; i < index; i++) {
                                    if (quantityData[i] && quantityData[i].groupIndex === groupIndex && !quantityData[i].isGroupHeader) {
                                      childPosition++;
                                    }
                                  }
                                  
                                  return `${headerSrNo}.${childPosition + 1}`;
                                }
                              }}
                              width="100%"
                              height={isExpandedView ? "calc(100vh - 200px)" : "600px"}
                              autoRowSize={true}
                              autoColumnSize={true}
                              licenseKey="non-commercial-and-evaluation"
                              viewportRowRenderingOffset={30}
                              viewportColumnRenderingOffset={10}
                              preventOverflow="horizontal"
                              contextMenu={true}
                              manualColumnResize={true}
                              fixedColumnsLeft={1}
                              fixedRowsTop={1}
                              beforeOnCellContextMenu={(event, coords) => {
                                if (!quantityData || !Array.isArray(quantityData) || coords.row >= quantityData.length) {
                                  return;
                                }
                                const rowData = quantityData[coords.row];
                                if (rowData?.isGroupHeader) {
                                  event.stopImmediatePropagation();
                                  return false;
                                }
                              }}
                              afterCreateRow={(index, amount, source) => {
                                // Handle rows created via context menu
                                if (source === 'ContextMenu.rowBelow' || source === 'ContextMenu.rowAbove') {
                                  // Preserve scroll position
                                  const hotInstance = quantityTableRef.current?.hotInstance;
                                  const scrollTop = hotInstance?.rootElement?.querySelector('.wtHolder')?.scrollTop || 0;
                                  const scrollLeft = hotInstance?.rootElement?.querySelector('.wtHolder')?.scrollLeft || 0;
                                  
                                  const newData = [...quantityData];
                                  
                                  // Find the group context from the adjacent row
                                  let contextRow = source === 'ContextMenu.rowBelow' ? index - 1 : index + 1;
                                  if (contextRow >= 0 && contextRow < newData.length) {
                                    const contextRowData = newData[contextRow];
                                    
                                    if (contextRowData && !contextRowData.isGroupHeader) {
                                      // Insert new row(s) with the same group structure
                                      for (let i = 0; i < amount; i++) {
                                        newData[index + i] = {
                                          groupIndex: contextRowData.groupIndex,
                                          isGroupHeader: false,
                                          isDeduction: false,
                                          component: '',
                                          no: '',
                                          length: '',
                                          widthBreadth: '',
                                          heightDepth: '',
                                          quantity: '',
                                          unit: '',
                                          rate: '',
                                          amount: ''
                                        };
                                      }
                                      setQuantityData(newData);
                                      
                                      // Restore scroll position after render
                                      setTimeout(() => {
                                        const holder = hotInstance?.rootElement?.querySelector('.wtHolder');
                                        if (holder) {
                                          holder.scrollTop = scrollTop;
                                          holder.scrollLeft = scrollLeft;
                                        }
                                      }, 0);
                                    }
                                  }
                                }
                              }}
                              afterChange={(changes, source) => {
                                if (source !== 'loadData' && changes && quantityData && Array.isArray(quantityData)) {
                                  const groupsToUpdate = new Set();
                                  changes.forEach(([row, prop, oldValue, newValue]) => {
                                    if (row >= quantityData.length) return;
                                    // Track which groups need total update
                                    const rowData = quantityData[row];
                                    if (rowData && !rowData.isGroupHeader) {
                                      groupsToUpdate.add(rowData.groupIndex);
                                    }
                                    
                                    // Calculate quantity for numeric input changes
                                    if (['no', 'length', 'widthBreadth', 'heightDepth'].includes(prop)) {
                                      calculateQuantity(row, prop);
                                    }
                                    
                                    // If quantity is directly edited, just update the group total
                                    if (prop === 'quantity' && rowData && !rowData.isGroupHeader) {
                                      groupsToUpdate.add(rowData.groupIndex);
                                    }
                                  });
                                  
                                  // Update totals for all affected groups
                                  setTimeout(() => {
                                    groupsToUpdate.forEach(groupIndex => {
                                      updateGroupTotal(groupIndex);
                                    });
                                    
                                    // Save to cache after updates so material cache can read latest values
                                    if (localSelectedFloor) {
                                      saveCurrentFloorDataToCache(localSelectedFloor);
                                      // Trigger material cache update after saving quantity data
                                      updateMaterialCacheFromQuantity();
                                    }
                                  }, 50);
                                }
                              }}
                                cells={(row, col, prop) => {
                                const cellProperties = {};
                                if (!quantityData || !Array.isArray(quantityData) || row >= quantityData.length) {
                                  return cellProperties;
                                }
                                const rowData = quantityData[row];
                                
                                if (rowData) {
                                  // Deduction row styling - apply light red background
                                  if (!rowData.isGroupHeader && rowData.isDeduction) {
                                    cellProperties.className = 'htMiddle deduction-row';
                                    
                                    // Apply custom renderer for deduction rows (except action and unit columns)
                                    if (prop !== 'action' && prop !== 'unit') {
                                      cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                        // Apply default renderer first
                                        if (cellProperties.type === 'numeric') {
                                          Handsontable.renderers.NumericRenderer.apply(this, arguments);
                                        } else {
                                          Handsontable.renderers.TextRenderer.apply(this, arguments);
                                        }
                                        
                                        // Add deduction styling
                                        td.style.backgroundColor = '#fff5f5';
                                        td.style.color = '#c53030';
                                        
                                        // Show negative sign for quantity column
                                        if (prop === 'quantity' && value) {
                                          const numValue = parseFloat(value);
                                          if (!isNaN(numValue) && numValue > 0) {
                                            td.innerHTML = '-' + td.innerHTML;
                                          }
                                        }
                                        
                                        return td;
                                      };
                                    }
                                  }
                                  
                                  // Group header row styling
                                  if (rowData.isGroupHeader) {
                                    cellProperties.readOnly = true;
                                    cellProperties.className = 'htMiddle';
                                    
                                    // Make mixture editable only for group header
                                    if (prop === 'mixture') {
                                      cellProperties.readOnly = false;
                                    }
                                    
                                    if (prop === 'srNo' || prop === 'component') {
                                      cellProperties.className += ' group-header';
                                      cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                        td.style.backgroundColor = '#4a5568';
                                        td.style.color = '#ffffff';
                                        td.style.fontWeight = '600';
                                        td.style.padding = '10px 8px';
                                        td.style.fontSize = '13px';
                                        td.innerHTML = value || '';
                                        return td;
                                      };
                                    }
                                  } else {
                                    // Make component and quantity editable for child rows
                                    if (prop === 'component' || prop === 'quantity') {
                                      cellProperties.readOnly = false;
                                    }
                                  }
                                  
                                  // Make mixture column read-only for detail rows
                                  if (!rowData.isGroupHeader && prop === 'mixture') {
                                    cellProperties.readOnly = true;
                                    cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                      td.style.backgroundColor = '#f9f9f9';
                                      td.style.color = '#999';
                                      td.style.textAlign = 'center';
                                      td.innerHTML = '';
                                      return td;
                                    };
                                  }
                                  
                                  // Apply light gray background to unit, mixture, and quantity columns in group header row
                                  if (rowData.isGroupHeader && (prop === 'unit' || prop === 'mixture' || prop === 'quantity')) {
                                    cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                      td.style.backgroundColor = '#f7fafc';
                                      td.style.fontWeight = '600';
                                      td.style.padding = '10px 8px';
                                      td.style.fontSize = '13px';
                                      td.style.color = '#4a5568';
                                      td.style.textAlign = 'center';
                                      if (prop === 'quantity') {
                                        td.style.textAlign = 'right';
                                        td.innerHTML = value || '0.00';
                                      } else {
                                        td.innerHTML = value || '';
                                      }
                                      return td;
                                    };
                                  }
                                  
                                  // Make unit read-only for detail rows
                                  if (!rowData.isGroupHeader && prop === 'unit') {
                                    cellProperties.readOnly = true;
                                  }
                                }
                                
                                return cellProperties;
                              }}
                            />
                                  );
                                } catch (error) {
                                  console.error('Error rendering quantity table:', error);
                                  return (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>
                                      Error rendering table. Please refresh the page or contact support.
                                    </div>
                                  );
                                }
                              })()
                            )}
                          </div>
                          </div>
                          </>
                          )}
                        </Card.Body>
                      </Card>
                    </Tab>

                    <Tab eventKey="material" title="Floor wise Pricing">
                      <Card style={{ border: 'none' }}>
                        <Card.Body>
                          {activeTab !== 'material' ? null : (
                          <div style={{ padding: '1rem 0' }}>
                            {(() => {
                              // Don't render during loading
                              if (loadingData) {
                                return (
                                  <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <Spinner animation="border" size="sm" /> Loading...
                                  </div>
                                );
                              }
                              
                              // Comprehensive validation
                              const isValid = materialData && 
                                            Array.isArray(materialData) && 
                                            materialData.length > 0 && 
                                            materialData.every(row => row && typeof row === 'object' && Object.keys(row).length > 0) &&
                                            getMaterialColumns && 
                                            Array.isArray(getMaterialColumns) && 
                                            getMaterialColumns.length > 0;
                              
                              if (!isValid) {
                                return (
                                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    {!materialData || !Array.isArray(materialData) || materialData.length === 0 
                                      ? 'No material data available. Please load or create data first.'
                                      : !getMaterialColumns || !Array.isArray(getMaterialColumns) || getMaterialColumns.length === 0
                                      ? 'Table configuration error. Please refresh the page.'
                                      : 'Invalid data structure detected. Please reload the data.'}
                                  </div>
                                );
                              }
                              
                              return (
                              <HotTable
                                key={`material-${localSelectedFloor}-${materialData.length}`}
                                ref={materialTableRef}
                                data={materialData}
                                columns={getMaterialColumns}
                              colHeaders={true}
                              rowHeaders={(index) => {
                                if (!materialData || !Array.isArray(materialData) || index >= materialData.length) {
                                  return index + 1;
                                }
                                const rowData = materialData[index];
                                if (!rowData) return index + 1;
                                
                                // Hide row number for grand total row
                                if (rowData.isGrandTotal) {
                                  return '';
                                }
                                
                                if (rowData.isGroupHeader) {
                                  // For group headers, count only group headers before this one
                                  let groupNumber = 1;
                                  for (let i = 0; i < index; i++) {
                                    if (materialData[i] && materialData[i].isGroupHeader) {
                                      groupNumber++;
                                    }
                                  }
                                  return groupNumber;
                                } else {
                                  // For child rows, show group.childNumber format
                                  // Find the parent group header
                                  let groupHeaderIndex = -1;
                                  for (let i = index - 1; i >= 0; i--) {
                                    if (materialData[i] && materialData[i].isGroupHeader) {
                                      groupHeaderIndex = i;
                                      break;
                                    }
                                  }
                                  
                                  // Count group number
                                  let groupNumber = 1;
                                  for (let i = 0; i < groupHeaderIndex; i++) {
                                    if (materialData[i] && materialData[i].isGroupHeader) {
                                      groupNumber++;
                                    }
                                  }
                                  
                                  // Count child position within this group
                                  let childPosition = 0;
                                  for (let i = groupHeaderIndex + 1; i <= index; i++) {
                                    if (materialData[i] && !materialData[i].isGroupHeader) {
                                      childPosition++;
                                    }
                                  }
                                  
                                  return `${groupNumber}.${childPosition}`;
                                }
                              }}
                              width="100%"
                              height={isExpandedView ? "calc(100vh - 200px)" : "600px"}
                              licenseKey="non-commercial-and-evaluation"
                              stretchH="all"
                              contextMenu={true}
                              manualColumnResize={true}
                              fixedColumnsLeft={1}
                              fixedRowsTop={1}
                              autoWrapCol={true}
                              autoWrapRow={true}
                              afterRemoveRow={(index, amount, physicalRows, source) => {
                                // Recalculate group totals after row deletion
                                const hotInstance = materialTableRef.current?.hotInstance;
                                if (!hotInstance || hotInstance.isDestroyed) return;
                                
                                setTimeout(() => {
                                  if (!hotInstance || hotInstance.isDestroyed) return;
                                  
                                  const allData = hotInstance.getSourceData();
                                  if (!allData || !Array.isArray(allData)) return;
                                  
                                  // Find all group headers and recalculate them
                                  // This is simpler and more reliable than trying to find which one was affected
                                  for (let i = 0; i < allData.length; i++) {
                                    if (allData[i] && allData[i].isGroupHeader && !allData[i].isGrandTotal) {
                                      updateGroupHeader(hotInstance, allData, i);
                                    }
                                  }
                                  
                                  // Force render
                                  hotInstance.render();
                                }, 50);
                              }}
                              afterChange={(changes, source) => {
                                if (!changes || source === 'loadData' || source === 'updateGroupHeader' || source === 'recalculate' || !materialData || !Array.isArray(materialData)) return;
                                
                                // Mark this floor's material data as edited
                                if (localSelectedFloor && source === 'edit') {
                                  materialEditedFlags.current[localSelectedFloor] = true;
                                }
                                
                                const hotInstance = materialTableRef.current?.hotInstance;
                                if (!hotInstance) return;
                                
                                const groupsToUpdate = new Set();
                                
                                changes.forEach(([row, prop, oldValue, newValue]) => {
                                  if (row >= materialData.length) return;
                                  const rowData = hotInstance.getSourceDataAtRow(row);
                                  if (!rowData) return;
                                  
                                  // Handle group header labour rate changes
                                  if (rowData.isGroupHeader && prop === 'labourRate') {
                                    const volume = parseFloat(rowData.volume) || 0;
                                    const labourRate = parseFloat(newValue) || 0;
                                    const labourAmount = (volume * labourRate).toFixed(2);
                                    
                                    hotInstance.setDataAtRowProp(row, 'labourAmount', labourAmount);
                                    groupsToUpdate.add(row);
                                  }
                                  
                                  // Handle child row changes
                                  if (!rowData.isGroupHeader) {
                                    // If component changed, get material details
                                    if (prop === 'component' && newValue && materialItems) {
                                      const selectedMaterial = materialItems.find(item => item.material === newValue);
                                      if (selectedMaterial) {
                                        hotInstance.setDataAtRowProp(row, 'materialId', selectedMaterial._id || selectedMaterial.materialId || '');
                                        hotInstance.setDataAtRowProp(row, 'materialRate', parseFloat(selectedMaterial.defaultRate) || 0);
                                        hotInstance.setDataAtRowProp(row, 'wastage', parseFloat(selectedMaterial.wastage) || 0);
                                        hotInstance.setDataAtRowProp(row, 'uom', selectedMaterial.unit || 'KG');
                                      }
                                    }
                                    
                                    // Track which groups need updating
                                    if (['consumptionRate', 'materialQty', 'wastage', 'materialRate', 'labourRate', 'component'].includes(prop)) {
                                      // Recalculate this row
                                      recalculateChildRow(row);
                                      
                                      // Find group header to update
                                      const allData = hotInstance.getSourceData();
                                      for (let i = row - 1; i >= 0; i--) {
                                        if (allData[i] && allData[i].isGroupHeader) {
                                          groupsToUpdate.add(i);
                                          break;
                                        }
                                      }
                                    }
                                  }
                                });
                                
                                // Update all affected group headers
                                if (groupsToUpdate.size > 0) {
                                  setTimeout(() => {
                                    if (!hotInstance || hotInstance.isDestroyed) return;
                                    const allData = hotInstance.getSourceData();
                                    groupsToUpdate.forEach(groupHeaderRow => {
                                      updateGroupHeader(hotInstance, allData, groupHeaderRow);
                                    });
                                  }, 50);
                                }
                              }}
                              cells={((materialItemsData, quantityDataArray) => {
                                return function(row, col, prop) {
                                  const cellProperties = {};
                                  if (!this.instance) return cellProperties;
                                  
                                  const rowData = this.instance.getSourceDataAtRow(row);
                                  
                                  if (rowData) {
                                    // Style grand total row
                                    if (rowData.isGrandTotal) {
                                      cellProperties.readOnly = true;
                                      if (prop === 'component') {
                                        cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                          td.style.backgroundColor = '#e8f4f8';
                                          td.style.color = '#1e4d6b';
                                          td.style.fontWeight = '700';
                                          td.style.padding = '8px';
                                          td.style.fontSize = '15px';
                                          td.style.textAlign = 'right';
                                          td.style.borderTop = '2px solid #64b5f6';
                                          td.style.borderBottom = '2px solid #64b5f6';
                                          td.innerHTML = value || '';
                                          return td;
                                        };
                                      } else if (prop === 'materialAmount' || prop === 'labourAmount' || prop === 'totalAmount') {
                                        cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                          // Recalculate grand total from current data
                                          const allData = instance.getSourceData();
                                          let sum = 0;
                                          allData.forEach((dataRow, idx) => {
                                            if (dataRow.isGroupHeader && idx < row) {
                                              sum += parseFloat(dataRow[prop]) || 0;
                                            }
                                          });
                                          
                                          td.style.backgroundColor = '#e8f4f8';
                                          td.style.color = '#1e4d6b';
                                          td.style.fontWeight = '700';
                                          td.style.padding = '8px';
                                          td.style.fontSize = '12px';
                                          td.style.textAlign = 'right';
                                          td.style.borderTop = '2px solid #64b5f6';
                                          td.style.borderBottom = '2px solid #64b5f6';
                                          td.innerHTML = sum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                          return td;
                                        };
                                      } else {
                                        cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                          td.style.backgroundColor = '#e8f4f8';
                                          td.style.color = '#1e4d6b';
                                          td.style.padding = '8px';
                                          td.style.borderTop = '2px solid #64b5f6';
                                          td.style.borderBottom = '2px solid #64b5f6';
                                          td.innerHTML = '';
                                          return td;
                                        };
                                      }
                                      return cellProperties;
                                    }
                                    
                                    // For component dropdown in child rows
                                    if (prop === 'component' && !rowData.isGroupHeader) {
                                      // Find parent group header to get category
                                      let categoryName = null;
                                      for (let i = row - 1; i >= 0; i--) {
                                        const parentRow = this.instance.getSourceDataAtRow(i);
                                        if (parentRow && parentRow.isGroupHeader) {
                                          // Try to find category from quantityData
                                          const quantityRow = quantityDataArray.find(qr => 
                                            qr.isGroupHeader && qr.component === parentRow.component
                                          );
                                          if (quantityRow && quantityRow.category) {
                                            categoryName = quantityRow.category;
                                          }
                                          break;
                                        }
                                      }
                                      
                                      // Get materials for this category from materialItems
                                      if (categoryName && materialItemsData && materialItemsData.length > 0) {
                                        const filteredMaterials = materialItemsData.filter(item => 
                                          item.categoryName && item.categoryName.toLowerCase() === categoryName.toLowerCase()
                                        );
                                        const materials = filteredMaterials.map(item => item.material).filter(m => m);
                                        cellProperties.source = materials;
                                        cellProperties.readOnly = false; // Explicitly make child rows editable
                                      } else {
                                        cellProperties.source = [];
                                        cellProperties.readOnly = false; // Still editable even if no materials
                                      }
                                    }
                                  
                                  // Style group header rows
                                  if (rowData.isGroupHeader) {
                                    if (prop === 'component') {
                                      cellProperties.className = 'group-header';
                                      cellProperties.source = []; // No dropdown for group headers
                                      cellProperties.readOnly = true; // Explicitly make group headers read-only
                                      cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                        td.style.backgroundColor = '#4a5568';
                                        td.style.color = '#ffffff';
                                        td.style.fontWeight = '600';
                                        td.style.padding = '10px 8px';
                                        td.style.fontSize = '13px';
                                        td.innerHTML = value || '';
                                        return td;
                                      };
                                    } else if (prop === 'volume' || prop === 'unit' || prop === 'labourRate') {
                                      cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                        td.style.backgroundColor = '#f7fafc';
                                        td.style.fontWeight = '600';
                                        td.style.padding = '10px 8px';
                                        td.style.fontSize = '13px';
                                        td.style.color = '#4a5568';
                                        td.style.textAlign = prop === 'volume' ? 'right' : 'center';
                                        td.innerHTML = value || '';
                                        return td;
                                      };
                                    } else if (prop === 'materialAmount' || prop === 'labourAmount' || prop === 'totalAmount') {
                                      cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                        td.style.backgroundColor = '#f7fafc';
                                        td.style.fontWeight = '600';
                                        td.style.padding = '10px 8px';
                                        td.style.fontSize = '13px';
                                        td.style.color = '#4a5568';
                                        td.style.textAlign = 'right';
                                        td.innerHTML = value ? parseFloat(value).toFixed(2) : '';
                                        return td;
                                      };
                                    } else if (prop === 'remarks') {
                                      // Allow remarks in group header rows
                                      cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                        td.style.backgroundColor = '#f7fafc';
                                        td.style.fontWeight = '600';
                                        td.style.padding = '10px 8px';
                                        td.style.fontSize = '13px';
                                        td.style.color = '#4a5568';
                                        td.innerHTML = value || '';
                                        return td;
                                      };
                                      cellProperties.readOnly = false; // Make remarks editable in group headers
                                    } else {
                                      cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                        td.style.backgroundColor = '#f7fafc';
                                        td.innerHTML = '';
                                        return td;
                                      };
                                    }
                                  } else {
                                    // For child rows (non-group headers)
                                    if (prop === 'component' || prop === 'consumptionRate' || prop === 'wastage' || prop === 'materialRate') {
                                      cellProperties.readOnly = false; // Editable
                                    }
                                    
                                    // materialQty is editable for manually added rows
                                    // Read-only only if this is a standard RCC material (Cement, Steel, Sand, etc.)
                                    if (prop === 'materialQty') {
                                      const materialName = rowData.component || '';
                                      const rccMaterials = ['Cement', 'Steel', 'Sand', 'Aggregate', 'Water', 'Bricks', 'D/Bar'];
                                      const isRccMaterial = rccMaterials.some(rccMat => 
                                        materialName.toLowerCase().includes(rccMat.toLowerCase())
                                      );
                                      
                                      // Read-only for RCC materials, editable for custom/manual materials
                                      cellProperties.readOnly = isRccMaterial;
                                    }
                                    
                                    if (prop === 'totalQty') {
                                      cellProperties.readOnly = true; // Always read-only (calculated)
                                    }
                                  }
                                }
                                
                                return cellProperties;
                                };
                              })(materialItems, quantityData)}
                            />
                              );
                            })()}
                          </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Tab>

                    <Tab eventKey="indirectExpense" title="Floor Wise Indirect Expense">
                      <Card style={{ border: 'none' }}>
                        <Card.Body>
                          {activeTab !== 'indirectExpense' ? null : (
                          <div style={{ padding: '1rem 0' }}>
                            {(() => {
                              // Show loading state
                              if (loadingData) {
                                return (
                                  <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <Spinner animation="border" size="sm" /> Loading...
                                  </div>
                                );
                              }

                              // Show message if no floor selected
                              if (!localSelectedFloor) {
                                return (
                                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    Please select a floor to view indirect expenses.
                                  </div>
                                );
                              }

                              // Validate data
                              const isValid = indirectExpenseData && 
                                            Array.isArray(indirectExpenseData) && 
                                            indirectExpenseData.length > 0 &&
                                            getIndirectExpenseColumns && 
                                            Array.isArray(getIndirectExpenseColumns) && 
                                            getIndirectExpenseColumns.length > 0;

                              if (!isValid) {
                                return (
                                  <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    {!indirectExpenseData || !Array.isArray(indirectExpenseData) || indirectExpenseData.length === 0
                                      ? 'No indirect expense data available. Please ensure material pricing is calculated first.'
                                      : 'Table configuration error. Please refresh the page.'}
                                  </div>
                                );
                              }

                              // Get floor summary data
                              const floorSummary = indirectExpenseCache.current[localSelectedFloor];
                              const floorTotalAmount = floorSummary?.floorTotalAmount || 0;
                              const totalIndirectExpense = floorSummary?.totalIndirectExpense || 0;
                              const grandTotal = floorSummary?.grandTotal || 0;

                              return (
                                <>
                                  {/* Summary Cards */}
                                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ 
                                      flex: 1, 
                                      padding: '1rem', 
                                      backgroundColor: '#f0f9ff', 
                                      borderRadius: '8px',
                                      border: '1px solid #bae6fd'
                                    }}>
                                      <div style={{ fontSize: '0.875rem', color: '#0369a1', marginBottom: '0.25rem' }}>Floor Total (Direct)</div>
                                      <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0c4a6e' }}>
                                        {currency} {floorTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                    <div style={{ 
                                      flex: 1, 
                                      padding: '1rem', 
                                      backgroundColor: '#fef3c7', 
                                      borderRadius: '8px',
                                      border: '1px solid #fde68a'
                                    }}>
                                      <div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.25rem' }}>Total Indirect Expense</div>
                                      <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#78350f' }}>
                                        {currency} {totalIndirectExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                    <div style={{ 
                                      flex: 1, 
                                      padding: '1rem', 
                                      backgroundColor: '#dcfce7', 
                                      borderRadius: '8px',
                                      border: '1px solid #86efac'
                                    }}>
                                      <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '0.25rem' }}>Grand Total</div>
                                      <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#14532d' }}>
                                        {currency} {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Indirect Expense Table */}
                                  <HotTable
                                    ref={indirectExpenseTableRef}
                                    data={indirectExpenseData}
                                    columns={getIndirectExpenseColumns}
                                    colHeaders={true}
                                    rowHeaders={true}
                                    width="100%"
                                    height="auto"
                                    licenseKey="non-commercial-and-evaluation"
                                    stretchH="all"
                                    autoWrapRow={true}
                                    autoWrapCol={true}
                                    manualColumnResize={true}
                                    contextMenu={false}
                                    afterChange={handleIndirectExpenseChange}
                                  />
                                </>
                              );
                            })()}
                          </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Tab>
                  </Tabs>
                  </>
                  )}
                </Col>
              </Row>
          </Card.Body>
        </Card>

      {/* Add Component Modal */}
      <Modal show={showAddComponentModal} onHide={() => setShowAddComponentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Component</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Component to Add</Form.Label>
            <Form.Select 
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
            >
              <option value="">-- Select Component --</option>
              {availableComponents.map((comp, index) => (
                <option key={index} value={comp.component}>
                  {comp.component} ({comp.unit})
                </option>
              ))}
            </Form.Select>
            {availableComponents.length === 0 && (
              <Form.Text className="text-muted">
                All components from AreaCalculation are already added to this floor.
              </Form.Text>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddComponentModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddComponent}
            disabled={!selectedComponent}
          >
            Add Component
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Copy Floor Modal */}
      <Modal show={showCopyFloorModal} onHide={() => setShowCopyFloorModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Copy Floor Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            This will copy all quantity data from the source floor to the selected target floor(s).
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Copy From (Source Floor)</Form.Label>
            <Form.Select
              value={copySourceFloor}
              onChange={(e) => {
                setCopySourceFloor(e.target.value);
                // Remove selected source from target floors if present
                setCopyTargetFloors(prev => prev.filter(f => f !== e.target.value));
              }}
            >
              <option value="">-- Select Source Floor --</option>
              {floors.filter(floor => 
                !floor.toLowerCase().includes('foundation') && 
                !floor.toLowerCase().includes('basement')
              ).map((floor, idx) => (
                <option key={idx} value={floor}>
                  {floor}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Copy To (Target Floors - Select Multiple)</Form.Label>
            <div style={{ 
              maxHeight: '180px', 
              overflowY: 'auto', 
              border: '1px solid #dee2e6', 
              borderRadius: '4px', 
              padding: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              {floors.filter(floor => 
                floor !== copySourceFloor && 
                !floor.toLowerCase().includes('foundation') && 
                !floor.toLowerCase().includes('basement')
              ).length === 0 ? (
                <div className="text-muted text-center py-2">
                  {copySourceFloor ? 'No available floors to copy to' : 'Please select a source floor first'}
                </div>
              ) : (
                floors.filter(floor => 
                  floor !== copySourceFloor && 
                  !floor.toLowerCase().includes('foundation') && 
                  !floor.toLowerCase().includes('basement')
                ).map((floor, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    id={`target-floor-${idx}`}
                    label={floor}
                    checked={copyTargetFloors.includes(floor)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCopyTargetFloors(prev => [...prev, floor]);
                      } else {
                        setCopyTargetFloors(prev => prev.filter(f => f !== floor));
                      }
                    }}
                    className="mb-2"
                  />
                ))
              )}
            </div>
            {copyTargetFloors.length > 0 && (
              <Form.Text className="text-muted">
                Selected: {copyTargetFloors.length} floor(s)
              </Form.Text>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCopyFloorModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCopyFloorData}
            disabled={!copySourceFloor || !copyTargetFloors || copyTargetFloors.length === 0}
          >
            Copy Data
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal 
        show={showPdfModal} 
        onHide={() => setShowPdfModal(false)} 
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>BOQ Estimation PDF Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '80vh', padding: 0 }}>
          {pdfFloors.length > 0 ? (
            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
              <BOQPDFDocument 
                floors={pdfFloors} 
                floorDataCache={floorDataCache.current} 
                materialDataCache={materialDataCache.current} 
                currency={currency} 
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
};

export default BOQEstimation;
