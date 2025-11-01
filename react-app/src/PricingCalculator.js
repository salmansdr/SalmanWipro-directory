import React, { useState, useEffect,useCallback } from 'react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaFilter, FaTimesCircle } from 'react-icons/fa';

import { evaluate } from 'mathjs';
import { Button, Form, Row, Col, Modal } from 'react-bootstrap';
import './Styles/WizardSteps.css';

// Room columns for grid (make available globally)
export const roomColumns = ["BedRoom", "Living Room", "Kitchen", "Bathroom", "Store"];
// Default grid rows (make available globally)
export const gridRows = ["Count", "Length (ft)", "Width (ft)"];

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara'
];





const PricingCalculator = () => {
  // ...existing hooks...
  // --- Beam & Column Section State (Step 1) ---
  const [beamColumnConfig, setBeamColumnConfig] = useState([]);
  // Material filter state for Step 5 grid
  const [materialFilter, setMaterialFilter] = useState('');
  // Show/hide material filter dropdown
  const [showMaterialFilter, setShowMaterialFilter] = useState(false);
  // Group by state for Step 5 grid
  const [groupBy, setGroupBy] = useState('Floor');

  // At the top of your component, add:
const [step5Tab, setStep5Tab] = useState('Material');

  // Handler for group by dropdown
  const handleGroupByChange = (e) => {
    setGroupBy(e.target.value);
  };

   // --- Utility Defaults ---
    // Default BHKs array for use in Step 2 and elsewhere
  
    // --- Step 1: Area Details State ---
    // Variables for Step 1 (Area, Project Info, User, etc.)
    const [estimationRef, setEstimationRef] = useState('');
    const [description, setDescription] = useState('');
    const [createDate] = useState(new Date().toLocaleDateString('en-IN'));
    const [userName] = useState('Admin User');
    const [width, setWidth] = useState('');
    const [depth, setDepth] = useState('');
    const [buildupPercent, setBuildupPercent] = useState(90);
    const [carpetPercent, setCarpetPercent] = useState(80);
    const [selectedCity, setSelectedCity] = useState('');
  
    // --- Step 2: Floor Layout State ---
    // Variables for Step 2 (Floors, BHK configs, Lift, etc.)
    const [floors, setFloors] = useState(1);
    const [lift, setLift] = useState(false);
    const [numLifts, setNumLifts] = useState(1);
    const [floorBHKConfigs, setFloorBHKConfigs] = useState({});
    const [bhkRows, setBhkRows] = useState([
      { type: '', units: 1, area: '', rooms: '' },
      { type: '', units: 1, area: '', rooms: '' },
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
  
  // --- Step 3: Component Calculation State ---
  // Holds all floor/component calculation results for use in Step 5 and elsewhere
  const [areaCalculationLogic, setAreaCalculationLogic] = useState(null);
  const [, setStep3GridData] = useState([]);

  const handleBeamColumnConfigChange = (floor, section, field, value) => {
    setBeamColumnConfig(prevConfig =>
      prevConfig.map(config => {
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
      })
    );
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
     

      
      let floorBeamColumnConfig = beamColumnConfig.find(item => item.floor === floorLabel);
      if (!floorBeamColumnConfig && floorIdx >= 2) {
        floorBeamColumnConfig = beamColumnConfig.find(item => item.floor === 'Other Floors');
      }
      console.log('Step 3: Floor', floorLabel, 'Beam/Column Config:', floorBeamColumnConfig);

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
                lift: lift ? 1 : 0,
                sba: (Number(width) * Number(depth)) || 0,
                carpetArea: (Number(width) * Number(depth) * (Number(carpetPercent)/100)) || 0,
                super_buildup_area: (Number(width) * Number(depth)) || 0,
                ground_floor_sba: (Number(width) * Number(depth)) || 0,
                buildup_area: (Number(width) * Number(depth) * (Number(buildupPercent) / 100)) || 0,
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
  }, [areaCalculationLogic, width, depth, floors, carpetPercent, buildupPercent, lift, beamColumnConfig]);
  // Variables for Step 3 (Calculation logic, debug, etc.)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [configError, setConfigError] = useState(null);
  const [editablePercentages, setEditablePercentages] = useState({});
  const [editableThickness, setEditableThickness] = useState({});
  // ...existing code...
  const [selectedDebugFloor, setSelectedDebugFloor] = useState(0);

  // --- Step 4: Cost Estimation State ---
  // Variables for Step 4 (Cost, summary, etc.)
  const [costLevel, setCostLevel] = useState('basic');

  // --- Shared/Other State ---
  // Variables used across steps or for modals, navigation, etc.
  const [step, setStep] = useState(1);
  const [showBHKConfigModal, setShowBHKConfigModal] = useState(false);
  const [showInternalWallsModal, setShowInternalWallsModal] = useState(false);
    const [internalWallsLogic, setInternalWallsLogic] = useState('');
    const [bhkConfigJson, setBhkConfigJson] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { mode, ref, projectData, autoGeneratedRef } = location.state || {};
    const isViewMode = mode === 'view';
    const isNewMode = mode === 'new';
  //Step 5 variable

    const [materialConfig, setMaterialConfig] = useState(null);
    const [materialRows, setMaterialRows] = useState([]);
    const [wastageMap, setWastageMap] = useState({});
    const [rateMap, ] = useState({});


  const [bcFloor, setBCFloor] = useState('Foundation'); // Dropdown: Foundation, Ground, Others
  const [bcFloorHeight, setBCFloorHeight] = useState(10); // Floor height input
  const [bcBeamGridSpacing, setBCBeamGridSpacing] = useState(12); // Beam grid spacing
  const [bcColumnGridSpacing, setBCColumnGridSpacing] = useState(12); // Column grid spacing
  const [bcBeamWidth, setBCBeamWidth] = useState(1);
  const [bcBeamDepth, setBCBeamDepth] = useState(1);
  const [bcColumnWidth, setBCColumnWidth] = useState(1);
  const [bcColumnDepth, setBCColumnDepth] = useState(1);
  const [bcColumnHeight, setBCColumnHeight] = useState(10);




  // Handler for percentage changes
  const handlePercentageChange = (component, value) => {
    const numValue = parseFloat(value) || 0;
    setEditablePercentages(prev => ({
      ...prev,
      [component]: numValue
    }));
    // Also update the calculation logic so grid reflects changes
    setAreaCalculationLogic(prev => {
      if (!prev || !prev.calculation_components) return prev;
      const updated = { ...prev };
      if (updated.calculation_components[component]) {
        updated.calculation_components[component].percentage = numValue / 100;
      }
      return updated;
    });
  };

  // Handler for thickness changes
  const handleThicknessChange = (component, value) => {
    const numValue = parseFloat(value) || 0;
    setEditableThickness(prev => ({
      ...prev,
      [component]: numValue
    }));
    // Also update the calculation logic so grid reflects changes
    setAreaCalculationLogic(prev => {
      if (!prev || !prev.calculation_components) return prev;
      const updated = { ...prev };
      if (updated.calculation_components[component]) {
        updated.calculation_components[component].thickness = numValue;
      }
      return updated;
    });
  };

  function handleSaveBHKConfig() {
    // Get current timestamp for modified date
    const currentDate = new Date().toLocaleDateString('en-IN');
    
    // Collect complete estimation data in MongoDB-ready format
    const estimationDocument = {
      // Header information
      estimationRef: estimationRef || `EST-${Date.now()}`, // Auto-generate if empty
      description: description || 'Construction Estimation',
      createdDate: createDate,
      modifiedDate: currentDate,
      createdBy: userName,
      modifiedBy: userName,
      
      // Project details
      projectDetails: {
        city: selectedCity,
        sbaWidth: Number(width) || 0,
        sbaLength: Number(depth) || 0,
        buildupArea: buildupPercent,
        carpetArea: carpetPercent,
        totalSuperBuiltupArea: Number(width) && Number(depth) ? Number(width) * Number(depth) : 0,
        totalBuildupArea: Number(width) && Number(depth) ? Math.round((Number(width) * Number(depth) * buildupPercent) / 100) : 0,
        totalCarpetArea: Number(width) && Number(depth) ? Math.round((Number(width) * Number(depth) * carpetPercent) / 100) : 0,
        floors: Number(floors),
        liftIncluded: lift
      },
      
      // Floor configuration with embedded room details
      floorConfiguration: Array.from({ length: Number(floors) + 1 }, (_, floorIdx) => {
        const rows = getFloorRows(floorIdx);
        // Floor label logic: 0 = Foundation, 1 = Ground, 2+ = nth
        let floorLabel = '';
        if (floorIdx === 0) floorLabel = 'Foundation';
        else if (floorIdx === 1) floorLabel = 'Ground Floor';
        else if (floorIdx === 2) floorLabel = '1st Floor';
        else if (floorIdx === 3) floorLabel = '2nd Floor';
        else if (floorIdx === 4) floorLabel = '3rd Floor';
        else floorLabel = `${floorIdx - 1}th Floor`;
        return {
          floor: floorLabel,
          bhkUnits: rows.map((row, idx) => {
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
                const doorObj = modalDetails['Door'] && modalDetails['Door'][roomName] ? modalDetails['Door'][roomName] : undefined;
                const windowObj = modalDetails['Window'] && modalDetails['Window'][roomName] ? modalDetails['Window'][roomName] : undefined;
                if (count > 0) {
                  rooms.push({
                    name: roomName,
                    count: count,
                    dimensions: { length, width, height },
                    areaSqft: area_sqft,
                    ...(doorObj && { Door: doorObj }),
                    ...(windowObj && { Window: windowObj })
                  });
                }
              });
            }
            
            return {
              unitId: `${floorIdx}-${idx}`,
              bhkType: row.type || '',
              unitCount: Number(row.units) || 0,
              carpetAreaSqft: Number(row.area) || 0,
              rooms: rooms,
              totalRoomsArea: rooms.reduce((sum, room) => sum + room.areaSqft, 0)
            };
          }).filter(unit => unit.unitCount > 0) // Only include units with count > 0
        };
      }).filter(floor => floor.bhkUnits.length > 0), // Only include floors with units
      
      // Cost estimation (if available)
      costEstimation: {
        costLevel: costLevel,
        // Add cost breakdown here if needed
      },
      
      // Metadata
      metadata: {
        version: "1.0",
        lastSavedStep: step,
        totalUnits: Object.values(floorBHKConfigs).flat().reduce((total, row) => total + (Number(row.units) || 0), 0)
      }
    };

    // Create the JSON string for display
    const estimationJson = JSON.stringify(estimationDocument, null, 2);
    setBhkConfigJson(estimationJson);
  setShowBHKConfigModal(true);
  }
  // Function to set default BHK configurations (first row of each type from JSON)
  async function setDefaultBHKConfiguration() {
    try {
      // Ensure data is loaded
      let configs = allBhkConfigs;
      if (!configs || configs.length === 0) {
        await loadBHKConfigurations();
        configs = allBhkConfigs;
      }
      // Get first configuration for each BHK type
      const defaultConfigs = [];
      const defaultModalDetails = {};
      const seenTypes = new Set();
      for (const config of configs) {
        if (!seenTypes.has(config.type)) {
          defaultConfigs.push({
            type: config.type,
            units: 1,
            area: config.total_carpet_area_sqft.toString(),
            rooms: config.rooms.map(r => r.name).join(', ')
          });
          // Build modal grid child data for this config
          const key = `default-${config.type}`;
          const roomDetails = {
            'Count': {},
            'Length (ft)': {},
            'Width (ft)': {}
          };
          // Group rooms by type and create numbered columns
          const roomTypeMap = new Map();
          config.rooms.forEach(room => {
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
          roomTypeMap.forEach((rooms, baseType) => {
            if (rooms.length === 1) {
              dynamicColumns.push(baseType);
            } else {
              rooms.forEach((room, index) => {
                dynamicColumns.push(`${baseType} ${index + 1}`);
              });
            }
          });
          // Add circulation space as the last column
          //const columnsWithCirculation = [...dynamicColumns, 'Circulation Space'];
          // Populate room data using the mapping
         // let colIdx = 0;
          roomTypeMap.forEach((rooms, baseType) => {
            if (rooms.length === 1) {
              const displayName = baseType;
              const roomData = rooms[0];
              roomDetails['Count'][displayName] = displayName.toLowerCase().includes('bathroom') ? config.bathroom_count || 1 : 1;
              roomDetails['Length (ft)'][displayName] = roomData.dimensions_ft.length;
              roomDetails['Width (ft)'][displayName] = roomData.dimensions_ft.width;
             // colIdx++;
            } else {
              rooms.forEach((roomData, index) => {
                const displayName = `${baseType} ${index + 1}`;
                roomDetails['Count'][displayName] = displayName.toLowerCase().includes('bathroom') ? config.bathroom_count || 1 : 1;
                roomDetails['Length (ft)'][displayName] = roomData.dimensions_ft.length;
                roomDetails['Width (ft)'][displayName] = roomData.dimensions_ft.width;
                //colIdx++;
              });
            }
          });
          // Add circulation space data
          
          defaultModalDetails[key] = roomDetails;
          seenTypes.add(config.type);
        }
      }
      // Update all floors with default configurations and modal grid child data
      const updatedConfigs = { ...floorBHKConfigs };
      const updatedModalDetails = { ...bhkRoomDetails };
      for (let floorIdx = 1; floorIdx <= Number(floors); floorIdx++) {
        updatedConfigs[floorIdx] = defaultConfigs.map(config => ({ ...config }));
        // For each BHK row, set modal grid child data
        defaultConfigs.forEach((config, idx) => {
          // Shift modal grid keys for new floor order
          const key = `${floorIdx}-${idx}`;
          const modalKey = `default-${config.type}`;
          updatedModalDetails[key] = defaultModalDetails[modalKey];
        });
      }
      setFloorBHKConfigs(updatedConfigs);
      setBhkRoomDetails(updatedModalDetails);
      alert(`Default BHK configurations set for all floors with modal grid child data.\n${defaultConfigs.map(c => `${c.type}: ${c.area} sq ft`).join('\n')}`);
    } catch (error) {
      console.error('Error setting default BHK configuration:', error);
      alert('Failed to set default configurations. Please try again.');
    }
  }
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
  
  

  // Debug: Log carpetAreaOptions whenever it changes
useEffect(() => {
  console.log('carpetAreaOptions:', carpetAreaOptions);
}, [carpetAreaOptions]);

  // Populate form data when in edit/view mode, or set auto-generated ref for new mode
  useEffect(() => {
    if (mode === 'new' && autoGeneratedRef) {
  // Set auto-generated reference for new entries
  setEstimationRef(autoGeneratedRef);
    } else if ((mode === 'edit' || mode === 'view') && projectData) {
      // Populate header fields
      setEstimationRef(projectData.estimationRef || '');
      setDescription(projectData.description || '');
      
      // Populate project details
      if (projectData.projectDetails) {
        setSelectedCity(projectData.projectDetails.city || '');
        setWidth(projectData.projectDetails.sbaWidth?.toString() || '');
        setDepth(projectData.projectDetails.sbaLength?.toString() || '');
        setBuildupPercent(projectData.projectDetails.buildupArea || 90);
        setCarpetPercent(projectData.projectDetails.carpetArea || 80);
        setFloors(projectData.projectDetails.floors || 1);
        setLift(projectData.projectDetails.liftIncluded || false);
      }
      
      // Populate floor configuration if available
      if (projectData.floorConfiguration && Array.isArray(projectData.floorConfiguration)) {
        const newFloorBHKConfigs = {};
        const newBhkRoomDetails = {};
        
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
              if (unit.rooms && Array.isArray(unit.rooms)) {
                const key = `${floorIdx}-${unitIdx}`;
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
                  // Always initialize Door object for each room
                  modalDetails['Door'][room.name] = {
                    count: room.Door?.count || 0,
                    width: room.Door?.width_ft !== undefined ? room.Door.width_ft : (room.Door?.width || 0),
                    height: room.Door?.height_ft !== undefined ? room.Door.height_ft : (room.Door?.height || 0)
                  };
                  // Always initialize Window object for each window
                  modalDetails['Window'][room.name] = {
                    count: room.Window?.count || 0,
                    width: room.Window?.width_ft !== undefined ? room.Window.width_ft : (room.Window?.width || 0),
                    height: room.Window?.height_ft !== undefined ? room.Window.height_ft : (room.Window?.height || 0)
                  };
                });

                newBhkRoomDetails[key] = modalDetails;
              }
            });
          }
        });
        
        setFloorBHKConfigs(newFloorBHKConfigs);
        setBhkRoomDetails(newBhkRoomDetails);
        
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
          return [...new Set(allTypes)]; // Remove duplicates
        });
      }
      
      // Set cost level if available
      if (projectData.costEstimation?.costLevel) {
        setCostLevel(projectData.costEstimation.costLevel);
      }
    }
  }, [mode, projectData, autoGeneratedRef]);

  // --- Load Beam & Column Config from JSON ---
