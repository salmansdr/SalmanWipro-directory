// Test ItemMaster Calculation Integration
// This file demonstrates the enhanced ItemMaster component with automatic calculation panel selection

import React from 'react';

// Helper function to determine which calculation should be enabled based on category
const getCalculationTypeForCategory = (category) => {
  if (category === 'Core Materials') {
    return {
      materialCalculation: true,
      finishingCalculation: false,
      reason: 'Core Materials use volume-based calculations (cement, steel, sand for RCC work)'
    };
  } else if (category && category !== 'Core Materials') {
    return {
      materialCalculation: false,
      finishingCalculation: true,
      reason: 'Non-Core Materials use area/count-based calculations (tiles, paint, electrical, etc.)'
    };
  } else {
    return {
      materialCalculation: false,
      finishingCalculation: false,
      reason: 'No category selected'
    };
  }
};

// Test data structure for Core Materials (auto-enables Material Calculation)
const testCoreItem = {
  id: 1,
  material: "Cement (OPC 53 Grade)",
  category: "Core Materials", // Triggers Material Calculation auto-enable
  unit: "kg",
  description: "High-grade cement for structural work",
  location: "Mumbai, India",
  default_brand: "UltraTech",
  brands: [
    { brand_name: "UltraTech", rate_per_unit: 12.50 },
    { brand_name: "ACC", rate_per_unit: 12.25 }
  ],
  
  // Material calculation (auto-enabled for Core Materials)
  materialCalculation: {
    enabled: true, // Auto-enabled
    mt_value: 0.42,
    formula: "volume_cuft × 0.42",
    calculation_unit: "kg",
    applicable_components: ["RCC Footing", "RCC Column", "RCC Beam", "RCC Slab"]
  },
  
  // Finishing calculation (auto-disabled for Core Materials)
  finishingCalculation: {
    enabled: false, // Auto-disabled
    quantity_formula: '',
    coverage_per_box_sqft: '',
    applicable_areas: [],
    count_dependencies: []
  },
  
  wastage_percent: 5,
  isActive: true
};

// Test data structure for Flooring (auto-enables Finishing Calculation)
const testFlooringItem = {
  id: 2,
  material: "Vitrified Floor Tiles",
  category: "Flooring", // Triggers Finishing Calculation auto-enable
  unit: "box",
  description: "600x600mm premium vitrified tiles",
  location: "Mumbai, India", 
  default_brand: "Kajaria",
  brands: [
    { brand_name: "Kajaria", rate_per_unit: 850 },
    { brand_name: "Somany", rate_per_unit: 820 }
  ],
  
  // Material calculation (auto-disabled for non-Core Materials)
  materialCalculation: {
    enabled: false, // Auto-disabled
    mt_value: '',
    formula: '',
    calculation_unit: '',
    applicable_components: []
  },
  
  // Finishing calculation (auto-enabled for non-Core Materials)
  finishingCalculation: {
    enabled: true, // Auto-enabled
    quantity_formula: "built_up_area_sqft / 10.76",
    coverage_per_box_sqft: 10.76,
    applicable_areas: ["built_up_area_sqft", "floor_area_sqft"],
    count_dependencies: []
  },
  
  wastage_percent: 10,
  isActive: true
};

// Test data structure for Electrical (auto-enables Finishing Calculation)
const testElectricalItem = {
  id: 3,
  material: "LED Panel Light 36W",
  category: "Electrical", // Triggers Finishing Calculation auto-enable
  unit: "nos",
  description: "Square LED panel light for false ceiling",
  location: "Mumbai, India",
  default_brand: "Philips",
  brands: [
    { brand_name: "Philips", rate_per_unit: 1250 },
    { brand_name: "Bajaj", rate_per_unit: 980 }
  ],
  
  // Material calculation (auto-disabled for non-Core Materials)
  materialCalculation: {
    enabled: false, // Auto-disabled
    mt_value: '',
    formula: '',
    calculation_unit: '',
    applicable_components: []
  },
  
  // Finishing calculation (auto-enabled for non-Core Materials)
  finishingCalculation: {
    enabled: true, // Auto-enabled
    quantity_formula: "total_rooms × 2",
    coverage_per_box_sqft: null,
    applicable_areas: [],
    count_dependencies: ["total_rooms", "bedroom_count", "living_room_count"]
  },
  
  wastage_percent: 2,
  isActive: true
};

// Category to Calculation Type Mapping
const categoryCalculationMapping = {
  'Core Materials': {
    autoEnable: 'Material Calculation',
    description: 'Volume-based calculations for structural materials',
    examples: ['Cement', 'Steel', 'Sand', 'Aggregate', 'RCC work materials']
  },
  'Painting': {
    autoEnable: 'Finishing Calculation', 
    description: 'Area-based calculations for paint coverage',
    examples: ['Paint', 'Primer', 'Putty', 'Brushes', 'Rollers']
  },
  'Flooring': {
    autoEnable: 'Finishing Calculation',
    description: 'Area-based calculations for floor coverage', 
    examples: ['Tiles', 'Marble', 'Wood flooring', 'Carpet']
  },
  'Plumbing': {
    autoEnable: 'Finishing Calculation',
    description: 'Count/area-based calculations for plumbing fixtures',
    examples: ['Pipes', 'Fittings', 'Sanitaryware', 'Taps']
  },
  'Electrical': {
    autoEnable: 'Finishing Calculation',
    description: 'Count/room-based calculations for electrical items',
    examples: ['Switches', 'Lights', 'Cables', 'MCB']
  },
  'Doors & Windows': {
    autoEnable: 'Finishing Calculation',
    description: 'Count-based calculations for doors and windows',
    examples: ['Doors', 'Windows', 'Frames', 'Hardware']
  },
  'Finishing': {
    autoEnable: 'Finishing Calculation',
    description: 'Area/count-based calculations for finishing materials',
    examples: ['Molding', 'Trim', 'Accessories']
  },
  'Roofing': {
    autoEnable: 'Finishing Calculation',
    description: 'Area-based calculations for roofing materials',
    examples: ['Tiles', 'Sheets', 'Waterproofing', 'Insulation']
  },
  'Structural': {
    autoEnable: 'Finishing Calculation',
    description: 'Mixed calculations for structural elements',
    examples: ['Steel sections', 'Precast elements']
  },
  'Miscellaneous': {
    autoEnable: 'Finishing Calculation',
    description: 'Various calculations based on specific requirements',
    examples: ['Tools', 'Safety equipment', 'Temporary structures']
  }
};

console.log('Auto-Calculation Logic Test:', {
  coreItem: testCoreItem,
  flooringItem: testFlooringItem,
  electricalItem: testElectricalItem,
  categoryMapping: categoryCalculationMapping,
  helperFunction: getCalculationTypeForCategory
});

export { 
  testCoreItem,
  testFlooringItem,
  testElectricalItem,
  categoryCalculationMapping,
  getCalculationTypeForCategory
};