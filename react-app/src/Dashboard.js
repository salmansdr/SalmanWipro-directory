import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Alert, Spinner } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [projectsData, setProjectsData] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const currency = localStorage.getItem('companyCurrency') || 'Rs';

  // Load dashboard data for all projects
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/ProjectEstimation/inventory-dashboard`);
      
      if (response.ok) {
        const result = await response.json();
        // Handle both direct array and {data: []} response formats
        const data = result.data || result;
        setProjectsData(Array.isArray(data) ? data : []);
        setAlertMessage({ show: false, type: '', message: '' });
      } else {
        setProjectsData([]);
        setAlertMessage({ show: true, type: 'danger', message: 'Failed to load dashboard data' });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setProjectsData([]);
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filter projects based on selection
  const filteredProjects = selectedProject === 'all' 
    ? projectsData 
    : projectsData.filter(p => p.projectName === selectedProject);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Format number
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Prepare chart data
  const getCostBreakdownData = (summary) => {
    if (!summary) return null;

    const { totalmaterialEstimatedAmount, totalEstimatedLabourAmount, totalEstimatedOtherExpense } = summary;

    return {
      labels: ['Material Cost', 'Labour Cost', 'Other Expenses'],
      datasets: [{
        data: [totalmaterialEstimatedAmount || 0, totalEstimatedLabourAmount || 0, totalEstimatedOtherExpense || 0],
        backgroundColor: ['#4472C4', '#ED7D31', '#A5A5A5'],
        borderColor: ['#fff', '#fff', '#fff'],
        borderWidth: 2
      }]
    };
  };

  const getMaterialFlowData = (summary) => {
    if (!summary) return null;

    const { 
      totalmaterialEstimatedAmount, 
      totalmaterialRequisitionAmount, 
      totalmaterialPurchasedAmount, 
      totalmaterialReceivedAmount, 
      totalmaterialIssuedAmount 
    } = summary;

    return {
      labels: ['Estimated', 'Requisitioned', 'Purchased', 'Received', 'Issued'],
      datasets: [{
        label: `Amount (${currency})`,
        data: [
          totalmaterialEstimatedAmount || 0, 
          totalmaterialRequisitionAmount || 0, 
          totalmaterialPurchasedAmount || 0, 
          totalmaterialReceivedAmount || 0, 
          totalmaterialIssuedAmount || 0
        ],
        backgroundColor: ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE'],
        borderColor: ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE'],
        borderWidth: 1
      }]
    };
  };

  

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += currency + ' ' + formatCurrency(context.parsed);
            }
            return label;
          }
        }
      }
    }
  };

  // Floor-wise Estimated vs Actual comparison
  const getFloorWiseComparisonData = (floorWiseSummary) => {
    if (!floorWiseSummary || !Array.isArray(floorWiseSummary.floors)) return null;
    const floors = floorWiseSummary.floors;
    const labels = floors.map(f => f.floorName || 'Unknown');
    const estimated = floors.map(f => (f.totalmaterialEstimatedAmount || 0) + (f.totalEstimatedLabourAmount || 0));
    const actual = floors.map(f => (f.totalmaterialPurchasedAmount || 0) + (f.totalActualLabourAmount || 0));

    return {
      labels,
      datasets: [
        {
          label: 'Estimated Cost',
          data: estimated,
          backgroundColor: 'rgba(68,114,196,0.85)'
        },
        {
          label: 'Actual Expense',
          data: actual,
          backgroundColor: 'rgba(255,107,107,0.85)'
        }
      ]
    };
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return currency + ' ' + formatNumber(value);
          }
        }
      }
    }
  };

  const floorBarOptions = {
    ...barChartOptions,
    plugins: {
      ...barChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context) {
            const val = context.parsed && (context.parsed.y !== undefined ? context.parsed.y : context.parsed);
            return (context.dataset.label || '') + ': ' + currency + ' ' + formatCurrency(val);
          }
        }
      }
    }
  };

  return (
    <Container fluid className="py-4">
      <Card className="shadow mb-4">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">
            <i className="bi bi-speedometer2 me-2"></i>
            Project Dashboard
          </h4>
        </Card.Header>
        <Card.Body>
          {/* Alert Message */}
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

          {/* Project Filter */}
          {!loading && projectsData.length > 0 && (
            <Row className="mb-4">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    <i className="bi bi-funnel me-2"></i>
                    Filter by Project
                  </Form.Label>
                  <Form.Select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="shadow-sm"
                  >
                    <option value="all">All Projects</option>
                    {projectsData.map((project, idx) => (
                      <option key={idx} value={project.projectName}>
                        {project.projectName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading dashboard data...</p>
            </div>
          )}

          {/* Dashboard Content - Loop through filtered projects */}
          {!loading && filteredProjects.length > 0 && (
            <>
              {filteredProjects.map((projectData, index) => (
                <div key={index} className="mb-5">
                  {/* Project Header */}
                  <Card className="border-0 shadow-sm mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body>
                      <h4 className="mb-0 text-primary">
                        <i className="bi bi-building me-2"></i>
                        {projectData.projectName || 'Unnamed Project'}
                      </h4>
                    </Card.Body>
                  </Card>

                  {/* Estimated Metrics - First Row */}
                  <Row className="mb-4">
                    <Col lg={3} md={6} className="mb-3">
                      <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #4472C4' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Estimated Project Cost(Material+Labour)</p>
                              <h4 className="mb-0 fw-bold">{currency} {formatCurrency(projectData.summary?.totalmaterialEstimatedAmount+projectData.summary?.totalEstimatedLabourAmount)}</h4>
                            </div>
                           
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-3">
                      <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #ED7D31' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Material Estimated</p>
                              <h4 className="mb-0 fw-bold">{currency} {formatCurrency(projectData.summary?.totalmaterialEstimatedAmount)}</h4>
                            </div>
                            
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-3">
                      <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #FFC000' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Labour Estimated</p>
                              <h4 className="mb-0 fw-bold">{currency} {formatCurrency(projectData.summary?.totalEstimatedLabourAmount)}</h4>
                            </div>
                            
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-3">
                      <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #A5A5A5' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Other Expenses</p>
                              <h4 className="mb-0 fw-bold">{currency} {formatCurrency(projectData.summary?.totalEstimatedOtherExpense)}</h4>
                            </div>
                           
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>


                  {/* Actual/Transaction Metrics - Second Row */}
                  <Row className="mb-4">
                    <Col lg={3} md={6} className="mb-3">
                      <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #FF6B6B' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Actual Expense (Till Now)</p>
                              <h4 className="mb-0 fw-bold">{currency} {formatCurrency((projectData.summary?.totalmaterialPurchasedAmount+projectData.summary?.totalActualLabourAmount || 0) )}</h4>
                            </div>
                           
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-3">
                      <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #70AD47' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Material Purchased</p>
                              <h4 className="mb-0 fw-bold">{currency} {formatCurrency(projectData.summary?.totalmaterialPurchasedAmount)}</h4>
                            </div>
                            
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-3">
                      <Card className="border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #FFC000' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Labour Cost</p>
                              <h4 className="mb-0 fw-bold">{currency} {formatCurrency(projectData.summary?.totalActualLabourAmount)}</h4>
                            </div>
                           
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={3} md={6} className="mb-3">
                      {/* Empty column for alignment */}
                    </Col>
                  </Row>

                  {/* Charts Row */}
                  <Row className="mb-4">
                    <Col lg={6} md={6} className="mb-4">
                      <Card className="shadow-sm h-100">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0 fw-bold">Cost Breakdown</h6>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: '300px' }}>
                            {getCostBreakdownData(projectData.summary) && (
                              <Pie data={getCostBreakdownData(projectData.summary)} options={chartOptions} />
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={6} md={6} className="mb-4">
                      <Card className="shadow-sm h-100">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0 fw-bold">Material Flow Analysis</h6>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: '300px' }}>
                            {getMaterialFlowData(projectData.summary) && (
                              <Bar data={getMaterialFlowData(projectData.summary)} options={barChartOptions} />
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Floor-wise Estimated vs Actual Chart - placed after Material Flow Analysis row */}
                  <Row className="mb-4">
                    <Col lg={12} className="mb-4">
                      <Card className="shadow-sm h-100">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0 fw-bold">Floor-wise: Estimated Cost vs Actual Expense</h6>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: '350px' }}>
                            {getFloorWiseComparisonData(projectData.floorWiseSummary) && (
                              <Bar data={getFloorWiseComparisonData(projectData.floorWiseSummary)} options={floorBarOptions} />
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Progress Indicators */}
                  <Row>
                    <Col lg={6} className="mb-3">
                      <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0 fw-bold">Purchase Progress</h6>
                        </Card.Header>
                        <Card.Body>
                          {(() => {
                            const estimated = projectData.summary?.totalmaterialEstimatedAmount || 1;
                            const purchased = projectData.summary?.totalmaterialPurchasedAmount || 0;
                            const percentage = ((purchased / estimated) * 100).toFixed(2);
                            return (
                              <>
                                <div className="d-flex justify-content-between mb-2">
                                  <span>Purchased vs Estimated</span>
                                  <span className="fw-bold">{percentage}%</span>
                                </div>
                                <div className="progress" style={{ height: '25px' }}>
                                  <div 
                                    className="progress-bar bg-success" 
                                    role="progressbar" 
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                    aria-valuenow={percentage} 
                                    aria-valuemin="0" 
                                    aria-valuemax="100"
                                  >
                                    {percentage}%
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between mt-2 small text-muted">
                                  <span>Estimated: {currency} {formatCurrency(estimated)}</span>
                                  <span>Purchased: {currency} {formatCurrency(purchased)}</span>
                                </div>
                              </>
                            );
                          })()}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col lg={6} className="mb-3">
                      <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0 fw-bold">Receiving Progress</h6>
                        </Card.Header>
                        <Card.Body>
                          {(() => {
                            const purchased = projectData.summary?.totalmaterialPurchasedAmount || 1;
                            const received = projectData.summary?.totalmaterialReceivedAmount || 0;
                            const percentage = ((received / purchased) * 100).toFixed(2);
                            return (
                              <>
                                <div className="d-flex justify-content-between mb-2">
                                  <span>Received vs Purchased</span>
                                  <span className="fw-bold">{percentage}%</span>
                                </div>
                                <div className="progress" style={{ height: '25px' }}>
                                  <div 
                                    className="progress-bar bg-info" 
                                    role="progressbar" 
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                    aria-valuenow={percentage} 
                                    aria-valuemin="0" 
                                    aria-valuemax="100"
                                  >
                                    {percentage}%
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between mt-2 small text-muted">
                                  <span>Purchased: {currency} {formatCurrency(purchased)}</span>
                                  <span>Received: {currency} {formatCurrency(received)}</span>
                                </div>
                              </>
                            );
                          })()}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Divider between projects */}
                  {index < filteredProjects.length - 1 && <hr className="my-5" style={{ borderTop: '2px solid #dee2e6' }} />}
                </div>
              ))}
            </>
          )}

          {/* No Data */}
          {!loading && filteredProjects.length === 0 && projectsData.length > 0 && (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
              <p className="mt-3 text-muted">No projects match the selected filter.</p>
            </div>
          )}

          {!loading && projectsData.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
              <p className="mt-3 text-muted">No dashboard data available.</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard;