useEffect(() => {
  fetch(process.env.PUBLIC_URL + '/BeamColumnConfig.json')
    .then(res => res.json())
    .then(data => setBeamColumnConfig(data));
}, [setBeamColumnConfig]);

// --- Update form fields when floor changes ---
useEffect(() => {
  const config = beamColumnConfig.find(item => item.floor === bcFloor);
  if (config) {
    setBCFloorHeight(config.floorHeight);
    setBCBeamGridSpacing(config.beam.gridSpacing);
    setBCColumnGridSpacing(config.column.gridSpacing);
    setBCBeamWidth(config.beam.width);
    setBCBeamDepth(config.beam.depth);
    setBCColumnWidth(config.column.width);
    setBCColumnDepth(config.column.depth);
    setBCColumnHeight(config.column.height);
  }
}, [
  bcFloor,
  beamColumnConfig,
  setBCFloorHeight,
  setBCBeamGridSpacing,
  setBCColumnGridSpacing,
  setBCBeamWidth,
  setBCBeamDepth,
  setBCColumnWidth,
  setBCColumnDepth,
  setBCColumnHeight
]);

  // Load from FloorDetails.json if reference number is provided but no projectData
  useEffect(() => {
    const loadProjectFromJson = async () => {
      if ((mode === 'edit' || mode === 'view') && ref && !projectData) {
        try {
          const response = await fetch(`${process.env.PUBLIC_URL}/FloorDetails.json`);
          if (!response.ok) {
            throw new Error('Failed to load project data');
          }
          
          const data = await response.json();
          
          // Check if this is the right project by reference
          if (data.estimationRef === ref) {
            // Populate the form with this data
            setEstimationRef(data.estimationRef || '');
            setDescription(data.description || '');
            
            if (data.projectDetails) {
              setSelectedCity(data.projectDetails.city || '');
              setWidth(data.projectDetails.sbaWidth?.toString() || '');
              setDepth(data.projectDetails.sbaLength?.toString() || '');
              setBuildupPercent(data.projectDetails.buildupArea || 90);
              setCarpetPercent(data.projectDetails.carpetArea || 80);
              setFloors(data.projectDetails.floors || 1);
              setLift(data.projectDetails.liftIncluded || false);
            }
            
            // Populate floor configuration
            if (data.floorConfiguration && Array.isArray(data.floorConfiguration)) {
              const newFloorBHKConfigs = {};
              const newBhkRoomDetails = {};
              
              data.floorConfiguration.forEach((floor, floorIdx) => {
                if (floor.bhkUnits && Array.isArray(floor.bhkUnits)) {
                  newFloorBHKConfigs[floorIdx] = floor.bhkUnits.map((unit, unitIdx) => ({
                    type: unit.bhkType || '',
                    units: unit.unitCount || 0,
                    area: unit.carpetAreaSqft?.toString() || '',
                    rooms: unit.rooms?.map(room => room.name).join(', ') || ''
                  }));

                  // Populate room details for modal, including Door and Window fields
                  floor.bhkUnits.forEach((unit, unitIdx) => {
                    if (unit.rooms && Array.isArray(unit.rooms)) {
                      const key = `${floorIdx}-${unitIdx}`;
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
                        // Door object: prefer nested 'Door' if present, else fallback to flat fields
                        modalDetails['Door'][room.name] = room.Door ? {
                          count: room.Door.count || 0,
                          width: room.Door.width || 0,
                          height: room.Door.height || 0
                        } : {
                          count: room.door_count || 0,
                          width: (room.door_width_ft !== undefined ? room.door_width_ft : (room.door_width || 0)),
                          height: (room.door_height_ft !== undefined ? room.door_height_ft : (room.door_height || 0))
                        };
                        // Window object: prefer nested 'Window' if present, else fallback to flat fields
                        modalDetails['Window'][room.name] = room.Window ? {
                          count: room.Window.count || 0,
                          width: room.Window.width || 0,
                          height: room.Window.height || 0
                        } : {
                          count: room.window_count || 0,
                          width: (room.window_width_ft !== undefined ? room.window_width_ft : (room.window_width || 0)),
                          height: (room.window_height_ft !== undefined ? room.window_height_ft : (room.window_height || 0))
                        };
                      });

                      newBhkRoomDetails[key] = modalDetails;
                    }
                  });
                }
              });
              
              setFloorBHKConfigs(newFloorBHKConfigs);
              setBhkRoomDetails(newBhkRoomDetails);
              
              // Extract and add any custom BHK types from the loaded project
              const projectBhkTypes = [];
              data.floorConfiguration.forEach(floor => {
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
                return [...new Set(allTypes)]; // Remove duplicates
              });
            }
          } else {
            console.warn(`Project with reference ${ref} not found in FloorDetails.json`);
          }
        } catch (error) {
          console.error('Error loading project data from JSON:', error);
        }
      }
    };

    loadProjectFromJson();
  }, [mode, ref, projectData]);


  // Rectangle visualization for Step 1
  
  // Load BHK configurations from JSON
  async function loadBHKConfigurations() {
    try {
      setBhkDataLoading(true);
      const response = await fetch(`${process.env.PUBLIC_URL}/BHKPrompt/bhk_info.json`);
      if (!response.ok) {
        throw new Error('Failed to load BHK configuration');
      }
      
      const bhkData = await response.json();
      const configs = bhkData.real_estate_configurations;
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

  // Memoize defaultBHKs to stabilize reference
  const defaultBHKs = React.useMemo(() => [
    { type: '', units: 1, area: '', rooms: '' },
    { type: '', units: 1, area: '', rooms: '' },
    { type: '', units: 1, area: '', rooms: '' }
  ], []);

  // Helper to get BHK config for a floor
  const getFloorRows = React.useCallback(
    (floorIdx) => floorBHKConfigs[floorIdx] || (floorIdx === 0 ? bhkRows : defaultBHKs),
    [floorBHKConfigs, bhkRows, defaultBHKs]
  );

  // Handler to update BHK config for a floor
  function handleFloorCellChange(floorIdx, idx, field, value) {
    if (floorIdx === 0) {
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
    if (floorIdx === 0) {
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
    if (floorIdx === 0) {
      setBhkRows(getFloorRows(floorIdx).filter((_, i) => i !== idx));
    } else {
      setFloorBHKConfigs(prev => {
        const rows = [...getFloorRows(floorIdx)].filter((_, i) => i !== idx);
        return { ...prev, [floorIdx]: rows };
      });
    }
  }
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

  const handleCircleClick = (s) => setStep(s);

  // Excel download logic
 
  
  // Handler to open modal
  async function handleOpenBHKModal(floorIdx, idx) {
    // Use a single variable for the modal key and currentRoomDetails
    const modalKey = `${floorIdx}-${idx}`;
    // Only use Door and Window fields present in saved data; do not patch missing fields
    setBhkRoomDetails(prev => {
      const details = { ...(prev[modalKey] || {}) };
      // Debug: Show the details as loaded from saved data (no patching)
      console.log('Modal roomDetails from saved data:', details);
      return { ...prev, [modalKey]: details };
    });
    // Get selected BHK type and area
    const rows = getFloorRows(floorIdx);
    const bhkType = rows[idx]?.type;
    const bhkArea = rows[idx]?.area;
    // Don't open modal if no BHK type or area is selected, or if row does not exist
    if (!rows[idx] || !bhkType || !bhkArea || bhkType === '' || bhkArea === '') {
      alert('This row is empty. Please fill in BHK Type and Carpet Area in Step 1 for this floor.');
      return;
    }
    setBhkModalFloorIdx(floorIdx);
    setBhkModalIdx(idx);
    try {
      // Use cached allBhkConfigs data if available, otherwise load from JSON
      let configs;
      if (allBhkConfigs.length > 0) {
  // Using cached BHK configs
        configs = allBhkConfigs;
      } else {
  // No cached configs, loading from JSON
        // Load BHK configuration data from JSON as fallback
        const response = await fetch(`${process.env.PUBLIC_URL}/BHKPrompt/bhk_info.json`);
        if (!response.ok) {
          throw new Error('Failed to load BHK configuration');
        }
        const bhkData = await response.json();
        configs = bhkData.real_estate_configurations;
        // Update the cached data
        setAllBhkConfigs(configs);
      }
      
      // Find matching configuration by BHK type and area
      const matchedConfig = configs.find(config => 
        config.type === bhkType && config.total_carpet_area_sqft === parseInt(bhkArea)
      );
      let bhkUnit;
      let floorConfig;
      if (matchedConfig) {
        // Use the original room objects from the JSON (with Door/Window fields)
        // Find the original project, floor, and BHK unit to get the rooms array
        let originalRooms = [];
        try {
          // Assume you have access to the loaded project JSON as 'projectData'
          // and the current floorIdx and idx correspond to floor and bhkUnits
          if (projectData) {
           floorConfig = projectData?.floorConfiguration?.[floorIdx];
           bhkUnit = floorConfig?.bhkUnits?.[idx];
          }
          else {
            bhkUnit=matchedConfig
          }
          
          if (bhkUnit && Array.isArray(bhkUnit.rooms)) {
            originalRooms = bhkUnit.rooms;
          }
        } catch (e) {
          console.error('Error loading originalRooms from projectData:', e);
        }
        // Debug: Log originalRooms array and its contents
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
        setTimeout(() => {
          setShowBHKModal(true);
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
        setShowBHKModal(true);
      }
    } catch (error) {
      console.error('Error loading BHK configuration:', error);
      // Fallback to static columns
      setDynamicRoomColumns([...roomColumns, 'Circulation Space']);
      setShowBHKModal(true);
    }
  }
  // Handler to close modal
  function handleCloseBHKModal() {
    setShowBHKModal(false);
    setBhkModalIdx(null);
    setBhkModalFloorIdx(null);
  }
  // Handler to update grid cell
  function handleRoomDetailChange(row, col, value) {
    setBhkRoomDetails(prev => {
      const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
      const details = prev[key] || {};
      // Deep copy Door and Window objects to preserve all fields
      const updated = {
        ...details,
        'Door': { ...(details['Door'] || {}) },
        'Window': { ...(details['Window'] || {}) }
      };

      // Unified Door handling
      if (row === 'Door Count' || row === 'Door Width (ft)' || row === 'Door Height (ft)') {
        if (!updated['Door']) updated['Door'] = {};
        const prevDoor = updated['Door'][col] || { count: 0, width: 0, height: 0 };
        let newDoor = { ...prevDoor };
        if (row === 'Door Count') newDoor.count = Number(value);
        if (row === 'Door Width (ft)') newDoor.width = Number(value);
        if (row === 'Door Height (ft)') newDoor.height = Number(value);
        updated['Door'][col] = newDoor;
      } else if (row === 'Window Count' || row === 'Window Width (ft)' || row === 'Window Height (ft)') {
        if (!updated['Window']) updated['Window'] = {};
        const prevWindow = updated['Window'][col] || { count: 0, width: 0, height: 0 };
        let newWindow = { ...prevWindow };
        if (row === 'Window Count') newWindow.count = Number(value);
        if (row === 'Window Width (ft)') newWindow.width = Number(value);
        if (row === 'Window Height (ft)') newWindow.height = Number(value);
        updated['Window'][col] = newWindow;
      } else {
        if (!updated[row]) updated[row] = {};
        updated[row][col] = value;
      }
      return { ...prev, [key]: updated };
    });
  
  }

  // Handler for OK button in modal (now only closes the modal)
  function handleOkBHKModal() {
    handleCloseBHKModal();
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
    let floorBeamColumnConfig = beamColumnConfig && beamColumnConfig.find(item => item.floor === floorType);
    if (!floorBeamColumnConfig && floorIdx >= 2 && beamColumnConfig) {
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
          lift: lift ? 1 : 0,
          sba: (Number(width) * Number(depth)) || 0,
          carpetArea: (Number(width) * Number(depth) * (Number(carpetPercent)/100)) || 0,
          super_buildup_area: (Number(width) * Number(depth)) || 0,
          ground_floor_sba: (Number(width) * Number(depth)) || 0,
          buildup_area: (Number(width) * Number(depth) * (Number(buildupPercent) / 100)) || 0,
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
              const L_sb = vars.width;
              const W_sb = vars.depth;
              const A_bu = 0.85 * L_sb * W_sb;
              const layout_ratio = L_sb / W_sb;
              const W_bu = Math.sqrt(A_bu / layout_ratio);
              const L_bu = layout_ratio * W_bu;
              area = 2 * (L_bu + W_bu) * height * vars.floors;
              logic = `2×(BA-Length: ${W_bu.toFixed(2)}+BA-Width: ${L_bu.toFixed(2)})×Floor Height: ${height}×${vars.floors} = ${area.toFixed(0)} sqft`;
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
              logic = `Excavation: ${percentage}% × Super Built-up Area (${vars.super_buildup_area}) = ${area.toFixed(0)} sqft, Thickness: ${usedThickness}ft`;
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
              logic = `Basement Slab: ${percentage}% × Super Built-up Area (${vars.super_buildup_area}) = ${area.toFixed(0)} sqft, Thickness: ${usedThickness}ft`;
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
              const perimeter = 2 * (vars.width + vars.depth);
              area = perimeter * wallHeight;
              logic = `Basement Wall: 2×(${vars.width}+${vars.depth})×${wallHeight}×${wallThickness} = ${(area * wallThickness).toFixed(0)} cuft`;
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
  }, [areaCalculationLogic, width, depth, floors, carpetPercent, buildupPercent, lift, editablePercentages, editableThickness, bhkRoomDetails, getFloorRows, beamColumnConfig]);

  // Debug: Log allFloorsComponents after calculation
  //console.log('allFloorsComponents:', allFloorsComponents);

    // For the selected floor, just filter from allFloorsComponents
    const selectedFloorIdx = Number(selectedDebugFloor || 0);
    const Gridcomponents = allFloorsComponents[selectedFloorIdx] || [];


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
      if (typeof info.qty === 'string') {
        const expr = info.qty.replace(/^{+|}+$/g, '');
        qty = typeof evaluate === 'function'
          ? evaluate(expr.replace(/volume_cuft/g, volume), { volume_cuft: volume })
          : 0;
      } else {
        qty = info.qty * volume;
      }
      const key = `${category}_${mat}_${floor || ''}`;
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
  setMaterialRows(rows);
}, [materialConfig, allFloorsComponents, wastageMap, rateMap, getMaterialRate]);

const handleWastageChange = (key, value) => {
  setWastageMap(prev => ({ ...prev, [key]: Number(value) }));
};

// Update rate and totalValue directly in materialRows for DB persistence
const handleRateChange = (key, value) => {
  setMaterialRows(prevRows =>
    prevRows.map(row => {
      const rowKey = `${row.category}_${row.material}_${row.floor || ''}`;
      if (rowKey === key) {
  const rateNum = Number(value);
  const totalValue = rateNum ? row.totalQty * rateNum : '';
  return { ...row, rate: rateNum, totalValue };
      }
      return row;
    })
  );
};


  // Move all rendering code inside the PricingCalculator function
  return (
    <div className="wizard-container calculator-container" style={{ maxWidth: '900px' }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
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
          Back to Projects
        </Button>
        <h2 className="text-center text-primary mb-0" style={{ fontWeight: 700, letterSpacing: '1px', flex: 1, textAlign: 'center' }}>
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
      <div className="wizard-indicator">
        {[1,2,3,4].map(s => (
          <span
            key={s}
            className={`wizard-circle${step === s ? ' active' : ''}`}
            onClick={() => handleCircleClick(s)}
          >{s}</span>
        ))}
      </div>
      {/* Step Content */}
      <div className="wizard-step-content">
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
                  {ref && ` - ${ref}`}
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
                    readOnly={isViewMode || isNewMode}
                    style={{
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      height: '42px',
                      backgroundColor: (isViewMode || isNewMode) ? '#f8f9fa' : '#fff',
                      color: (isViewMode || isNewMode) ? '#6c757d' : '#495057'
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
                      Select City
                    </Form.Label>
                    <Form.Select 
                      value={selectedCity} 
                      onChange={e => setSelectedCity(e.target.value)}
                      disabled={isViewMode}
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        height: '42px',
                        backgroundColor: isViewMode ? '#f8f9fa' : '#fff',
                        color: isViewMode ? '#6c757d' : '#495057'
                      }}
                    >
                      <option value="">Select City</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </Form.Select>
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
                      SBA Length (ft)
                    </Form.Label>
                    <Form.Control 
                      type="number" 
                      value={depth} 
                      onChange={e => setDepth(e.target.value)} 
                      min={1}
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        height: '42px'
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
                      SBA Width (ft)
                    </Form.Label>
                    <Form.Control 
                      type="number" 
                      value={width} 
                      onChange={e => setWidth(e.target.value)} 
                      min={1}
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        height: '42px'
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
                      Build-up Area (%)
                    </Form.Label>
                    <Form.Control 
                      type="number" 
                      value={buildupPercent} 
                      min={1} 
                      max={100} 
                      onChange={e => setBuildupPercent(Number(e.target.value))}
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
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
                      Carpet Area (%)
                    </Form.Label>
                    <Form.Control 
                      type="number" 
                      value={carpetPercent} 
                      min={1} 
                      max={100} 
                      onChange={e => setCarpetPercent(Number(e.target.value))}
                      style={{
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        padding: '0.75rem',
                        fontSize: '0.9rem',
                        height: '42px'
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>

{/* --- Beam & Column Section UI (Step 1) --- */}
<div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, marginBottom: 32 }}>
  <div style={{ width: 600, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001', padding: 24 }}>
    <h4 style={{ textAlign: 'center',color: '#1976d2', fontWeight: 600, marginBottom: 24 }}>
      Beam &amp; Column Definition
    </h4>
    <Form>
      <Row className="align-items-center mb-3">
        <Col xs={6}>
          <Form.Label>Floor</Form.Label>
          <Form.Select value={bcFloor} onChange={e => setBCFloor(e.target.value)}>
            <option value="Foundation">Foundation</option>
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
    </Form>
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
      {/* BHK Config JSON Modal */}
      <Modal show={showBHKConfigModal} onHide={() => setShowBHKConfigModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ background: '#e3f2fd', borderBottom: '1px solid #1976d2' }}>
          <Modal.Title style={{ fontWeight: 700, color: '#1976d2' }}>BHK Configuration (JSON)</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#fafafa', padding: '1.5rem 2rem' }}>
          <pre style={{ fontSize: '1rem', background: '#f4f4f4', borderRadius: 8, border: '1px solid #ccc', padding: 12, maxHeight: '60vh', overflowY: 'auto' }}>{bhkConfigJson}</pre>
        </Modal.Body>
      </Modal>
            {/* Top summary section for area values */}
            <div className="d-flex justify-content-center" style={{ marginBottom: '2rem' }}>
              <div className="row w-100" style={{ maxWidth: 600 }}>
                <div className="col-12 col-md-4 mb-3 mb-md-0">
                  <div style={{ background: '#e3f2fd', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(33,150,243,0.07)', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1976d2', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25em' }}>
                      Super Built-up
                      <span title="Total area including common spaces (lobby, stairs, etc.)" style={{ cursor: 'pointer', fontSize: '1em', marginLeft: '2px', color: '#1976d2', verticalAlign: 'middle' }}>ℹ️</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>
                      {Number(width) && Number(depth) ? (Number(width) * Number(depth)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4 mb-3 mb-md-0">
                  <div style={{ background: '#e8f5e9', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(76,175,80,0.07)', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#388e3c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25em' }}>
                      Build-up Area
                      <span title="Usable area including walls, balcony, etc." style={{ cursor: 'pointer', fontSize: '1em', marginLeft: '2px', color: '#388e3c', verticalAlign: 'middle' }}>ℹ️</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>
                      {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (buildupPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div style={{ background: '#fce4ec', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(233,30,99,0.07)', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#d81b60', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25em' }}>
                      Carpet Area
                      <span title="Actual area within walls (where carpet can be laid)" style={{ cursor: 'pointer', fontSize: '1em', marginLeft: '2px', color: '#d81b60', verticalAlign: 'middle' }}>ℹ️</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>
                      {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (carpetPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
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
              <div style={{ width: '100%', maxWidth: 600, padding: '0 16px' }}>
                <Form>
                  <Row style={{ marginBottom: '2.5rem', marginTop: '-1.5rem' }}>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label>Number of Floors</Form.Label>
                        <Form.Control type="number" value={floors} onChange={e => setFloors(e.target.value)} min={1} />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                          <div>
                            <Form.Label>Lift Requirement</Form.Label>
                            <Form.Check type="switch" label="Lift Required" checked={lift} onChange={e => setLift(e.target.checked)} />
                          </div>
                          {lift && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Form.Label style={{ fontSize: '0.85rem', color: '#888', marginBottom: 2 }}>No. of Lifts</Form.Label>
                              <Form.Control
                                type="number"
                                min={1}
                                value={numLifts}
                                onChange={e => setNumLifts(Math.max(1, Number(e.target.value)))}
                                style={{ width: 48, fontSize: '0.95rem', padding: '2px 6px', height: 28, borderRadius: 4, border: '1px solid #bdbdbd' }}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  {/* Dynamic Section Rendering for Floors */}
                  <div style={{ marginBottom: '2rem' }}>
                    {[...Array(Number(floors) + 1).keys()].map(floorIdx => (
                      <div key={floorIdx} className="section-responsive" style={{
                        background: floorIdx === 0 ? '#e3f2fd' : '#fff',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        border: '1px solid #e0e0e0',
                        padding: '18px 8px',
                        marginBottom: '1.5rem',
                        maxWidth: '100%',
                        overflowX: 'auto'
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: 12, color: floorIdx === 0 ? '#1976d2' : '#388e3c' }}>
                          {floorIdx === 0
                            ? 'Ground Floor'
                            : `${floorIdx === 1 ? '1st' : floorIdx === 2 ? '2nd' : floorIdx === 3 ? '3rd' : floorIdx + 'th'} Floor`}
                        </div>
                        {floorIdx === 0 ? (
                          <div style={{ width: '100%', overflowX: 'auto' }}>
                            <table style={{ minWidth: 320, width: '100%', borderCollapse: 'collapse', fontSize: '0.97rem' }}>
                              <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Type</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Area (sq ft)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Super Built-up</td>
                                  <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                    {Number(width) && Number(depth) ? (Number(width) * Number(depth)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ marginTop: 0, width: '100%', overflowX: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ fontWeight: 500, fontSize: '0.98rem', color: floorIdx === 0 ? '#1976d2' : '#388e3c' }}>BHK Configuration</div>
                              {floorIdx === 1 && (
                                <button
                                  type="button"
                                  onClick={setDefaultBHKConfiguration}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    border: '1px solid #1976d2',
                                    backgroundColor: '#fff',
                                    color: '#1976d2',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                  }}
                                  onMouseOver={e => e.target.style.backgroundColor = '#f3f9ff'}
                                  onMouseOut={e => e.target.style.backgroundColor = '#fff'}
                                  disabled={bhkDataLoading}
                                >
                                  Set Default
                                </button>
                              )}
                            </div>
                            {floorIdx > 1 && (
                              <Form.Select size="sm" style={{ maxWidth: 140, marginBottom: 8 }} onChange={e => copyFloorConfig(Number(e.target.value), floorIdx)} defaultValue="">
                                <option value="">Copy from...</option>
                                {[...Array(Number(floors) + 1).keys()].filter(i => i !== 0 && i !== floorIdx).map(i => (
                                  <option key={i} value={i}>{i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`}</option>
                                ))}
                              </Form.Select>
                            )}
                            <table style={{ minWidth: 480, width: '100%', borderCollapse: 'collapse', fontSize: '0.97rem' }}>
                              <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>BHK Type</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}># of Units</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Carpet Area (Sq ft)</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Total Area</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Typical Rooms</th>
                                  <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}></th>
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
                                    <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                                      {(row.units * (parseInt(row.area) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
                            <div className="d-flex justify-content-between align-items-center mt-3">
                              <Button variant="outline-primary" size="sm" onClick={() => handleFloorAddRow(floorIdx)}>Add Row</Button>
                              <div style={{ fontWeight: 600, color: (() => {
                                const rows = getFloorRows(floorIdx);
                                const gridTotalArea = rows.reduce((sum, row) => sum + (row.units * (parseInt(row.area) || 0)), 0);
                                return gridTotalArea === totalCarpetArea ? '#388e3c' : '#d81b60';
                              })() }}>
                                Total Area: {(() => {
                                  const rows = getFloorRows(floorIdx);
                                  return rows.reduce((sum, row) => sum + (row.units * (parseInt(row.area) || 0)), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                                })()} sq ft
                                {(() => {
                                  const rows = getFloorRows(floorIdx);
                                  const gridTotalArea = rows.reduce((sum, row) => sum + (row.units * (parseInt(row.area) || 0)), 0);
                                  return gridTotalArea !== totalCarpetArea ? (
                                    <span style={{ marginLeft: 8, color: '#d81b60', fontWeight: 500 }}>
                                      (Carpet Area: {totalCarpetArea.toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                              <Button variant="warning" size="sm" onClick={() => handleFloorAdjust(floorIdx)}>Adjust</Button>
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


        {step === 3 && (
          <>
            <div style={{ width: '100%', margin: '0 auto 1rem auto', padding: '0.5rem 0 0.2rem 0', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
              <h5 style={{ fontWeight: 600, color: '#1976d2', margin: 0, fontSize: '1.18rem', letterSpacing: '0.5px' }}>Floor Component</h5>
            </div>
              {/* Debug breakdown for Internal Walls calculation - now dynamic by floor */}
              <div style={{ width: '100%', maxWidth: 900, margin: '0 auto 1rem auto', background: '#fffde7', border: '1px solid #ffe082', borderRadius: 6, padding: '10px 14px' }}>
                
               
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontWeight: 500, marginRight: 8 }}>Select Floor:</label>
                  <select value={selectedDebugFloor} onChange={e => setSelectedDebugFloor(Number(e.target.value))} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #ffe082' }}>
                    {/* Foundation (index 0) */}
                    <option key={0} value={0}>Foundation</option>
                    {/* Ground Floor and above (shifted by 1) */}
                    {[...Array(Number(floors) + 2).keys()].slice(1).map(i => (
                      <option key={i} value={i}>{i === 1 ? 'Ground Floor' : i === 2 ? '1st Floor' : i === 3 ? '2nd Floor' : i === 4 ? '3rd Floor' : `${i - 1}th Floor`}</option>
                    ))}
                  </select>
                </div>
                
              </div>
            <div style={{ width: '100%', maxWidth: 900, margin: '0 auto 1.5rem auto', background: '#fafafa', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e0e0e0', padding: '18px 12px', fontSize: '.97rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.97rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Component</th>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Logic</th>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Percentage (%)</th>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Area (sq ft)</th>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Thickness (Ft)</th>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Volume (cuft)</th>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {Gridcomponents && Gridcomponents.map((item, idx) => {
                    let volume = 0;
                    // Use item.key for logic, fallback to name for display
                    const key = item.key || item.name || '';
                    // Only show Parapet Walls for the true top floor (selectedDebugFloor === Number(floors) + 1)
                    if (key === 'parapet_walls' || item.name === 'Parapet Walls') {
                      if (!((selectedDebugFloor || 0) === Number(floors) + 1)) return null;
                    }
                    if (key === 'Beams' || key === 'Columns' || key === 'BasementBeam' || key === 'Basementcolumns') {
                      volume = item.area;
                    } else if (item.area && item.thickness) {
                      volume = item.area * item.thickness;
                    }
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>{item.name}</td>
                        <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>
                          {item.name.includes('Internal Walls') ? (
                            <span>
                              {item.logic}
                              {' '}
                              <button 
                                onClick={() => {
                                  setInternalWallsLogic(item.logicDetails || '');
                                  setShowInternalWallsModal(true);
                                }}
                                style={{ 
                                  background: 'none',
                                  border: 'none',
                                  color: '#007bff', 
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                  padding: 0,
                                  font: 'inherit',
                                  marginLeft: '4px'
                                }}
                              >
                                More details
                              </button>
                            </span>
                          ) : (
                            item.logic
                          )}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                          {item.isEditable ? (
                            <input 
                              type="number" 
                              step="0.1"
                              min="0"
                              max="100"
                              value={
                                editablePercentages[item.key] !== undefined
                                  ? editablePercentages[item.key]
                                  : (item.percentage || '')
                              }
                              onChange={(e) => handlePercentageChange(item.key, e.target.value)}
                              style={{ 
                                width: '60px', 
                                padding: '4px', 
                                border: '1px solid #ccc', 
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontSize: '0.9rem'
                              }}
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'right' }}>
                          {(key === 'Beams' || key === 'Columns' || key === 'BasementBeam' || key === 'Basementcolumns' || key === 'BeamVolume')
                            ? '-' 
                            : (item.area ? item.area.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-')}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                          {typeof item.thickness === 'number' && !isNaN(item.thickness) ? (
                            <input 
                              type="number" 
                              step="0.1"
                              min="0"
                              max="10"
                              value={
                                editableThickness[item.key] !== undefined
                                  ? editableThickness[item.key]
                                  : item.thickness
                              }
                              onChange={(e) => handleThicknessChange(item.key, e.target.value)}
                              style={{ 
                                width: '60px', 
                                padding: '4px', 
                                border: '1px solid #ccc', 
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontSize: '0.9rem'
                              }}
                            />
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'right' }}>
                          {volume ? volume.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                          {item.Category || item.category || '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* RCC Volume Summary Row */}
                  {(() => {
                    if (!Gridcomponents) return null;
                    // Only include rows that are visible in the table (apply same filter as table rendering)
                    // Replace this filter with the actual condition used for table rendering if different
                    const visibleRows = Gridcomponents.filter(item => {
                      // Example: replace with your actual table filter condition
                      // For instance, if you filter out 'parapet_walls', do it here
                      // return item.key !== 'parapet_walls';
                      // If you have a more complex filter, copy it here
                      // For now, assuming you filter out by key or category
                      // TODO: Replace with actual filter logic
                      return item.key !== 'parapet_walls';
                    });
                    const categoryMap = {};
                    visibleRows.forEach(item => {
                      let volume = 0;
                      const key = item.key || item.name || '';
                      if (key === 'Beams' || key === 'Columns' || key === 'BasementBeam' || key === 'Basementcolumns') {
                        volume = item.area;
                      } else if (item.area && item.thickness) {
                        volume = item.area * item.thickness;
                      }
                      const cat = (item.Category || item.category || '-').toString().trim();
                      if (!categoryMap[cat]) categoryMap[cat] = 0;
                      if (!isNaN(volume) && volume) {
                        categoryMap[cat] += Number(volume);
                      }
                    });
                    return Object.entries(categoryMap).map(([cat, totalVol], idx) => (
                      <tr key={cat} style={{ background: '#e3f2fd', fontWeight: 700 }}>
                        <td colSpan={5} style={{ textAlign: 'right', color: '#1976d2', fontSize: '1.08rem', border: '1px solid #1976d2' }}>{cat} Volume (cuft)</td>
                        <td style={{ color: '#1976d2', fontSize: '1.08rem', border: '1px solid #1976d2', textAlign: 'right' }}>{totalVol ? Math.round(totalVol).toLocaleString('en-IN') : '-'}</td>
                        <td style={{ color: '#1976d2', fontSize: '1.08rem', border: '1px solid #1976d2', textAlign: 'center' }}></td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </>
        )}
       
{step === 4 && (


  <div>
    
    <div style={{ width: '100%', margin: '0 auto 1rem auto', padding: '0.5rem 0 0.2rem 0', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
              <h5 style={{ fontWeight: 600, color: '#1976d2', margin: 0, fontSize: '1.18rem', letterSpacing: '0.5px' }}>Pricing Details</h5>
            </div>
    <div style={{ display: 'flex', borderBottom: '2px solid #e3e3e3', marginBottom: 18 }}>
    {['Material', 'Labour', 'Other'].map(tab => (
      <div
        key={tab}
        onClick={() => setStep5Tab(tab)}
        style={{
          padding: '10px 28px',
          cursor: 'pointer',
          fontWeight: 600,
          color: step5Tab === tab ? '#1976d2' : '#888',
          borderBottom: step5Tab === tab ? '3px solid #1976d2' : '3px solid transparent',
          background: step5Tab === tab ? '#f5faff' : 'transparent',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          marginRight: 8,
          transition: 'all 0.18s',
          fontSize: '1.08em',
          letterSpacing: '0.5px',
          minWidth: 100,
          textAlign: 'center',
        }}
      >
        {tab}
      </div>
    ))}
  </div>

 {/* Tab Content */}
  <div style={{ minHeight: 200 }}>
    {step5Tab === 'Material' && (
      <div>
        {/* Group By Dropdown */}
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
      <label htmlFor="groupByDropdown" style={{ marginRight: 8, fontWeight: 500 }}>Group by:</label>
      <select
        id="groupByDropdown"
        value={groupBy}
        onChange={handleGroupByChange}
        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 }}
      >
        <option value="Floor">Floor</option>
        <option value="Category">Category</option>
        <option value="Material">Material</option>
      </select>
    </div>
    {/* ...existing code for filter and table... */}
    {(() => {
      // Get unique material names
      const allMaterials = Array.from(new Set(materialRows.map(row => row.material)));

      // Dynamic grouping logic
      const getGroupKey = (row) => {
        if (groupBy === 'Floor') return row.floor;
        if (groupBy === 'Category') return row.category;
        if (groupBy === 'Material') return row.material;
        return row.floor;
      };
      // Group rows by selected groupBy
      const grouped = materialRows.reduce((acc, row) => {
        if (materialFilter && row.material !== materialFilter) return acc;
        const key = getGroupKey(row) || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});

      // Render group header label
      const getGroupHeader = (groupKey) => {
        if (groupBy === 'Floor') return groupKey;
        if (groupBy === 'Category') return `Category: ${groupKey}`;
        if (groupBy === 'Material') return `Material: ${groupKey}`;
        return groupKey;
      };

      return (
  <div className="step5-table-responsive">
          <table className="table table-bordered step5-material-table" style={{ fontSize: '0.89em' }}>
            <thead style={{ background: '#eaf4fb' }}>
              <tr>
                {/* Show Floor column if grouping by Category or Material */}
                {groupBy !== 'Floor' && (
                  <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', whiteSpace: 'nowrap' }}>Floor</th>
                )}
                <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', whiteSpace: 'nowrap' }}>Category</th>
                <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', position: 'relative', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Material
                    <span style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}>
                      <span
                        style={{
                          cursor: 'pointer',
                          color: materialFilter ? '#d81b60' : '#1976d2',
                          transition: 'color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title={materialFilter ? `Filtered: ${materialFilter}` : 'Filter'}
                        onClick={e => { e.stopPropagation(); setShowMaterialFilter(v => !v); }}
                      >
                        <FaFilter />
                      </span>
                      {materialFilter && (
                        <span
                          style={{
                            cursor: 'pointer',
                            color: '#888',
                            marginLeft: 2,
                            fontSize: '1.1em',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Clear filter"
                          onClick={e => {
                            e.stopPropagation();
                            setMaterialFilter('');
                          }}
                        >
                          {/* You may need to import FaTimesCircle from 'react-icons/fa' at the top if not already */}
                          <FaTimesCircle />
                        </span>
                      )}
                    </span>
                  </span>
                  {showMaterialFilter && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        zIndex: 10,
                        minWidth: 120,
                        padding: 4,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <select
                        value={materialFilter}
                        onChange={e => { setMaterialFilter(e.target.value); setShowMaterialFilter(false); }}
                        style={{ width: '100%', fontSize: '0.95em' }}
                      >
                        <option value="">All</option>
                        {allMaterials.map(mat => (
                          <option key={mat} value={mat}>{mat}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </th>
                <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', whiteSpace: 'nowrap' }}>Volume<br/>(cuft)</th>
                <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', whiteSpace: 'nowrap' }}>Qty/Cuft</th>
                <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', whiteSpace: 'nowrap' }}>Wastage<br/>(%)</th>
                <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', whiteSpace: 'nowrap' }}>Total Qty</th>
                <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', whiteSpace: 'nowrap' }}>Unit</th>
                <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', whiteSpace: 'nowrap' }}>Rate</th>
                <th style={{ verticalAlign: 'middle', padding: '10px 8px', fontWeight: 600, color: '#1976d2', whiteSpace: 'nowrap' }}>Total Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([groupKey, rows]) => (
                <React.Fragment key={groupKey}>
                  <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                    <td colSpan={groupBy !== 'Floor' ? 10 : 9}>{getGroupHeader(groupKey)}</td>
                  </tr>
                  {rows.map((row, idx) => {
                    const key = `${row.category}_${row.material}_${row.floor || ''}`;
                    return (
                      <tr key={key}>
                        {/* Show Floor value if grouping by Category or Material */}
                        {groupBy !== 'Floor' && (
                          <td style={{ whiteSpace: 'nowrap' }}>{row.floor}</td>
                        )}
                        <td style={{ whiteSpace: 'nowrap' }}>{row.category}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{row.material}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{row.volume.toFixed(0)}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{row.qty}</td>
                        <td>
                          <input
                            type="number"
                            value={wastageMap[key] !== undefined ? wastageMap[key] : row.wastage}
                            onChange={e => handleWastageChange(key, e.target.value)}
                            style={{ width: 60, minWidth: 50 }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{row.totalQty.toFixed(0)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{row.unit}</td>
                        <td style={{ textAlign: 'right', minWidth: 56, maxWidth: 72, width: 68 }}>
                          <input
                            type="number"
                            value={row.rate ?? ''}
                            onChange={e => handleRateChange(key, e.target.value)}
                            style={{ width: 60, minWidth: 48, maxWidth: 72, textAlign: 'right', padding: '2px 4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{row.totalValue ? row.totalValue.toFixed(0) : ''}</td>
                      </tr>
                    );
                  })}
                  {/* Subtotal row for this group */}
                  <tr style={{ background: '#f9f9f9', fontWeight: 'bold' }}>
                    <td colSpan={groupBy !== 'Floor' ? 9 : 8} style={{ textAlign: 'right' }}>Subtotal</td>
                    <td style={{ textAlign: 'right' }}>
                      ₹{rows.reduce((sum, row) => sum + (row.totalValue ? Number(row.totalValue.toFixed(0)) : 0), 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
            {/* Grand Total row at the bottom */}
            <tfoot>
              <tr style={{ background: '#e3f2fd', fontWeight: 800, borderTop: '3px solid #1976d2', color: '#0d47a1' }}>
                {/* Grand Total label with colspan, value right-aligned */}
                <td colSpan={groupBy !== 'Floor' ?  (10 - 1) : (9 - 1)} style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05em', borderTop: '3px solid #1976d2' }}>
                  Grand Total
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05em', borderTop: '3px solid #1976d2' }}>
                  {
                    (() => {
                      const visibleRows = materialRows.filter(row => !materialFilter || row.material === materialFilter);
                      const grandTotal = visibleRows.reduce((sum, row) => sum + (row.totalValue ? Number(row.totalValue) : 0), 0);
                      return `₹${Math.round(grandTotal.toFixed()).toLocaleString('en-IN')}`;
                    })()
                  }
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    })()}

      </div>
    )}
    {step5Tab === 'Labour' && (
      <div style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: '1.1em' }}>
        <b>Labour</b> tab content goes here.
      </div>
    )}
    {step5Tab === 'Other' && (
      <div style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: '1.1em' }}>
        <b>Other</b> tab content goes here.
      </div>
    )}
  </div>


    
  </div>
)}
      </div>
      {/* Navigation Buttons */}
      <div className="wizard-nav-btns mt-4">
        <Button disabled={step === 1} onClick={() => setStep(step-1)} className="me-2">Back</Button>
        <Button disabled={step === 4} onClick={() => setStep(step+1)} className="me-2">Next</Button>
        {!isViewMode && (
          <Button variant="success" onClick={handleSaveBHKConfig} style={{ fontWeight: 600 }}>Save</Button>
        )}
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
          {(() => {
            if (bhkModalFloorIdx == null || bhkModalIdx == null) return null;
            const rows = getFloorRows(bhkModalFloorIdx);
            const bhkType = rows[bhkModalIdx]?.type || '';
            const carpetArea = rows[bhkModalIdx]?.area || '';
            // Find the BHK config for this type and area
            let bhkConfigRooms = [];
            if (bhkType && carpetArea && Array.isArray(allBhkConfigs)) {
              const config = allBhkConfigs.find(c => c.type === bhkType && String(c.total_carpet_area_sqft) === String(carpetArea));
              if (config && Array.isArray(config.rooms)) {
                bhkConfigRooms = config.rooms;
              }
            }
            if (!bhkType || !carpetArea) {
              return (
                <div style={{ color: '#d32f2f', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', padding: '2rem 0' }}>
                  This row is empty. Please fill in BHK Type and Area in Step 1 for this floor.<br/>
                  No calculation can be performed for empty rows.
                </div>
              );
            }
            // Only render the table/grid if the row is filled
            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(33,150,243,0.07)', border: '1px solid #e0e0e0' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '8px', border: '1px solid #e0e0e0', minWidth: 70, fontSize: '0.8rem' }}></th>
                      {dynamicRoomColumns.map(col => (
                        <th key={col} style={{ padding: '8px', border: '1px solid #e0e0e0', minWidth: 85, fontWeight: 600, color: '#1976d2', textAlign: 'center', fontSize: '0.75rem' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gridRows.map(rowLabel => (
                      <tr key={rowLabel}>
                        <td style={{ padding: '8px', border: '1px solid #e0e0e0', fontWeight: 600, background: '#f5f5f5', textAlign: 'right', fontSize: '0.8rem' }}>{rowLabel}</td>
                        {dynamicRoomColumns.map(col => (
                          <td key={col} style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                            <Form.Control
                              type="number"
                              min={0}
                              value={(() => {
                                const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
                                const details = bhkRoomDetails[key] || {};
                                const rowObj = details[rowLabel] || {};
                                return typeof rowObj[col] !== 'undefined' ? rowObj[col] : '';
                              })()}
                              onChange={e => handleRoomDetailChange(rowLabel, col, e.target.value)}
                              size="sm"
                              style={{ 
                                maxWidth: 70, 
                                margin: '0 auto', 
                                fontSize: '0.85rem', 
                                borderRadius: 6, 
                                border: '1px solid #bdbdbd', 
                                background: col === 'Circulation Space' ? '#f5f5f5' : '#fff',
                                color: col === 'Circulation Space' ? '#666' : '#000'
                              }}
                              placeholder={rowLabel === 'Count' ? '0' : 'ft'}
                              readOnly={false}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Summary row for Total Area (sq ft) */}
                    <tr style={{ background: '#e3f2fd' }}>
                      <td style={{ padding: '8px', border: '1px solid #e0e0e0', fontWeight: 700, textAlign: 'right', color: '#1976d2', fontSize: '0.8rem' }}>
                        Total Carpet Area
                        <div style={{ fontSize: '0.7em', fontWeight: 400, color: '#666' }}>
                          ({(() => {
                            const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
                            let totalSum = 0;
                            dynamicRoomColumns.forEach(col => {
                              const details = bhkRoomDetails[key] || {};
                              const count = Number((details['Count'] && typeof details['Count'][col] !== 'undefined') ? details['Count'][col] : 0);
                              const length = Number((details['Length (ft)'] && typeof details['Length (ft)'][col] !== 'undefined') ? details['Length (ft)'][col] : 0);
                              const width = Number((details['Width (ft)'] && typeof details['Width (ft)'][col] !== 'undefined') ? details['Width (ft)'][col] : 0);
                              totalSum += count * length * width;
                            });
                            return totalSum.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                          })()} sq ft)
                        </div>
                      </td>
                      {dynamicRoomColumns.map(col => {
                        const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
                        const details = bhkRoomDetails[key] || {};
                        const count = Number((details['Count'] && typeof details['Count'][col] !== 'undefined') ? details['Count'][col] : 0);
                        const length = Number((details['Length (ft)'] && typeof details['Length (ft)'][col] !== 'undefined') ? details['Length (ft)'][col] : 0);
                        const width = Number((details['Width (ft)'] && typeof details['Width (ft)'][col] !== 'undefined') ? details['Width (ft)'][col] : 0);
                        const total = count * length * width;
                        return (
                          <td key={col} style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 700, color: '#388e3c', background: '#e8f5e9', fontSize: '0.8rem' }}>
                            {total > 0 ? total.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Door Details Row */}
                    <tr style={{ background: '#fffbe7' }}>
                      <td style={{ padding: '8px', border: '1px solid #e0e0e0', fontWeight: 700, textAlign: 'right', color: '#b8860b', fontSize: '0.8rem' }}>
                        Door Details

                        <div style={{ fontSize: '0.7em', fontWeight: 400, color: '#b8860b' }}>
                          (Count, Width×Height, Area)
                        </div>
                        
                      </td>
                      {dynamicRoomColumns.map(col => {
                        // Find config for this room (by name)
                        const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
                        const details = bhkRoomDetails[key] || {};
                        const doorDetails = details['Door'] || {};
                        const doorObj = doorDetails[col] || {};
                        const doorCount = doorObj.count ?? '';
                        const doorWidth = doorObj.width ?? '';
                        const doorHeight = doorObj.height ?? '';
                        const doorArea = (doorObj.count && doorObj.width && doorObj.height) ? doorObj.count * doorObj.width * doorObj.height : '';
                        const isEntryDoor = col === 'Circulation Space';
                        return (
                          <td key={col} style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center', color: '#b8860b', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {isEntryDoor && (
                                <div style={{ fontWeight: 700, color: '#b8860b', fontSize: '0.85em', marginBottom: 2 }}>Entry Door</div>
                              )}
                              <div>
                                {/* Span for Count */}
                                 <Form.Control type="number" min={0} value={doorCount} size="sm" style={{ width: 50, display: 'inline-block' }}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setBhkRoomDetails(prev => {
                                      const updated = { ...prev };
                                      if (!updated[key]) updated[key] = {};
                                      if (!updated[key]['Door']) updated[key]['Door'] = {};
                                      const configRoom = bhkConfigRooms.find(r => r.name === col) || {};
                                      const prevObj = (prev[key] && prev[key]['Door'] && prev[key]['Door'][col]) ? prev[key]['Door'][col] : {};
                                      updated[key]['Door'][col] = {
                                        count: val,
                                        width: prevObj.width ?? configRoom.door_width_ft ?? 0,
                                        height: prevObj.height ?? configRoom.door_height_ft ?? 0,
                                      };
                                      return { ...updated };
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                {/* Span for Width */}
                                <Form.Control type="number" min={0} value={doorWidth} size="sm" style={{ width: 50, display: 'inline-block' }}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setBhkRoomDetails(prev => {
                                      const updated = { ...prev };
                                      if (!updated[key]) updated[key] = {};
                                      if (!updated[key]['Door']) updated[key]['Door'] = {};
                                      const configRoom = bhkConfigRooms.find(r => r.name === col) || {};
                                      const prevObj = (prev[key] && prev[key]['Door'] && prev[key]['Door'][col]) ? prev[key]['Door'][col] : {};
                                      updated[key]['Door'][col] = {
                                        count: prevObj.count ?? configRoom.door_count ?? 0,
                                        width: val,
                                        height: prevObj.height ?? configRoom.door_height_ft ?? 0,
                                      };
                                      return { ...updated };
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                {/* Span for Height */}
                                 <Form.Control type="number" min={0} value={doorHeight} size="sm" style={{ width: 50, display: 'inline-block' }}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setBhkRoomDetails(prev => {
                                      const updated = { ...prev };
                                      if (!updated[key]) updated[key] = {};
                                      if (!updated[key]['Door']) updated[key]['Door'] = {};
                                      const configRoom = bhkConfigRooms.find(r => r.name === col) || {};
                                      const prevObj = (prev[key] && prev[key]['Door'] && prev[key]['Door'][col]) ? prev[key]['Door'][col] : {};
                                      updated[key]['Door'][col] = {
                                        count: prevObj.count ?? configRoom.door_count ?? 0,
                                        width: prevObj.width ?? configRoom.door_width_ft ?? 0,
                                        height: val,
                                      };
                                      return { ...updated };
                                    });
                                  }}
                                />
                              </div>
                              {/* Area Display */}
                              <div style={{ fontSize: '0.8em', color: '#b8860b', marginTop: 2 }}>
                                <b>{doorArea > 0 ? doorArea.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}</b> sq ft
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    {/* Window Details Row */}
                    <tr style={{ background: '#e7f7ff' }}>
                      <td style={{ padding: '8px', border: '1px solid #e0e0e0', fontWeight: 700, textAlign: 'right', color: '#1976d2', fontSize: '0.8rem' }}>
                        Window Details
                        <div style={{ fontSize: '0.7em', fontWeight: 400, color: '#1976d2' }}>
                          (Count, Width×Height, Area)
                        </div>
                      </td>
                      {dynamicRoomColumns.map(col => {
                        // Find config for this room (by name)
                        const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
                        const details = bhkRoomDetails[key] || {};
                        const windowDetails = details['Window'] || {};
                        const windowCount = (windowDetails[col] && typeof windowDetails[col].count !== 'undefined') ? windowDetails[col].count : (bhkConfigRooms.find(r => r.name === col)?.window_count || 0);
                        const windowWidth = (windowDetails[col] && typeof windowDetails[col].width !== 'undefined') ? windowDetails[col].width : (bhkConfigRooms.find(r => r.name === col)?.window_width_ft || 0);
                        const windowHeight = (windowDetails[col] && typeof windowDetails[col].height !== 'undefined') ? windowDetails[col].height : (bhkConfigRooms.find(r => r.name === col)?.window_height_ft || 0);
                        const windowArea = windowCount * windowWidth * windowHeight;
                        return (
                          <td key={col} style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center', color: '#1976d2', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div>
                                {/* Span for Count */}
                                 <Form.Control type="number" min={0} value={windowCount} size="sm" style={{ width: 50, display: 'inline-block' }}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setBhkRoomDetails(prev => {
                                      const updated = { ...prev };
                                      if (!updated[key]) updated[key] = { ...details };
                                      if (!updated[key]['Window']) updated[key]['Window'] = {};
                                      if (!updated[key]['Window'][col]) updated[key]['Window'][col] = {};
                                      updated[key]['Window'][col].count = val;
                                      return { ...updated };
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                {/* Span for Width */}
                                <Form.Control type="number" min={0} value={windowWidth} size="sm" style={{ width: 50, display: 'inline-block' }}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setBhkRoomDetails(prev => {
                                      const updated = { ...prev };
                                      if (!updated[key]) updated[key] = { ...details };
                                      if (!updated[key]['Window']) updated[key]['Window'] = {};
                                      if (!updated[key]['Window'][col]) updated[key]['Window'][col] = {};
                                      updated[key]['Window'][col].width = val;
                                      return { ...updated };
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                {/* Span for Height */}
                                 <Form.Control type="number" min={0} value={windowHeight} size="sm" style={{ width: 50, display: 'inline-block' }}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setBhkRoomDetails(prev => {
                                      const updated = { ...prev };
                                      if (!updated[key]) updated[key] = { ...details };
                                      if (!updated[key]['Window']) updated[key]['Window'] = {};
                                      if (!updated[key]['Window'][col]) updated[key]['Window'][col] = {};
                                      updated[key]['Window'][col].height = val;
                                      return { ...updated };
                                    });
                                  }}
                                />
                              </div>
                              {/* Area Display */}
                              <div style={{ fontSize: '0.8em', color: '#1976d2', marginTop: 2 }}>
                                 <b>{windowArea > 0 ? windowArea.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}</b> sq ft
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Button variant="primary" size="lg" style={{ minWidth: 120, fontWeight: 600, letterSpacing: '0.5px' }} onClick={handleOkBHKModal}>OK</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Large Site Plan Modal */}


      {/* Internal Walls Details Modal */}
      <Modal show={showInternalWallsModal} onHide={() => setShowInternalWallsModal(false)} size="lg">
        <Modal.Header closeButton style={{ background: '#f8f9fa', borderBottom: '2px solid #007bff' }}>
          <Modal.Title style={{ color: '#007bff', fontWeight: 'bold' }}>
            🏗️ Internal Walls - Detailed Calculation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#fafafa', padding: '15px' }}>
          <div style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {internalWallsLogic ? (
              <>
                <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {(() => {
                    const sections = internalWallsLogic.replace('Advanced calculation: ', '').split(' | ');
                    // Filter out duplicate BHK sections by header
                    const uniqueSections = [];
                    const seenHeaders = new Set();
                    sections.forEach(section => {
                      const lines = section.split('\n').map(l => l.trim()).filter(l => l);
                      if (!lines.length) return;
                      const bhkHeader = lines[0];
                      if (!seenHeaders.has(bhkHeader)) {
                        uniqueSections.push(section);
                        seenHeaders.add(bhkHeader);
                      }
                    });
                    return uniqueSections.map((section, index) => {

                      // Prepare lines for each section
                      const lines = section.split('\n').map(l => l.trim()).filter(l => l);
                      if (!lines.length) return null;
                      const bhkHeader = lines[0];
                      // Room lines: exclude calculation breakdown, reduction/deduction, balcony
                      const roomLines = lines.slice(1).filter(l =>
                        l &&
                        !l.startsWith('--- Calculation Breakdown ---') &&
                        !l.toLowerCase().includes('balcony') &&
                        !l.toLowerCase().includes('reduction') &&
                        !l.toLowerCase().includes('deduct') &&
                        !l.toLowerCase().includes('total rooms area') &&
                        !l.toLowerCase().includes('final total wall area')
                      );
                      // Area reduction lines: only reduction/deduction lines (from calculation breakdown), filter out 'total deduction' if present
                      const areaReductionLines = lines.slice(1).filter(l =>
                        l &&
                        (l.toLowerCase().includes('reduction') || l.toLowerCase().includes('deduct')) &&
                        !l.toLowerCase().includes('total deduction')
                      );
                      // Total Rooms Area, Total Deduction, and Final Total Wall Area (from calculation breakdown)
                      const totalRoomsAreaLine = lines.find(l => l.toLowerCase().includes('total rooms area'));
                      const totalDeductionLine = (() => {
                        // Try to find a line with 'total deduction'
                        const found = lines.find(l => l.toLowerCase().includes('total deduction'));
                        if (found) return found;
                        return null;
                      })();
                      const finalTotalWallAreaLine = lines.find(l => l.toLowerCase().includes('final total wall area'));

                      return (
                        <div key={index} style={{ marginBottom: '20px' }}>
                          {/* BHK Header */}
                          <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '12px', fontSize: '1rem', padding: '8px 12px', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: '6px', border: '2px solid #2196f3', borderLeft: '4px solid #007bff', boxShadow: '0 1px 4px rgba(33, 150, 243, 0.15)' }}>
                            {bhkHeader}
                          </div>
                          {/* Room Details */}
                          <div style={{ marginBottom: '15px' }}>
                            <h6 style={{ color: '#333', marginBottom: '10px', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              🏠 Room Area Breakdown Details
                            </h6>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
                              {roomLines.map((line, lineIdx) => (
                                <div
                                  key={lineIdx}
                                  style={{
                                    background: '#e3f2fd',
                                    border: '1px solid #2196f3',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    marginBottom: '6px',
                                    fontWeight: 500,
                                    color: '#1976d2',
                                    fontSize: '0.92em',
                                    boxShadow: '0 1px 2px rgba(33,150,243,0.05)',
                                    maxWidth: '340px',
                                    minWidth: '160px',
                                    width: '100%',
                                    display: 'inline-block'
                                  }}
                                >
                                  {line}
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Area Reduction Section */}
                          {areaReductionLines.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                              <h6 style={{ color: '#c2185b', marginBottom: '10px', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                ➖ Area Reduction
                              </h6>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
                                {areaReductionLines.map((line, lineIdx) => (
                                  <div
                                    key={lineIdx}
                                    style={{
                                      background: '#fce4ec',
                                      border: '1px solid #e91e63',
                                      borderRadius: '6px',
                                      padding: '6px 10px',
                                      marginBottom: '6px',
                                      fontWeight: 500,
                                      color: '#c2185b',
                                      fontSize: '0.92em',
                                      boxShadow: '0 1px 2px rgba(233,30,99,0.05)',
                                      maxWidth: '340px',
                                      minWidth: '160px',
                                      width: '100%',
                                      display: 'inline-block'
                                    }}
                                  >
                                    {line}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Total Rooms Area, Total Deduction, and Final Total Wall Area */}
                          <div style={{ marginBottom: '0' }}>
                            {totalRoomsAreaLine && (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', marginBottom: '6px', background: '#e8f5e8', border: '1px solid #4caf50', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', color: '#1b5e20' }}>
                                  <span>{totalRoomsAreaLine}</span>
                                </div>
                                {totalDeductionLine && (
                                  <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', marginBottom: '6px', background: '#fff3e0', border: '1px solid #ff9800', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', color: '#e65100' }}>
                                    <span>{totalDeductionLine}</span>
                                  </div>
                                )}
                              </>
                            )}
                            {finalTotalWallAreaLine && (
                              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', marginBottom: '0', background: '#e8f5e8', border: '1px solid #4caf50', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', color: '#1b5e20' }}>
                                <span>{finalTotalWallAreaLine}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '40px 20px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📝</div>
                <div>No calculation details available</div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer style={{ background: '#f8f9fa', borderTop: '1px solid #ddd' }}>
          <button 
            onClick={() => setShowInternalWallsModal(false)}
            style={{ 
              padding: '8px 20px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PricingCalculator;
