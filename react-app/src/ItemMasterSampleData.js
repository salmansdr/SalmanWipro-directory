// Sample test data for ItemMaster with Core Materials
// This can be imported and used to populate localStorage for testing

const sampleItemMasterData = [
  {
    id: 1,
    material: "Cement (OPC 53 Grade)",
    category: "Core Materials",
    unit: "kg",
    unit_size_kg: 50,
    description: "High-grade cement for structural work",
    location: "Mumbai, India",
    default_brand: "UltraTech",
    brands: [
      { brand_name: "UltraTech", rate_per_unit: 12.50 },
      { brand_name: "ACC", rate_per_unit: 12.25 },
      { brand_name: "Ambuja", rate_per_unit: 12.00 }
    ],
    quantity_formula: "",
    wastage_percent: 5,
    isActive: true,
    materialCalculation: {
      enabled: true,
      calculation_unit: "bags",
      floor_component_mt_values: {
        "Foundation": {
          "RCC-Slab-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Slab", type: "Site-mixed (stone chips)", grade: "M30" },
          "RCC-Wall-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Wall (retaining)", type: "Site-mixed (stone chips)", grade: "M30" },
          "RCC-Beam-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Beam", type: "Site-mixed (stone chips)", grade: "M30" },
          "RCC-Column-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Column", type: "Site-mixed (stone chips)", grade: "M30" },
          "CeilingPlaster-Standard": { mt_value: "0.24", formula: "volume_cuft × 0.24", component: "CeilingPlaster", element: "Ceiling Finish", type: "Standard", grade: "Standard" }
        },
        "GroundFloor": {
          "RCC-Slab-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Slab", type: "Site-mixed (stone chips)", grade: "M30" },
          "RCC-Beam-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Beam", type: "Site-mixed (stone chips)", grade: "M30" },
          "RCC-Column-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Column", type: "Site-mixed (stone chips)", grade: "M30" },
          "Wall-LoadBearing-Brick": { mt_value: "0.012", formula: "volume_cuft × 0.012", component: "Wall", element: "Load Bearing", type: "Brick", grade: "Standard" },
          "Wall-Partition-Brick": { mt_value: "0.012", formula: "volume_cuft × 0.012", component: "Wall", element: "Partition", type: "Brick", grade: "Standard" },
          "CeilingPlaster-Standard": { mt_value: "0.24", formula: "volume_cuft × 0.24", component: "Ceiling Plaster", element: "Ceiling Finish", type: "Standard", grade: "Standard" }
        },
        "Other Floor": {
          "RCC-Slab-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Slab", type: "Site-mixed (stone chips)", grade: "M30" },
          "RCC-Beam-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Beam", type: "Site-mixed (stone chips)", grade: "M30" },
          "RCC-Column-Site-mixed-M30": { mt_value: "0.2408", formula: "volume_cuft × 0.2408", component: "RCC", element: "Column", type: "Site-mixed (stone chips)", grade: "M30" },
          "Wall-LoadBearing-Brick": { mt_value: "0.012", formula: "volume_cuft × 0.012", component: "Wall", element: "Load Bearing", type: "Brick", grade: "Standard" },
          "Wall-Partition-Brick": { mt_value: "0.012", formula: "volume_cuft × 0.012", component: "Wall", element: "Partition", type: "Brick", grade: "Standard" },
          "CeilingPlaster-Standard": { mt_value: "0.24", formula: "volume_cuft × 0.24", component: "Ceiling Plaster", element: "Ceiling Finish", type: "Standard", grade: "Standard" }
        }
      },
      active_combinations: [
        "Foundation-RCC-Slab-Site-mixed-M30",
        "Foundation-RCC-Beam-Site-mixed-M30", 
        "Foundation-RCC-Column-Site-mixed-M30",
        "GroundFloor-RCC-Slab-Site-mixed-M30"
      ]
    },
    finishingCalculation: {
      enabled: false,
      quantity_formula: '',
      coverage_per_box_sqft: '',
      applicable_areas: [],
      count_dependencies: []
    },
    createdDate: "2024-12-29T10:00:00.000Z",
    createdBy: "System"
  },
  {
    id: 2,
    material: "Steel TMT Bars",
    category: "Core Materials", 
    unit: "kg",
    unit_size_kg: null,
    description: "Fe500D TMT bars for reinforcement",
    location: "Mumbai, India",
    default_brand: "TATA",
    brands: [
      { brand_name: "TATA", rate_per_unit: 75.50 },
      { brand_name: "JSW", rate_per_unit: 74.25 }
    ],
    quantity_formula: "",
    wastage_percent: 8,
    isActive: true,
    materialCalculation: {
      enabled: true,
      calculation_unit: "kg",
      floor_component_mt_values: {
        "Foundation": {
          "RCC": { mt_value: "0.50", formula: "volume_cuft × 0.50" },
          "CeilingPlaster": { mt_value: "", formula: "" }
        },
        "GroundFloor": {
          "RCC": { mt_value: "0.50", formula: "volume_cuft × 0.50" },
          "Wall": { mt_value: "", formula: "" },
          "Ceiling Plaster": { mt_value: "", formula: "" }
        },
        "Other Floor": {
          "RCC": { mt_value: "0.50", formula: "volume_cuft × 0.50" },
          "Wall": { mt_value: "", formula: "" },
          "Ceiling Plaster": { mt_value: "", formula: "" }
        }
      },
      active_combinations: ["Foundation-RCC", "GroundFloor-RCC", "Other Floor-RCC"]
    },
    finishingCalculation: {
      enabled: false,
      quantity_formula: '',
      coverage_per_box_sqft: '',
      applicable_areas: [],
      count_dependencies: []
    },
    createdDate: "2024-12-29T10:05:00.000Z",
    createdBy: "System"
  },
  {
    id: 3,
    material: "Vitrified Floor Tiles",
    category: "Flooring",
    unit: "box",
    unit_size_kg: null,
    description: "600x600mm premium vitrified tiles",
    location: "Mumbai, India",
    default_brand: "Kajaria",
    brands: [
      { brand_name: "Kajaria", rate_per_unit: 850 },
      { brand_name: "Somany", rate_per_unit: 820 }
    ],
    quantity_formula: "",
    wastage_percent: 10,
    isActive: true,
    materialCalculation: {
      enabled: false,
      mt_value: '',
      formula: '',
      calculation_unit: '',
      floor_components: {
        "Foundation": [],
        "GroundFloor": [],
        "Other Floor": []
      }
    },
    finishingCalculation: {
      enabled: true,
      quantity_formula: "built_up_area_sqft / 10.76",
      coverage_per_box_sqft: 10.76,
      applicable_areas: ["built_up_area_sqft", "floor_area_sqft"],
      count_dependencies: []
    },
    createdDate: "2024-12-29T10:10:00.000Z",
    createdBy: "System"
  },
  {
    id: 4,
    material: "LED Panel Light 36W",
    category: "Electrical",
    unit: "nos",
    unit_size_kg: null,
    description: "Square LED panel light for false ceiling",
    location: "Mumbai, India",
    default_brand: "Philips",
    brands: [
      { brand_name: "Philips", rate_per_unit: 1250 },
      { brand_name: "Bajaj", rate_per_unit: 980 }
    ],
    quantity_formula: "",
    wastage_percent: 2,
    isActive: true,
    materialCalculation: {
      enabled: false,
      mt_value: '',
      formula: '',
      calculation_unit: '',
      floor_components: {
        "Foundation": [],
        "GroundFloor": [],
        "Other Floor": []
      }
    },
    finishingCalculation: {
      enabled: true,
      quantity_formula: "total_rooms × 2",
      coverage_per_box_sqft: null,
      applicable_areas: [],
      count_dependencies: ["total_rooms", "bedroom_count", "living_room_count"]
    },
    createdDate: "2024-12-29T10:15:00.000Z",
    createdBy: "System"
  },
  {
    id: 5,
    material: "Wall Paint Premium",
    category: "Painting",
    unit: "litre",
    unit_size_kg: null,
    description: "Premium emulsion paint for interior walls",
    location: "Mumbai, India",
    default_brand: "Asian Paints",
    brands: [
      { brand_name: "Asian Paints", rate_per_unit: 450 },
      { brand_name: "Berger", rate_per_unit: 430 }
    ],
    quantity_formula: "",
    wastage_percent: 5,
    isActive: true,
    materialCalculation: {
      enabled: false,
      mt_value: '',
      formula: '',
      calculation_unit: '',
      floor_components: {
        "Foundation": [],
        "GroundFloor": [],
        "Other Floor": []
      }
    },
    finishingCalculation: {
      enabled: true,
      quantity_formula: "wall_area_sqft / 120",
      coverage_per_box_sqft: 120,
      applicable_areas: ["wall_area_sqft", "internal_wall_area_sqft"],
      count_dependencies: []
    },
    createdDate: "2024-12-29T10:20:00.000Z",
    createdBy: "System"
  }
];

// Function to load sample data into localStorage
const loadSampleData = () => {
  localStorage.setItem('itemMaster', JSON.stringify(sampleItemMasterData));
  console.log('Sample ItemMaster data loaded into localStorage');
  console.log('Sample material calculation structure:', sampleItemMasterData[0].materialCalculation);
  console.log('Sample steel material calculation structure:', sampleItemMasterData[1].materialCalculation);
};

// Function to clear data
const clearData = () => {
  localStorage.removeItem('itemMaster');
  console.log('ItemMaster data cleared from localStorage');
};

export { 
  sampleItemMasterData,
  loadSampleData,
  clearData
};