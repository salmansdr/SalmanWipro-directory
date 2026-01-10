import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from './api/axiosClient';
import { Container, Row, Col, Card, Form, Alert, Spinner, Modal, Table, Button } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie, Bar } from 'react-chartjs-2';
import Reports from './Reports';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const Dashboard = () => {
  const [projectsData, setProjectsData] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [selectedFloorData, setSelectedFloorData] = useState(null);
  const [showMaterialFlowModal, setShowMaterialFlowModal] = useState(false);
  const [selectedMaterialFlowData, setSelectedMaterialFlowData] = useState(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  //const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const currency = localStorage.getItem('companyCurrency') || 'Rs';

  // Callback for when Reports component data is loaded
  const handleReportsDataLoaded = useCallback(() => {
    setReportsLoading(false);
  }, []);

  // Load dashboard data for all projects
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await axiosClient.get('/api/ProjectEstimation/inventory-dashboard');
      // axios returns the parsed response in resp.data
      const result = resp.data;
      const data = result?.data || result;
      setProjectsData(Array.isArray(data) ? data : []);
      setAlertMessage({ show: false, type: '', message: '' });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setProjectsData([]);
      setAlertMessage({ show: true, type: 'danger', message: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

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

    // Use optional chaining and ensure numeric values with proper fallback
    const estimated = Number(summary.totalmaterialEstimatedAmount) || 0;
    const requisitioned = Number(summary.totalmaterialRequisitionAmount) || 0;
    const purchased = Number(summary.totalmaterialPurchasedAmount) || 0;
    const received = Number(summary.totalmaterialReceivedAmount) || 0;
    const issued = Number(summary.totalmaterialIssuedAmount) || 0;

    return {
      labels: ['Estimated', 'Requisitioned', 'Purchased', 'Received', 'Issued'],
      datasets: [{
        label: `Amount (${currency})`,
        data: [estimated, requisitioned, purchased, received, issued],
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
        enabled: false // Disable tooltips since values are displayed on chart
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 13
        },
        formatter: function(value, context) {
          if (value === 0) return '';
          return formatNumber(value);
        }
      }
    }
  };

  // Floor-wise Estimated vs Actual comparison with completion percentage
  const getFloorWiseComparisonData = (componentWiseSummary, floorWiseSummary) => {
    if (!floorWiseSummary || !Array.isArray(floorWiseSummary.floors)) return null;
    
    const floors = floorWiseSummary.floors;
    const labels = floors.map(f => f.floorName || 'Unknown');
    const estimated = floors.map(f => (f.totalmaterialEstimatedAmount || 0) + (f.totalEstimatedLabourAmount || 0));
    const actual = floors.map(f => (f.totalmaterialPurchasedAmount || 0) + (f.totalActualLabourAmount || 0));
    
    // Extract completion percentages from componentWiseSummary
    const completionPercentages = [];
    if (componentWiseSummary && Array.isArray(componentWiseSummary)) {
      floors.forEach(floor => {
        const floorData = componentWiseSummary.find(c => c.floor === floor.floorName);
        completionPercentages.push(floorData?.overallCompletion || 0);
      });
    } else {
      // Fallback to zeros if no completion data
      completionPercentages.push(...floors.map(() => 0));
    }

    return {
      labels,
      datasets: [
        {
          label: 'Estimated Cost',
          data: estimated,
          backgroundColor: 'rgba(68,114,196,0.85)',
          completionPercentages: completionPercentages // Store completion data for labels
        },
        {
          label: 'Actual Expense',
          data: actual,
          backgroundColor: 'rgba(255,107,107,0.85)',
          completionPercentages: completionPercentages // Store completion data for labels
        }
      ]
    };
  };

  // Helper function to handle material flow click
  const handleMaterialFlowClick = (dataIndex, projectData) => {
    const labels = ['Estimated', 'Requisitioned', 'Purchased', 'Received', 'Issued'];
    const clickedLabel = labels[dataIndex];
    
    // Don't show modal for Estimated
    if (clickedLabel === 'Estimated') return;
    
    let dataToShow = null;
    let dataTitle = '';
    
    if (clickedLabel === 'Requisitioned' && projectData.MaterialrequisitionData) {
      dataToShow = projectData.MaterialrequisitionData;
      dataTitle = 'Material Requisition Details';
    } else if (clickedLabel === 'Purchased' && projectData.MaterialpurchasedData) {
      dataToShow = projectData.MaterialpurchasedData;
      dataTitle = 'Material Purchased Details';
    } else if (clickedLabel === 'Received' && projectData.MaterialreceivedData) {
      dataToShow = projectData.MaterialreceivedData;
      dataTitle = 'Material Received Details';
    } else if (clickedLabel === 'Issued' && projectData.MaterialissuedData) {
      dataToShow = projectData.MaterialissuedData;
      dataTitle = 'Material Issued Details';
    }
    
    if (dataToShow && dataToShow.length > 0) {
      setSelectedMaterialFlowData({
        title: dataTitle,
        type: clickedLabel.toLowerCase(),
        data: dataToShow
      });
      setShowMaterialFlowModal(true);
    }
  };

  // Drag handlers for movable modal
  const handleMouseDown = (e) => {
    if (e.target.closest('.modal-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      });
    }
  };

  // Reset modal position when opening
  const openReportsModal = (projectData) => {
    setModalPosition({ x: 0, y: 0 });
    setSelectedProjectForReport(projectData);
    setShowReportsModal(true);
    setReportsLoading(true);
    
    // Simulate loading time for Reports component
    setTimeout(() => {
      setReportsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDragging) {
        setModalPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDragging, dragStart]);

  const createMaterialFlowOptions = (projectData) => ({
    ...chartOptions,
    onClick: (event, elements, chart) => {
      // Detect click on bars
      if (elements.length > 0) {
        const element = elements[0];
        const dataIndex = element.index;
        handleMaterialFlowClick(dataIndex, projectData);
        return;
      }
      
      // Detect click anywhere on chart (including labels)
      try {
        const canvasPosition = chart.canvas.getBoundingClientRect();
        const clickX = event.native.clientX - canvasPosition.left;
        
        const xScale = chart.scales.x;
        if (!xScale) return;
        
        // Get all label positions
        const labels = chart.data.labels || [];
        const numLabels = labels.length;
        
        // Calculate width per bar/label
        const totalWidth = xScale.right - xScale.left;
        const barWidth = totalWidth / numLabels;
        
        // Find which label area was clicked
        for (let i = 0; i < numLabels; i++) {
          const leftEdge = xScale.left + (i * barWidth);
          const rightEdge = leftEdge + barWidth;
          
          // Check if click X is within this label's area
          if (clickX >= leftEdge && clickX <= rightEdge) {
            handleMaterialFlowClick(i, projectData);
            return;
          }
        }
      } catch (error) {
        console.log('Click detection error:', error);
      }
    },
    scales: {
      x: {
        ticks: {
          color: function(context) {
            // Don't style 'Estimated' as clickable
            return context.index === 0 ? '#666' : '#0066cc';
          },
          font: function(context) {
            return {
              size: 11,
              weight: context.index === 0 ? 'normal' : 'bold',
              family: 'inherit'
            };
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return currency + ' ' + formatNumber(value);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        enabled: false // Disable tooltips since values are displayed on chart
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'top',
        formatter: function(value) {
          if (value === 0) return '';
          return formatNumber(value);
        },
        color: '#444',
        font: {
          weight: 'bold',
          size: 11
        },
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 3,
        padding: { top: 3, bottom: 3, left: 5, right: 5 }
      }
    }
  });

  // Function to create floor-specific options with click handler
  const createFloorBarOptions = (componentWiseSummary, floorWiseSummary) => ({
    ...chartOptions,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const floorIndex = element.index;
        const floorName = floorWiseSummary?.floors[floorIndex]?.floorName;
        
        // Find component data for this floor
        if (componentWiseSummary && Array.isArray(componentWiseSummary)) {
          const floorData = componentWiseSummary.find(c => c.floor === floorName);
          if (floorData && floorData.components) {
            setSelectedFloorData({
              floorName: floorName,
              components: floorData.components
            });
            setShowComponentModal(true);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return currency + ' ' + formatNumber(value);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 11 }
        }
      },
      tooltip: {
        enabled: false // Disable tooltips since values are displayed on chart
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'top',
        offset: function(context) {
          // Add more offset for Actual Expense to show completion above the value
          if (context.datasetIndex === 1) {
            return 15;
          }
          return 0;
        },
        formatter: function(value, context) {
          if (value === 0) return '';
          
          // For Actual Expense bars (dataset index 1), show completion first, then value
          if (context.datasetIndex === 1) {
            const completion = context.dataset.completionPercentages?.[context.dataIndex];
            // Show completion on top, value below
            return 'Completion: ' + Math.round(completion || 0) + '%\n' + formatNumber(value);
          }
          
          // For Estimated Cost bars (dataset index 0), show only value
          return formatNumber(value);
        },
        color: function(context) {
          // Different colors for different datasets
          return context.datasetIndex === 0 ? '#444' : '#2e7d32';
        },
        font: {
          weight: 'bold',
          size: 9,
          lineHeight: 1.3
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 4,
        padding: { top: 5, bottom: 5, left: 7, right: 7 },
        textAlign: 'center'
      }
    }
  });

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
                        <span className="ms-3 text-muted" style={{ fontSize: '0.9rem' }}>
                          {projectData.projectType ? `${projectData.projectType} • ` : ''}
                          {projectData.floors !== undefined && projectData.floors !== null ? `${formatNumber(projectData.floors)} floor${Number(projectData.floors) !== 1 ? 's' : ''} • ` : ''}
                          {`Land: ${projectData.landArea} • Area: ${formatNumber(projectData.constructionArea || 0)} sq ft`}
                        </span>
                      </h4>
                    </Card.Body>
                  </Card>

                  {/* Estimated Metrics - First Row */}
                  <Row className="mb-4">
                    <Col lg={3} md={6} className="mb-3">
                      <Card 
                        className="border-0 shadow-sm h-100" 
                        style={{ borderLeft: '4px solid #4472C4', cursor: 'pointer' }}
                        onClick={() => openReportsModal(projectData)}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div style={{ width: '100%' }}>
                              <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>
                                Estimated Project Cost(Material+Labour)
                                <i className="bi bi-box-arrow-up-right ms-2 text-primary" style={{ fontSize: '0.75rem' }}></i>
                              </p>
                              <h4 
                                className="mb-0 fw-bold" 
                                style={{ 
                                  color: '#0066cc',
                                  textDecoration: 'underline',
                                  textDecorationStyle: 'dotted',
                                  cursor: 'pointer'
                                }}
                              >
                                {currency} {formatCurrency(projectData.summary?.totalmaterialEstimatedAmount+projectData.summary?.totalEstimatedLabourAmount)}
                              </h4>
                              <small className="text-primary" style={{ fontStyle: 'italic' }}>
                                <i className="bi bi-hand-index-thumb me-1"></i>
                                Click to view detailed report
                              </small>
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
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            Click on bars or labels to view detailed breakdown
                          </small>
                        </Card.Header>
                        <Card.Body>
                          <div style={{ height: '300px', cursor: 'pointer' }}>
                            {getMaterialFlowData(projectData.summary) && (
                              <Bar data={getMaterialFlowData(projectData.summary)} options={createMaterialFlowOptions(projectData)} />
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
                          <div style={{ height: '350px', cursor: 'pointer' }}>
                            {getFloorWiseComparisonData(projectData.componentWiseSummary, projectData.floorWiseSummary) && (
                              <Bar data={getFloorWiseComparisonData(projectData.componentWiseSummary, projectData.floorWiseSummary)} options={createFloorBarOptions(projectData.componentWiseSummary, projectData.floorWiseSummary)} />
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

      {/* Component Details Modal */}
      <Modal show={showComponentModal} onHide={() => setShowComponentModal(false)} size="xl">
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            <i className="bi bi-list-check me-2"></i>
            Component Details - {selectedFloorData?.floorName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedFloorData && selectedFloorData.components && selectedFloorData.components.length > 0 && (
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0" style={{ fontSize: '0.9rem' }}>
                <thead style={{ backgroundColor: '#4472C4', color: 'white' }}>
                  <tr>
                    <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'center' }}>#</th>
                    <th style={{ fontWeight: '600', padding: '12px 8px' }}>Component Name</th>
                    <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Volume of Work</th>
                    <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'center' }}>Unit</th>
                    <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Weightage  (%)</th>
                    <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Actual Completion</th>
                    <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Completion (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFloorData.components.map((component, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                      <td style={{ padding: '10px 8px' }}>{component.component || 'N/A'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(component.volume || 0)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{component.unit || 'N/A'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{(component.workPercentage || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{(component.actualCompletion || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{(component.contributionPercentage || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          {(!selectedFloorData || !selectedFloorData.components || selectedFloorData.components.length === 0) && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3">No component data available</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light border-top">
          <Button variant="secondary" onClick={() => setShowComponentModal(false)} style={{ fontWeight: '500' }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Material Flow Details Modal */}
      <Modal show={showMaterialFlowModal} onHide={() => setShowMaterialFlowModal(false)} size="xl">
        <Modal.Header closeButton className="bg-light border-bottom">
          <Modal.Title style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            <i className="bi bi-box-seam me-2"></i>
            {selectedMaterialFlowData?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedMaterialFlowData && selectedMaterialFlowData.data && selectedMaterialFlowData.data.length > 0 && (
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0" style={{ fontSize: '0.9rem' }}>
                <thead style={{ backgroundColor: '#4472C4', color: 'white' }}>
                  <tr>
                    <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'center' }}>#</th>
                    <th style={{ fontWeight: '600', padding: '12px 8px' }}>Category</th>
                    <th style={{ fontWeight: '600', padding: '12px 8px' }}>Item</th>
                    {selectedMaterialFlowData.type === 'requisitioned' && (
                      <>
                        <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Requisition Qty</th>
                        <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Avg Rate</th>
                      </>
                    )}
                    {selectedMaterialFlowData.type === 'purchased' && (
                      <>
                        <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Purchased Qty</th>
                        <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Avg Purchase Rate</th>
                      </>
                    )}
                    {selectedMaterialFlowData.type === 'received' && (
                      <>
                        <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Received Qty</th>
                        <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Avg Received Rate</th>
                      </>
                    )}
                    {selectedMaterialFlowData.type === 'issued' && (
                      <>
                        <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Issued Qty</th>
                        <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Avg Issued Rate</th>
                      </>
                    )}
                    <th style={{ fontWeight: '600', padding: '12px 8px', textAlign: 'right' }}>Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMaterialFlowData.data.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                      <td style={{ padding: '10px 8px' }}>{item.category || 'N/A'}</td>
                      <td style={{ padding: '10px 8px' }}>{item.item || 'N/A'}</td>
                      {selectedMaterialFlowData.type === 'requisitioned' && (
                        <>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(item.requisitionQty || 0)}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(item.avgRequisitionRate || 0)}</td>
                        </>
                      )}
                      {selectedMaterialFlowData.type === 'purchased' && (
                        <>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(item.purchasedQty || 0)}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(item.avgPurchaseRate || 0)}</td>
                        </>
                      )}
                      {selectedMaterialFlowData.type === 'received' && (
                        <>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(item.receivedQty || 0)}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(item.avgReceivedRate || 0)}</td>
                        </>
                      )}
                      {selectedMaterialFlowData.type === 'issued' && (
                        <>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(item.issuedQty || 0)}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(item.avgIssuedRate || 0)}</td>
                        </>
                      )}
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>{formatNumber(item.amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          {(!selectedMaterialFlowData || !selectedMaterialFlowData.data || selectedMaterialFlowData.data.length === 0) && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
              <p className="mt-3">No data available</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light border-top">
          <Button variant="secondary" onClick={() => setShowMaterialFlowModal(false)} style={{ fontWeight: '500' }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reports Modal */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1050,
          display: showReportsModal ? 'block' : 'none',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowReportsModal(false);
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${modalPosition.x}px), calc(-50% + ${modalPosition.y}px))`,
            width: '90%',
            maxWidth: '1140px',
            backgroundColor: 'white',
            borderRadius: '0.3rem',
            boxShadow: '0 0.5rem 1rem rgba(0,0,0,0.15)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }}
        >
          <div 
            className="modal-header bg-primary text-white"
            style={{ 
              cursor: 'move',
              userSelect: 'none',
              padding: '1rem',
              borderTopLeftRadius: '0.3rem',
              borderTopRightRadius: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onMouseDown={handleMouseDown}
          >
            <h5 className="modal-title" style={{ margin: 0 }}>
              <i className="bi bi-arrows-move me-2"></i>
              <i className="bi bi-file-earmark-bar-graph me-2"></i>
              Cost Report - {selectedProjectForReport?.projectName || 'Project'}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => setShowReportsModal(false)}
              style={{ cursor: 'pointer' }}
            ></button>
          </div>
          <div className="modal-body p-0" style={{ maxHeight: 'calc(90vh - 60px)', overflowY: 'auto' }}>
            {reportsLoading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '400px' }}>
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                <p className="mt-3 text-muted">Loading estimation details...</p>
              </div>
            ) : (
              selectedProjectForReport && (
                <Reports 
                  isModal={true}
                  preSelectedProjectId={selectedProjectForReport.projectId}
                  preSelectedProjectName={selectedProjectForReport.projectName}
                  onDataLoaded={handleReportsDataLoaded}
                />
              )
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Dashboard;
