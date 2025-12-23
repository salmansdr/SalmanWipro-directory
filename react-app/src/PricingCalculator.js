import React, { useState, useEffect,useCallback, useRef } from 'react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

import { evaluate } from 'mathjs';
import { Button, Form, Row, Col, Modal } from 'react-bootstrap';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import Handsontable from 'handsontable';
import './Styles/WizardSteps.css';
import BOQEstimation from './BOQEstimation';

// Register Handsontable modules
registerAllModules();

// Room columns for grid (make available globally)
export const roomColumns = ["BedRoom", "Living Room", "Kitchen", "Bathroom", "Store"];
// Default grid rows (make available globally)
export const gridRows = ["Count", "Length (ft)", "Width (ft)"];

const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';





const PricingCalculator = () => {
  // --- Step state (move to top to avoid use-before-define) ---

  // --- Beam & Column Section State (Step 1) ---
  const [beamColumnConfig, setBeamColumnConfig] = useState([]);
  // New state for Construction Perimeter (Ft)
  const [constructionPerimeter, setConstructionPerimeter] = useState("");
  // New state for Carpet Area (Sq Ft)
  const [carpetAreaSqFt, setCarpetAreaSqFt] = useState("");
  // Alert message state for success/error notifications
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [hasMaterialData, setHasMaterialData] = useState(false);
const [step, setStep] = useState(1);

   // --- Utility Defaults ---
    // Default BHKs array for use in Step 2 and elsewhere
  
    // --- Step 1: Area Details State ---
    // Variables for Step 1 (Area, Project Info, User, etc.)
    const [estimationRef, setEstimationRef] = useState('');
    const [description, setDescription] = useState('');
    const [createDate] = useState(new Date().toLocaleDateString('en-IN'));
    const [userName] = useState(localStorage.getItem('username') || 'Admin User');
    const [width, setWidth] = useState('');
    const [depth, setDepth] = useState('');
    const [buildupPercent, setBuildupPercent] = useState(0);
    const [carpetPercent, setCarpetPercent] = useState(80);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
  
    // --- Step 2: Floor Layout State ---
    // Variables for Step 2 (Floors, BHK configs, Lift, etc.)
    const [floors, setFloors] = useState(1);
    const [lift, setLift] = useState(false);
    const [groundFloorHasRooms, setGroundFloorHasRooms] = useState(false);
    const [lockEdit, setLockEdit] = useState(false);
    const [lockDelete, setLockDelete] = useState(false);
    const [basementCount, setBasementCount] = useState(0);
    const [flatsPerFloor, setFlatsPerFloor] = useState('');
    const [floorBHKConfigs, setFloorBHKConfigs] = useState({});
    const [bhkRows, setBhkRows] = useState([
      { type: '', units: 1, area: '', rooms: '' }
      
    ]);
    const [bhkRoomDetails, setBhkRoomDetails] = useState({});
    const [showBHKModal, setShowBHKModal] = useState(false);
    const [bhkModalIdx, setBhkModalIdx] = useState(null);
    const [bhkModalFloorIdx, setBhkModalFloorIdx] = useState(null);
    const [allBhkConfigs, setAllBhkConfigs] = useState([]);
    const [bhkTypeOptions, setBhkTypeOptions] = useState([]);
    const [carpetAreaOptions, setCarpetAreaOptions] = useState({});
    const [bhkDataLoading, setBhkDataLoading] = useState(true);
    const [dynamicRoomColumns, setDynamicRoomColumns] = useState([]);
    const [roomDataSource, setRoomDataSource] = useState(''); // Track where room data is coming from
    const [savedRoomUnits, setSavedRoomUnits] = useState(new Set()); // Track units with database-saved rooms
    const bhkHotTableRef = useRef(null); // Reference to Handsontable instance for BHK modal
    const [isTableReady, setIsTableReady] = useState(false); // Track if table is ready to render
    
  // --- Step 3: Component Calculation State ---
  // Holds all floor/component calculation results for use in Step 5 and elsewhere
  const [areaCalculationLogic, setAreaCalculationLogic] = useState(null);
  const [, setStep3GridData] = useState([]);
  const [isExpandedView, setIsExpandedView] = useState(false);

  const handleBeamColumnConfigChange = (floor, section, field, value) => {
    setBeamColumnConfig(prevConfig => {
      if (!Array.isArray(prevConfig)) return prevConfig;
      return prevConfig.map(config => {
        if (config.floor !== floor) return config;
        if (section === 'beam') {
          return {
            ...config,
            beam: {
              ...config.beam,
              [field]: value
            }
          };
        } else if (section === 'column') {
          return {
            ...config,
            column: {
              ...config.column,
              [field]: value
            }
          };
        } else if (section === 'floor' && field === 'floorHeight') {
          return {
            ...config,
            floorHeight: value
          };
        }
        return config;
      });
    });
  };



  // Populate step3GridData with all floor/component calculation results whenever relevant inputs change
  useEffect(() => {
    if (!areaCalculationLogic) return;
    const allFloors = [];
    // Use the same floor label logic as in your UI
    //let totalDoors = 0;
    //let totalWindows = 0;
    for (let floorIdx = 0; floorIdx <= Number(floors)+1; floorIdx++) {
      let floorLabel = '';
      if (floorIdx === 0) floorLabel = 'Foundation';
      else if (floorIdx === 1) floorLabel = 'Ground Floor';
      else if (floorIdx === 2) floorLabel = '1st Floor';
      else if (floorIdx === 3) floorLabel = '2nd Floor';
      else if (floorIdx === 4) floorLabel = '3rd Floor';
      else floorLabel = `${floorIdx - 1}th Floor`;

      // Step 1: Lookup beam/column config for this floor, fallback to 'Other Floors' for upper floors
      let floorBeamColumnConfig = beamColumnConfig && Array.isArray(beamColumnConfig) ? beamColumnConfig.find(item => item.floor === floorLabel) : null;
      if (!floorBeamColumnConfig && floorIdx >= 2 && beamColumnConfig && Array.isArray(beamColumnConfig)) {
        floorBeamColumnConfig = beamColumnConfig.find(item => item.floor === 'Other Floors');
      }
      // Calculate all components for this floor
      const components = areaCalculationLogic?.calculation_components
        ? Object.entries(areaCalculationLogic.calculation_components)
            .filter(([_, comp]) => {
              const floorsArr = comp["Applicable Floors"];
              if (!floorsArr) return true;
              if (floorLabel === 'Foundation') {
                return floorsArr.map(f => f.toLowerCase()).includes('foundation');
              }
              // Normalize for label differences
              return floorsArr.map(f => f.toLowerCase()).includes(floorLabel.toLowerCase()) ||
                     floorsArr.map(f => f.toLowerCase()).includes("all floors");
            })
            .map(([key, comp]) => {
              // Use floorBeamColumnConfig for beam/column calculations if available
              const vars = {
                width: Number(width) || 0,
                depth: Number(depth) || 0,
                floors: Number(floors) || 1,
                carpetPercent: Number(carpetPercent) || 0,
                buildupPercent: Number(buildupPercent) || 0,
                constructionPerimeter: Number(constructionPerimeter) || 0,
                lift: lift ? 1 : 0,
                sba: Number(buildupPercent) || 0,
                carpetArea: Number(carpetAreaSqFt) || 0,
                super_buildup_area: Number(buildupPercent) || 0,
                ground_floor_sba: Number(buildupPercent) || 0,
                buildup_area: Number(buildupPercent) || 0,
                // Add beam/column config values if available
                ...(floorBeamColumnConfig && floorBeamColumnConfig.beam ? {
                  beamGridSpacing: floorBeamColumnConfig.beam.gridSpacing,
                  beamWidth: floorBeamColumnConfig.beam.width,
                  beamDepth: floorBeamColumnConfig.beam.depth
                } : {}),
                ...(floorBeamColumnConfig && floorBeamColumnConfig.column ? {
                  columnGridSpacing: floorBeamColumnConfig.column.gridSpacing,
                  columnWidth: floorBeamColumnConfig.column.width,
                  columnDepth: floorBeamColumnConfig.column.depth,
                  columnHeight: floorBeamColumnConfig.column.height
                } : {}),
                ...(floorBeamColumnConfig && floorBeamColumnConfig.floorHeight !== undefined ? {
                  floorHeight: floorBeamColumnConfig.floorHeight
                } : {})
              };
              let area = '-';
              if (comp.formula) {
                try {
                  // Use mathjs evaluate for safe formula evaluation
                  area = typeof evaluate === 'function' ? evaluate(comp.formula, vars) : '-';
                } catch (e) {
                  area = '-';
                }
              }
              // If this is a beam/column component and config is missing, set area to '-'
              if ((/beam|column/i.test(key)) && !floorBeamColumnConfig) {
                area = '-';
              }
              return {
                floor: floorLabel,
                component: key,
                category: comp.Category || '',
                volume_cuft: area,
                ...comp,
                // Inject the config used for this floor/component for future use/debugging
                floorBeamColumnConfig: floorBeamColumnConfig ? { ...floorBeamColumnConfig } : null
              };
            })
        : [];

     

      allFloors.push(...components);
    }
    setStep3GridData(allFloors);
  }, [areaCalculationLogic, width, depth, floors, carpetPercent, buildupPercent, carpetAreaSqFt, constructionPerimeter, lift, beamColumnConfig]);
  // Variables for Step 3 (Calculation logic, debug, etc.)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [configError, setConfigError] = useState(null);
  const [editablePercentages, setEditablePercentages] = useState({});
  const [editableThickness, setEditableThickness] = useState({});
  // ...existing code...
  // eslint-disable-next-line no-unused-vars
  const [selectedDebugFloor, setSelectedDebugFloor] = useState(0);

  
  // --- Shared/Other State ---
  // Variables used across steps or for modals, navigation, etc.

    const location = useLocation();
    const navigate = useNavigate();
    const { mode, id } = location.state || {};
    const isViewMode = mode === 'view';

  // Step 5 variable
  const [materialConfig, setMaterialConfig] = useState(null);
  const [wastageMap] = useState({});
  const [qtyMap] = useState({}); // For editable Qty/Cuft column
  const [rateMap, ] = useState({});


  const [bcFloor, setBCFloor] = useState('Foundation'); // Dropdown: Foundation, Ground, Others
  const [bcFloorHeight, setBCFloorHeight] = useState(0); // Floor height input
  const [bcBeamGridSpacing, setBCBeamGridSpacing] = useState(0); // Beam grid spacing
  const [bcColumnGridSpacing, setBCColumnGridSpacing] = useState(0); // Column grid spacing
  const [bcBeamWidth, setBCBeamWidth] = useState(0);
  const [bcBeamDepth, setBCBeamDepth] = useState(0);
  const [bcColumnWidth, setBCColumnWidth] = useState(0);
  const [bcColumnDepth, setBCColumnDepth] = useState(0);
  const [bcColumnHeight, setBCColumnHeight] = useState(0);

// Memoized floors list for BOQEstimation (prevents unnecessary re-renders)
const boqFloorsList = React.useMemo(() => [
  'Foundation',
  ...(basementCount > 0 ? [...Array(Number(basementCount))].map((_, idx) => `Basement ${idx + 1}`) : []),
  ...([...Array(Number(floors) + 1).keys()].map(i => 
    i === 0 ? 'Ground Floor' : i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`
  ))
], [basementCount, floors]);

  // Memoize defaultBHKs to stabilize reference
  const defaultBHKs = React.useMemo(() => [
    { type: '', units: 1, area: '', rooms: '' }
  ], []);

  // Helper to get BHK config for a floor
  const getFloorRows = React.useCallback(
    (floorIdx) => {
      // If Ground Floor (floorIdx = 0) and doesn't have rooms, return bhkRows
      if (floorIdx === 0 && !groundFloorHasRooms) return bhkRows;
      
      // For all floors with BHK configuration (including Ground Floor with rooms)
      // Use floorBHKConfigs[floorIdx]
      return floorBHKConfigs[floorIdx] || defaultBHKs;
    },
    [floorBHKConfigs, bhkRows, defaultBHKs, groundFloorHasRooms]
  );

  // Individual save functions for each step
  const handleSaveStep1 = async () => {
    // Validate Step 2 - check if any row has empty BHK Type or Carpet Area
    let hasEmptyRows = false;
    let emptyRowFloors = [];
    
    for (let floorIdx = 0; floorIdx <= Number(floors); floorIdx++) {
      // Skip validation for Ground Floor if it doesn't have rooms
      if (floorIdx === 0 && !groundFloorHasRooms) continue;
      
      const rows = getFloorRows(floorIdx);
      const emptyRow = rows.find(row => !row.type || !row.area);
      
      if (emptyRow) {
        hasEmptyRows = true;
        const floorName = floorIdx === 0 ? 'Ground Floor' : 
                         floorIdx === 1 ? '1st Floor' : 
                         floorIdx === 2 ? '2nd Floor' : 
                         floorIdx === 3 ? '3rd Floor' : 
                         `${floorIdx}th Floor`;
        emptyRowFloors.push(floorName);
      }
    }
    
    if (hasEmptyRows) {
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Please fill in all BHK Type and Carpet Area fields in Step 2. Missing data in: ${emptyRowFloors.join(', ')}`
      });
      return;
    }
    
    // Get current timestamp for modified date
    const currentDate = new Date().toLocaleDateString('en-IN');
    
    // Get user and company info from localStorage
    const companyId = localStorage.getItem('selectedCompanyId');
    const username = localStorage.getItem('userId');
    
    // Comprehensive MongoDB document including Step 1 + Step 2 + Beam/Column data
    const mongoDocument = {
      // Header information
      estimationRef: estimationRef || `EST-${Date.now()}`,
      description: description || 'Construction Estimation',
      createdDate: createDate,
      modifiedDate: currentDate,
      createdBy: username || userName, // Use username from localStorage
      modifiedBy: username || userName, // Use username from localStorage
      companyId: companyId,
      
      // Project reference (only save projectId as reference, don't duplicate project details)
      projectId: selectedProjectId || null,
      
      // Estimation-specific configuration
      basementCount: Number(basementCount) || 0,
      groundFloorHasRooms: groundFloorHasRooms || false,
      lockEdit: lockEdit || false,
      lockDelete: lockDelete || false,
      
      // Floor configuration with embedded room details (Step 2)
      floorConfiguration: Array.from({ length: Number(floors) + 1 }, (_, floorIdx) => {
        const rows = getFloorRows(floorIdx);
        // Floor label logic
        let floorLabel = '';
        if (floorIdx === 0) floorLabel = 'Ground Floor';
        else if (floorIdx === 1) floorLabel = '1st Floor';
        else if (floorIdx === 2) floorLabel = '2nd Floor';
        else if (floorIdx === 3) floorLabel = '3rd Floor';
        else floorLabel = `${floorIdx}th Floor`;
        
        return {
          floor: floorLabel,
          floorIndex: floorIdx,
          isGroundFloor: floorIdx === 0,
          hasRooms: floorIdx === 0 ? groundFloorHasRooms : true,
          // BHK units: include for Ground Floor only if hasRooms, always include for other floors
          bhkUnits: (floorIdx === 0 && !groundFloorHasRooms) ? [] : rows.map((row, idx) => {
            // Get modal popup grid details if available
            const key = `${floorIdx}-${idx}`;
            const modalDetails = bhkRoomDetails[key] || {};
            
            // Transform modalDetails to embedded room structure
            const rooms = [];
            if (modalDetails['Count']) {
              const countObj = modalDetails['Count'] || {};
              const lengthObj = modalDetails['Length (ft)'] || {};
              const widthObj = modalDetails['Width (ft)'] || {};
              
              Object.keys(countObj).forEach(roomName => {
                const count = Number(countObj[roomName] || 0);
                const length = Number(lengthObj[roomName] || 0);
                const width = Number(widthObj[roomName] || 0);
                const height = 9; // Default height
                const area_sqft = count * length * width;
                
                // Include door and window details if available
                const doorObj = modalDetails['Door'] && modalDetails['Door'][roomName] ? modalDetails['Door'][roomName] : undefined;
                const windowObj = modalDetails['Window'] && modalDetails['Window'][roomName] ? modalDetails['Window'][roomName] : undefined;
                
                if (count > 0) {
                  rooms.push({
                    name: roomName,
                    count: count,
                    dimensions: { length, width, height },
                    areaSqft: area_sqft,
                    ...(doorObj && { door: doorObj }),
                    ...(windowObj && { window: windowObj })
                  });
                }
              });
            }
            
            return {
              unitId: `${floorIdx}-${idx}`,
              bhkType: row.type || '',
              unitCount: Number(row.units) || 0,
              carpetAreaSqft: Number(row.area) || 0,
              totalRooms: row.rooms || '',
              rooms: rooms,
              totalRoomsArea: rooms.reduce((sum, room) => sum + room.areaSqft, 0)
            };
          }).filter(unit => unit.unitCount > 0) // Only include units with count > 0
        };
      }).filter(floor => 
        // Include foundation/ground floors (for structural elements) or floors with BHK units (1st floor onwards)
        floor.isFoundation || floor.isGroundFloor || floor.bhkUnits.length > 0
      ),
      
      // Beam and Column Configuration (Step 3 data)
      structuralConfiguration: {
        beamColumnConfig: (beamColumnConfig && Array.isArray(beamColumnConfig) ? beamColumnConfig : []).map(config => ({
          floor: config.floor,
          beamConfiguration: {
            gridSpacing: config.beam?.gridSpacing || 0,
            width: config.beam?.width || 0,
            depth: config.beam?.depth || 0
            // reinforcement field excluded
          },
          columnConfiguration: {
            gridSpacing: config.column?.gridSpacing || 0,
            width: config.column?.width || 0,
            depth: config.column?.depth || 0,
            height: config.column?.height || 0
            // reinforcement field excluded
          }
        })),
        // areaCalculationLogic: areaCalculationLogic // Excluded from save
      }
    };

    // Save to MongoDB via API
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      let endpoint;
      let method;
      
      if (id) {
        // Update existing project
        endpoint = `${apiUrl}/api/ProjectEstimation/${id}`;
        method = 'PUT';
      } else {
        // This shouldn't happen as new projects get ID immediately, but handle it
        throw new Error('No project ID found. Please create a new project first.');
      }
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mongoDocument)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Server returned ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const savedData = await response.json();
      console.log('Project saved successfully:', savedData);
      
      // Show success message
      setAlertMessage({
        show: true,
        type: 'success',
        message: 'Project estimation saved successfully!'
      });
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error saving to database:', error);
      
      // Show error message with details
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Failed to save project: ${error.message}. Data has been saved locally as backup.`
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 5000);
    }
  };

  

  const handleSaveStep3 = async () => {
    try {
      // Get all cached data from BOQEstimation component
      if (!window.BOQEstimation_getAllCachedData) {
        setAlertMessage({
          show: true,
          type: 'warning',
          message: 'BOQ Estimation component not ready. Please try again.'
        });
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        return;
      }

      const allFloorsData = window.BOQEstimation_getAllCachedData();
      
      if (!allFloorsData || allFloorsData.length === 0) {
        setAlertMessage({
          show: true,
          type: 'warning',
          message: 'No data to save. Please select floors and enter quantities.'
        });
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 3000);
        return;
      }

      //console.log('Saving BOQ data:', allFloorsData);

      // Validate Material Amount data if available
      if (window.BOQEstimation_getAllMaterialData) {
        const allMaterialData = window.BOQEstimation_getAllMaterialData();
        
        if (allMaterialData && allMaterialData.length > 0) {
          const validationErrors = [];
          
          // Check each floor's material data
          allMaterialData.forEach(floorData => {
            if (!floorData.components || !Array.isArray(floorData.components)) return;
            
            // Check each component (group)
            floorData.components.forEach(component => {
              const componentName = component.component || 'Unknown Component';
              const groupMaterialAmount = parseFloat(component.materialAmount) || 0;
              
              // Sum child material amounts
              let childSum = 0;
              if (component.materials && Array.isArray(component.materials)) {
                component.materials.forEach(material => {
                  childSum += parseFloat(material.materialAmount) || 0;
                });
              }
              
              // Check if group has material amount but no child rows
              if (groupMaterialAmount > 0 && component.materials && component.materials.length === 0) {
                validationErrors.push(`Floor "${floorData.floorName}" - Component "${componentName}": Group has material amount (${groupMaterialAmount.toFixed(2)}) but no child material rows.`);
              }
              
              // Check if sum doesn't match (with tolerance for rounding)
              if (component.materials && component.materials.length > 0) {
                const difference = Math.abs(groupMaterialAmount - childSum);
                if (difference > 0.01) { // Allow 1 paisa tolerance
                  validationErrors.push(`Floor "${floorData.floorName}" - Component "${componentName}": Material amount mismatch. Group total: ${groupMaterialAmount.toFixed(2)}, Child sum: ${childSum.toFixed(2)}, Difference: ${difference.toFixed(2)}`);
                }
              }
            });
          });
          
          // If validation errors found, show them and stop save
          if (validationErrors.length > 0) {
            const errorMessage = 'Material Amount Validation Failed:\n\n' + validationErrors.join('\n\n');
            setAlertMessage({
              show: true,
              type: 'danger',
              message: errorMessage
            });
            setTimeout(() => {
              setAlertMessage({ show: false, type: '', message: '' });
            }, 10000);
            return;
          }
        }
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      
      // Get estimationMasterId from first floor (all floors share same estimation)
      const estimationMasterId = allFloorsData[0]?.estimationMasterId;
      
      if (!estimationMasterId) {
        setAlertMessage({
          show: true,
          type: 'danger',
          message: 'Missing estimation master ID. Please ensure project is properly set up.'
        });
        setTimeout(() => {
          setAlertMessage({ show: false, type: '', message: '' });
        }, 4000);
        return;
      }

      // Check if record already exists
      const checkResponse = await fetch(`${apiBaseUrl}/api/EstimationMaterialFloorWise/by-estimation-master/${estimationMasterId}`);
      let existingRecordId = null;
      
      if (checkResponse.ok) {
        const existingData = await checkResponse.json();
       // console.log('Existing data check:', existingData);
        
        // Extract _id from records array
        if (existingData && existingData.records && existingData.records.length > 0) {
          existingRecordId = existingData.records[0]._id;
          //console.log('Found existing record ID:', existingRecordId);
        }
      }

      // Prepare single payload with all floors
      const companyId = localStorage.getItem('selectedCompanyId');
      const username = localStorage.getItem('username');
      
      const payload = {
        estimationMasterId: estimationMasterId,
        estimationRef: estimationRef,
        companyId: companyId,
        createdBy: existingRecordId ? undefined : username, // Only set on create
        modifiedBy: username,
        floors: allFloorsData.map(floorData => ({
          floorName: floorData.floorName,
          components: floorData.components
        }))
      };

      //console.log('Payload:', payload);

      let response;
      if (existingRecordId) {
        // UPDATE existing record
        //console.log('Updating existing record with ID:', existingRecordId);
        response = await fetch(`${apiBaseUrl}/api/EstimationMaterialFloorWise/${existingRecordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      } else {
        // CREATE new record
        //console.log('Creating new record');
        response = await fetch(`${apiBaseUrl}/api/EstimationMaterialFloorWise`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save data' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      await response.json();
      //console.log('Save successful:', result);

      // Save material data (Tab 2) BEFORE refreshing cache
      await saveMaterialData(estimationMasterId);

      // Show success message with auto-hide
      const action = existingRecordId ? 'updated' : 'saved';
      setAlertMessage({
        show: true,
        type: 'success',
        message: `BOQ data ${action} successfully for all ${allFloorsData.length} floors!`
      });

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);

      // Refresh data from database AFTER material data is saved
      if (window.BOQEstimation_refreshData) {
        window.BOQEstimation_refreshData();
      }

    } catch (error) {
      console.error('Error saving Step 3:', error);
      setAlertMessage({
        show: true,
        type: 'danger',
        message: `Error saving BOQ data: ${error.message}`
      });

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 5000);
    }
  };

  const saveMaterialData = async (estimationMasterId) => {
    try {
      // Get material data from BOQEstimation component
      if (!window.BOQEstimation_getAllMaterialData) {
        //console.log('Material data function not available');
        return;
      }

      const allMaterialData = window.BOQEstimation_getAllMaterialData();
      
      if (!allMaterialData || allMaterialData.length === 0) {
        //console.log('No material data to save');
        return;
      }

      //console.log('Saving material data:', allMaterialData);

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      
      // Check if record already exists
      const checkResponse = await fetch(`${apiBaseUrl}/api/PriceEstimationForMaterialAndLabour/by-estimation-master/${estimationMasterId}`);
      let existingRecordId = null;
      
      if (checkResponse.ok) {
        const existingData = await checkResponse.json();
        //console.log('Existing material data check:', existingData);
        
        // Extract _id from records array
        if (existingData && existingData.records && existingData.records.length > 0) {
          existingRecordId = existingData.records[0]._id;
         // console.log('Found existing material record ID:', existingRecordId);
        }
      }

      // Prepare single payload with all floors
      const companyId = localStorage.getItem('selectedCompanyId');
      const username = localStorage.getItem('username');
      
      const payload = {
        estimationMasterId: estimationMasterId,
        estimationRef: estimationRef,
        companyId: companyId,
        createdBy: existingRecordId ? undefined : username, // Only set on create
        modifiedBy: username,
        floors: allMaterialData.map(floorData => {
          const floorObject = {
            floorName: floorData.floorName,
            components: floorData.components
          };
          
          // Add Expense if it exists
          if (floorData.Expense) {
            floorObject.Expense = floorData.Expense;
          }
          
          return floorObject;
        })
      };

      //console.log('Material payload:', payload);

      let response;
      if (existingRecordId) {
        // UPDATE existing record
        console.log('Updating existing material record with ID:', existingRecordId);
        response = await fetch(`${apiBaseUrl}/api/PriceEstimationForMaterialAndLabour/${existingRecordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      } else {
        // CREATE new record
        console.log('Creating new material record');
        response = await fetch(`${apiBaseUrl}/api/PriceEstimationForMaterialAndLabour`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save material data' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Material data save successful:', result);

    } catch (error) {
      console.error('Error saving material data:', error);
      // Don't show error to user, just log it
    }
  };

  // Load functions to restore saved data
  // eslint-disable-next-line no-unused-vars
  const handleLoadStep1 = () => {
    const savedData = localStorage.getItem('step1Data');
    if (savedData) {
      try {
        const step1Data = JSON.parse(savedData);
        setEstimationRef(step1Data.estimationRef || '');
        setDescription(step1Data.description || '');
        setWidth(step1Data.projectDetails?.sbaWidth || '');
        setDepth(step1Data.projectDetails?.sbaLength || '');
        setBuildupPercent(step1Data.projectDetails?.buildupArea);
        setCarpetPercent(step1Data.projectDetails?.carpetArea);
        setCarpetAreaSqFt(step1Data.projectDetails?.carpetAreaSqFt || '');
        setConstructionPerimeter(step1Data.projectDetails?.constructionPerimeter || '');
        setFloors(step1Data.projectDetails?.floors || 1);
        setBasementCount(step1Data.projectDetails?.basementCount || 0);
        setGroundFloorHasRooms(step1Data.projectDetails?.groundFloorHasRooms || false);
        setLockEdit(step1Data.projectDetails?.lockEdit || false);
        setLockDelete(step1Data.projectDetails?.lockDelete || false);
        setLift(step1Data.projectDetails?.liftIncluded || false);
        alert('Step 1 data loaded successfully!');
      } catch (error) {
        alert('Error loading Step 1 data: ' + error.message);
      }
    } else {
      alert('No saved Step 1 data found!');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleLoadStep2 = () => {
    const savedData = localStorage.getItem('step2Data');
    if (savedData) {
      try {
        const step2Data = JSON.parse(savedData);
        setFloors(step2Data.floors || 1);
        setLift(step2Data.lift || false);
        setFloorBHKConfigs(step2Data.floorBHKConfigs || {});
        setBhkRows(step2Data.bhkRows || []);
        setBhkRoomDetails(step2Data.bhkRoomDetails || {});
        alert('Step 2 data loaded successfully!');
      } catch (error) {
        alert('Error loading Step 2 data: ' + error.message);
      }
    } else {
      alert('No saved Step 2 data found!');
    }
  };

  
  // Removed unused state: sitePlanFile

  // Update file and preview URL on upload


  // Process button handler: send image to Flask backend
  // Removed unused state: bhkLoading, bhkError, bhkTokens
  // Add state for OCR and Pollination results used in rendering
  const [pollinationText] = useState(''); // Removed unused setter
  const [ocrText] = useState(''); // Removed unused setter

  // Exported and used in button, so keep definition
  // Removed unused function: handleProcessImage
  // Removed unused function: handleProcessImage
  // Removed unused function: handleProcessImage
  // Removed unused state: ocrText



  // Rectangle visualization ref for PDF capture
  //const rectangleRef = React.useRef();
  // State for debug breakdown floor selection in Step 3
  // Default to Foundation Floor (index 0)
  // State for number of lifts
  // Per-floor BHK configuration state

  // Handler to copy config from one floor to another
  function copyFloorConfig(fromIdx, toIdx) {
    const sourceData = getFloorRows(fromIdx);
    
    // Create a deep copy to ensure complete independence
    const deepCopiedData = sourceData.map(row => ({
      type: row.type,
      units: row.units,
      area: row.area,
      rooms: row.rooms,
      // Add any other properties that might exist
      ...Object.keys(row).reduce((acc, key) => {
        if (!['type', 'units', 'area', 'rooms'].includes(key)) {
          // For any other properties, create a deep copy if it's an object/array
          if (typeof row[key] === 'object' && row[key] !== null) {
            acc[key] = Array.isArray(row[key]) 
              ? [...row[key]]
              : { ...row[key] };
          } else {
            acc[key] = row[key];
          }
        }
        return acc;
      }, {})
    }));

    setFloorBHKConfigs(prev => ({
      ...prev,
      [toIdx]: deepCopiedData
    }));
    // Copy modal details (including Door/Window) for each row from fromIdx to toIdx
    setBhkRoomDetails(prev => {
      const newDetails = { ...prev };
      for (let rowIdx = 0; rowIdx < sourceData.length; rowIdx++) {
        const fromKey = `${fromIdx}-${rowIdx}`;
        const toKey = `${toIdx}-${rowIdx}`;
        if (prev[fromKey]) {
          // Deep copy the modal details object
          newDetails[toKey] = JSON.parse(JSON.stringify(prev[fromKey]));
        } else {
          // If not present, initialize with empty structure
          newDetails[toKey] = {
            'Count': {},
            'Length (ft)': {},
            'Width (ft)': {},
            'Door': {},
            'Window': {}
          };
        }
      }
      return newDetails;
    });
  }
  // New state for build-up and carpet area percentages

  // New state variables for additional fields in Step 1

  
  // Responsive mobile detection
  //const isMobile = window.innerWidth <= 600 || window.matchMedia('(max-width: 600px)').matches;
  // Declare all required state variables

  // Get navigation state for edit/view mode
  //const location = useLocation();
  
  
 


  // Load project data from MongoDB API when in edit/view mode
  useEffect(() => {
    const loadProjectData = async () => {
      if ((mode === 'edit' || mode === 'view') && id) {
        try {
          const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
          const endpoint = `${apiUrl}/api/ProjectEstimation/${id}`;
          const response = await fetch(endpoint);
          
          if (!response.ok) {
            throw new Error('Failed to load project data');
          }
          
          const projectData = await response.json();
          
          // Populate header fields
          setEstimationRef(projectData.estimationRef || '');
          setDescription(projectData.description || '');
          
          // Load estimation-specific fields if saved
          if (projectData.groundFloorHasRooms !== undefined) {
            setGroundFloorHasRooms(projectData.groundFloorHasRooms);
          }
          if (projectData.lockEdit !== undefined) {
            setLockEdit(projectData.lockEdit);
          }
          if (projectData.lockDelete !== undefined) {
            setLockDelete(projectData.lockDelete);
          }
          if (projectData.basementCount !== undefined) {
            setBasementCount(projectData.basementCount);
          }
          
          // Populate project reference and fetch project details
          if (projectData.projectId) {
            setSelectedProjectId(projectData.projectId);
            setSelectedProject(projectData.projectId);
            
            const constructionArea = projectData.constructionArea || '';
            setWidth(constructionArea);
            
            const landArea = projectData.landArea || '';
            setDepth(landArea);
            
            setFloors(projectData.floors  || 1);
            setBasementCount(projectData.basementCount || 0);
            setFlatsPerFloor(projectData.flatsPerFloor  || 0);

          }
          
          // Populate floor configuration if available
          if (projectData.floorConfiguration && Array.isArray(projectData.floorConfiguration)) {
            const newFloorBHKConfigs = {};
            const newBhkRoomDetails = {};
            const newSavedRoomUnits = new Set();
            
            projectData.floorConfiguration.forEach((floor, floorIdx) => {
              if (floor.bhkUnits && Array.isArray(floor.bhkUnits)) {
                newFloorBHKConfigs[floorIdx] = floor.bhkUnits.map((unit, unitIdx) => ({
                  type: unit.bhkType || '',
                  units: unit.unitCount || 0,
                  area: unit.carpetAreaSqft?.toString() || '',
                  rooms: unit.rooms?.map(room => room.name).join(', ') || ''
                }));

                // Populate room details for modal
                floor.bhkUnits.forEach((unit, unitIdx) => {
                  if (unit.rooms && Array.isArray(unit.rooms) && unit.rooms.length > 0) {
                    const key = `${floorIdx}-${unitIdx}`;
                    newSavedRoomUnits.add(key); // Mark this unit as having saved room data
                    
                    const modalDetails = {
                      'Count': {},
                      'Length (ft)': {},
                      'Width (ft)': {},
                      'Door': {},
                      'Window': {}
                    };

                    unit.rooms.forEach(room => {
                      modalDetails['Count'][room.name] = room.count || 0;
                      modalDetails['Length (ft)'][room.name] = room.dimensions?.length || 0;
                      modalDetails['Width (ft)'][room.name] = room.dimensions?.width || 0;
                      
                      // Support both uppercase and lowercase door/window keys
                      const doorData = room.door || room.Door;
                      const windowData = room.window || room.Window;
                      
                      modalDetails['Door'][room.name] = {
                        count: doorData?.count || 0,
                        width: doorData?.width || 0,
                        height: doorData?.height || 0
                      };
                      modalDetails['Window'][room.name] = {
                        count: windowData?.count || 0,
                        width: windowData?.width || 0,
                        height: windowData?.height || 0
                      };
                    });

                    newBhkRoomDetails[key] = modalDetails;
                  }
                });
              }
            });
            
            setFloorBHKConfigs(newFloorBHKConfigs);
            setBhkRoomDetails(newBhkRoomDetails);
            setSavedRoomUnits(newSavedRoomUnits); // Store which units have saved room data
            
            // Extract and add any custom BHK types from the loaded project
            const projectBhkTypes = [];
            projectData.floorConfiguration.forEach(floor => {
              if (floor.bhkUnits && Array.isArray(floor.bhkUnits)) {
                floor.bhkUnits.forEach(unit => {
                  if (unit.bhkType && unit.bhkType.trim() !== '') {
                    projectBhkTypes.push(unit.bhkType);
                  }
                });
              }
            });
            
            // Add unique project BHK types to existing options
            const uniqueProjectTypes = [...new Set(projectBhkTypes)];
            setBhkTypeOptions(prev => {
              const allTypes = [...prev, ...uniqueProjectTypes];
              return [...new Set(allTypes)];
            });
          }
          
        } catch (error) {
          console.error('Error loading project data:', error);
          alert('Error loading project data: ' + error.message);
        }
      } else if (mode === 'new' && id) {
        // For new mode, fetch the newly created project to get estimationRef
        try {
          const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
          const endpoint = `${apiUrl}/api/ProjectEstimation/${id}`;
          const response = await fetch(endpoint);
          
          if (!response.ok) {
            throw new Error('Failed to load project data');
          }
          
          const projectData = await response.json();
          setEstimationRef(projectData.estimationRef || '');
        } catch (error) {
          console.error('Error loading estimation ref:', error);
        }
      }
    };

    loadProjectData();
  }, [mode, id]);

  // --- Check if material data exists ---
  useEffect(() => {
    const checkMaterialData = async () => {
      if (id) {
        try {
          const response = await fetch(`${apiBaseUrl}/api/PriceEstimationForMaterialAndLabour/by-estimation-master/${id}`);
          if (response.ok) {
            const data = await response.json();
            setHasMaterialData(data && data.records && data.records.length > 0);
          } else {
            setHasMaterialData(false);
          }
        } catch (error) {
          console.error('Error checking material data:', error);
          setHasMaterialData(false);
        }
      }
    };
    checkMaterialData();
  }, [id]);

  // --- Load Projects from API ---
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const companyId = localStorage.getItem('selectedCompanyId');
        const endpoint = companyId 
          ? `${apiBaseUrl}/api/Projects/basic?companyId=${companyId}`
          : `${apiBaseUrl}/api/Projects/basic`;
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          
          
          // Handle both array and grouped object structures
          let projectsList = [];
          if (Array.isArray(data)) {
            projectsList = data;
          } else {
            // Flatten grouped data
            projectsList = [
              ...(data.completed || []),
              ...(data.running || []),
              ...(data.upcoming || [])
            ];
          }
          
          // Filter out projects with status "completed" (case-insensitive)
          const filteredProjects = projectsList.filter(project => 
            project.status && project.status.toLowerCase() !== 'completed'
          );
          
          setProjects(filteredProjects);
        } else {
          console.error('Failed to fetch projects');
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // --- Handler for Project Selection ---
  const handleProjectSelect = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    setSelectedProjectId(projectId);
    
    if (projectId) {
      const project = projects.find(p => p._id === projectId);
      if (project) {
        // Populate fields from selected project
        // Try multiple possible field names for construction area
        const constructionArea = project.constructionArea || 
                                  project.constructionArea || 
                                  project.buildupArea || 
                                  project.plotArea || 
                                  '';
        setWidth(constructionArea);
        
        // Set land area if available
        const landArea = project.landAreaKatha || project.landArea || '';
        setDepth(landArea);
        
        setFloors(project.floors || project.numberOfFloors || 1);
        setBasementCount(project.basementCount || 0);
        setFlatsPerFloor(project.flatsPerFloor || project.flats_per_floor || '');
        console.log('Project selected:', project);
        console.log('Construction Area set to:', constructionArea);
      }
    } else {
      // Clear fields if no project selected
      setWidth('');
      setDepth('');
      setFloors(1);
    }
  };

  // --- Load Beam & Column Config from API ---
useEffect(() => {
  const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
  console.log('Fetching beam-column config from:', `${apiUrl}/api/RoomConfiguration/beam-column-configurations`);
  fetch(`${apiUrl}/api/RoomConfiguration/beam-column-configurations`)
    .then(res => res.json())
    .then(data => {
      console.log('Beam-column config received:', data);
      // Extract configurations array from response
      const configArray = data.configurations || data;
      if (Array.isArray(configArray) && configArray.length > 0) {
        setBeamColumnConfig(configArray);
        // Initialize with Foundation floor data
        const foundationConfig = configArray.find(item => item.floor === 'Foundation');
        console.log('Foundation config:', foundationConfig);
        if (foundationConfig) {
          setBCFloorHeight(foundationConfig.floorHeight || 0);
          setBCBeamGridSpacing(foundationConfig.beam?.gridSpacing || 0);
          setBCColumnGridSpacing(foundationConfig.column?.gridSpacing || 0);
          setBCBeamWidth(foundationConfig.beam?.width || 0);
          setBCBeamDepth(foundationConfig.beam?.depth || 0);
          setBCColumnWidth(foundationConfig.column?.width || 0);
          setBCColumnDepth(foundationConfig.column?.depth || 0);
          setBCColumnHeight(foundationConfig.column?.height || 0);
        }
      }
    })
    .catch(error => {
      console.error('Error loading beam-column configurations:', error);
      setBeamColumnConfig([]);
    });
}, []);

// Dynamically generate activityMap from labourWorkData
// --- Update form fields when floor changes ---
useEffect(() => {
  if (!beamColumnConfig || !Array.isArray(beamColumnConfig) || beamColumnConfig.length === 0) return;
  
  const config = beamColumnConfig.find(item => item.floor === bcFloor);
  if (config) {
    setBCFloorHeight(config.floorHeight || 0);
    setBCBeamGridSpacing(config.beam?.gridSpacing || 0);
    setBCColumnGridSpacing(config.column?.gridSpacing || 0);
    setBCBeamWidth(config.beam?.width || 0);
    setBCBeamDepth(config.beam?.depth || 0);
    setBCColumnWidth(config.column?.width || 0);
    setBCColumnDepth(config.column?.depth || 0);
    setBCColumnHeight(config.column?.height || 0);
  }
}, [bcFloor, beamColumnConfig]);

  // Rectangle visualization for Step 1
  
  // Load BHK configurations from JSON
  async function loadBHKConfigurations() {
    try {
      setBhkDataLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const endpoint = `${apiUrl}/api/RoomConfiguration`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to load BHK configuration');
      }
      
      const configs = await response.json();
      setAllBhkConfigs(configs);
      
      // Extract unique BHK types
      const types = [...new Set(configs.map(config => config.type))];
      setBhkTypeOptions(types);
      
      // Group carpet areas by BHK type
      const areasByType = {};
      configs.forEach(config => {
        if (!areasByType[config.type]) {
          areasByType[config.type] = [];
        }
        areasByType[config.type].push(config.total_carpet_area_sqft);
      });
      
      // Sort areas for each type
      Object.keys(areasByType).forEach(type => {
        areasByType[type].sort((a, b) => a - b);
      });
      
      setCarpetAreaOptions(areasByType);
      
    } catch (error) {
      console.error('Error loading BHK configurations:', error);
    } finally {
      setBhkDataLoading(false);
    }
  }
  
  // Load BHK configurations on component mount
  React.useEffect(() => {
    loadBHKConfigurations();
  }, []);

  // Load area calculation logic from JSON file
  useEffect(() => {
    const loadCalculationLogic = async () => {
      try {
        // Use the correct path for Create React App
        const jsonPath = `${process.env.PUBLIC_URL || ''}/AreaCalculationLogic.json`;
        const response = await fetch(jsonPath, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch JSON file: ${response.status} ${response.statusText} from ${response.url}`);
        }
        // Check if response is actually JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // If not JSON, get the text to see what we actually received
          await response.text();
          throw new Error(`Server returned ${contentType || 'unknown content type'} instead of JSON. This usually means the file was not found and a 404 HTML page was returned.`);
        }
        const logic = await response.json();
        setAreaCalculationLogic(logic);
        // Update editable percentages from JSON
        const components = logic.calculation_components;
        if (components) {
          setEditablePercentages({
            external_walls: components.external_walls?.percentage * 100,
            beams_columns: components.beams_columns?.percentage * 100,
            staircase_area: components.staircase_area?.percentage * 100,
            lift_shaft_area: components.lift_shaft_area?.percentage * 100,
            balcony_area: components.balcony_area?.percentage * 100,
            utility_area: components.utility_area?.percentage * 100,
            toilet_bath_area: components.toilet_bath_area?.percentage * 100,
            common_corridor: components.common_corridor?.percentage * 100,
            parking_area_ground: components.parking_area_ground?.percentage * 100,
            foundation_area: components.foundation_area?.percentage * 100,
            parapet_walls: components.parapet_walls?.percentage * 100
          });
          // Update thickness values from JSON
          setEditableThickness({
            internal_walls: components.internal_walls?.thickness,
            external_walls: components.external_walls?.thickness,
            slab_area: components.slab_area?.thickness,
            ceiling_plaster: components.ceiling_plaster?.thickness,
            beams_columns: components.beams_columns?.thickness,
            staircase_area: components.staircase_area?.thickness,
            lift_shaft_area: components.lift_shaft_area?.thickness,
            balcony_area: components.balcony_area?.thickness,
            utility_area: components.utility_area?.thickness,
            toilet_bath_area: components.toilet_bath_area?.thickness,
            common_corridor: components.common_corridor?.thickness,
            parking_area_ground: components.parking_area_ground?.thickness,
            foundation_area: components.foundation_area?.thickness,
            parapet_walls: components.parapet_walls?.thickness
          });
        }
        setIsConfigLoaded(true);
        setConfigError(null);
      } catch (error) {
        console.error('Failed to load area calculation logic:', error);
        setIsConfigLoaded(false);
        setConfigError(error.message);
      }
    };
    loadCalculationLogic();
  }, []);
  
  // Helper to get carpet area options for a BHK type
  function getCarpetAreaOptions(bhkType) {
    return carpetAreaOptions[bhkType] || [];
  }
  
  // Handler for BHK type change - updates carpet area options
  function handleBHKTypeChange(floorIdx, idx, newType) {
    // Update the type
    handleFloorCellChange(floorIdx, idx, 'type', newType);
    // Reset area to first available option for this type
    const availableAreas = getCarpetAreaOptions(newType);
    if (availableAreas.length > 0) {
      const areaValue = availableAreas[0];
      handleFloorCellChange(floorIdx, idx, 'area', areaValue);
      // Update rooms description based on new configuration
      const config = allBhkConfigs.find(c => c.type === newType && String(c.total_carpet_area_sqft) === String(areaValue));
      if (config) {
        const roomList = config.rooms.map(room => room.name).join(', ');
        handleFloorCellChange(floorIdx, idx, 'rooms', roomList);
        // Also update bhkRoomDetails for this row
        setBhkRoomDetails(prevDetails => {
          const newDetails = { ...prevDetails };
          const key = `${floorIdx}-${idx}`;
          let modalDetails = {
            'Count': {},
            'Length (ft)': {},
            'Width (ft)': {},
            'Door': {},
            'Window': {}
          };
          if (Array.isArray(config.rooms)) {
            config.rooms.forEach(room => {
              modalDetails['Count'][room.name] = 1;
              modalDetails['Length (ft)'][room.name] = room.dimensions_ft?.length || '';
              modalDetails['Width (ft)'][room.name] = room.dimensions_ft?.width || '';
              modalDetails['Door'][room.name] = room.Door ? {
                count: room.Door.count || 0,
                width: room.Door.width || 0,
                height: room.Door.height || 0
              } : { count: 0, width: 0, height: 0 };
              modalDetails['Window'][room.name] = room.Window ? {
                count: room.Window.count || 0,
                width: room.Window.width || 0,
                height: room.Window.height || 0
              } : { count: 0, width: 0, height: 0 };
            });
          }
          newDetails[key] = modalDetails;
          return newDetails;
        });
      }
    }
    // Force update: ensure modal header always reflects latest type
    setTimeout(() => {
      // This triggers a re-render and ensures the modal header reads the latest type
      setFloorBHKConfigs(prev => ({ ...prev }));
    }, 0);
  }


  
  

  // --- Step 1 to Step 2 sync: keep Step 2 in sync with Step 1 unless user customizes Step 2 ---
  React.useEffect(() => {
    // Only run if there are more than 1 floors
    if (!bhkRows || !Array.isArray(bhkRows) || floors <= 1) return;
    setFloorBHKConfigs(prevConfigs => {
      const updated = { ...prevConfigs };
      for (let floorIdx = 1; floorIdx < floors; floorIdx++) {
        const current = prevConfigs[floorIdx] || [];
        // Only sync if Step 2 config matches previous Step 1 structure (or is empty)
        const shouldSync = !current.length || (current.length === bhkRows.length && current.every((row, i) => row.type === bhkRows[i].type && row.area === bhkRows[i].area && row.rooms === bhkRows[i].rooms));
        if (shouldSync) {
          updated[floorIdx] = bhkRows.map(row => ({ ...row }));
        }
      }
      return updated;
    });
    // Also sync bhkRoomDetails for new rows on all non-Ground floors
    setBhkRoomDetails(prevDetails => {
      let updated = { ...prevDetails };
      for (let floorIdx = 1; floorIdx < floors; floorIdx++) {
        for (let rowIdx = 0; rowIdx < bhkRows.length; rowIdx++) {
          const key = `${floorIdx}-${rowIdx}`;
          if (!updated[key]) {
            updated[key] = {
              'Count': {},
              'Length (ft)': {},
              'Width (ft)': {},
              'Door': {},
              'Window': {}
            };
          }
        }
      }
      return updated;
    });
  }, [bhkRows, floors]);

  //const plotArea = (width && depth) ? (Number(width) * Number(depth)) : '';
  //let rectangleVisualization = null;

  

  // Handler to update BHK config for a floor
  function handleFloorCellChange(floorIdx, idx, field, value) {
    if (floorIdx === 0 && !groundFloorHasRooms) {
      const updated = [...bhkRows];
      updated[idx][field] = field === 'units' || field === 'area' ? Number(value) : value;
      setBhkRows(updated);
      // Sync count to bhkRoomDetails if field is 'Count'
      if (field === 'Count') {
        setBhkRoomDetails(prev => {
          const key = `0-${idx}`;
          const details = { ...(prev[key] || { 'Count': {}, 'Length (ft)': {}, 'Width (ft)': {}, 'Door': {}, 'Window': {} }) };
          // If value is an object, update all counts
          if (typeof value === 'object') {
            details['Count'] = { ...value };
          } else {
            // If value is a number/string, update all rooms to this count
            Object.keys(details['Count']).forEach(roomName => {
              details['Count'][roomName] = value;
            });
          }
          return { ...prev, [key]: details };
        });
      }
    } else {
      setFloorBHKConfigs(prev => {
        const rows = [...getFloorRows(floorIdx)];
        rows[idx][field] = field === 'units' || field === 'area' ? Number(value) : value;
        return { ...prev, [floorIdx]: rows };
      });

      // If type or area is changed, re-initialize modal details for this row
      if (field === 'type' || field === 'area') {
        // Find the config for the new type/area
        let config = null;
        let shouldUpdate = false;
        if (field === 'type') {
          // If type is changed, area may not be updated yet, so use first available area
          const availableAreas = getCarpetAreaOptions(value);
          if (availableAreas.length > 0) {
            config = allBhkConfigs.find(c => c.type === value && String(c.total_carpet_area_sqft) === String(availableAreas[0]));
            shouldUpdate = !!config;
          }
        } else {
          // If area is changed, use the current type
          const rows = getFloorRows(floorIdx);
          const rowType = rows[idx]?.type;
          if (rowType) {
            config = allBhkConfigs.find(c => c.type === rowType && String(c.total_carpet_area_sqft) === String(value));
            shouldUpdate = !!config;
          }
        }
        if (shouldUpdate && config && Array.isArray(config.rooms)) {
          setBhkRoomDetails(prevDetails => {
            const newDetails = { ...prevDetails };
            const key = `${floorIdx}-${idx}`;
            let modalDetails = {
              'Count': {},
              'Length (ft)': {},
              'Width (ft)': {},
              'Door': {},
              'Window': {}
            };
            config.rooms.forEach(room => {
              modalDetails['Count'][room.name] = 1;
              modalDetails['Length (ft)'][room.name] = room.dimensions_ft?.length || '';
              modalDetails['Width (ft)'][room.name] = room.dimensions_ft?.width || '';
              modalDetails['Door'][room.name] = room.Door ? {
                count: room.Door.count || 0,
                width: room.Door.width || 0,
                height: room.Door.height || 0
              } : { count: 0, width: 0, height: 0 };
              modalDetails['Window'][room.name] = room.Window ? {
                count: room.Window.count || 0,
                width: room.Window.width || 0,
                height: room.Window.height || 0
              } : { count: 0, width: 0, height: 0 };
            });
            newDetails[key] = modalDetails;
            return newDetails;
          });
        }
        // If config not found or type is not set, do not update modal details (preserve previous)
      }
    }
  }

  // Handler to add/remove row for a floor
  function handleFloorAddRow(floorIdx) {
    // Add the new row
    // Check if this is Ground Floor without rooms (uses bhkRows) or with rooms (uses floorBHKConfigs)
    if (floorIdx === 0 && !groundFloorHasRooms) {
      setBhkRows(prevRows => {
        const updatedRows = [...prevRows, { type: '', units: 1, area: '', rooms: '' }];
        // Add default bhkRoomDetails for the new row for Ground Floor, with dynamic columns if type/area set
        setBhkRoomDetails(prevDetails => {
          const newDetails = { ...prevDetails };
          const key = `0-${updatedRows.length - 1}`;
          const newRow = updatedRows[updatedRows.length - 1];
          // Try to auto-populate columns if type and area are set
          let modalDetails = { 'Count': {}, 'Length (ft)': {}, 'Width (ft)': {} };
          if (newRow.type && newRow.area && Array.isArray(allBhkConfigs)) {
            const config = allBhkConfigs.find(c => c.type === newRow.type && String(c.total_carpet_area_sqft) === String(newRow.area));
            if (config && Array.isArray(config.rooms)) {
              config.rooms.forEach(room => {
                modalDetails['Count'][room.name] = 1;
                modalDetails['Length (ft)'][room.name] = room.dimensions_ft?.length || '';
                modalDetails['Width (ft)'][room.name] = room.dimensions_ft?.width || '';
              });
              
            }
          }
          newDetails[key] = modalDetails;
          return newDetails;
        });
        return updatedRows;
      });
    } else {
      setFloorBHKConfigs(prev => {
        const rows = [...getFloorRows(floorIdx), { type: '', units: 1, area: '', rooms: '' }];
        // Also add default bhkRoomDetails for the new row
        setBhkRoomDetails(prevDetails => {
          const newDetails = { ...prevDetails };
          const key = `${floorIdx}-${rows.length - 1}`;
          if (!newDetails[key]) {
            newDetails[key] = {
             'Count': {},
    'Length (ft)': {},
    'Width (ft)': {},
    'Door': {},
    'Window': {}
            };
          }
          return newDetails;
        });
        return { ...prev, [floorIdx]: rows };
      });
    }
  }
  function handleFloorRemoveRow(floorIdx, idx) {
    // Check if this is Ground Floor without rooms (uses bhkRows) or with rooms (uses floorBHKConfigs)
    if (floorIdx === 0 && !groundFloorHasRooms) {
      setBhkRows(getFloorRows(floorIdx).filter((_, i) => i !== idx));
    } else {
      setFloorBHKConfigs(prev => {
        const rows = [...getFloorRows(floorIdx)].filter((_, i) => i !== idx);
        return { ...prev, [floorIdx]: rows };
      });
    }
  }
  // eslint-disable-next-line no-unused-vars
  function handleFloorAdjust(floorIdx) {
    const rows = getFloorRows(floorIdx);
    const gridTotalArea = rows.reduce((sum, row) => sum + (row.units * (parseInt(row.area) || 0)), 0);
    if (gridTotalArea === 0 || totalCarpetArea === 0) return;
    const scale = totalCarpetArea / gridTotalArea;
    if (floorIdx === 0) {
      setBhkRows(rows.map(row => ({ ...row, area: Math.round((parseInt(row.area) || 0) * scale) })));
    } else {
      setFloorBHKConfigs(prev => ({
        ...prev,
        [floorIdx]: rows.map(row => ({ ...row, area: Math.round((parseInt(row.area) || 0) * scale) }))
      }));
    }
  }
