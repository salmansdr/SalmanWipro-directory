import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Button, Form, Modal, Alert, ButtonGroup, Table } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSave, FaShieldAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { loadMenuConfig } from './utils/menuSecurity';

// Register Handsontable modules
registerAllModules();

const RoleManagement = () => {
  const [roles, setRoles] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [permissionData, setPermissionData] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [roleCache, setRoleCache] = useState(null);
  const [isNewRole, setIsNewRole] = useState(false);
  const hotTableRef = useRef(null);
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Load menu config and roles on mount
  useEffect(() => {
    loadConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update permission data when role changes
  useEffect(() => {
    if (selectedRole && (roles[selectedRole] || roleCache?.roles?.[selectedRole])) {
      buildPermissionMatrix(selectedRole);
      // Reset isNewRole when switching to existing role from cache
      if (roleCache?.roles?.[selectedRole]?._id) {
        setIsNewRole(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, roles, menuItems, roleCache]);

  const loadConfiguration = async () => {
    try {
      // Load menu structure from JSON
      const config = await loadMenuConfig();
      setMenuItems(config.menuItems || []);
      
      // Load roles from API
      try {
        const response = await fetch(`${apiBaseUrl}/api/RoleManagement`);
        console.log('API Response status:', response.status);
        if (response.ok) {
          const roleDataArray = await response.json();
          console.log('API returned roles:', roleDataArray);
          
          // Convert array of roles to object format
          const rolesObject = {};
          if (Array.isArray(roleDataArray)) {
            roleDataArray.forEach(role => {
              // Skip roles without a name
              if (!role || !role.name) {
                console.warn('Skipping role without name:', role);
                return;
              }
              
              const roleKey = role.name.toLowerCase().replace(/\s+/g, '-');
              rolesObject[roleKey] = {
                _id: role._id,
                name: role.name,
                description: role.description || '',
                permissions: role.permissions || []
              };
            });
          }
          
          console.log('Converted roles object:', rolesObject);
          console.log('First role key:', Object.keys(rolesObject)[0]);
          
          // Cache the API response
          setRoleCache({ roles: rolesObject });
          setRoles(rolesObject);
          
          // Set first role as selected
          const firstRole = Object.keys(rolesObject)[0];
          if (firstRole) {
            console.log('Setting selected role to:', firstRole);
            setSelectedRole(firstRole);
          }
        } else {
          // Fallback to local config if API fails
          console.warn('API not available, using local config');
          setRoles(config.roles || {});
          const firstRole = Object.keys(config.roles || {})[0];
          if (firstRole) {
            setSelectedRole(firstRole);
          }
        }
      } catch (apiError) {
        // Fallback to local config if API call fails
        console.warn('API call failed, using local config:', apiError);
        setRoles(config.roles || {});
        const firstRole = Object.keys(config.roles || {})[0];
        if (firstRole) {
          setSelectedRole(firstRole);
        }
      }
    } catch (error) {
      showAlert('danger', 'Error loading configuration: ' + error.message);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // Build permission matrix for Handsontable
  const buildPermissionMatrix = (roleName) => {
    // Filter from cache if available, otherwise use local roles
    const roleData = roleCache?.roles?.[roleName] || roles[roleName];
    const rolePermissions = roleData?.permissions || [];
    console.log('Building matrix for role:', roleName, 'with permissions:', rolePermissions);
    const matrix = [];

    menuItems.forEach(menu => {
      // Skip public menus
      if (!menu.requireAuth) return;

      if (menu.submenu && menu.submenu.length > 0) {
        // Add submenu rows
        menu.submenu.forEach(sub => {
          const hasView = hasPermissionKey(rolePermissions, menu.label, 'view', sub.label);
          const hasEdit = hasPermissionKey(rolePermissions, menu.label, 'edit', sub.label);
          const hasDelete = hasPermissionKey(rolePermissions, menu.label, 'delete', sub.label);
          matrix.push({
            toggle: hasView && hasEdit && hasDelete,
            menu: menu.label,
            page: sub.label,
            view: hasView,
            edit: hasEdit,
            delete: hasDelete,
            menuLabel: menu.label,
            pageLabel: sub.label
          });
        });
      } else {
        // Single menu item without submenu
        const hasView = hasPermissionKey(rolePermissions, menu.label, 'view', menu.label);
        const hasEdit = hasPermissionKey(rolePermissions, menu.label, 'edit', menu.label);
        const hasDelete = hasPermissionKey(rolePermissions, menu.label, 'delete', menu.label);
        matrix.push({
          toggle: hasView && hasEdit && hasDelete,
          menu: menu.label,
          page: menu.label,
          view: hasView,
          edit: hasEdit,
          delete: hasDelete,
          menuLabel: menu.label,
          pageLabel: menu.label
        });
      }
    });

    console.log('Built permission matrix:', matrix);
    setPermissionData(matrix);
  };

  // Check if permission exists in role
  const hasPermissionKey = (permissions, menuLabel, action, pageLabel = null) => {
    // Handle both old string format and new object format
    if (!permissions || permissions.length === 0) return false;
    
    // If it's string array (legacy format) - unlikely now but keep for compatibility
    if (typeof permissions[0] === 'string') {
      const key = pageLabel 
        ? `${menuLabel}.${pageLabel}.${action}`
        : `${menuLabel}.${action}`;
      return permissions.includes(key) || permissions.includes('*');
    }
    
    // New object format: find matching menuItem and page
    const targetPage = pageLabel || menuLabel;
    
    const matchingPermission = permissions.find(p => 
      p.menuItem === menuLabel && p.page === targetPage
    );
    
    console.log('Checking permission:', menuLabel, targetPage, action, '→', matchingPermission?.permissions?.[action]);
    
    return matchingPermission?.permissions?.[action] === true;
  };

  // Handle permission change from Handsontable
  const handlePermissionChange = (changes, source) => {
    if (!changes || source === 'loadData' || source === 'toggle' || source === 'auto') return;

    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;

    // Simply update the local state - we'll rebuild permissions on save
    changes.forEach(([row, prop, oldValue, newValue]) => {
      // If toggle column changed, update all permission columns
      if (prop === 'toggle') {
        hotInstance.setDataAtRowProp(row, 'view', newValue, 'toggle');
        hotInstance.setDataAtRowProp(row, 'edit', newValue, 'toggle');
        hotInstance.setDataAtRowProp(row, 'delete', newValue, 'toggle');
      }
      // If any permission column changed, update toggle column
      else if (prop === 'view' || prop === 'edit' || prop === 'delete') {
        // Update toggle column based on all permissions
        const sourceRowData = hotInstance.getSourceDataAtRow(row);
        const allChecked = sourceRowData.view && sourceRowData.edit && sourceRowData.delete;
        hotInstance.setDataAtRowProp(row, 'toggle', allChecked, 'auto');
      }
    });
  };

  const handleSavePermissions = async () => {
    try {
      // Get current permissions from Handsontable
      const hotInstance = hotTableRef.current?.hotInstance;
      if (hotInstance) {
        const currentData = hotInstance.getSourceData();
        
        // Build permissions array with menu item structure
        const permissionsArray = [];
        
        currentData.forEach(row => {
          // Only include items where at least one permission is checked
          if (row.view === true || row.edit === true || row.delete === true) {
            permissionsArray.push({
              menuItem: row.menu || '',
              page: row.page || '',
              permissions: {
                view: row.view === true,
                edit: row.edit === true,
                delete: row.delete === true
              }
            });
          }
        });
        
        // Update roles with new permissions structure
        const updatedRoles = {
          ...roles,
          [selectedRole]: {
            ...roles[selectedRole],
            permissions: permissionsArray
          }
        };
        
        setRoles(updatedRoles);

        // Prepare simplified data structure for MongoDB - one role per record
        const roleId = roleCache?.roles?.[selectedRole]?._id || null;
        const mongoDBPayload = {
          name: roles[selectedRole].name,
          description: roles[selectedRole].description,
          permissions: permissionsArray,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'admin' // You can get this from logged-in user
        };

        console.log('=== MongoDB Save Payload ===');
        console.log('Role ID for update:', roleId);
        console.log('Is New Role:', isNewRole);
        console.log(JSON.stringify(mongoDBPayload, null, 2));
        console.log('============================');

        // Save to API
        try {
          let response;
          if (isNewRole || !roleId) {
            // POST for new role
            console.log('Creating new role with POST');
            response = await fetch(`${apiBaseUrl}/api/RoleManagement`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mongoDBPayload)
            });
          } else {
            // PUT for existing role
            console.log('Updating existing role with PUT, ID:', roleId);
            response = await fetch(`${apiBaseUrl}/api/RoleManagement/${roleId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mongoDBPayload)
            });
          }

          if (!response.ok) {
            throw new Error('Failed to save permissions to database');
          }

          const result = await response.json();
          console.log('API Response:', result);
          
          // Update cache and roles with the returned data (including _id)
          const updatedRolesWithId = {
            ...roles,
            [selectedRole]: {
              ...roles[selectedRole],
              _id: result._id || roleId,
              permissions: permissionsArray
            }
          };
          
          setRoles(updatedRolesWithId);
          setRoleCache({ 
            roles: updatedRolesWithId
          });
          
          // Reset isNewRole flag
          setIsNewRole(false);
          
          showAlert('success', `Permissions for "${selectedRole}" saved successfully! (${permissionsArray.length} items)`);
        } catch (apiError) {
          console.error('API Error:', apiError);
          showAlert('danger', `Failed to save permissions: ${apiError.message}`);
        }
      }
    } catch (error) {
      showAlert('danger', 'Error saving permissions: ' + error.message);
    }
  };

  const handleCreateRole = async () => {
    // Validation
    if (!newRoleName.trim()) {
      showAlert('warning', 'Role name is required');
      return;
    }

    const roleKey = newRoleName.toLowerCase().replace(/\s+/g, '-');

    // Check if role name already exists
    if (roles[roleKey]) {
      showAlert('warning', 'Role name already exists');
      return;
    }

    try {
      const updatedRoles = { ...roles };

      updatedRoles[roleKey] = {
        name: newRoleName,
        description: newRoleDescription || '',
        permissions: []
      };
      
      setRoles(updatedRoles);
      setSelectedRole(roleKey);
      setIsNewRole(true); // Mark as new role for POST request
      showAlert('success', `Role "${newRoleName}" created successfully! Don't forget to save permissions.`);
      setShowModal(false);
      setNewRoleName('');
      setNewRoleDescription('');
    } catch (error) {
      showAlert('danger', 'Error creating role: ' + error.message);
    }
  };

  const handleUpdateRoleDescription = async () => {
    try {
      const updatedRoles = {
        ...roles,
        [editingRole]: {
          ...roles[editingRole],
          description: newRoleDescription
        }
      };
      
      setRoles(updatedRoles);
      showAlert('success', `Role "${editingRole}" updated successfully!`);
      setShowModal(false);
      setEditingRole(null);
      setNewRoleDescription('');
    } catch (error) {
      showAlert('danger', 'Error updating role: ' + error.message);
    }
  };

  const handleDeleteRole = async (roleName) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      const roleId = roleCache?.roles?.[roleName]?._id || roles[roleName]?._id;
      
      if (roleId) {
        // Call API to delete from database
        const response = await fetch(`${apiBaseUrl}/api/RoleManagement/${roleId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to delete role from database');
        }
      }
      
      // Update local state
      const updatedRoles = { ...roles };
      delete updatedRoles[roleName];
      
      setRoles(updatedRoles);
      
      // Update cache
      const updatedCache = { ...roleCache };
      if (updatedCache.roles) {
        delete updatedCache.roles[roleName];
        setRoleCache(updatedCache);
      }
      
      // Set new selected role
      const firstRole = Object.keys(updatedRoles)[0];
      if (firstRole) {
        setSelectedRole(firstRole);
      }
      
      showAlert('success', `Role "${roleName}" deleted successfully!`);
    } catch (error) {
      showAlert('danger', 'Error deleting role: ' + error.message);
    }
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setNewRoleDescription(roles[role]?.description || '');
    } else {
      setEditingRole(null);
      setNewRoleName('');
      setNewRoleDescription('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleDescription('');
  };

  const getPermissionCount = (roleName) => {
    return roles[roleName]?.permissions?.length || 0;
  };

  // Handsontable settings
  const hotSettings = {
    data: permissionData,
    colHeaders: ['Toggle All', 'Menu', 'Page', 'View', 'Edit', 'Delete'],
    columns: [
      { data: 'toggle', type: 'checkbox' },
      { data: 'menu', readOnly: true },
      { data: 'page', readOnly: true },
      { data: 'view', type: 'checkbox' },
      { data: 'edit', type: 'checkbox' },
      { data: 'delete', type: 'checkbox' }
    ],
    rowHeaders: true,
    width: '100%',
    height: 500,
    licenseKey: 'non-commercial-and-evaluation',
    stretchH: 'all',
    autoWrapRow: true,
    autoWrapCol: true,
    afterChange: handlePermissionChange,
    cells: function(row, col) {
      const cellProperties = {};
      
      if (col === 1 || col === 2) {
        cellProperties.renderer = function(instance, td, row, col, prop, value) {
          td.innerHTML = value;
          td.style.backgroundColor = '#f8f9fa';
          td.style.fontWeight = '500';
          return td;
        };
      }
      
      return cellProperties;
    }
  };

  return (
    <Container fluid className="py-4" style={{ maxWidth: '1400px' }}>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2><FaShieldAlt className="me-2" />Role Management</h2>
              <p className="text-muted">Manage user roles and define page-level permissions (View, Edit, Delete)</p>
            </div>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FaPlus className="me-2" />Create New Role
            </Button>
          </div>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.type} onClose={() => setAlert({ show: false })} dismissible>
          {alert.message}
        </Alert>
      )}

      <Row className="mb-3">
        <Col lg={8}>
          <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Select Role to Manage Permissions</h5>
              </div>
              <ButtonGroup>
                {Object.keys(roles).map(roleName => (
                  <Button
                    key={roleName}
                    variant={selectedRole === roleName ? 'primary' : 'outline-primary'}
                    onClick={() => setSelectedRole(roleName)}
                    size="sm"
                  >
                    {roleName}
                  </Button>
                ))}
              </ButtonGroup>
            </Card.Header>
            <Card.Body>
              {selectedRole && roles[selectedRole] && (
                <div className="mb-3">
                  <strong>Description:</strong> {roles[selectedRole].description || 'No description'}
                  <span className="ms-3 text-muted">
                    <strong>Permissions:</strong> {getPermissionCount(selectedRole)}
                  </span>
                </div>
              )}
              
              <div style={{ overflow: 'auto' }}>
                <HotTable
                  ref={hotTableRef}
                  settings={hotSettings}
                />
              </div>

              <div className="mt-3 d-flex justify-content-end gap-2">
                <Button variant="success" onClick={handleSavePermissions}>
                  <FaSave className="me-2" />Save Permissions
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">All Roles</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover size="sm">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Permissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(roles).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No roles found. Create your first role.
                      </td>
                    </tr>
                  ) : (
                    Object.keys(roles).map(roleName => (
                      <tr key={roleName}>
                        <td>
                          <strong className="text-capitalize">{roleName}</strong>
                        </td>
                        <td>{roles[roleName].description || '-'}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {getPermissionCount(roleName)} permissions
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleOpenModal(roleName)}
                          >
                            <FaEdit /> Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteRole(roleName)}
                          >
                            <FaTrash /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-3">
            <Card.Header>
              <h5 className="mb-0">Permission Guide</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong><FaCheck className="text-success me-2" />View</strong>
                <p className="small text-muted mb-0">User can view/read data on the page</p>
              </div>
              <div className="mb-3">
                <strong><FaEdit className="text-primary me-2" />Edit</strong>
                <p className="small text-muted mb-0">User can create and modify data</p>
              </div>
              <div className="mb-3">
                <strong><FaTrash className="text-danger me-2" />Delete</strong>
                <p className="small text-muted mb-0">User can delete data</p>
              </div>
              <hr />
              <p className="small text-muted">
                <strong>Note:</strong> Changes are saved per role. Select a role from the buttons above to manage its permissions.
              </p>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header>
              <h5 className="mb-0">Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <small className="text-muted">Total Roles</small>
                <h3>{Object.keys(roles).length}</h3>
              </div>
              <div className="mb-3">
                <small className="text-muted">Total Permissions</small>
                <h4>
                  {Object.values(roles).reduce((sum, role) => sum + (role.permissions?.length || 0), 0)}
                </h4>
              </div>
              <div>
                <small className="text-muted">Active Role</small>
                <h4 className="text-capitalize">{selectedRole || '-'}</h4>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Available Roles</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {Object.keys(roles).length === 0 ? (
                <p className="text-muted small">No roles created yet</p>
              ) : (
                Object.keys(roles).map(roleName => (
                  <div key={roleName} className="mb-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-capitalize fw-bold">{roleName}</span>
                      <span className="badge bg-secondary">
                        {getPermissionCount(roleName)}
                      </span>
                    </div>
                    <small className="text-muted">{roles[roleName].description || 'No description'}</small>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Role Creation/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRole ? `Edit Role: ${editingRole}` : 'Create New Role'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {!editingRole && (
              <Form.Group className="mb-3">
                <Form.Label>Role Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Editor, Viewer, Manager"
                />
                <Form.Text className="text-muted">
                  Role name must be unique
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Brief description of this role's purpose"
              />
            </Form.Group>

            {!editingRole && (
              <Form.Text className="text-muted">
                After creating the role, you can assign permissions using the permission matrix above.
              </Form.Text>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            <FaTimes className="me-2" />Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={editingRole ? handleUpdateRoleDescription : handleCreateRole}
          >
            <FaSave className="me-2" />
            {editingRole ? 'Update' : 'Create Role'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RoleManagement;
