import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Card, Form, Row, Col, Alert, Button } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import * as XLSX from 'xlsx-js-style';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const InventoryMovement = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const currency = localStorage.getItem('companyCurrency') ;

  const loadProjects = useCallback(async () => {
    try {
      const companyId = localStorage.getItem('selectedCompanyId');
      const response = await fetch(`${apiBaseUrl}/api/Projects/basic?companyId=${companyId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setAlertMessage({ show: true, type: 'danger', message: 'Failed to load projects' });
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const loadInventoryMovementReport = async (projectId) => {
    if (!projectId) {
      setReportData([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/ProjectEstimation/report-by-InventoryMovement/${projectId}`);
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data.tabularReport || []);
        setAlertMessage({ show: false, type: '', message: '' });
      } else {
        setReportData([]);
        setAlertMessage({ show: true, type: 'danger', message: 'Failed to load inventory movement report' });
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setReportData([]);
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    const project = projects.find(p => p._id === projectId);
    
    setSelectedProjectId(projectId);
    setSelectedProjectName(project?.name || '');
    
    if (projectId) {
      loadInventoryMovementReport(projectId);
    } else {
      setReportData([]);
    }
  };

  // Number formatter for quantities (no decimals)
  const numberFormatter = useCallback((params) => {
    if (params.value === null || params.value === undefined) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(params.value));
  }, []);

  // Currency formatter (without currency symbol)
  const currencyFormatter = useCallback((params) => {
    if (params.value === null || params.value === undefined) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(params.value);
  }, []);

  // Column Definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'Category',
      field: 'category',
      width: 90,
      pinned: 'left',
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: true,
        debounceMs: 200,
        filterOptions: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'],
        defaultOption: 'contains',
        suppressAndOrCondition: true
      },
      cellStyle: { fontWeight: '500', display: 'flex', alignItems: 'center' }
    },
    {
      headerName: 'Item',
      field: 'item',
      width: 180,
      pinned: 'left',
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: true,
        debounceMs: 200,
        filterOptions: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'],
        defaultOption: 'contains',
        suppressAndOrCondition: true
      },
      cellStyle: { fontWeight: '500', display: 'flex', alignItems: 'center' }
    },
    {
      headerName: 'Unit',
      field: 'unit',
      width: 60,
      pinned: 'left',
      filter: false,
      cellStyle: { textAlign: 'center', borderRight: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' },
      headerClass: 'ag-right-aligned-header',
      cellClass: params => 'ag-right-bordered-cell'
    },
    {
      headerName: 'Estimated',
      children: [
        {
          headerName: 'Qty',
          field: 'estimatedQty',
          width: 80,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#e3f2fd', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: 'Rate',
          field: 'estimateRate',
          width: 75,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#e3f2fd', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: `Amount (${currency})`,
          field: 'estimateAmount',
          width: 110,
          type: 'numericColumn',
          filter: false,
          valueFormatter: currencyFormatter,
          cellStyle: { backgroundColor: '#e3f2fd', borderRight: '2px solid #ccc', display: 'flex', alignItems: 'center' }
        }
      ]
    },
    {
      headerName: 'Requisitioned',
      children: [
        {
          headerName: 'Qty',
          field: 'requisitionQty',
          width: 80,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#f3e5f5', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: 'Rate',
          field: 'avgRequisitionRate',
          width: 75,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#f3e5f5', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: `Amount (${currency})`,
          field: 'requisitionAmount',
          width: 110,
          type: 'numericColumn',
          filter: false,
          valueFormatter: currencyFormatter,
          cellStyle: { backgroundColor: '#f3e5f5', borderRight: '2px solid #ccc', display: 'flex', alignItems: 'center' }
        }
      ]
    },
    {
      headerName: 'Purchased',
      children: [
        {
          headerName: 'Qty',
          field: 'purchasedQty',
          width: 70,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#fff3e0', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: 'Rate',
          field: 'purchaseRate',
          width: 60,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#fff3e0', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: `Amount (${currency})`,
          field: 'purchaseAmount',
          width: 110,
          type: 'numericColumn',
          filter: false,
          valueFormatter: currencyFormatter,
          cellStyle: { backgroundColor: '#fff3e0', borderRight: '2px solid #ccc', display: 'flex', alignItems: 'center' }
        }
      ]
    },
    {
      headerName: 'Received',
      children: [
        {
          headerName: 'Qty',
          field: 'receivedQty',
          width: 80,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: 'Rate',
          field: 'receivedRate',
          width: 60,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: `Amount (${currency})`,
          field: 'receivedAmount',
          width: 110,
          type: 'numericColumn',
          filter: false,
          valueFormatter: currencyFormatter,
          cellStyle: { backgroundColor: '#e8f5e9', borderRight: '2px solid #ccc', display: 'flex', alignItems: 'center' }
        }
      ]
    },
    {
      headerName: 'Issued',
      children: [
        {
          headerName: 'Qty',
          field: 'issuedQty',
          width: 80,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#fce4ec', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: 'Rate',
          field: 'issueRate',
          width: 60,
          type: 'numericColumn',
          filter: false,
          valueFormatter: numberFormatter,
          cellStyle: { backgroundColor: '#fce4ec', display: 'flex', alignItems: 'center' }
        },
        {
          headerName: `Amount (${currency})`,
          field: 'issueAmount',
          width: 110,
          type: 'numericColumn',
          filter: false,
          valueFormatter: currencyFormatter,
          cellStyle: { backgroundColor: '#fce4ec', borderRight: '2px solid #ccc', display: 'flex', alignItems: 'center' }
        }
      ]
    }
  ], [currencyFormatter, numberFormatter, currency]);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: false,
    resizable: true,
    suppressMenu: false,
    cellStyle: { fontSize: '12px', display: 'flex', alignItems: 'center' }
  }), []);

  // Auto size columns on first data load
  const onGridReady = (params) => {
    params.api.sizeColumnsToFit();
  };

  // Export to Excel with styling
  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) return;

    const wb = XLSX.utils.book_new();
    
    // Get company info from localStorage
    const companyName = localStorage.getItem('companyName') || 'Company Name';
    let formattedAddress = 'N/A';
    try {
      const addr = JSON.parse(localStorage.getItem('companyAddress') || '{}');
      const parts = [];
      if (addr.street) parts.push(addr.street);
      if (addr.city || addr.zipCode) parts.push(`${addr.city}${addr.city && addr.zipCode ? ', ' : ''}${addr.zipCode}`);
      if (addr.country) parts.push(addr.country);
      formattedAddress = parts.join(' | ') || 'N/A';
    } catch {
      formattedAddress = localStorage.getItem('companyAddress') || 'N/A';
    }
    
    // Prepare headers
    const headers = [
      'Category', 'Item', 'Unit',
      'Estimated Qty', 'Estimated Rate', `Estimated Amount (${currency})`,
      'Requisitioned Qty', 'Requisitioned Rate', `Requisitioned Amount (${currency})`,
      'Purchased Qty', 'Purchased Rate', `Purchased Amount (${currency})`,
      'Received Qty', 'Received Rate', `Received Amount (${currency})`,
      'Issued Qty', 'Issued Rate', `Issued Amount (${currency})`
    ];
    
    // Prepare data rows
    const dataRows = reportData.map(row => [
      row.category || '',
      row.item || '',
      row.unit || '',
      Math.round(row.estimatedQty || 0),
      Math.round(row.estimateRate || 0),
      (row.estimateAmount || 0).toFixed(2),
      Math.round(row.requisitionQty || 0),
      Math.round(row.avgRequisitionRate || 0),
      (row.requisitionAmount || 0).toFixed(2),
      Math.round(row.purchasedQty || 0),
      Math.round(row.purchaseRate || 0),
      (row.purchaseAmount || 0).toFixed(2),
      Math.round(row.receivedQty || 0),
      Math.round(row.receivedRate || 0),
      (row.receivedAmount || 0).toFixed(2),
      Math.round(row.issuedQty || 0),
      Math.round(row.issueRate || 0),
      (row.issueAmount || 0).toFixed(2)
    ]);
    
    // Combine all data with company header
    const wsData = [
      // Company Name Header
      [companyName, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      // Address
      [formattedAddress, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      // Project Name
      [`Project: ${selectedProjectName || 'N/A'}`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      // Empty row
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      // Column headers
      headers,
      // Data rows
      ...dataRows
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Category
      { wch: 25 }, // Item
      { wch: 8 },  // Unit
      { wch: 12 }, // Est Qty
      { wch: 12 }, // Est Rate
      { wch: 18 }, // Est Amount
      { wch: 12 }, // Req Qty
      { wch: 12 }, // Req Rate
      { wch: 18 }, // Req Amount
      { wch: 12 }, // Pur Qty
      { wch: 12 }, // Pur Rate
      { wch: 18 }, // Pur Amount
      { wch: 12 }, // Rec Qty
      { wch: 12 }, // Rec Rate
      { wch: 18 }, // Rec Amount
      { wch: 12 }, // Iss Qty
      { wch: 12 }, // Iss Rate
      { wch: 18 }  // Iss Amount
    ];
    
    // Merge cells for company name, address, and project name
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 17 } }, // Company name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 17 } }, // Address
      { s: { r: 2, c: 0 }, e: { r: 2, c: 17 } }  // Project name
    ];
    
    // Style company name (Row 1)
    const companyNameStyle = {
      font: { bold: true, sz: 16, color: { rgb: '000000' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'E3F2FD' } }
    };
    for (let C = 0; C < 18; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { v: '', t: 's' };
      ws[cellAddress].s = companyNameStyle;
    }
    
    // Style address (Row 2)
    const addressStyle = {
      font: { sz: 11, color: { rgb: '000000' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'E3F2FD' } }
    };
    for (let C = 0; C < 18; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { v: '', t: 's' };
      ws[cellAddress].s = addressStyle;
    }
    
    // Style project name (Row 3)
    const projectStyle = {
      font: { bold: true, sz: 12, color: { rgb: '000000' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'FFF3E0' } }
    };
    for (let C = 0; C < 18; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { v: '', t: 's' };
      ws[cellAddress].s = projectStyle;
    }
    
    // Style header row (Row 5 - index 4)
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
    
    // Apply header styles
    for (let C = 0; C < headers.length; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 4, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = headerStyle;
    }
    
    // Style data rows with alternating colors and group backgrounds (starting from row 6 - index 5)
    for (let R = 5; R < 5 + dataRows.length; R++) {
      for (let C = 0; C < headers.length; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        let bgColor = R % 2 === 0 ? 'FFFFFF' : 'F8F9FA';
        
        // Group-specific background colors
        if (C >= 3 && C <= 5) bgColor = 'E3F2FD'; // Estimated - light blue
        else if (C >= 6 && C <= 8) bgColor = 'F3E5F5'; // Requisitioned - light purple
        else if (C >= 9 && C <= 11) bgColor = 'FFF3E0'; // Purchased - light orange
        else if (C >= 12 && C <= 14) bgColor = 'E8F5E9'; // Received - light green
        else if (C >= 15 && C <= 17) bgColor = 'FCE4EC'; // Issued - light pink
        
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: C <= 2 ? 'left' : 'right', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          },
          numFmt: (C === 5 || C === 8 || C === 11 || C === 14 || C === 17) ? '#,##0.00' : (C > 2 ? '#,##0' : '@')
        };
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Movement');
    XLSX.writeFile(wb, `Inventory_Movement_${selectedProjectName || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`, { cellStyles: true });
  };

  return (
    <Container fluid className="py-4">
      <style>{`
        .ag-theme-alpine .ag-header-cell[col-id="unit"],
        .ag-theme-alpine .ag-cell[col-id="unit"],
        .ag-theme-alpine .ag-header-cell[col-id="estimateAmount"],
        .ag-theme-alpine .ag-cell[col-id="estimateAmount"],
        .ag-theme-alpine .ag-header-cell[col-id="purchaseAmount"],
        .ag-theme-alpine .ag-cell[col-id="purchaseAmount"],
        .ag-theme-alpine .ag-header-cell[col-id="receivedAmount"],
        .ag-theme-alpine .ag-cell[col-id="receivedAmount"],
        .ag-theme-alpine .ag-header-cell[col-id="issueAmount"],
        .ag-theme-alpine .ag-cell[col-id="issueAmount"] {
          border-right: 2px solid #ccc !important;
        }
        
        /* Filter popup styling for better visibility */
        .ag-theme-alpine .ag-filter {
          background-color: white !important;
          border: 1px solid #ccc !important;
        }
        
        .ag-theme-alpine .ag-filter-wrapper {
          background-color: white !important;
        }
        
        .ag-theme-alpine .ag-input-field-input {
          background-color: white !important;
          color: #000 !important;
          border: 2px solid #0d6efd !important;
          padding: 8px !important;
          font-size: 14px !important;
          border-radius: 4px !important;
        }
        
        .ag-theme-alpine .ag-input-field-input::placeholder {
          color: #6c757d !important;
          opacity: 0.7 !important;
        }
        
        .ag-theme-alpine .ag-input-field-input:focus {
          border-color: #0d6efd !important;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25) !important;
          outline: none !important;
        }
        
        .ag-theme-alpine .ag-select {
          background-color: white !important;
          color: #000 !important;
          border: 2px solid #0d6efd !important;
          border-radius: 4px !important;
          font-size: 14px !important;
          padding: 6px !important;
        }
        
        .ag-theme-alpine .ag-filter-body-wrapper {
          background-color: white !important;
        }
        
        .ag-theme-alpine .ag-filter-condition {
          background-color: white !important;
        }
        
        .ag-theme-alpine .ag-filter-apply-panel-button {
          font-weight: 600 !important;
        }
      `}</style>
      <Card className="shadow">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">
            <i className="bi bi-arrow-left-right me-2"></i>
            Inventory Movement Report
          </h4>
        </Card.Header>
        <Card.Body>
          {/* Alert Messages */}
          {alertMessage.show && (
            <Alert 
              variant={alertMessage.type} 
              onClose={() => setAlertMessage({ show: false, type: '', message: '' })} 
              dismissible
              className="mb-3"
            >
              {alertMessage.message}
            </Alert>
          )}

          {/* Project Selection */}
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  Select Project <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={selectedProjectId}
                  onChange={handleProjectChange}
                  size="lg"
                >
                  <option value="">-- Select a Project --</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              {reportData.length > 0 && (
                <Button 
                  variant="success" 
                  onClick={exportToExcel}
                  className="d-flex align-items-center"
                  size="lg"
                >
                  <i className="bi bi-file-earmark-excel me-2"></i>
                  Export to Excel
                </Button>
              )}
            </Col>
          </Row>

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading inventory movement data...</p>
            </div>
          )}

          {/* AG Grid */}
          {!loading && reportData.length > 0 && (
            <div 
              className="ag-theme-alpine" 
              style={{ height: '600px', width: '100%' }}
            >
              <AgGridReact
                rowData={reportData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                animateRows={true}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[10, 20, 50, 100]}
                domLayout='normal'
                enableCellTextSelection={true}
                ensureDomOrder={true}
              />
            </div>
          )}

          {/* No Data Message */}
          {!loading && reportData.length === 0 && selectedProjectId && (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
              <p className="mt-3 text-muted">No inventory movement data found for the selected project.</p>
            </div>
          )}

          {/* Initial State */}
          {!loading && reportData.length === 0 && !selectedProjectId && (
            <div className="text-center py-5">
              <i className="bi bi-arrow-down-circle" style={{ fontSize: '4rem', color: '#ccc' }}></i>
              <p className="mt-3 text-muted">Please select a project to view inventory movement report.</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InventoryMovement;
