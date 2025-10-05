import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDFReport({ locationDetails, rectangleRef, floorLayout, floorComponents, materialDetails }) {
  const doc = new jsPDF('p', 'pt', 'a4');
  let y = 40;

  // Section 1: Location and Area Details
  doc.setFontSize(18);
  doc.setTextColor(40, 76, 150);
  doc.text('Location & Area Details', 40, y);
  y += 28;
  doc.setFontSize(12);
  doc.setTextColor(44, 44, 44);
  locationDetails.split('\n').forEach(line => {
    doc.text(line, 50, y);
    y += 18;
  });
  y += 10;

  // Section 1b: Rectangle Image
  if (rectangleRef && rectangleRef.current) {
    const canvas = await html2canvas(rectangleRef.current);
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 40, y, 400, 120);
    y += 140;
  }

  // Section 2: Floor Layout
  doc.setFontSize(18);
  doc.setTextColor(40, 150, 76);
  doc.text('Floor Layout', 40, y);
  y += 28;
  doc.setFontSize(11);
  try {
    const layoutArr = JSON.parse(floorLayout);
    layoutArr.forEach(section => {
      doc.setFont(undefined, 'bold');
      doc.text(section.floor, 50, y);
      y += 18;
      doc.setFont(undefined, 'normal');
      doc.text('BHK Configuration:', 60, y);
      y += 16;
      section.bhkConfig.forEach(row => {
        doc.text(`Type: ${row.type || '-'}, Units: ${row.units}, Area: ${row.area} sq ft, Rooms: ${row.rooms || '-'}`, 70, y);
        y += 14;
      });
      y += 8;
    });
  } catch {}
  y += 10;

  // Section 3: Floor Components
  doc.setFontSize(18);
  doc.setTextColor(150, 76, 40);
  doc.text('Floor Components', 40, y);
  y += 28;
  doc.setFontSize(11);
  try {
    const compArr = JSON.parse(floorComponents);
    compArr.forEach(section => {
      doc.setFont(undefined, 'bold');
      doc.text(section.floor, 50, y);
      y += 18;
      doc.setFont(undefined, 'normal');
      // Table header
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text('Component', 60, y);
      doc.text('Logic', 180, y);
      doc.text('Area (sq ft)', 400, y);
      y += 14;
      doc.setDrawColor(200,200,200);
      doc.line(60, y, 500, y);
      y += 8;
      section.components.forEach(item => {
        doc.setFontSize(10);
        doc.setTextColor(44,44,44);
        doc.text(item.name, 60, y);
        doc.text(item.logic, 180, y, { maxWidth: 200 });
        doc.text(item.area ? item.area.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-', 400, y);
        y += 13;
      });
      y += 10;
    });
  } catch {}

  // Section 4: Material Details (force new page, grid format)
  doc.addPage();
  y = 40;
  doc.setFontSize(18);
  doc.setTextColor(150, 40, 76);
  doc.text('Material Details', 40, y);
  y += 28;
  doc.setFontSize(11);
  try {
    const matArr = JSON.parse(materialDetails);
    matArr.forEach(cat => {
      doc.setFont(undefined, 'bold');
      doc.text(cat.category, 50, y);
      y += 16;
      doc.setFont(undefined, 'normal');
      // Table header
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text('Item', 60, y);
      doc.text('Qty', 200, y);
      doc.text('Unit', 250, y);
      doc.text('Rate', 300, y);
      doc.text('Amount', 400, y);
      y += 14;
      doc.setDrawColor(200,200,200);
      doc.line(60, y, 500, y);
      y += 8;
      cat.details.forEach(item => {
        doc.setFontSize(10);
        doc.setTextColor(44,44,44);
        doc.text(item.name, 60, y);
        doc.text(String(item.qty), 200, y);
        doc.text(item.unit, 250, y);
        doc.text(`₹${item.rate.basic}`, 300, y);
        doc.text((item.qty * item.rate.basic).toLocaleString('en-IN', { maximumFractionDigits: 2 }), 400, y);
        y += 13;
      });
      y += 10;
    });
  } catch {}

  doc.save('ConstructionReport.pdf');
}
