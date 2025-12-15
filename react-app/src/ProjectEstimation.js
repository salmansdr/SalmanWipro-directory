import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Table, Spinner, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function ProjectEstimation() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load project estimation data from MongoDB API
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
        const companyId = localStorage.getItem('selectedCompanyId');
        const endpoint = companyId 
          ? `${apiUrl}/api/ProjectEstimation?companyId=${companyId}`
          : `${apiUrl}/api/ProjectEstimation`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to load project estimation data');
        }
        
        const data = await response.json();
         
        // Handle both array and single object structures
        const projects = Array.isArray(data) ? data : [data];
        
        // Helper function to format date safely
        const formatDate = (dateValue) => {
          if (!dateValue) return 'N/A';
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN');
        };

        // Transform the API data to match the grid structure
        const projectRows = projects.map(project => ({
          _id: project._id,
          ref: project.estimationRef || 'N/A',
          description: project.description || 'No description available',
          location: project.location || 'Not specified',
          projectName: project.projectName || 'Unnamed Project',
          creationDate: formatDate(project.createdDate),
          modificationDate: formatDate(project.modifiedDate),
          createdBy: project.createdBy || 'Unknown',
          modifiedBy: project.modifiedBy || 'Unknown',
          createdByUserName: project.createdByUserName || 'Unknown',
          modifiedByUserName: project.modifiedByUserName || 'Unknown',
          action: 'Edit',
         
        }));
        
        setRows(projectRows);
        setError(null);
      } catch (err) {
        console.error('Error loading project data:', err);
        setError(err.message);
        // Fallback to empty array if API fails
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, []);

  const handleNewEntry = async () => {
    try {
      // Create a new project estimation via POST API
      const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
      const companyId = localStorage.getItem('selectedCompanyId');
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      const endpoint = `${apiUrl}/api/ProjectEstimation`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyId: companyId,
          createdBy: userId || username,
          modifiedBy: userId || username
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create new estimation');
      }
      
      const newProject = await response.json();
      
      navigate('/pricing-calculator', { 
        state: { 
          mode: 'new',
          id: newProject._id
        } 
      });
    } catch (error) {
      console.error('Error creating new estimation:', error);
      alert('Error creating new estimation: ' + error.message);
    }
  };

  const handleRefClick = (id) => {
    navigate('/pricing-calculator', { 
      state: { 
        mode: 'view', 
        id: id
      } 
    });
  };
  const handleEditClick = (id) => {
    navigate('/pricing-calculator', {
      state: {
        mode: 'edit',
        id: id
      }
    });
  };

  // Delete row handler
  const handleDelete = async (id, ref) => {
    if (window.confirm(`Are you sure you want to delete estimation ${ref}?`)) {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://buildproapi.onrender.com';
        const endpoint = `${apiUrl}/api/ProjectEstimation/by-estimation-ref/${ref}`;
        const response = await fetch(endpoint, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete estimation');
        }
        
        // Remove from UI after successful deletion
        setRows(rows.filter(row => row._id !== id));
        alert('Estimation deleted successfully!');
      } catch (error) {
        console.error('Error deleting estimation:', error);
        alert('Error deleting estimation: ' + error.message);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <div className="mt-2">Loading project estimation data...</div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Data</Alert.Heading>
          <p>Unable to load project estimation data: {error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={() => window.location.reload()} variant="outline-danger">
              Retry
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Project Estimation</h3>
          <Button variant="light" onClick={handleNewEntry}>
            New Estimation
          </Button>
        </Card.Header>
        <Card.Body>
          <Card className="mb-4">
           
            <Card.Body>
              <Table bordered hover responsive size="sm">
                <thead className="table-light">
                  <tr>
                    <th>Estimation Ref#</th>
                    <th>Project Name</th>
                    <th>Description</th>
                    <th>Location</th>
                    <th>Creation Date</th>
                    <th>Modification Date</th>
                    <th>Created By</th>
                    <th>Modified By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row._id}>
                      <td>
                        <Button variant="link" onClick={() => handleRefClick(row._id)} style={{padding: 0}}>{row.ref}</Button>
                      </td>
                      <td>{row.projectName}</td>
                      <td>{row.description}</td>
                      <td>{row.location}</td>
                      <td>{row.creationDate}</td>
                      <td>{row.modificationDate}</td>
                      <td>{row.createdByUserName}</td>
                      <td>{row.modifiedByUserName}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEditClick(row._id)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(row._id, row.ref)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ProjectEstimation;
