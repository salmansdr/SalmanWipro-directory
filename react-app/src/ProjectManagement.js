import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

function ProjectDetails() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/projects.json')
      .then(res => res.json())
      .then(data => {
        // Flatten all project arrays (completed, running, upcoming) if present
        let allProjects = [];
        if (Array.isArray(data.completed)) allProjects = allProjects.concat(data.completed);
        if (Array.isArray(data.running)) allProjects = allProjects.concat(data.running);
        if (Array.isArray(data.upcoming)) allProjects = allProjects.concat(data.upcoming);
        setProjects(allProjects);
      })
      .catch(() => setProjects([]));
  }, []);

  const handleEdit = (project) => {
    navigate('/ProjectManagementEntryForm', { state: { project, edit: true } });
  };

  const handleDelete = (projectName) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.name !== projectName));
      // TODO: Persist delete to backend or file
    }
  };

  const handleNewEntry = () => {
    navigate('/ProjectManagementEntryForm');
  };

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col className="d-flex justify-content-end">
          <Button variant="success" onClick={handleNewEntry} title="New Entry">
            <FaPlus /> New Entry
          </Button>
        </Col>
      </Row>
      <Card className="shadow-sm">
        <Card.Header as="h3" className="bg-primary text-white">Project Details</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive className="align-middle">
            <thead className="table-info">
              <tr>
                <th>Project Name</th>
                <th>Location</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, idx) => (
                <tr key={project.id || idx}>
                  <td>
                    <Link to="/ProjectManagementEntryForm" state={{ project }} className="fw-bold text-decoration-underline">
                      {project.name}
                    </Link>
                  </td>
                  <td>{project.location}</td>
                  <td>{project.startDate}</td>
                  <td>{project.endDate}</td>
                  <td className="text-center">
                    <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-2">
                      <Button variant="outline-primary" size="sm" onClick={() => handleEdit(project)} title="Edit">
                        <FaEdit />
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(project.name)} title="Delete">
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
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
