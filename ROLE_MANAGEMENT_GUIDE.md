# Role Management System Guide

## Overview
The Role Management system provides a comprehensive interface to create, edit, and manage user roles with granular menu permissions. This allows administrators to control access to different parts of the application based on user roles.

## Default Roles

### 1. **Admin**
- **Description**: Full system access with all permissions including role management
- **Access Level**: Complete access to all menus and features
- **Can Access**:
  - All project management features
  - All reports
  - All master data
  - All admin features (User Management, Company Setup, Role Management)
  - Public pages

### 2. **Contributor**
- **Description**: Can create and edit projects, view reports, and manage master data
- **Access Level**: Full access except admin functions
- **Can Access**:
  - Project Management (List, Estimation)
  - Reports (Cost Report)
  - Master Data (Item Master, BHK Config, RCC Config)
  - Public pages
- **Cannot Access**:
  - Admin menu (User Management, Company Setup, Role Management)

### 3. **Reader**
- **Description**: Read-only access to projects and reports
- **Access Level**: View-only access
- **Can Access**:
  - Project Management (List only - read mode)
  - Reports (Cost Report - view only)
  - Public pages
- **Cannot Access**:
  - Project Estimation
  - Master Data
  - Admin menu

## Permission Model

### Granular Permissions
The system uses a hierarchical permission model:

```
menu-id                    → Parent menu access
menu-id.submenu-id        → Specific submenu access
```

**Example:**
```json
{
  "permissions": [
    "project-management",                    // Parent access
    "project-management.project-list",       // Submenu 1
    "project-management.project-estimation"  // Submenu 2
  ]
}
```

### Permission Inheritance
- If you grant a submenu permission, the parent menu is automatically accessible
- If you grant only parent permission, all submenus become accessible
- You can selectively grant individual submenu permissions

## Using Role Management

### Accessing Role Management
1. Login as **admin** user
2. Navigate to **Admin** → **Role Management**
3. You'll see a list of all existing roles

### Creating a New Role

1. Click **"Create New Role"** button
2. Fill in the form:
   - **Role Name**: Unique identifier (e.g., "Editor", "Viewer", "Manager")
   - **Description**: Brief description of the role's purpose
   - **Menu Permissions**: Select which menus/submenus this role can access

3. Select Permissions:
   - Check individual menus and submenus
   - Use **"Select All"** to grant all permissions
   - Use **"Clear All"** to remove all permissions
   - Submenu items are nested under parent menus

4. Click **"Save Role"**

### Editing an Existing Role

1. Find the role in the list
2. Click **"Edit"** button
3. Modify:
   - Description (Role name cannot be changed)
   - Menu permissions
4. Click **"Save Role"**

### Deleting a Role

1. Find the role in the list
2. Click **"Delete"** button
3. Confirm deletion

**Note**: System roles (Admin, Contributor, Reader) cannot be deleted.

## Test Users

Use these credentials to test different role access levels:

### Admin User
```
Username: salmansdr
Password: Arman@123
Role: admin
```

### Contributor User
```
Username: contributor1
Password: Contributor@123
Role: contributor
```

### Reader User
```
Username: reader1
Password: Reader@123
Role: reader
```

## Menu Structure

### Available Menus for Permission Assignment

1. **Home** (Public - no auth required)
2. **Project Management**
   - Project List
   - Project Estimation

3. **Reports**
   - Cost Report

4. **Master Data**
   - Item Master
   - BHK Configuration
   - RCC Configuration

5. **Admin** (Admin only)
   - Company Setup
   - User Management
   - Role Management

6. **About** (Public - no auth required)
7. **Contact** (Public - no auth required)

## Configuration Storage

### Development/Demo Mode
- Roles are stored in `localStorage` (temporary)
- Changes persist in browser session
- Data is lost when clearing browser data

### Production Mode (To Implement)
- Roles should be saved to backend API
- Update `handleSaveRole` and `handleDeleteRole` functions
- Replace `localStorage` calls with API calls

## Best Practices

