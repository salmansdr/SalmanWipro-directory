# Quick Reference: Menu & Security System

## 🚀 Quick Start

### Test the different user roles:

| Login | Password | Role | What You'll See |
|-------|----------|------|-----------------|
| `salmansdr` | `Arman@123` | Admin | All menus (Project, Reports, Master Data, Admin) |
| `manager1` | `Manager@123` | Manager | Project, Reports, Master Data (no Admin) |
| `user1` | `User@123` | User | Project, Reports only |

## 📋 Common Tasks

### Add a New Menu Item
Edit `src/menuConfig.json`:
```json
{
  "id": "my-feature",
  "label": "My Feature",
  "path": "/my-feature",
  "type": "link",
  "roles": ["admin"],
  "requireAuth": true
}
```

### Add a Dropdown with Submenu
```json
{
  "id": "my-dropdown",
  "label": "My Dropdown",
  "type": "dropdown",
  "roles": ["admin", "manager"],
  "requireAuth": true,
  "submenu": [
    {
      "id": "sub1",
      "label": "Submenu 1",
      "path": "/sub1",
      "roles": ["admin"]
    }
  ]
}
```

### Create a New User
Add to `users` array in `menuConfig.json`:
```json
{
  "username": "newuser",
  "password": "Pass@123",
  "role": "user",
  "name": "New User"
}
```

### Create a New Role
Add to `roles` in `menuConfig.json`:
```json
"roles": {
  "accountant": {
    "name": "Accountant",
    "description": "Financial access",
    "permissions": ["reports", "billing"]
  }
}
```

## 🔧 Utility Functions

```javascript
import { 
  getUserRole,           // Get current user role
  setUserRole,           // Set user role
  getFilteredMenuItems,  // Get menus for current user
  authenticateUser,      // Login user
  hasPermission          // Check permission
} from './utils/menuSecurity';

// Example usage:
const role = getUserRole();
const menus = getFilteredMenuItems(true);
const user = authenticateUser('username', 'password');
```

## 🎨 Icon Options

- Emoji: `"🏠"`, `"📊"`, `"⚙️"`
- Font Awesome: `"fas fa-home"`, `"fas fa-chart-bar"`

## 🔒 Security Levels

```json
"roles": ["*"]              // All authenticated users
"roles": ["admin"]          // Admin only
"roles": ["admin", "manager"] // Multiple roles
"requireAuth": false        // Public (no login needed)
"requireAuth": true         // Protected (login required)
```

## 📁 File Structure

```
src/
├── menuConfig.json          # Menu & security config
├── utils/
│   └── menuSecurity.js      # Security utilities
└── App.js                   # Main app (uses config)
```

## ✅ Checklist for Adding New Feature

- [ ] Add menu item to `menuConfig.json`
- [ ] Set appropriate `roles` array
- [ ] Set `requireAuth` true/false
- [ ] Create component file
- [ ] Import component in App.js
- [ ] Add route in App.js (if needed)
- [ ] Test with different user roles
- [ ] Update documentation

## 🐛 Debug Tips

```javascript
// In browser console:
localStorage.getItem('userRole')        // Check current role
localStorage.getItem('isAuthenticated') // Check auth status
localStorage.clear()                    // Reset everything
```

## 🎯 Common Patterns

### Admin-only menu:
```json
{
  "roles": ["admin"],
  "requireAuth": true
}
```

### Public menu (no login):
```json
{
  "roles": ["*"],
  "requireAuth": false
}
```

### Manager & Admin menu:
```json
{
  "roles": ["admin", "manager"],
  "requireAuth": true
}
```

## 🔄 Migration Path

**Old hardcoded way:**
```jsx
{isAuthenticated && role === 'admin' && (
  <Nav.Link to="/admin">Admin</Nav.Link>
)}
```

**New JSON way:**
```json
{
  "id": "admin",
  "path": "/admin",
  "roles": ["admin"],
  "requireAuth": true
}
```

Just update JSON - no code changes! ✨
