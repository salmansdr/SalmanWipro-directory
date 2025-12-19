import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Badge, Modal } from 'react-bootstrap';
import { FaChevronDown, FaChevronRight, FaFilePdf, FaFilter } from 'react-icons/fa';
import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 10,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    padding: 5,
    backgroundColor: '#e8e8e8',
  },
  filterInfo: {
    fontSize: 9,
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  filterLabel: {
    width: '30%',
    fontWeight: 'bold',
  },
  filterValue: {
    width: '70%',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0d6efd',
    color: '#ffffff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #dee2e6',
    padding: 6,
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #dee2e6',
    padding: 6,
    fontSize: 9,
    backgroundColor: '#f8f9fa',
  },
  col1: { width: '5%' },
  col2: { width: '25%' },
  col3: { width: '25%' },
  col4: { width: '15%', textAlign: 'center' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  // Detail view columns
  detailHeader: {
    flexDirection: 'row',
    backgroundColor: '#6c757d',
    color: '#ffffff',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 9,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e9ecef',
    padding: 5,
    fontSize: 8,
    backgroundColor: '#ffffff',
    marginLeft: 20,
  },
  detailCol1: { width: '15%', textAlign: 'center' },
  detailCol2: { width: '15%', textAlign: 'center' },
  detailCol3: { width: '20%', textAlign: 'center' },
  detailCol4: { width: '15%', textAlign: 'right' },
  detailCol5: { width: '15%', textAlign: 'right' },
  detailCol6: { width: '20%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#6c757d',
    borderTop: '1 solid #dee2e6',
    paddingTop: 10,
  },
  summarySection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e7f3ff',
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 3,
    fontSize: 9,
  },
  summaryLabel: {
    width: '50%',
    fontWeight: 'bold',
  },
  summaryValue: {
    width: '50%',
    textAlign: 'right',
  },
});

