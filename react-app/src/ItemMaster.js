
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Form, Button, Row, Col, Alert, Table, Modal, Badge, InputGroup, Pagination } from 'react-bootstrap';

// Migration: Convert old formats to new component-grouped structure
function migrateMaterialCalculation(materialCalc) {
  if (!materialCalc) return { RCC: [], Ceiling: [], Wall: [] };
  
  // Already in new format (has RCC, Ceiling, Wall keys)
  if (materialCalc.RCC || materialCalc.Ceiling || materialCalc.Wall) {
    return {
      RCC: materialCalc.RCC || [],
      Ceiling: materialCalc.Ceiling || [],
      Wall: materialCalc.Wall || []
    };
  }
  
  // Old format with floor_component_mt_values array
  if (Array.isArray(materialCalc.floor_component_mt_values)) {
    const result = { RCC: [], Ceiling: [], Wall: [] };
    
    // Helper to map old row format to new simplified format
    const mapRow = (row) => ({
      element: row.element,
      grade: row.grade || '',
      mt_value_per_cuft: row.mt_value_per_cuft || '',
      specification: row.specification || ''
    });
    
    materialCalc.floor_component_mt_values.forEach(row => {
      const component = row.component;
      if (component === 'RCC') {
        result.RCC.push(mapRow(row));
      } else if (component === 'CeilingPlaster' || component === 'Ceiling Plaster' || component === 'Ceiling') {
        result.Ceiling.push(mapRow(row));
      } else if (component === 'Internal Walls' || component === 'External Walls' || component === 'Wall') {
        result.Wall.push(mapRow(row));
      }
    });
    return result;
  }
  
  // Very old format with nested floor structure
  if (materialCalc.floor_component_mt_values && typeof materialCalc.floor_component_mt_values === 'object') {
    const result = { RCC: [], Ceiling: [], Wall: [] };
    Object.entries(materialCalc.floor_component_mt_values).forEach(([floor, details]) => {
      Object.entries(details).forEach(([key, value]) => {
        const component = value.component;
        if (component === 'RCC') {
          result.RCC.push({
            floor,
            element: value.element,
            specification: value.specification || '',
            mt_value_m20: value.mt_value_m20 || '',
            mt_value_m25: value.mt_value_m25 || '',
            mt_value_m30: value.mt_value_m30 || '',
            formula: value.formula || ''
          });
        } else if (component === 'CeilingPlaster' || component === 'Ceiling Plaster' || component === 'Ceiling') {
          result.Ceiling.push({
            floor,
            element: value.element,
            specification: value.specification || '',
            mt_value_m20: value.mt_value_m20 || '',
            mt_value_m25: value.mt_value_m25 || '',
            mt_value_m30: value.mt_value_m30 || '',
            formula: value.formula || ''
          });
        } else if (component === 'Internal Walls' || component === 'External Walls' || component === 'Wall') {
          result.Wall.push({
            floor,
            element: value.element,
            specification: value.specification || '',
            mt_value_m20: value.mt_value_m20 || '',
            mt_value_m25: value.mt_value_m25 || '',
            mt_value_m30: value.mt_value_m30 || '',
            formula: value.formula || ''
          });
        }
      });
    });
    return result;
  }
  
  return { RCC: [], Ceiling: [], Wall: [] };
}

/**
 * ItemMaster Component - Enhanced Construction Material Management
 * 
 * Features:
 * 1. Dynamic Calculation Panel Selection:
 *    - Core Materials (Cement, Steel, etc.) → Material Calculation Panel
 *    - Other Categories (Tiles, Paint, etc.) → Finishing Calculation Panel
 * 
 * 2. Detailed RCC Specification Management:
 *    - Floor-wise component structure (Foundation, Ground Floor, Upper Floors)
 *    - Element types: Slab, Wall, Beam, Column, Load Bearing, Partition
 *    - Construction types: Site-mixed, Precast, Brick, etc.
 *    - Material grades: M30, M25, Standard
 * 
 * 3. Interactive UI Features:
 *    - Editable specification dropdowns for Element/Type/Grade selection
 *    - Add/Delete component combinations dynamically
 *    - Active/Inactive toggle for each specification
 *    - Real-time validation and data management
 * 
 * 4. Data Integration:
 *    - Integrated with MaterialCalculation.json structure
 *    - Floor-wise component MT values with formulas
 *    - MongoDB document generation with detailed specifications
 * 
 * 5. Brand Management:
 *    - Multiple brands per material with rate ranges
 *    - Quick brand suggestions based on material type
 *    - Default brand selection and validation
 */