const totalCarpetArea = (Number(width) && Number(depth)) ? (Number(width) * Number(depth) * (carpetPercent/100)) : 0;

  if (width && depth) {
    // Responsive base sizes
    //const OUTER_WIDTH = Math.min(window.innerWidth * 0.96, 800);
    //const OUTER_HEIGHT = Math.min(window.innerWidth * 0.60, 320);
    //const MAX_WIDTH = OUTER_WIDTH * 0.8;
    //const MAX_HEIGHT = OUTER_HEIGHT * 0.8;
    // Rectangle sizes (clamped for mobile)
    // Increase scale so rectangles are always visible, even for small SBA
  //const SCALE_FACTOR = 0.5; // Even higher scale for maximum visibility
    //const sbaWidth = Math.max(120, Math.min(MAX_WIDTH, Number(width) * SCALE_FACTOR));
    //const sbaHeight = Math.max(60, Math.min(MAX_HEIGHT, Number(depth) * SCALE_FACTOR));
    //const buaWidth = Math.max(90, Math.min(sbaWidth - 24, (Number(width) * (buildupPercent/100)) * SCALE_FACTOR));
    //const buaHeight = Math.max(45, Math.min(sbaHeight - 24, (Number(depth) * (buildupPercent/100)) * SCALE_FACTOR));
    //const caWidth = Math.max(60, Math.min(buaWidth - 24, (Number(width) * (carpetPercent/100)) * SCALE_FACTOR));
    //const caHeight = Math.max(30, Math.min(buaHeight - 24, (Number(depth) * (carpetPercent/100)) * SCALE_FACTOR));

  


   
    
  }

  const handleCircleClick = (s) => {
    setStep(s);
  };

  // Excel download logic
 
  
  // Handler to open modal
  async function handleOpenBHKModal(floorIdx, idx) {
    // Use a single variable for the modal key and currentRoomDetails
    const modalKey = `${floorIdx}-${idx}`;
    // Get selected BHK type and area first
    const rows = getFloorRows(floorIdx);
    const bhkType = rows[idx]?.type;
    const bhkArea = rows[idx]?.area;
    // Don't open modal if no BHK type or area is selected, or if row does not exist
    if (!rows[idx] || !bhkType || !bhkArea || bhkType === '' || bhkArea === '') {
      alert('Please fill in BHK Type and Carpet Area for this row first.');
      return;
    }
    
    setBhkModalFloorIdx(floorIdx);
    setBhkModalIdx(idx);
    setIsTableReady(false); // Reset table ready state
    
    try {
      // Check if this unit has saved room data from the database
      const hasSavedRoomData = savedRoomUnits.has(modalKey);
      
      if (hasSavedRoomData) {
        // Data is from saved estimation (database)
        setRoomDataSource(`Saved Estimation Data (${bhkType} - ${bhkArea} sq ft)`);
        
        const existingSavedDetails = bhkRoomDetails[modalKey];
        const savedRoomNames = Object.keys(existingSavedDetails['Count'] || {});
        setDynamicRoomColumns(savedRoomNames);
        
        setIsTableReady(false);
        setShowBHKModal(true);
        // Delay table rendering to ensure modal is fully mounted
        setTimeout(() => setIsTableReady(true), 100);
        return;
      }
      
      // No saved data in database, load from RoomConfiguration API
      setRoomDataSource(`Standard Room Configuration (${bhkType} - ${bhkArea} sq ft)`);
      
      // Load from RoomConfiguration API
      let configs;
      if (allBhkConfigs.length > 0) {
        configs = allBhkConfigs;
      } else {
        // Load BHK configuration data from API as fallback
        const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
        const endpoint = `${apiUrl}/api/RoomConfiguration`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to load BHK configuration');
        }
        configs = await response.json();
        // Update the cached data
        setAllBhkConfigs(configs);
      }
      
      // Find matching configuration by BHK type and area
      const matchedConfig = configs.find(config => 
        config.type === bhkType && config.total_carpet_area_sqft === parseInt(bhkArea)
      );
      
      if (matchedConfig) {
        // Use standard RoomConfiguration data
        setRoomDataSource(`Standard Room Configuration (${bhkType} - ${bhkArea} sq ft)`);
        // Use the original room objects from the JSON (with Door/Window fields)
        let originalRooms = [];
        try {
          // Use matchedConfig rooms directly
          if (matchedConfig.rooms && Array.isArray(matchedConfig.rooms)) {
            originalRooms = matchedConfig.rooms;
          }
        } catch (e) {
          console.error('Error loading originalRooms:', e);
          // Fallback to matchedConfig rooms
          if (matchedConfig.rooms && Array.isArray(matchedConfig.rooms)) {
            originalRooms = matchedConfig.rooms;
          }
        }
        
        console.log('Modal originalRooms:', originalRooms);
        const roomTypeMap = new Map();
        originalRooms.forEach(room => {
          let baseType;
          const nameWords = room.name.split(' ');
          if (nameWords.length > 1 && /^\d+$/.test(nameWords[nameWords.length - 1])) {
            baseType = nameWords.slice(0, -1).join(' ');
          } else {
            baseType = room.name;
          }
          if (!roomTypeMap.has(baseType)) {
            roomTypeMap.set(baseType, []);
          }
          roomTypeMap.get(baseType).push(room);
        });
        // Create dynamic column names with room numbering
        const dynamicColumns = [];
        const roomMapping = new Map();
        roomTypeMap.forEach((rooms, baseType) => {
          if (rooms.length === 1) {
            dynamicColumns.push(baseType);
            // Use room.name as the mapping key
            roomMapping.set(rooms[0].name, rooms[0]);
            // Debug log for mapping
            console.log('[Mapping] Single:', rooms[0].name, JSON.stringify(rooms[0]));
          } else {
            rooms.forEach((room, index) => {
              const displayName = `${baseType} ${index + 1}`;
              dynamicColumns.push(displayName);
              // Use room.name as the mapping key
              roomMapping.set(room.name, room);
              // Debug log for mapping
              console.log('[Mapping] Multi:', room.name, JSON.stringify(room));
            });
          }
        });
        // Debug: Log dynamicColumns before setting
        console.log('Modal dynamicColumns:', dynamicColumns);
        setDynamicRoomColumns(dynamicColumns);
        // Only set default room details if not already present (preserve user edits)
        const key = `${floorIdx}-${idx}`;
        setBhkRoomDetails(prev => {
          let roomDetails;
          if (prev[key]) {
            // Already exists, do not overwrite
            roomDetails = prev[key];
          } else {
            const roomDetails = {
              'Count': {},
              'Length (ft)': {},
              'Width (ft)': {},
              'Door': {},
              'Door Area (sqft)': {},
              'Window': {},
              'Window Area (sqft)': {}
            };
            roomMapping.forEach((roomData, displayName) => {
              // Debug: Show the displayName and full roomData for mapping
              console.log('Mapping room:', displayName, JSON.stringify(roomData));
              // Debug: Show Window object if present
              if (roomData.Window || roomData.window) {
                console.log('Window object for', displayName, roomData.Window || roomData.window);
              } else {
                console.log('No Window object for', displayName);
              }
              // Support both 'Door'/'door' and 'Window'/'window' keys (case-insensitive)
              const doorObjRaw = roomData.Door || roomData.door;
              const windowObjRaw = roomData.Window || roomData.window;
              roomDetails['Door'][displayName] = doorObjRaw ? {
                count: doorObjRaw.count || 0,
                width: doorObjRaw.width || 0,
                height: doorObjRaw.height || 0
              } : { count: 0, width: 0, height: 0 };
              roomDetails['Window'][displayName] = windowObjRaw ? {
                count: windowObjRaw.count || 0,
                width: windowObjRaw.width || 0,
                height: windowObjRaw.height || 0
              } : { count: 0, width: 0, height: 0 };
              if (displayName.toLowerCase().includes('bathroom')) {
                roomDetails['Count'][displayName] = matchedConfig.bathroom_count || 1;
              } else {
                roomDetails['Count'][displayName] = 1;
              }
              roomDetails['Length (ft)'][displayName] = roomData.dimensions_ft.length;
              roomDetails['Width (ft)'][displayName] = roomData.dimensions_ft.width;
              roomDetails['Door Area (sqft)'][displayName] = roomData.door_area_sqft || 0;
              roomDetails['Window Area (sqft)'][displayName] = roomData.window_area_sqft || 0;
            });
          }
          // Debug: Show the full roomDetails object after mapping Door fields
          console.log('Modal roomDetails loaded from JSON:', roomDetails);
          if (prev[key]) {
            return prev;
          }
          return {
            ...prev,
            [key]: roomDetails
          };
        });
        setIsTableReady(false);
        setTimeout(() => {
          setShowBHKModal(true);
          // Delay table rendering to ensure modal is fully mounted
          setTimeout(() => setIsTableReady(true), 100);
        }, 0);
      } else {
        // Fallback to static columns if no match found
        setDynamicRoomColumns([...roomColumns, 'Circulation Space']);
        // Always initialize bhkRoomDetails with all required fields for fallback
        const key = `${floorIdx}-${idx}`;
        setBhkRoomDetails(prev => {
          if (prev[key]) {
            return prev;
          }
          // Use roomColumns for fallback
          const roomDetails = {
            'Count': {},
            'Length (ft)': {},
            'Width (ft)': {},
            'Door': {},
            'Door Area (sqft)': {},
            'Window': {},
            'Window Area (sqft)': {}
          };
          [...roomColumns, 'Circulation Space'].forEach(roomName => {
            roomDetails['Count'][roomName] = 1;
            roomDetails['Length (ft)'][roomName] = 0;
            roomDetails['Width (ft)'][roomName] = 0;
            // Unified Door object
            roomDetails['Door'][roomName] = { count: 0, width: 0, height: 0 };
            roomDetails['Door Area (sqft)'][roomName] = 0;
            // Unified Window object
            roomDetails['Window'][roomName] = { count: 0, width: 0, height: 0 };
            roomDetails['Window Area (sqft)'][roomName] = 0;
          });
          return {
            ...prev,
            [key]: roomDetails
          };
        });
        console.warn(`No BHK configuration found for ${bhkType} with ${bhkArea} sq ft`);
        setIsTableReady(false);
        setShowBHKModal(true);
        setTimeout(() => setIsTableReady(true), 100);
      }
    } catch (error) {
      console.error('Error loading BHK configuration:', error);
      // Fallback to static columns
      setDynamicRoomColumns([...roomColumns, 'Circulation Space']);
      setIsTableReady(false);
      setShowBHKModal(true);
      setTimeout(() => setIsTableReady(true), 100);
    }
  }
  // Handler to close modal
  function handleCloseBHKModal() {
    setShowBHKModal(false);
    setBhkModalIdx(null);
    setBhkModalFloorIdx(null);
    setIsTableReady(false);
  }

  // Handler for OK button in modal (now only closes the modal)
  function handleOkBHKModal() {
    handleCloseBHKModal();
  }

  // Helper function to convert bhkRoomDetails to flat Handsontable data
  function getBHKHandsontableData() {
    if (bhkModalFloorIdx == null || bhkModalIdx == null) return [];
    
    const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
    const details = bhkRoomDetails[key];
    
    // Return empty array if details are not initialized
    if (!details || typeof details !== 'object') {
      return [];
    }
    
    // Ensure dynamicRoomColumns has values
    if (!dynamicRoomColumns || dynamicRoomColumns.length === 0) {
      return [];
    }
    
    const rowLabels = [
      'Count',
      'Length (ft)',
      'Width (ft)',
      'Total Carpet Area',
      'Door Count',
      'Door Width (ft)',
      'Door Height (ft)',
      'Door Area (sqft)',
      'Window Count',
      'Window Width (ft)',
      'Window Height (ft)',
      'Window Area (sqft)'
    ];
    
    const data = rowLabels.map(rowLabel => {
      const rowData = { 'Row Label': rowLabel };
      
      dynamicRoomColumns.forEach(col => {
        if (rowLabel === 'Total Carpet Area') {
          // Calculate total carpet area: Count × Length × Width
          const count = Number((details['Count'] && details['Count'][col]) || 0);
          const length = Number((details['Length (ft)'] && details['Length (ft)'][col]) || 0);
          const width = Number((details['Width (ft)'] && details['Width (ft)'][col]) || 0);
          rowData[col] = count * length * width;
        } else if (rowLabel === 'Door Count') {
          const doorObj = (details['Door'] && details['Door'][col]) || {};
          rowData[col] = doorObj.count || 0;
        } else if (rowLabel === 'Door Width (ft)') {
          const doorObj = (details['Door'] && details['Door'][col]) || {};
          rowData[col] = doorObj.width || 0;
        } else if (rowLabel === 'Door Height (ft)') {
          const doorObj = (details['Door'] && details['Door'][col]) || {};
          rowData[col] = doorObj.height || 0;
        } else if (rowLabel === 'Door Area (sqft)') {
          const doorObj = (details['Door'] && details['Door'][col]) || {};
          const count = doorObj.count || 0;
          const width = doorObj.width || 0;
          const height = doorObj.height || 0;
          rowData[col] = count * width * height;
        } else if (rowLabel === 'Window Count') {
          const windowObj = (details['Window'] && details['Window'][col]) || {};
          rowData[col] = windowObj.count || 0;
        } else if (rowLabel === 'Window Width (ft)') {
          const windowObj = (details['Window'] && details['Window'][col]) || {};
          rowData[col] = windowObj.width || 0;
        } else if (rowLabel === 'Window Height (ft)') {
          const windowObj = (details['Window'] && details['Window'][col]) || {};
          rowData[col] = windowObj.height || 0;
        } else if (rowLabel === 'Window Area (sqft)') {
          const windowObj = (details['Window'] && details['Window'][col]) || {};
          const count = windowObj.count || 0;
          const width = windowObj.width || 0;
          const height = windowObj.height || 0;
          rowData[col] = count * width * height;
        } else {
          // Count, Length, Width
          rowData[col] = (details[rowLabel] && details[rowLabel][col]) || 0;
        }
      });
      
      return rowData;
    });
    
    return data;
  }

  // Handler for Handsontable cell changes
  function handleBHKTableChange(changes, source) {
    if (!changes || source === 'loadData') return;
    
    const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
    const hotInstance = bhkHotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const sourceData = hotInstance.getSourceData();
    
    setBhkRoomDetails(prev => {
      const updated = { ...prev };
      if (!updated[key]) {
        updated[key] = {
          'Count': {},
          'Length (ft)': {},
          'Width (ft)': {},
          'Door': {},
          'Window': {}
        };
      }
      
      // Deep copy Door and Window objects
      updated[key] = {
        ...updated[key],
        'Door': { ...(updated[key]['Door'] || {}) },
        'Window': { ...(updated[key]['Window'] || {}) }
      };
      
      changes.forEach(([row, prop, oldValue, newValue]) => {
        if (prop === 'Row Label') return; // Skip row label column
        
        const rowData = sourceData[row];
        const rowLabel = rowData['Row Label'];
        const col = prop; // Column name (room name)
        const value = Number(newValue) || 0;
        
        // Update the appropriate nested structure
        if (rowLabel === 'Count' || rowLabel === 'Length (ft)' || rowLabel === 'Width (ft)') {
          if (!updated[key][rowLabel]) updated[key][rowLabel] = {};
          updated[key][rowLabel][col] = value;
        } else if (rowLabel === 'Door Count') {
          if (!updated[key]['Door'][col]) updated[key]['Door'][col] = { count: 0, width: 0, height: 0 };
          updated[key]['Door'][col] = { ...updated[key]['Door'][col], count: value };
        } else if (rowLabel === 'Door Width (ft)') {
          if (!updated[key]['Door'][col]) updated[key]['Door'][col] = { count: 0, width: 0, height: 0 };
          updated[key]['Door'][col] = { ...updated[key]['Door'][col], width: value };
        } else if (rowLabel === 'Door Height (ft)') {
          if (!updated[key]['Door'][col]) updated[key]['Door'][col] = { count: 0, width: 0, height: 0 };
          updated[key]['Door'][col] = { ...updated[key]['Door'][col], height: value };
        } else if (rowLabel === 'Window Count') {
          if (!updated[key]['Window'][col]) updated[key]['Window'][col] = { count: 0, width: 0, height: 0 };
          updated[key]['Window'][col] = { ...updated[key]['Window'][col], count: value };
        } else if (rowLabel === 'Window Width (ft)') {
          if (!updated[key]['Window'][col]) updated[key]['Window'][col] = { count: 0, width: 0, height: 0 };
          updated[key]['Window'][col] = { ...updated[key]['Window'][col], width: value };
        } else if (rowLabel === 'Window Height (ft)') {
          if (!updated[key]['Window'][col]) updated[key]['Window'][col] = { count: 0, width: 0, height: 0 };
          updated[key]['Window'][col] = { ...updated[key]['Window'][col], height: value };
        }
      });
      
      return updated;
    });
    
    // Recalculate and update calculated rows
    setTimeout(() => {
      const hotInstance = bhkHotTableRef.current?.hotInstance;
      if (!hotInstance) return;
      
      const data = hotInstance.getSourceData();
      
      data.forEach((rowData, rowIndex) => {
        const rowLabel = rowData['Row Label'];
        
        dynamicRoomColumns.forEach(col => {
          if (rowLabel === 'Total Carpet Area') {
            const countRow = data.find(r => r['Row Label'] === 'Count');
            const lengthRow = data.find(r => r['Row Label'] === 'Length (ft)');
            const widthRow = data.find(r => r['Row Label'] === 'Width (ft)');
            
            const count = Number(countRow?.[col] || 0);
            const length = Number(lengthRow?.[col] || 0);
            const width = Number(widthRow?.[col] || 0);
            const calculated = count * length * width;
            
            if (rowData[col] !== calculated) {
              hotInstance.setDataAtRowProp(rowIndex, col, calculated, 'calculation');
            }
          } else if (rowLabel === 'Door Area (sqft)') {
            const doorCountRow = data.find(r => r['Row Label'] === 'Door Count');
            const doorWidthRow = data.find(r => r['Row Label'] === 'Door Width (ft)');
            const doorHeightRow = data.find(r => r['Row Label'] === 'Door Height (ft)');
            
            const count = Number(doorCountRow?.[col] || 0);
            const width = Number(doorWidthRow?.[col] || 0);
            const height = Number(doorHeightRow?.[col] || 0);
            const calculated = count * width * height;
            
            if (rowData[col] !== calculated) {
              hotInstance.setDataAtRowProp(rowIndex, col, calculated, 'calculation');
            }
          } else if (rowLabel === 'Window Area (sqft)') {
            const windowCountRow = data.find(r => r['Row Label'] === 'Window Count');
            const windowWidthRow = data.find(r => r['Row Label'] === 'Window Width (ft)');
            const windowHeightRow = data.find(r => r['Row Label'] === 'Window Height (ft)');
            
            const count = Number(windowCountRow?.[col] || 0);
            const width = Number(windowWidthRow?.[col] || 0);
            const height = Number(windowHeightRow?.[col] || 0);
            const calculated = count * width * height;
            
            if (rowData[col] !== calculated) {
              hotInstance.setDataAtRowProp(rowIndex, col, calculated, 'calculation');
            }
          }
        });
      });
    }, 0);
  }

  // Get columns configuration for BHK Handsontable
  function getBHKHandsontableColumns() {
    // Safety check for dynamicRoomColumns
    if (!dynamicRoomColumns || dynamicRoomColumns.length === 0) {
      return [];
    }
    
    const columns = [
      {
        data: 'Row Label',
        title: '',
        readOnly: true,
        className: 'htLeft htMiddle',
        width: 150
      }
    ];
    
    dynamicRoomColumns.forEach(col => {
      columns.push({
        data: col,
        title: col === 'Circulation Space' ? 'Circulation Space' : col,
        type: 'numeric',
        numericFormat: {
          pattern: '0,0.00'
        },
        className: 'htCenter htMiddle',
        width: 100
      });
    });
    
    return columns;
  }

  // Cell styling function for BHK Handsontable
  function bhkCellRenderer(instance, td, row, col, prop, value, cellProperties) {
    const rowLabel = instance.getDataAtRowProp(row, 'Row Label');
    
    // Apply default renderer first
    if (cellProperties.type === 'numeric') {
      Handsontable.renderers.NumericRenderer.apply(this, arguments);
    } else {
      Handsontable.renderers.TextRenderer.apply(this, arguments);
    }
    
    // Style row label column
    if (col === 0) {
      td.style.fontWeight = '600';
      td.style.background = '#f5f5f5';
      td.style.textAlign = 'right';
      td.style.fontSize = '0.8rem';
      td.style.paddingRight = '10px';
      
      // Special styling for section headers
      if (rowLabel === 'Total Carpet Area') {
        td.style.background = '#e3f2fd';
        td.style.color = '#1976d2';
        td.style.fontWeight = '700';
      } else if (rowLabel.includes('Door')) {
        td.style.background = '#fffbe7';
        td.style.color = '#b8860b';
        if (rowLabel === 'Door Count') {
          td.style.fontWeight = '700';
        }
      } else if (rowLabel.includes('Window')) {
        td.style.background = '#e7f7ff';
        td.style.color = '#1976d2';
        if (rowLabel === 'Window Count') {
          td.style.fontWeight = '700';
        }
      }
    } else {
      // Style data cells
      td.style.fontSize = '0.85rem';
      
      // Calculated rows - read-only and highlighted
      if (rowLabel === 'Total Carpet Area') {
        td.style.background = '#e8f5e9';
        td.style.color = '#388e3c';
        td.style.fontWeight = '700';
        cellProperties.readOnly = true;
      } else if (rowLabel === 'Door Area (sqft)') {
        td.style.background = '#fff9e6';
        td.style.color = '#b8860b';
        td.style.fontWeight = '600';
        cellProperties.readOnly = true;
      } else if (rowLabel === 'Window Area (sqft)') {
        td.style.background = '#e3f2fd';
        td.style.color = '#1976d2';
        td.style.fontWeight = '600';
        cellProperties.readOnly = true;
      }
    }
    
    return td;
  }

  

