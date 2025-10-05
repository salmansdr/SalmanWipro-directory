import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const initialRows = [
  {
    ref: 'EST-001',
    description: 'Sample estimation for Green Valley Residency',
    location: 'Mumbai',
    creationDate: '2025-10-01',
    modificationDate: '2025-10-05',
    createdBy: 'Salman',
    modifiedBy: 'Admin',
    action: 'Edit',
  },
  // Add more sample rows as needed
];

function ProjectEstimation() {
  const [rows, setRows] = useState(initialRows);
  const navigate = useNavigate();

  const handleNewEntry = () => {
    navigate('/pricing-calculator', { state: { mode: 'new' } });
  };

  const handleRefClick = (ref) => {
    navigate('/pricing-calculator', { state: { mode: 'view', ref } });
  };

  const handleEditClick = (ref) => {
    navigate('/pricing-calculator', { state: { mode: 'edit', ref } });
  };

  // Delete row handler
  const handleDelete = (ref) => {
    if (window.confirm('Are you sure you want to delete this estimation?')) {
      setRows(rows.filter(row => row.ref !== ref));
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-end mb-2">
        <Button
          style={{ backgroundColor: '#199e60', borderColor: '#199e60', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '1.1rem', padding: '0.5rem 1.5rem' }}
          onClick={handleNewEntry}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" style={{marginRight: '4px'}}>
            <path d="M8 1a.5.5 0 0 1 .5.5v6h6a.5.5 0 0 1 0 1h-6v6a.5.5 0 0 1-1 0v-6h-6a.5.5 0 0 1 0-1h6v-6A.5.5 0 0 1 8 1z"/>
          </svg>
          New Entry
        </Button>
      </div>
      <Card className="mb-4 shadow-sm">
        <Card.Header as="h3" className="bg-primary text-white">
          Project Estimation
        </Card.Header>
        <Card.Body>
          <Card className="mb-4">
            <Card.Header as="h5" className="bg-info text-white">Estimation List</Card.Header>
            <Card.Body>
              <Table bordered hover responsive size="sm">
                <thead className="table-light">
                  <tr>
                    <th>Estimation Ref#</th>
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
                    <tr key={row.ref}>
                      <td>
                        <Button variant="link" onClick={() => handleRefClick(row.ref)} style={{padding: 0}}>{row.ref}</Button>
                      </td>
                      <td>{row.description}</td>
                      <td>{row.location}</td>
                      <td>{row.creationDate}</td>
                      <td>{row.modificationDate}</td>
                      <td>{row.createdBy}</td>
                      <td>{row.modifiedBy}</td>
                      <td className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(row.ref)}>Edit</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(row.ref)}>Delete</Button>
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
