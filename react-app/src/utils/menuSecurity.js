// menuConfig will be loaded from public folder at runtime
let menuConfig = null;

// Load menu config from public folder
export const loadMenuConfig = async () => {
  if (!menuConfig) {
    try {
      // Use PUBLIC_URL or process.env.PUBLIC_URL to handle subdirectory deployments
      const publicUrl = process.env.PUBLIC_URL || '';
      const configPath = `${publicUrl}/menuConfig.json`;
      
      const response = await fetch(configPath);
      if (!response.ok) {
        throw new Error(`Failed to load menu config: ${response.status}`);
      }
      menuConfig = await response.json();
    } catch (error) {
      console.error('Error loading menu config:', error);
      menuConfig = { menuItems: [], roles: {}, users: [] };
    }
  }
  return menuConfig;
};

/**
 * Get user role from localStorage or return 'guest' if not authenticated
 */
export const getUserRole = () => {
  const userRole = localStorage.getItem('userRole');
  return userRole || 'guest';
};

/**
 * Set user role in localStorage
 */
export const setUserRole = (role) => {
  localStorage.setItem('userRole', role);
};

/**
 * Clear user role from localStorage
 */
export const clearUserRole = () => {
  localStorage.removeItem('userRole');
};

/**
 * Check if user has permission to access a menu item
 * Supports both legacy role-based and new granular permission model
 */
export const hasPermission = (menuItem, userRole) => {
  // If menu item is public (doesn't require auth), allow access
  if (!menuItem.requireAuth) {
    return true;
  }

  // If no role specified or guest role, deny access to protected items
  if (!userRole || userRole === 'guest') {
    return false;
  }

  // Allow Help page for all authenticated users
  if (menuItem.label === 'Help') {
    return true;
  }

  // Check API-based permissions from localStorage
  const userPermissions = localStorage.getItem('userPermissions');
  
  if (!userPermissions) {
    // No permissions stored, deny access
    return false;
  }
  
  try {
    const permissions = JSON.parse(userPermissions);
    
    // For menu items, check if user has permission by matching page name
    const hasMenuPermission = permissions.some(p => {
      // Match by page name (this is what comes from the API)
      const pageMatch = p.page === menuItem.label;
      if (pageMatch && p.permissions) {
        const hasAnyPerm = p.permissions.view === true || 
               p.permissions.edit === true || 
               p.permissions.delete === true;
        return hasAnyPerm;
      }
      return false;
    });
    
    return hasMenuPermission;
  } catch (error) {
    console.error('Error parsing user permissions:', error);
    return false;
  }
};

/**
 * Check if user has specific permission for a page
 * @param {string} pageName - The display name of the page (e.g., "Project Management")
 * @param {string} action - The action to check: 'view', 'edit', or 'delete'
 * @returns {boolean} - True if user has permission, false otherwise
 */
export const checkPagePermission = (pageName, action = 'view') => {
  const userPermissions = localStorage.getItem('userPermissions');
  
  if (!userPermissions) {
    return false;
  }
  
  try {
    const permissions = JSON.parse(userPermissions);
    
    // Find permission entry for this page
    const pagePermission = permissions.find(p => p.page === pageName);
    
    if (!pagePermission || !pagePermission.permissions) {
      return false;
    }
    
    // Check specific action (view, edit, delete)
    return pagePermission.permissions[action] === true;
  } catch (error) {
    console.error('Error checking page permission:', error);
    return false;
  }
};

/**
 * Get all permissions for a specific page
 * @param {string} pageName - The display name of the page
 * @returns {object} - Object with view, edit, delete boolean properties
 */
export const getPagePermissions = (pageName) => {
  const userPermissions = localStorage.getItem('userPermissions');
  
  if (!userPermissions) {
    return { view: false, edit: false, delete: false };
  }
  
  try {
    const permissions = JSON.parse(userPermissions);
    const pagePermission = permissions.find(p => p.page === pageName);
    
    if (!pagePermission || !pagePermission.permissions) {
      return { view: false, edit: false, delete: false };
    }
    
    return {
      view: pagePermission.permissions.view === true,
      edit: pagePermission.permissions.edit === true,
      delete: pagePermission.permissions.delete === true
    };
  } catch (error) {
    console.error('Error getting page permissions:', error);
    return { view: false, edit: false, delete: false };
  }
};

/**
 * Check if role has specific permission
 * Now supports both legacy JSON config and API-based permissions from localStorage
 */