// Removed redundant nested block and unused function parseRoomData
  // ...existing code...
    // Filter components for Step 3 grid (Floor Component)

    // --- New Approach: Calculate all floors' components once, then filter for selected floor ---
    //import { useMemo } from 'react';

    // Helper to get floor type string
    const getFloorType = (floorIdx, totalFloors) => {
  if (floorIdx === 0) return 'Foundation';
  if (floorIdx === 1) return 'Ground Floor';
  if (floorIdx >= 2) {
    const n = floorIdx - 1;
    let suffix = 'th';
    if (n % 10 === 1 && n % 100 !== 11) suffix = 'st';
    else if (n % 10 === 2 && n % 100 !== 12) suffix = 'nd';
    else if (n % 10 === 3 && n % 100 !== 13) suffix = 'rd';
    return `${n}${suffix} Floor`;
  }
  return 'Unknown';
    };

   // Calculate all floors' components ONCE and memoize
    const allFloorsComponents = useMemo(() => {
  if (!areaCalculationLogic?.calculation_components) return [];
  const nAboveGround = Number(floors) || 1;
  // Always generate Foundation, Ground, and N above-ground floors
  const totalFloors = nAboveGround + 1;
  const floorLabels = Array.from({ length: totalFloors + 1 }, (_, floorIdx) => getFloorType(floorIdx, totalFloors));
  // For each floor index (0 = Foundation, 1 = Ground, ... N = Top)
  return floorLabels.map((floorType, floorIdx) => {
    // Normalize a string for robust floor matching
    const normalize = s => String(s).toLowerCase().replace(/\s|\./g, '');
    // Lookup beam/column config for this floor, fallback to 'Other Floors' for upper floors
    let floorBeamColumnConfig = beamColumnConfig && Array.isArray(beamColumnConfig) ? beamColumnConfig.find(item => item.floor === floorType) : null;
    if (!floorBeamColumnConfig && floorIdx >= 2 && beamColumnConfig && Array.isArray(beamColumnConfig)) {
      floorBeamColumnConfig = beamColumnConfig.find(item => item.floor === 'Other Floors');
    }
    // Always inject floorHeight into vars, fallback to 10 if not present
    const injectedFloorHeight = (floorBeamColumnConfig && typeof floorBeamColumnConfig.floorHeight !== 'undefined')
      ? Number(floorBeamColumnConfig.floorHeight)
      : 10;
    // For each component, check if it applies to this floor
    const comps = Object.entries(areaCalculationLogic.calculation_components)
      .filter(([_, comp]) => {
        const applicableFloors = comp["Applicable Floors"];
        if (!applicableFloors) return true;
        const normFloorType = normalize(floorType);
        const normApplicable = applicableFloors.map(f => normalize(f));
        // Foundation
        if (normFloorType === 'foundation') {
          return normApplicable.includes('foundation');
        }
        // Ground Floor
        if (normFloorType === 'groundfloor') {
          return normApplicable.includes('groundfloor');
        }
        // Top Floor
        if (normApplicable.includes('topfloor')) {
          if (floorIdx === totalFloors) return true;
        }
        // Middle Floors
        if (normApplicable.includes('middlefloors')) {
          if (floorIdx > 1 && floorIdx < totalFloors) return true;
        }
        // All Floors
        if (normApplicable.includes('allfloors')) return true;
        // Direct match
        if (normApplicable.includes(normFloorType)) return true;
        return false;
      })
      .map(([key, comp]) => {
        // Prepare variables for formula evaluation
        const vars = {
          width: Number(width) || 0,
          depth: Number(depth) || 0,
          floors: totalFloors,
          carpetPercent: Number(carpetPercent) || 0,
          buildupPercent: Number(buildupPercent) || 0,
          constructionPerimeter: Number(constructionPerimeter) || 0,
          lift: lift ? 1 : 0,
          sba: Number(buildupPercent) || 0,
          carpetArea: Number(carpetAreaSqFt) || 0,
          super_buildup_area: Number(buildupPercent) || 0,
          ground_floor_sba: Number(buildupPercent) || 0,
          buildup_area: Number(buildupPercent) || 0,
          // Add beam/column config values if available
          ...(floorBeamColumnConfig && floorBeamColumnConfig.beam ? {
            beamGridSpacing: floorBeamColumnConfig.beam.gridSpacing,
            beamWidth: floorBeamColumnConfig.beam.width,
            beamDepth: floorBeamColumnConfig.beam.depth
          } : {}),
          ...(floorBeamColumnConfig && floorBeamColumnConfig.column ? {
            columnGridSpacing: floorBeamColumnConfig.column.gridSpacing,
            columnWidth: floorBeamColumnConfig.column.width,
            columnDepth: floorBeamColumnConfig.column.depth,
            columnHeight: floorBeamColumnConfig.column.height
          } : {}),
          floorHeight: injectedFloorHeight
        };
        // ...existing code for area, percentage, thickness, logic, etc...
        // At the end, expose config values in the returned object for UI/debug
       
        // Compose the original return object (copied from below), but add config-driven values
        // (We will patch each return statement for each component type below)
        // For each return { ... } below, add:
        // ...(floorBeamColumnConfig && floorBeamColumnConfig.beam ? { beamGridSpacing: floorBeamColumnConfig.beam.gridSpacing, beamWidth: floorBeamColumnConfig.beam.width, beamDepth: floorBeamColumnConfig.beam.depth } : {}),
        // ...(floorBeamColumnConfig && floorBeamColumnConfig.column ? { columnGridSpacing: floorBeamColumnConfig.column.gridSpacing, columnWidth: floorBeamColumnConfig.column.width, columnDepth: floorBeamColumnConfig.column.depth, columnHeight: floorBeamColumnConfig.column.height } : {})
        // We'll patch each return below.
            let area = '-';
            let percentage = comp.percentage ? comp.percentage * 100 : '-';
            if (editablePercentages[key] !== undefined) {
              percentage = editablePercentages[key];
            }
            let thickness = comp.thickness || '-';
            if (editableThickness[key] !== undefined) {
              thickness = editableThickness[key];
            }
            let logic = comp.description || comp.formula || '';

            // Custom logic for Internal Walls
            if (key === 'internal_walls') {
              const config = comp;
              // Prefer floorHeight from vars (from Step 1 config), fallback to config.height or 10
              const height = (typeof vars.floorHeight !== 'undefined' ? vars.floorHeight : (config.height || 10));
              const sharedWallReduction = config.shared_wall_reduction || 0.2;
              const bhkRowsForDebug = typeof getFloorRows === 'function' ? getFloorRows(floorIdx - 1 || 0) : [];
              let totalDoors = 0;
              let totalWindows = 0;
              let bhkSections = [];
              let finalWallArea = 0;
              let totalWallArea = 0;
              bhkRowsForDebug.forEach((row, idx) => {
                let latestUnits = 1;
                if (Array.isArray(getFloorRows(floorIdx - 1 || 0))) {
                  const parentRow = getFloorRows(floorIdx - 1 || 0)[idx];
                  latestUnits = Number(parentRow?.units) || 1;
                }
                const bhkHeader = `${idx + 1}.${row.type} (Units: ${latestUnits})`;
                let roomDetailsArr = [];
                const roomDataKey = `${floorIdx - 1 || 0}-${idx}`;
                const currentRoomDetails = bhkRoomDetails && bhkRoomDetails[roomDataKey];
                if (!currentRoomDetails) {
                  return;
                }
                let roomWallArea = 0;
                let doors = 0, windows = 0;
                let doorArea = 0, windowArea = 0;
                if (currentRoomDetails['Length (ft)'] && currentRoomDetails['Width (ft)']) {
                  Object.keys(currentRoomDetails['Length (ft)']).forEach(roomKey => {
                    if (roomKey.toLowerCase().includes('balcony')) return;
                    const length = Number(currentRoomDetails['Length (ft)'][roomKey]) || 0;
                    const width = Number(currentRoomDetails['Width (ft)'][roomKey]) || 0;
                    const roomCount = Number(currentRoomDetails['Count']?.[roomKey] || 0);
                    if (length > 0 && width > 0) {
                      const perimeter = 2 * (length + width);
                      const wallAreaPerRoom = perimeter * height * roomCount * latestUnits;
                      roomWallArea += wallAreaPerRoom;
                      roomDetailsArr.push(`${roomKey}: ${length}x${width}x${height} = ${wallAreaPerRoom.toFixed(0)} sqft`);
                    }
                  });
                }
                roomDetailsArr.push(`Total Rooms Area: ${roomWallArea} sqft`);
                if (currentRoomDetails['Door']) {
                  Object.keys(currentRoomDetails['Door']).forEach(roomKey => {
                    const door = currentRoomDetails['Door'][roomKey] || { count: 0, width: 0, height: 0 };
                    const doorcount = Number(door.count) || 0;
                    const width = Number(door.width) || 0;
                    const height = Number(door.height) || 0;
                    doorArea += doorcount * width * height;
                    doors += doorcount;
                  });
                }
                if (currentRoomDetails['Window']) {
                  Object.keys(currentRoomDetails['Window']).forEach(roomKey => {
                    const window = currentRoomDetails['Window'][roomKey] || { count: 0, width: 0, height: 0 };
                    const windowcount = Number(window.count) || 0;
                    const width = Number(window.width) || 0;
                    const height = Number(window.height) || 0;
                    windowArea += windowcount * width * height;
                    windows += windowcount;
                  });
                }
                const sharedWallReductionArea = roomWallArea * sharedWallReduction;
                const doorDeduction = doorArea * latestUnits;
                const windowDeduction = windowArea * latestUnits;
                totalDoors += doors * (latestUnits || 1);
                totalWindows += windows * (latestUnits || 1);
                finalWallArea = Math.max(0, roomWallArea - (sharedWallReductionArea + doorDeduction + windowDeduction));
                totalWallArea += finalWallArea;
                let TotalDeduction = doorDeduction + windowDeduction + sharedWallReductionArea;
                roomDetailsArr.push(`Total Deduction: ${TotalDeduction.toFixed(0)} sqft`);
                const calcBreakdownArr = [];
                calcBreakdownArr.push(`Shared Wall Reduction: ${sharedWallReduction * 100}% × Room Area = ${sharedWallReductionArea} sqft`);
                calcBreakdownArr.push(`Door Deduction: For ${doors * latestUnits} Doors = ${(doorDeduction).toFixed(0)} sqft`);
                calcBreakdownArr.push(`Window Deduction: For ${windows * latestUnits} Windows = ${(windowDeduction).toFixed(0)} sqft`);
                calcBreakdownArr.push(`Final Total Wall Area: ${(finalWallArea).toFixed(0)} sqft`);
                bhkSections.push([bhkHeader, ...roomDetailsArr, '--- Calculation Breakdown ---', ...calcBreakdownArr].join('\n'));
              });
              area = totalWallArea.toFixed(0);
              logic = `Formula: Wall area minus ${sharedWallReduction * 100}% shared wall area, doors (${totalDoors}), windows (${totalWindows})`;
              return {
                key,
                ...comp,
                area,
                percentage,
                thickness,
                logic,
                logicDetails: bhkSections.join(' | '),
                isEditable: comp.percentage !== undefined,
                isThicknessEditable: thickness !== undefined && thickness !== null && Number(thickness) !== 0,
                component: key,
                // Calculate volume_cuft for all scenarios
                volume_cuft: (() => {
                  const numArea = Number(area);
                  const numThickness = Number(thickness);
                  if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
                    if (!isNaN(numThickness) && numThickness !== 0 && thickness !== '-') {
                      return numArea * numThickness; // ft^2 * ft * 12 = cuft
                    } else {
                      return numArea; // Only area is relevant (tiles, paint, etc.)
                    }
                  }
                  return 0;
                })(),
                FloorName: floorType,
                ...(floorBeamColumnConfig && floorBeamColumnConfig.beam ? {
                  beamGridSpacing: floorBeamColumnConfig.beam.gridSpacing,
                  beamWidth: floorBeamColumnConfig.beam.width,
                  beamDepth: floorBeamColumnConfig.beam.depth
                } : {}),
                ...(floorBeamColumnConfig && floorBeamColumnConfig.column ? {
                  columnGridSpacing: floorBeamColumnConfig.column.gridSpacing,
                  columnWidth: floorBeamColumnConfig.column.width,
                  columnDepth: floorBeamColumnConfig.column.depth,
                  columnHeight: floorBeamColumnConfig.column.height
                } : {})
              };
            }
            // Custom Logic for External Walls
            if (key === 'external_walls') {
              const config = comp;
              const height = (typeof vars.floorHeight !== 'undefined' ? vars.floorHeight : (config.height || 10));
              area = vars.constructionPerimeter * height * vars.floors;
              logic = `Construction Perimeter: ${vars.constructionPerimeter}×Floor Height: ${height}×${vars.floors} = ${area.toFixed(0)} sqft`;
              return { key, ...comp, area, percentage, thickness, logic, 
                isEditable: comp.percentage !== undefined,
                isThicknessEditable: thickness !== undefined && thickness !== null && Number(thickness) !== 0,
                component: key,
          // Calculate volume_cuft for all scenarios
          volume_cuft: (() => {
            const numArea = Number(area);
            const numThickness = Number(thickness);
            if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
              if (!isNaN(numThickness) && numThickness !== 0 && thickness !== '-') {
                return numArea * numThickness; // ft^2 * ft * 12 = cuft
              } else {
                return numArea; // Only area is relevant (tiles, paint, etc.)
              }
            }
            return 0;
          })(),
          FloorName: floorType
         };

           }
            if (key === 'Beams') {
              const L_sb = vars.width;
              const W_sb = vars.depth;
              const A_bu = 0.85 * L_sb * W_sb;
              const layout_ratio = L_sb / W_sb;
              const W_bu = Math.sqrt(A_bu / layout_ratio);
              const L_bu = layout_ratio * W_bu;
              const gridSpacing = vars.beamGridSpacing || 15;
            const columnWidth = vars.beamWidth || 1;
            const columnDepth = vars.beamDepth || 1.5;
              const columnsPerRow = Math.floor(L_bu / gridSpacing) + 1;
              const rowsOfColumns = Math.floor(W_bu / gridSpacing) + 1;
              const crossSection = columnWidth * columnDepth;
              const totalBeamsCount = rowsOfColumns * (columnsPerRow - 1) + columnsPerRow * (rowsOfColumns - 1);
              area = totalBeamsCount * crossSection * gridSpacing;
              logic = `Grid: ${totalBeamsCount} beams, ${gridSpacing}ft spacing, cross-section ${crossSection} sqft`;
              return {
                key,
                ...comp,
                area,
                percentage,
                thickness,
                logic,
                isEditable: comp.percentage !== undefined,
                isThicknessEditable: thickness !== undefined && thickness !== null && Number(thickness) !== 0,
                component: key,
                volume_cuft: (() => {
                  const numArea = Number(area);
                  const numThickness = Number(thickness);
                  if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
                    if (!isNaN(numThickness) && numThickness !== 0 && thickness !== '-') {
                      return numArea * numThickness;
                    } else {
                      return numArea;
                    }
                  }
                  return 0;
                })(),
                FloorName: floorType
              };
            }
            if (key === 'Columns') {
              const L_sb = vars.width;
              const W_sb = vars.depth;
              const A_bu = 0.85 * L_sb * W_sb;
              const layout_ratio = L_sb / W_sb;
              const W_bu = Math.sqrt(A_bu / layout_ratio);
              const L_bu = layout_ratio * W_bu;
              const gridSpacing = vars.beamGridSpacing || 15;
            const columnWidth = vars.beamWidth || 1;
            const columnDepth = vars.beamDepth || 1.5;
              const columnsPerRow = Math.floor(L_bu / gridSpacing) + 1;
              const rowsOfColumns = Math.floor(W_bu / gridSpacing) + 1;
              const columnsCount = columnsPerRow * rowsOfColumns;
              const crossSection = columnWidth * columnDepth;
              area = columnsCount * crossSection;
              logic = `Grid: ${columnsCount} columns, ${columnsPerRow}x${rowsOfColumns} grid, cross-section ${crossSection} sqft`;
              return {
                key,
                ...comp,
                area,
                percentage,
                thickness,
                logic,
                isEditable: comp.percentage !== undefined,
                isThicknessEditable: thickness !== undefined && thickness !== null && Number(thickness) !== 0,
                component: key,
                volume_cuft: (() => {
                  const numArea = Number(area);
                  const numThickness = Number(thickness);
                  if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
                    if (!isNaN(numThickness) && numThickness !== 0 && thickness !== '-') {
                      return numArea * numThickness;
                    } else {
                      return numArea;
                    }
                  }
                  return 0;
                })(),
                FloorName: floorType
              };
            }
            if (key === 'ExcavationVolume') {
              let usedPercentage = comp.percentage;
              if (editablePercentages[key] !== undefined) {
                usedPercentage = editablePercentages[key] / 100;
              }
              let usedThickness = comp.thickness;
              if (editableThickness[key] !== undefined) {
                usedThickness = editableThickness[key];
              }
              area = vars.super_buildup_area * (usedPercentage || 0);
              logic = `Excavation: ${percentage}% × Built-up Area (${vars.super_buildup_area}) = ${area.toFixed(0)} sqft, Thickness: ${usedThickness}ft`;
              return {
                key,
                ...comp,
                area,
                percentage,
                thickness: usedThickness,
                logic,
                isEditable: comp.percentage !== undefined,
                isThicknessEditable: usedThickness !== undefined && usedThickness !== null && Number(usedThickness) !== 0,
                component: key,
                volume_cuft: (() => {
                  const numArea = Number(area);
                  const numThickness = Number(usedThickness);
                  if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
                    if (!isNaN(numThickness) && numThickness !== 0 && usedThickness !== '-') {
                      return numArea * numThickness;
                    } else {
                      return numArea;
                    }
                  }
                  return 0;
                })(),
                FloorName: floorType
              };
            }
            if (key === 'BasementSlab') {
              let usedPercentage = comp.percentage;
              if (editablePercentages[key] !== undefined) {
                usedPercentage = editablePercentages[key] / 100;
              }
              let usedThickness = comp.thickness;
              if (editableThickness[key] !== undefined) {
                usedThickness = editableThickness[key];
              }
              area = vars.super_buildup_area * (usedPercentage || 0);
              logic = `Basement Slab: ${percentage}% × Built-up Area (${vars.super_buildup_area}) = ${area.toFixed(0)} sqft, Thickness: ${usedThickness}ft`;
              return { key, ...comp, area, percentage, thickness: usedThickness, logic, isEditable: comp.percentage !== undefined,
                isThicknessEditable: thickness !== undefined && thickness !== null && Number(thickness) !== 0,
                component: key,
                volume_cuft: (() => {
                  const numArea = Number(area);
                  const numThickness = Number(thickness);
                  if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
                    if (!isNaN(numThickness) && numThickness !== 0 && thickness !== '-') {
                      return numArea * numThickness;
                    } else {
                      return numArea;
                    }
                  }
                  return 0;
                })(),
                FloorName: floorType
              };
            }
            if (key === 'BasementWallVolume') {
              //const wallHeight = comp.wallHeight || 10;
              const wallHeight = (typeof vars.floorHeight !== 'undefined' ? vars.floorHeight : (comp.wallHeight || 10));
              const wallThickness = comp.thickness || 0.75;
              area = vars.constructionPerimeter * wallHeight;
              logic = `Basement Wall: Construction Perimeter ${vars.constructionPerimeter}×${wallHeight}×${wallThickness} = ${(area * wallThickness).toFixed(0)} cuft`;
              return {
                key,
                ...comp,
                area,
                percentage,
                thickness,
                logic,
                isEditable: comp.percentage !== undefined,
                isThicknessEditable: thickness !== undefined && thickness !== null && Number(thickness) !== 0,
                component: key,
                volume_cuft: (() => {
                  const numArea = Number(area);
                  const numThickness = Number(thickness);
                  if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
                    if (!isNaN(numThickness) && numThickness !== 0 && thickness !== '-') {
                      return numArea * numThickness;
                    } else {
                      return numArea;
                    }
                  }
                  return 0;
                })(),
          FloorName: floorType
              };
            }
            if (key === 'BasementBeam') {
              const L_sb = vars.width;
              const W_sb = vars.depth;
              const gridSpacing = vars.beamGridSpacing || 15;
            const columnWidth = vars.beamWidth || 1;
            const columnDepth = vars.beamDepth || 1.5;
              const columnsPerRow = Math.floor(L_sb / gridSpacing) + 1;
              const rowsOfColumns = Math.floor(W_sb / gridSpacing) + 1;
              const crossSection = columnWidth * columnDepth;
              const totalBeamsCount = rowsOfColumns * (columnsPerRow - 1) + columnsPerRow * (rowsOfColumns - 1);
              area = totalBeamsCount * crossSection * gridSpacing;
              logic = `Basement Beams: ${totalBeamsCount} beams, ${gridSpacing}ft spacing, cross-section ${crossSection} sqft`;
              return {
                key,
                ...comp,
                area,
                percentage,
                thickness,
                logic,
                isEditable: comp.percentage !== undefined,
                isThicknessEditable: thickness !== undefined && thickness !== null && Number(thickness) !== 0,
                component: key,
                volume_cuft: (() => {
                  const numArea = Number(area);
                  const numThickness = Number(thickness);
                  if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
                    if (!isNaN(numThickness) && numThickness !== 0 && thickness !== '-') {
                      return numArea * numThickness;
                    } else {
                      return numArea;
                    }
                  }
                  return 0;
                })(),
          FloorName: floorType
              };
            }
            if (key === 'Basementcolumns') {
              const L_sb = vars.width;
              const W_sb = vars.depth;
             const gridSpacing = vars.beamGridSpacing || 15;
            const columnWidth = vars.beamWidth || 1;
            const columnDepth = vars.beamDepth || 1.5;
              const columnsPerRow = Math.floor(L_sb / gridSpacing) + 1;
              const rowsOfColumns = Math.floor(W_sb / gridSpacing) + 1;
              const columnsCount = columnsPerRow * rowsOfColumns;
              const crossSection = columnWidth * columnDepth;
              area = columnsCount * crossSection;
              logic = `Basement Columns: ${columnsCount} columns, ${columnsPerRow}x${rowsOfColumns} grid, cross-section ${crossSection} sqft`;
              return {
                key,
                ...comp,
                area,
                percentage,
                thickness,
                logic,
                isEditable: comp.percentage !== undefined,
                isThicknessEditable: thickness !== undefined && thickness !== null && Number(thickness) !== 0,
                component: key,
                volume_cuft: (() => {
                  const numArea = Number(area);
                  const numThickness = Number(thickness);
                  if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
                    if (!isNaN(numThickness) && numThickness !== 0 && thickness !== '-') {
                      return numArea * numThickness;
                    } else {
                      return numArea;
                    }
                  }
                  return 0;
                })(),
          FloorName: floorType
              };
            }

            // Dynamic formula evaluation for other components
            if (comp.formula) {
              try {
                let usedPercentage = comp.percentage;
                if (editablePercentages[key] !== undefined) {
                  usedPercentage = editablePercentages[key] / 100;
                }
                if (comp.formula === 'percentage_of_carpet_area') {
                  area = vars.carpetArea * (usedPercentage || 0);
                } else if (comp.formula === 'percentage_of_buildup') {
                  area = (Number(width) * Number(depth) * (Number(buildupPercent) / 100)) || 0 * (usedPercentage || 0);
                } else if (comp.formula === 'percentage_of_super_buildup') {
                  area = vars.super_buildup_area * (usedPercentage || 0);
                } else if (comp.formula === 'same_as_super_buildup') {
                  area = vars.super_buildup_area;
                } else if (comp.formula === 'same_as_Built-up Area') {
                  area = (Number(width) * Number(depth) * (Number(buildupPercent) / 100)) || 0;
                } else if (comp.formula === 'conditional_percentage_of_super_buildup') {
                  area = (vars.lift ? vars.super_buildup_area * (usedPercentage || 0) : 0);
                } else if (comp.formula === 'conditional_percentage_of_buildup') {
                  area = (vars.lift ? vars.buildup_area * (usedPercentage || 0) : 0);
                } else if (comp.formula === 'percentage_of_ground_floor_sba') {
                  area = vars.ground_floor_sba * (usedPercentage || 0);
                } else {
                  area = evaluate(comp.formula, vars);
                }
              } catch (e) {
                area = '-';
              }
            }
            return {
              key,
              ...comp,
              area,
              percentage,
              thickness,
              logic,
              isEditable: comp.percentage !== undefined,
              isThicknessEditable: thickness !== undefined && thickness !== null && Number(thickness) !== 0,
              component: key,
              volume_cuft: (() => {
                const numArea = Number(area);
                const numThickness = Number(thickness);
                if (!isNaN(numArea) && numArea !== 0 && area !== '-') {
                  if (!isNaN(numThickness) && numThickness !== 0 && thickness !== '-') {
                    return numArea * numThickness;
                  } else {
                    return numArea;
                  }
                }
                return 0;
              })(),
          FloorName: floorType
            };
          });
        return comps;
      });
      // allFloorsComponents[floorIdx] gives the components for that floor
  }, [areaCalculationLogic, width, depth, floors, carpetPercent, buildupPercent, carpetAreaSqFt, constructionPerimeter, lift, editablePercentages, editableThickness, bhkRoomDetails, getFloorRows, beamColumnConfig]);

  // Debug: Log allFloorsComponents after calculation
  //console.log('allFloorsComponents:', allFloorsComponents);

    // For the selected floor, just filter from allFloorsComponents
    const selectedFloorIdx = Number(selectedDebugFloor || 0);
    const Gridcomponents = allFloorsComponents[selectedFloorIdx] || [];
    if (allFloorsComponents && allFloorsComponents.length > 0) {
 if (selectedFloorIdx === 0) {
        // Find Backfilling Soil, Excavation, and RCC components for this floor
        const backfillIdx = Gridcomponents.findIndex(c => c.component === 'Backfilling');
        const excavation = Gridcomponents.find(c => c.component === 'ExcavationVolume');
        // RCC = sum of SlabVolume, WallVolume, BeamVolume, ColumnVolume
        const slab = Gridcomponents.find(c => c.component === 'BasementSlab');
        const wall = Gridcomponents.find(c => c.component === 'BasementWallVolume');
        const beam = Gridcomponents.find(c => c.component === 'BasementBeam');
        const column = Gridcomponents.find(c => c.component === 'Basementcolumns');
        // Only update if all required components exist and have valid numbers
        if (backfillIdx !== -1 && excavation && slab && wall && beam && column) {
          const excavationVol = isNaN(Number(excavation.volume_cuft)) ? 0 : Number(excavation.volume_cuft);
          const slabVol = isNaN(Number(slab.volume_cuft)) ? 0 : Number(slab.volume_cuft);
          const wallVol = isNaN(Number(wall.volume_cuft)) ? 0 : Number(wall.volume_cuft);
          const beamVol = isNaN(Number(beam.volume_cuft)) ? 0 : Number(beam.volume_cuft);
          const columnVol = isNaN(Number(column.volume_cuft)) ? 0 : Number(column.volume_cuft);
          const rccTotal = slabVol + wallVol + beamVol + columnVol;
          // Set Backfilling Soil volume as Excavation - RCC, display 0 if negative or invalid
          let backfillVol = excavationVol - rccTotal;
          if (!isFinite(backfillVol) || isNaN(backfillVol) || backfillVol < 0) backfillVol = 0;
          Gridcomponents[backfillIdx].volume_cuft = backfillVol;
        }
      }
    }
