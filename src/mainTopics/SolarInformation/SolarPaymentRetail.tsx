import React, { useState, useEffect, useRef } from "react";
import { FaFileDownload, FaPrint } from "react-icons/fa";

interface Area {
  AreaCode: string;
  AreaName: string;
  ErrorMessage?: string | null;
}

interface Province {
  ProvinceCode: string;
  ProvinceName: string;
  ErrorMessage?: string | null;
}

interface Division {
  RegionCode: string;
  ErrorMessage?: string | null;
}

interface BillCycleOption {
  display: string;
  code: string;
}

interface DetailedRetailPayment {
  Division: string;
  Province: string;
  Area: string;
  CustomerName: string;
  AccountNumber: string;
  PanelCapacity: number;
  EnergyExported: number;
  EnergyImported: number;
  Tariff: string;
  BFUnits: number;
  UnitsInBill: number;
  Period: number;
  KwhCharge: number;
  FixedCharge: number;
  FuelCharge: number;
  CFUnits: number;
  Rate: number;
  UnitSale: number;
  KwhSales: number;
  BankCode: string;
  BranchCode: string;
  BankAccountNumber: string;
  AgreementDate: string;
  ErrorMessage?: string;
}

const SolarPaymentRetail: React.FC = () => {
  const maroon = "text-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  const [selectedCycleType, setSelectedCycleType] = useState<string>("");
  const [cycleValue, setCycleValue] = useState<string>("");
  const [reportType, setReportType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Area");
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [netType, setNetType] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Data states
  const [areas, setAreas] = useState<Area[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [cycleOptions, setCycleOptions] = useState<BillCycleOption[]>([]);

  // Loading states
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
  const [isLoadingCycles, setIsLoadingCycles] = useState(false);

  // Error states
  const [areaError, setAreaError] = useState<string | null>(null);
  const [provinceError, setProvinceError] = useState<string | null>(null);
  const [divisionError, setDivisionError] = useState<string | null>(null);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Display states
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [selectedCycleDisplay, setSelectedCycleDisplay] = useState<string>("");
  const [reportVisible, setReportVisible] = useState(false);

  // Report data
  const [detailedData, setDetailedData] = useState<DetailedRetailPayment[]>([]);

  const printRef = useRef<HTMLDivElement>(null);

  // Helper function for error handling
  const fetchWithErrorHandling = async (url: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

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
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  };

  // Generate cycle options
  const generateCycleOptions = (
    cycles: string[],
    maxCycle: string,
    cycleType: string
  ): BillCycleOption[] => {
    const maxCycleNum = parseInt(maxCycle);
    return cycles.map((cycle, index) => ({
      display: cycleType === "Calculation Cycle" 
        ? cycle
        : `${(maxCycleNum - index).toString()} - ${cycle}`,
      code: (maxCycleNum - index).toString(),
    }));
  };

  // Fetch areas
  useEffect(() => {
    const fetchAreas = async () => {
      setIsLoadingAreas(true);
      setAreaError(null);
      try {
        const areaData = await fetchWithErrorHandling("/misapi/api/areas");
        setAreas(areaData.data || []);
      } catch (err: any) {
        console.error("Error fetching areas:", err);
        setAreaError(
          err.message || "Failed to load areas. Please try again later."
        );
      } finally {
        setIsLoadingAreas(false);
      }
    };

    fetchAreas();
  }, []);

  // Fetch provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      setProvinceError(null);
      try {
        const provinceData = await fetchWithErrorHandling("/solarapi/ordinary/province");
        setProvinces(provinceData.data || []);
      } catch (err: any) {
        console.error("Error fetching provinces:", err);
        setProvinceError(
          err.message || "Failed to load provinces. Please try again later."
        );
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch divisions
  useEffect(() => {
    const fetchDivisions = async () => {
      setIsLoadingDivisions(true);
      setDivisionError(null);
      try {
        const divisionData = await fetchWithErrorHandling("/solarapi/ordinary/region");
        setDivisions(divisionData.data || []);
      } catch (err: any) {
        console.error("Error fetching divisions:", err);
        setDivisionError(
          err.message || "Failed to load divisions. Please try again later."
        );
      } finally {
        setIsLoadingDivisions(false);
      }
    };

    fetchDivisions();
  }, []);

  // Fetch cycles based on cycle type
  useEffect(() => {
    if (!selectedCycleType) {
      setCycleOptions([]);
      setCycleValue("");
      setSelectedCycleDisplay("");
      return;
    }

    const fetchCycles = async () => {
      setIsLoadingCycles(true);
      setCycleError(null);
      setCycleOptions([]);
      setCycleValue("");
      setSelectedCycleDisplay("");

      try {
        const cycleData = await fetchWithErrorHandling("/solarapi/retail/billcycle");
        if (cycleData.data && cycleData.data.BillCycles?.length > 0) {
          const options = generateCycleOptions(
            cycleData.data.BillCycles,
            cycleData.data.MaxBillCycle,
            selectedCycleType
          );
          setCycleOptions(options);
        } else {
          setCycleOptions([]);
        }
      } catch (err: any) {
        console.error("Error fetching cycles:", err);
        setCycleError(
          err.message || "Failed to load cycles. Please try again later."
        );
      } finally {
        setIsLoadingCycles(false);
      }
    };

    fetchCycles();
  }, [selectedCycleType]);

  const handleCycleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCycleType(value);
    setCycleValue("");
    setSelectedCycleDisplay("");
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);
    setCategoryValue("");
    setSelectedCategoryName("");
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const downloadAsCSV = () => {
    if (!detailedData.length) return;

    const reportTitle = "Solar Payment Information For Current Month - Retail";
    const selectionInfo =
      selectedCategory === "Entire CEB"
        ? "Entire CEB"
        : selectedCategory === "Area"
        ? `${selectedCategory}: ${selectedCategoryName}`
        : `${selectedCategory}: ${categoryValue}`;

    const headers = [
      "Division",
      "Province",
      "Area",
      "Name of Customer",
      "A/C No.",
      "Panel Capacity (kW)",
      "Energy Exported (kWh)",
      "Energy Imported (kWh)",
      "Tariff",
      "BF Units",
      "Units in Bill",
      "Period",
      "KWH Charge",
      "Fixed Charge",
      "Fuel Charge",
      "CF Units",
      "Rate",
      "Units Sale",
      "KWH Sales",
      "Bank Code",
      "Branch Code",
      "Bank Account Number",
      "Agreement Date",
    ];

    let currentDivision = "";
    let currentProvince = "";
    let currentArea = "";

    const rows = detailedData.map((item) => {
      const row: any[] = [];

      if (currentDivision !== item.Division) {
        currentDivision = item.Division;
        row.push(item.Division);
      } else {
        row.push("");
      }

      const provinceKey = `${item.Division}-${item.Province}`;
      if (currentProvince !== provinceKey) {
        currentProvince = provinceKey;
        row.push(item.Province);
      } else {
        row.push("");
      }

      const areaKey = `${item.Division}-${item.Province}-${item.Area}`;
      if (currentArea !== areaKey) {
        currentArea = areaKey;
        row.push(item.Area);
      } else {
        row.push("");
      }

      row.push(
        item.CustomerName,
        item.AccountNumber,
        item.PanelCapacity,
        item.EnergyExported,
        item.EnergyImported,
        item.Tariff,
        item.BFUnits,
        item.UnitsInBill,
        item.Period,
        item.KwhCharge,
        item.FixedCharge,
        item.FuelCharge,
        item.CFUnits,
        item.Rate,
        item.UnitSale,
        item.KwhSales,
        item.BankCode,
        item.BranchCode,
        item.BankAccountNumber,
        item.AgreementDate
      );

      return row;
    });

    const csvContent = [
      reportTitle,
      selectionInfo,
      `${selectedCycleType}: ${selectedCycleDisplay}`,
      `Report Type: ${reportType}`,
      `Net Type: ${netType}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const fileDescriptor =
        selectedCategory === "Entire CEB"
          ? "EntireCEB"
          : selectedCategory === "Area"
          ? `${selectedCategory}_${selectedCategoryName}`
          : `${selectedCategory}_${categoryValue}`;

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `SolarPaymentRetail_${fileDescriptor}_${selectedCycleType.replace(
          " ",
          ""
        )}_${cycleValue}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("Failed to export CSV");
    }
  };

  const printPDF = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const reportTitle = "SOLAR PAYMENT INFORMATION FOR CURRENT MONTH - RETAIL";
    const selectionInfo = (() => {
      if (selectedCategory === "Entire CEB") {
        return "Entire CEB";
      } else if (selectedCategory === "Area") {
        return `${selectedCategory}: <span class="bold">${selectedCategoryName}</span>`;
      } else {
        return `${selectedCategory}: <span class="bold">${categoryValue}</span>`;
      }
    })();

    printWindow.document.write(`
      <html>
        <head>
          <title>Solar Payment Retail Report</title>
          <style>
            body { font-family: Arial; font-size: 10px; margin: 10mm; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 4px; border: 1px solid #ddd; font-size: 10px; vertical-align: top;}
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .header { 
              font-weight: bold; 
              margin-bottom: 5px; 
              color: #7A0000;
              font-size: 12px;
            }
            .subheader { 
              margin-bottom: 12px; 
              font-size: 11px;
            }
            .footer { 
              margin-top: 10px; 
              font-size: 9px; 
              color: #666;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
              text-align: center; 
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .bold {
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">${reportTitle}</div>
          <div class="subheader">
            ${selectionInfo}<br>
            ${selectedCycleType}: <span class="bold">${selectedCycleDisplay}</span><br>
            Report Type: <span class="bold">${reportType}</span><br>
            Net Type: <span class="bold">${netType}</span>
          </div>
          ${printRef.current.innerHTML}
          <div class="footer">
            Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} | CEB@2025
          </div>
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

  const renderDetailedTable = () => {
    const groupedData = detailedData.reduce(
      (acc, item, index) => {
        const divisionKey = item.Division;
        const provinceKey = `${item.Division}-${item.Province}`;
        const areaKey = `${item.Division}-${item.Province}-${item.Area}`;

        if (!acc.divisionCounts[divisionKey])
          acc.divisionCounts[divisionKey] = 0;
        if (!acc.provinceCounts[provinceKey])
          acc.provinceCounts[provinceKey] = 0;
        if (!acc.areaCounts[areaKey]) acc.areaCounts[areaKey] = 0;

        acc.divisionCounts[divisionKey]++;
        acc.provinceCounts[provinceKey]++;
        acc.areaCounts[areaKey]++;

        acc.items.push({ ...item, index });
        return acc;
      },
      {
        divisionCounts: {} as Record<string, number>,
        provinceCounts: {} as Record<string, number>,
        areaCounts: {} as Record<string, number>,
        items: [] as any[],
      }
    );

    let currentDivision = "";
    let currentProvince = "";
    let currentArea = "";
    let divisionRowsRemaining = 0;
    let provinceRowsRemaining = 0;
    let areaRowsRemaining = 0;

    return (
      <table className="w-full border-collapse text-xs">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="border border-gray-300 px-2 py-1 text-center">Division</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Province</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Area</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Name of Customer</th>
            <th className="border border-gray-300 px-2 py-1 text-center">A/C No.</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Panel Capacity (kW)</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Energy Exported (kWh)</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Energy Imported (kWh)</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Tariff</th>
            <th className="border border-gray-300 px-2 py-1 text-center">BF Units</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Units in Bill</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Period</th>
            <th className="border border-gray-300 px-2 py-1 text-center">KWH Charge</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Fixed Charge</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Fuel Charge</th>
            <th className="border border-gray-300 px-2 py-1 text-center">CF Units</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Rate</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Units Sale</th>
            <th className="border border-gray-300 px-2 py-1 text-center">KWH Sales</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Bank Code</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Branch Code</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Bank Account Number</th>
            <th className="border border-gray-300 px-2 py-1 text-center">Agreement Date</th>
          </tr>
        </thead>
        <tbody>
          {groupedData.items.map((item, index) => {
            const divisionKey = item.Division;
            const provinceKey = `${item.Division}-${item.Province}`;
            const areaKey = `${item.Division}-${item.Province}-${item.Area}`;

            const showDivision = currentDivision !== divisionKey;
            if (showDivision) {
              currentDivision = divisionKey;
              divisionRowsRemaining = groupedData.divisionCounts[divisionKey];
            }

            const showProvince = currentProvince !== provinceKey;
            if (showProvince) {
              currentProvince = provinceKey;
              provinceRowsRemaining = groupedData.provinceCounts[provinceKey];
            }

            const showArea = currentArea !== areaKey;
            if (showArea) {
              currentArea = areaKey;
              areaRowsRemaining = groupedData.areaCounts[areaKey];
            }

            return (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {showDivision && (
                  <td className="border border-gray-300 px-2 py-1 align-top" rowSpan={divisionRowsRemaining}>
                    {item.Division}
                  </td>
                )}
                {showProvince && (
                  <td className="border border-gray-300 px-2 py-1 align-top" rowSpan={provinceRowsRemaining}>
                    {item.Province}
                  </td>
                )}
                {showArea && (
                  <td className="border border-gray-300 px-2 py-1 align-top" rowSpan={areaRowsRemaining}>
                    {item.Area}
                  </td>
                )}
                <td className="border border-gray-300 px-2 py-1">{item.CustomerName}</td>
                <td className="border border-gray-300 px-2 py-1">{item.AccountNumber}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(item.PanelCapacity)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{item.EnergyExported}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{item.EnergyImported}</td>
                <td className="border border-gray-300 px-2 py-1">{item.Tariff}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{item.BFUnits}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{item.UnitsInBill}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{item.Period}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(item.KwhCharge)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(item.FixedCharge)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(item.FuelCharge)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{item.CFUnits}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(item.Rate)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{item.UnitSale}</td>
                <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(item.KwhSales)}</td>
                <td className="border border-gray-300 px-2 py-1">{item.BankCode}</td>
                <td className="border border-gray-300 px-2 py-1">{item.BranchCode}</td>
                <td className="border border-gray-300 px-2 py-1">{item.BankAccountNumber}</td>
                <td className="border border-gray-300 px-2 py-1">{item.AgreementDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setReportError(null);
    setDetailedData([]);
    setReportVisible(false);

    try {
      let validationError = "";

      if (!cycleValue) validationError = `${selectedCycleType} is required`;
      if (!reportType) validationError = "Report type is required";
      if (!netType) validationError = "Net type is required";
      if (selectedCategory !== "Entire CEB" && !categoryValue) {
        validationError = `${selectedCategory} is required`;
      }

      if (validationError) {
        throw new Error(validationError);
      }

      const typeCode = selectedCategory === "Entire CEB" ? "" : categoryValue;
      let reportTypeParam = "";

      if (selectedCategory === "Entire CEB") {
        reportTypeParam = "entireceb";
      } else if (selectedCategory === "Area") {
        reportTypeParam = "area";
      } else if (selectedCategory === "Province") {
        reportTypeParam = "province";
      } else if (selectedCategory === "Division") {
        reportTypeParam = "region"; 
      }

      const cycleTypeParam = selectedCycleType === "Bill Cycle" ? "A" : "C";
      const cycleParam = selectedCycleType === "Bill Cycle" ? "billCycle" : "calcCycle";

      if (reportType === "Detailed Report") {
        // Map net type names to numeric codes
        const netTypeMap: Record<string, string> = {
          "Net Metering": "1",
          "Net Accounting": "2",
          "Net Plus": "3",
          "Net Plus Plus": "4",
          "Convert Net Metering to Net Accounting": "5"
        };
        
        const netTypeCode = netTypeMap[netType] || netType;
        
        // Build endpoint with correct parameter order: calcCycle/billCycle, netType, reportType, typeCode, cycleType
        let endpoint = `/solarapi/retail/detailed?${cycleParam}=${cycleValue}&netType=${netTypeCode}&reportType=${reportTypeParam}`;

        if (selectedCategory !== "Entire CEB") {
          endpoint += `&typeCode=${typeCode}`;
        }
        
        endpoint += `&cycleType=${cycleTypeParam}`;

        console.log("=== API Request Details ===");
        console.log("Cycle Type:", selectedCycleType);
        console.log("Cycle Param:", cycleParam, "=", cycleValue);
        console.log("Cycle Type Param:", cycleTypeParam);
        console.log("Net Type:", netType, "-> Code:", netTypeCode);
        console.log("Report Type Param:", reportTypeParam);
        console.log("Type Code:", typeCode);
        console.log("Full Endpoint:", endpoint);
        console.log("========================");

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          let errorMsg = `HTTP error ${response.status}`;
          try {
            const errorText = await response.text();
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.errorMessage) {
                errorMsg = errorData.errorMessage;
              } else if (errorData.message) {
                errorMsg = errorData.message;
              }
            } catch (e) {
              // Not valid JSON, use the text directly
              errorMsg = `${errorMsg}: ${errorText}`;
            }
          } catch (e) {
            // Couldn't read response body
            errorMsg = `${errorMsg}: ${response.statusText}`;
          }
          throw new Error(errorMsg);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON but got ${contentType}`);
        }

        const result = await response.json();
        console.log("API result:", result);

        const responseData = result.data || result;
        const detailedData = Array.isArray(responseData)
          ? responseData
          : [responseData];
        setDetailedData(detailedData);
        setReportVisible(true);
      } else if (reportType === "Summary Report") {
        setReportError("Summary report is not yet implemented. Please select Detailed Report.");
      }
    } catch (err: any) {
      console.error("Error in form submission:", err);
      if (err.message.includes("Failed to fetch")) {
        setReportError("Network error - please check your connection");
      } else {
        setReportError(err.message || "Failed to load payment data");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatAreaOption = (area: Area) => {
    return `${area.AreaCode} - ${area.AreaName}`;
  };

  const formatProvinceOption = (province: Province) => {
    return `${province.ProvinceCode} - ${province.ProvinceName}`;
  };

  const formatDivisionOption = (division: Division) => {
    return `${division.RegionCode}`;
  };

  const isCycleDisabled = () => {
    return !selectedCycleType;
  };

  const isReportTypeDisabled = () => {
    return !cycleValue || isCycleDisabled();
  };

  const isCategoryDisabled = () => {
    return !reportType || isReportTypeDisabled();
  };

  const isCategoryValueDisabled = () => {
    if (selectedCategory === "Entire CEB") return true;
    return (
      !selectedCategory ||
      isCategoryDisabled() ||
      (selectedCategory === "Area" && (isLoadingAreas || areaError !== null)) ||
      (selectedCategory === "Province" && (isLoadingProvinces || provinceError !== null)) ||
      (selectedCategory === "Division" && (isLoadingDivisions || divisionError !== null))
    );
  };

  const isNetTypeDisabled = () => {
    if (selectedCategory === "Entire CEB") {
      return !selectedCategory || isCategoryDisabled();
    }
    return !categoryValue || isCategoryValueDisabled();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      {!reportVisible && (
        <>
          <h2 className={`text-xl font-bold mb-6 ${maroon}`}>
            Solar Payment Information For Current Month - Retail
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Cycle Type Dropdown */}
              <div className="flex flex-col">
                <label className={`text-xs font-medium mb-1 ${maroon}`}>
                  Select Cycle Type:
                </label>
                <select
                  value={selectedCycleType}
                  onChange={handleCycleTypeChange}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
                  required
                >
                  <option value="">Select Cycle Type</option>
                  <option value="Bill Cycle">Bill Cycle (for the selected month)</option>
                  <option value="Calculation Cycle">Calculation Cycle (for the selected month)</option>
                </select>
              </div>

              {/* Month Dropdown */}
              <div className="flex flex-col">
                <label
                  className={`text-xs font-medium mb-1 ${
                    isCycleDisabled() ? "text-gray-400" : maroon
                  }`}
                >
                  Select Month:
                </label>
                {isLoadingCycles ? (
                  <div className="flex items-center justify-center py-2">
                    <svg
                      className="animate-spin h-5 w-5 text-[#7A0000]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="ml-2 text-xs">Loading cycles...</span>
                  </div>
                ) : cycleError ? (
                  <div className="text-red-500 text-xs py-2">{cycleError}</div>
                ) : (
                  <select
                    value={cycleValue}
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      setCycleValue(selectedCode);
                      const selectedOption = cycleOptions.find(
                        (option) => option.code === selectedCode
                      );
                      setSelectedCycleDisplay(
                        selectedOption ? selectedOption.display : ""
                      );
                    }}
                    className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent
                      ${
                        isCycleDisabled()
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "border-gray-300"
                      }`}
                    required
                    disabled={isCycleDisabled()}
                  >
                    <option value="">Select Month</option>
                    {cycleOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.display}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Report Type Dropdown */}
              <div className="flex flex-col">
                <label
                  className={`text-xs font-medium mb-1 ${
                    isReportTypeDisabled() ? "text-gray-400" : maroon
                  }`}
                >
                  Report Type:
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent
                    ${
                      isReportTypeDisabled()
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "border-gray-300"
                    }`}
                  required
                  disabled={isReportTypeDisabled()}
                >
                  <option value="">Select Report Type</option>
                  <option value="Detailed Report">Detailed Report</option>
                  <option value="Summary Report">Summary Report</option>
                </select>
              </div>

              {/* Report Category Dropdown */}
              <div className="flex flex-col">
                <label
                  className={`text-xs font-medium mb-1 ${
                    isCategoryDisabled() ? "text-gray-400" : maroon
                  }`}
                >
                  Select Report Category:
                </label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent
                    ${
                      isCategoryDisabled()
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "border-gray-300"
                    }`}
                  required
                  disabled={isCategoryDisabled()}
                >
                  <option value="Area">Area</option>
                  <option value="Province">Province</option>
                  <option value="Division">Division</option>
                  <option value="Entire CEB">Entire CEB</option>
                </select>
              </div>

              {/* Category Value Dropdown */}
              {selectedCategory === "Area" && (
                <div className="flex flex-col">
                  <label
                    className={`text-xs font-medium mb-1 ${
                      isCategoryValueDisabled() ? "text-gray-400" : maroon
                    }`}
                  >
                    Select Area:
                  </label>
                  {isLoadingAreas ? (
                    <div className="flex items-center justify-center py-2">
                      <svg
                        className="animate-spin h-5 w-5 text-[#7A0000]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="ml-2 text-xs">Loading areas...</span>
                    </div>
                  ) : areaError ? (
                    <div className="text-red-500 text-xs py-2">{areaError}</div>
                  ) : (
                    <select
                      value={categoryValue}
                      onChange={(e) => {
                        const selectedAreaCode = e.target.value;
                        setCategoryValue(selectedAreaCode);
                        const selectedArea = areas.find(
                          (area) => area.AreaCode === selectedAreaCode
                        );
                        setSelectedCategoryName(
                          selectedArea ? selectedArea.AreaName : ""
                        );
                      }}
                      className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent
                        ${
                          isCategoryValueDisabled()
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      required
                      disabled={isCategoryValueDisabled()}
                    >
                      <option value="">Select Area</option>
                      {areas.map((area) => (
                        <option key={area.AreaCode} value={area.AreaCode}>
                          {formatAreaOption(area)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {selectedCategory === "Province" && (
                <div className="flex flex-col">
                  <label
                    className={`text-xs font-medium mb-1 ${
                      isCategoryValueDisabled() ? "text-gray-400" : maroon
                    }`}
                  >
                    Select Province:
                  </label>
                  {isLoadingProvinces ? (
                    <div className="flex items-center justify-center py-2">
                      <svg
                        className="animate-spin h-5 w-5 text-[#7A0000]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="ml-2 text-xs">Loading provinces...</span>
                    </div>
                  ) : provinceError ? (
                    <div className="text-red-500 text-xs py-2">
                      {provinceError}
                    </div>
                  ) : (
                    <select
                      value={categoryValue}
                      onChange={(e) => setCategoryValue(e.target.value)}
                      className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent
                        ${
                          isCategoryValueDisabled()
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      required
                      disabled={isCategoryValueDisabled()}
                    >
                      <option value="">Select Province</option>
                      {provinces.map((province) => (
                        <option
                          key={province.ProvinceCode}
                          value={province.ProvinceCode}
                        >
                          {formatProvinceOption(province)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {selectedCategory === "Division" && (
                <div className="flex flex-col">
                  <label
                    className={`text-xs font-medium mb-1 ${
                      isCategoryValueDisabled() ? "text-gray-400" : maroon
                    }`}
                  >
                    Select Division:
                  </label>
                  {isLoadingDivisions ? (
                    <div className="flex items-center justify-center py-2">
                      <svg
                        className="animate-spin h-5 w-5 text-[#7A0000]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="ml-2 text-xs">Loading divisions...</span>
                    </div>
                  ) : divisionError ? (
                    <div className="text-red-500 text-xs py-2">
                      {divisionError}
                    </div>
                  ) : (
                    <select
                      value={categoryValue}
                      onChange={(e) => setCategoryValue(e.target.value)}
                      className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent
                        ${
                          isCategoryValueDisabled()
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "border-gray-300"
                        }`}
                      required
                      disabled={isCategoryValueDisabled()}
                    >
                      <option value="">Select Division</option>
                      {divisions.map((division) => (
                        <option
                          key={division.RegionCode}
                          value={division.RegionCode}
                        >
                          {formatDivisionOption(division)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Net Type Dropdown */}
              <div className="flex flex-col">
                <label
                  className={`text-xs font-medium mb-1 ${
                    isNetTypeDisabled() ? "text-gray-400" : maroon
                  }`}
                >
                  Select Net Type:
                </label>
                <select
                  value={netType}
                  onChange={(e) => setNetType(e.target.value)}
                  className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent
                    ${
                      isNetTypeDisabled()
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "border-gray-300"
                    }`}
                  required
                  disabled={isNetTypeDisabled()}
                >
                  <option value="">Select Net Type</option>
                  <option value="Net Metering">Net Metering</option>
                  <option value="Net Accounting">Net Accounting</option>
                  <option value="Net Plus">Net Plus</option>
                  <option value="Net Plus Plus">Net Plus Plus</option>
                  <option value="Convert Net Metering to Net Accounting">
                    Convert Net Metering to Net Accounting
                  </option>
                </select>
              </div>
            </div>

            {/* Submit button */}
            <div className="w-full mt-6 flex justify-end">
              <button
                type="submit"
                className={`px-6 py-2 rounded-md font-medium transition-opacity duration-300 shadow
                  ${maroonGrad} text-white ${
                  loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
                }`}
                disabled={loading || isNetTypeDisabled() || !netType}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "Generate Report"
                )}
              </button>
            </div>
          </form>
        </>
      )}

      {/* Report Section */}
      {reportVisible && (
        <div className="mt-6">
          {/* Report Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 className={`text-xl font-bold ${maroon}`}>
                Solar Payment Information - Retail
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedCategory === "Entire CEB"
                  ? "Entire CEB"
                  : selectedCategory === "Area"
                  ? `${selectedCategory}: ${selectedCategoryName}`
                  : `${selectedCategory}: ${categoryValue}`}{" "}
                | {selectedCycleType}: {selectedCycleDisplay} | Type:{" "}
                {reportType} | Net Type: {netType}
              </p>
            </div>
            <div className="flex space-x-2 mt-2 md:mt-0">
              <button
                onClick={downloadAsCSV}
                className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              >
                <FaFileDownload className="w-3 h-3" /> CSV
              </button>
              <button
                onClick={printPDF}
                className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
              >
                <FaPrint className="w-3 h-3" /> PDF
              </button>
              <button
                onClick={() => setReportVisible(false)}
                className="px-4 py-1.5 bg-[#7A0000] hover:bg-[#A52A2A] text-xs rounded-md text-white flex items-center"
              >
                Back to Form
              </button>
            </div>
          </div>

          {/* Report Table */}
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] border border-gray-300 rounded-lg">
            <div ref={printRef} className="min-w-full">
              {renderDetailedTable()}
            </div>
          </div>

          {/* Error Message */}
          {reportError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {reportError}
            </div>
          )}
        </div>
      )}

      {/* Error Message (when not in report view) */}
      {!reportVisible && reportError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {reportError}
        </div>
      )}
    </div>
  );
};

export default SolarPaymentRetail;