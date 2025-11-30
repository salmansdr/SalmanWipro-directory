import React from 'react';
import * as XLSX from 'xlsx';

/**
 * Reusable Excel export button for any grid/table data.
 * @param {Object[]} data - Array of objects representing table rows.
 * @param {string[]} columns - Array of column headers (order matters).
 * @param {string} description - Description to be added as the first row in Excel.
 * @param {string} [fileName='ExportedData.xlsx'] - Name of the Excel file.
 */

const ExportToExcelButton = ({ data, columns, description, fileName = 'ExportedData.xlsx' }) => {
  const handleExport = () => {
    // Prepare rows: first row is description, then header, then data
    const rows = [];
    rows.push({ [columns[0]]: description }); // Description row (first column only)
    rows.push(Object.fromEntries(columns.map(col => [col, col]))); // Header row
    data.forEach(row => {
      const rowObj = {};
      columns.forEach(col => {
        rowObj[col] = row[col] !== undefined ? row[col] : '';
      });
      rows.push(rowObj);
    });
    const worksheet = XLSX.utils.json_to_sheet(rows, { skipHeader: true });

    // Apply grid-like formatting: bold header, header bg, borders, number formatting
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    // Header row is at row 2 (index 1)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: '1976D2' } },
        fill: { fgColor: { rgb: 'EAF4FB' } },
        border: {
          top: { style: 'thin', color: { rgb: 'D0D7E1' } },
          bottom: { style: 'thin', color: { rgb: 'D0D7E1' } },
          left: { style: 'thin', color: { rgb: 'D0D7E1' } },
          right: { style: 'thin', color: { rgb: 'D0D7E1' } },
        },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
    // All data cells: borders, number formatting
    for (let R = 2; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: 'D0D7E1' } },
            bottom: { style: 'thin', color: { rgb: 'D0D7E1' } },
            left: { style: 'thin', color: { rgb: 'D0D7E1' } },
            right: { style: 'thin', color: { rgb: 'D0D7E1' } },
          },
          alignment: { horizontal: 'left', vertical: 'center' },
        };
        // If value is a number, format with thousands separator
        if (typeof worksheet[cellAddress].v === 'number') {
          worksheet[cellAddress].z = '#,##0';
        }
      }
    }

    // Description row (row 1, index 0): italic, left-aligned
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { italic: true, color: { rgb: '888888' } },
        alignment: { horizontal: 'left', vertical: 'center' },
      };
    }

    worksheet['!rows'] = [
      { hpt: 18 }, // Description
      { hpt: 22 }, // Header
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    // Enable cell styles (requires xlsx-style or SheetJS Pro, but will not error in community edition)
    XLSX.writeFile(workbook, fileName, { cellStyles: true });
  };

  return (
    <button onClick={handleExport} style={{ margin: '8px 0', padding: '6px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
      Export to Excel
    </button>
  );
};

export default ExportToExcelButton;
