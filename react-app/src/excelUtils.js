// Utility to export parent-child cost data to Excel
import * as XLSX from 'xlsx';

export function exportCostDataToExcel(costData, costLevel) {
  // Prepare data in parent-child format with parent total
  const rows = [];
  costData.forEach(cat => {
    // Calculate total for parent
    const total = cat.details.reduce((sum, item) => sum + item.qty * item.rate[costLevel], 0);
    // Parent row (category + total)
    rows.push({
      Category: cat.category,
      Item: '', Qty: '', Unit: '', Rate: '', Price: total
    });
    // Child rows (details)
    cat.details.forEach(item => {
      rows.push({
        Category: '',
        Item: item.name,
        Qty: item.qty,
        Unit: item.unit,
        Rate: item.rate[costLevel],
        Price: item.qty * item.rate[costLevel]
      });
    });
  });
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cost Details');
  XLSX.writeFile(workbook, 'CostDetails.xlsx');
}
