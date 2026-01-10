import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getPagePermissions } from './utils/menuSecurity';
import axiosClient from './api/axiosClient';

import 'bootstrap/dist/css/bootstrap.min.css';

function ProjectDetails() {
  const [projects, setProjects] = useState([]);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const navigate = useNavigate();
  const permissions = getPagePermissions('Project Management');

  const loadProjects = async () => {
    try {
      const companyId = localStorage.getItem('selectedCompanyId');
      const endpoint = companyId 
        ? `/api/Projects?companyId=${companyId}`
        : `/api/Projects`;
      
      const resp = await axiosClient.get(endpoint);
      const data = resp.data;
      
      // Check if data is directly an array of projects
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        // Fallback: Flatten all project arrays (completed, running, upcoming) if present
        let allProjects = [];
        if (Array.isArray(data.completed)) allProjects = allProjects.concat(data.completed);
        if (Array.isArray(data.running)) allProjects = allProjects.concat(data.running);
        if (Array.isArray(data.upcoming)) allProjects = allProjects.concat(data.upcoming);
        setProjects(allProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);
  
  const handleEdit = (project) => {
    if (!permissions.edit) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to edit projects' });
      return;
    }
    navigate('/ProjectManagementEntryForm', { state: { project, edit: true } });
  };

  const handleDelete = async (projectId) => {
    if (!permissions.delete) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to delete projects' });
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await axiosClient.delete(`/api/projects/${projectId}`);
      
      // Refresh the projects list after successful deletion
      loadProjects();
      setAlertMessage({ show: true, type: 'success', message: 'Project deleted successfully!' });
      
      // Auto-hide success alert after 3 seconds
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting project:', error);
      // axiosClient automatically extracts error message from response
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setAlertMessage({ show: true, type: 'danger', message: 'Error deleting project: ' + errorMessage });
    }
  };

  const handleNewEntry = () => {
    if (!permissions.edit) {
      setAlertMessage({ show: true, type: 'danger', message: 'You do not have permission to create new projects' });
      return;
    }
    navigate('/ProjectManagementEntryForm');
  };

  // Check view permission
  if (!permissions.view) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Access Denied
          </Alert.Heading>
          <p className="mb-0">
            You do not have permission to view this page. Please contact your administrator if you believe this is an error.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Success/Error Alert */}
      {alertMessage.show && (
        <Alert 
          variant={alertMessage.type} 
          onClose={() => setAlertMessage({ show: false, type: '', message: '' })} 
          dismissible
        >
          {alertMessage.message}
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Project Details</h3>
          {permissions.edit && (
            <Button variant="light" onClick={handleNewEntry}>
              New Project
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive className="align-middle" style={{ fontSize: '0.875rem' }}>
            <thead className="table-info">
              <tr>
                <th>Project Name</th>
                <th>Location</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                {(permissions.edit || permissions.delete) && (
                  <th className="text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project._id}>
                  <td>
                    <Link to="/ProjectManagementEntryForm" state={{ project }} className="text-decoration-underline">
                      {project.name}
                    </Link>
                  </td>
                  <td>{project.location}</td>
                  <td>{project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB') : ''}</td>
                  <td>{project.endDate ? new Date(project.endDate).toLocaleDateString('en-GB') : ''}</td>
                  <td>
                    <span className={`badge bg-${
                      project.status === 'completed' ? 'success' :
                      project.status === 'running' ? 'primary' :
                      project.status === 'upcoming' ? 'warning' :
                      project.status === 'closed' ? 'secondary' : 'info'
                    }`}>
                      {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'N/A'}
                    </span>
                  </td>
                  {(permissions.edit || permissions.delete) && (
                    <td className="text-center">
                      {permissions.edit && (
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEdit(project)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                      )}
                      {permissions.delete && (
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(project._id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ProjectDetails;