//Step 5 code

// Load MaterialCalculation.json at runtime
useEffect(() => {
  fetch(process.env.PUBLIC_URL + '/MaterialCalculation.json')
    .then(res => res.json())
    .then(data => setMaterialConfig(data))
    .catch(err => {
      console.error('Failed to load MaterialCalculation.json:', err);
      setMaterialConfig(null);
    });
}, []);

// 1. Load MaterialRate.json at runtime
const [materialRateConfig, setMaterialRateConfig] = useState(null);


// Helper: Plural to singular (basic, extend as needed)
// Build a map: { 'cement__bag': [ { brand_name, rate_per_unit }, ... ], ... }
useEffect(() => {
  fetch(process.env.PUBLIC_URL + '/MaterialRate.json')
    .then(res => res.json())
    .then(data => setMaterialRateConfig(data))
    .catch(err => {
      console.error('Failed to load MaterialRate.json:', err);
      setMaterialRateConfig(null);
    });
}, []);

// 2. Build a material rate map (case-insensitive)
const getMaterialRate = useCallback((materialName) => {
  if (!materialRateConfig || !materialRateConfig.rate_structure) return '';
  if (materialRateConfig.rate_structure[materialName]) {
    return materialRateConfig.rate_structure[materialName].rate;
  }
  const foundKey = Object.keys(materialRateConfig.rate_structure).find(
    k => k.toLowerCase() === materialName.toLowerCase()
  );
  return foundKey ? materialRateConfig.rate_structure[foundKey].rate : '';
}, [materialRateConfig]);

