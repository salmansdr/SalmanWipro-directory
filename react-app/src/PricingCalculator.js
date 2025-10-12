import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight, FaFileExcel, FaFilePdf, FaHome } from 'react-icons/fa';
import { generatePDFReport } from './pdfUtils';
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

const costLevels = [
  { key: 'basic', label: 'Basic' },
  { key: 'deluxe', label: 'Deluxe' },
  { key: 'premium', label: 'Premium' }
];

const sampleCostData = [
  {
    category: 'Civil',
    details: [
      { name: 'Brickwork', qty: 100, unit: 'sqft', rate: { basic: 50, deluxe: 70, premium: 90 } },
      { name: 'Concrete', qty: 50, unit: 'cft', rate: { basic: 80, deluxe: 100, premium: 120 } }
    ]
  },
  {
    category: 'Door & Window',
    details: [
      { name: 'Wooden Door', qty: 10, unit: 'nos', rate: { basic: 3000, deluxe: 4000, premium: 5000 } },
      { name: 'Aluminum Window', qty: 8, unit: 'nos', rate: { basic: 2500, deluxe: 3500, premium: 4500 } }
    ]
  },
  {
    category: 'Electrical',
    details: [
      { name: 'Wiring', qty: 200, unit: 'mtr', rate: { basic: 20, deluxe: 30, premium: 40 } },
      { name: 'Switches', qty: 30, unit: 'nos', rate: { basic: 100, deluxe: 150, premium: 200 } }
    ]
  },
  {
    category: 'Flooring',
    details: [
      { name: 'Tiles', qty: 120, unit: 'sqft', rate: { basic: 40, deluxe: 60, premium: 80 } }
    ]
  },
  {
    category: 'Plumbing',
    details: [
      { name: 'Pipes', qty: 60, unit: 'mtr', rate: { basic: 30, deluxe: 45, premium: 60 } }
    ]
  },
  {
    category: 'Finishes',
    details: [
      { name: 'Paint', qty: 200, unit: 'sqft', rate: { basic: 10, deluxe: 20, premium: 30 } }
    ]
  },
  {
    category: 'Miscellaneous',
    details: [
      { name: 'Cleaning', qty: 1, unit: 'job', rate: { basic: 500, deluxe: 700, premium: 900 } }
    ]
  }
];


const PricingCalculator = () => {
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
      const seenTypes = new Set();
      for (const config of configs) {
        if (!seenTypes.has(config.type)) {
          defaultConfigs.push({
            type: config.type,
            units: 1,
            area: config.total_carpet_area_sqft.toString(),
            rooms: config.rooms.map(r => r.name).join(', ')
          });
          seenTypes.add(config.type);
        }
      }
      // Update all floors with default configurations
      const updatedConfigs = { ...floorBHKConfigs };
      for (let floorIdx = 1; floorIdx <= Number(floors); floorIdx++) {
        updatedConfigs[floorIdx] = defaultConfigs.map(config => ({ ...config }));
      }
      setFloorBHKConfigs(updatedConfigs);
      alert(`Default BHK configurations set for all floors:\n${defaultConfigs.map(c => `${c.type}: ${c.area} sq ft`).join('\n')}`);
    } catch (error) {
      console.error('Error setting default BHK configuration:', error);
      alert('Failed to set default configurations. Please try again.');
    }
  }
  // Removed unused state: sitePlanFile

  // Update file and preview URL on upload
  function handleSitePlanUpload(e) {
    const file = e.target.files[0];
    if (file) {
      setSitePlanUrl(URL.createObjectURL(file));
    }
  }

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
  const rectangleRef = React.useRef();
  // State for debug breakdown floor selection in Step 3
  const [selectedDebugFloor, setSelectedDebugFloor] = useState(0);
  // State for number of lifts
  const [numLifts, setNumLifts] = useState(1);
  // Per-floor BHK configuration state
  const [floorBHKConfigs, setFloorBHKConfigs] = useState({});

  // Handler to copy config from one floor to another
  function copyFloorConfig(fromIdx, toIdx) {
    setFloorBHKConfigs(prev => ({
      ...prev,
      [toIdx]: prev[fromIdx] ? [...prev[fromIdx]] : [...bhkRows]
    }));
  }
  // New state for build-up and carpet area percentages
  const [buildupPercent, setBuildupPercent] = useState(90);
  const [carpetPercent, setCarpetPercent] = useState(80);

  
  // Responsive mobile detection
  //const isMobile = window.innerWidth <= 600 || window.matchMedia('(max-width: 600px)').matches;
  // Declare all required state variables
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [step, setStep] = useState(1);
  const [selectedCity, setSelectedCity] = useState('');
  const [floors, setFloors] = useState(1);
  const [lift, setLift] = useState(false);
  const [costLevel, setCostLevel] = useState('basic');
  const [openCategory, setOpenCategory] = useState([]);
  // State for popup modal
  const [showBHKModal, setShowBHKModal] = useState(false);
  const [bhkModalIdx, setBhkModalIdx] = useState(null);
  const [bhkModalFloorIdx, setBhkModalFloorIdx] = useState(null);
  // Room details state for modal (per BHK type)
  const [bhkRoomDetails, setBhkRoomDetails] = useState({});
  // Dynamic room columns from BHK configuration
  const [dynamicRoomColumns, setDynamicRoomColumns] = useState([]);
  
  // BHK configuration data loaded from JSON
  const [allBhkConfigs, setAllBhkConfigs] = useState([]);
  const [bhkTypeOptions, setBhkTypeOptions] = useState([]);
  const [carpetAreaOptions, setCarpetAreaOptions] = useState({}); // { "1 BHK": [500, 600, 700], "2 BHK": [800, 900, 1000] }
  const [bhkDataLoading, setBhkDataLoading] = useState(true);

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
      handleFloorCellChange(floorIdx, idx, 'area', availableAreas[0]);
      
      // Update rooms description based on new configuration
      const config = allBhkConfigs.find(c => c.type === newType && c.total_carpet_area_sqft === availableAreas[0]);
      if (config) {
        const roomList = config.rooms.map(room => room.name).join(', ');
        handleFloorCellChange(floorIdx, idx, 'rooms', roomList);
      }
    }
  }
  const plotArea = width && depth ? Number(width) * Number(depth) : '';
  let rectangleVisualization = null;


  // At the top of your component