// PDF Document Component
const StockDetailsPDF = ({ inventoryData, filters, showDetails }) => {
  const companyName = localStorage.getItem('companyName') || 'Company Name';
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  

  

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.companyName}>{companyName}</Text>
        </View>

        {/* Title */}
        <View style={pdfStyles.title}>
          <Text>STOCK  REPORT</Text>
        </View>

        {/* Filter Information */}
        <View style={pdfStyles.filterInfo}>
          {filters.locationName && (
            <View style={pdfStyles.filterRow}>
              <Text style={pdfStyles.filterLabel}>Location:</Text>
              <Text style={pdfStyles.filterValue}>{filters.locationName}</Text>
            </View>
          )}
          {filters.itemName && (
            <View style={pdfStyles.filterRow}>
              <Text style={pdfStyles.filterLabel}>Item:</Text>
              <Text style={pdfStyles.filterValue}>{filters.itemName}</Text>
            </View>
          )}
          {(filters.startDate || filters.endDate) && (
            <View style={pdfStyles.filterRow}>
              <Text style={pdfStyles.filterLabel}>Date Range:</Text>
              <Text style={pdfStyles.filterValue}>
                {filters.startDate ? formatDate(filters.startDate) : 'Start'} to {filters.endDate ? formatDate(filters.endDate) : 'End'}
              </Text>
            </View>
          )}
          <View style={pdfStyles.filterRow}>
            <Text style={pdfStyles.filterLabel}>Report Type:</Text>
            <Text style={pdfStyles.filterValue}>{showDetails ? 'Detailed' : 'Summary'}</Text>
          </View>
        </View>

        {/* Summary Table */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.col1}>S/N</Text>
            <Text style={pdfStyles.col2}>Location</Text>
            <Text style={pdfStyles.col3}>Item Name</Text>
            
            <Text style={pdfStyles.col5}>Total In</Text>
            <Text style={pdfStyles.col6}>Total Out</Text>
            <Text style={pdfStyles.col5}>Net Stock</Text>
            <Text style={pdfStyles.col4}>Unit</Text>
          </View>

          {inventoryData.map((item, index) => (
            <View key={index}>
              <View style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
                <Text style={pdfStyles.col1}>{index + 1}</Text>
                <Text style={pdfStyles.col2}>{item.locationName}</Text>
                <Text style={pdfStyles.col3}>{item.itemName}</Text>
               
                <Text style={pdfStyles.col5}>{item.summary.totalInQty.toFixed(2)}</Text>
                <Text style={pdfStyles.col6}>{item.summary.totalOutQty.toFixed(2)}</Text>
                <Text style={pdfStyles.col5}>{item.summary.netStockQty.toFixed(2)}</Text>
                 <Text style={pdfStyles.col4}>{item.summary.unit}</Text>
              </View>

              {/* Transaction Details (if showDetails is true) */}
              {showDetails && item.transactions && item.transactions.length > 0 && (
                <View style={{ marginLeft: 15, marginTop: 3, marginBottom: 5 }}>
                  <View style={pdfStyles.detailHeader}>
                    <Text style={pdfStyles.detailCol1}>Date</Text>
                    <Text style={pdfStyles.detailCol2}>Type</Text>
                   
                    <Text style={pdfStyles.detailCol4}>In Qty</Text>
                    <Text style={pdfStyles.detailCol5}>Out Qty</Text>
                     <Text style={pdfStyles.detailCol3}>Unit</Text>
                  </View>
                  {item.transactions.map((txn, txnIndex) => (
                    <View key={txnIndex} style={pdfStyles.detailRow}>
                      <Text style={pdfStyles.detailCol1}>{formatDate(txn.referenceDate)}</Text>
                      <Text style={pdfStyles.detailCol2}>{txn.transactionType}</Text>
                      
                      <Text style={pdfStyles.detailCol4}>{txn.inQty.toFixed(2)}</Text>
                      <Text style={pdfStyles.detailCol5}>{txn.outQty.toFixed(2)}</Text>
                      <Text style={pdfStyles.detailCol3}>{txn.unit}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Summary Section */}
       

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text>Generated on: {new Date().toLocaleString('en-GB')} | Stock Details Report</Text>
        </View>
      </Page>
    </Document>
  );
};

const StockDetails = () => {
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5555';
  
  const [inventoryData, setInventoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    locationId: '',
    locationName: '',
    itemName: '',
    startDate: '',
    endDate: ''
  });
  
  // PDF modal states
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfDetailView, setPdfDetailView] = useState(false);

  const loadLocations = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/Locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }, [apiBaseUrl]);

  const loadInventoryData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/MaterialReceived/inventory-by-location-detailed`);
      if (response.ok) {
        const data = await response.json();
        setInventoryData(data.inventory || []);
        
        // Extract unique items
        const uniqueItems = [...new Set(data.inventory.map(item => item.itemName))];
        setItems(uniqueItems);
      } else {
        setError('Failed to load inventory data');
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setError('Error loading inventory data');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const applyFilters = useCallback(() => {
    let filtered = [...inventoryData];

    // Filter by location
    if (filters.locationId) {
      filtered = filtered.filter(item => item.locationId === filters.locationId);
    }

    // Filter by item name
    if (filters.itemName) {
      filtered = filtered.filter(item => item.itemName === filters.itemName);
    }

    // Filter by date range (applied to transactions)
    if (filters.startDate || filters.endDate) {
      filtered = filtered.map(item => {
        const filteredTransactions = item.transactions.filter(txn => {
          const txnDate = new Date(txn.referenceDate);
          const startDate = filters.startDate ? new Date(filters.startDate) : null;
          const endDate = filters.endDate ? new Date(filters.endDate) : null;

          if (startDate && txnDate < startDate) return false;
          if (endDate && txnDate > endDate) return false;
          return true;
        });

        // Recalculate summary for filtered transactions
        const totalInQty = filteredTransactions.reduce((sum, txn) => sum + txn.inQty, 0);
        const totalOutQty = filteredTransactions.reduce((sum, txn) => sum + txn.outQty, 0);
        const netStockQty = totalInQty - totalOutQty;

        return {
          ...item,
          transactions: filteredTransactions,
          summary: {
            ...item.summary,
            totalInQty,
            totalOutQty,
            netStockQty
          }
        };
      }).filter(item => item.transactions.length > 0);
    }

    setFilteredData(filtered);
  }, [inventoryData, filters]);

  useEffect(() => {
    loadLocations();
    loadInventoryData();
  }, [loadLocations, loadInventoryData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (field, value) => {
    if (field === 'locationId') {
      const selectedLocation = locations.find(loc => loc._id === value);
      setFilters(prev => ({
        ...prev,
        locationId: value,
        locationName: selectedLocation ? selectedLocation.locationName : ''
      }));
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleClearFilters = () => {
    setFilters({
      locationId: '',
      locationName: '',
      itemName: '',
      startDate: '',
      endDate: ''
    });
  };

  const toggleRow = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleShowPDF = (detailView) => {
    setPdfDetailView(detailView);
    setShowPDFModal(true);
  };

  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">
            <i className="bi bi-box-seam me-2"></i>
            Stock Details Report
          </h4>
        </Card.Header>
        <Card.Body>
          {/* Filters Section */}
          <Card className="mb-4 border-primary">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <FaFilter className="me-2" />
                Filters
              </h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Location</Form.Label>
                    <Form.Select
                      value={filters.locationId}
                      onChange={(e) => handleFilterChange('locationId', e.target.value)}
                    >
                      <option value="">All Locations</option>
                      {locations.map(loc => (
                        <option key={loc._id} value={loc._id}>
                          {loc.locationName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Item Name</Form.Label>
                    <Form.Select
                      value={filters.itemName}
                      onChange={(e) => handleFilterChange('itemName', e.target.value)}
                    >
                      <option value="">All Items</option>
                      {items.map((item, idx) => (
                        <option key={idx} value={item}>
                          {item}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button variant="secondary" onClick={handleClearFilters} className="w-100">
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <div className="d-flex justify-content-between align-items-center mb-3">
           
            <div>
              <Button variant="outline-danger" size="sm" className="me-2" onClick={() => handleShowPDF(false)}>
                <FaFilePdf className="me-1" /> PDF Summary
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleShowPDF(true)}>
                <FaFilePdf className="me-1" /> PDF Detailed
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* Data Table */}
          {!loading && filteredData.length > 0 && (
            <div className="table-responsive">
              <Table hover bordered className="align-middle">
                <thead className="table-primary">
                  <tr>
                    <th style={{ width: '50px' }}></th>
                    <th>Location</th>
                    <th>Item Name</th>
                   
                    <th className="text-end">Total In</th>
                    <th className="text-end">Total Out</th>
                    <th className="text-end">Net Stock</th>
                     <th className="text-center">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <React.Fragment key={index}>
                      {/* Summary Row */}
                      <tr 
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleRow(index)}
                        className={expandedRows[index] ? 'table-active' : ''}
                      >
                        <td className="text-center">
                          {expandedRows[index] ? <FaChevronDown /> : <FaChevronRight />}
                        </td>
                        <td>{item.locationName}</td>
                        <td>{item.itemName}</td>
                       
                        <td className="text-end">
                          {item.summary.totalInQty.toFixed(2)}
                        </td>
                        <td className="text-end">
                          {item.summary.totalOutQty.toFixed(2)}
                        </td>
                        <td className="text-end">
                          <strong className={item.summary.netStockQty < 0 ? 'text-danger' : 'text-success'}>
                            {item.summary.netStockQty.toFixed(2)}
                          </strong>
                        </td>
                         <td className="text-center">
                          <Badge bg="secondary">{item.summary.unit}</Badge>
                        </td>
                      </tr>

                      {/* Expanded Transaction Details */}
                      {expandedRows[index] && (
                        <tr>
                          <td colSpan="7" className="p-0">
                            <div className="bg-light p-3">
                              <h6 className="text-muted mb-3">Transaction History</h6>
                              <Table size="sm" bordered className="mb-0">
                                <thead className="table-secondary">
                                  <tr>
                                    <th className="text-center">Date</th>
                                    <th className="text-center">Transaction Type</th>
                                    <th className="text-center">Unit</th>
                                    <th className="text-end">In Qty</th>
                                    <th className="text-end">Out Qty</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.transactions.map((txn, txnIndex) => (
                                    <tr key={txnIndex}>
                                      <td className="text-center">
                                        {new Date(txn.referenceDate).toLocaleDateString('en-GB')}
                                      </td>
                                      <td className="text-center">
                                        <Badge bg={txn.transactionType === 'Receipt' ? 'success' : 'warning'}>
                                          {txn.transactionType}
                                        </Badge>
                                      </td>
                                      <td className="text-center">{txn.unit}</td>
                                      <td className="text-end text-success">
                                        {txn.inQty > 0 ? txn.inQty.toFixed(2) : '-'}
                                      </td>
                                      <td className="text-end text-danger">
                                        {txn.outQty > 0 ? txn.outQty.toFixed(2) : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {/* No Data State */}
          {!loading && filteredData.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
              <p className="text-muted mt-3">No stock data available</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* PDF Modal */}
      <Modal show={showPDFModal} onHide={() => setShowPDFModal(false)} size="xl" fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>Stock Details Report - {pdfDetailView ? 'Detailed View' : 'Summary View'}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: 'calc(100vh - 120px)' }}>
          {showPDFModal && (
            <PDFViewer style={{ width: '100%', height: '100%' }}>
              <StockDetailsPDF 
                inventoryData={filteredData} 
                filters={filters}
                showDetails={pdfDetailView}
              />
            </PDFViewer>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default StockDetails;
