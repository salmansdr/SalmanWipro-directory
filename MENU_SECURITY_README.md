# JSON-Driven Menu System with Role-Based Security

## Overview
This application now uses a JSON configuration file (`menuConfig.json`) to dynamically generate menu items and control access based on user roles.

## Features

### 1. **Dynamic Menu Generation**
- All menu items and submenus are defined in `menuConfig.json`
- No need to modify App.js for adding/removing menu items
- Supports both links and dropdowns with submenus

### 2. **Role-Based Access Control (RBAC)**
- Four predefined roles: `admin`, `manager`, `user`, `guest`
- Each menu item can specify which roles have access
- Use `"*"` for public access to all authenticated users

### 3. **User Management**
- Multiple users with different roles can be configured in JSON
- Each user has username, password, role, and display name

## Configuration Structure

### Menu Items (`menuConfig.json`)

```json
{
  "id": "unique-id",
  "label": "Display Text",
  "path": "/route-path",
  "type": "link" | "dropdown",
  "icon": "emoji or class",
  "roles": ["admin", "manager", "user"] or ["*"],
  "requireAuth": true | false,
  "submenu": [ /* for dropdown type */ ]
}
```

### Roles Definition

```json
"roles": {
  "admin": {
    "name": "Administrator",
    "description": "Full access to all features",
    "permissions": ["*"]
  }
}
```

### Users Definition

```json
"users": [
  {
    "username": "salmansdr",
    "password": "Arman@123",
    "role": "admin",
    "name": "Salman SDR"
  }
]
```

## Default Users

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| salmansdr | Arman@123 | admin | Full access to all features |
| manager1 | Manager@123 | manager | Project management + Master data |
| user1 | User@123 | user | Project management + Reports only |

## How to Add New Menu Items

1. **Open** `src/menuConfig.json`
2. **Add** a new object to the `menuItems` array:

```json
{
  "id": "new-feature",
  "label": "New Feature",
  "path": "/new-feature",
  "type": "link",
  "icon": "🆕",
  "roles": ["admin", "manager"],
  "requireAuth": true
}
```

3. **Create** the corresponding component and import it in App.js
4. Menu will automatically appear for users with `admin` or `manager` roles

## How to Add Submenu Items

```json
{
  "id": "settings",
  "label": "Settings",
  "type": "dropdown",
  "icon": "⚙️",
  "roles": ["admin"],
  "requireAuth": true,
  "submenu": [
    {
      "id": "general-settings",
      "label": "General Settings",
      "path": "/settings/general",
      "icon": "fas fa-cog",
      "roles": ["admin"]
    }
  ]
}
```

## How to Add New Roles

1. **Define role** in `roles` section:

```json
"roles": {
  "supervisor": {
    "name": "Supervisor",
    "description": "Supervises projects",
    "permissions": ["project-management", "reports"]
  }
}
```

2. **Add users** with this role:

```json
"users": [
  {
    "username": "supervisor1",
    "password": "Super@123",
    "role": "supervisor",
    "name": "Project Supervisor"
  }
]
```

3. **Update menu items** to include new role where needed:

```json
{
  "roles": ["admin", "manager", "supervisor"]
}
```

## Security Features

### Authentication
- Session-based authentication with 24-hour expiry
- Credentials stored in localStorage (for demo purposes)
- Automatic logout on session expiry

### Authorization
- Role-based menu filtering
- Protected routes check user role before rendering
- Public routes accessible without authentication

### Menu Visibility
- Menus automatically hide/show based on:
  - Authentication status
  - User role
  - Route protection requirements

## Utility Functions

Located in `src/utils/menuSecurity.js`:

- `getFilteredMenuItems(isAuthenticated)` - Get menu items for current user
- `authenticateUser(username, password)` - Authenticate and return user object
- `getUserRole()` - Get current user's role
- `setUserRole(role)` - Set user role in localStorage
- `clearUserRole()` - Remove role from localStorage
- `hasPermission(menuItem, userRole)` - Check if user can access menu item
- `isRouteProtected(path)` - Check if route requires authentication

## Disabling Security

To disable security completely, set in `App.js`:

```javascript
const SECURITY_ENABLED = false;
```

This will:
- Bypass all authentication checks
- Show all menu items
- Allow access to all routes
- Set default role to 'admin'

## Best Practices

1. **Never commit real passwords** - Use environment variables for production
2. **Hash passwords** - Implement proper password hashing for production
3. **Use backend authentication** - Current implementation is for demonstration
4. **Limit role exposure** - Only show menus user needs to see
5. **Test role combinations** - Verify each role sees correct menus

## Migration from Hardcoded Menus

### Before (Old way):
```jsx
{isAuthenticated && (
  <NavDropdown title="Admin">
    <NavDropdown.Item as={NavLink} to="/user-management">
      User Management
    </NavDropdown.Item>
  </NavDropdown>
)}
```

### After (New way):
Just update `menuConfig.json` - no JSX changes needed!

## Example: Adding a New "Inventory" Module

1. Add to `menuConfig.json`:

```json
{
  "id": "inventory",
  "label": "Inventory",
  "type": "dropdown",
  "icon": "📦",
  "roles": ["admin", "manager"],
  "requireAuth": true,
  "submenu": [
    {
      "id": "inventory-list",
      "label": "Inventory List",
      "path": "/inventory",
      "icon": "fas fa-list",
      "roles": ["admin", "manager"]
    },
    {
      "id": "stock-management",
      "label": "Stock Management",
      "path": "/inventory/stock",
      "icon": "fas fa-boxes",
      "roles": ["admin"]
    }
  ]
}
```

2. Create components (Inventory.js, StockManagement.js)
3. Import in App.js
4. Add routes - done!

## Troubleshooting

### Menu not showing after login
- Check user role in `menuConfig.json`
- Verify `roles` array in menu item includes user's role
- Check browser console for errors
- Clear localStorage and login again

### All menus showing for guest
- Ensure `SECURITY_ENABLED = true` in App.js
- Check `requireAuth: true` in menu items
- Verify authentication is working

### Submenu not filtering
- Check submenu items have `roles` defined
- Verify parent menu `requireAuth` is set correctly

## Future Enhancements

- [ ] Load menu config from API/database
- [ ] Support for dynamic permissions
- [ ] Menu item ordering/sorting
- [ ] Conditional menu visibility based on feature flags
- [ ] Multi-level nested submenus
- [ ] Menu item badges (notifications, counts)
- [ ] Keyboard shortcuts for menu items

## Support

For questions or issues, contact the development team.
