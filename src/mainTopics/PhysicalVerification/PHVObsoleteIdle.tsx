import React, { useState, useRef, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { toast } from "react-toastify";
import ReportViewer from "../../components/utils/ReportViewer";
import YearMonthDropdowns from "../../components/utils/YearMonthDropdowns";
import { Search, RotateCcw, Eye } from "lucide-react";

interface CostCentre {
  DeptId: string;
  DeptName: string;
}

interface Warehouse {
  WarehouseCode: string;
  CostCenterId?: string;
}

interface PHVObsoleteIdleItem {
  PhvDate: string;
  MaterialCode: string;
  MaterialName: string;
  UomCode: string;
  GradeCode: string;
  UnitPrice: number;
  QtyOnHand: number;
  DocumentNo: string;
  StockBook: number;
  Reason: string;
  [key: string]: any;
}

const formatNumber = (num: number | null | undefined): string => {
  if (num == null) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const escapeHtml = (text: string | null | undefined): string => {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const PHVObsoleteIdleWHwise: React.FC = () => {
  const { user } = useUser();
  const epfNo = user?.Userno || "";
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [data, setData] = useState<CostCentre[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filtered, setFiltered] = useState<CostCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedDept, setSelectedDept] = useState<CostCentre | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [reportData, setReportData] = useState<PHVObsoleteIdleItem[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const maroon = "text-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  const currentYear = new Date().getFullYear();

  const pageSize = 9;

  const parseApiResponse = (response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.result && Array.isArray(response.result)) return response.result;
    if (response.departments && Array.isArray(response.departments)) return response.departments;
    if (response.Data && Array.isArray(response.Data)) return response.Data;
    if (response.warehouses && Array.isArray(response.warehouses)) return response.warehouses;
    console.warn("Unexpected API response format:", response);
    return [];
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!epfNo) {
        setError("No EPF number available. Please login again.");
        toast.error("No EPF number available. Please login again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/misapi/api/incomeexpenditure/departments/${encodeURIComponent(epfNo)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
          }
        );
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        const parsed = await res.json();
        const rawData = parseApiResponse(parsed);
        const final: CostCentre[] = rawData.map((item: any) => ({
          DeptId: item.DeptId?.toString() || "",
          DeptName: item.DeptName?.toString().trim() || "",
        }));
        setData(final);
        setFiltered(final);
      } catch (e: any) {
        console.error("Cost Center Fetch Error:", e);
        const errorMessage = e.message.includes("JSON.parse")
          ? "Invalid data format received from server."
          : e.message.includes("Failed to fetch")
          ? "Failed to connect to the server. Please check if the server is running."
          : e.message;
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, [epfNo]);

  useEffect(() => {
    const f = data.filter(
      (d) =>
        (!searchId || d.DeptId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || d.DeptName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFiltered(f);
    setPage(1);
  }, [searchId, searchName, data]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      setWarehouses([]);
      setSelectedWarehouse("");
      if (!selectedDept || !epfNo) {
        return;
      }
      setLoading(true);
      try {
        const url = `/misapi/api/inventoryaverageconsumption/warehouses/${encodeURIComponent(epfNo)}?costCenterId=${encodeURIComponent(selectedDept.DeptId)}&t=${Date.now()}`;
        console.log("Fetching warehouses from:", url);
        console.log("Selected Cost Center ID:", selectedDept.DeptId);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        const result = await response.json();
        console.log("Raw Warehouse API Response:", result);
        const rawData = parseApiResponse(result);
        const warehousesData: Warehouse[] = rawData.map((item: any) => ({
          WarehouseCode: item.WarehouseCode?.toString().trim() || "",
          CostCenterId: item.CostCenterId?.toString().trim() || "",
        }));
        // Fallback client-side filter
        const filteredData = warehousesData.filter((item) => !item.CostCenterId || item.CostCenterId === selectedDept.DeptId);
        console.log("Filtered Warehouses:", filteredData);
        setWarehouses(filteredData);
        if (filteredData.length === 0) {
          toast.warn(`No warehouses found for cost center ${selectedDept.DeptId}.`);
        } else {
          if (filteredData.length === 1) {
            setSelectedWarehouse(filteredData[0].WarehouseCode);
          }
          toast.success(`Successfully fetched ${filteredData.length} warehouse(s) for cost center ${selectedDept.DeptId}.`);
        }
      } catch (error: any) {
        console.error("Warehouse Fetch Error Details:", error);
        const errorMessage = error.message.includes("Failed to fetch")
          ? "Failed to connect to the server. Please verify the warehouse endpoint exists."
          : error.message;
        toast.error(`Failed to fetch warehouses: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, [selectedDept, epfNo]);

  const handleViewReport = async () => {
    if (!selectedDept) {
      toast.error("Please select a cost center.");
      return;
    }
    if (!selectedWarehouse) {
      toast.error("Please select a warehouse code.");
      return;
    }
    if (!selectedMonth || !selectedYear) {
      toast.error("Please select both Month and Year");
      return;
    }
    setReportLoading(true);
    setShowReport(true);
    setReportData([]);
    try {
     const res = await fetch(
  `http://localhost:44381/api/phv-obsolete-idle/list?deptId=${encodeURIComponent(
    selectedDept.DeptId
  )}&repYear=${selectedYear}&repMonth=${selectedMonth}&warehouseCode=${encodeURIComponent(
    selectedWarehouse
  )}`
);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      const json = await res.json();
      const items: PHVObsoleteIdleItem[] = Array.isArray(json) ? json : json.data || [];
      setReportData(items);
      items.length === 0
        ? toast.warn("No records found")
        : toast.success("Report loaded successfully");
    } catch (err: any) {
      console.error("Report fetch error:", err);
      toast.error("Failed to load report: " + (err.message || "Unknown error"));
    } finally {
      setReportLoading(false);
    }
  };

  const closeReport = () => {
    setShowReport(false);
    setReportData([]);
    setSelectedDept(null);
    setSelectedMonth(null);
    setSelectedYear(currentYear);
    setSelectedWarehouse("");
  };

  const handleDownloadCSV = () => {
    if (reportData.length === 0 || !selectedDept) return;

    const csvSafe = (value: any) => {
      if (value == null) return '""';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      "Serial No",
      "Code No",
      "Description",
      "Grade Code",
      "UOM",
      "Quantity (Stock Book)",
      "Unit Price",
      "Cost (Rs.) (Stock Book)",
      "Reasons",
      "Recommended action to be taken",
    ];

    const csvRows: string[] = [
      csvSafe(`STATEMENT OF OBSOLETE AND IDLE MATERIALS IN STOCKS - ${selectedYear}`),
      csvSafe(`COST CENTRE : ${selectedDept.DeptId} WARE HOUSE - ${selectedWarehouse}`),
      "",
      csvSafe("1.ORIGINAL : Deputy General Manager"),
      csvSafe("2.DUPLICATE : Engineer-in-charge"),
      csvSafe("3.TRIPLCATE : Store-kepper/E.S.(C.S.C)"),
      csvSafe(`Date of Verification : ${reportData[0]?.PhvDate || ".............."}`),
      csvSafe("Form - AV/7A"),
      "",
    ];

    csvRows.push(headers.map(csvSafe).join(","));

    reportData.forEach((item, idx) => {
      const row = [
        idx + 1,
        "\t" + (item.MaterialCode || ""),
        item.MaterialName || "",
        item.GradeCode || "",
        item.UomCode || "",
        formatNumber(item.QtyOnHand),
        formatNumber(item.UnitPrice),
        formatNumber(item.StockBook),
        item.Reason || "",
        "",
      ];
      csvRows.push(row.map(csvSafe).join(","));
    });

    const totalStockBook = reportData.reduce((sum, item) => sum + (item.StockBook || 0), 0);
    csvRows.push("");
    csvRows.push([
      '""', '""', '"Total Stocks"', '""', '""', '""', '""',
      formatNumber(totalStockBook),
      '""', '""'
    ].join(","));

    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PHV_Obsolete_Idle_WHwise_${selectedDept.DeptId}_${selectedWarehouse}_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    if (reportData.length === 0 || !iframeRef.current || !selectedDept) return;

    const tableStyle = `
      @page { size: A4 portrait; margin: 10mm; }
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 10px; }
      .page { page-break-after: always; min-height: 277mm; position: relative; display: flex; flex-direction: column; }
      .header { text-align: center; margin-bottom: 8px; }
      .header h2 { color: #7A0000; font-size: 14px; margin: 0; }
      .header h3 { font-size: 12px; margin: 4px 0; }
      .subtitles { font-size: 10px; display: flex; justify-content: space-between; margin: 2px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #000; padding: 4px; text-align: center; }
      th { background: #f8f8f8; font-weight: bold; }
      .right { text-align: right; }
      .left { text-align: left; }
      .signature { margin-top: 20px; font-size: 10px; }
      .signature table { border: none; width: 100%; }
      .signature td { border: none; padding: 4px; }
      .footer { position: absolute; bottom: 10px; left: 10mm; right: 10mm; font-size: 9px; display: flex; justify-content: space-between; }
      .total-row { font-weight: bold; background: #f0f0f0; }
    `;

    let pagesHTML = "";

    const now = new Date();
    const timestamp = now.toLocaleDateString("en-GB") + " " +
      now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".");

    const totalStockBook = reportData.reduce((sum, item) => sum + (item.StockBook || 0), 0);

    pagesHTML += `
      <div class="page">
        <div class="header">
          <h2>CEYLON ELECTRICITY BOARD</h2>
          <h3>STATEMENT OF OBSOLETE AND IDLE MATERIALS IN STOCKS - ${selectedYear}</h3>
          <h3>COST CENTRE : ${selectedDept.DeptId} WARE HOUSE - ${selectedWarehouse}</h3>
        </div>

        <div class="subtitles"><div>1.ORIGINAL  :  Deputy General Manager</div><div>Form - AV/7A</div></div>
        <div class="subtitles"><div>2.DUPLICATE :  Engineer-in-charge</div><div>Date of Verification : ${reportData[0]?.PhvDate || ".............."}</div></div>
        <div class="subtitles"><div>3.TRIPLCATE :   Store-kepper/E.S.(C.S.C)</div><div></div></div>

        <table>
          <thead>
            <tr>
              <th style="width:5%">Serial</th>
              <th style="width:10%">Code No</th>
              <th style="width:35%">Description</th>
              <th style="width:8%">Grade Code</th>
              <th style="width:6%">UOM</th>
              <th style="width:10%">Quantity (Stock Book)</th>
              <th style="width:8%">Unit Price</th>
              <th style="width:10%">Cost (Rs.) (Stock Book)</th>
              <th style="width:8%">Reasons</th>
              <th style="width:10%">Recommended action to be taken</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map((item, idx) => `
              <tr>
                <td class="center">${idx + 1}</td>
                <td class="center">${escapeHtml(item.MaterialCode)}</td>
                <td class="left">${escapeHtml(item.MaterialName)}</td>
                <td class="center">${escapeHtml(item.GradeCode)}</td>
                <td class="center">${escapeHtml(item.UomCode)}</td>
                <td class="right">${formatNumber(item.QtyOnHand)}</td>
                <td class="right">${formatNumber(item.UnitPrice)}</td>
                <td class="right">${formatNumber(item.StockBook)}</td>
                <td class="left">${escapeHtml(item.Reason)}</td>
                <td></td>
              </tr>
            `).join("")}
            <tr class="total-row">
              <td colspan="7" class="right">Total Stocks</td>
              <td class="right">${formatNumber(totalStockBook)}</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>

        <div class="signature">
          <div class="left">
            <p>We do hereby certify that Stocks were physically verified as per that given statement.</p>
            <table>
              <tr><td>Board of Verifications</td><td>Name</td><td>Designation</td><td>Signature</td></tr>
              <tr><td>1................</td><td>...................</td><td>...................</td><td>...................</td></tr>
              <tr><td>2................</td><td>...................</td><td>...................</td><td>...................</td></tr>
              <tr><td>3................</td><td>...................</td><td>...................</td><td>...................</td></tr>
            </table>
          </div>
          <div class="right">
            <p>Agreed and certified correct.</p>
            <p>......................................</p>
            <p>Store-keeper/Elect. Superintendent (C.S.C.)</p>
          </div>
          <div class="clear"></div>
        </div>

        <div class="footer">
          <div>Date & time of the Report Generated : ${timestamp}</div>
          <div>Page 1 of 1</div>
        </div>
      </div>
    `;

    const fullHTML = `
      <html>
        <head><style>${tableStyle}</style></head>
        <body>${pagesHTML}</body>
      </html>
    `;

    const doc = iframeRef.current.contentDocument!;
    doc.open();
    doc.write(fullHTML);
    doc.close();

    setTimeout(() => iframeRef.current?.contentWindow?.print(), 800);
  };

  return (
    <div className="max-w-[95%] mx-auto p-2 md:p-4 bg-white rounded-xl shadow border border-gray-200 text-sm md:text-base font-sans">
      <iframe
        ref={iframeRef}
        style={{ display: "none" }}
        title="print-frame"
      />

      <h2 className={`text-lg md:text-xl font-bold mb-4 ${maroon}`}>
        6.1. Physical Verification Obsolete / Idle (GRADE Code) AV/7A
      </h2>

      <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-3 mb-4 justify-end items-end">
        <div className="flex items-center gap-2">
          <YearMonthDropdowns
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            className="gap-4"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:gap-2 items-end">
          <div className="flex flex-col">
            <label className={`text-xs md:text-sm font-bold ${maroon} mb-1`}>
              Warehouse Code
            </label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="pl-2 md:pl-3 pr-2 md:pr-3 py-1 md:py-1.5 w-full md:w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-xs md:text-sm"
              disabled={!selectedDept || loading}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.WarehouseCode} value={wh.WarehouseCode}>
                  {wh.WarehouseCode}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleViewReport}
            disabled={!selectedDept || !selectedWarehouse || loading}
            className={`px-2 md:px-3 py-1 md:py-1 ${maroonGrad} text-white rounded-md text-xs md:text-sm font-medium hover:brightness-110 transition shadow ${
              !selectedDept || !selectedWarehouse || loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Eye className="inline-block mr-1 w-3 md:w-3 h-3 md:h-3" />
            View
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-3 mb-2 md:mb-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 md:w-3 h-3 md:h-3" />
          <input
            type="text"
            value={searchId}
            placeholder="Search by Cost Center ID"
            onChange={(e) => setSearchId(e.target.value)}
            className="pl-8 md:pl-8 pr-2 md:pr-3 py-1 md:py-1.5 w-full md:w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-xs md:text-sm"
            autoComplete="off"
          />
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 md:w-3 h-3 md:h-3" />
          <input
            type="text"
            value={searchName}
            placeholder="Search by Name"
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-8 md:pl-10 pr-2 md:pr-3 py-1 md:py-1.5 w-full md:w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-xs md:text-sm"
            autoComplete="off"
          />
        </div>
        {(searchId || searchName) && (
          <button
            onClick={() => { setSearchId(""); setSearchName(""); }}
            className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs md:text-sm"
          >
            <RotateCcw className="w-3 md:w-3 h-3 md:h-3" /> Clear
          </button>
        )}
      </div>

      {loading && !warehouses.length && (
        <div className="text-center py-4 md:py-8">
          <div className="animate-spin rounded-full h-6 md:h-8 w-6 md:w-8 border-b-2 border-[#7A0000] mx-auto"></div>
          <p className="mt-1 md:mt-2 text-gray-600 text-xs md:text-sm">
            Loading cost centers...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-2 md:px-4 py-2 md:py-3 rounded mb-2 md:mb-4 text-xs md:text-sm">
          Error: {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-gray-600 bg-gray-100 p-2 md:p-4 rounded text-xs md:text-sm">
          No cost centers found.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full table-fixed text-left text-gray-700 text-xs md:text-sm">
                <thead className={`${maroonGrad} text-white sticky top-0`}>
                  <tr>
                    <th className="px-2 md:px-4 py-1 md:py-2 w-1/2 md:w-auto">
                      Cost Center Code
                    </th>
                    <th className="px-2 md:px-4 py-1 md:py-2 w-1/2 md:w-auto">
                      Cost Center Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice((page - 1) * pageSize, page * pageSize).map((department, i) => (
                    <tr
                      key={`${department.DeptId}-${i}`}
                      onClick={() => setSelectedDept(department)}
                      className={`cursor-pointer ${
                        selectedDept?.DeptId === department.DeptId
                          ? "bg-[#7A0000] text-white"
                          : i % 2 ? "bg-white hover:bg-gray-100" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <td className="px-2 md:px-4 py-1 md:py-2 truncate min-w-0">
                        {department.DeptId}
                      </td>
                      <td className="px-2 md:px-4 py-1 md:py-2 truncate min-w-0">
                        {department.DeptName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-end items-center gap-2 md:gap-3 mt-2 md:mt-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 md:px-3 py-1 md:py-1 border rounded bg-white text-gray-600 text-xs md:text-sm hover:bg-gray-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs md:text-sm text-gray-600">
              Page {page} of {Math.ceil(filtered.length / pageSize)}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(Math.ceil(filtered.length / pageSize), p + 1))
              }
              disabled={page >= Math.ceil(filtered.length / pageSize)}
              className="px-2 md:px-3 py-1 md:py-1 border rounded bg-white text-gray-600 text-xs md:text-sm hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}

      {showReport && selectedDept && (
        <ReportViewer
          title={`STATEMENT OF OBSOLETE AND IDLE MATERIALS IN STOCKS - ${selectedYear}`}
          subtitlebold2="COST CENTRE :"
          subtitlenormal2={`${selectedDept.DeptId} - ${selectedDept.DeptName} - WARE HOUSE - ${selectedWarehouse}`}
          loading={reportLoading}
          hasData={reportData.length > 0}
          handleDownloadCSV={handleDownloadCSV}
          printPDF={printPDF}
          closeReport={closeReport}
        >
          <table className="w-full text-xs border-collapse">
            <thead className={`${maroonGrad} text-white`}>
              <tr>
                <th className="border border-gray-400 px-2 py-2 text-center">Serial No</th>
                <th className="border border-gray-400 px-2 py-2 text-center">Code No</th>
                <th className="border border-gray-400 px-2 py-2 text-left">Description</th>
                <th className="border border-gray-400 px-2 py-2 text-center">Grade Code</th>
                <th className="border border-gray-400 px-2 py-2 text-center">UOM</th>
                <th className="border border-gray-400 px-2 py-2 text-right">Quantity (Stock Book)</th>
                <th className="border border-gray-400 px-2 py-2 text-right">Unit Price</th>
                <th className="border border-gray-400 px-2 py-2 text-right">Cost (Rs.) (Stock Book)</th>
                <th className="border border-gray-400 px-2 py-2 text-center">Reasons</th>
                <th className="border border-gray-400 px-2 py-2 text-center">Recommended action to be taken</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-2 py-2 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">{item.MaterialCode || ""}</td>
                  <td className="border border-gray-300 px-2 py-2 text-left">{item.MaterialName || ""}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">{item.GradeCode || ""}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">{item.UomCode || ""}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{formatNumber(item.QtyOnHand)}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{formatNumber(item.UnitPrice)}</td>
                  <td className="border border-gray-300 px-2 py-2 text-right">{formatNumber(item.StockBook)}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">{item.Reason || ""}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center"></td>
                </tr>
              ))}
              <tr className="bg-yellow-50 font-bold">
                <td colSpan={7} className="border border-gray-300 px-2 py-2 text-right">
                  Total Stocks
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatNumber(reportData.reduce((sum, item) => sum + (item.StockBook || 0), 0))}
                </td>
                <td colSpan={2} className="border border-gray-300"></td>
              </tr>
            </tbody>
          </table>
        </ReportViewer>
      )}
    </div>
  );
};

export default PHVObsoleteIdleWHwise;