// menuConfig will be loaded from public folder at runtime
let menuConfig = null;

// Load menu config from public folder
export const loadMenuConfig = async () => {
  if (!menuConfig) {
    try {
      // Use PUBLIC_URL or process.env.PUBLIC_URL to handle subdirectory deployments
      const publicUrl = process.env.PUBLIC_URL || '';
      const configPath = `${publicUrl}/menuConfig.json`;
      console.log('Loading menu config from:', configPath);
      
      const response = await fetch(configPath);
      if (!response.ok) {
        throw new Error(`Failed to load menu config: ${response.status}`);
      }
      menuConfig = await response.json();
      console.log('Menu config loaded:', menuConfig);
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
  console.log('hasPermission called for:', menuItem.label, 'requireAuth:', menuItem.requireAuth);
  
  // If menu item is public (doesn't require auth), allow access
  if (!menuItem.requireAuth) {
    console.log('Public menu item, granting access');
    return true;
  }

  // If no role specified or guest role, deny access to protected items
  if (!userRole || userRole === 'guest') {
    console.log('No role or guest role, denying access');
    return false;
  }

  // Check API-based permissions from localStorage
  const userPermissions = localStorage.getItem('userPermissions');
  console.log('Checking API permissions for:', menuItem.label, 'hasPermissions:', !!userPermissions);
  
  if (userPermissions) {
    try {
      const permissions = JSON.parse(userPermissions);
      console.log('All user permissions:', permissions);
      
      // Check if user has permission for this menu label
      const hasMenuPermission = permissions.some(p => {
        const menuMatch = p.menuItem === menuItem.label || p.page === menuItem.label;
        console.log('Checking permission:', p.menuItem, '/', p.page, 'vs', menuItem.label, '=', menuMatch);
        if (menuMatch && p.permissions) {
          const hasAnyPerm = p.permissions.view === true || 
                 p.permissions.edit === true || 
                 p.permissions.delete === true;
          console.log('Has any permission:', hasAnyPerm, p.permissions);
          return hasAnyPerm;
        }
        return false;
      });
      
      console.log('Final hasMenuPermission:', hasMenuPermission);
      return hasMenuPermission;
    } catch (error) {
      console.error('Error parsing user permissions:', error);
    }
  }

  // If no API permissions, deny access to protected items
  console.log('No API permissions found, denying access');
  return false;
};

/**
 * Check if role has specific permission
 * Now supports both legacy JSON config and API-based permissions from localStorage
 */
export const hasRolePermission = (roleName, permissionKey) => {
  // First check if we have API-based permissions in localStorage
  const userPermissions = localStorage.getItem('userPermissions');
  
  console.log('hasRolePermission check:', { roleName, permissionKey, hasUserPermissions: !!userPermissions });
  
  if (userPermissions) {
    try {
      const permissions = JSON.parse(userPermissions);
      console.log('User permissions:', permissions);
      
      // Permission key format: "menuItem.page" or "menuItem.page.action"
      // Example: "project-management.project-list" or "project-management.project-list.view"
      const [menuId, pageId, action] = permissionKey.split('.');
      
      // Convert menu ID to display name for matching
      // "project-management" -> "Project Management"
      const menuDisplayName = menuId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      console.log('Checking permission:', { menuId, pageId, action, menuDisplayName });
      
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
        console.log('Parent menu permission check:', hasMenuPermission);
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
      
      console.log('Page display name:', pageDisplayName);
      
      // Find matching permission object
      const matchedPermission = permissions.find(p => {
        const menuMatch = p.menuItem === menuDisplayName;
        const pageMatch = p.page === pageDisplayName;
        return menuMatch && pageMatch;
      });
      
      console.log('Matched permission:', matchedPermission);
      
      if (matchedPermission) {
        // If checking specific action (view/edit/delete), check that permission
        if (action && matchedPermission.permissions) {
          const hasActionPermission = matchedPermission.permissions[action] === true;
          console.log(`Action ${action} permission:`, hasActionPermission);
          return hasActionPermission;
        }
        // If just checking menu/page access, check if any permission is granted
        if (matchedPermission.permissions) {
          const hasAnyPermission = matchedPermission.permissions.view === true || 
                 matchedPermission.permissions.edit === true || 
                 matchedPermission.permissions.delete === true;
          console.log('Has any permission:', hasAnyPermission);
          return hasAnyPermission;
        }
        return true;
      }
      
      // If no match found, deny access
      console.log('No permission match found, denying access');
      return false;
    } catch (error) {
      console.error('Error parsing user permissions:', error);
    }
  }
  
  // Fallback to legacy JSON config
  if (!menuConfig || !menuConfig.roles || !menuConfig.roles[roleName]) {
    console.log('No menu config or role found, checking legacy config');
    return false;
  }

  const rolePermissions = menuConfig.roles[roleName].permissions || [];
  
  // Check for wildcard permission
  if (rolePermissions.includes('*')) {
    console.log('Wildcard permission granted');
    return true;
  }

  // Check for exact match or parent permission
  const hasLegacyPermission = rolePermissions.includes(permissionKey) || 
         rolePermissions.some(p => permissionKey.startsWith(p + '.'));
  console.log('Legacy permission check:', hasLegacyPermission);
  return hasLegacyPermission;
};

/**
 * Check if submenu item is accessible
 */
export const hasSubmenuPermission = (parentId, submenuId, userRole) => {
  // Check API-based permissions from localStorage first
  const userPermissions = localStorage.getItem('userPermissions');
  if (userPermissions) {
    try {
      const permissions = JSON.parse(userPermissions);
      
      // For submenu, we just need the submenu label - get it from menuConfig
      // This is a simplified check - just return true if we have permissions
      // The actual filtering will happen in hasPermission
      return permissions.length > 0;
    } catch (error) {
      console.error('Error parsing user permissions:', error);
    }
  }
  
  const permissionKey = `${parentId}.${submenuId}`;
  return hasRolePermission(userRole, permissionKey);
};

/**
 * Filter menu items based on user role and authentication status
 */
export const getFilteredMenuItems = async (isAuthenticated) => {
  const config = await loadMenuConfig();
  const userRole = isAuthenticated ? getUserRole() : 'guest';
  
  console.log('Filtering menu items - isAuthenticated:', isAuthenticated, 'userRole:', userRole);
  console.log('Total menu items:', config.menuItems.length);
  
  const filtered = config.menuItems.filter(menuItem => {
    // Check if user has permission for this menu item
    if (!hasPermission(menuItem, userRole)) {
      return false;
    }

    // If it's a dropdown, filter submenu items using granular permissions
    if (menuItem.type === 'dropdown' && menuItem.submenu) {
      menuItem.filteredSubmenu = menuItem.submenu.filter(subItem => {
        // Check granular permission for submenu
        return hasSubmenuPermission(menuItem.id, subItem.id, userRole) || 
               hasPermission(subItem, userRole);
      });
      // Only show dropdown if it has accessible submenu items
      return menuItem.filteredSubmenu.length > 0;
    }

    return true;
  });
  
  console.log('Filtered menu items:', filtered.length, filtered);
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
  getFilteredMenuItems,
  authenticateUser,
  getRoles,
  getRoleDetails,
  isRouteProtected,
  getAllRoutes
};

export default menuSecurity;