const defaultBHKs = [
  { type: '', units: 1, area: '', rooms: '' },
  { type: '', units: 1, area: '', rooms: '' },
  { type: '', units: 1, area: '', rooms: '' }
];
  // Default BHK config for new floors
  const [bhkRows, setBhkRows] = useState(defaultBHKs);

  // Helper to get BHK config for a floor
  const getFloorRows = floorIdx => floorBHKConfigs[floorIdx] || (floorIdx === 0 ? bhkRows : defaultBHKs);

  // Handler to update BHK config for a floor
  function handleFloorCellChange(floorIdx, idx, field, value) {
    if (floorIdx === 0) {
      const updated = [...bhkRows];
      updated[idx][field] = field === 'units' || field === 'area' ? Number(value) : value;
      setBhkRows(updated);
    } else {
      setFloorBHKConfigs(prev => {
        const rows = [...getFloorRows(floorIdx)];
        rows[idx][field] = field === 'units' || field === 'area' ? Number(value) : value;
        return { ...prev, [floorIdx]: rows };
      });
    }
  }

  // Handler to add/remove row for a floor
  function handleFloorAddRow(floorIdx) {
    if (floorIdx === 0) {
      setBhkRows([...getFloorRows(floorIdx), { type: '', units: 1, area: '', rooms: '' }]);
    } else {
      setFloorBHKConfigs(prev => {
        const rows = [...getFloorRows(floorIdx), { type: '', units: 1, area: '', rooms: '' }];
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
const totalCarpetArea = Number(width) && Number(depth) ? Number(width) * Number(depth) * (carpetPercent/100) : 0;

  if (width && depth) {
    // Responsive base sizes
    const OUTER_WIDTH = Math.min(window.innerWidth * 0.96, 800);
    const OUTER_HEIGHT = Math.min(window.innerWidth * 0.60, 320);
    const MAX_WIDTH = OUTER_WIDTH * 0.8;
    const MAX_HEIGHT = OUTER_HEIGHT * 0.8;
    // Rectangle sizes (clamped for mobile)
    // Increase scale so rectangles are always visible, even for small SBA
  const SCALE_FACTOR = 0.5; // Even higher scale for maximum visibility
    const sbaWidth = Math.max(120, Math.min(MAX_WIDTH, Number(width) * SCALE_FACTOR));
    const sbaHeight = Math.max(60, Math.min(MAX_HEIGHT, Number(depth) * SCALE_FACTOR));
    const buaWidth = Math.max(90, Math.min(sbaWidth - 24, (Number(width) * (buildupPercent/100)) * SCALE_FACTOR));
    const buaHeight = Math.max(45, Math.min(sbaHeight - 24, (Number(depth) * (buildupPercent/100)) * SCALE_FACTOR));
    const caWidth = Math.max(60, Math.min(buaWidth - 24, (Number(width) * (carpetPercent/100)) * SCALE_FACTOR));
    const caHeight = Math.max(30, Math.min(buaHeight - 24, (Number(depth) * (carpetPercent/100)) * SCALE_FACTOR));

  


    rectangleVisualization = (
      <div
        ref={rectangleRef}
        className="ner"
        style={{
          margin: '2rem auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '320px',
          width: '100%',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 'min(96vw, 800px)',
            height: 'min(80vw, 280px)',
            maxWidth: '800px',
            maxHeight: '280px',
            background: 'transparent',
            borderRadius: '12px',
            border: '1.5px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'relative', width: `${sbaWidth}px`, height: `${sbaHeight}px`, margin: '0 auto' }}>
            {/* SBA Rectangle */}
            <div style={{
              width: '100%',
              height: '100%',
              background: '#fffde7',
              border: '3px solid #ffd600',
              borderRadius: '6px',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ color: '#616161', fontWeight: 400, fontSize: '.80rem', textAlign: 'center' }}>
                Super Built-up<br />{Number(plotArea).toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq ft
              </span>
              {/* SBA width label (top edge) */}
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#616161', fontWeight: 400, background: '#fffde7', padding: '0 4px', borderRadius: '3px' }}>
                {Number(width).toFixed(2)} ft
              </span>
              {/* SBA height label (left border, vertical) */}
              <span style={{
                position: 'absolute',
                left: '-23px',
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                fontSize: '0.55rem',
                color: '#616161',
                fontWeight: 400,
                background: '#fffde7',
                padding: '0 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap'
              }}>
                {Number(depth).toFixed(2)} ft
              </span>
            </div>
            {/* Build-up area Rectangle */}
            <div style={{
              width: `${buaWidth}px`,
              height: `${buaHeight}px`,
              background: '#e3f2fd',
              border: '2px solid #1976d2',
              borderRadius: '6px',
              position: 'absolute',
              top: `${(sbaHeight - buaHeight) / 2}px`,
              left: `${(sbaWidth - buaWidth) / 2}px`,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ color: '#1976d2', fontWeight: 400, fontSize: '.80rem', textAlign: 'center' }}>
                Build-up Area<br />{(plotArea * (buildupPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq ft
              </span>
              {/* BUA width label (top edge) */}
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#1976d2', fontWeight: 400, background: '#e3f2fd', padding: '0 4px', borderRadius: '3px' }}>
                {(Number(width) * (buildupPercent/100)).toFixed(2)} ft
              </span>
              {/* BUA height label (left border, vertical) */}
              <span style={{
                position: 'absolute',
                left: '-23px',
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                fontSize: '0.55rem',
                color: '#1976d2',
                fontWeight: 400,
                background: '#e3f2fd',
                padding: '0 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap'
              }}>
                {(Number(depth) * (buildupPercent/100)).toFixed(2)} ft
              </span>
            </div>
            {/* Carpet area Rectangle */}
            <div style={{
              width: `${caWidth}px`,
              height: `${caHeight}px`,
              background: '#fce4ec',
              border: '2px solid #d81b60',
              borderRadius: '6px',
              position: 'absolute',
              top: `${(sbaHeight - caHeight) / 2}px`,
              left: `${(sbaWidth - caWidth) / 2}px`,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ color: '#d81b60', fontWeight: 400, fontSize: '.80rem', textAlign: 'center' }}>
                Carpet Area<br />{(plotArea * (carpetPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq ft
              </span>
              {/* Carpet width label (top edge) */}
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#d81b60', fontWeight: 400, background: '#fce4ec', padding: '0 4px', borderRadius: '3px' }}>
                {(Number(width) * (carpetPercent/100)).toFixed(2)} ft
              </span>
              {/* Carpet height label (left border, vertical) */}
              <span style={{
                position: 'absolute',
                left: '-23px',
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                fontSize: '0.55rem',
                color: '#d81b60',
                fontWeight: 400,
                background: '#fce4ec',
                padding: '0 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap'
              }}>
                {(Number(depth) * (carpetPercent/100)).toFixed(2)} ft
              </span>
            </div>
            {/* Grid below Carpet Area Rectangle */}
            
          </div>
        </div>
      </div>
    );
  }

  const handleCircleClick = (s) => setStep(s);
  const toggleCategory = (cat) => {
    setOpenCategory((prev) =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

  // Excel download logic
  const handleDownloadPDF = async () => {
    // Gather all required data for the report
    const locationDetails = `City: ${selectedCity}\nPlot Area: ${plotArea} sq ft`;
    // Floor layout: collect BHK config for each floor
    const floorSections = Array.from({ length: Number(floors) + 1 }, (_, floorIdx) => ({
      floor: floorIdx === 0 ? 'Ground Floor' : `${floorIdx}${floorIdx === 1 ? 'st' : floorIdx === 2 ? 'nd' : floorIdx === 3 ? 'rd' : 'th'} Floor`,
      bhkConfig: floorIdx === 0 ? bhkRows : (floorBHKConfigs[floorIdx] || defaultBHKs)
    }));
    // Floor components: use same logic as step 3's last grid
    const floorComponentsData = Array.from({ length: Number(floors) + 1 }, (_, floorIdx) => {
      // Use correct BHK config for each floor
      let rows;
      if (floorIdx === 0) {
        rows = bhkRows;
      } else if (floorBHKConfigs[floorIdx]) {
        rows = floorBHKConfigs[floorIdx];
      } else {
        rows = defaultBHKs;
      }
      function countRooms(roomsStr) {
        if (!roomsStr) return 0;
        const keywords = ['Bed', 'Living', 'Kitchen', 'Bath', 'Toilet'];
        return roomsStr.split(',').reduce((sum, part) => {
          return sum + (keywords.some(k => part.trim().toLowerCase().includes(k.toLowerCase())) ? 1 : 0);
        }, 0);
      }
      // Calculate per-floor area values
      const totalCarpetArea = rows.reduce((sum, row) => sum + (row.units * (parseInt(row.area) || 0)), 0);
      // Use per-floor SBA for calculations
      const sba = totalCarpetArea / (carpetPercent/100);
      if (floorIdx === 0) {
        // Ground Floor: only show Super Built-up Area
        return {
          floor: 'Ground Floor',
          components: [
            { name: 'Super Built-up Area', logic: 'Total plot area (width × depth)', area: sba }
          ]
        };
      }
      // Other floors: show full breakdown
      const totalWalls = rows.reduce((sum, row) => {
        const rooms = countRooms(row.rooms);
        return sum + (row.units * rooms * 2);
      }, 0);
      const wallLength = 12; // ft
      const wallHeight = 10; // ft
      const internalWallArea = rows.reduce((sum, row) => {
        const rooms = countRooms(row.rooms);
        return sum + (row.units * rooms * 2 * wallLength * wallHeight);
      }, 0);
      return {
        floor: `${floorIdx}${floorIdx === 1 ? 'st' : floorIdx === 2 ? 'nd' : floorIdx === 3 ? 'rd' : 'th'} Floor`,
        components: [
          { name: `Internal Walls (${totalWalls} walls)`, logic: `Sum over BHK rows: units × (number of rooms in 'Typical Rooms') × 2. Room types counted: Bed, Living, Kitchen, Bath, Toilet.`, area: internalWallArea },
          { name: 'External Walls', logic: '7% of Carpet Area', area: totalCarpetArea * 0.07 },
          { name: 'Slab Area', logic: 'Same as Super Built-up Area', area: sba },
          { name: 'Ceiling Plaster', logic: 'Same as Super Built-up Area', area: sba },
          { name: 'Beams & Columns', logic: '5% of Super Built-up Area', area: sba * 0.05 },
          { name: 'Staircase Area', logic: '2% of Super Built-up Area', area: sba * 0.02 },
          { name: 'Lift Shaft Area', logic: 'If lift required, 1.5% of Super Built-up Area', area: lift ? (sba * 0.015) : 0 },
          { name: 'Balcony Area', logic: '5% of Carpet Area', area: totalCarpetArea * 0.05 },
          { name: 'Utility Area', logic: '3% of Carpet Area', area: totalCarpetArea * 0.03 },
          { name: 'Toilet/Bath Area', logic: '8% of Carpet Area', area: totalCarpetArea * 0.08 },
          { name: 'Common Corridor', logic: '4% of Super Built-up Area', area: sba * 0.04 },
          { name: 'Parking Area (Ground)', logic: '15% of Ground Floor SBA', area: 0 },
          { name: 'Foundation Area', logic: '12% of Super Built-up Area', area: sba * 0.12 },
          { name: 'Parapet Walls', logic: '2% of Super Built-up Area', area: sba * 0.02 }
        ]
      };
    });
    const floorLayout = JSON.stringify(floorSections, null, 2);
    const floorComponents = JSON.stringify(floorComponentsData, null, 2);
    const materialDetails = JSON.stringify(sampleCostData, null, 2);
    await generatePDFReport({ locationDetails, rectangleRef, floorLayout, floorComponents, materialDetails });
  };
  const handleDownloadExcel = () => {
    let csv = 'Category,Item,Qty,Unit,Rate,Amount\n';
    sampleCostData.forEach(cat => {
      cat.details.forEach(item => {
        csv += `${cat.category},${item.name},${item.qty},${item.unit},${item.rate[costLevel]},${item.qty * item.rate[costLevel]}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ConstructionReport.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handler to open modal
  async function handleOpenBHKModal(floorIdx, idx) {
    setBhkModalFloorIdx(floorIdx);
    setBhkModalIdx(idx);
    
    // Get selected BHK type and area
    const rows = getFloorRows(floorIdx);
    const bhkType = rows[idx]?.type;
    const bhkArea = rows[idx]?.area;
    
    // Don't open modal if no BHK type or area is selected
    if (!bhkType || !bhkArea || bhkType === '' || bhkArea === '') {
      alert('Please select BHK Type and Carpet Area before opening details.');
      return;
    }
    
    try {
      // Use cached allBhkConfigs data if available, otherwise load from JSON
      let configs;
      if (allBhkConfigs.length > 0) {
        console.log('Using cached BHK configs, length:', allBhkConfigs.length);
        configs = allBhkConfigs;
      } else {
        console.log('No cached configs, loading from JSON...');
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
      
      if (matchedConfig) {
        // Group rooms by type and create numbered columns
        const roomTypeMap = new Map();
        matchedConfig.rooms.forEach(room => {
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
            roomMapping.set(baseType, rooms[0]);
          } else {
            rooms.forEach((room, index) => {
              const displayName = `${baseType} ${index + 1}`;
              dynamicColumns.push(displayName);
              roomMapping.set(displayName, room);
            });
          }
        });
        // Add circulation space as the last column
        const columnsWithCirculation = [...dynamicColumns, 'Circulation Space'];
        setDynamicRoomColumns(columnsWithCirculation);
        // Initialize room details with data from JSON
        const key = `${floorIdx}-${idx}`;
        const roomDetails = {
          'Count': {},
          'Length (ft)': {},
          'Width (ft)': {}
        };
        // Populate room data using the mapping
        roomMapping.forEach((roomData, displayName) => {
          // Set count to bathroom_count for bathroom rooms, otherwise 1
          if (displayName.toLowerCase().includes('bathroom')) {
            roomDetails['Count'][displayName] = matchedConfig.bathroom_count || 1;
          } else {
            roomDetails['Count'][displayName] = 1;
          }
          roomDetails['Length (ft)'][displayName] = roomData.dimensions_ft.length;
          roomDetails['Width (ft)'][displayName] = roomData.dimensions_ft.width;
        });
        // Add circulation space data
        roomDetails['Count']['Circulation Space'] = 1;
        roomDetails['Length (ft)']['Circulation Space'] = Math.round(Math.sqrt(matchedConfig.circulation_space_sqft));
        roomDetails['Width (ft)']['Circulation Space'] = Math.round(Math.sqrt(matchedConfig.circulation_space_sqft));
        setBhkRoomDetails(prev => ({
          ...prev,
          [key]: roomDetails
        }));
        setTimeout(() => {
          setShowBHKModal(true);
        }, 0);
      } else {
        // Fallback to static columns if no match found
        setDynamicRoomColumns([...roomColumns, 'Circulation Space']);
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
      const updated = { ...details };
      if (!updated[row]) updated[row] = {};
      updated[row][col] = value;
      return { ...prev, [key]: updated };
    });
  }

  // Handler for OK button in modal
  function handleOkBHKModal() {
    // Calculate sum of Total Area (sq ft) from modal
    const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
    let totalAreaSum = 0;
    if (bhkRoomDetails[key]) {
      dynamicRoomColumns.forEach(col => {
        const count = Number(bhkRoomDetails[key]['Count']?.[col] || 0);
        const length = Number(bhkRoomDetails[key]['Length (ft)']?.[col] || 0);
        const width = Number(bhkRoomDetails[key]['Width (ft)']?.[col] || 0);
        totalAreaSum += count * length * width;
      });
    }
    // Update Carpet Area (Sq ft) in main grid for the corresponding row
    if (bhkModalFloorIdx !== null && bhkModalIdx !== null) {
      if (bhkModalFloorIdx === 0) {
        setBhkRows(prev => {
          const updated = [...prev];
          updated[bhkModalIdx] = { ...updated[bhkModalIdx], area: totalAreaSum };
          return updated;
        });
      } else {
        setFloorBHKConfigs(prev => {
          const rows = [...getFloorRows(bhkModalFloorIdx)];
          rows[bhkModalIdx] = { ...rows[bhkModalIdx], area: totalAreaSum };
          return { ...prev, [bhkModalFloorIdx]: rows };
        });
      }
    }
    handleCloseBHKModal();
  }

  // New state and handlers for Site Plan upload
  const [sitePlanUrl, setSitePlanUrl] = useState(process.env.PUBLIC_URL + '/Image/IMG_20251006_132101.jpg');
  const [showSitePlanModal, setShowSitePlanModal] = useState(false);
  // Only keep one definition of handleSitePlanUpload (already defined above)
  // Remove stray code block
  function handleSitePlanDoubleClick() {
    setShowSitePlanModal(true);
  }

  // Removed unused state: pollinationText
  // Removed unused state: pollinationLoading, pollinationError

  // Removed redundant nested block and commented function
// Removed unused variables: roomTypes, unitTypes

// Removed redundant nested block and unused function parseRoomData
  // ...existing code...
  // Move all rendering code inside the PricingCalculator function
  return (
    <div className="wizard-container calculator-container" style={{ maxWidth: '900px' }}>
      <h2 className="text-center text-primary mb-4" style={{ fontWeight: 700, letterSpacing: '1px' }}>Project Estimation Calculator</h2>
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
            {/* Styled heading for Area Details - moved to top */}
            <div style={{ width: '100%', margin: '0 auto 1rem auto', padding: '0.5rem 0 0.2rem 0', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
              <h5 style={{ fontWeight: 600, color: '#1976d2', margin: 0, fontSize: '1.18rem', letterSpacing: '0.5px' }}>Area Details</h5>
            </div>
            <Form>
              <Row className="mb-3">
                <Col md={4} sm={12}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '0.95rem' }}>Select City</Form.Label>
                    <Form.Select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                      <option value="">Select City</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} sm={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '0.95rem' }}>SBA Width (ft)</Form.Label>
                    <Form.Control type="number" value={width} onChange={e => setWidth(e.target.value)} min={1} />
                  </Form.Group>
                </Col>
                <Col md={2} sm={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '0.95rem' }}>SBA Length (ft)</Form.Label>
                    <Form.Control type="number" value={depth} onChange={e => setDepth(e.target.value)} min={1} />
                  </Form.Group>
                </Col>
                <Col md={2} sm={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '0.95rem' }}>Build-up Area (%)</Form.Label>
                    <Form.Control type="number" value={buildupPercent} min={1} max={100} onChange={e => setBuildupPercent(Number(e.target.value))} />
                  </Form.Group>
                </Col>
                <Col md={2} sm={6}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '0.95rem' }}>Carpet Area (%)</Form.Label>
                    <Form.Control type="number" value={carpetPercent} min={1} max={100} onChange={e => setCarpetPercent(Number(e.target.value))} />
                  </Form.Group>
                </Col>
              </Row>

              
              {/* ...existing code for Step 1 form controls, including Select City ... */}
              {rectangleVisualization}

              {/* Area Definitions Grid */}
              <div style={{
                width: '100%',
                maxWidth: '600px',
                margin: '2rem auto',
                background: '#fafafa',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #e0e0e0',
                padding: '12px 8px',
                fontSize: '.95rem',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, color: '#333', borderBottom: '1px solid #e0e0e0' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, color: '#333', borderBottom: '1px solid #e0e0e0' }}>Area (sq ft)</th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, color: '#333', borderBottom: '1px solid #e0e0e0' }}>Definition</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', color: '#616161' }}>Super Built-up</td>
                      <td style={{ padding: '8px', color: '#616161' }}>
                        {Number(width) && Number(depth) ? (Number(width) * Number(depth)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ padding: '8px', color: '#616161' }}>Total area including common spaces (lobby, stairs, etc.)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', color: '#1976d2' }}>Build-up Area</td>
                      <td style={{ padding: '8px', color: '#1976d2' }}>
                        {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (buildupPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ padding: '8px', color: '#1976d2' }}>Usable area including walls, balcony, etc.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', color: '#d81b60' }}>Carpet Area</td>
                      <td style={{ padding: '8px', color: '#d81b60' }}>
                        {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (carpetPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ padding: '8px', color: '#d81b60' }}>Actual area within walls (where carpet can be laid)</td>
                    </tr>
                  </tbody>
                </table>
              </div>



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
              <div className="row w-100" style={{ maxWidth: 600 }}>
                <div className="col-12 col-md-4 mb-3 mb-md-0">
                  <div style={{ background: '#e3f2fd', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(33,150,243,0.07)', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1976d2', fontSize: '0.85rem' }}>Super Built-up</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>
                      {Number(width) && Number(depth) ? (Number(width) * Number(depth)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4 mb-3 mb-md-0">
                  <div style={{ background: '#e8f5e9', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(76,175,80,0.07)', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#388e3c', fontSize: '0.85rem' }}>Build-up Area</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>
                      {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (buildupPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div style={{ background: '#fce4ec', borderRadius: 6, padding: '0.55rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(233,30,99,0.07)', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#d81b60', fontSize: '0.85rem' }}>Carpet Area</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>
                      {Number(width) && Number(depth) ? (Number(width) * Number(depth) * (carpetPercent/100)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

{/* File upload section */}
            {/* Site Plan Upload Section */}
<div className="d-flex justify-content-center align-items-center" style={{ marginBottom: '2rem', gap: '2rem' }}>
  <div style={{ maxWidth: 320 }}>
    <Form.Group controlId="sitePlanUpload">
      <Form.Label style={{ fontWeight: 600, color: '#1976d2' }}>Upload Site Plan</Form.Label>
      <Form.Control type="file" accept="image/*" onChange={handleSitePlanUpload} />
    </Form.Group>
  </div>
  <div style={{
    maxWidth: 320,
    minHeight: 90,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    background: '#fafafa',
    boxShadow: '0 2px 8px rgba(33,150,243,0.07)'
  }}>
    {sitePlanUrl ? (
        <img
          src={sitePlanUrl}
          alt="Site Plan"
          style={{
            width: 200,
            height: 120,
            objectFit: 'cover',
            borderRadius: 6,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(33,150,243,0.10)'
          }}
          onClick={handleSitePlanDoubleClick}
        />
    ) : (
      <span style={{ color: '#888', fontSize: '1rem' }}>No Site Plan Uploaded</span>
    )}
  </div>
  <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1.5rem' }}>
    <Button variant="secondary" style={{ height: '38px' }} >Process</Button>
  </div>
</div>

{/* Large Site Plan Modal */}
<Modal show={showSitePlanModal} onHide={() => setShowSitePlanModal(false)} centered size="lg">
  <Modal.Header closeButton style={{ background: '#e3f2fd', borderBottom: '1px solid #1976d2' }}>
    <Modal.Title style={{ fontWeight: 700, color: '#1976d2' }}>Site Plan</Modal.Title>
  </Modal.Header>
  <Modal.Body style={{ background: '#fafafa', textAlign: 'center' }}>
    {sitePlanUrl && (
      <img src={sitePlanUrl} alt="Site Plan Large" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, boxShadow: '0 2px 8px rgba(33,150,243,0.10)' }} />
    )}
  </Modal.Body>
</Modal>
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
                                          const config = allBhkConfigs.find(c => c.type === row.type && c.total_carpet_area_sqft === newArea);
                                          if (config) {
                                            const roomList = config.rooms.map(room => room.name).join(', ');
                                            handleFloorCellChange(floorIdx, idx, 'rooms', roomList);
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
                <div style={{ fontWeight: 600, color: '#d81b60', marginBottom: 6 }}>Internal Walls Calculation Breakdown:</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontWeight: 500, marginRight: 8 }}>Select Floor:</label>
                  <select value={selectedDebugFloor || 0} onChange={e => setSelectedDebugFloor(Number(e.target.value))} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid #ffe082' }}>
                    {[...Array(Number(floors) + 1).keys()].map(i => (
                      <option key={i} value={i}>{i === 0 ? 'Ground Floor' : i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`}</option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const bhkRowsForDebug = getFloorRows(selectedDebugFloor || 0);
                  function countRooms(roomsStr) {
                    if (!roomsStr) return 0;
                    const keywords = ['Bed', 'Living', 'Kitchen', 'Bath', 'Toilet'];
                    return roomsStr.split(',').reduce((sum, part) => {
                      return sum + (keywords.some(k => part.trim().toLowerCase().includes(k.toLowerCase())) ? 1 : 0);
                    }, 0);
                  }
                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.96rem', marginBottom: 0 }}>
                      <thead>
                        <tr style={{ background: '#fffde7' }}>
                          <th style={{ padding: '6px', border: '1px solid #ffe082' }}>BHK Type</th>
                          <th style={{ padding: '6px', border: '1px solid #ffe082' }}>Units</th>
                          <th style={{ padding: '6px', border: '1px solid #ffe082' }}>Rooms Counted</th>
                          <th style={{ padding: '6px', border: '1px solid #ffe082' }}>Walls (Units × Rooms × 2)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bhkRowsForDebug.map((row, idx) => {
                          const rooms = countRooms(row.rooms);
                          const walls = row.units * rooms * 2;
                          return (
                            <tr key={idx}>
                              <td style={{ padding: '6px', border: '1px solid #ffe082' }}>{row.type || '-'}</td>
                              <td style={{ padding: '6px', border: '1px solid #ffe082', textAlign: 'right' }}>{row.units}</td>
                              <td style={{ padding: '6px', border: '1px solid #ffe082', textAlign: 'right' }}>{rooms}</td>
                              <td style={{ padding: '6px', border: '1px solid #ffe082', textAlign: 'right', fontWeight: 600 }}>{walls}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            <div style={{ width: '100%', maxWidth: 900, margin: '0 auto 1.5rem auto', background: '#fafafa', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e0e0e0', padding: '18px 12px', fontSize: '.97rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.97rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Component</th>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Logic</th>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Area Per Floor (sq ft)</th>
                    <th style={{ padding: '8px', border: '1px solid #e0e0e0' }}>Total Area</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Internal Walls area based on BHK config and Typical Rooms for selected floor
                    const bhkRowsForDebug = getFloorRows(selectedDebugFloor || 0);
                    function countRooms(roomsStr) {
                      if (!roomsStr) return 0;
                      // Only count these room types
                      const keywords = ['Bed', 'Living', 'Kitchen', 'Bath', 'Toilet'];
                      return roomsStr.split(',').reduce((sum, part) => {
                        return sum + (keywords.some(k => part.trim().toLowerCase().includes(k.toLowerCase())) ? 1 : 0);
                      }, 0);
                    }
                    const totalWalls = bhkRowsForDebug.reduce((sum, row) => {
                      const rooms = countRooms(row.rooms);
                      // Each room typically has 2 internal walls
                      return sum + (row.units * rooms * 2);
                    }, 0);
                    const wallLength = 12; // ft
                    const wallHeight = 10; // ft
                    const internalWallArea = bhkRowsForDebug.reduce((sum, row) => {
                      const rooms = countRooms(row.rooms);
                      return sum + (row.units * rooms * 2 * wallLength * wallHeight);
                    }, 0);
                    return [
                      { name: `Internal Walls (${totalWalls} walls)`, logic: `Sum over BHK rows: units × (number of rooms in 'Typical Rooms') × 2. Room types counted: Bed, Living, Kitchen, Bath, Toilet.`, area: internalWallArea },
                      { name: 'External Walls', logic: '7% of Carpet Area', area: (width * depth * (carpetPercent/100) * 0.07) },
                      { name: 'Slab Area', logic: 'Same as Super Built-up Area', area: (width * depth) },
                      { name: 'Ceiling Plaster', logic: 'Same as Super Built-up Area', area: (width * depth) },
                      { name: 'Beams & Columns', logic: '5% of Super Built-up Area', area: (width * depth * 0.05) },
                      { name: 'Staircase Area', logic: '2% of Super Built-up Area', area: (width * depth * 0.02) },
                      { name: 'Lift Shaft Area', logic: 'If lift required, 1.5% of Super Built-up Area', area: lift ? (width * depth * 0.015) : 0 },
                      { name: 'Balcony Area', logic: '5% of Carpet Area', area: (width * depth * (carpetPercent/100) * 0.05) },
                      { name: 'Utility Area', logic: '3% of Carpet Area', area: (width * depth * (carpetPercent/100) * 0.03) },
                      { name: 'Toilet/Bath Area', logic: '8% of Carpet Area', area: (width * depth * (carpetPercent/100) * 0.08) },
                      { name: 'Common Corridor', logic: '4% of Super Built-up Area', area: (width * depth * 0.04) },
                      { name: 'Parking Area (Ground)', logic: '15% of Ground Floor SBA', area: (width * depth * 0.15) },
                      { name: 'Foundation Area', logic: '12% of Super Built-up Area', area: (width * depth * 0.12) },
                      { name: 'Parapet Walls', logic: '2% of Super Built-up Area', area: (width * depth * 0.02) }
                    ];
                  })().map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>{item.name}</td>
                      <td style={{ padding: '8px', border: '1px solid #e0e0e0' }}>{item.logic}</td>
                      <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'right' }}>{item.area ? item.area.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'right' }}>{item.area ? (item.area * floors).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <div style={{ width: '100%', margin: '0 auto 1rem auto', padding: '0.5rem 0 0.2rem 0', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
              <h5 style={{ fontWeight: 600, color: '#1976d2', margin: 0, fontSize: '1.18rem', letterSpacing: '0.5px' }}>Estimation Details</h5>
            </div>
            <div className="cost-level-selector mb-2 d-flex align-items-end justify-content-end" style={{ marginTop: '0.5rem' }}>
              <Button variant="outline-success" onClick={handleDownloadExcel} title="Download to Excel" className="me-2">
                <FaFileExcel size={20} style={{ verticalAlign: 'middle' }} />
              </Button>
              <Button variant="outline-danger" onClick={handleDownloadPDF} title="Download PDF Report">
                <FaFilePdf size={20} style={{ verticalAlign: 'middle' }} />
              </Button>
            </div>
            {sampleCostData.map(cat => {
              // Per-category cost level state
              const [catLevel, setCatLevel] = [cat._level || costLevel, (level) => { cat._level = level; setCostLevel(level); }];
              const isOpen = openCategory.includes(cat.category);
              const total = cat.details.reduce((sum, item) => sum + item.qty * item.rate[catLevel], 0);
              return (
                <div key={cat.category} className="cost-category mb-4">
                  <div
                    className="cost-category-header d-flex align-items-center justify-content-between"
                    style={{ cursor: 'pointer', background: '#f7f7f7', borderRadius: '8px', padding: '0.7rem 1.2rem', boxShadow: '0 1px 4px rgba(33,150,243,0.07)' }}
                    onClick={() => toggleCategory(cat.category)}
                  >
                    <div className="d-flex flex-column flex-md-row align-items-md-center w-100">
                      <div className="d-flex align-items-center mb-2 mb-md-0" style={{ minWidth: '170px', maxWidth: '240px' }}>
                        <span style={{ marginRight: '1rem', fontSize: '1.2rem', color: '#1976d2' }}>
                          {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                        <h5 style={{ margin: 0 }}>{cat.category}</h5>
                      </div>
                      <div className="d-flex flex-column flex-md-row ms-md-4">
                        {costLevels.map(level => (
                          <div className="form-check mb-2 mb-md-0 me-md-3" key={level.key}>
                            <input type="radio" className="form-check-input" name={`level-${cat.category}`} checked={catLevel === level.key} onChange={() => setCatLevel(level.key)} />
                            <label className="form-check-label ms-2">{level.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#1976d2', fontSize: '1.15rem' }}>
                      ₹{total.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="cost-category-details" style={{ marginTop: '0.7rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(33,150,243,0.08)', padding: '0.7rem 1.2rem' }}>
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Rate</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.details.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.name}</td>
                              <td>{item.qty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                              <td>{item.unit}</td>
                              <td>₹{item.rate[catLevel].toLocaleString('en-IN')}</td>
                              <td style={{ color: '#388e3c', fontWeight: 600 }}>
                                ₹{(item.qty * item.rate[catLevel]).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="total-estimated-cost" style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1976d2', margin: '1.2rem 0 1rem 0', textAlign: 'right' }}>
              Total Estimated Cost: ₹{
                sampleCostData.reduce((sum, cat) => sum + cat.details.reduce((catSum, item) => catSum + item.qty * item.rate[costLevel], 0), 0).toLocaleString('en-IN')
              }
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <Button variant="primary" size="lg">Submit</Button>
            </div>
          </>
        )}
      </div>
      {/* Navigation Buttons */}
      <div className="wizard-nav-btns mt-4">
        <Button disabled={step === 1} onClick={() => setStep(step-1)} className="me-2">Back</Button>
        <Button disabled={step === 4} onClick={() => setStep(step+1)}>Next</Button>
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
                            return bhkRoomDetails[key]?.[rowLabel]?.[col] || '';
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
                          readOnly={col === 'Circulation Space'}
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
                          const count = Number(bhkRoomDetails[key]?.['Count']?.[col] || 0);
                          const length = Number(bhkRoomDetails[key]?.['Length (ft)']?.[col] || 0);
                          const width = Number(bhkRoomDetails[key]?.['Width (ft)']?.[col] || 0);
                          totalSum += count * length * width;
                        });
                        return totalSum.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                      })()} sq ft)
                    </div>
                  </td>
                  {dynamicRoomColumns.map(col => {
                    const key = `${bhkModalFloorIdx}-${bhkModalIdx}`;
                    const count = Number(bhkRoomDetails[key]?.['Count']?.[col] || 0);
                    const length = Number(bhkRoomDetails[key]?.['Length (ft)']?.[col] || 0);
                    const width = Number(bhkRoomDetails[key]?.['Width (ft)']?.[col] || 0);
                    const total = count * length * width;
                    return (
                      <td key={col} style={{ padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 700, color: '#388e3c', background: '#e8f5e9', fontSize: '0.8rem' }}>
                        {total > 0 ? total.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Button variant="primary" size="lg" style={{ minWidth: 120, fontWeight: 600, letterSpacing: '0.5px' }} onClick={handleOkBHKModal}>OK</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Large Site Plan Modal */}
      <Modal show={showSitePlanModal} onHide={() => setShowSitePlanModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ background: '#e3f2fd', borderBottom: '1px solid #1976d2' }}>
          <Modal.Title style={{ fontWeight: 700, color: '#1976d2' }}>Site Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#fafafa', textAlign: 'center' }}>
          {sitePlanUrl && (
            <img src={sitePlanUrl} alt="Site Plan Large" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, boxShadow: '0 2px 8px rgba(33,150,243,0.10)' }} />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default PricingCalculator;
