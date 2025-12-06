import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Container, Form, Row, Col, Card, Alert, Spinner, Tabs, Tab, Button, Modal } from 'react-bootstrap';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import Handsontable from 'handsontable';

// Register all Handsontable modules
registerAllModules();

const BOQEstimation = ({ selectedFloor, estimationMasterId, floorsList, onSaveComplete }) => {
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
  const [tableKey, setTableKey] = useState(0);
  const [tableReady, setTableReady] = useState(false);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [rccConfigData, setRccConfigData] = useState([]);
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState('');
  const [materialItems, setMaterialItems] = useState([]);
  const [materialCacheVersion, setMaterialCacheVersion] = useState(0); // Track when material cache is updated
  const [showCopyFloorModal, setShowCopyFloorModal] = useState(false);
  const [copySourceFloor, setCopySourceFloor] = useState('');
  const [copyTargetFloor, setCopyTargetFloor] = useState('');
  
  const quantityTableRef = useRef(null);
  const materialTableRef = useRef(null);
  const floorInitializedRef = useRef(false);
  const floorDataCache = useRef({});
  const materialDataCache = useRef({}); // Cache for material grid data
  const initialLoadDone = useRef(false);
  const previousFloorRef = useRef(''); // Track previous floor for saving data before switching
  const previousTabRef = useRef('quantity'); // Track previous tab for saving material data
  const allComponentsRef = useRef({}); // Store all components from AreaCalculation
  const materialEditedFlags = useRef({}); // Track which floors have edited material data
  const tableReadyTimer = useRef(null); // Track timeout for cleanup

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
          labourRate: parseFloat(value.PricePerUnit) || 0
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
                    labourRate: pricePerUnit
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
                  
                  // Find category from allComponentsRef
                  const componentInfo = allComponentsRef.current[floorCategory]?.find(c => c.component === compName);
                  const category = componentInfo?.category || null;
                  
                  // Use PricePerUnit from EstimationMaterialFloorWise if available, otherwise from AreaCalculation
                  const labourRate = parseFloat(comp.PricePerUnit) || categoryPrices[compName] || 0;
                  return {
                    component: compName,
                    unit: comp.Unit || 'cu m',
                    mixture: comp.Mixture || '',
                    labourRate: labourRate,
                    category: category // Include category
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
                    
                    // Find category from allComponentsRef
                    const componentInfo = allComponentsRef.current[floorCategory]?.find(c => c.component === compName);
                    const category = componentInfo?.category || null;
                    
                    // Add group header with total quantity
                    gridData.push({
                      srNo: index + 1,
                      component: compName,
                      quantity: comp.TotalQuantity || 0,  // Restore total quantity
                      unit: comp.Unit || 'cu m',
                      mixture: comp.Mixture || '',
                      labourRate: labourRate,
                      category: category, // Include category
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
        console.log('No saved material data found');
        return;
      }
      
      const data = await response.json();
      console.log('Loaded material data:', data);
      
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
            // Convert API format to grid format
            const materialGridData = [];
            
            Object.keys(floorData.components).forEach(compName => {
              const comp = floorData.components[compName];
              
              // Add group header
              materialGridData.push({
                component: compName,
                volume: comp.volume || 0,
                unit: comp.unit || 'Cum',
                materialQty: '',
                wastage: '',
                totalQty: '',
                uom: '',
                materialRate: '',
                labourRate: comp.labourRate || 0,
                materialAmount: comp.materialAmount || 0,
                labourAmount: comp.labourAmount || 0,
                totalAmount: comp.totalAmount || 0,
                remarks: '',
                isGroupHeader: true
              });
              
              // Add material child rows
              if (comp.materials && comp.materials.length > 0) {
                comp.materials.forEach(mat => {
                  materialGridData.push({
                    component: mat.material || '',
                    volume: '',
                    unit: '',
                    materialQty: mat.materialQty || 0,
                    wastage: mat.wastage || 0,
                    totalQty: mat.totalQty || 0,
                    uom: mat.uom || '',
                    materialRate: mat.materialRate || 0,
                    labourRate: '',
                    materialAmount: mat.materialAmount || 0,
                    labourAmount: '',
                    totalAmount: mat.totalAmount || 0,
                    remarks: '',
                    isGroupHeader: false
                  });
                });
              }
            });
            
            // Only cache if there's actual data - don't cache empty arrays
            if (materialGridData.length > 0) {
              materialDataCache.current[floorName] = materialGridData;
            }
          }
        });
        
        // Only increment version if we actually cached some data
        if (Object.keys(materialDataCache.current).length > 0) {
          setMaterialCacheVersion(prev => prev + 1);
        }
        
        console.log('Material data cached for floors:', Object.keys(materialDataCache.current));
      }
    } catch (error) {
      console.log('Error loading material data:', error);
    }
  }, [apiBaseUrl]);

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
    
    // Create completely new array reference and update key
    const newData = JSON.parse(JSON.stringify(initialData)); // Deep clone
    setTableKey(Date.now());
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
    setTableKey(Date.now());
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
      materialDataCache.current[floorName] = JSON.parse(JSON.stringify(currentMaterialData));
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
    setCopyTargetFloor(localSelectedFloor); // Default target to current floor
    setShowCopyFloorModal(true);
  }, [localSelectedFloor]);

  // Handle copying data from one floor to another
  const handleCopyFloorData = useCallback(() => {
    if (!copySourceFloor || !copyTargetFloor) {
      setAlertMessage({
        show: true,
        type: 'warning',
        message: 'Please select both source and target floors'
      });
      return;
    }

    if (copySourceFloor === copyTargetFloor) {
      setAlertMessage({
        show: true,
        type: 'warning',
        message: 'Source and target floors cannot be the same'
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

    // Check if target floor has existing data
    const targetCache = floorDataCache.current[copyTargetFloor];
    const hasTargetData = targetCache && targetCache.gridData && targetCache.gridData.length > 0;

    // Show warning if target has data
    if (hasTargetData) {
      const confirmOverride = window.confirm(
        `Warning: ${copyTargetFloor} already has data.\n\nThis operation will override all existing data in ${copyTargetFloor} with data from ${copySourceFloor}.\n\nDo you want to continue?`
      );
      
      if (!confirmOverride) {
        return;
      }
    }

    // Save current floor data before copying
    if (localSelectedFloor && localSelectedFloor !== '') {
      saveCurrentFloorDataToCache(localSelectedFloor);
    }

    // Deep clone the source data
    const sourceGridData = JSON.parse(JSON.stringify(sourceCache.gridData));
    const sourceComponents = JSON.parse(JSON.stringify(sourceCache.components));

    // Update target floor cache
    floorDataCache.current[copyTargetFloor] = {
      components: sourceComponents,
      gridData: sourceGridData
    };

    // If we're copying to the current floor, refresh the display
    if (copyTargetFloor === localSelectedFloor) {
      setTableKey(Date.now());
      setQuantityData(sourceGridData);
    }

    setShowCopyFloorModal(false);
    setCopySourceFloor('');
    setCopyTargetFloor('');

    setAlertMessage({
      show: true,
      type: 'success',
      message: `Data copied successfully from ${copySourceFloor} to ${copyTargetFloor}`
    });
  }, [copySourceFloor, copyTargetFloor, localSelectedFloor, saveCurrentFloorDataToCache]);

  const loadComponentsForFloor = useCallback(async (floor) => {
    try {
      
      // Check cache first
      if (floorDataCache.current[floor]) {
        const cachedData = floorDataCache.current[floor];
        
        // Clear any pending timer
        if (tableReadyTimer.current) {
          clearTimeout(tableReadyTimer.current);
        }
        
        // Check if cached data has gridData (user modified) or just components (fresh from DB)
        if (cachedData.gridData && Array.isArray(cachedData.gridData) && cachedData.gridData.length > 0) {
          const gridData = JSON.parse(JSON.stringify(cachedData.gridData));
          setTableReady(false);
          setTableKey(Date.now());
          setQuantityData(gridData);
          tableReadyTimer.current = setTimeout(() => setTableReady(true), 100);
        } else if (cachedData.components) {
          setTableReady(false);
          initializeQuantityData(cachedData.components);
          tableReadyTimer.current = setTimeout(() => setTableReady(true), 100);
        } else if (Array.isArray(cachedData)) {
          // Old format - just component list
          setTableReady(false);
          initializeQuantityData(cachedData);
          tableReadyTimer.current = setTimeout(() => setTableReady(true), 100);
        } else {
          // No valid data - set to null to prevent rendering
          setQuantityData(null);
          setTableReady(false);
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
  }, [loadEstimations, loadGradeOptions, loadMaterialItems]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (tableReadyTimer.current) {
        clearTimeout(tableReadyTimer.current);
      }
    };
  }, []);

  // Load all floors data on initial mount when estimationMasterId is available
  useEffect(() => {
    if (estimationMasterId && floorsList && floorsList.length > 0 && !initialLoadDone.current) {
      initialLoadDone.current = true;
      
      loadAllFloorsData(estimationMasterId).then(() => {
        // After loading quantity data, also load material data
        loadMaterialDataFromAPI(estimationMasterId);
        
        // Set Foundation as default floor after data is loaded
        if (!floorInitializedRef.current) {
          setLocalSelectedFloor('Foundation');
          floorInitializedRef.current = true;
        }
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
            // Initialize component with basic info including total quantity
            floorComponents[row.component] = {
              Unit: row.unit || 'cu m',
              Mixture: row.mixture || '',
              Category: '',
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
            Category: '',
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
    console.log('getAllMaterialDataForSave called');
    console.log('materialDataCache keys:', Object.keys(materialDataCache.current));
    console.log('floorDataCache keys:', Object.keys(floorDataCache.current));
    console.log('rccConfigData:', rccConfigData);
    
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
      console.log(`Processing floor: ${floorName}`);
      
      // Check if we have edited material data for this floor
      if (materialDataCache.current[floorName] && materialDataCache.current[floorName].length > 0) {
        console.log(`Using cached material data for ${floorName}`);
        const materialGridData = materialDataCache.current[floorName];
        
        // Convert grid data to API format
        const materialComponents = {};
        
        materialGridData.forEach(row => {
          if (row.isGroupHeader) {
            materialComponents[row.component] = {
              volume: row.volume || 0,
              unit: row.unit || 'Cum',
              labourRate: row.labourRate || 0,
              labourAmount: row.labourAmount || 0,
              materialAmount: row.materialAmount || 0,
              totalAmount: row.totalAmount || 0,
              materials: []
            };
          } else {
            // Find parent component
            const parentComponent = Object.keys(materialComponents).pop();
            if (parentComponent && materialComponents[parentComponent]) {
              materialComponents[parentComponent].materials.push({
                material: row.component || '',
                materialQty: row.materialQty || 0,
                wastage: row.wastage || 0,
                totalQty: row.totalQty || 0,
                uom: row.uom || '',
                materialRate: row.materialRate || 0,
                materialAmount: row.materialAmount || 0,
                totalAmount: row.totalAmount || 0
              });
            }
          }
        });
        
        allFloorsMaterialData.push({
          floorName: floorName,
          estimationMasterId: estimationMasterId,
          components: materialComponents
        });
        
        return; // Skip to next floor
      }
      
      // If no edited material data, generate from quantity data
      const floorCache = floorDataCache.current[floorName];
      if (!floorCache) {
        console.log(`No cache found for ${floorName}`);
        return;
      }
      
      const gridData = floorCache.gridData || [];
      
      console.log(`${floorName} gridData length:`, gridData.length);
      
      if (gridData.length === 0) return;
      
      // Generate material data from this floor's quantity data
      const floorMaterialData = [];
      
      gridData.forEach((row) => {
        if (row.isGroupHeader) {
          console.log(`Processing group header: ${row.component}, quantity: ${row.quantity}, mixture: ${row.mixture}`);
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
        if (row.isGroupHeader) {
          materialComponents[row.component] = {
            volume: row.volume || 0,
            unit: row.unit || 'Cum',
            labourRate: row.labourRate || 0,
            labourAmount: row.labourAmount || 0,
            materialAmount: row.materialAmount || 0,
            totalAmount: row.totalAmount || 0,
            materials: row.materials || []
          };
        }
      });
      
      allFloorsMaterialData.push({
        floorName: floorName,
        estimationMasterId: estimationMasterId,
        components: materialComponents
      });
    });
    
    console.log('Total floors with material data:', allFloorsMaterialData.length);
    console.log('Material data to save:', JSON.stringify(allFloorsMaterialData, null, 2));
    
    return allFloorsMaterialData;
  }, [localSelectedFloor, estimationMasterId, saveCurrentMaterialDataToCache, rccConfigData]);

  // Function to clear cache and reload data (to be called after save)
  const refreshDataFromDatabase = useCallback(() => {
    floorDataCache.current = {};
    materialDataCache.current = {};
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
    
    setQuantityData(newData);
    
    // Force table refresh
    setTimeout(() => {
      const hotInstance = quantityTableRef.current?.hotInstance;
      if (hotInstance) {
        hotInstance.loadData(newData);
      }
    }, 0);
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
    setTableKey(Date.now());
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
                const defaultRate = parseFloat(material.data.defaultRate) || 0;
                
                const materialAmt = parseFloat(totalQty * defaultRate);
                totalMaterialAmount += materialAmt;
                
                childMaterials.push({
                  component: materialName,
                  volume: '',
                  unit: '',
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
    
    console.log('Updating material cache from quantity changes for:', localSelectedFloor);
    console.log('Existing material data length:', existingMaterialData.length);
    console.log('Material group headers:', existingMaterialData.filter(m => m.isGroupHeader).map(m => m.component));
    
    // Always update volumes from quantity data changes
    // User edits to rates/wastage are preserved
    const updatedMaterialData = JSON.parse(JSON.stringify(existingMaterialData));
    
    // Process each quantity group header
    currentQuantityData.forEach(qtyRow => {
      if (qtyRow.isGroupHeader) {
        console.log('Processing quantity row:', qtyRow.component, 'qty:', qtyRow.quantity);
        
        // Find matching material group header
        const matGroupIndex = updatedMaterialData.findIndex(
          m => m.isGroupHeader && m.component === qtyRow.component
        );
        
        console.log('Found material group at index:', matGroupIndex, 'for:', qtyRow.component);
        
        if (matGroupIndex >= 0) {
          // Existing component - update volume and recalculate amounts
          const volumeQty = parseFloat(qtyRow.quantity) || 0;
          
          console.log('Updating volume for', qtyRow.component, 'from', updatedMaterialData[matGroupIndex].volume, 'to', volumeQty);
          
          // Update volume
          updatedMaterialData[matGroupIndex].volume = parseFloat(volumeQty.toFixed(2));
          
          // Recalculate labour amount based on new volume (preserve user's labour rate)
          const labourRate = updatedMaterialData[matGroupIndex].labourRate || 0;
          const labourAmount = parseFloat((volumeQty * labourRate).toFixed(2));
          updatedMaterialData[matGroupIndex].labourAmount = labourAmount;
          
          // Recalculate child materials based on new volume (preserve user's rates and wastage)
          let totalMaterialAmount = 0;
          let childIndex = matGroupIndex + 1;
          
          // Get RCC config if this is an RCC component
          let rccConfig = null;
          if (qtyRow.mixture && rccConfigData.length > 0) {
            rccConfig = rccConfigData.find(config =>
              config.grade && config.grade.toLowerCase() === qtyRow.mixture.toLowerCase()
            );
          }
          
          while (childIndex < updatedMaterialData.length && !updatedMaterialData[childIndex].isGroupHeader) {
            const childRow = updatedMaterialData[childIndex];
            
            // Find the ratio for this material from RCC config
            if (rccConfig) {
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
                const ratio = parseFloat(materialConfig.data.quantity) || 0;
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
            }
            
            childIndex++;
          }
          
          // Update group header material amount and total amount
          updatedMaterialData[matGroupIndex].materialAmount = parseFloat(totalMaterialAmount.toFixed(2));
          updatedMaterialData[matGroupIndex].totalAmount = parseFloat((totalMaterialAmount + labourAmount).toFixed(2));
          
        } else {
          // New component - generate and add to cache
          const newMaterialRows = generateMaterialDataForFloor([qtyRow]);
          if (newMaterialRows.length > 0) {
            // Insert after last material group
            updatedMaterialData.push(...newMaterialRows);
          }
        }
      }
    });
    
    // Update cache with modified data
    materialDataCache.current[localSelectedFloor] = updatedMaterialData;
    
    console.log('Material cache updated, activeTab:', activeTab);
    
    // If material tab is active, update display immediately
    if (activeTab === 'material') {
      console.log('Updating material display with new data');
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
        // Use cached data only if it's valid (not null, not empty array)
        setMaterialData(cachedMaterial);
      } else {
        // No cache or invalid cache - generate from quantityData
        const materials = generateMaterialData();
        if (materials && Array.isArray(materials) && materials.length > 0) {
          materialDataCache.current[localSelectedFloor] = materials;
          setMaterialData(materials);
        } else {
          // Generated material is null or empty - don't set it
          setMaterialData(null);
        }
      }
    }
  }, [activeTab, localSelectedFloor, generateMaterialData, materialCacheVersion]);

  // Save material data to cache when switching away from material tab
  useEffect(() => {
    // If we're switching away from material tab, save the current data
    if (previousTabRef.current === 'material' && activeTab !== 'material' && localSelectedFloor) {
      console.log('Switching away from material tab, saving data for:', localSelectedFloor);
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
      if (!childRow || childRow.isGroupHeader) break;
      totalMaterialAmount += parseFloat(childRow.materialAmount) || 0;
    }
    
    const labourAmount = parseFloat(groupRowData.labourAmount) || 0;
    const totalAmount = (totalMaterialAmount + labourAmount).toFixed(2);
    
    hotInstance.setDataAtRowProp(groupHeaderRow, 'materialAmount', totalMaterialAmount.toFixed(2));
    hotInstance.setDataAtRowProp(groupHeaderRow, 'totalAmount', totalAmount);
    
    // Update cache
    if (localSelectedFloor) {
      materialDataCache.current[localSelectedFloor] = hotInstance.getSourceData();
    }
  }, [localSelectedFloor]);

  // Helper function to recalculate child row amounts
  const recalculateChildRow = useCallback((row) => {
    const hotInstance = materialTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const rowData = hotInstance.getSourceDataAtRow(row);
    if (!rowData || rowData.isGroupHeader) return;
    
    const materialQty = parseFloat(rowData.materialQty) || 0;
    const wastage = parseFloat(rowData.wastage) || 0;
    const totalQty = materialQty + (materialQty * wastage / 100);
    
    const materialRate = parseFloat(rowData.materialRate) || 0;
    const labourRate = parseFloat(rowData.labourRate) || 0;
    
    const materialAmount = (totalQty * materialRate).toFixed(2);
    const labourAmount = (totalQty * labourRate).toFixed(2);
    const totalAmount = (parseFloat(materialAmount) + parseFloat(labourAmount)).toFixed(2);
    
    hotInstance.setDataAtRowProp(row, 'totalQty', totalQty.toFixed(2));
    hotInstance.setDataAtRowProp(row, 'materialAmount', materialAmount);
    hotInstance.setDataAtRowProp(row, 'labourAmount', labourAmount);
    hotInstance.setDataAtRowProp(row, 'totalAmount', totalAmount);
  }, []);

  const getMaterialColumns = useMemo(() => [
    {
      data: 'component',
      title: 'Component',
      width: 180,
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
      width: 80,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'unit',
      title: 'Unit',
      width: 60,
      type: 'text',
      readOnly: true
    },
    {
      data: 'materialQty',
      title: 'Qty',
      width: 70,
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
      data: 'wastage',
      title: 'Wastage (%)',
      width: 80,
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
      width: 60,
      type: 'text',
      readOnly: true
    },
    {
      data: 'materialRate',
      title: 'Rate',
      width: 70,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: false
    },
    {
      data: 'labourRate',
      title: 'Labour Rate',
      width: 90,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: false
    },
    {
      data: 'materialAmount',
      title: 'Material Amount',
      width: 100,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'labourAmount',
      title: 'Labour Amount',
      width: 100,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'totalAmount',
      title: 'Total Amount',
      width: 120,
      type: 'numeric',
      numericFormat: {
        pattern: '0.00'
      },
      readOnly: true
    },
    {
      data: 'remarks',
      title: 'Remarks',
      width: 150,
      type: 'text',
      readOnly: false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const getQuantityColumns = useMemo(() => [
    {
      data: 'component',
      title: 'Component',
      width: 220,
      type: 'text',
      readOnly: false
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
        pattern: '0.000'
      }
    },
    {
      data: 'widthBreadth',
      title: 'Width/Breadth (m)',
      width: 130,
      type: 'numeric',
      numericFormat: {
        pattern: '0.000'
      }
    },
    {
      data: 'heightDepth',
      title: 'Height/Depth (m)',
      width: 130,
      type: 'numeric',
      numericFormat: {
        pattern: '0.000'
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
      title: 'Action',
      width: 100,
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
          
          // Info icon for material composition (if config found) - placed AFTER + button
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
    <Container fluid style={{ padding: '0', margin: '0', maxWidth: '100%' }}>
      {alertMessage.show && (
        <Alert 
          variant={alertMessage.type} 
          onClose={() => setAlertMessage({ show: false, type: '', message: '' })} 
          dismissible
        >
          {alertMessage.message}
        </Alert>
      )}

      <Card>
        <Card.Body style={{ padding: '0.5rem' }}>
          <Row>
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
                    </Col>
                  </Row>
                  
                  {!localSelectedFloor ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#666', fontSize: '1.1rem' }}>
                      Please select a floor to view BOQ data
                    </div>
                  ) : (
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
                            {loadingData || !tableReady ? (
                              <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Spinner animation="border" size="sm" /> Loading...
                              </div>
                            ) : (
                              quantityData && quantityData.length > 0 && (
                                <HotTable
                                  key={`quantity-table-${tableKey}-${quantityData.length}-${localSelectedFloor || 'none'}-${loadingData ? 'loading' : 'ready'}`}
                                  ref={quantityTableRef}
                                  data={quantityData}
                                  columns={getQuantityColumns}
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
                              height="auto"
                              autoRowSize={true}
                              autoColumnSize={true}
                              licenseKey="non-commercial-and-evaluation"
                              viewportRowRenderingOffset={30}
                              viewportColumnRenderingOffset={10}
                              preventOverflow="horizontal"
                              contextMenu={true}
                              manualColumnResize={true}
                              fixedColumnsLeft={1}
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
                              )
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
                              height="600px"
                              licenseKey="non-commercial-and-evaluation"
                              stretchH="all"
                              contextMenu={true}
                              manualColumnResize={true}
                              fixedColumnsLeft={1}
                              afterChange={(changes, source) => {
                                if (!changes || source === 'loadData' || !materialData || !Array.isArray(materialData)) return;
                                
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
                                        hotInstance.setDataAtRowProp(row, 'materialRate', parseFloat(selectedMaterial.defaultRate) || 0);
                                        hotInstance.setDataAtRowProp(row, 'wastage', parseFloat(selectedMaterial.wastage) || 0);
                                        hotInstance.setDataAtRowProp(row, 'uom', selectedMaterial.unit || 'KG');
                                      }
                                    }
                                    
                                    // Track which groups need updating
                                    if (['materialQty', 'wastage', 'materialRate', 'labourRate', 'component'].includes(prop)) {
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
                                    } else {
                                      cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties) {
                                        td.style.backgroundColor = '#f7fafc';
                                        td.innerHTML = '';
                                        return td;
                                      };
                                    }
                                  } else {
                                    // For child rows (non-group headers)
                                    if (prop === 'component' || prop === 'wastage' || prop === 'materialRate') {
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
                  </Tabs>
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
            This will copy all quantity data from the source floor to the target floor.
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Copy From (Source Floor)</Form.Label>
            <Form.Select
              value={copySourceFloor}
              onChange={(e) => setCopySourceFloor(e.target.value)}
            >
              <option value="">-- Select Source Floor --</option>
              {floors.map((floor, idx) => (
                <option key={idx} value={floor}>
                  {floor}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Copy To (Target Floor)</Form.Label>
            <Form.Select
              value={copyTargetFloor}
              onChange={(e) => setCopyTargetFloor(e.target.value)}
            >
              <option value="">-- Select Target Floor --</option>
              {floors.map((floor, idx) => (
                <option key={idx} value={floor}>
                  {floor}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCopyFloorModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCopyFloorData}
            disabled={!copySourceFloor || !copyTargetFloor}
          >
            Copy Data
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BOQEstimation;
