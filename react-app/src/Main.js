import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosClient from './api/axiosClient';
import { getPagePermissions } from './utils/menuSecurity';
import './Styles/Main.css';

function Main() {
  const navigate = useNavigate();
  const requisitionPermissions = getPagePermissions('Requisition');
  const purchaseOrdersPermissions = getPagePermissions('Purchase Orders');
  const userId = localStorage.getItem('userId');
  const companyCurrency = localStorage.getItem('companyCurrency') || '₹';
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPendingRequisitions, setUserPendingRequisitions] = useState([]);
  const [userPendingPurchaseOrders, setUserPendingPurchaseOrders] = useState([]);
  const [delayedPurchaseOrders, setDelayedPurchaseOrders] = useState([]);
  const [openRequisitions, setOpenRequisitions] = useState([]);
  const [openPurchaseOrders, setOpenPurchaseOrders] = useState([]);
  const [showOpenRequisitionsModal, setShowOpenRequisitionsModal] = useState(false);
  const [showDelayedPOModal, setShowDelayedPOModal] = useState(false);
  const [showOpenPOModal, setShowOpenPOModal] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    estimation: {
      totalEstimatedProjectCost: 0,
      totalmaterialEstimatedAmount: 0,
      totalEstimatedLabourAmount: 0,
      totalEstimatedOtherExpense: 0,
      totalComponentsCount: 0,
      totalmaterialPurchasedAmount: 0,
      totalmaterialReceivedAmount: 0,
      lastEstimationModifiedDate: null
    },
    requisition: {
      totalRequisitions: 0,
      pendingApprovalCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      draftCount: 0,
      approvedTotalAmount: 0,
      openRequisitionsCount: 0
    },
    purchaseOrders: {
      totalPurchaseOrders: 0,
      pendingApprovalCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      draftCount: 0,
      approvedTotalAmount: 0,
      openPOCount: 0,
      delayedPOCount: 0
    },
    materialReceipt: {
      receivedToday: 0,
      itemsCount: 0,
      pendingReceipts: 0,
      matchedWithPO: 0,
      hasReceipts: false,
      status: 'Active'
    },
    issueRegister: {
      issuedToday: 0,
      itemsCount: 0,
      pendingReturns: 0,
      activeProjects: 0,
      totalValue: 0,
      floorWiseSummary: {},
      lastIssued: null
    }
  });

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const companyId = localStorage.getItem('selectedCompanyId');
        if (!companyId) {
          console.error('Company ID not found in localStorage');
          setLoading(false);
          return;
        }
        
        const response = await axiosClient.get(`/api/Projects/basic?companyId=${companyId}`);
        const data = response.data?.data || response.data || [];
        setProjects(Array.isArray(data) ? data : []);
        
        // Check for previously selected project in localStorage
        const savedProjectId = localStorage.getItem(`selectedProject_${userId}`);
        
        if (data && data.length > 0) {
          // If saved project exists and is valid, use it
          if (savedProjectId && data.find(p => p._id === savedProjectId)) {
            const savedProject = data.find(p => p._id === savedProjectId);
            setSelectedProject(savedProjectId);
            setSelectedProjectDetails(savedProject);
          } else {
            // Otherwise, auto-select first project
            setSelectedProject(data[0]._id);
            setSelectedProjectDetails(data[0]);
            // Save the first project as default
            localStorage.setItem(`selectedProject_${userId}`, data[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

  // Handle project selection
  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    
    const project = projects.find(p => p._id === projectId);
    setSelectedProjectDetails(project || null);
    
    // Save selected project to localStorage for this user
    localStorage.setItem(`selectedProject_${userId}`, projectId);
  };

  // Fetch requisition summary when project is selected
  useEffect(() => {
    const fetchRequisitionSummary = async () => {
      if (!selectedProject) return;

      try {
        const response = await axiosClient.get(`/api/Requisition/summary/${selectedProject}`);
        const data = response.data?.data || response.data;
        
        if (data) {
          // Filter pending requisitions for logged-in user
          const myPendingRequisitions = (data.pendingRequisitions || []).filter(
            req => req.approverUserId === userId
          );
          setUserPendingRequisitions(myPendingRequisitions);
          setOpenRequisitions(data.openRequisitions || []);

          setDashboardData(prev => ({
            ...prev,
            requisition: {
              totalRequisitions: data.totalRequisitions || 0,
              pendingApprovalCount: data.pendingApprovalCount || 0,
              approvedCount: data.approvedCount || 0,
              rejectedCount: data.rejectedCount || 0,
              draftCount: data.draftCount || 0,
              approvedTotalAmount: data.approvedTotalAmount || 0,
              openRequisitionsCount: data.openRequisitionsCount || 0
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching requisition summary:', error);
      }
    };

    fetchRequisitionSummary();
  }, [selectedProject, userId]);

  // Fetch purchase order summary when project is selected
  useEffect(() => {
    const fetchPurchaseOrderSummary = async () => {
      if (!selectedProject) return;

      try {
        const response = await axiosClient.get(`/api/PurchaseOrder/summary/${selectedProject}`);
        const data = response.data?.data || response.data;
        
        if (data) {
          // Filter pending purchase orders for logged-in user
          const myPendingPurchaseOrders = (data.pendingPurchaseOrders || []).filter(
            po => po.approverUserId === userId
          );
          setUserPendingPurchaseOrders(myPendingPurchaseOrders);
          setDelayedPurchaseOrders(data.delayedPOs || []);
          setOpenPurchaseOrders(data.openPOs || []);

          setDashboardData(prev => ({
            ...prev,
            purchaseOrders: {
              totalPurchaseOrders: data.totalPurchaseOrders || 0,
              pendingApprovalCount: data.pendingApprovalCount || 0,
              approvedCount: data.approvedCount || 0,
              rejectedCount: data.rejectedCount || 0,
              draftCount: data.draftCount || 0,
              approvedTotalAmount: data.approvedTotalAmount || 0,
              openPOCount: data.openPOCount || 0,
              delayedPOCount: data.delayedPOCount || 0
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching purchase order summary:', error);
      }
    };

    fetchPurchaseOrderSummary();
  }, [selectedProject, userId]);

  // Fetch estimation data when project is selected
  useEffect(() => {
    const fetchEstimationData = async () => {
      if (!selectedProject) return;

      try {
        const response = await axiosClient.get(`/api/ProjectEstimation/inventory-dashboard/${selectedProject}`);
        const data = response.data?.data || response.data;
        
        if (data) {
          setDashboardData(prev => ({
            ...prev,
            estimation: {
              totalEstimatedProjectCost: data.totalEstimatedProjectCost || 0,
              totalmaterialEstimatedAmount: data.totalmaterialEstimatedAmount || 0,
              totalEstimatedLabourAmount: data.totalEstimatedLabourAmount || 0,
              totalEstimatedOtherExpense: data.totalEstimatedOtherExpense || 0,
              totalComponentsCount: data.totalComponentsCount || 0,
              totalmaterialPurchasedAmount: data.totalmaterialPurchasedAmount || 0,
              totalmaterialReceivedAmount: data.totalmaterialReceivedAmount || 0,
              lastEstimationModifiedDate: data.lastEstimationModifiedDate?.$date || data.lastEstimationModifiedDate || null
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching estimation data:', error);
      }
    };

    fetchEstimationData();
  }, [selectedProject]);

  useEffect(() => {
    // TODO: Fetch remaining dashboard data from API
    // For now using placeholder data for Material Receipt and Issue Register
    setDashboardData(prev => ({
      ...prev,
      materialReceipt: {
        receivedToday: 120,
        itemsCount: 120,
        pendingReceipts: 3,
        matchedWithPO: 92,
        hasReceipts: true,
        status: 'Active'
      },
      issueRegister: {
        issuedToday: 85,
        itemsCount: 85,
        pendingReturns: 8,
        activeProjects: 5,
        totalValue: 250000,
        floorWiseSummary: {
          '1st Floor': 40,
          '2nd Floor': 45
        },
        lastIssued: '09 Jan 2026'
      }
    }));
  }, []);

  const handleRequisitionApproval = (prNumber) => {
    navigate('/requisition', { 
      state: { 
        viewMode: 'form', 
        action: 'approve',
        requisitionNumber: prNumber,
        fromDashboard: true
      } 
    });
  };

  const handlePurchaseOrderApproval = (poNumber) => {
    navigate('/purchase-orders', { 
      state: { 
        viewMode: 'form', 
        action: 'approve',
        poNumber: poNumber,
        fromDashboard: true
      } 
    });
  };

  const handleOpenRequisitionClick = (requisitionNumber) => {
    setShowOpenRequisitionsModal(false);
    navigate('/requisition', { 
      state: { 
        viewMode: 'form', 
        action: 'approve',
        requisitionNumber: requisitionNumber,
        fromDashboard: true
      } 
    });
  };

  const handleDelayedPOClick = (poNumber) => {
    setShowDelayedPOModal(false);
    navigate('/purchase-orders', { 
      state: { 
        viewMode: 'form', 
        action: 'approve',
        poNumber: poNumber,
        fromDashboard: true
      } 
    });
  };

  const handleOpenPOClick = (poNumber) => {
    setShowOpenPOModal(false);
    navigate('/purchase-orders', { 
      state: { 
        viewMode: 'form', 
        action: 'approve',
        poNumber: poNumber,
        fromDashboard: true
      } 
    });
  };

  return (
    <div className="main-dashboard">
      {/* Search Section */}
      <Container className="pt-4">
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Row className="g-3 align-items-center">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">
                    <i className="bi bi-funnel me-2"></i>
                    Filter by Project
                  </Form.Label>
                  {loading ? (
                    <div className="text-center py-2">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : (
                    <Form.Select
                      value={selectedProject}
                      onChange={handleProjectChange}
                      size="sm"
                    >
                      {projects.length === 0 && <option value="">No projects available</option>}
                      {projects.map(project => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
              
              {/* Project Details */}
              {selectedProjectDetails && (
                <Col md={9} className="d-flex align-items-center" style={{ marginTop: '1.65rem' }}>
                  <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    {selectedProjectDetails.projectType && `${selectedProjectDetails.projectType} • `}
                    {selectedProjectDetails.floors !== undefined && selectedProjectDetails.floors !== null && `${selectedProjectDetails.floors} floor${Number(selectedProjectDetails.floors) !== 1 ? 's' : ''} • `}
                    {selectedProjectDetails.landArea && `Land: ${selectedProjectDetails.landArea} • `}
                    {selectedProjectDetails.constructionArea && `Area: ${new Intl.NumberFormat('en-IN').format(selectedProjectDetails.constructionArea)} sq ft`}
                    {selectedProjectDetails.location && ` • Location: ${selectedProjectDetails.location}`}
                  </p>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* Dashboard Tiles */}
        <Row className="g-4">
          {/* Project Estimation Tile */}
          <Col xl={4} lg={4} md={6} sm={12}>
            <Card className="dashboard-tile h-100 shadow-sm border-0 overflow-hidden">
              <div style={{ background: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)', padding: '1rem 1rem', color: 'white' }}>
                <h6 className="mb-0 fw-bold">Project Estimation ({companyCurrency})</h6>
              </div>
              <Card.Body className="p-3">
                {/* Cards in Grid Format */}
                <Row className="g-3">
                  {/* Total Estimated Cost */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #3b82f6' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Total Cost</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{(dashboardData.estimation.totalEstimatedProjectCost/1000).toFixed(0)}K</div>
                    </div>
                  </Col>

                  {/* Material */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #10b981' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Material</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{(dashboardData.estimation.totalmaterialEstimatedAmount / 1000).toFixed(0)}K</div>
                    </div>
                  </Col>

                  {/* Labour */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #ef4444' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Labour</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{(dashboardData.estimation.totalEstimatedLabourAmount / 1000).toFixed(0)}K</div>
                    </div>
                  </Col>

                  {/* Components */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #f97316' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Components</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{dashboardData.estimation.totalComponentsCount}</div>
                    </div>
                  </Col>
                </Row>

                <div className="d-flex align-items-center justify-content-between p-2 rounded mt-3" style={{ background: '#fff3cd' }}>
                  <small className="text-muted"><i className="bi bi-clock me-1"></i>Last Updated</small>
                  <strong className="small">
                    {dashboardData.estimation.lastEstimationModifiedDate 
                      ? new Date(dashboardData.estimation.lastEstimationModifiedDate).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: '2-digit' 
                        }).replace(/ /g, '/') 
                      : 'N/A'}
                  </strong>
                </div>

                <div className="d-grid gap-2 mt-3">
                  <Button 
                    size="sm"
                    onClick={() => navigate('/project-estimation')}
                    style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', border: 'none', color: 'white' }}
                  >
                    <i className="bi bi-file-earmark-text me-1"></i> View BOQ
                  </Button>
                  
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Requisition Tile */}
          <Col xl={4} lg={4} md={6} sm={12}>
            <Card className="dashboard-tile h-100 shadow-sm border-0 overflow-hidden">
              <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', padding: '1rem 1rem', color: 'white' }}>
                <h6 className="mb-0 fw-bold">Requisition</h6>
              </div>
              <Card.Body className="p-3" style={{ background: '#f9fafb' }}>
                {/* Cards in Grid Format */}
                <Row className="g-3">
                  {/* Pending */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Pending</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{dashboardData.requisition.pendingApprovalCount}</div>
                    </div>
                  </Col>

                  {/* Approved */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Approved</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{dashboardData.requisition.approvedCount}</div>
                    </div>
                  </Col>

                  {/* Draft */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Draft</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{dashboardData.requisition.draftCount}</div>
                    </div>
                  </Col>

                  {/* Rejected */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Rejected</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{dashboardData.requisition.rejectedCount}</div>
                    </div>
                  </Col>
                </Row>

                {/* Total Requisitions */}
                <div className="mt-3 p-2 rounded text-center" style={{ background: 'white', border: '1px solid #6366f1', boxShadow: '0 2px 4px rgba(99,102,241,0.15)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '0.7rem', fontWeight: '600' }}><i className="bi bi-card-list me-1"></i>Total Requisitions</span>
                    <span className="badge" style={{ background: '#6366f1', color: 'white', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>{dashboardData.requisition.totalRequisitions}</span>
                  </div>
                </div>

                {/* Open Requisitions */}
                <div className="mt-2 p-2 rounded" style={{ background: 'white', border: '1px solid #3b82f6', boxShadow: '0 2px 4px rgba(59,130,246,0.15)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '0.7rem', fontWeight: '600' }}><i className="bi bi-folder-open me-1"></i>Open Requisitions</span>
                    <span 
                      className="badge" 
                      style={{ 
                        background: '#3b82f6', 
                        color: 'white', 
                        fontSize: '0.75rem', 
                        cursor: dashboardData.requisition.openRequisitionsCount > 0 ? 'pointer' : 'default',
                        transition: 'transform 0.2s'
                      }}
                      onClick={() => dashboardData.requisition.openRequisitionsCount > 0 && setShowOpenRequisitionsModal(true)}
                      onMouseEnter={(e) => dashboardData.requisition.openRequisitionsCount > 0 && (e.target.style.transform = 'scale(1.1)')}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      title={dashboardData.requisition.openRequisitionsCount > 0 ? "Click to view details" : ""}
                    >
                      {dashboardData.requisition.openRequisitionsCount}
                    </span>
                  </div>
                  {dashboardData.requisition.openRequisitionsCount > 0 && (
                    <small className="text-muted d-block mt-1" style={{ fontSize: '0.6rem', fontStyle: 'italic' }}>
                      <i className="bi bi-hand-index me-1"></i>Click count to view details
                    </small>
                  )}
                </div>

                {/* Pending Requisitions for Approval */}
                {userPendingRequisitions.length > 0 && (
                  <div className="mt-2 p-2 rounded" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
                    <div className="mb-1">
                      <small className="fw-bold" style={{ color: '#d97706', fontSize: '0.7rem' }}>
                        <i className="bi bi-bell-fill me-1"></i>
                        Pending Your Approval ({userPendingRequisitions.length})
                      </small>
                    </div>
                    <div className="d-flex flex-column gap-1">
                      {userPendingRequisitions.map((req, index) => (
                        <Button
                          key={index}
                          variant="link"
                          size="sm"
                          className="p-0 text-decoration-underline text-start"
                          style={{ fontSize: '0.7rem', color: '#0d6efd', fontWeight: '600' }}
                          onClick={() => handleRequisitionApproval(req.prNumber)}
                        >
                          <i className="bi bi-arrow-right-circle me-1"></i>
                          {req.prNumber}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="d-grid gap-1 mt-3">
                  {requisitionPermissions.edit && (
                    <Button 
                      style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', border: 'none', color: 'white' }}
                      size="sm"
                      onClick={() => navigate('/requisition', { state: { viewMode: 'form', action: 'new' } })}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Raise New
                    </Button>
                  )}
                  {requisitionPermissions.view && (
                    <Button 
                      style={{ border: '2px solid #14b8a6', color: '#14b8a6', background: 'white' }}
                      size="sm"
                      onClick={() => navigate('/requisition')}
                    >
                      <i className="bi bi-list-ul me-1"></i> View All
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Purchase Orders Tile */}
          <Col xl={4} lg={4} md={6} sm={12}>
            <Card className="dashboard-tile h-100 shadow-sm border-0 overflow-hidden">
              <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', padding: '1rem 1rem', color: 'white' }}>
                <h6 className="mb-0 fw-bold">Purchase Orders</h6>
              </div>
              <Card.Body className="p-3" style={{ background: '#f9fafb' }}>
                {/* Cards in Grid Format */}
                <Row className="g-3">
                  {/* Pending */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Pending</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{dashboardData.purchaseOrders.pendingApprovalCount}</div>
                    </div>
                  </Col>

                  {/* Approved */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Approved</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{dashboardData.purchaseOrders.approvedCount}</div>
                    </div>
                  </Col>

                  {/* Draft */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Draft</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{dashboardData.purchaseOrders.draftCount}</div>
                    </div>
                  </Col>

                  {/* Rejected */}
                  <Col xs={6}>
                    <div className="p-3 rounded bg-white" style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Rejected</div>
                      <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1f2937' }}>{dashboardData.purchaseOrders.rejectedCount}</div>
                    </div>
                  </Col>
                </Row>

                {/* Total Purchase Orders */}
                <div className="mt-3 p-2 rounded text-center" style={{ background: 'white', border: '1px solid #6366f1', boxShadow: '0 2px 4px rgba(99,102,241,0.15)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '0.7rem', fontWeight: '600' }}><i className="bi bi-card-list me-1"></i>Total Purchase Orders</span>
                    <span className="badge" style={{ background: '#6366f1', color: 'white', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>{dashboardData.purchaseOrders.totalPurchaseOrders}</span>
                  </div>
                </div>

                {/* Open PO and Delayed PO */}
                <Row className="g-2 mt-2">
                  <Col xs={6}>
                    <div className="p-2 rounded" style={{ background: 'white', border: '1px solid #3b82f6', boxShadow: '0 2px 4px rgba(59,130,246,0.15)' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ fontSize: '0.7rem', fontWeight: '600' }}><i className="bi bi-folder-open me-1"></i>Open PO</span>
                        <span 
                          className="badge" 
                          style={{ 
                            background: '#3b82f6', 
                            color: 'white', 
                            fontSize: '0.75rem',
                            cursor: dashboardData.purchaseOrders.openPOCount > 0 ? 'pointer' : 'default',
                            transition: 'transform 0.2s'
                          }}
                          onClick={() => dashboardData.purchaseOrders.openPOCount > 0 && setShowOpenPOModal(true)}
                          onMouseEnter={(e) => dashboardData.purchaseOrders.openPOCount > 0 && (e.target.style.transform = 'scale(1.1)')}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          title={dashboardData.purchaseOrders.openPOCount > 0 ? "Click to view details" : ""}
                        >
                          {dashboardData.purchaseOrders.openPOCount}
                        </span>
                      </div>
                      {dashboardData.purchaseOrders.openPOCount > 0 && (
                        <small className="text-muted d-block mt-1" style={{ fontSize: '0.6rem', fontStyle: 'italic' }}>
                          <i className="bi bi-hand-index me-1"></i>Click count to view details
                        </small>
                      )}
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="p-2 rounded" style={{ background: 'white', border: '1px solid #ef4444', boxShadow: '0 2px 4px rgba(239,68,68,0.15)' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ fontSize: '0.7rem', fontWeight: '600' }}><i className="bi bi-exclamation-triangle me-1"></i>Delayed</span>
                        <span 
                          className="badge" 
                          style={{ 
                            background: '#ef4444', 
                            color: 'white', 
                            fontSize: '0.75rem', 
                            cursor: dashboardData.purchaseOrders.delayedPOCount > 0 ? 'pointer' : 'default',
                            transition: 'transform 0.2s'
                          }}
                          onClick={() => dashboardData.purchaseOrders.delayedPOCount > 0 && setShowDelayedPOModal(true)}
                          onMouseEnter={(e) => dashboardData.purchaseOrders.delayedPOCount > 0 && (e.target.style.transform = 'scale(1.1)')}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          title={dashboardData.purchaseOrders.delayedPOCount > 0 ? "Click to view details" : ""}
                        >
                          {dashboardData.purchaseOrders.delayedPOCount}
                        </span>
                      </div>
                      {dashboardData.purchaseOrders.delayedPOCount > 0 && (
                        <small className="text-muted d-block mt-1" style={{ fontSize: '0.6rem', fontStyle: 'italic' }}>
                          <i className="bi bi-hand-index me-1"></i>Click count to view details
                        </small>
                      )}
                    </div>
                  </Col>
                </Row>

                {/* Pending Purchase Orders for Approval */}
                {userPendingPurchaseOrders.length > 0 && (
                  <div className="mt-2 p-2 rounded" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
                    <div className="mb-1">
                      <small className="fw-bold" style={{ color: '#d97706', fontSize: '0.7rem' }}>
                        <i className="bi bi-bell-fill me-1"></i>
                        Pending Your Approval ({userPendingPurchaseOrders.length})
                      </small>
                    </div>
                    <div className="d-flex flex-column gap-1">
                      {userPendingPurchaseOrders.map((po, index) => (
                        <Button
                          key={index}
                          variant="link"
                          size="sm"
                          className="p-0 text-decoration-underline text-start"
                          style={{ fontSize: '0.7rem', color: '#0d6efd', fontWeight: '600' }}
                          onClick={() => handlePurchaseOrderApproval(po.poNumber)}
                        >
                          <i className="bi bi-arrow-right-circle me-1"></i>
                          {po.poNumber}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="d-grid gap-1 mt-3">
                  {purchaseOrdersPermissions.edit && (
                    <Button 
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'white' }}
                      size="sm"
                      onClick={() => navigate('/purchase-orders', { state: { viewMode: 'form', action: 'new' } })}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Create PO
                    </Button>
                  )}
                  {purchaseOrdersPermissions.view && (
                    <Button 
                      style={{ border: '2px solid #10b981', color: '#10b981', background: 'white' }}
                      size="sm"
                      onClick={() => navigate('/purchase-orders')}
                    >
                      <i className="bi bi-search me-1"></i> Track PO
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Open Requisitions Modal */}
      <Modal show={showOpenRequisitionsModal} onHide={() => setShowOpenRequisitionsModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1rem' }}>
            <i className="bi bi-folder-open me-2"></i>
            Open Requisitions ({openRequisitions.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {openRequisitions.length === 0 ? (
            <p className="text-muted text-center mb-0">No open requisitions</p>
          ) : (
            <div className="list-group">
              {openRequisitions.map((req, index) => (
                <button
                  key={index}
                  type="button"
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                  onClick={() => handleOpenRequisitionClick(req.requisitionNumber)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold text-primary">
                      <i className="bi bi-file-text me-1"></i>
                      {req.requisitionNumber}
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-calendar me-1"></i>
                      Date: {new Date(req.requisitionDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: '2-digit' 
                      }).replace(/ /g, '-')}
                    </small>
                  </div>
                  <i className="bi bi-chevron-right text-muted"></i>
                </button>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowOpenRequisitionsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delayed Purchase Orders Modal */}
      <Modal show={showDelayedPOModal} onHide={() => setShowDelayedPOModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1rem' }}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Delayed Purchase Orders ({delayedPurchaseOrders.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {delayedPurchaseOrders.length === 0 ? (
            <p className="text-muted text-center mb-0">No delayed purchase orders</p>
          ) : (
            <div className="list-group">
              {delayedPurchaseOrders.map((po, index) => (
                <button
                  key={index}
                  type="button"
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                  onClick={() => handleDelayedPOClick(po.poNumber)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold text-danger">
                      <i className="bi bi-file-earmark-text me-1"></i>
                      {po.poNumber}
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-calendar-x me-1"></i>
                      Due: {new Date(po.deliveryDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: '2-digit' 
                      }).replace(/ /g, '-')}
                    </small>
                  </div>
                  <i className="bi bi-chevron-right text-muted"></i>
                </button>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowDelayedPOModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Open Purchase Orders Modal */}
      <Modal show={showOpenPOModal} onHide={() => setShowOpenPOModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white' }}>
          <Modal.Title style={{ fontSize: '1rem' }}>
            <i className="bi bi-folder-open me-2"></i>
            Open Purchase Orders ({openPurchaseOrders.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {openPurchaseOrders.length === 0 ? (
            <p className="text-muted text-center mb-0">No open purchase orders</p>
          ) : (
            <div className="list-group">
              {openPurchaseOrders.map((po, index) => (
                <button
                  key={index}
                  type="button"
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                  onClick={() => handleOpenPOClick(po.poNumber)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ms-2 me-auto">
                    <div className="fw-bold text-primary">
                      <i className="bi bi-file-earmark-text me-1"></i>
                      {po.poNumber}
                    </div>
                    <small className="text-muted">
                      <i className="bi bi-calendar me-1"></i>
                      Date: {new Date(po.poDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: '2-digit' 
                      }).replace(/ /g, '-')}
                    </small>
                  </div>
                  <i className="bi bi-chevron-right text-muted"></i>
                </button>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowOpenPOModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Main;
