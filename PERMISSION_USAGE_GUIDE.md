# Permission System Usage Guide

## Overview
The permission system controls what users can **view**, **edit**, and **delete** on each page based on their role permissions stored in localStorage during login.

## Permission Data Structure
During login, user permissions are stored in localStorage as:
```json
{
  "menuItem": "Project Management",
  "page": "Project Management",
  "permissions": {
    "view": true,
    "edit": true,
    "delete": false
  }
}
```

## Available Permission Functions

### 1. `checkPagePermission(pageName, action)`
Check if user has a specific permission for a page.

```javascript
import { checkPagePermission } from './utils/menuSecurity';

const canView = checkPagePermission('Project Management', 'view');
const canEdit = checkPagePermission('Project Management', 'edit');
const canDelete = checkPagePermission('Project Management', 'delete');
```

**Parameters:**
- `pageName` (string): Exact page display name from permissions (e.g., "Project Management")
- `action` (string): 'view', 'edit', or 'delete' (default: 'view')

**Returns:** `boolean` - true if user has permission, false otherwise

### 2. `getPagePermissions(pageName)`
Get all permissions for a page at once.

```javascript
import { getPagePermissions } from './utils/menuSecurity';

const permissions = getPagePermissions('Project Management');
// Returns: { view: true, edit: true, delete: false }

if (permissions.view) {
  // Show page content
}
```

**Returns:** `{ view: boolean, edit: boolean, delete: boolean }`

## Implementation Examples

### Example 1: Basic Page with View Protection
```javascript
import React from 'react';
import { checkPagePermission } from './utils/menuSecurity';

function ProjectManagement() {
  const canView = checkPagePermission('Project Management', 'view');
  
  if (!canView) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-triangle me-2"></i>
        Access Denied: You don't have permission to view this page.
      </div>
    );
  }
  
  return (
    <div>
      <h2>Project Management</h2>
      {/* Page content */}
    </div>
  );
}
```

### Example 2: Conditional Edit/Delete Buttons
```javascript
import React from 'react';
import { getPagePermissions } from './utils/menuSecurity';

function ItemMaster() {
  const permissions = getPagePermissions('Item Master');
  
  if (!permissions.view) {
    return <div className="alert alert-danger">Access Denied</div>;
  }
  
  const handleEdit = (item) => {
    if (!permissions.edit) {
      alert('You do not have edit permission');
      return;
    }
    // Edit logic
  };
  
  const handleDelete = (item) => {
    if (!permissions.delete) {
      alert('You do not have delete permission');
      return;
    }
    // Delete logic
  };
  
  return (
    <div>
      <h2>Item Master</h2>
      
      <table className="table">
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>
                {permissions.edit && (
                  <button 
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => handleEdit(item)}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                )}
                
                {permissions.delete && (
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(item)}
                  >
                    <i className="fas fa-trash"></i> Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {permissions.edit && (
        <button className="btn btn-success">
          <i className="fas fa-plus"></i> Add New Item
        </button>
      )}
    </div>
  );
}
```

### Example 3: Form with Conditional Edit Permission
```javascript
import React, { useState } from 'react';
import { getPagePermissions } from './utils/menuSecurity';

function SupplierMaster() {
  const permissions = getPagePermissions('Supplier Master');
  const [editMode, setEditMode] = useState(false);
  
  if (!permissions.view) {
    return <div className="alert alert-danger">Access Denied</div>;
  }
  
  const handleSave = () => {
    if (!permissions.edit) {
      alert('You do not have permission to save changes');
      return;
    }
    // Save logic
  };
  
  return (
    <div>
      <h2>Supplier Master</h2>
      
      <form>
        <input 
          type="text" 
          disabled={!permissions.edit || !editMode}
        />
        
        {permissions.edit && !editMode && (
          <button onClick={() => setEditMode(true)}>
            Edit
          </button>
        )}
        
        {permissions.edit && editMode && (
          <button onClick={handleSave}>
            Save Changes
          </button>
        )}
      </form>
    </div>
  );
}
```

### Example 4: AG-Grid with Conditional Actions
```javascript
import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { getPagePermissions } from './utils/menuSecurity';

function PurchaseOrders() {
  const permissions = getPagePermissions('Purchase Orders');
  
  const columnDefs = useMemo(() => {
    const cols = [
      { field: 'orderNo', headerName: 'Order No' },
      { field: 'supplier', headerName: 'Supplier' },
      { field: 'amount', headerName: 'Amount' }
    ];
    
    // Add action column only if user has edit or delete permission
    if (permissions.edit || permissions.delete) {
      cols.push({
        field: 'actions',
        headerName: 'Actions',
        cellRenderer: (params) => {
          return (
            <div>
              {permissions.edit && (
                <button onClick={() => handleEdit(params.data)}>
                  Edit
                </button>
              )}
              {permissions.delete && (
                <button onClick={() => handleDelete(params.data)}>
                  Delete
                </button>
              )}
            </div>
          );
        }
      });
    }
    
    return cols;
  }, [permissions]);
  
  if (!permissions.view) {
    return <div className="alert alert-danger">Access Denied</div>;
  }
  
  return (
    <div>
      <h2>Purchase Orders</h2>
      
      {permissions.edit && (
        <button className="btn btn-primary mb-3">
          Create New Order
        </button>
      )}
      
      <AgGridReact columnDefs={columnDefs} />
    </div>
  );
}
```

## Page Name Reference
Make sure to use the **exact page names** from your permission data:

| Page Route | Page Name for Permissions |
|-----------|---------------------------|
| /project-management | "Project Management" |
| /project-estimation | "Project Estimation" |
| /enquiry-details | "Enquiry Details" |
| /purchase-orders | "Purchase Orders" |
| /material-received | "Material Received" |
| /store-requisition | "Store Requisition" |
| /reports | "Cost Report" |
| /stock-details | "Stock Details" |
| /item-master | "Item Master" |
| /supplier-master | "Supplier Master" |
| /location-master | "Location Master" |
| /rcc-configuration | "RCC Configuration" |
| /bhk-configuration | "BHK Configuration" |
| /area-calculation-excel | "Area Calculation (Excel)" |
| /company-setup | "Company Setup" |
| /user-management | "User Management" |
| /role-management | "Role Management" |

## Best Practices

1. **Always check VIEW permission first**
   - Show access denied message if user can't view the page
   
2. **Hide UI elements** based on permissions
   - Don't show Edit/Delete buttons if user lacks permission
   
3. **Double-check in event handlers**
   - Even if button is hidden, verify permission before executing action
   
4. **Use descriptive error messages**
   - Help users understand why they can't perform an action

5. **Cache permissions in component state** (optional for performance)
   ```javascript
   const [permissions] = useState(() => getPagePermissions('Item Master'));
   ```

## API Protection
Remember: Frontend permissions are for **UX only**. Always validate permissions on the backend API as well!

```javascript
// Frontend check (UX)
if (!canDelete) {
  alert('No permission');
  return;
}

// Backend should also verify before deleting
await fetch('/api/items/delete', {
  headers: { Authorization: `Bearer ${token}` }
});
// Backend verifies token and checks user role permissions
```