const ItemMaster = () => {
  // ...existing useState declarations...


// ...existing code...

  // ...existing code...

  // ...existing useState declarations...

  // ...existing code...

  // ...existing useState declarations...

  // Form state
  // ...existing code...

  
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter states
  const [materialFilter, setMaterialFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subCategoryFilter, setSubCategoryFilter] = useState('All');
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [itemForm, setItemForm] = useState({
    id: null,
    material: '',
    category: '',
    categoryId: '',
    sub_category: '',
    unit: '',
    unit_size_kg: '',
    default_brand: '',
    defaultRate: 0,
    brands: [{ brand_name: '', rate_per_unit: '' }],
    quantity_formula: '',
    wastage_percent: 0,
    description: '',
    location: '',
    isActive: true,
    // Calculation subcomponents - grouped by component type
      materialCalculation: {
        RCC: [
          { element: 'Slab', grade: '', mt_value_per_cuft: '', specification: '' },
          { element: 'Beam', grade: '', mt_value_per_cuft: '', specification: '' },
          { element: 'Column', grade: '', mt_value_per_cuft: '', specification: '' }
        ],
        Ceiling: [],
        Wall: []
      },
      finishingCalculation: {
        enabled: false,
        quantity_formula: '',
        coverage_per_box_sqft: '',
        applicable_areas: [], // built_up_area, tile_area, perimeter etc
        count_dependencies: [] // toilet_count, kitchen_count, floor_count etc
      }
    });
  // Validation states
  const [duplicateError, setDuplicateError] = useState('');
  const [materialValidated, setMaterialValidated] = useState(false);

  // Location dropdown options (India and Bangladesh cities)
  const locations = [
    // India
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata',
    'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal',
    'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad',
    // Bangladesh
    'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur',
    'Comilla', 'Narayanganj', 'Gazipur'
  ].sort();

  // Get subcategories for selected category from categories state
  const currentSubCategories = useMemo(() => {
    if (!itemForm.category) return [];
    const selectedCategory = categories.find(cat => cat.categoryName === itemForm.category);
    console.log('currentSubCategories - Selected Category:', {
      categoryName: itemForm.category,
      selectedCategory,
      hasSubCategories: !!selectedCategory?.subCategories,
      subCategoriesLength: selectedCategory?.subCategories?.length
    });
    // Check if subCategories exists AND is an array (not null)
    if (selectedCategory && Array.isArray(selectedCategory.subCategories) && selectedCategory.subCategories.length > 0) {
      return selectedCategory.subCategories
        .filter(sub => sub.isActive)
        .map(sub => sub.subCategoryName);
    }
    return [];
  }, [categories, itemForm.category]);

  // User's selected location (set once)
  const [userLocation, setUserLocation] = useState('');

  // Load units from API
  const loadUnits = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const endpoint = `${apiUrl}/api/MaterialItems/units`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Units loaded from API:', data);
      
      // Handle different response formats and extract unit strings
      let unitsArray = Array.isArray(data) ? data : (data.units || []);
      
      // If units are objects with 'unit' property, extract the unit strings
      if (unitsArray.length > 0 && typeof unitsArray[0] === 'object' && unitsArray[0].unit) {
        unitsArray = unitsArray.map(item => item.unit);
      }
      
      setUnits(unitsArray);
      
    } catch (error) {
      console.error('Error loading units from API:', error);
      showAlertMessage('Error loading units: ' + error.message, 'warning');
      // Fallback to default units if API fails
      setUnits([
        'bag', 'cft', 'kg', 'pcs', 'litre', 'box', 'ft', 'sqft', 'meter', 'sq meter',
        'running meter', 'nos', 'set', 'roll', 'sheet', 'cum'
      ]);
    }
  };

  // Load categories from API
  const loadCategories = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const endpoint = `${apiUrl}/api/MaterialCategory`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Categories loaded from API:', data);
      
      // Ensure we have an array
      const categoriesArray = Array.isArray(data) ? data : (data.data || []);
      console.log('Categories array after processing:', categoriesArray);
      console.log('Sample category structure:', categoriesArray[0]);
      setCategories(categoriesArray);
      
    } catch (error) {
      console.error('Error loading categories from API:', error);
      showAlertMessage('Error loading categories: ' + error.message, 'warning');
      setCategories([]);
    }
  };

  const loadUserLocation = async () => {
    // Always load default location from MaterialRate.json as the source of truth
    let defaultLocation = 'Kolkata'; // fallback
    try {
      const response = await fetch('/MaterialRate.json');
      const data = await response.json();
      defaultLocation = data.location || 'Kolkata';
    } catch (error) {
      console.warn('Could not load default location from MaterialRate.json:', error);
    }

    // Always use the location from MaterialRate.json 
    // (This ensures consistency with the data source)
    setUserLocation(defaultLocation);
    setItemForm(prev => ({ ...prev, location: defaultLocation }));
    
    // Update localStorage to match MaterialRate.json
    localStorage.setItem('userLocation', defaultLocation);
    
  };

  const loadItems = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // First try to load from API
      const apiItems = await getAllMaterialItemsFromAPI();
      
      // Ensure apiItems is an array before processing
      if (!Array.isArray(apiItems)) {
        console.warn('API did not return an array:', apiItems);
        throw new Error('API returned invalid data format');
      }
      
      
      // Convert API items to local format if needed
      const processedItems = apiItems.map(item => {
        // Handle MongoDB document structure - extract from itemData if it exists
        const actualItem = item.itemData || item;
        
        return {
          ...actualItem,
          // MongoDB fields
          _id: item._id,
          // Ensure local ID exists
          id: actualItem.id || item._id || Date.now() + Math.random(),
          // Ensure required fields exist with defaults
          brands: actualItem.brands || [],
          material: actualItem.material || '',
          category: actualItem.category || '',
          categoryName: actualItem.categoryName || actualItem.category || '',
          categoryId: actualItem.categoryId || '',
          subCategories: actualItem.subCategories || [],
          unit: actualItem.unit || '',
          location: actualItem.location || '',
          isActive: actualItem.isActive !== undefined ? actualItem.isActive : true,
          // Handle other potential fields
          default_brand: actualItem.default_brand || '',
          unit_size_kg: actualItem.unit_size_kg || '',
          quantity_formula: actualItem.quantity_formula || '',
          wastage_percent: actualItem.wastage_percent || 0,
          description: actualItem.description || '',
          materialCalculation: actualItem.materialCalculation || null,
        //  finishingCalculation: actualItem.finishingCalculation || null
        };
      });
      
      
      setItems(processedItems);
      
      // Save to localStorage as backup (without updating state again)
      saveToLocalStorage(processedItems);
      
      
    } catch (apiError) {
      console.warn('Failed to load from API, falling back to localStorage:', apiError.message);
      
      // Fallback to localStorage if API fails
      try {
        const savedItems = localStorage.getItem('itemMaster');
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);
          setItems(parsedItems);
        } else {
          setItems([]);
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError.message);
        showAlertMessage('Error loading items: ' + localError.message, 'danger');
        setItems([]);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Function to refresh data from API (for use after CRUD operations)
  const refreshItems = useCallback(async () => {
    await loadItems(false); // Don't show loading spinner for refreshes
  }, [loadItems]);

  const applyFilters = useCallback(() => {
    // Ensure items is an array before processing
    if (!Array.isArray(items)) {
      setFilteredItems([]);
      return;
    }
    
    let filtered = [...items];
    
    // Apply category filter
    if (categoryFilter && categoryFilter !== 'All') {
      filtered = filtered.filter(item => {
        const itemCategory = item.categoryName || item.category;
        return itemCategory && itemCategory === categoryFilter;
      });
    }
    
    // Apply sub-category filter
    if (subCategoryFilter && subCategoryFilter !== 'All') {
      filtered = filtered.filter(item => 
        item.sub_category && item.sub_category === subCategoryFilter
      );
    }
    
    // Apply material filter
    if (materialFilter) {
      filtered = filtered.filter(item => 
        item.material && item.material.toLowerCase().includes(materialFilter.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [items, materialFilter, categoryFilter, subCategoryFilter]);

  // Load data on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      await loadUnits();
      await loadCategories();
      await loadItems();
      await loadUserLocation();
    };
    initializeComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select sub-category if only one exists
  useEffect(() => {
    if (currentSubCategories.length === 1 && !itemForm.sub_category) {
      console.log('Auto-selecting single sub-category:', currentSubCategories[0]);
      setItemForm(prev => ({
        ...prev,
        sub_category: currentSubCategories[0]
      }));
    }
  }, [currentSubCategories, itemForm.sub_category]);

  // Filter items when filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  

  // Function to save to localStorage only (without updating state)
  const saveToLocalStorage = (items) => {
    try {
      localStorage.setItem('itemMaster', JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error.message);
    }
  };

  // API function to save item to MongoDB
  const saveItemToAPI = async (itemData, isUpdate = false, itemId = null) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      
      // For updates, append the ID to the endpoint
      // Use MongoDB _id if available, otherwise use local id
      const updateId = itemId || itemData._id || itemData.id;
      const endpoint = isUpdate && updateId 
        ? `${apiUrl}/api/materialitems/${updateId}`
        : `${apiUrl}/api/materialitems`;
      
      // Remove local ID fields from the data sent to API for updates
      // MongoDB will use the ID from the URL path
      const apiData = { ...itemData };
      if (isUpdate) {
        delete apiData.id; // Remove local id
        // Keep _id if it exists for MongoDB reference, but the API will use URL id
      }
      
      const requestOptions = {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      };

      console.log('saveItemToAPI - Complete JSON being sent to API:', {
        endpoint,
        method: requestOptions.method,
        fullPayload: JSON.parse(requestOptions.body)
      });

      const response = await fetch(endpoint, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('saveItemToAPI - API Response:', {
        success: true,
        result_sub_category: result.sub_category,
        result_categoryId: result.categoryId
      });
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // API function to delete item from MongoDB
  const deleteItemFromAPI = async (itemId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const endpoint = `${apiUrl}/api/materialitems/${itemId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('API Delete Error:', error);
      throw error;
    }
  };

  // API function to get all material items from MongoDB
  const getAllMaterialItemsFromAPI = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const endpoint = `${apiUrl}/api/materialitems`;
      
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure we return an array, handle different response structures
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.items)) {
        return data.items;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn('API returned unexpected format:', data);
        return []; // Return empty array if data structure is unexpected
      }
    } catch (error) {
      console.error('API Get All Materials Error:', error);
      throw error;
    }
  };

  // API function to get material item by ID from MongoDB
  const getMaterialItemByIdFromAPI = async (itemId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const endpoint = `${apiUrl}/api/materialitems/${itemId}`;
      
      console.log('Fetching item by ID:', itemId, 'from endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response for item:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('API Get Material By ID Error:', error);
      throw error;
    }
  };

  const showAlertMessage = (message, variant = 'success') => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Log sub_category changes
    if (name === 'sub_category') {
      console.log('handleInputChange - sub_category changed:', value);
    }
    
    // Handle default_brand change - automatically set defaultRate
    if (name === 'default_brand') {
      const selectedBrand = itemForm.brands.find(b => b.brand_name === value);
      const defaultRate = selectedBrand ? parseFloat(selectedBrand.rate_per_unit) || 0 : 0;
      
      setItemForm(prev => ({
        ...prev,
        default_brand: value,
        defaultRate: defaultRate
      }));
      return;
    }
    
    // Update form state - handle checkboxes vs text inputs
    setItemForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
   
    // Real-time duplicate validation for material name
    if (name === 'material') {
      validateMaterialDuplicate(value, itemForm.category, itemForm.location);
    }
    
    // Re-validate if category or location changes and material exists
    if ((name === 'category' || name === 'location') && itemForm.material) {
      const material = itemForm.material;
      const category = name === 'category' ? value : itemForm.category;
      const location = name === 'location' ? value : itemForm.location;
      validateMaterialDuplicate(material, category, location);
    }
  };

  


  const handleFinishingCalculationChange = (field, value) => {
    setItemForm(prev => ({
      ...prev,
      finishingCalculation: {
        ...prev.finishingCalculation,
        [field]: value
      }
    }));
  };

  

  
  // Handle active combination toggling with detailed keys
  const validateMaterialDuplicate = (material, category, location) => {
    if (!material.trim()) {
      setDuplicateError('');
      setMaterialValidated(false);
      return;
    }

    // Check for duplicate material in same location and category
    const existingItem = items.find(item => 
      item.material.toLowerCase().trim() === material.toLowerCase().trim() &&
      item.category === category &&
      item.location === location &&
      item.id !== itemForm.id // Exclude current item when editing
    );

    if (existingItem) {
      setDuplicateError(`Material "${material}" already exists in "${category}" category for "${location}" location.`);
      setMaterialValidated(false);
    } else {
      setDuplicateError('');
      setMaterialValidated(true);
    }
  };

  const handleBrandChange = (index, field, value) => {
    const updatedBrands = [...itemForm.brands];
    updatedBrands[index] = { ...updatedBrands[index], [field]: value };
    setItemForm(prev => ({ ...prev, brands: updatedBrands }));
  };

  const addBrand = () => {
    setItemForm(prev => ({
      ...prev,
      brands: [...prev.brands, { brand_name: '', rate_per_unit: '' }]
    }));
  };

  const addQuickBrand = (brandName, rate = '') => {
    setItemForm(prev => ({
      ...prev,
      brands: [...prev.brands, { brand_name: brandName, rate_per_unit: rate }]
    }));
  };

  // Quick brand suggestions based on material
  const getQuickBrandSuggestions = (material) => {
    const suggestions = {
      'cement': ['UltraTech', 'ACC', 'Dalmia', 'Ambuja', 'Shree'],
      'steel': ['TATA Tiscon', 'JSW Neosteel', 'SAIL', 'Kamdhenu', 'Vizag'],
      'sand': ['River Sand', 'M-Sand', 'Robo Sand', 'P Sand'],
      'tiles': ['Kajaria', 'Somany', 'Johnson', 'Nitco', 'RAK'],
      'paint': ['Asian Paints', 'Dulux', 'Berger', 'Nerolac', 'Indigo'],
      'pipes': ['Astral', 'Supreme', 'Finolex', 'Prince', 'Ashirvad']
    };
    
    const materialLower = material.toLowerCase();
    for (const key in suggestions) {
      if (materialLower.includes(key)) {
        return suggestions[key];
      }
    }
    return [];
  };

  const removeBrand = (index) => {
    if (itemForm.brands.length > 1) {
      const updatedBrands = itemForm.brands.filter((_, i) => i !== index);
      setItemForm(prev => ({ ...prev, brands: updatedBrands }));
    }
  };

  const openModal = async (item = null) => {
    if (item) {
      try {
        // Fetch the complete item details from API
        const mongoId = item._id || item.id;
        
        const fullItemData = await getMaterialItemByIdFromAPI(mongoId);
      //  console.log('Edit Item - Full API Response:', JSON.stringify(fullItemData, null, 2));
        
        // Handle MongoDB document structure - ensure _id is at root level
        const processedItemData = fullItemData.itemData ? {
          ...fullItemData.itemData,
          _id: fullItemData._id, // Ensure MongoDB _id is at root level
          id: fullItemData.itemData.id || fullItemData._id || item.id,
          subCategories: fullItemData.subCategories || fullItemData.itemData.subCategories || [] // Preserve subCategories
        } : {
          ...fullItemData,
          _id: fullItemData._id || mongoId // Ensure _id is preserved
        };
        
        // Update the items array with the subcategories for this category
        if (processedItemData.subCategories && processedItemData.subCategories.length > 0) {
          setItems(prevItems => 
            prevItems.map(i => 
              (i.categoryName || i.category) === (processedItemData.categoryName || processedItemData.category)
                ? { ...i, subCategories: processedItemData.subCategories }
                : i
            )
          );
        }
        
        setEditingItem(processedItemData);
        
        // Apply auto-setup logic based on category
        let materialCalc = migrateMaterialCalculation(processedItemData.materialCalculation);
        let finishingCalc = processedItemData.finishingCalculation || {
          enabled: false,
          quantity_formula: '',
          coverage_per_box_sqft: '',
          applicable_areas: [],
          count_dependencies: []
        };

        // Calculate defaultRate based on default_brand
        const brands = (processedItemData.brands && processedItemData.brands.length > 0) 
          ? [...processedItemData.brands] 
          : [{ brand_name: '', rate_per_unit: '' }];
        const defaultBrand = processedItemData.default_brand || '';
        const selectedBrand = brands.find(b => b.brand_name === defaultBrand);
        const defaultRate = selectedBrand ? parseFloat(selectedBrand.rate_per_unit) || 0 : 0;

        setItemForm({
          id: processedItemData.id || item.id, // Keep the local ID for consistency
          material: processedItemData.material || '',
          category: processedItemData.categoryName || processedItemData.category || '', // Map categoryName to category for form
          categoryId: processedItemData.categoryId || '',
          sub_category: processedItemData.sub_category || '',
          unit: processedItemData.unit || '',
          location: processedItemData.location || '',
          isActive: processedItemData.isActive !== undefined ? processedItemData.isActive : true,
          default_brand: defaultBrand,
          defaultRate: defaultRate,
          unit_size_kg: processedItemData.unit_size_kg || '',
          quantity_formula: processedItemData.quantity_formula || '',
          wastage_percent: processedItemData.wastage_percent || 0,
          description: processedItemData.description || '',
          brands: brands,
          materialCalculation: materialCalc,
          finishingCalculation: finishingCalc
        });
        
        // Clear validation states when editing
        setDuplicateError('');
        setMaterialValidated(true);
        
        
      } catch (error) {
        console.error('Error loading item for editing:', error);
        showAlertMessage('Error loading item details: ' + error.message, 'danger');
        
        // Fallback to using the local item data
        setEditingItem(item);

        // Migrate material calculation
        let materialCalc = migrateMaterialCalculation(item.materialCalculation);
        
        let finishingCalc = item.finishingCalculation || {
          enabled: false,
          quantity_formula: '',
          coverage_per_box_sqft: '',
          applicable_areas: [],
          count_dependencies: []
        };

        // Auto-enable calculation panels based on category
        if (item.category === 'Civil') {
          materialCalc = { ...materialCalc, enabled: true };
          finishingCalc = { ...finishingCalc, enabled: false };
        } else if (item.category && item.category !== 'Civil') {
          finishingCalc = { ...finishingCalc, enabled: true };
          materialCalc = { ...materialCalc, enabled: false };
        }

        // Calculate defaultRate based on default_brand
        const brands = (item.brands && item.brands.length > 0) 
          ? [...item.brands] 
          : [{ brand_name: '', rate_per_unit: '' }];
        const defaultBrand = item.default_brand || '';
        const selectedBrand = brands.find(b => b.brand_name === defaultBrand);
        const defaultRate = selectedBrand ? parseFloat(selectedBrand.rate_per_unit) || 0 : 0;

        setItemForm({
          id: item.id,
          material: item.material || '',
          category: item.categoryName || item.category || '', // Map categoryName to category for form
          categoryId: item.categoryId || '',
          sub_category: item.sub_category || '',
          unit: item.unit || '',
          location: item.location || '',
          isActive: item.isActive !== undefined ? item.isActive : true,
          default_brand: defaultBrand,
          defaultRate: defaultRate,
          unit_size_kg: item.unit_size_kg || '',
          quantity_formula: item.quantity_formula || '',
          wastage_percent: item.wastage_percent || 0,
          description: item.description || '',
          brands: brands,
          materialCalculation: materialCalc,
          finishingCalculation: finishingCalc
        });
        // Clear validation states when editing
        setDuplicateError('');
        setMaterialValidated(true);
      } finally {
        // No cleanup needed
      }
    } else {
      setEditingItem(null);
      setItemForm({
        id: null,
        material: '',
        category: '',
        categoryId: '',
        unit: '',
        unit_size_kg: '',
        default_brand: '',
        defaultRate: 0,
        brands: [{ brand_name: '', rate_per_unit: '' }],
        quantity_formula: '',
        wastage_percent: 0,
        description: '',
        location: userLocation || '', // Allow empty location for dropdown selection
        isActive: true
      });
      // Clear validation states for new item
      setDuplicateError('');
      setMaterialValidated(false);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setItemForm({
      id: null,
      material: '',
      category: '',
      categoryId: '',
      sub_category: '',
      unit: '',
      unit_size_kg: '',
      default_brand: '',
      brands: [{ brand_name: '', rate_per_unit: '' }],
      quantity_formula: '',
      wastage_percent: 0,
      description: '',
      location: userLocation || '',
      isActive: true,
      // Reset calculation subcomponents
      materialCalculation: {
        RCC: [],
        Ceiling: [],
        Wall: []
      },
      finishingCalculation: {
        enabled: false,
        quantity_formula: '',
        coverage_per_box_sqft: '',
        applicable_areas: [],
        count_dependencies: []
      }
    });
    // Clear validation states
    setDuplicateError('');
    setMaterialValidated(false);
  };

  const validateForm = () => {
    if (!itemForm.material || !itemForm.category || !itemForm.unit) {
      showAlertMessage('Please fill in all required fields (Material, Category, Unit)', 'danger');
      return false;
    }

    // Check for sub-category when category has subcategories
    if (currentSubCategories.length > 0 && !itemForm.sub_category) {
      showAlertMessage('Please select a Sub-Category', 'danger');
      return false;
    }

    if (!itemForm.location) {
      showAlertMessage('Please select a location', 'danger');
      return false;
    }

    // Check for duplicate error
    if (duplicateError) {
      showAlertMessage('Please resolve the duplicate material error before saving', 'danger');
      return false;
    }

    // Validate brands
    const validBrands = itemForm.brands.filter(brand => 
      brand.brand_name.trim() && brand.rate_per_unit && !isNaN(brand.rate_per_unit)
    );
    
    if (validBrands.length === 0) {
      showAlertMessage('Please add at least one valid brand with name and rate', 'danger');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    showAlertMessage('Saving item...', 'info');

    try {
      // Filter out empty brands
      const validBrands = itemForm.brands.filter(brand => 
        brand.brand_name.trim() && brand.rate_per_unit && !isNaN(brand.rate_per_unit)
      );

      // Set default brand if not specified
      const defaultBrand = itemForm.default_brand || 
        (validBrands.length > 0 ? validBrands[0].brand_name : '');
      
      // Calculate defaultRate from the selected default brand
      const selectedBrand = validBrands.find(b => b.brand_name === defaultBrand);
      const defaultRate = selectedBrand ? parseFloat(selectedBrand.rate_per_unit) || 0 : 0;

      // Prepare data in MongoDB structure format
      const itemData = {
        material: itemForm.material,
        categoryId: itemForm.categoryId,
        sub_category: itemForm.sub_category || null,
        unit: itemForm.unit,
        unit_size_kg: itemForm.unit_size_kg ? Number(itemForm.unit_size_kg) : null,
        default_brand: defaultBrand,
        defaultRate: defaultRate,
        brands: validBrands,
        quantity_formula: itemForm.quantity_formula || "",
        wastage_percent: Number(itemForm.wastage_percent) || 0,
        description: itemForm.description || null,
        location: itemForm.location,
        isActive: itemForm.isActive !== undefined ? itemForm.isActive : true,
        materialCalculation: itemForm.materialCalculation || null,
        finishingCalculation: itemForm.finishingCalculation?.enabled ? {
          enabled: true,
          quantity_formula: itemForm.finishingCalculation.quantity_formula || '',
          coverage_per_box_sqft: itemForm.finishingCalculation.coverage_per_box_sqft || '',
          applicable_areas: itemForm.finishingCalculation.applicable_areas || [],
          count_dependencies: itemForm.finishingCalculation.count_dependencies || []
        } : null,
        version: "1.0"
      };

      console.log('handleSubmit - Saving item with sub_category:', {
        material: itemData.material,
        category: itemForm.category,
        categoryId: itemData.categoryId,
        sub_category: itemData.sub_category,
        itemForm_sub_category: itemForm.sub_category
      });

      if (editingItem) {
        // Update existing item
        const updatedItemData = {
          ...itemData,
          modifiedDate: new Date().toISOString(),
          modifiedBy: localStorage.getItem('currentUser') || 'System'
        };
        
        // Use the editingItem's MongoDB _id for update (not local id)
        const itemIdToUpdate = editingItem._id;
        
        if (!itemIdToUpdate) {
          throw new Error('No MongoDB _id found for the item being updated');
        }
        
        
        // Save to API with item ID for update
        await saveItemToAPI(updatedItemData, true, itemIdToUpdate);
        
        // Reload data from API to ensure consistency
        await refreshItems();
        
        showAlertMessage('Item updated successfully in database!', 'success');
      } else {
        // Add new item
        const newItem = {
          ...itemData,
          createdDate: new Date().toISOString(),
          createdBy: localStorage.getItem('currentUser') || 'System'
        };
        
        // Save to API (MongoDB will generate the ID)
        await saveItemToAPI(newItem, false);
        
        // Reload data from API to ensure consistency
        await refreshItems();
        
        showAlertMessage('Item created successfully in database!', 'success');
      }

      closeModal();
      
    } catch (error) {
      showAlertMessage('Error saving item: ' + error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        // Find the item to get its MongoDB _id if available
        const itemToDelete = items.find(item => item.id === itemId);
        const mongoId = itemToDelete?._id || itemId;
        
        
        // Delete from API first using MongoDB ID
        await deleteItemFromAPI(mongoId);
        
        // Reload data from API to ensure consistency
        await refreshItems();
        
        showAlertMessage('Item deleted successfully from database!', 'success');
      } catch (error) {
        console.error('Delete error:', error);
        showAlertMessage('Error deleting item: ' + error.message, 'danger');
      }
    }
  };

  const clearMaterialFilter = () => {
    setMaterialFilter('');
  };

  const clearCategoryFilter = () => {
    setCategoryFilter('All');
  };

  const exportItems = () => {
    try {
      const dataStr = JSON.stringify(filteredItems, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `item_master_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      showAlertMessage('Items exported successfully!', 'success');
    } catch (error) {
      showAlertMessage('Error exporting items: ' + error.message, 'danger');
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const safeFilteredItems = Array.isArray(filteredItems) ? filteredItems : [];
  const currentItems = safeFilteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(safeFilteredItems.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <Card className="shadow">
            <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center flex-wrap">
              <h4 className="mb-0">
                <i className="fas fa-boxes me-2"></i>
                Item Master
                {userLocation && (
                  <Badge bg="light" text="dark" className="ms-2">
                    Default: {userLocation}
                  </Badge>
                )}
              </h4>
              <div className="d-flex gap-2 flex-wrap">
                <Button variant="light" size="sm" onClick={exportItems}>
                  <i className="fas fa-download me-2"></i>
                  Export
                </Button>
                <Button 
                  variant="warning" 
                  size="sm" 
                  onClick={() => openModal()}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Item
                </Button>
              </div>
            </Card.Header>

            <Card.Body>
              {/* Loading Indicator */}
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading items...</span>
                  </div>
                  <div className="mt-2">
                    <small className="text-muted">Loading items from database...</small>
                  </div>
                </div>
              )}

              {/* Items Table */}
              {!loading && (
                <div className="table-responsive">
                <Table striped hover>
                  <thead className="table-dark">
                    <tr>
                      <th>
                        <div className="d-flex flex-column">
                          <span>Material</span>
                          <div className="mt-1">
                            <InputGroup size="sm">
                              <Form.Control
                                type="text"
                                placeholder="Filter materials..."
                                value={materialFilter}
                                onChange={(e) => setMaterialFilter(e.target.value)}
                                style={{ fontSize: '0.8rem' }}
                              />
                              {materialFilter && (
                                <Button 
                                  variant="outline-light" 
                                  size="sm"
                                  onClick={clearMaterialFilter}
                                  title="Clear filter"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              )}
                            </InputGroup>
                          </div>
                        </div>
                      </th>
                      <th>
                        <div className="d-flex flex-column">
                          <span>Category</span>
                          <div className="mt-1">
                            <InputGroup size="sm">
                              <Form.Select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                style={{ fontSize: '0.8rem' }}
                              >
                                <option value="All">All</option>
                                {categories.map(cat => (
                                  <option key={cat._id} value={cat.categoryName}>{cat.categoryName}</option>
                                ))}
                              </Form.Select>
                              {categoryFilter !== 'All' && (
                                <Button 
                                  variant="outline-light" 
                                  size="sm"
                                  onClick={clearCategoryFilter}
                                  title="Clear filter"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              )}
                            </InputGroup>
                          </div>
                        </div>
                      </th>
                      <th>
                        <div className="d-flex flex-column">
                          <span>Sub Category</span>
                          <div className="mt-1">
                            <InputGroup size="sm">
                              <Form.Select
                                value={subCategoryFilter}
                                onChange={(e) => setSubCategoryFilter(e.target.value)}
                                style={{ fontSize: '0.8rem' }}
                              >
                                <option value="All">All</option>
                                {Array.from(new Set(items.map(item => item.sub_category).filter(Boolean))).sort().map(subCat => (
                                  <option key={subCat} value={subCat}>{subCat}</option>
                                ))}
                              </Form.Select>
                              {subCategoryFilter !== 'All' && (
                                <Button 
                                  variant="outline-light" 
                                  size="sm"
                                  onClick={() => setSubCategoryFilter('All')}
                                  title="Clear filter"
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              )}
                            </InputGroup>
                          </div>
                        </div>
                      </th>
                      <th>Unit</th>
                      <th>Default Brand</th>
                      <th>Rate Range</th>
                      <th>Calculations</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map(item => {
                      // Safely handle brands array
                      const brands = item.brands || [];
                      const rates = brands.map(b => b.rate_per_unit || 0);
                      const minRate = rates.length > 0 ? Math.min(...rates) : 0;
                      const maxRate = rates.length > 0 ? Math.max(...rates) : 0;
                      
                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.material}</strong>
                            {item.description && (
                              <div>
                                <small className="text-muted">{item.description}</small>
                              </div>
                            )}
                          </td>
                          <td>
                            <Badge bg="info">{item.categoryName || item.category}</Badge>
                          </td>
                          <td>
                            {item.sub_category ? (
                              <Badge bg="secondary">{item.sub_category}</Badge>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {item.unit}
                            {item.unit_size_kg && (
                              <div>
                                <small className="text-muted">({item.unit_size_kg} kg)</small>
                              </div>
                            )}
                          </td>
                          <td>{item.default_brand}</td>
                          <td>
                            ₹{minRate}
                            {minRate !== maxRate && ` - ₹${maxRate}`}
                            <div>
                              <small className="text-muted">{brands.length} brands</small>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {item.materialCalculation?.enabled && (
                                <div>
                                  <Badge 
                                    bg="primary" 
                                    size="sm"
                                    title="Material Calculation: Floor-Component specific MT values"
                                  >
                                    <i className="fas fa-cubes me-1"></i>
                                    Material
                                  </Badge>
                                </div>
                              )}
                              {item.finishingCalculation?.enabled && (
                                <Badge 
                                  bg="success" 
                                  size="sm"
                                  title={`Finishing: ${item.finishingCalculation.quantity_formula || 'Area/Count-based'}`}
                                >
                                  <i className="fas fa-paint-brush me-1"></i>
                                  Finishing
                                </Badge>
                              )}
                              {!item.materialCalculation?.enabled && !item.finishingCalculation?.enabled && (
                                <small className="text-muted">None</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge bg="secondary">{item.location}</Badge>
                          </td>
                          <td>
                            <Badge bg={item.isActive ? 'success' : 'danger'}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                onClick={() => openModal(item)}
                                title="Edit Item"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => handleDelete(item.id)}
                                title="Delete Item"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              )}

              {safeFilteredItems.length === 0 && !loading && (
                <div className="text-center py-4">
                  <i className="fas fa-boxes fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No items found</h5>
                  <p className="text-muted">
                    {items.length === 0 
                      ? "Click 'Add Item' to create your first item"
                      : "Try adjusting your filters to see more results"
                    }
                  </p>
                </div>
              )}

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
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      <Modal show={showModal} onHide={closeModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-box me-2"></i>
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Alert inside Modal */}
            {showAlert && (
              <Alert variant={alertVariant} dismissible onClose={() => setShowAlert(false)} className="mb-3">
                {alertMessage}
              </Alert>
            )}
            
            {/* Basic Information */}
            <Row className="mb-3">
              <Col>
                <h6 className="text-success mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Basic Information
                </h6>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Material Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="material"
                    value={itemForm.material}
                    onChange={handleInputChange}
                    placeholder="Enter material name"
                    required
                    className={duplicateError ? 'is-invalid' : materialValidated ? 'is-valid' : ''}
                  />
                  {duplicateError && (
                    <div className="invalid-feedback d-block">
                      <i className="fas fa-exclamation-triangle me-1"></i>
                      {duplicateError}
                    </div>
                  )}
                  {materialValidated && !duplicateError && itemForm.material && (
                    <div className="valid-feedback d-block">
                      <i className="fas fa-check me-1"></i>
                      Material name is available
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="category"
                    value={itemForm.category}
                    onChange={(e) => {
                      const selectedCategoryName = e.target.value;
                      const selectedCategory = categories.find(cat => cat.categoryName === selectedCategoryName);
                      
                      // Get subcategories for the selected category
                      const subCats = selectedCategory?.subCategories 
                        ? selectedCategory.subCategories
                            .filter(sub => sub.isActive)
                            .map(sub => sub.subCategoryName)
                        : [];
                      
                      // Auto-select if only one subcategory
                      const autoSelectedSubCategory = subCats.length === 1 ? subCats[0] : '';
                      
                      console.log('Category changed:', {
                        categoryName: selectedCategoryName,
                        categoryId: selectedCategory?._id,
                        subCategories: subCats,
                        autoSelectedSubCategory
                      });
                      
                      setItemForm(prev => ({
                        ...prev,
                        category: selectedCategoryName,
                        categoryId: selectedCategory?._id || '',
                        sub_category: autoSelectedSubCategory, // Auto-select if only one, else reset
                        // Ensure finishingCalculation is initialized for non-Civil categories
                        finishingCalculation: prev.finishingCalculation || {
                          enabled: false,
                          quantity_formula: '',
                          coverage_per_box_sqft: '',
                          applicable_areas: [],
                          count_dependencies: []
                        }
                      }));
                      // Re-validate if material exists
                      if (itemForm.material) {
                        validateMaterialDuplicate(itemForm.material, selectedCategoryName, itemForm.location);
                      }
                    }}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.categoryName}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    <small>
                      <i className="fas fa-info-circle me-1"></i>
                      {itemForm.category === 'Civil' 
                        ? 'Material Calculation will be auto-enabled'
                        : itemForm.category && itemForm.category !== 'Civil'
                        ? 'Finishing Calculation will be auto-enabled'
                        : 'Calculation type depends on category selection'
                      }
                    </small>
                  </Form.Text>
                </Form.Group>
              </Col>
              {currentSubCategories.length > 0 && (
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Sub-Category <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="sub_category"
                      value={itemForm.sub_category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Sub-Category</option>
                      {currentSubCategories.map(subCat => (
                        <option key={subCat} value={subCat}>{subCat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row className="mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Unit <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="unit"
                    value={itemForm.unit}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Unit Size (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="unit_size_kg"
                    value={itemForm.unit_size_kg}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                  />
                  <Form.Text className="text-muted">
                    <small>Weight per unit</small>
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Wastage %</Form.Label>
                  <Form.Control
                    type="number"
                    name="wastage_percent"
                    value={itemForm.wastage_percent}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    placeholder="0"
                  />
                  <Form.Text className="text-muted">
                    <small>Default wastage</small>
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="location"
                    value={itemForm.location}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select the location for this material rate
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={itemForm.description}
                    onChange={handleInputChange}
                    placeholder="Enter detailed description of the material"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Calculation Subcomponents */}
            {itemForm.category && (
              <Row className="mb-4">
                <Col>
                </Col>
              </Row>
            )}

            

            {/* Finishing Calculation Component - Only for Non-Core Materials */}
            {itemForm.category && itemForm.category !== 'Civil' && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="border-success">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-paint-brush me-2"></i>
                        Finishing Calculation (Area/Count-based)
                        <Badge bg="light" text="success" size="sm" className="ms-2">Required</Badge>
                      </h6>
                      <small className="text-light mt-1 d-block">
                        Area/count-based calculations for finishing materials (tiles, paint, electrical, plumbing, etc.)
                      </small>
                    </Card.Header>
                    <Card.Body>
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Quantity Formula</Form.Label>
                            <Form.Control
                              type="text"
                              value={itemForm.finishingCalculation?.quantity_formula || ''}
                              onChange={(e) => handleFinishingCalculationChange('quantity_formula', e.target.value)}
                              placeholder="e.g., built_up_area_sqft / 10"
                            />
                            <Form.Text className="text-muted">
                              Formula using area/count variables
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Coverage per Box/Unit (sqft)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.1"
                              value={itemForm.finishingCalculation?.coverage_per_box_sqft || ''}
                              onChange={(e) => handleFinishingCalculationChange('coverage_per_box_sqft', e.target.value)}
                              placeholder="e.g., 16 for tile box"
                            />
                            <Form.Text className="text-muted">
                              Coverage area per unit (optional)
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Brands Section */}
            <Row className="mb-3">
              <Col>
                <h6 className="text-success mb-3">
                  <i className="fas fa-tags me-2"></i>
                  Brands & Rates
                  <small className="text-muted ms-2">(Add multiple brands for this material)</small>
                </h6>
                
                {/* Quick Brand Suggestions */}
                {itemForm.material && getQuickBrandSuggestions(itemForm.material).length > 0 && (
                  <div className="mb-3">
                    <small className="text-muted me-2">Quick add common brands:</small>
                    <div className="d-inline-flex flex-wrap gap-1">
                      {getQuickBrandSuggestions(itemForm.material)
                        .filter(brand => !itemForm.brands.some(b => b.brand_name === brand))
                        .map((brand, index) => (
                          <Button
                            key={index}
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => addQuickBrand(brand)}
                          >
                            + {brand}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Brands Grid Header */}
                <Row className="mb-2">
                  <Col md={5}>
                    <strong>Brand Name <span className="text-danger">*</span></strong>
                  </Col>
                  <Col md={4}>
                    <strong>Rate per {itemForm.unit || 'Unit'} <span className="text-danger">*</span></strong>
                  </Col>
                  <Col md={3}>
                    <strong>Actions</strong>
                  </Col>
                </Row>
                
                {/* Brands Grid Rows */}
                <div className="border rounded p-3 bg-light">
                  {(itemForm.brands && itemForm.brands.length > 0) ? (
                    itemForm.brands.map((brand, index) => (
                      <Row key={index} className={`align-items-center ${index < itemForm.brands.length - 1 ? 'border-bottom' : ''} pb-2 mb-2`}>
                        <Col md={5}>
                          <Form.Control
                            type="text"
                            value={brand.brand_name || ''}
                            onChange={(e) => handleBrandChange(index, 'brand_name', e.target.value)}
                            placeholder="Enter brand name (e.g., UltraTech, ACC)"
                            required={index === 0}
                            size="sm"
                          />
                        </Col>
                        <Col md={4}>
                          <InputGroup size="sm">
                            <InputGroup.Text>₹</InputGroup.Text>
                            <Form.Control
                              type="number"
                              value={brand.rate_per_unit || ''}
                              onChange={(e) => handleBrandChange(index, 'rate_per_unit', e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              required={index === 0}
                            />
                          </InputGroup>
                        </Col>
                        <Col md={3}>
                          <div className="d-flex gap-1">
                            {index === itemForm.brands.length - 1 && (
                              <Button variant="success" onClick={addBrand} size="sm" title="Add another brand">
                                <i className="fas fa-plus"></i>
                              </Button>
                            )}
                            {itemForm.brands.length > 1 && (
                              <Button 
                                variant="danger" 
                                onClick={() => removeBrand(index)} 
                                size="sm"
                                title="Remove this brand"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            )}
                          </div>
                        </Col>
                      </Row>
                    ))
                  ) : (
                    <Row className="align-items-center pb-2 mb-2">
                      <Col md={12} className="text-center text-muted py-3">
                        <p>No brands added yet. Click the button below to add a brand.</p>
                        <Button variant="success" onClick={addBrand} size="sm">
                          <i className="fas fa-plus me-2"></i>
                          Add First Brand
                        </Button>
                      </Col>
                    </Row>
                  )}
                </div>
              </Col>
            </Row>

            {/* Brand Summary */}
            {itemForm.brands.filter(b => b.brand_name && b.rate_per_unit).length > 0 && (
              <Row className="mb-3">
                <Col md={12}>
                  <Card className="bg-light">
                    <Card.Body className="py-2">
                      <h6 className="mb-2 text-success">
                        <i className="fas fa-list me-2"></i>
                        Brand Summary ({itemForm.brands.filter(b => b.brand_name && b.rate_per_unit).length} brands)
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {itemForm.brands
                          .filter(brand => brand.brand_name && brand.rate_per_unit)
                          .map((brand, index) => (
                            <Badge key={index} bg="primary" className="p-2">
                              {brand.brand_name}: ₹{brand.rate_per_unit}
                            </Badge>
                          ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Default Brand</Form.Label>
                  <Form.Select
                    name="default_brand"
                    value={itemForm.default_brand}
                    onChange={handleInputChange}
                  >
                    <option value="">Auto-select first brand</option>
                    {itemForm.brands
                      .filter(brand => brand.brand_name.trim())
                      .map((brand, index) => (
                        <option key={index} value={brand.brand_name}>
                          {brand.brand_name} (₹{brand.rate_per_unit || '0'})
                        </option>
                      ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Brand to be used by default in calculations
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  name="isActive"
                  checked={itemForm.isActive}
                  onChange={handleInputChange}
                  label="Active (Include in calculations)"
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              type="submit" 
              disabled={duplicateError || (!materialValidated && !editingItem) || saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  {editingItem ? 'Update Item' : 'Save Item'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ItemMaster;
