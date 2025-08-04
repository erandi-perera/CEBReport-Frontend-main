import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TariffData {
  tariff: string;
  noAccts: string;
  kwoUnits?: string;
  kwdUnits?: string;
  kwpUnits?: string;
  kwhUnits: string;
  kvaUnits?: string;
  kwoCharge?: number;
  kwdCharge?: number;
  kwpCharge?: number;
  kwhCharge: number;
  kvaCharge?: number;
  fixedCharge: number;
  taxCharge: number;
  facCharge?: number;
  payments?: number;
  fuelCharge?: number;
  Charge?: number;
}

interface BillCycleOption {
  display: string;
  code: string;
}

const TariffBlockWiseConsumption = () => {
  // Colors
  const maroon = "text-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";
  
  // State
  const [loading, setLoading] = useState(false);
  const [billCycleLoading, setBillCycleLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({
    ordinary: [] as TariffData[],
    bulk: [] as TariffData[]
  });
  const [billCycleOptions, setBillCycleOptions] = useState<BillCycleOption[]>([]);
  const [formData, setFormData] = useState({
    tariffType: "ordinary", // 'ordinary' or 'bulk'
    billCycle: "" // Will be set after fetching bill cycles
  });
  const navigate = useNavigate();

  // Fetch bill cycles on component mount
  useEffect(() => {
    const fetchBillCycles = async () => {
      try {
        const response = await fetch('/debtorsage/api/billcycle/max', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.errorMessage) {
          throw new Error(result.errorMessage);
        }
        
        // Generate bill cycle options (20 years back from max cycle)
        const maxCycle = parseInt(result.data.MaxBillCycle);
        const cycles = Array.from({ length: 20 }, (_, i) => {
          const cycle = (maxCycle - i).toString();
          return {
            display: cycle,
            code: cycle
          };
        });
        
        setBillCycleOptions(cycles);
        setFormData(prev => ({ ...prev, billCycle: cycles[0].code }));
      } catch (err: any) {
        setError("Failed to fetch bill cycles: " + err.message);
      } finally {
        setBillCycleLoading(false);
      }
    };
    
    fetchBillCycles();
  }, []);

  // Format currency values
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return "0.00";
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Fetch tariff data with POST request
  const fetchTariffData = async () => {
    if (!formData.billCycle) {
      setError("Please select a bill cycle");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const endpoint = formData.tariffType === 'ordinary' 
        ? '/CEBINFO_API_2025/api/tariffBlockwiseOrdinaryData' 
        : '/CEBINFO_API_2025/api/tariffBlockwiseBulkData';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          billCycle: parseInt(formData.billCycle)
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.errorMessage) {
        throw new Error(result.errorMessage);
      }
      
      const dataKey = formData.tariffType === 'ordinary' ? 'OrdList' : 'BulkList';
      setData(prev => ({
        ...prev,
        [formData.tariffType]: result[dataKey] || []
      }));
    } catch (err: any) {
      setError("Failed to fetch tariff data: " + err.message);
      setData(prev => ({
        ...prev,
        [formData.tariffType]: []
      }));
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for the current data
  const calculateTotals = () => {
    const currentData = formData.tariffType === 'ordinary' ? data.ordinary : data.bulk;
    
    return currentData.reduce((acc, row) => {
      acc.noAccts += parseInt(row.noAccts) || 0;
      acc.kwhUnits += parseFloat(row.kwhUnits) || 0;
      acc.kwhCharge += row.kwhCharge || 0;
      acc.fixedCharge += row.fixedCharge || 0;
      acc.taxCharge += row.taxCharge || 0;
      
      if (formData.tariffType === 'bulk') {
        acc.kwoUnits += parseFloat(row.kwoUnits || '0') || 0;
        acc.kwdUnits += parseFloat(row.kwdUnits || '0') || 0;
        acc.kwpUnits += parseFloat(row.kwpUnits || '0') || 0;
        acc.kvaUnits += parseFloat(row.kvaUnits || '0') || 0;
        acc.kwoCharge += row.kwoCharge || 0;
        acc.kwdCharge += row.kwdCharge || 0;
        acc.kwpCharge += row.kwpCharge || 0;
        acc.kvaCharge += row.kvaCharge || 0;
        acc.facCharge += row.facCharge || 0;
        acc.payments += row.payments || 0;
      } else {
        acc.fuelCharge += row.fuelCharge || 0;
        acc.Charge += row.Charge || 0;
      }
      
      return acc;
    }, {
      noAccts: 0,
      kwoUnits: 0,
      kwdUnits: 0,
      kwpUnits: 0,
      kwhUnits: 0,
      kvaUnits: 0,
      kwoCharge: 0,
      kwdCharge: 0,
      kwpCharge: 0,
      kwhCharge: 0,
      kvaCharge: 0,
      fixedCharge: 0,
      taxCharge: 0,
      facCharge: 0,
      payments: 0,
      fuelCharge: 0,
      Charge: 0
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTariffData();
  };

  // Download as CSV
 const downloadAsCSV = () => {
  const currentData = formData.tariffType === 'ordinary' ? data.ordinary : data.bulk;
  if (currentData.length === 0) {
    alert('No data available to download');
    return;
  }

  // Helper function to properly escape CSV values
  interface EscapeCsv {
    (value: string | number | undefined | null): string;
  }

  const escapeCsv: EscapeCsv = (value) => {
    if (value === undefined || value === null) return '';
    // Convert to string if not already
    const stringValue = typeof value === 'string' ? value : String(value);
    // Escape quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    // Wrap in quotes if contains commas, quotes, or newlines
    if (/[",\n\r]/.test(escapedValue)) {
      return `"${escapedValue}"`;
    }
    return escapedValue;
  };

  // Format currency without commas for CSV
  interface FormatCurrencyForCsv {
    (value: number | undefined | null): string;
  }

  const formatCurrencyForCsv: FormatCurrencyForCsv = (value) => {
    if (value === undefined || value === null) return '0.00';
    return value.toFixed(2);
  };

  // Create CSV headers
  const headers = formData.tariffType === 'ordinary' 
    ? [
        'Tariff', 'No of Accounts', 'kWh Units', 'kWh Charge',
        'Fuel Charge', 'Tax Charge', 'Fixed Charge', 'Total Charge'
      ]
    : [
        'Tariff', 'No of Accounts', 'kWo Units', 'kWd Units', 'kWp Units',
        'kWh Units', 'kVA Units', 'kWo Charge', 'kWd Charge', 'kWp Charge',
        'kWh Charge', 'kVA Charge', 'Fixed Charge', 'Tax Charge',
        'FAC Charge', 'Payments'
      ];

  // Create data rows
  const rows = currentData.map(row => {
    if (formData.tariffType === 'ordinary') {
      return [
        escapeCsv(row.tariff),
        escapeCsv(row.noAccts),
        escapeCsv(row.kwhUnits),
        escapeCsv(formatCurrencyForCsv(row.kwhCharge)),
        escapeCsv(formatCurrencyForCsv(row.fuelCharge)),
        escapeCsv(formatCurrencyForCsv(row.taxCharge)),
        escapeCsv(formatCurrencyForCsv(row.fixedCharge)),
        escapeCsv(formatCurrencyForCsv(row.Charge))
      ];
    } else {
      return [
        escapeCsv(row.tariff),
        escapeCsv(row.noAccts),
        escapeCsv(row.kwoUnits || '0.00'),
        escapeCsv(row.kwdUnits || '0.00'),
        escapeCsv(row.kwpUnits || '0.00'),
        escapeCsv(row.kwhUnits),
        escapeCsv(row.kvaUnits || '0.00'),
        escapeCsv(formatCurrencyForCsv(row.kwoCharge)),
        escapeCsv(formatCurrencyForCsv(row.kwdCharge)),
        escapeCsv(formatCurrencyForCsv(row.kwpCharge)),
        escapeCsv(formatCurrencyForCsv(row.kwhCharge)),
        escapeCsv(formatCurrencyForCsv(row.kvaCharge)),
        escapeCsv(formatCurrencyForCsv(row.fixedCharge)),
        escapeCsv(formatCurrencyForCsv(row.taxCharge)),
        escapeCsv(formatCurrencyForCsv(row.facCharge)),
        escapeCsv(formatCurrencyForCsv(row.payments))
      ];
    }
  });

  // Add totals row
  const totals = calculateTotals();
  const totalsRow = formData.tariffType === 'ordinary'
    ? [
        'TOTAL',
        escapeCsv(totals.noAccts),
        escapeCsv(totals.kwhUnits.toFixed(2)),
        escapeCsv(formatCurrencyForCsv(totals.kwhCharge)),
        escapeCsv(formatCurrencyForCsv(totals.fuelCharge)),
        escapeCsv(formatCurrencyForCsv(totals.taxCharge)),
        escapeCsv(formatCurrencyForCsv(totals.fixedCharge)),
        escapeCsv(formatCurrencyForCsv(totals.Charge))
      ]
    : [
        'TOTAL',
        escapeCsv(totals.noAccts),
        escapeCsv(totals.kwoUnits.toFixed(2)),
        escapeCsv(totals.kwdUnits.toFixed(2)),
        escapeCsv(totals.kwpUnits.toFixed(2)),
        escapeCsv(totals.kwhUnits.toFixed(2)),
        escapeCsv(totals.kvaUnits.toFixed(2)),
        escapeCsv(formatCurrencyForCsv(totals.kwoCharge)),
        escapeCsv(formatCurrencyForCsv(totals.kwdCharge)),
        escapeCsv(formatCurrencyForCsv(totals.kwpCharge)),
        escapeCsv(formatCurrencyForCsv(totals.kwhCharge)),
        escapeCsv(formatCurrencyForCsv(totals.kvaCharge)),
        escapeCsv(formatCurrencyForCsv(totals.fixedCharge)),
        escapeCsv(formatCurrencyForCsv(totals.taxCharge)),
        escapeCsv(formatCurrencyForCsv(totals.facCharge)),
        escapeCsv(formatCurrencyForCsv(totals.payments))
      ];

  // Combine all CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    totalsRow.join(',')
  ].join('\r\n');

  // Create download link
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Tariff_${formData.tariffType}_${formData.billCycle}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
  // Print as PDF
  const printPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const currentData = formData.tariffType === 'ordinary' ? data.ordinary : data.bulk;
    const totals = calculateTotals();
    
    // Create table rows
    const tableRows = currentData.map(row => {
      if (formData.tariffType === 'ordinary') {
        return `
          <tr>
            <td class="text-left">${row.tariff}</td>
            <td class="text-right">${row.noAccts}</td>
            <td class="text-right">${row.kwhUnits}</td>
            <td class="text-right">${formatCurrency(row.kwhCharge)}</td>
            <td class="text-right">${formatCurrency(row.fuelCharge)}</td>
            <td class="text-right">${formatCurrency(row.taxCharge)}</td>
            <td class="text-right">${formatCurrency(row.fixedCharge)}</td>
            <td class="text-right">${formatCurrency(row.Charge)}</td>
          </tr>
        `;
      } else {
        return `
          <tr>
            <td class="text-left">${row.tariff}</td>
            <td class="text-right">${row.noAccts}</td>
            <td class="text-right">${row.kwoUnits || '0.00'}</td>
            <td class="text-right">${row.kwdUnits || '0.00'}</td>
            <td class="text-right">${row.kwpUnits || '0.00'}</td>
            <td class="text-right">${row.kwhUnits}</td>
            <td class="text-right">${row.kvaUnits || '0.00'}</td>
            <td class="text-right">${formatCurrency(row.kwoCharge)}</td>
            <td class="text-right">${formatCurrency(row.kwdCharge)}</td>
            <td class="text-right">${formatCurrency(row.kwpCharge)}</td>
            <td class="text-right">${formatCurrency(row.kwhCharge)}</td>
            <td class="text-right">${formatCurrency(row.kvaCharge)}</td>
            <td class="text-right">${formatCurrency(row.fixedCharge)}</td>
            <td class="text-right">${formatCurrency(row.taxCharge)}</td>
            <td class="text-right">${formatCurrency(row.facCharge)}</td>
            <td class="text-right">${formatCurrency(row.payments)}</td>
          </tr>
        `;
      }
    }).join('');
    
    // Add totals row
    let totalsRow = '';
    if (formData.tariffType === 'ordinary') {
      totalsRow = `
        <tr class="total-row">
          <td class="text-left font-bold">TOTAL</td>
          <td class="text-right font-bold">${totals.noAccts}</td>
          <td class="text-right font-bold">${totals.kwhUnits.toFixed(2)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.kwhCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.fuelCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.taxCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.fixedCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.Charge)}</td>
        </tr>
      `;
    } else {
      totalsRow = `
        <tr class="total-row">
          <td class="text-left font-bold">TOTAL</td>
          <td class="text-right font-bold">${totals.noAccts}</td>
          <td class="text-right font-bold">${totals.kwoUnits.toFixed(2)}</td>
          <td class="text-right font-bold">${totals.kwdUnits.toFixed(2)}</td>
          <td class="text-right font-bold">${totals.kwpUnits.toFixed(2)}</td>
          <td class="text-right font-bold">${totals.kwhUnits.toFixed(2)}</td>
          <td class="text-right font-bold">${totals.kvaUnits.toFixed(2)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.kwoCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.kwdCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.kwpCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.kwhCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.kvaCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.fixedCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.taxCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.facCharge)}</td>
          <td class="text-right font-bold">${formatCurrency(totals.payments)}</td>
        </tr>
      `;
    }
    
    // Create table headers
    let tableHeaders = '';
    if (formData.tariffType === 'ordinary') {
      tableHeaders = `
        <tr>
          <th class="text-left">Tariff</th>
          <th class="text-right">No of Accounts</th>
          <th class="text-right">kWh Units</th>
          <th class="text-right">kWh Charge</th>
          <th class="text-right">Fuel Charge</th>
          <th class="text-right">Tax Charge</th>
          <th class="text-right">Fixed Charge</th>
          <th class="text-right">Total Charge</th>
        </tr>
      `;
    } else {
      tableHeaders = `
        <tr>
          <th class="text-left">Tariff</th>
          <th class="text-right">No of Accounts</th>
          <th class="text-right">kWo Units</th>
          <th class="text-right">kWd Units</th>
          <th class="text-right">kWp Units</th>
          <th class="text-right">kWh Units</th>
          <th class="text-right">kVA Units</th>
          <th class="text-right">kWo Charge</th>
          <th class="text-right">kWd Charge</th>
          <th class="text-right">kWp Charge</th>
          <th class="text-right">kWh Charge</th>
          <th class="text-right">kVA Charge</th>
          <th class="text-right">Fixed Charge</th>
          <th class="text-right">Tax Charge</th>
          <th class="text-right">FAC Charge</th>
          <th class="text-right">Payments</th>
        </tr>
      `;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Tariff Block Wise Consumption - ${formData.tariffType === 'ordinary' ? 'Ordinary' : 'Bulk'}</title>
          <style>
            body { font-family: Arial; font-size: 10px; margin: 10mm; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 4px 6px; border: 1px solid #ddd; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .header { font-weight: bold; margin-bottom: 5px; }
            .subheader { margin-bottom: 10px; }
            .footer { margin-top: 10px; font-size: 9px; }
            .total-row { font-weight: bold; background-color: #f5f5f5; }
            th { background-color: #f0f0f0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">TARIFF BLOCK WISE CONSUMPTION - ${formData.tariffType === 'ordinary' ? 'ORDINARY' : 'BULK'}</div>
          <div class="subheader">Bill Cycle: ${formData.billCycle}</div>
          <table>
            <thead>
              ${tableHeaders}
            </thead>
            <tbody>
              ${tableRows}
              ${totalsRow}
            </tbody>
          </table>
          <div class="footer">Generated on: ${new Date().toLocaleDateString()} | CEB@2025</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (billCycleLoading) {
    return (
      <div className={`text-center py-8 ${maroon} text-sm animate-pulse`}>
        Loading bill cycle data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-100 border border-red-300 p-4 rounded text-sm">
        <strong>Error:</strong> {error}
        <button 
          onClick={() => setError(null)}
          className="float-right text-red-800 font-bold"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      {/* Form Section */}
      <div className="mb-4">
        <h2 className={`text-xl font-bold mb-2 ${maroon}`}>Tariff Block Wise Consumption</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Tariff Type Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tariff Type</label>
              <div className="flex space-x-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tariffType"
                    value="ordinary"
                    checked={formData.tariffType === 'ordinary'}
                    onChange={handleInputChange}
                    className="text-[#7A0000] focus:ring-[#7A0000] w-3 h-3"
                  />
                  <span className="ml-1 text-xs text-gray-700">Ordinary</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="tariffType"
                    value="bulk"
                    checked={formData.tariffType === 'bulk'}
                    onChange={handleInputChange}
                    className="text-[#7A0000] focus:ring-[#7A0000] w-3 h-3"
                  />
                  <span className="ml-1 text-xs text-gray-700">Bulk</span>
                </label>
              </div>
            </div>

            {/* Bill Cycle Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bill Cycle</label>
              <select
                name="billCycle"
                value={formData.billCycle}
                onChange={handleInputChange}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-[#7A0000] focus:border-transparent"
                required
              >
                {billCycleOptions.map(cycle => (
                  <option key={cycle.code} value={cycle.code} className="text-xs py-1">
                    {cycle.display}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/general-category')}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#7A0000]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigate('/general-category/submenu')}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#7A0000]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-3 py-1 rounded-md text-xs font-medium text-white ${maroonGrad} hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#7A0000] disabled:opacity-50`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : "Search"}
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
          {error}
        </div>
      )}

      {/* Results Section */}
      <div className="mt-4">
        {loading ? (
          <div className={`text-center py-4 ${maroon} text-sm animate-pulse`}>
            Loading tariff data...
          </div>
        ) : (
          <>
            {/* Action Buttons */}
            {(data.ordinary.length > 0 || data.bulk.length > 0) && (
              <div className="flex justify-end space-x-2 mb-2">
                <button
                  onClick={downloadAsCSV}
                  className="px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#7A0000]"
                >
                  Download CSV
                </button>
                <button
                  onClick={printPDF}
                  className="px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#7A0000]"
                >
                  Print PDF
                </button>
              </div>
            )}

            {/* Ordinary Tariff Table */}
            {formData.tariffType === 'ordinary' && data.ordinary.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="text-md font-semibold mb-1">Ordinary Tariff Data</h3>
                <table className="min-w-full border border-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left border">Tariff</th>
                      <th className="px-2 py-1 text-right border">No of Accounts</th>
                      <th className="px-2 py-1 text-right border">kWh Units</th>
                      <th className="px-2 py-1 text-right border">kWh Charge</th>
                      <th className="px-2 py-1 text-right border">Fuel Charge</th>
                      <th className="px-2 py-1 text-right border">Tax Charge</th>
                      <th className="px-2 py-1 text-right border">Fixed Charge</th>
                      <th className="px-2 py-1 text-right border">Total Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ordinary.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-1 text-left border">{row.tariff}</td>
                        <td className="px-2 py-1 text-right border">{row.noAccts}</td>
                        <td className="px-2 py-1 text-right border">{row.kwhUnits}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.kwhCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.fuelCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.taxCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.fixedCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.Charge)}</td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-2 py-1 text-left border">TOTAL</td>
                      <td className="px-2 py-1 text-right border">{calculateTotals().noAccts}</td>
                      <td className="px-2 py-1 text-right border">{calculateTotals().kwhUnits.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().kwhCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().fuelCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().taxCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().fixedCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().Charge)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Bulk Tariff Table */}
            {formData.tariffType === 'bulk' && data.bulk.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="text-md font-semibold mb-1">Bulk Tariff Data</h3>
                <table className="min-w-full border border-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left border">Tariff</th>
                      <th className="px-2 py-1 text-right border">No of Accounts</th>
                      <th className="px-2 py-1 text-right border">kWo Units</th>
                      <th className="px-2 py-1 text-right border">kWd Units</th>
                      <th className="px-2 py-1 text-right border">kWp Units</th>
                      <th className="px-2 py-1 text-right border">kWh Units</th>
                      <th className="px-2 py-1 text-right border">kVA Units</th>
                      <th className="px-2 py-1 text-right border">kWo Charge</th>
                      <th className="px-2 py-1 text-right border">kWd Charge</th>
                      <th className="px-2 py-1 text-right border">kWp Charge</th>
                      <th className="px-2 py-1 text-right border">kWh Charge</th>
                      <th className="px-2 py-1 text-right border">kVA Charge</th>
                      <th className="px-2 py-1 text-right border">Fixed Charge</th>
                      <th className="px-2 py-1 text-right border">Tax Charge</th>
                      <th className="px-2 py-1 text-right border">FAC Charge</th>
                      <th className="px-2 py-1 text-right border">Payments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bulk.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-1 text-left border">{row.tariff}</td>
                        <td className="px-2 py-1 text-right border">{row.noAccts}</td>
                        <td className="px-2 py-1 text-right border">{row.kwoUnits || '0.00'}</td>
                        <td className="px-2 py-1 text-right border">{row.kwdUnits || '0.00'}</td>
                        <td className="px-2 py-1 text-right border">{row.kwpUnits || '0.00'}</td>
                        <td className="px-2 py-1 text-right border">{row.kwhUnits}</td>
                        <td className="px-2 py-1 text-right border">{row.kvaUnits || '0.00'}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.kwoCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.kwdCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.kwpCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.kwhCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.kvaCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.fixedCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.taxCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.facCharge)}</td>
                        <td className="px-2 py-1 text-right border">{formatCurrency(row.payments)}</td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-2 py-1 text-left border">TOTAL</td>
                      <td className="px-2 py-1 text-right border">{calculateTotals().noAccts}</td>
                      <td className="px-2 py-1 text-right border">{calculateTotals().kwoUnits.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right border">{calculateTotals().kwdUnits.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right border">{calculateTotals().kwpUnits.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right border">{calculateTotals().kwhUnits.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right border">{calculateTotals().kvaUnits.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().kwoCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().kwdCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().kwpCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().kwhCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().kvaCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().fixedCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().taxCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().facCharge)}</td>
                      <td className="px-2 py-1 text-right border">{formatCurrency(calculateTotals().payments)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TariffBlockWiseConsumption;