### Naming Conventions
- Use clear, descriptive role names (e.g., "ProjectManager", "FinanceViewer")
- Use camelCase or PascalCase for consistency
- Avoid special characters

### Permission Assignment
- Follow principle of least privilege (grant minimum required access)
- Group related permissions together
- Document role purposes clearly in descriptions

### Role Planning
- Define roles based on job functions, not individuals
- Create role hierarchy (Reader < Contributor < Admin)
- Plan for future growth (leave room for additional roles)

## Example Role Configurations

### Project Manager Role
```json
{
  "roleName": "projectManager",
  "description": "Manages projects and views all reports",
  "permissions": [
    "home",
    "project-management",
    "project-management.project-list",
    "project-management.project-estimation",
    "reports",
    "reports.cost-report",
    "about",
    "contact"
  ]
}
```

### Finance Viewer Role
```json
{
  "roleName": "financeViewer",
  "description": "View-only access to reports and cost data",
  "permissions": [
    "home",
    "reports",
    "reports.cost-report",
    "about",
    "contact"
  ]
}
```

### Data Entry Role
```json
{
  "roleName": "dataEntry",
  "description": "Can manage master data only",
  "permissions": [
    "home",
    "master-data",
    "master-data.item-master",
    "master-data.bhk-configuration",
    "master-data.rcc-configuration",
    "about",
    "contact"
  ]
}
```

## Technical Implementation

### Files Modified/Created

1. **`src/RoleManagement.js`** (NEW)
   - Main role management component
   - CRUD operations for roles
   - Permission selection interface

2. **`src/utils/menuSecurity.js`** (UPDATED)
   - Added `hasRolePermission()` - Check granular permissions
   - Added `hasSubmenuPermission()` - Check submenu access
   - Updated `hasPermission()` - Support new permission model
   - Updated `getFilteredMenuItems()` - Filter with granular permissions

3. **`src/App.js`** (UPDATED)
   - Added RoleManagement import
   - Added `/role-management` route

4. **`public/menuConfig.json`** (UPDATED)
   - Updated role structure with granular permissions
   - Added Role Management menu item
   - Changed default roles to Admin, Contributor, Reader

### API Structure

#### Menu Config Format
```json
{
  "menuItems": [...],
  "roles": {
    "roleName": {
      "name": "Display Name",
      "description": "Role description",
      "permissions": ["menu-id", "menu-id.submenu-id"]
    }
  },
  "users": [...]
}
```

## Future Enhancements

### Recommended Features
1. **Backend Integration**: Save roles to database
2. **Role Templates**: Pre-defined role templates for quick setup
3. **Permission Groups**: Group permissions by functional area
4. **Audit Log**: Track role changes and who made them
5. **Bulk Operations**: Apply role changes to multiple users
6. **Role Hierarchy**: Define parent-child role relationships
7. **Conditional Permissions**: Time-based or context-based permissions
8. **Role Cloning**: Duplicate existing role as starting point

### Security Enhancements
1. **Role Validation**: Server-side permission verification
2. **Session Management**: Role changes trigger session refresh
3. **Permission Caching**: Cache permissions for performance
4. **Audit Trail**: Log all role modifications

## Troubleshooting

### Role Not Showing in List
- Check localStorage: `localStorage.getItem('menuConfig')`
- Verify JSON structure is valid
- Check browser console for errors

### Permissions Not Working
- Clear browser cache and localStorage
- Logout and login again
- Verify role is assigned to user in menuConfig.json
- Check console logs for filtering output

### Cannot Delete Role
- System roles (admin, contributor, reader) cannot be deleted
- Check if role is assigned to active users
- Verify admin permissions

### Changes Not Persisting
- In demo mode, changes are stored in localStorage only
- Clear browser data will reset roles
- For permanent storage, implement backend API

## Support

For issues or questions about Role Management:
1. Check console logs for error messages
2. Verify menuConfig.json structure
3. Test with fresh browser session
4. Review permission model documentation

---

**Last Updated**: December 2025
**Version**: 1.0
