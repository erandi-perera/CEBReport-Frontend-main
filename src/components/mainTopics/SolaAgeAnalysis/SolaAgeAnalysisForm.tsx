import React, { useState, useEffect, useCallback } from "react";
import SolaAgeAnalysisTable from "./SolaAgeAnalysisTable";
import { SOLAR_AGE_ANALYSIS_SUMMARY_API } from "../../../services/BackendServices";

// Interfaces
interface Area {
  AreaCode: string;
  AreaName: string;
  ErrorMessage?: string | null;
}

interface BillCycleOption {
  display: string;
  code: string;
}

interface AgeCategoryData {
  Age_0_1: number;
  Age_1_2: number;
  Age_2_3: number;
  Age_3_4: number;
  Age_4_5: number;
  Age_5_6: number;
  Age_6_7: number;
  Age_7_8: number;
  Age_Above_8: number;
  AgreementDateNull: number;
  ErrorMessage: string | null;
}

// SolarCustomer interface removed (unused)

interface SolarAgeCategoryData {
  AccountNumber: string;
  Name: string;
  Address: string;
  NetType: string;
  InitialAgreementDate: string;
}

const SolaAgeAnalysisForm: React.FC = () => {
  // State
  const [areas, setAreas] = useState<Area[]>([]);
  const [billCycleOptions, setBillCycleOptions] = useState<BillCycleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ageCategoryData, setAgeCategoryData] = useState<AgeCategoryData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Detailed view state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [detailedCustomers, setDetailedCustomers] = useState<SolarAgeCategoryData[]>([]);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [showDetailedModal, setShowDetailedModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    billCycle: "",
    areaCode: "",
  });

  // Helper functions
  const generateBillCycleOptions = (
    billCycles: string[],
    maxCycle: string
  ): BillCycleOption[] => {
    const maxCycleNum = parseInt(maxCycle);
    return billCycles.map((cycle, index) => ({
      display: cycle,
      code: (maxCycleNum - index).toString(),
    }));
  };

  const fetchWithErrorHandling = async (url: string, timeout = 60000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.errorMessage) {
            errorMsg = errorData.errorMessage;
          }
        } catch (e) {
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      return await response.json();
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          "Request timed out - the server may be processing a large dataset"
        );
      }
      console.error(`Error fetching ${url}:`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

  // Effects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch areas
        const areaData = await fetchWithErrorHandling("/misapi/api/areas");
        setAreas(areaData.data || []);
        if (areaData.data?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            areaCode: areaData.data[0].AreaCode,
          }));
        }

        // Fetch bill cycles
        const maxCycleData = await fetchWithErrorHandling(
          "/misapi/api/billcycle/max"
        );
        if (maxCycleData.data && maxCycleData.data.BillCycles?.length > 0) {
          const options = generateBillCycleOptions(
            maxCycleData.data.BillCycles,
            maxCycleData.data.MaxBillCycle
          );
          setBillCycleOptions(options);
          setFormData((prev) => ({ ...prev, billCycle: options[0].code }));
        } else {
          setBillCycleOptions([]);
          setFormData((prev) => ({ ...prev, billCycle: "" }));
        }
      } catch (err: any) {
        setError("Error loading data: " + (err.message || err.toString()));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Event handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.areaCode || !formData.billCycle) return;

    setReportLoading(true);
    setReportError(null);
    setAgeCategoryData(null);
    setShowReport(false);

    try {
      // Use the correct backend API endpoint
      // Add server param if needed (replace 'cpinfdb1' with your actual server if dynamic)
      const url = `${SOLAR_AGE_ANALYSIS_SUMMARY_API}?areaCode=${formData.areaCode}&billCycle=${formData.billCycle}&server=cpinfdb1`;

      // Increased timeout for Solar customer reports
      const timeout = 120000; // 2 minutes
      
      const data = await fetchWithErrorHandling(url, timeout);

      if (data.errorMessage) {
        throw new Error(data.errorMessage);
      }

      let resultData = data.data;

      // Use real API data only; do not inject mock data

      if (resultData && typeof resultData === 'object') {
        if (resultData.ErrorMessage) {
          throw new Error(resultData.ErrorMessage);
        }
        setAgeCategoryData(resultData);
        setShowReport(true);
      } else if (resultData === null || resultData === undefined) {
        // Handle empty/null response - show no content available
        setAgeCategoryData(null);
        setShowReport(true);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err: any) {
      let errorMessage = "Error fetching report: ";

      if (err.message && err.message.includes("timed out")) {
        errorMessage +=
          "The request timed out. This usually happens when there are too many records. Try selecting a smaller area.";
      } else {
        errorMessage += err.message || err.toString();
      }

      setReportError(errorMessage);
    } finally {
      setReportLoading(false);
    }
  };

  // Handle view detailed customers for age category
  const handleViewCategory = async (category: string) => {
    setSelectedCategory(category);
    setDetailedLoading(true);
    setDetailedError(null);
    setShowDetailedModal(true);

    try {
      // Map category to API endpoint
      const categoryMap: { [key: string]: string } = {
        "0-1 Years": "age-below-1",
        "1-2 Years": "age-1-to-2",
        "2-3 Years": "age-2-to-3",
        "3-4 Years": "age-3-to-4",
        "4-5 Years": "age-4-to-5",
        "5-6 Years": "age-5-to-6",
        "6-7 Years": "age-6-to-7",
        "7-8 Years": "age-7-to-8",
        "Above 8 Years": "age-above-8",
        "Agreement Date Null": "agreement-date-null",
      };

      const apiEndpoint = categoryMap[category];
      if (!apiEndpoint) {
        throw new Error("Invalid category selected");
      }

      const url = `http://localhost:44381/api/solar-age-category/${apiEndpoint}?areaCode=${formData.areaCode}&billCycle=${formData.billCycle}`;

      const data = await fetchWithErrorHandling(url, 120000); // 2 minutes timeout

      if (data.errorMessage) {
        throw new Error(data.errorMessage);
      }

      const customers = data.data || [];
      
      console.log("API Response:", data);
      console.log("Customers data:", customers);
      
      // Transform API response to match SolarAgeCategoryData interface
      const transformedCustomers: SolarAgeCategoryData[] = customers.map((customer: any) => ({
        AccountNumber: customer.AccountNumber || "",
        Name: customer.CustomerName || "", // Use correct API key
        Address: `${customer.Address1 || ""}${customer.Address2 ? `, ${customer.Address2}` : ""}${customer.Address3 ? `, ${customer.Address3}` : ""}`,
        NetType: customer.NetTypeName || "", // Use correct API key
        InitialAgreementDate: customer.AgreementDate || "N/A",
      }));
      
      console.log("Transformed customers:", transformedCustomers);
      setDetailedCustomers(transformedCustomers);
    } catch (err: any) {
      console.error("Error fetching detailed data:", err);
      let errorMessage = "Error fetching detailed data: ";
      if (err.message.includes("timed out")) {
        errorMessage += "The request timed out. This usually happens when there are too many records.";
      } else {
        errorMessage += err.message || err.toString();
      }
      setDetailedError(errorMessage);
    } finally {
      setDetailedLoading(false);
    }
  };

  // CSV Download Function
  const downloadAsCSV = useCallback(() => {
    if (detailedCustomers.length === 0) return;

    const headers = [
      "Account Number",
      "Name",
      "Address",
      "Net Type",
      "Initial Agreement Date",
    ];

    const rows = detailedCustomers.map((customer) => [
      customer.AccountNumber,
      customer.Name,
      customer.Address,
      customer.NetType,
      customer.InitialAgreementDate || "N/A",
    ]);

    const csvContent = [
      `"Solar Age Analysis - ${selectedCategory}"`,
      `"Area: ${areas.find((a) => a.AreaCode === formData.areaCode)?.AreaName} (${formData.areaCode})"`,
      `"Bill Cycle: ${formData.billCycle}"`,
      "",
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SolarAgeAnalysis_${selectedCategory}_Cycle${formData.billCycle}_Area${formData.areaCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [detailedCustomers, selectedCategory, formData, areas]);

  // PDF Download Function
  const printPDF = useCallback(() => {
    if (detailedCustomers.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = detailedCustomers
      .map(
        (customer, index) => `
      <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f9f9f9"};">
        <td style="border: 1px solid #ddd; padding: 2px 4px; font-size: 10px; vertical-align: top;">${customer.AccountNumber}</td>
        <td style="border: 1px solid #ddd; padding: 2px 4px; font-size: 10px; vertical-align: top;">${customer.Name}</td>
        <td style="border: 1px solid #ddd; padding: 2px 4px; font-size: 10px; vertical-align: top;">${customer.Address}</td>
        <td style="border: 1px solid #ddd; padding: 2px 4px; font-size: 10px; vertical-align: top;">${customer.NetType}</td>
        <td style="border: 1px solid #ddd; padding: 2px 4px; font-size: 10px; vertical-align: top;">${customer.InitialAgreementDate || "N/A"}</td>
      </tr>
    `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Solar Age Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 10px; }
          .header { text-align: center; margin-bottom: 20px; }
          h1 { margin: 5px 0; }
          .info { margin: 10px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f0f0f0; border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 10px; font-weight: bold; }
          td { border: 1px solid #ddd; padding: 2px 4px; font-size: 10px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Solar Age Analysis Report</h1>
        </div>
        <div class="info">
          <p><strong>Age Category:</strong> ${selectedCategory}</p>
          <p><strong>Area:</strong> ${areas.find((a) => a.AreaCode === formData.areaCode)?.AreaName} (${formData.areaCode})</p>
          <p><strong>Bill Cycle:</strong> ${formData.billCycle}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Records:</strong> ${detailedCustomers.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 10px; font-weight: bold;">Account Number</th>
              <th style="border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 10px; font-weight: bold;">Name</th>
              <th style="border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 10px; font-weight: bold;">Address</th>
              <th style="border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 10px; font-weight: bold;">Net Type</th>
              <th style="border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 10px; font-weight: bold;">Initial Agreement Date</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  }, [detailedCustomers, selectedCategory, formData, areas]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A0000]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6 text-[#7A0000]">Solar Age Analysis</h2>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bill Cycle Dropdown */}
          <div className="flex flex-col">
            <label htmlFor="billCycleSelectForm" className="text-[#7A0000] text-xs font-medium mb-1">
              Select Bill Cycle:
            </label>
            <select
              id="billCycleSelectForm"
              title="Select Bill Cycle"
              name="billCycle"
              value={formData.billCycle}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
              required
            >
              {billCycleOptions.map((option) => (
                <option key={option.code} value={option.code} className="text-xs py-1">
                  {option.display} - {option.code}
                </option>
              ))}
            </select>
          </div>

          {/* Area Dropdown */}
          <div className="flex flex-col">
            <label htmlFor="areaCodeSelectForm" className="text-[#7A0000] text-xs font-medium mb-1">
              Select Area:
            </label>
            <select
              id="areaCodeSelectForm"
              title="Select Area"
              name="areaCode"
              value={formData.areaCode}
              onChange={handleInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
              required
            >
              {areas.map((area) => (
                <option key={area.AreaCode} value={area.AreaCode} className="text-xs py-1">
                  {area.AreaName} ({area.AreaCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="w-full mt-6 flex justify-end">
          <button
            type="submit"
            disabled={reportLoading || !formData.areaCode || !formData.billCycle}
            className={`px-6 py-2 rounded-md font-medium transition-opacity duration-300 shadow bg-gradient-to-r from-[#7A0000] to-[#A52A2A] text-white ${
              reportLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
            }`}
          >
            {reportLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>
      </form>

      {reportError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {reportError}
        </div>
      )}

      {showReport && ageCategoryData && (
        <SolaAgeAnalysisTable
          ageCategoryData={ageCategoryData}
          onViewCategory={handleViewCategory}
          areaName={areas.find(a => a.AreaCode === formData.areaCode)?.AreaName}
        />
      )}
      {showReport && !ageCategoryData && (
        <div className="text-center text-gray-500 py-10 border rounded-lg bg-gray-50">
          No data available for Age Analysis for solar customers.
        </div>
      )}

      {/* Detailed View Modal */}
      {showDetailedModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header with Info and Action Buttons */}
            <div className="flex justify-between items-center p-4 border-b bg-white">
              {/* Left Side: Area, Bill Cycle, Age Category Info */}
              <div className="flex gap-6 text-xs">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700">Area:</span>
                  <span className="text-gray-600">{areas.find(a => a.AreaCode === formData.areaCode)?.AreaName || formData.areaCode}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700">Bill Cycle:</span>
                  <span className="text-gray-600">{formData.billCycle}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700">Age Category:</span>
                  <span className="text-gray-600">{selectedCategory}</span>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex gap-3 items-center">
                <button
                  onClick={downloadAsCSV}
                  className="px-4 py-2 text-xs font-semibold text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                  title="Export as CSV"
                >
                  📄 CSV
                </button>
                <button
                  onClick={printPDF}
                  className="px-4 py-2 text-xs font-semibold text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
                  title="Export as PDF"
                >
                  📋 PDF
                </button>
                <button
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#7A0000] hover:bg-[#A52A2A] rounded-lg shadow transition-colors"
                  onClick={() => setShowDetailedModal(false)}
                  title="Back to Form"
                >
                  Back to Form
                </button>
                <button
                  onClick={() => setShowDetailedModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-1"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {detailedLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000]"></div>
                  <span className="ml-2">Loading customer details...</span>
                </div>
              ) : detailedError ? (
                <div className="text-red-500 text-center p-4">
                  {detailedError}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Account Number
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Name
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Address
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Net Type
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Initial Agreement Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailedCustomers.length > 0 ? (
                        detailedCustomers.map((customer, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                              {customer.AccountNumber}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                              {customer.Name}
                            </td>
                            <td className="px-2 py-2 text-xs text-gray-900">
                              {customer.Address}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                              {customer.NetType}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                              {customer.InitialAgreementDate || "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                            No customers found for this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolaAgeAnalysisForm;
