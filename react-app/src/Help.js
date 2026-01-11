import React, { useState } from 'react';
import { Container, Row, Col, Card, Accordion, Nav, Form, Button } from 'react-bootstrap';
import './Styles/Help.css';

function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  const helpSections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'bi-speedometer2',
      color: '#0891b2',
      content: [
        {
          question: 'Understanding the Dashboard',
          answer: 'The dashboard provides a comprehensive overview of your construction project. It displays key metrics including project estimation, requisitions, purchase orders, and material tracking. Use the project dropdown at the top to switch between different projects.'
        },
        {
          question: 'Project Selection',
          answer: 'Use the "Filter by Project" dropdown to select the project you want to view. The system automatically saves your selection and displays relevant data for that project across all modules.'
        },
        {
          question: 'Dashboard Tiles',
          answer: 'Each tile represents a different aspect of your project:\n\n• Project Estimation: Shows total estimated costs broken down by material, labour, and other expenses\n• Requisition: Displays pending approvals, approved, rejected, and draft requisitions\n• Purchase Orders: Shows PO status including pending approvals, open POs, and delayed deliveries\n• Material Receipt: Tracks received materials and pending receipts'
        },
        {
          question: 'Quick Actions',
          answer: 'Each tile includes quick action buttons:\n• "View BOQ" - Navigate to detailed project estimation\n• "Raise New" - Create new requisition\n• "Create PO" - Generate new purchase order\n• Click on counts to view detailed lists'
        }
      ]
    },
    {
      id: 'estimation',
      title: 'BOQ & Project Estimation',
      icon: 'bi-calculator',
      color: '#0891b2',
      content: [
        {
          question: 'Creating a New BOQ',
          answer: 'Step 1: Navigate to Project Estimation from the menu\nStep 2: Click "Create New Estimation" button\nStep 3: Select your project from the dropdown\nStep 4: Add floors and components (e.g., Beam, Column, Slab)\nStep 5: Enter dimensions and quantities for each component\nStep 6: The system automatically calculates material requirements and costs\nStep 7: Review and save your estimation'
        },
        {
          question: 'Understanding Cost Breakdown',
          answer: 'The BOQ provides detailed cost breakdown:\n\n• Material Cost: Calculated based on component dimensions and material rates\n• Labour Cost: Computed using labour rates and work quantities\n• Other Expenses: Include overhead, contractor charges, and miscellaneous costs\n• Total Project Cost: Sum of all above components\n\nYou can view cost breakdowns by floor, component type, or material category.'
        },
        {
          question: 'Editing Existing Estimation',
          answer: 'Step 1: Go to Project Estimation\nStep 2: Select the project\nStep 3: Click "Edit" button\nStep 4: Modify components, quantities, or rates as needed\nStep 5: System recalculates costs automatically\nStep 6: Save changes\n\nNote: Changes to estimation may affect pending requisitions and purchase orders.'
        },
        {
          question: 'Material Configuration',
          answer: 'Configure materials in the BOQ:\n• Set standard rates for cement, steel, sand, etc.\n• Define unit of measurement (bags, tons, cubic feet)\n• Include wastage percentages\n• Add custom materials as needed\n• Update rates periodically to reflect market changes'
        },
        {
          question: 'Generating Reports',
          answer: 'Generate various BOQ reports:\n• Component-wise material breakdown\n• Floor-wise cost summary\n• Material quantity report\n• Labour requirement analysis\n• Cost comparison reports\n\nReports can be exported to PDF or Excel format.'
        }
      ]
    },
    {
      id: 'requisition',
      title: 'Material Requisition',
      icon: 'bi-clipboard-check',
      color: '#14b8a6',
      content: [
        {
          question: 'Raising a New Requisition',
          answer: 'Step 1: Click "Raise New" from Dashboard or navigate to Requisition module\nStep 2: Fill in basic details:\n   • Requisition Date\n   • Required Date\n   • Project Selection\n   • Purpose/Remarks\nStep 3: Add items from BOQ or manually:\n   • Select item name\n   • Enter required quantity\n   • Specify unit of measurement\nStep 4: Review total estimated amount\nStep 5: Submit for approval or save as draft'
        },
        {
          question: 'Requisition Workflow',
          answer: 'Requisition goes through multiple stages:\n\n1. Draft: Initial creation, can be edited\n2. Pending Approval: Submitted for review\n3. Approved: Cleared by authorized personnel, ready for PO creation\n4. Rejected: Sent back with comments, can be revised\n5. Converted to PO: Processed into purchase order\n\nEach stage is tracked with timestamps and user details.'
        },
        {
          question: 'Approval Process',
          answer: 'If you are an approver:\n\nStep 1: Check "Pending Your Approval" section on dashboard\nStep 2: Click on requisition number to view details\nStep 3: Review:\n   • Items requested\n   • Quantities and costs\n   • Project alignment\n   • Requester comments\nStep 4: Add approval remarks if needed\nStep 5: Click "Approve" or "Reject"\n\nApproved requisitions become available for PO creation.'
        },
        {
          question: 'Tracking Requisitions',
          answer: 'Monitor requisition status:\n• View all requisitions in list format\n• Filter by status (Draft/Pending/Approved/Rejected)\n• Search by requisition number or date\n• Track which items are converted to POs\n• Check remaining open requisitions\n\nUse the dashboard for quick overview of pending approvals.'
        },
        {
          question: 'Editing Requisitions',
          answer: 'Edit rules:\n• Draft requisitions: Can be edited freely\n• Pending approval: Cannot be edited, must be rejected first\n• Approved: Cannot be edited\n• Rejected: Can be revised and resubmitted\n\nTo modify approved requisitions, create a new one with adjustments.'
        }
      ]
    },
    {
      id: 'purchase-order',
      title: 'Purchase Orders',
      icon: 'bi-cart-check',
      color: '#10b981',
      content: [
        {
          question: 'Creating Purchase Order from Requisition',
          answer: 'Step 1: Navigate to Purchase Orders\nStep 2: Click "Create PO" button\nStep 3: Select approved requisition(s) to convert\nStep 4: Choose supplier from dropdown\nStep 5: System auto-fills items from requisition\nStep 6: Modify quantities if needed\nStep 7: Add/edit rates for each item\nStep 8: Set payment terms and delivery date\nStep 9: Add any additional charges or discounts\nStep 10: Review total amount and submit'
        },
        {
          question: 'Creating Direct Purchase Order',
          answer: 'For urgent or non-requisition purchases:\n\nStep 1: Click "Create PO" and select "Direct Entry"\nStep 2: Fill PO details:\n   • PO Date\n   • Supplier\n   • Project\n   • Delivery Location\nStep 3: Add items manually:\n   • Item name and description\n   • Quantity and unit\n   • Rate per unit\nStep 4: Add terms and conditions\nStep 5: Submit for approval (if required) or finalize'
        },
        {
          question: 'Supplier Management',
          answer: 'Managing suppliers in PO:\n• Select from existing supplier master\n• Add new supplier on-the-fly (if permitted)\n• View supplier history and ratings\n• Track supplier performance\n• Set preferred suppliers for specific materials\n\nMaintain updated contact details and payment terms for each supplier.'
        },
        {
          question: 'PO Approval Workflow',
          answer: 'Purchase Order approval process:\n\n1. Draft: Being prepared, can be edited\n2. Pending Approval: Submitted for review\n3. Approved: Ready to send to supplier\n4. Rejected: Sent back for revision\n5. Sent to Supplier: PO dispatched\n6. Open: Awaiting material receipt\n7. Partially Received: Some items received\n8. Closed: All items received\n\nApprovers receive notifications for pending approvals.'
        },
        {
          question: 'Tracking Open Purchase Orders',
          answer: 'Monitor open POs:\n• View "Open PO" count on dashboard\n• Click to see detailed list of POs awaiting delivery\n• Check expected delivery dates\n• Identify delayed POs (highlighted in red)\n• Track partial receipts\n• Generate PO status reports\n\nProactively follow up with suppliers for delayed orders.'
        },
        {
          question: 'Adding Charges and Discounts',
          answer: 'Include additional costs:\n• Transportation charges\n• Loading/unloading fees\n• GST and other taxes\n• Discounts and rebates\n• Advance payments\n\nThese are added in the "Charges" section and automatically reflected in the total PO amount.'
        },
        {
          question: 'PO Amendments',
          answer: 'Modifying approved POs:\n• Cannot edit approved POs directly\n• Create amendment request with changes\n• Requires re-approval\n• Original PO remains in system for audit\n• Amendment history is tracked\n\nFor minor changes, coordinate with supplier and document in remarks.'
        }
      ]
    },
    {
      id: 'material-received',
      title: 'Material Receipt & Inventory',
      icon: 'bi-box-seam',
      color: '#f59e0b',
      content: [
        {
          question: 'Recording Material Receipt Against PO',
          answer: 'Step 1: Navigate to Material Received module\nStep 2: Select movement type as "Receipt"\nStep 3: Choose the Purchase Order from dropdown\nStep 4: System auto-loads PO items with ordered quantities\nStep 5: Enter actual received quantity for each item\nStep 6: Specify storage location\nStep 7: Enter GRN number and invoice details\nStep 8: Add quality inspection remarks if needed\nStep 9: Upload supporting documents (optional)\nStep 10: Save the receipt\n\nReceived quantities automatically update inventory and PO status.'
        },
        {
          question: 'Material Issue to Project',
          answer: 'Issuing materials to site:\n\nStep 1: Select "Issue" movement type\nStep 2: Choose source location (warehouse/store)\nStep 3: Select destination project and floor\nStep 4: Pick event/component (e.g., Column work)\nStep 5: Add items to issue\nStep 6: System shows available stock at location\nStep 7: Enter issue quantity (cannot exceed available stock)\nStep 8: Add requisitioner details and remarks\nStep 9: Save issue entry\n\nIssued materials are tracked floor-wise and event-wise for consumption analysis.'
        },
        {
          question: 'Material Transfer Between Locations',
          answer: 'Transferring materials:\n\nStep 1: Select "Transfer" movement type\nStep 2: Choose source location\nStep 3: Select destination location\nStep 4: Add items to transfer\nStep 5: Enter transfer quantity\nStep 6: Add transfer reason/remarks\nStep 7: Get approval if required\nStep 8: Save transfer\n\nTransfers maintain complete audit trail with timestamps and user details.'
        },
        {
          question: 'Material Return',
          answer: 'Returning excess materials:\n\nStep 1: Select "Return" movement type\nStep 2: Choose original issue/receipt to return against\nStep 3: Select items to return\nStep 4: Enter return quantity\nStep 5: Specify return reason\nStep 6: Select return location\nStep 7: Save return entry\n\nReturned materials are added back to inventory at specified location.'
        },
        {
          question: 'Material Adjustment',
          answer: 'For stock adjustments:\n\nStep 1: Navigate to Material Adjustment\nStep 2: Select location to adjust\nStep 3: System loads current inventory\nStep 4: Select items to adjust\nStep 5: Choose adjustment type:\n   • Stock Adjustment\n   • Damage\n   • Expired\n   • Lost\n   • Found\n   • Quality Rejection\nStep 6: Enter adjusted quantity (+/-)\nStep 7: Add remarks explaining adjustment\nStep 8: Save adjustment\n\nAll adjustments require proper documentation and approval.'
        },
        {
          question: 'Checking Stock Levels',
          answer: 'View inventory:\n• Navigate to Stock Details report\n• Filter by location, item, or date range\n• View opening balance, total in, total out, and net stock\n• Click on items to see transaction history\n• Check lot-wise stock for lot-controlled items\n• Export stock reports to PDF/Excel\n\nSet up low stock alerts for critical materials.'
        },
        {
          question: 'GRN and Invoice Management',
          answer: 'Managing receipts:\n• Record GRN (Goods Receipt Note) number\n• Enter invoice number and date\n• Upload scanned copy of invoice\n• Match invoice amount with PO amount\n• Track discrepancies\n• Maintain GRN register\n• Generate GRN reports for accounts\n\nEnsure all receipts are documented for audit and payment processing.'
        }
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: 'bi-graph-up',
      color: '#8b5cf6',
      content: [
        {
          question: 'Available Reports',
          answer: 'System provides comprehensive reports:\n\n• Stock Details Report: Inventory levels across locations\n• Purchase Analysis: Supplier-wise, material-wise spending\n• Consumption Report: Floor-wise, component-wise usage\n• Pending Approvals: Requisitions and POs awaiting action\n• BOQ vs Actual: Estimated vs actual material consumption\n• Cost Variance Report: Budget vs actual costs\n• Supplier Performance: Delivery timelines, quality metrics\n• Material Movement: Complete transaction history\n\nAll reports support multiple export formats (PDF, Excel, CSV).'
        },
        {
          question: 'Generating Stock Reports',
          answer: 'Stock Details Report:\n\nStep 1: Navigate to Stock Details from menu\nStep 2: Apply filters:\n   • Location\n   • Item name\n   • Date range (for opening balance calculation)\nStep 3: Click "Fetch Data" if dates specified\nStep 4: View results with opening balance, in/out quantities, net stock\nStep 5: Click expand icon to view transaction history\nStep 6: Export to PDF (Summary or Detailed)\n\nUse date filters to get stock position as of specific date.'
        },
        {
          question: 'Filtering and Searching Reports',
          answer: 'Optimize report results:\n• Use filter panel to narrow down data\n• Search by specific item names, numbers, or dates\n• Apply date range for time-based analysis\n• Combine multiple filters for precise results\n• Save frequently used filter combinations\n• Clear filters to view all data\n\nFilters help you focus on relevant information quickly.'
        },
        {
          question: 'Exporting Reports',
          answer: 'Export options:\n• PDF: Formatted, ready for printing and sharing\n• Excel: Editable spreadsheet for further analysis\n• CSV: Raw data for import into other systems\n\nPDF exports include:\n• Company header and logo\n• Applied filters information\n• Page numbers and timestamps\n• Professional formatting\n\nExcel exports maintain all data columns and calculations.'
        },
        {
          question: 'Dashboard Analytics',
          answer: 'Using dashboard for insights:\n• Monitor real-time metrics\n• Track approval workflows\n• Identify bottlenecks (delayed POs, pending approvals)\n• View spending trends\n• Compare projects\n• Access quick action buttons\n\nDashboard auto-refreshes to show latest data.'
        }
      ]
    },
    {
      id: 'user-settings',
      title: 'User Settings & Profile',
      icon: 'bi-person-gear',
      color: '#6366f1',
      content: [
        {
          question: 'Managing Your Profile',
          answer: 'Update your profile:\n\nStep 1: Click on your name/profile icon in navigation\nStep 2: Select "Profile" or "My Account"\nStep 3: Update details:\n   • Name\n   • Email\n   • Contact number\n   • Designation\nStep 4: Upload profile picture (optional)\nStep 5: Save changes\n\nKeep your contact information updated for notifications.'
        },
        {
          question: 'Changing Password',
          answer: 'Security best practices:\n\nStep 1: Go to Profile Settings\nStep 2: Click "Change Password"\nStep 3: Enter current password\nStep 4: Enter new password (min 8 characters)\nStep 5: Confirm new password\nStep 6: Save\n\nUse strong passwords with mix of letters, numbers, and special characters.'
        },
        {
          question: 'Notification Preferences',
          answer: 'Manage notifications:\n• Email notifications for approvals\n• SMS alerts for critical updates\n• In-app notifications\n• Daily/Weekly digest emails\n• Customize notification frequency\n\nEnable relevant notifications to stay informed without being overwhelmed.'
        },
        {
          question: 'Role and Permissions',
          answer: 'Understanding your access:\n• View your assigned role (Admin, Manager, User, etc.)\n• Check module-wise permissions\n• Know what actions you can perform\n• Request additional access from administrator\n\nContact your system administrator for permission changes.'
        }
      ]
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: 'bi-star',
      color: '#f59e0b',
      content: [
        {
          question: 'Data Entry Guidelines',
          answer: '• Double-check quantities before submitting\n• Use consistent units of measurement\n• Add descriptive remarks for clarity\n• Upload supporting documents when available\n• Review calculations before approval\n• Keep BOQ updated with actual site requirements\n• Maintain accurate supplier information\n• Record all material movements promptly'
        },
        {
          question: 'Approval Workflow Tips',
          answer: '• Review pending approvals regularly\n• Check all details before approving\n• Add meaningful remarks when rejecting\n• Set up email notifications for approvals\n• Delegate approval authority when on leave\n• Maintain approval turnaround time\n• Document approval decisions\n• Escalate delays to management'
        },
        {
          question: 'Inventory Management',
          answer: '• Conduct regular physical stock verification\n• Record material receipts immediately\n• Issue materials only against valid requests\n• Maintain proper storage locations\n• Track lot numbers for quality control\n• Investigate and document variances\n• Prevent overstocking or stockouts\n• Implement FIFO (First In First Out) method'
        },
        {
          question: 'Cost Control',
          answer: '• Compare BOQ estimates with actual costs regularly\n• Monitor material wastage\n• Track supplier rates and negotiate\n• Identify cost overruns early\n• Optimize bulk purchases\n• Reduce transportation costs\n• Minimize material handling\n• Analyze consumption patterns'
        },
        {
          question: 'Reporting and Audits',
          answer: '• Generate reports periodically\n• Review stock reports monthly\n• Maintain complete documentation\n• Keep digital copies of invoices and GRNs\n• Prepare for internal/external audits\n• Track audit findings and corrective actions\n• Ensure data integrity\n• Back up important reports'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting & FAQs',
      icon: 'bi-question-circle',
      color: '#ef4444',
      content: [
        {
          question: 'Cannot see a project in dropdown',
          answer: 'Possible reasons:\n• Project not assigned to you\n• Project is inactive/archived\n• Refresh the page to reload project list\n• Check with administrator for project access\n• Ensure you selected correct company'
        },
        {
          question: 'Requisition/PO not showing in approval list',
          answer: 'Troubleshooting:\n• Verify you are set as approver for that project\n• Check if already approved by someone else\n• Ensure requisition/PO is in "Pending" status\n• Refresh dashboard or re-login\n• Contact submitter to verify submission'
        },
        {
          question: 'Cannot edit requisition or PO',
          answer: 'Edit restrictions:\n• Already approved items cannot be edited\n• Pending approval items need to be rejected first\n• Check if you have edit permissions\n• Converted requisitions cannot be modified\n• Create amendment for approved documents'
        },
        {
          question: 'Stock quantity not updating',
          answer: 'Check following:\n• Ensure material receipt is saved properly\n• Verify correct location is selected\n• Check if transaction is in draft status\n• Refresh Stock Details report\n• Clear browser cache\n• Contact support if issue persists'
        },
        {
          question: 'Report not generating',
          answer: 'Solutions:\n• Check if date range is too large\n• Verify filters are correctly applied\n• Try exporting smaller data sets\n• Check internet connection\n• Clear browser cache\n• Try different browser\n• Contact technical support'
        },
        {
          question: 'Login issues',
          answer: 'Steps to resolve:\n• Verify username and password\n• Check CAPS LOCK is off\n• Try "Forgot Password" option\n• Clear browser cookies\n• Ensure stable internet connection\n• Contact administrator for account reset\n• Check if account is active'
        },
        {
          question: 'Getting "Permission Denied" errors',
          answer: 'Resolution:\n• Check your user role and permissions\n• Verify module access rights\n• Request required permissions from admin\n• Ensure you are in correct company/project\n• Re-login to refresh permissions\n• Contact system administrator'
        }
      ]
    },
    {
      id: 'support',
      title: 'Support & Contact',
      icon: 'bi-headset',
      color: '#06b6d4',
      content: [
        {
          question: 'Getting Help',
          answer: 'Support channels:\n\n• In-App Help: This comprehensive guide\n• Email Support: support@constructionmanagement.com\n• Phone Support: +91-XXXX-XXXXXX (9 AM - 6 PM IST)\n• Live Chat: Available on dashboard (Premium users)\n• Knowledge Base: help.constructionmanagement.com\n• Video Tutorials: YouTube channel\n• Community Forum: forum.constructionmanagement.com'
        },
        {
          question: 'Submitting Support Tickets',
          answer: 'For technical issues:\n\nStep 1: Collect information:\n   • What you were trying to do\n   • Error message (screenshot)\n   • Steps to reproduce\n   • Browser and device details\nStep 2: Email to support with above details\nStep 3: Provide ticket number for follow-up\nStep 4: Track ticket status\nStep 5: Verify resolution\n\nExpect response within 24 hours for critical issues.'
        },
        {
          question: 'Training Resources',
          answer: 'Available training materials:\n• User Manuals (PDF)\n• Video Tutorials (Module-wise)\n• Webinars (Monthly)\n• On-site Training (On request)\n• Quick Reference Guides\n• Sample Data Sets\n• Practice Exercises\n\nContact your account manager for training sessions.'
        },
        {
          question: 'Feature Requests',
          answer: 'Suggest improvements:\n• Email feature requests to product@constructionmanagement.com\n• Describe business need and expected benefit\n• Provide usage scenarios\n• Vote on existing requests in community forum\n• Participate in user surveys\n\nHighly requested features are prioritized in roadmap.'
        }
      ]
    }
  ];

  const filteredSections = helpSections.map(section => ({
    ...section,
    content: section.content.filter(item =>
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.content.length > 0);

  return (
    <Container fluid className="help-page py-4">
      <Row>
        {/* Sidebar Navigation */}
        <Col lg={3} className="mb-4">
          <Card className="sticky-top shadow-sm border-0" style={{ top: '20px' }}>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-book me-2"></i>
                Help Topics
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Nav className="flex-column">
                {helpSections.map(section => (
                  <Nav.Link
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`help-nav-link d-flex align-items-center py-3 px-3 ${activeSection === section.id ? 'active' : ''}`}
                    style={{
                      borderLeft: activeSection === section.id ? `4px solid ${section.color}` : '4px solid transparent',
                      backgroundColor: activeSection === section.id ? '#f8f9fa' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <i className={`bi ${section.icon} me-2`} style={{ color: section.color, fontSize: '1.2rem' }}></i>
                    <span className="fw-semibold">{section.title}</span>
                  </Nav.Link>
                ))}
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={9}>
          {/* Search Bar */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Form.Group>
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-5"
                    size="lg"
                  />
                  <i className="bi bi-search position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', color: '#6c757d' }}></i>
                </div>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Help Content */}
          {filteredSections.map(section => {
            if (activeSection !== section.id && searchQuery === '') return null;

            return (
              <Card key={section.id} className="shadow-sm border-0 mb-4">
                <Card.Header style={{ background: section.color, color: 'white' }}>
                  <h4 className="mb-0">
                    <i className={`bi ${section.icon} me-2`}></i>
                    {section.title}
                  </h4>
                </Card.Header>
                <Card.Body className="p-0">
                  <Accordion defaultActiveKey="0" flush>
                    {section.content.map((item, index) => (
                      <Accordion.Item key={index} eventKey={index.toString()}>
                        <Accordion.Header>
                          <strong>{item.question}</strong>
                        </Accordion.Header>
                        <Accordion.Body style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
                          {item.answer}
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Card.Body>
              </Card>
            );
          })}

          {/* No Results */}
          {filteredSections.length === 0 && searchQuery !== '' && (
            <Card className="shadow-sm border-0 text-center py-5">
              <Card.Body>
                <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                <h5 className="mt-3 text-muted">No results found for "{searchQuery}"</h5>
                <p className="text-muted">Try different keywords or browse topics from the sidebar</p>
                <Button variant="primary" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </Card.Body>
            </Card>
          )}

          {/* Quick Links */}
          {searchQuery === '' && (
            <Card className="shadow-sm border-0 mt-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-lightning me-2"></i>
                  Quick Links
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="h-100 border">
                      <Card.Body>
                        <h6 className="fw-bold text-primary">
                          <i className="bi bi-play-circle me-2"></i>
                          Getting Started
                        </h6>
                        <p className="small mb-2">New to the system? Start here:</p>
                        <ul className="small mb-0">
                          <li>Understanding Dashboard</li>
                          <li>Creating Your First BOQ</li>
                          <li>Raising Requisitions</li>
                          <li>Managing User Profile</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border">
                      <Card.Body>
                        <h6 className="fw-bold text-success">
                          <i className="bi bi-bookmark-star me-2"></i>
                          Popular Topics
                        </h6>
                        <p className="small mb-2">Most viewed help articles:</p>
                        <ul className="small mb-0">
                          <li>Creating Purchase Orders</li>
                          <li>Recording Material Receipts</li>
                          <li>Generating Stock Reports</li>
                          <li>Approval Workflows</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Help;