// Helper to map floor label to MaterialCalculation.json floor name
const getMaterialFloorName = (floorLabel) => {
  if (floorLabel === 'Foundation') return 'Foundation';
  if (floorLabel === 'Ground Floor') return 'GroundFloor';
  // For 1st Floor and above
  return 'Other Floor';
};

useEffect(() => {
  if (!materialConfig) return;
  const allRows = allFloorsComponents.flat();

  // 1. Aggregate total volume by floor and category
  const volumeMap = {};
  allRows.forEach(row => {
    const floorLabel = row.FloorName || row.floor || '';
    const cat = row.Category || row.category || '';
    const key = `${floorLabel}||${cat}`;
    if (!volumeMap[key]) {
      volumeMap[key] = { floor: floorLabel, category: cat, volume: 0 };
    }
    volumeMap[key].volume += Number(row.volume_cuft) || 0;
  });

  // 2. For each unique floor/category, generate material rows
  const rows = [];
  Object.values(volumeMap).forEach(({ floor, category, volume }) => {
    const floorName = getMaterialFloorName(floor);
    const floorConfig = materialConfig.floors.find(f => f.name === floorName);
    if (!floorConfig || !floorConfig.components) return;
    // Robust case-insensitive lookup for categoryConfig
    let categoryConfig = null;
    // Try exact match first
    if (Object.prototype.hasOwnProperty.call(floorConfig.components, category)) {
      categoryConfig = floorConfig.components[category];
    } else {
      // Try case-insensitive match (any case)
      const foundKey = Object.keys(floorConfig.components).find(
        k => k.localeCompare(category, undefined, { sensitivity: 'accent' }) === 0
      );
      if (foundKey) {
        categoryConfig = floorConfig.components[foundKey];
      }
    }
    if (!categoryConfig || !categoryConfig.materials) return;
    
    Object.entries(categoryConfig.materials).forEach(([mat, info]) => {
      let qty = 0;
      const key = `${category}_${mat}_${floor || ''}`;
      
      // Check if user has overridden the qty for this item
      if (qtyMap[key] !== undefined) {
        qty = qtyMap[key] * volume;
      } else {
        // Use original calculation
        if (typeof info.qty === 'string') {
          const expr = info.qty.replace(/^{+|}+$/g, '');
          qty = typeof evaluate === 'function'
            ? evaluate(expr.replace(/volume_cuft/g, volume), { volume_cuft: volume })
            : 0;
        } else {
          qty = info.qty * volume;
        }
      }
      
      const wastage = wastageMap[key] !== undefined ? wastageMap[key] : 5;
      //const rate = rateMap[`${category}_${mat}`] ?? '';
      const rateNum = Number(getMaterialRate(mat));
      const totalQty = qty * (1 + wastage / 100);
      const totalValue = rateNum ? totalQty * rateNum : '';
      // Debug log for each material row
      
      rows.push({
        floor,
        category,
        material: mat,
        volume,
        unit: info.unit,
        qty: info.qty,
        wastage,
        totalQty,
        rate: rateNum,
        totalValue
      });
    });
  });
}, [materialConfig, allFloorsComponents, wastageMap, qtyMap, rateMap, getMaterialRate]);

  // Move all rendering code inside the PricingCalculator function
  return (
    <div className="wizard-container calculator-container" style={{ width: '100%', maxWidth: '100%', padding: '0' }}>
      {/* Alert Message Display */}
      {alertMessage.show && (
        <div 
          className={`alert alert-${alertMessage.type} alert-dismissible fade show`}
          role="alert"
          style={{
            position: 'sticky',
            top: '10px',
            zIndex: 1050,
            marginBottom: '1rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <strong>{alertMessage.type === 'success' ? '✓ Success!' : '✗ Error!'}</strong> {alertMessage.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setAlertMessage({ show: false, type: '', message: '' })}
            aria-label="Close"
          ></button>
        </div>
      )}
      
      {/* Configuration Loading Check */}
      {!isConfigLoaded && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          background: configError ? '#fff5f5' : '#f8f9fa',
          borderRadius: '8px',
          margin: '1rem 0',
          border: `1px solid ${configError ? '#fed7d7' : '#dee2e6'}`
        }}>
          {configError ? (
            <>
              <div style={{ fontSize: '1.2rem', color: '#e53e3e', marginBottom: '0.5rem' }}>
                ❌ Configuration Load Failed
              </div>
              <div style={{ fontSize: '0.9rem', color: '#c53030', marginBottom: '1rem' }}>
                Error: {configError}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '1rem' }}>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '1.2rem', color: '#666', marginBottom: '0.5rem' }}>
                ⚙️ Loading Configuration...
              </div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>
                Please wait while we load the calculation parameters from AreaCalculationLogic.json
              </div>
            </>
          )}
        </div>
      )}
      <div style={{ 
        display: step === 3 && isExpandedView ? 'none' : 'flex',
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '1.5rem'
      }}>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={() => navigate('/project-estimation')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.85rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '6px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Back
        </Button>
        <h2 className="text-center text-primary mb-0" style={{ fontWeight: 500, letterSpacing: '1px', flex: 1, textAlign: 'center', fontSize: '1.25rem' }}>
          Project Estimation Calculator
        </h2>
        <div style={{ width: '120px' }}></div> {/* Spacer for balanced layout */}
      </div>
      {/* OCR and BHK Extraction Results - always visible */}
      {/* Removed bhkLoading, bhkError, bhkTokens references */}
      {pollinationText && (
        <div style={{ margin: '2rem auto', maxWidth: 600 }}>
          <h5>OCR Raw Text</h5>
          <textarea
            value={pollinationText || ocrText || ''}
            readOnly
            rows={10}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '1rem', background: '#f4f4f4', borderRadius: 8, border: '1px solid #ccc', padding: 8 }}
          />
        </div>
      )}
      {/* Removed bhkExtracted, bhkLoading, bhkError references */}
      {/* Step Indicator */}
      <div className="wizard-indicator" style={{ display: step === 3 && isExpandedView ? 'none' : 'flex' }}>
        {[1,2,3].map(s => (
          <span key={s} style={{ position: 'relative', display: 'inline-block' }}>
            <span
              className={`wizard-circle${step === s ? ' active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleCircleClick(s); }}
            >{s}</span>
            <span
              className="wizard-step-label"
              style={{
                position: 'absolute',
                left: '50%',
                top: '120%',
                transform: 'translateX(-50%)',
                fontSize: '0.68em',
                color: '#b0b0b0',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                minWidth: 0,
                textAlign: 'center',
                lineHeight: 1.1,
                zIndex: 2
              }}
            >
              {
                s === 1 ? 'Project Details' :
                s === 2 ? 'Floor Layout' :
                s === 3 ? 'Pricing' : ''
              }
            </span>
          </span>
        ))}
      </div>
      {/* Step Content */}
      <div className="wizard-step-content" style={{ 
        padding: step === 3 ? '0' : '0 1rem',
        transition: 'none',
        willChange: 'auto'
      }}>
        {step === 1 && (
          <>
            {/* Mode indicator and styled heading for Area Details */}
            <div style={{ width: '100%', margin: '0 auto 1rem auto', padding: '0.5rem 0 0.2rem 0', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
              {mode && (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: mode === 'view' ? '#6c757d' : mode === 'edit' ? '#28a745' : '#007bff',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {mode === 'view' ? '👁️ VIEW MODE' : mode === 'edit' ? '✏️ EDIT MODE' : '➕ NEW ENTRY'}
                  {estimationRef && ` - ${estimationRef}`}
                </div>
              )}
              <h5 style={{ fontWeight: 600, color: '#1976d2', margin: 0, fontSize: '1.18rem', letterSpacing: '0.5px' }}>Area Details</h5>
            </div>
            
            {/* Additional Details Row */}
            <Row className="mb-4">
              <Col md={3} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '500', 
                    color: '#495057', 
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Estimation Ref#
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    value={estimationRef} 
                    onChange={e => setEstimationRef(e.target.value)} 
                    placeholder="Enter reference number"
                    readOnly
                    style={{
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      height: '42px',
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d'
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={4} sm={12} className="mb-3">
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '500', 
                    color: '#495057', 
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Description
                  </Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Enter project description"
                    readOnly={isViewMode}
                    style={{ 
                      resize: 'vertical',
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      minHeight: '42px',
                      backgroundColor: isViewMode ? '#f8f9fa' : '#fff',
                      color: isViewMode ? '#6c757d' : '#495057'
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={2} sm={6} className="mb-3">
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '500', 
                    color: '#495057', 
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Create Date
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    value={createDate} 
                    readOnly
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      color: '#6c757d',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      height: '42px'
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={3} sm={6} className="mb-3">
                <Form.Group>
                  <Form.Label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '500', 
                    color: '#495057', 
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    User Name
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    value={userName} 
                    readOnly
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      color: '#6c757d',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      height: '42px'
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form>
              <Row className="mb-4">
                <Col md={3} sm={12} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: '500', 
                      color: '#495057', 
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      Select Project
                    </Form.Label>
                    <Form.Select 
                      value={selectedProject} 
                      onChange={handleProjectSelect}
                      disabled={isViewMode || hasMaterialData}
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        height: '42px',
                        backgroundColor: (isViewMode || hasMaterialData) ? '#f8f9fa' : '#fff',
                        color: (isViewMode || hasMaterialData) ? '#6c757d' : '#495057'
                      }}
                    >
                      <option value="">Select Project</option>
                      {projects.map(project => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#495057',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      Land Area
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={projects.find(p => p._id === selectedProject)?.landArea || ''}
                      readOnly
                      disabled
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        width: '100%',
                        height: '42px',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#495057',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      Construction Area (Sq Ft)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={width}
                      onChange={e => setWidth(e.target.value)}
                      disabled={isViewMode || !!selectedProject}
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        width: '100%',
                        height: '42px',
                        backgroundColor: (isViewMode || selectedProject) ? '#f8f9fa' : '#fff',
                        color: (isViewMode || selectedProject) ? '#6c757d' : '#495057'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#495057',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      Number of Floors
                    </Form.Label>
                    <Form.Control 
                      type="number" 
                      value={floors} 
                      onChange={e => setFloors(e.target.value)} 
                      min={1}
                      disabled={isViewMode || !!selectedProject}
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        width: '100%',
                        height: '42px',
                        backgroundColor: (isViewMode || selectedProject) ? '#f8f9fa' : '#fff',
                        color: (isViewMode || selectedProject) ? '#6c757d' : '#495057'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={3} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#495057',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      Flats Per Floor
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={flatsPerFloor}
                      readOnly
                      disabled
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        width: '100%',
                        height: '42px',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#495057',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      Basement Count
                    </Form.Label>
                    <Form.Control 
                      type="number" 
                      value={basementCount} 
                      onChange={e => setBasementCount(Math.max(0, Number(e.target.value)))} 
                      min={0}
                      disabled={isViewMode}
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        width: '100%',
                        height: '42px',
                        backgroundColor: isViewMode ? '#f8f9fa' : '#fff',
                        color: isViewMode ? '#6c757d' : '#495057'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#495057',
                      marginBottom: '0.5rem',
                      display: 'block'
                    }}>
                      Ground Floor
                    </Form.Label>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '20px',
                      height: '42px',
                      paddingLeft: '0.75rem',
                      flexWrap: 'nowrap'
                    }}>
                      <Form.Check 
                        type="checkbox" 
                        label="Has Rooms" 
                        checked={groundFloorHasRooms} 
                        onChange={e => setGroundFloorHasRooms(e.target.checked)}
                        disabled={isViewMode}
                      />
                      <Form.Check 
                        type="switch" 
                        label="Lock Edit" 
                        checked={lockEdit} 
                        onChange={e => setLockEdit(e.target.checked)}
                        disabled={isViewMode}
                      />
                      <Form.Check 
                        type="switch" 
                        label="Lock Delete" 
                        checked={lockDelete} 
                        onChange={e => setLockDelete(e.target.checked)}
                        disabled={isViewMode}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

{/* --- Beam & Column Section UI (Step 1) --- */}
<div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, marginBottom: 32 }}>
  <div style={{ width: 600, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001', padding: 24 }}>
    <h4 style={{ textAlign: 'center',color: '#1976d2', fontWeight: 600, marginBottom: 24 }}>
      Beam &amp; Column Definition
    </h4>
   
      <Row className="align-items-center mb-3">
        <Col xs={6}>
          <Form.Label>Floor</Form.Label>
          <Form.Select value={bcFloor} onChange={e => setBCFloor(e.target.value)}>
            <option value="Foundation">Foundation</option>
            {basementCount > 0 && [...Array(Number(basementCount))].map((_, idx) => (
              <option key={`basement-${idx}`} value={`Basement ${idx + 1}`}>Basement {idx + 1}</option>
            ))}
            <option value="Ground Floor">Ground Floor</option>
            <option value="Other Floors">Other Floors</option>
          </Form.Select>
        </Col>
        <Col xs={6}>
          <Form.Label>Floor Height (ft)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={bcFloorHeight}
                onChange={e => {
                  const val = Number(e.target.value);
                  setBCFloorHeight(val);
                  handleBeamColumnConfigChange(bcFloor, 'floor', 'floorHeight', val);
                }}
              />
        </Col>
      </Row>
      <table className="table table-bordered" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Beam</th>
            <th>Column</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Grid Spacing (ft)</td>
            <td>
              <Form.Control
                type="number"
                min={1}
                value={bcBeamGridSpacing}
                onChange={e => {
                  const val = Number(e.target.value);
                  setBCBeamGridSpacing(val);
                  handleBeamColumnConfigChange(bcFloor, 'beam', 'gridSpacing', val);
                }}
              />
            </td>
            <td>
              <Form.Control
                type="number"
                min={1}
                value={bcColumnGridSpacing}
                onChange={e => {
                  const val = Number(e.target.value);
                  setBCColumnGridSpacing(val);
                  handleBeamColumnConfigChange(bcFloor, 'column', 'gridSpacing', val);
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Width (ft)</td>
            <td>
              <Form.Control
                type="number"
                min={0.1}
                value={bcBeamWidth}
                onChange={e => {
                  const val = Number(e.target.value);
                  setBCBeamWidth(val);
                  handleBeamColumnConfigChange(bcFloor, 'beam', 'width', val);
                }}
              />
            </td>
            <td>
              <Form.Control
                type="number"
                min={0.1}
                value={bcColumnWidth}
                onChange={e => {
                  const val = Number(e.target.value);
                  setBCColumnWidth(val);
                  handleBeamColumnConfigChange(bcFloor, 'column', 'width', val);
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Depth (ft)</td>
            <td>
              <Form.Control
                type="number"
                min={0.1}
                value={bcBeamDepth}
                onChange={e => {
                  const val = Number(e.target.value);
                  setBCBeamDepth(val);
                  handleBeamColumnConfigChange(bcFloor, 'beam', 'depth', val);
                }}
              />
            </td>
            <td>
              <Form.Control
                type="number"
                min={0.1}
                value={bcColumnDepth}
                onChange={e => {
                  const val = Number(e.target.value);
                  setBCColumnDepth(val);
                  handleBeamColumnConfigChange(bcFloor, 'column', 'depth', val);
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Height (ft)</td>
            <td>—</td>
            <td>
              <Form.Control
                type="number"
                min={1}
                value={bcColumnHeight}
                onChange={e => {
                  const val = Number(e.target.value);
                  setBCColumnHeight(val);
                  handleBeamColumnConfigChange(bcFloor, 'column', 'height', val);
                }}
              />
            </td>
          </tr>
          <tr>
            <td>Cross-section (sq ft)</td>
            <td>
              {bcBeamWidth * bcBeamDepth}
            </td>
            <td>
              {bcColumnWidth * bcColumnDepth}
            </td>
          </tr>
        </tbody>
      </table>
    
  </div>
</div>
              
              {/* ...existing code for Step 1 form controls, including Select City ... */}
              {/* Rectangle Visualization 
              {rectangleVisualization}
              */}

              



            </Form>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ width: '100%', margin: '0 auto 1rem auto', padding: '0.5rem 0 0.2rem 0', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
              <h5 style={{ fontWeight: 600, color: '#1976d2', margin: 0, fontSize: '1.18rem', letterSpacing: '0.5px' }}>Floor Layout</h5>
            </div>
            {/* Top summary section for area values */}
            <div className="d-flex justify-content-center" style={{ marginBottom: '2rem' }}>
              <div className="row w-100" style={{ maxWidth: 900 }}>
                <div className="col-12 col-md-6 mb-3 mb-md-0">
                  <div style={{ background: '#e8f5e9', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(76,175,80,0.07)', minWidth: 0, fontWeight: 400 }}>
                    <div style={{ fontWeight: 400, color: '#388e3c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25em', fontFamily: 'inherit' }}>
                      Construction Area (Sq Ft)
                      <span title="Construction area in square feet" style={{ cursor: 'pointer', fontSize: '1em', marginLeft: '2px', color: '#388e3c', verticalAlign: 'middle' }}>ℹ️</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 400, marginTop: 2, fontFamily: 'inherit' }}>
                      {Number(width) ? Number(width).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div style={{ background: '#fce4ec', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(233,30,99,0.07)', minWidth: 0, fontWeight: 400 }}>
                    <div style={{ fontWeight: 400, color: '#d81b60', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25em', fontFamily: 'inherit' }}>
                      Land Area
                      <span title="Total land area from selected project" style={{ cursor: 'pointer', fontSize: '1em', marginLeft: '2px', color: '#d81b60', verticalAlign: 'middle' }}>ℹ️</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 400, marginTop: 2, fontFamily: 'inherit' }}>
                      {selectedProject ? (projects.find(p => p._id === selectedProject)?.landArea || '-') : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

{/* File upload section */}
            {/* Site Plan Upload Section */}
{/* Site plan image and process button hidden as requested */}

{/* Large Site Plan Modal */}

            {/* Controls section */}
            <div className="d-flex justify-content-center">
              <div style={{ width: '100%', maxWidth: 900, padding: '0 16px' }}>
                <Form>
                  {/* Dynamic Section Rendering for Floors */}
                  <div style={{ marginBottom: '2rem' }}>
                    {[...Array(Number(floors) + 1).keys()].map(floorIdx => (
                      <div key={floorIdx} className="section-responsive" style={{
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: '1px solid #e0e0e0',
                        padding: '18px 8px',
                        marginBottom: '1.5rem',
                        maxWidth: '100%'
                      }}>
                        {(floorIdx === 0 && !groundFloorHasRooms) ? (
                          <>
                            <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 12, color: '#388e3c' }}>
                              Ground Floor
                            </div>
                            <div style={{ width: '100%' }}>
                              <table style={{ minWidth: 320, width: '100%', borderCollapse: 'collapse', fontSize: '0.97rem' }}>
                                <thead>
                                  <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Type</th>
                                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Area (sq ft)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Built-up</td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      {Number(buildupPercent) ? Number(buildupPercent).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <div style={{ marginTop: 0, width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#388e3c' }}>
                                {floorIdx === 0 ? 'Ground Floor' : `${floorIdx === 1 ? '1st' : floorIdx === 2 ? '2nd' : floorIdx === 3 ? '3rd' : floorIdx + 'th'} Floor`}
                                <span style={{ fontWeight: 500, fontSize: '0.98rem', margin: '0 8px' }}>-</span>
                                 Configuration
                              </div>
                             
                            </div>
                            {(floorIdx > 1 || (floorIdx === 0 && groundFloorHasRooms && false)) && (
                              <Form.Select size="sm" style={{ maxWidth: 140, marginBottom: 8 }} onChange={e => copyFloorConfig(Number(e.target.value), floorIdx)} defaultValue="">
                                <option value="">Copy from...</option>
                                {[...Array(Number(floors) + 1).keys()].filter(i => (groundFloorHasRooms || i !== 0) && i !== floorIdx).map(i => (
                                  <option key={i} value={i}>{i === 0 ? 'Ground Floor' : i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`}</option>
                                ))}
                              </Form.Select>
                            )}
                            <table style={{ minWidth: 480, width: '100%', borderCollapse: 'collapse', fontSize: '0.97rem' }}>
                              <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0', width: '15%' }}>Flat Type</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0', width: '8%' }}># of Units</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0', width: '15%' }}>Carpet Area (Sq ft)</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0', width: '12%' }}>Actual Area (Sq ft)</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0', width: '35%' }}>Typical Rooms</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0', width: '15%' }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {(floorBHKConfigs[floorIdx] || bhkRows).map((row, idx) => (
                                  <tr key={idx}>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Form.Select value={row.type} onChange={e => handleBHKTypeChange(floorIdx, idx, e.target.value)} size="sm" style={{ minWidth: 90 }} disabled={bhkDataLoading}>
                                        <option value="">{bhkDataLoading ? 'Loading...' : 'Select'}</option>
                                        {bhkTypeOptions.map(type => (
                                          <option key={type} value={type}>{type}</option>
                                        ))}
                                      </Form.Select>
                                      <FaHome 
                                        style={{ 
                                          color: (bhkDataLoading || !row.type || !row.area) ? '#ccc' : '#1976d2', 
                                          marginLeft: '6px', 
                                          cursor: (bhkDataLoading || !row.type || !row.area) ? 'not-allowed' : 'pointer' 
                                        }} 
                                        title={
                                          bhkDataLoading ? 'Loading BHK data...' :
                                          !row.type ? 'Please select BHK Type first' :
                                          !row.area ? 'Please select Carpet Area first' :
                                          'BHK Details'
                                        } 
                                        onClick={() => {
                                          if (!bhkDataLoading && row.type && row.area) {
                                            handleOpenBHKModal(floorIdx, idx);
                                          }
                                        }} 
                                      />
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      <Form.Control type="number" value={row.units} min={1} size="sm" onChange={e => handleFloorCellChange(floorIdx, idx, 'units', e.target.value)} />
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      <Form.Select 
                                        value={row.area} 
                                        onChange={e => {
                                          const newArea = parseInt(e.target.value);
                                          handleFloorCellChange(floorIdx, idx, 'area', newArea);
                                          // Update rooms description based on new area
                                          const config = allBhkConfigs.find(c => c.type === row.type && String(c.total_carpet_area_sqft) === String(newArea));
                                          if (config) {
                                            const roomList = config.rooms.map(room => room.name).join(', ');
                                            handleFloorCellChange(floorIdx, idx, 'rooms', roomList);
                                            // Also update bhkRoomDetails for this row, including Door/Window fields
                                            setBhkRoomDetails(prevDetails => {
                                              const newDetails = { ...prevDetails };
                                              const key = `${floorIdx}-${idx}`;
                                              let modalDetails = {
                                                'Count': {},
                                                'Length (ft)': {},
                                                'Width (ft)': {},
                                                'Door': {},
                                                'Window': {}
                                              };
                                              if (Array.isArray(config.rooms)) {
                                                config.rooms.forEach(room => {
                                                  modalDetails['Count'][room.name] = 1;
                                                  modalDetails['Length (ft)'][room.name] = room.dimensions_ft?.length || '';
                                                  modalDetails['Width (ft)'][room.name] = room.dimensions_ft?.width || '';
                                                  modalDetails['Door'][room.name] = room.Door ? {
                                                    count: room.Door.count || 0,
                                                    width: room.Door.width || 0,
                                                    height: room.Door.height || 0
                                                  } : { count: 0, width: 0, height: 0 };
                                                  modalDetails['Window'][room.name] = room.Window ? {
                                                    count: room.Window.count || 0,
                                                    width: room.Window.width || 0,
                                                    height: room.Window.height || 0
                                                  } : { count: 0, width: 0, height: 0 };
                                                });
                                              }
                                              newDetails[key] = modalDetails;
                                              return newDetails;
                                            });
                                          }
                                        }} 
                                        size="sm" 
                                        style={{ minWidth: 100 }}
                                        disabled={!row.type || getCarpetAreaOptions(row.type).length === 0 || bhkDataLoading}
                                      >
                                        <option value="">{bhkDataLoading ? 'Loading...' : 'Select'}</option>
                                        {getCarpetAreaOptions(row.type).map(area => (
                                          <option key={area} value={area}>{area}</option>
                                        ))}
                                      </Form.Select>
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'right' }}>
                                      {(() => {
                                        const key = `${floorIdx}-${idx}`;
                                        const details = bhkRoomDetails[key];
                                        if (!details || !details['Count'] || !details['Length (ft)'] || !details['Width (ft)']) {
                                          return '-';
                                        }
                                        // Calculate grand total from all rooms
                                        let grandTotal = 0;
                                        Object.keys(details['Count']).forEach(roomName => {
                                          const count = Number(details['Count'][roomName]) || 0;
                                          const length = Number(details['Length (ft)'][roomName]) || 0;
                                          const width = Number(details['Width (ft)'][roomName]) || 0;
                                          const roomArea = length * width;
                                          grandTotal += count * roomArea;
                                        });
                                        return grandTotal > 0 ? (grandTotal * row.units).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-';
                                      })()}
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      <Form.Control type="text" value={row.rooms} size="sm" onChange={e => handleFloorCellChange(floorIdx, idx, 'rooms', e.target.value)} />
                                    </td>
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                                      <Button variant="outline-danger" size="sm" onClick={() => handleFloorRemoveRow(floorIdx, idx)} disabled={getFloorRows(floorIdx).length === 1}>Remove</Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="d-flex align-items-center mt-3" style={{ position: 'relative' }}>
                              <Button variant="outline-primary" size="sm" onClick={() => handleFloorAddRow(floorIdx)}>Add Row</Button>
                              <div style={{ 
                                position: 'absolute',
                                left: 'calc(15% + 8% + 15%)',
                                width: '12%',
                                textAlign: 'right',
                                fontWeight: 600, 
                                color: (() => {
                                  const rows = getFloorRows(floorIdx);
                                  const gridTotalArea = rows.reduce((sum, row) => {
                                    const key = `${floorIdx}-${(() => rows.indexOf(row))()}`;
                                    const details = bhkRoomDetails[key];
                                    if (!details || !details['Count'] || !details['Length (ft)'] || !details['Width (ft)']) {
                                      return sum;
                                    }
                                    let grandTotal = 0;
                                    Object.keys(details['Count']).forEach(roomName => {
                                      const count = Number(details['Count'][roomName]) || 0;
                                      const length = Number(details['Length (ft)'][roomName]) || 0;
                                      const width = Number(details['Width (ft)'][roomName]) || 0;
                                      grandTotal += count * length * width;
                                    });
                                    return sum + (grandTotal * row.units);
                                  }, 0);
                                  const actualCarpetArea = Number(carpetAreaSqFt) || 0;
                                  return gridTotalArea === actualCarpetArea ? '#388e3c' : '#d81b60';
                                })() 
                              }}>
                                Total: {(() => {
                                  const rows = getFloorRows(floorIdx);
                                  const totalArea = rows.reduce((sum, row) => {
                                    const key = `${floorIdx}-${(() => rows.indexOf(row))()}`;
                                    const details = bhkRoomDetails[key];
                                    if (!details || !details['Count'] || !details['Length (ft)'] || !details['Width (ft)']) {
                                      return sum;
                                    }
                                    let grandTotal = 0;
                                    Object.keys(details['Count']).forEach(roomName => {
                                      const count = Number(details['Count'][roomName]) || 0;
                                      const length = Number(details['Length (ft)'][roomName]) || 0;
                                      const width = Number(details['Width (ft)'][roomName]) || 0;
                                      grandTotal += count * length * width;
                                    });
                                    return sum + (grandTotal * row.units);
                                  }, 0);
                                  return totalArea > 0 ? totalArea.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0';
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* BHK Grid Section (unchanged) */}
                  
                </Form>
              </div>
            </div>
          </>
        )}

        {/* BOQ Estimation Component - Render once and keep mounted */}
        {id && selectedProjectId && Number(floors) > 0 && (
          <div style={{ display: step === 3 ? 'block' : 'none' }}>
            {/* BOQ Estimation Component */}
            <BOQEstimation 
              estimationMasterId={id} 
              floorsList={boqFloorsList}
              isExpandedView={isExpandedView}
              onToggleExpandedView={setIsExpandedView}
            />
            
          </div>
        )}
        
        {/* Show message when no project is selected or invalid floors */}
        {id && step === 3 && (!selectedProjectId || Number(floors) <= 0) && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#d32f2f', fontSize: '1.1rem', background: '#fff3e0', borderRadius: '8px', margin: '2rem 0', border: '1px solid #ff9800' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              {!selectedProjectId ? 'No Project Selected' : 'Invalid Number of Floors'}
            </div>
            <div style={{ fontSize: '0.95rem', color: '#666' }}>
              {!selectedProjectId 
                ? 'Please go back to Step 1 and select a project before viewing the BOQ Estimation.'
                : 'Please go back to Step 1 and enter a valid number of floors (greater than 0).'}
            </div>
          </div>
        )}

      {/* Navigation Buttons */}
      <div className="wizard-nav-btns mt-4">
        <Button disabled={step === 1} onClick={() => setStep(step-1)} className="me-2">Back</Button>
        <Button disabled={step === 3} onClick={() => setStep(step+1)} className="me-2">Next</Button>
        
        {/* Individual Save and Load Buttons for Each Step */}
        {!isViewMode && (
          <>
            {step === 1 && (
              <>
                <Button variant="primary" onClick={handleSaveStep1} className="me-2" style={{ fontWeight: 600 }}>
                  Save Step 1
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <Button variant="primary" onClick={handleSaveStep1} className="me-2" style={{ fontWeight: 600 }}>
                  Save Step 2
                </Button>
              </>
            )}
            {step === 3 && (
              <>
                <Button variant="primary" onClick={handleSaveStep3} className="me-2" style={{ fontWeight: 600 }}>
                  Save Step 3
                </Button>
              </>
            )}
          </>
        )}
      </div>
      </div>

      {/* BHK Details Modal */}
      <Modal show={showBHKModal} onHide={handleCloseBHKModal} centered size="xl">
        <Modal.Header closeButton style={{ background: '#e3f2fd', borderBottom: '1px solid #1976d2' }}>
          <Modal.Title style={{ fontWeight: 700, color: '#1976d2', fontSize: '1.18rem', letterSpacing: '0.5px' }}>
            {(() => {
              if (bhkModalFloorIdx == null || bhkModalIdx == null) return '';
              const rows = getFloorRows(bhkModalFloorIdx);
              const bhkType = rows[bhkModalIdx]?.type || '';
              const carpetArea = rows[bhkModalIdx]?.area || '';
              return bhkType && carpetArea ? `${bhkType} - Carpet Area (${carpetArea} sq ft)` : 'BHK Details';
            })()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#fafafa', padding: '1.5rem 2rem' }}>
          {/* Data Source Information */}
          {showBHKModal && roomDataSource && (
            <div style={{
              background: roomDataSource.includes('Saved') ? '#e8f5e9' : '#fff3e0',
              border: roomDataSource.includes('Saved') ? '1px solid #4caf50' : '1px solid #ff9800',
              borderRadius: '6px',
              padding: '10px 15px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>
                {roomDataSource.includes('Saved') ? 'ℹ️' : '📋'}
              </span>
              <span style={{
                color: roomDataSource.includes('Saved') ? '#2e7d32' : '#e65100',
                fontWeight: 500,
                fontSize: '0.9rem'
              }}>
                <strong>Data Source:</strong> {roomDataSource}
              </span>
            </div>
          )}
          
          {(() => {
            if (!showBHKModal) return null; // Don't render anything if modal is not shown
            
            if (bhkModalFloorIdx == null || bhkModalIdx == null) return null;
            
            // Early exit if table is not ready
            if (!isTableReady) {
              return <div style={{ padding: '40px', textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>Loading...</div>;
            }
            
            const rows = getFloorRows(bhkModalFloorIdx);
            const bhkType = rows[bhkModalIdx]?.type || '';
            const carpetArea = rows[bhkModalIdx]?.area || '';
            
            if (!bhkType || !carpetArea) {
              return (
                <div style={{ color: '#d32f2f', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', padding: '2rem 0' }}>
                  This row is empty. Please fill in BHK Type and Area in Step 1 for this floor.<br/>
                  No calculation can be performed for empty rows.
                </div>
              );
            }
            
            // Additional safety check for bhkRoomDetails before getting data
            const modalKey = `${bhkModalFloorIdx}-${bhkModalIdx}`;
            if (!bhkRoomDetails[modalKey]) {
              return <div style={{ padding: '40px', textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>Initializing room details...</div>;
            }
            
            // Validate that bhkRoomDetails has required structure
            const requiredKeys = ['Count', 'Length (ft)', 'Width (ft)', 'Door', 'Window'];
            const hasRequiredStructure = requiredKeys.every(key => bhkRoomDetails[modalKey][key] !== undefined);
            if (!hasRequiredStructure) {
              return <div style={{ padding: '40px', textAlign: 'center', fontSize: '1.1rem', color: '#666' }}>Room details not properly initialized...</div>;
            }
            
            // Only render the table/grid if the row is filled
            const tableData = getBHKHandsontableData();
            const tableColumns = getBHKHandsontableColumns();
            
            // Don't render if data is invalid
            if (!tableData || tableData.length === 0 || !tableColumns || tableColumns.length === 0) {
              return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No data available</div>;
            }
            
            // Wrap in try-catch to prevent rendering errors
            try {
              return (
                <div style={{ overflowX: 'auto' }} key={`bhk-table-${bhkModalFloorIdx}-${bhkModalIdx}`}>
                  <HotTable
                    ref={bhkHotTableRef}
                    data={tableData}
                    columns={tableColumns}
                  colHeaders={true}
                  rowHeaders={false}
                  height="auto"
                  width="100%"
                  licenseKey="non-commercial-and-evaluation"
                  stretchH="all"
                  className="htCenter htMiddle"
                  preventOverflow="horizontal"
                  autoRowSize={false}
                  autoColumnSize={false}
                  cells={(row, col) => {
                    const cellProperties = {};
                    if (tableData && tableData[row]) {
                      const rowLabel = tableData[row]['Row Label'];
                      
                      // Make calculated rows read-only
                      if (rowLabel === 'Total Carpet Area' || 
                          rowLabel === 'Door Area (sqft)' || 
                          rowLabel === 'Window Area (sqft)') {
                        cellProperties.readOnly = true;
                      }
                      
                      // Custom renderer for all cells
                      cellProperties.renderer = bhkCellRenderer;
                    }
                    return cellProperties;
                  }}
                  afterChange={handleBHKTableChange}
                  style={{ 
                    fontSize: '0.85rem', 
                    background: '#fff', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 8px rgba(33,150,243,0.07)', 
                    border: '1px solid #e0e0e0',
                    overflow: 'hidden'
                  }}
                />
                <div style={{ marginTop: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '6px', border: '1px solid #1976d2' }}>
                  <div style={{ fontWeight: 700, color: '#1976d2', fontSize: '0.9rem', marginBottom: '5px' }}>
                    Grand Total Carpet Area
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#388e3c' }}>
                    {(() => {
                      const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
                      const details = bhkRoomDetails[key] || {};
                      let totalSum = 0;
                      dynamicRoomColumns.forEach(col => {
                        const count = Number((details['Count'] && details['Count'][col]) || 0);
                        const length = Number((details['Length (ft)'] && details['Length (ft)'][col]) || 0);
                        const width = Number((details['Width (ft)'] && details['Width (ft)'][col]) || 0);
                        totalSum += count * length * width;
                      });
                      return totalSum.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                    })()} sq ft
                  </div>
                </div>
              </div>
            );
            } catch (error) {
              console.error('Error rendering BHK table:', error);
              return (
                <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
                  Error loading table. Please close and reopen the modal.
                </div>
              );
            }
          })()}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Button variant="primary" size="lg" style={{ minWidth: 120, fontWeight: 600, letterSpacing: '0.5px' }} onClick={handleOkBHKModal}>OK</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Large Site Plan Modal */}


    </div>
  );
}

export default PricingCalculator;