export const hasRolePermission = (roleName, permissionKey) => {
  // First check if we have API-based permissions in localStorage
  const userPermissions = localStorage.getItem('userPermissions');
  
  if (userPermissions) {
    try {
      const permissions = JSON.parse(userPermissions);
      
      // Permission key format: "menuItem.page" or "menuItem.page.action"
      // Example: "project-management.project-list" or "project-management.project-list.view"
      const [menuId, pageId, action] = permissionKey.split('.');
      
      // Convert menu ID to display name for matching
      // "project-management" -> "Project Management"
      const menuDisplayName = menuId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      // If checking just the parent menu (no pageId), see if user has ANY permission for this menu
      if (!pageId) {
        const hasMenuPermission = permissions.some(p => {
          const menuMatch = p.menuItem === menuDisplayName;
          if (menuMatch && p.permissions) {
            return p.permissions.view === true || 
                   p.permissions.edit === true || 
                   p.permissions.delete === true;
          }
          return false;
        });
        return hasMenuPermission;
      }
      
      // Convert page ID to display name
      const pageMapping = {
        'project-list': 'Project Management',
        'project-estimation': 'Project Estimation',
        'cost-report': 'Cost Report',
        'item-master': 'Item Master',
        'rcc-configuration': 'RCC Configuration',
        'bhk-configuration': 'BHK Configuration',
        'area-calculation-excel': 'Area Calculation (Excel)',
        'company-setup': 'Company Setup',
        'user-management': 'User Management',
        'role-management': 'Role Management'
      };
      
      const pageDisplayName = pageMapping[pageId] || pageId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      // Find matching permission object
      const matchedPermission = permissions.find(p => {
        const menuMatch = p.menuItem === menuDisplayName;
        const pageMatch = p.page === pageDisplayName;
        return menuMatch && pageMatch;
      });
      
      if (matchedPermission) {
        // If checking specific action (view/edit/delete), check that permission
        if (action && matchedPermission.permissions) {
          const hasActionPermission = matchedPermission.permissions[action] === true;
          return hasActionPermission;
        }
        // If just checking menu/page access, check if any permission is granted
        if (matchedPermission.permissions) {
          const hasAnyPermission = matchedPermission.permissions.view === true || 
                 matchedPermission.permissions.edit === true || 
                 matchedPermission.permissions.delete === true;
          return hasAnyPermission;
        }
        return true;
      }
      
      // If no match found, deny access
      return false;
    } catch (error) {
      console.error('Error parsing user permissions:', error);
    }
  }
  
  // Fallback to legacy JSON config
  if (!menuConfig || !menuConfig.roles || !menuConfig.roles[roleName]) {
    return false;
  }

  const rolePermissions = menuConfig.roles[roleName].permissions || [];
  
  // Check for wildcard permission
  if (rolePermissions.includes('*')) {
    return true;
  }

  // Check for exact match or parent permission
  const hasLegacyPermission = rolePermissions.includes(permissionKey) || 
         rolePermissions.some(p => permissionKey.startsWith(p + '.'));
  return hasLegacyPermission;
};

/**
 * Check if submenu item is accessible
 * This now properly delegates to hasPermission for consistency
 */
export const hasSubmenuPermission = (parentId, submenuId, userRole) => {
  // This function is kept for backward compatibility but is no longer used
  // The filtering is now done by hasPermission directly
  const permissionKey = `${parentId}.${submenuId}`;
  return hasRolePermission(userRole, permissionKey);
};

/**
 * Filter menu items based on user role and authentication status
 */
export const getFilteredMenuItems = async (isAuthenticated) => {
  const config = await loadMenuConfig();
  const userRole = isAuthenticated ? getUserRole() : 'guest';
  
  const filtered = config.menuItems.filter(menuItem => {
    // Hide Home and About menu items when authenticated
    if (isAuthenticated && (menuItem.label === 'Home' || menuItem.label === 'About')) {
      return false;
    }
    
    // If menu item is public, allow access
    if (!menuItem.requireAuth) {
      return true;
    }

    // If it's a dropdown, filter submenu items first
    if (menuItem.type === 'dropdown' && menuItem.submenu) {
      menuItem.filteredSubmenu = menuItem.submenu.filter(subItem => {
        // Submenu items inherit requireAuth from parent if not set
        const itemRequiresAuth = subItem.requireAuth !== undefined ? subItem.requireAuth : menuItem.requireAuth;
        
        // Set requireAuth on the subItem for hasPermission to check
        subItem.requireAuth = itemRequiresAuth;
        
        // Check if user has permission for this specific page
        return hasPermission(subItem, userRole);
      });
      // Show dropdown only if it has accessible submenu items
      return menuItem.filteredSubmenu.length > 0;
    }

    // For non-dropdown items, check permission normally
    return hasPermission(menuItem, userRole);
  });
  
  return filtered;
};

/**
 * Get user by username and password
 */
export const authenticateUser = async (username, password) => {
  const config = await loadMenuConfig();
  const user = config.users.find(
    u => u.username === username && u.password === password
  );
  return user || null;
};

/**
 * Get all available roles
 */
export const getRoles = async () => {
  const config = await loadMenuConfig();
  return config.roles;
};

/**
 * Get role details by role name
 */
export const getRoleDetails = async (roleName) => {
  const config = await loadMenuConfig();
  return config.roles[roleName] || null;
};

/**
 * Check if route is protected
 */
export const isRouteProtected = async (path) => {
  const config = await loadMenuConfig();
  // Search in main menu items
  const mainMenuItem = config.menuItems.find(item => item.path === path);
  if (mainMenuItem) {
    return mainMenuItem.requireAuth;
  }

  // Search in submenu items
  for (const menuItem of config.menuItems) {
    if (menuItem.submenu) {
      const subMenuItem = menuItem.submenu.find(sub => sub.path === path);
      if (subMenuItem) {
        return menuItem.requireAuth || subMenuItem.requireAuth;
      }
    }
  }

  // If route not found in config, assume it's protected
  return true;
};

/**
 * Get all routes for rendering Routes component
 */
export const getAllRoutes = async () => {
  const config = await loadMenuConfig();
  const routes = [];
  
  config.menuItems.forEach(item => {
    if (item.path) {
      routes.push({
        id: item.id,
        path: item.path,
        requireAuth: item.requireAuth,
        roles: item.roles
      });
    }
    
    if (item.submenu) {
      item.submenu.forEach(subItem => {
        if (subItem.path) {
          routes.push({
            id: subItem.id,
            path: subItem.path,
            requireAuth: item.requireAuth,
            roles: subItem.roles
          });
        }
      });
    }
  });
  
  return routes;
};

const menuSecurity = {
  getUserRole,
  setUserRole,
  clearUserRole,
  hasPermission,
  checkPagePermission,
  getPagePermissions,
  getFilteredMenuItems,
  authenticateUser,
  getRoles,
  getRoleDetails,
  isRouteProtected,
  getAllRoutes
};

export default menuSecurity;
