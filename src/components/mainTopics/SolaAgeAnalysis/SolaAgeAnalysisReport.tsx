import React, { useState, useEffect } from "react";
import CustomButton from "../../shared/Button";
import ReportTable from "../../shared/ReportTable";
import SolaAgeCategoryTable from "./SolaAgeCategoryTable";
import { SOLAR_AGE_ANALYSIS_SUMMARY_API, SOLAR_AGE_CATEGORY_API } from "../../../services/BackendServices";

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

interface SolaAgeAnalysisTableProps {
  ageCategoryData: AgeCategoryData | null;
  areaName?: string;
}

interface Area {
  AreaCode: string;
  AreaName: string;
  ErrorMessage?: string | null;
}

interface BillCycleOption {
  display: string;
  code: string;
}
interface SolarAgeCategoryData {
  AccountNumber: string;
  Name: string;
  Address: string;
  NetType: string;
  InitialAgreementDate: string;
}

const SolaAgeAnalysisTable: React.FC<SolaAgeAnalysisTableProps> = ({
  ageCategoryData,
  areaName,
}) => {
  // State
  const [areas, setAreas] = useState<Area[]>([]);
  const [billCycleOptions, setBillCycleOptions] = useState<BillCycleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(!!ageCategoryData);

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
  const [ageCategoryDataState, setAgeCategoryDataState] = useState<AgeCategoryData | null>(ageCategoryData);

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
    setAgeCategoryDataState(null);
    setShowReport(false);

    try {
      const url = `${SOLAR_AGE_ANALYSIS_SUMMARY_API}?areaCode=${formData.areaCode}&billCycle=${formData.billCycle}`;

      // Increased timeout for Solar customer reports
      const timeout = 120000; // 2 minutes
      
      const data = await fetchWithErrorHandling(url, timeout);

      if (data.errorMessage) {
        throw new Error(data.errorMessage);
      }

      const resultData = data.data;

      if (resultData && typeof resultData === 'object') {
        if (resultData.ErrorMessage) {
          throw new Error(resultData.ErrorMessage);
        }
        setAgeCategoryDataState(resultData);
      } else {
        throw new Error('Invalid data format received from API');
      }
      
      setShowReport(true);
    } catch (err: any) {
      let errorMessage = "Error fetching report: ";

      if (err.message.includes("timed out")) {
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

      const url = `${SOLAR_AGE_CATEGORY_API}/${apiEndpoint}?areaCode=${formData.areaCode}&billCycle=${formData.billCycle}`;

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
      setDetailedLoading(false);
    } catch (err: any) {
      console.error("Error fetching detailed data:", err);
      let errorMessage = "Error fetching detailed data: ";
      if (err.message.includes("timed out")) {
        errorMessage += "The request timed out. This usually happens when there are too many records.";
      } else {
        errorMessage += err.message || err.toString();
      }
      setDetailedError(errorMessage);
      setDetailedLoading(false);
    }
  };
  const totals = React.useMemo(() => {
    if (!ageCategoryDataState) return null;

    return {
      totalCount:
        ageCategoryDataState.Age_0_1 +
        ageCategoryDataState.Age_1_2 +
        ageCategoryDataState.Age_2_3 +
        ageCategoryDataState.Age_3_4 +
        ageCategoryDataState.Age_4_5 +
        ageCategoryDataState.Age_5_6 +
        ageCategoryDataState.Age_6_7 +
        ageCategoryDataState.Age_7_8 +
        ageCategoryDataState.Age_Above_8 +
        ageCategoryDataState.AgreementDateNull,
    };
  }, [ageCategoryDataState]);

  const buildRow = (label: string, value: number) => ({
    category: label,
    count: value,
    percentage:
      totals && totals.totalCount > 0
        ? ((value / totals.totalCount) * 100).toFixed(1) + "%"
        : "0.0%",
    actions: (
      <CustomButton
        color="bg-blue-600 hover:bg-blue-700"
        onClick={() => handleViewCategory(label)}
        className="text-xs px-3 py-1 rounded-md shadow-sm"
      >
        View
      </CustomButton>
    ),
  });

  const tableData = ageCategoryDataState
    ? [
        buildRow("0-1 Years", ageCategoryDataState.Age_0_1),
        buildRow("1-2 Years", ageCategoryDataState.Age_1_2),
        buildRow("2-3 Years", ageCategoryDataState.Age_2_3),
        buildRow("3-4 Years", ageCategoryDataState.Age_3_4),
        buildRow("4-5 Years", ageCategoryDataState.Age_4_5),
        buildRow("5-6 Years", ageCategoryDataState.Age_5_6),
        buildRow("6-7 Years", ageCategoryDataState.Age_6_7),
        buildRow("7-8 Years", ageCategoryDataState.Age_7_8),
        buildRow("Above 8 Years", ageCategoryDataState.Age_Above_8),
        buildRow("Agreement Date Null", ageCategoryDataState.AgreementDateNull),
        {
          category: "Total",
          count: totals?.totalCount || 0,
          percentage: "100.0%",
          actions: "",
        },
      ]
    : [];

  const tableColumns = [
    { label: "Age Category", accessor: "category", align: "left" as const },
    { label: "Customer Count", accessor: "count", align: "right" as const },
    { label: "Percentage", accessor: "percentage", align: "right" as const },
    { label: "Actions", accessor: "actions", align: "center" as const },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7A0000]"></div>
        <span className="ml-3 text-sm text-gray-600">Loading...</span>
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

  if (!ageCategoryDataState) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-[#7A0000]">Solar Age Analysis</h2>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bill Cycle Dropdown */}
            <div className="flex flex-col">
              <label htmlFor="billCycleSelect" className="text-[#7A0000] text-xs font-medium mb-1">
                Select Bill Cycle:
              </label>
              <select
                id="billCycleSelect"
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
              <label htmlFor="areaCodeSelect" className="text-[#7A0000] text-xs font-medium mb-1">
                Select Area:
              </label>
              <select
                id="areaCodeSelect"
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
            <label htmlFor="billCycleSelectMain" className="text-[#7A0000] text-xs font-medium mb-1">
              Select Bill Cycle:
            </label>
            <select
              id="billCycleSelectMain"
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
            <label htmlFor="areaCodeSelectMain" className="text-[#7A0000] text-xs font-medium mb-1">
              Select Area:
            </label>
            <select
              id="areaCodeSelectMain"
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


      {showReport && (
        ageCategoryDataState && tableData.length > 1 ? (
          <div className="mt-6 bg-white rounded-xl shadow border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-[#7A0000] mb-1">
              Solar Age Analysis Summary
            </h3>
            {areaName && (
              <p className="text-sm text-gray-600 mb-4">
                Area : <span className="font-semibold">{areaName}</span>
              </p>
            )}
            <ReportTable
              columns={tableColumns}
              data={tableData}
              emptyMessage="No data available for Age Analysis for solar customers."
            />
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-xl shadow border border-gray-200 p-6 text-center text-gray-500">
            <h3 className="text-lg font-bold text-[#7A0000] mb-1">
              Solar Age Analysis Summary
            </h3>
            <p className="my-8">No data available for Age Analysis for solar customers.</p>
          </div>
        )
      )}

      {/* Detailed View Modal */}
      {showDetailedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <SolaAgeCategoryTable
              data={detailedCustomers}
              loading={detailedLoading}
              error={detailedError}
              category={selectedCategory || ""}
              onClose={() => setShowDetailedModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Change the export to use the correct form with area and bill cycle selection
export default SolaAgeAnalysisTable;
