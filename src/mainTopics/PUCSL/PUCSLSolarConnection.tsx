// import React, { useState, useEffect, useRef } from "react";
// import { FaFileDownload, FaPrint } from "react-icons/fa";

// // ── Interfaces ────────────────────────────────────────────────────────────────

// interface BillCycleOption {
//     display: string;
//     code: string;
// }

// interface Province {
//     ProvinceCode: string;
//     ProvinceName: string;
//     ErrorMessage?: string | null;
// }

// interface Division {
//     RegionCode: string;
//     ErrorMessage?: string | null;
// }

// interface FixedSolarDataModel {
//     Category: string;
//     Year: string;
//     Month: string;
//     NoOfCustomers: number;
//     OrdinaryNoOfCustomers: number;
//     BulkNoOfCustomers: number;
//     KwhAt1550: number;
//     KwhAt22: number;
//     KwhAt3450: number;
//     KwhAt37: number;
//     KwhAt2318: number;
//     KwhAt2706: number;
//     KwhOthers: number;
//     PaidAmount: number;
//     ErrorMessage?: string;
// }

// // ── Component ─────────────────────────────────────────────────────────────────

// const PUCSLSolarConnection: React.FC = () => {
//     const maroon = "text-[#7A0000]";
//     const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

//     // ── Form states ───────────────────────────────────────────────────────────
//     const [billCycle, setBillCycle] = useState<string>("");
//     const [reportType, setReportType] = useState<string>("");
//     const [solarType, setSolarType] = useState<string>("");
//     const [reportCategory, setReportCategory] = useState<string>("Province");
//     const [categoryValue, setCategoryValue] = useState<string>("");
//     const [loading, setLoading] = useState(false);

//     // ── Dropdown data ─────────────────────────────────────────────────────────
//     const [billCycleOptions, setBillCycleOptions] = useState<BillCycleOption[]>([]);
//     const [provinces, setProvinces] = useState<Province[]>([]);
//     const [divisions, setDivisions] = useState<Division[]>([]);

//     // ── Loading states ────────────────────────────────────────────────────────
//     const [isLoadingBillCycles, setIsLoadingBillCycles] = useState(false);
//     const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
//     const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);

//     // ── Error states ──────────────────────────────────────────────────────────
//     const [billCycleError, setBillCycleError] = useState<string | null>(null);
//     const [provinceError, setProvinceError] = useState<string | null>(null);
//     const [divisionError, setDivisionError] = useState<string | null>(null);
//     const [reportError, setReportError] = useState<string | null>(null);

//     // ── Display states ────────────────────────────────────────────────────────
//     const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
//     const [selectedBillCycleDisplay, setSelectedBillCycleDisplay] = useState<string>("");
//     const [reportVisible, setReportVisible] = useState(false);

//     // ── Report data ───────────────────────────────────────────────────────────
//     const [reportData, setReportData] = useState<FixedSolarDataModel[]>([]);

//     const printRef = useRef<HTMLDivElement>(null);

//     // ── Helpers ───────────────────────────────────────────────────────────────

//     const fetchWithErrorHandling = async (url: string) => {
//         try {
//             const response = await fetch(url, {
//                 headers: { Accept: "application/json" },
//             });

//             if (!response.ok) {
//                 let errorMsg = `HTTP error! status: ${response.status}`;
//                 try {
//                     const errorData = await response.json();
//                     if (errorData.errorMessage) errorMsg = errorData.errorMessage;
//                 } catch (e) {
//                     errorMsg = response.statusText;
//                 }
//                 throw new Error(errorMsg);
//             }

//             const contentType = response.headers.get("content-type");
//             if (!contentType || !contentType.includes("application/json")) {
//                 throw new Error(`Expected JSON response but got ${contentType}`);
//             }

//             return await response.json();
//         } catch (error) {
//             console.error(`Error fetching ${url}:`, error);
//             throw error;
//         }
//     };

//     // Map solarType display value → backend enum string
//     const getSolarTypeValue = (display: string): string => {
//         const map: { [key: string]: string } = {
//             "Net Accounting": "NetAccounting",
//             "Net Plus": "NetPlus",
//             "Net Plus Plus": "NetPlusPlus",
//         };
//         return map[display] || display;
//     };

//     // Map reportCategory display value → backend enum string
//     const getReportCategoryValue = (display: string): string => {
//         const map: { [key: string]: string } = {
//             Province: "Province",
//             Division: "Region",
//             "Entire CEB": "EntireCEB",
//         };
//         return map[display] || display;
//     };

//     // Format number with comma separators
//     const formatNumber = (num: number, decimals: number = 2): string => {
//         return num.toLocaleString("en-US", {
//             minimumFractionDigits: decimals,
//             maximumFractionDigits: decimals,
//         });
//     };

//     // ── Disable logic — cascade: Report Category → Province/Division → Bill Cycle → Report Type → Solar Type ───

//     const isBillCycleDisabled = () => {
//         if (!reportCategory) return true;
//         if (reportCategory !== "Entire CEB" && !categoryValue) return true;
//         return false;
//     };

//     const isReportTypeDisabled = () => isBillCycleDisabled() || !billCycle;

//     const isSolarTypeDisabled = () => isReportTypeDisabled() || !reportType;

//     const canSubmit = () => {
//         if (!reportCategory) return false;
//         if (reportCategory !== "Entire CEB" && !categoryValue) return false;
//         if (!billCycle || !reportType || !solarType) return false;
//         return true;
//     };

//     // ── Fetch bill cycles on mount ────────────────────────────────────────────
//     useEffect(() => {
//         const fetchBillCycles = async () => {
//             setIsLoadingBillCycles(true);
//             setBillCycleError(null);
//             try {
//                 const response = await fetchWithErrorHandling(
//                     "/api/areas/billcycle/max"
//                 );

//                 const billCyclesArray = response?.data?.BillCycles;
//                 const maxBillCycle = response?.data?.MaxBillCycle;

//                 if (billCyclesArray && Array.isArray(billCyclesArray) && maxBillCycle) {
//                     const maxCycleNum = parseInt(maxBillCycle);
//                     const options: BillCycleOption[] = billCyclesArray.map(
//                         (cycle: string, index: number) => ({
//                             display: `${maxCycleNum - index} - ${cycle}`,
//                             code: (maxCycleNum - index).toString(),
//                         })
//                     );
//                     setBillCycleOptions(options);
//                 } else {
//                     throw new Error("Invalid bill cycle data format");
//                 }
//             } catch (error: any) {
//                 console.error("Error fetching bill cycles:", error);
//                 setBillCycleError(error.message || "Failed to load bill cycles");
//             } finally {
//                 setIsLoadingBillCycles(false);
//             }
//         };

//         fetchBillCycles();
//     }, []);

//     // ── Fetch provinces when category = Province ──────────────────────────────
//     useEffect(() => {
//         const fetchProvinces = async () => {
//             setIsLoadingProvinces(true);
//             setProvinceError(null);
//             try {
//                 const response = await fetchWithErrorHandling("/api/ordinary/province");
//                 if (response?.data && Array.isArray(response.data)) {
//                     setProvinces(response.data);
//                 } else {
//                     throw new Error("Invalid provinces data format");
//                 }
//             } catch (error: any) {
//                 console.error("Error fetching provinces:", error);
//                 setProvinceError(error.message || "Failed to load provinces");
//             } finally {
//                 setIsLoadingProvinces(false);
//             }
//         };

//         if (reportCategory === "Province") {
//             fetchProvinces();
//         }
//     }, [reportCategory]);

//     // ── Fetch divisions when category = Division ──────────────────────────────
//     useEffect(() => {
//         const fetchDivisions = async () => {
//             setIsLoadingDivisions(true);
//             setDivisionError(null);
//             try {
//                 const response = await fetchWithErrorHandling("/misapi/api/ordinary/region");
//                 if (response?.data && Array.isArray(response.data)) {
//                     setDivisions(response.data);
//                 } else {
//                     throw new Error("Invalid divisions data format");
//                 }
//             } catch (error: any) {
//                 console.error("Error fetching divisions:", error);
//                 setDivisionError(error.message || "Failed to load divisions");
//             } finally {
//                 setIsLoadingDivisions(false);
//             }
//         };

//         if (reportCategory === "Division") {
//             fetchDivisions();
//         }
//     }, [reportCategory]);

//     // ── Handle form submit ────────────────────────────────────────────────────
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setReportError(null);

//         try {
//             const requestBody = {
//                 reportCategory: getReportCategoryValue(reportCategory),
//                 typeCode: reportCategory !== "Entire CEB" ? categoryValue : "",
//                 billCycle,
//                 reportType,
//                 solarType: getSolarTypeValue(solarType),
//             };

//             const response = await fetch("/api/pucsl/solarConnections", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Accept: "application/json",
//                 },
//                 body: JSON.stringify(requestBody),
//             });

//             if (!response.ok) {
//                 let errorMsg = `HTTP error! status: ${response.status}`;
//                 try {
//                     const errorData = await response.json();
//                     if (errorData.errorMessage) errorMsg = errorData.errorMessage;
//                 } catch (e) {
//                     errorMsg = response.statusText;
//                 }
//                 throw new Error(errorMsg);
//             }

//             const result = await response.json();

//             if (result.errorMessage) {
//                 throw new Error(result.errorMessage);
//             }

//             if (result.data && Array.isArray(result.data)) {
//                 setReportData(result.data);

//                 // Set display labels for report header
//                 if (reportCategory === "Province") {
//                     const selectedProvince = provinces.find(
//                         (p) => p.ProvinceCode === categoryValue
//                     );
//                     setSelectedCategoryName(
//                         selectedProvince
//                             ? `${selectedProvince.ProvinceCode} - ${selectedProvince.ProvinceName}`
//                             : categoryValue
//                     );
//                 } else if (reportCategory === "Division") {
//                     setSelectedCategoryName(categoryValue);
//                 } else {
//                     setSelectedCategoryName("Entire CEB");
//                 }

//                 const selectedCycle = billCycleOptions.find((opt) => opt.code === billCycle);
//                 setSelectedBillCycleDisplay(selectedCycle?.display || billCycle);

//                 setReportVisible(true);
//             } else {
//                 throw new Error("No data found for the selected criteria.");
//             }
//         } catch (error: any) {
//             console.error("Error generating report:", error);
//             setReportError(error.message || "Failed to generate report. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ── CSV Export ────────────────────────────────────────────────────────────
//     const downloadAsCSV = () => {
//         if (!reportData.length) return;

//         const reportTitle = "PUCSL Fixed Solar Data Submission Report";
//         const selectionInfo =
//             reportCategory === "Entire CEB"
//                 ? "Entire CEB"
//                 : `${reportCategory}: ${selectedCategoryName}`;

//         const headers = [
//             "Tariff Category",
//             "Year",
//             "Month",
//             "No of Customers",
//             "kWh Purchased at 15.50",
//             "kWh Purchased at 22.00",
//             "kWh Purchased at 34.50",
//             "kWh Purchased at 37.00",
//             "kWh Purchased at 23.18",
//             "kWh Purchased at 27.06",
//             "kWh Others",
//             "Paid Amount (Rs.)",
//         ];

//         // const totals = computeTotals();

//         const rows = reportData.map((item) => [
//             item.Category,
//             item.Year,
//             item.Month,
//             item.NoOfCustomers,
//             item.KwhAt1550,
//             item.KwhAt22,
//             item.KwhAt3450,
//             item.KwhAt37,
//             item.KwhAt2318,
//             item.KwhAt2706,
//             item.KwhOthers,
//             item.PaidAmount,
//         ]);

//         // rows.push([
//         //     "",
//         //     "TOTAL",
//         //     totals.NoOfCustomers,
//         //     totals.KwhAt1550,
//         //     totals.KwhAt22,
//         //     totals.KwhAt3450,
//         //     totals.KwhAt37,
//         //     totals.KwhAt2318,
//         //     totals.KwhAt2706,
//         //     totals.KwhOthers,
//         //     totals.PaidAmount,
//         // ]);

//         const csvContent = [
//             [reportTitle],
//             [selectionInfo],
//             [`Bill Cycle: ${selectedBillCycleDisplay}`],
//             [`Solar Type: ${solarType}`],
//             [],
//             headers,
//             ...rows,
//         ]
//             .map((row) => row.map((cell) => `"${cell}"`).join(","))
//             .join("\n");

//         const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.setAttribute("href", url);
//         link.setAttribute(
//             "download",
//             `PUCSL_FixedSolar_${billCycle}_${solarType.replace(/ /g, "")}.csv`
//         );
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(url);
//     };

//     // ── Print PDF ─────────────────────────────────────────────────────────────
//     const printPDF = () => {
//         if (!printRef.current) return;

//         const reportTitle = "PUCSL Fixed Solar Data Submission Report";
//         const selectionInfo =
//             reportCategory === "Entire CEB"
//                 ? "Entire CEB"
//                 : `${reportCategory}: ${selectedCategoryName}`;

//         const printWindow = window.open("", "_blank");
//         if (!printWindow) return;

//         printWindow.document.write(`
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <title>${reportTitle}</title>
//                 <style>
//             body { font-family: Arial; font-size: 10px; margin: 10mm; }
//             table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
//             th, td { padding: 4px 6px; border: 0.1px solid #ddd; font-size: 10px; vertical-align: top;}
//             .text-left { text-align: left; }
//             .text-right { text-align: right; }
//             .header { 
//               font-weight: bold; 
//               margin-bottom: 5px; 
//               color: #7A0000;
//               font-size: 12px;
//             }
//             .subheader { 
//               margin-bottom: 12px; 
//               font-size: 11px;
//             }
//             .section-title {
//               font-weight: bold;
//               font-size: 11px;
//               margin-top: 15px;
//               margin-bottom: 8px;
//               color: #333;
//             }
//             .footer { 
//               margin-top: 10px; 
//               font-size: 9px; 
//               color: #666;
//             }
//             th { 
//               background-color: #d3d3d3; 
//               font-weight: bold; 
//               text-align: center; 
//             }
//             tr:nth-child(even) {
//               background-color: #f9f9f9;
//             }
//             .bold {
//               font-weight: bold;
//             }
//             .total-row {
//               background-color: #d3d3d3;
//               font-weight: bold;
//             }
//             .whitespace-nowrap {
//               white-space: nowrap;
//             }
//             .bg-green-50 {
//               font-weight: bold !important;
//             }
//             .bg-green-50 td {
//               font-weight: bold !important;
//             }
//             .bg-blue-50 {
//               font-weight: bold !important;
//             }
//             .bg-blue-50 td {
//               font-weight: bold !important;
//             }
//             .bg-yellow-50 {
//               font-weight: bold !important;
//             }
//             .bg-yellow-50 td {
//               font-weight: bold !important;
//             }
//             .font-medium, .font-semibold, .font-bold {
//               font-weight: bold !important;
//             }
//           </style>
//             </head>
//             <body>
//                 <div class="header">${reportTitle}</div>
//                 <div class="subheader">
//                     ${selectionInfo} | Bill Cycle: ${selectedBillCycleDisplay} | Solar Type: ${solarType}
//                 </div>
//                 ${printRef.current.innerHTML}
//                 <div class="footer">
//                     Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} | CEB@2025
//                 </div>
//             </body>
//             </html>
//         `);

//         printWindow.document.close();
//         printWindow.focus();
//         setTimeout(() => {
//             printWindow.print();
//             printWindow.close();
//         }, 500);
//     };

//     // ── Compute totals row ────────────────────────────────────────────────────
//     // const computeTotals = () =>
//     //     reportData.reduce(
//     //         (acc, row) => ({
//     //             NoOfCustomers: acc.NoOfCustomers + row.NoOfCustomers,
//     //             KwhAt1550: acc.KwhAt1550 + row.KwhAt1550,
//     //             KwhAt22: acc.KwhAt22 + row.KwhAt22,
//     //             KwhAt3450: acc.KwhAt3450 + row.KwhAt3450,
//     //             KwhAt37: acc.KwhAt37 + row.KwhAt37,
//     //             KwhAt2318: acc.KwhAt2318 + row.KwhAt2318,
//     //             KwhAt2706: acc.KwhAt2706 + row.KwhAt2706,
//     //             KwhOthers: acc.KwhOthers + row.KwhOthers,
//     //             PaidAmount: acc.PaidAmount + row.PaidAmount,
//     //         }),
//     //         {
//     //             NoOfCustomers: 0,
//     //             KwhAt1550: 0,
//     //             KwhAt22: 0,
//     //             KwhAt3450: 0,
//     //             KwhAt37: 0,
//     //             KwhAt2318: 0,
//     //             KwhAt2706: 0,
//     //             KwhOthers: 0,
//     //             PaidAmount: 0,
//     //         }
//     //     );

//     // ── Render table ──────────────────────────────────────────────────────────
//     const renderTable = () => {
//         if (!reportData.length) {
//             return (
//                 <div className="text-center py-8 text-gray-500">No data available</div>
//             );
//         }

//         // const totals = computeTotals();

//         return (
//             <table className="w-full border-collapse text-xs">
//                 <thead className="bg-gray-200 sticky top-0">
//                     <tr>

//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             Tariff Category
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             Year
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             Month
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             No of Customers
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             kWh Purchased at 15.50
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             kWh Purchased at 22.00
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             kWh Purchased at 34.50
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             kWh Purchased at 37.00
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             kWh Purchased at 23.18
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             kWh Purchased at 27.06
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             kWh Others
//                         </th>
//                         <th className="border border-gray-300 px-2 py-1 text-center">
//                             Paid Amount (Rs.)
//                         </th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {reportData.map((item, index) => (
//                         <tr
//                             key={index}
//                             className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
//                         >

//                             <td className="border border-gray-300 px-2 py-1 font-medium">
//                                 {item.Category}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right whitespace-nowrap">
//                                 {item.Year}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right whitespace-nowrap">
//                                 {item.Month}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right">
//                                 {item.NoOfCustomers.toLocaleString("en-US")}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right">
//                                 {formatNumber(item.KwhAt1550)}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right">
//                                 {formatNumber(item.KwhAt22)}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right">
//                                 {formatNumber(item.KwhAt3450)}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right">
//                                 {formatNumber(item.KwhAt37)}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right">
//                                 {formatNumber(item.KwhAt2318)}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right">
//                                 {formatNumber(item.KwhAt2706)}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right">
//                                 {formatNumber(item.KwhOthers)}
//                             </td>
//                             <td className="border border-gray-300 px-2 py-1 text-right font-medium">
//                                 {formatNumber(item.PaidAmount)}
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//                 {/* <tfoot>
//                     <tr className="bg-gray-100">
//                         <td className="border border-gray-300 px-2 py-1 font-bold">TOTAL</td>
//                         <td className="border border-gray-300 px-2 py-1 text-right font-bold">
//                             {totals.NoOfCustomers.toLocaleString("en-US")}
//                         </td>
//                         <td className="border border-gray-300 px-2 py-1 text-right font-bold">
//                             {formatNumber(totals.KwhAt1550)}
//                         </td>
//                         <td className="border border-gray-300 px-2 py-1 text-right font-bold">
//                             {formatNumber(totals.KwhAt22)}
//                         </td>
//                         <td className="border border-gray-300 px-2 py-1 text-right font-bold">
//                             {formatNumber(totals.KwhAt3450)}
//                         </td>
//                         <td className="border border-gray-300 px-2 py-1 text-right font-bold">
//                             {formatNumber(totals.KwhAt37)}
//                         </td>
//                         <td className="border border-gray-300 px-2 py-1 text-right font-bold">
//                             {formatNumber(totals.KwhAt2318)}
//                         </td>
//                         <td className="border border-gray-300 px-2 py-1 text-right font-bold">
//                             {formatNumber(totals.KwhAt2706)}
//                         </td>
//                         <td className="border border-gray-300 px-2 py-1 text-right font-bold">
//                             {formatNumber(totals.KwhOthers)}
//                         </td>
//                         <td className="border border-gray-300 px-2 py-1 text-right font-bold">
//                             {formatNumber(totals.PaidAmount)}
//                         </td>
//                     </tr>
//                 </tfoot> */}
//             </table>
//         );
//     };

//     // ── JSX ───────────────────────────────────────────────────────────────────
//     return (
//         <div className="p-6 bg-white rounded-lg shadow-md">

//             {/* ── Form Section ─────────────────────────────────────────────── */}
//             {!reportVisible && (
//                 <>
//                     <h2 className={`text-xl font-bold mb-6 ${maroon}`}>
//                         PUCSL Solar Connection Report
//                     </h2>

//                     <form onSubmit={handleSubmit} className="space-y-4">

//                         {/* Row 1 — Report Category | Province/Division picker */}
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

//                             {/* Report Category */}
//                             <div className="flex flex-col">
//                                 <label className={`text-xs font-medium mb-1 ${maroon}`}>
//                                     Select Report Category:
//                                 </label>
//                                 <select
//                                     value={reportCategory}
//                                     onChange={(e) => {
//                                         setReportCategory(e.target.value);
//                                         setCategoryValue("");
//                                         setBillCycle("");
//                                         setReportType("");
//                                         setSolarType("");
//                                     }}
//                                     className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
//                                     required
//                                 >
//                                     <option value="Province">Province</option>
//                                     <option value="Division">Division</option>
//                                     <option value="Entire CEB">Entire CEB</option>
//                                 </select>
//                             </div>

//                             {/* Province / Division value picker (conditional) */}
//                             {reportCategory !== "Entire CEB" && (
//                                 <div className="flex flex-col">
//                                     <label className={`text-xs font-medium mb-1 ${maroon}`}>
//                                         {reportCategory === "Province"
//                                             ? "Select Province:"
//                                             : "Select Division:"}
//                                     </label>

//                                     {reportCategory === "Province" && (
//                                         <select
//                                             value={categoryValue}
//                                             onChange={(e) => {
//                                                 setCategoryValue(e.target.value);
//                                                 setBillCycle("");
//                                                 setReportType("");
//                                                 setSolarType("");
//                                             }}
//                                             className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
//                                             required
//                                         >
//                                             <option value="">Select Province</option>
//                                             {isLoadingProvinces ? (
//                                                 <option value="">Loading...</option>
//                                             ) : provinceError ? (
//                                                 <option value="">Error loading provinces</option>
//                                             ) : (
//                                                 provinces.map((province) => (
//                                                     <option
//                                                         key={province.ProvinceCode}
//                                                         value={province.ProvinceCode}
//                                                     >
//                                                         {province.ProvinceCode} -{" "}
//                                                         {province.ProvinceName}
//                                                     </option>
//                                                 ))
//                                             )}
//                                         </select>
//                                     )}

//                                     {reportCategory === "Division" && (
//                                         <select
//                                             value={categoryValue}
//                                             onChange={(e) => {
//                                                 setCategoryValue(e.target.value);
//                                                 setBillCycle("");
//                                                 setReportType("");
//                                                 setSolarType("");
//                                             }}
//                                             className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
//                                             required
//                                         >
//                                             <option value="">Select Division</option>
//                                             {isLoadingDivisions ? (
//                                                 <option value="">Loading...</option>
//                                             ) : divisionError ? (
//                                                 <option value="">Error loading divisions</option>
//                                             ) : (
//                                                 divisions.map((division) => (
//                                                     <option
//                                                         key={division.RegionCode}
//                                                         value={division.RegionCode}
//                                                     >
//                                                         {division.RegionCode}
//                                                     </option>
//                                                 ))
//                                             )}
//                                         </select>
//                                     )}
//                                 </div>
//                             )}
//                         </div>

//                         {/* Row 2 — Bill Cycle | Report Type | Solar Type */}
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

//                             {/* Bill Cycle */}
//                             <div className="flex flex-col">
//                                 <label
//                                     className={`text-xs font-medium mb-1 ${isBillCycleDisabled() ? "text-gray-400" : maroon
//                                         }`}
//                                 >
//                                     Select Bill Cycle:
//                                 </label>
//                                 <select
//                                     value={billCycle}
//                                     onChange={(e) => {
//                                         setBillCycle(e.target.value);
//                                         setReportType("");
//                                         setSolarType("");
//                                     }}
//                                     className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent ${isBillCycleDisabled()
//                                             ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
//                                             : "border-gray-300"
//                                         }`}
//                                     required
//                                     disabled={isBillCycleDisabled()}
//                                 >
//                                     <option value="">Select Bill Cycle</option>
//                                     {isLoadingBillCycles ? (
//                                         <option value="">Loading...</option>
//                                     ) : billCycleError ? (
//                                         <option value="">Error loading bill cycles</option>
//                                     ) : (
//                                         billCycleOptions.map((option) => (
//                                             <option key={option.code} value={option.code}>
//                                                 {option.display}
//                                             </option>
//                                         ))
//                                     )}
//                                 </select>
//                             </div>

//                             {/* Report Type */}
//                             <div className="flex flex-col">
//                                 <label
//                                     className={`text-xs font-medium mb-1 ${isReportTypeDisabled() ? "text-gray-400" : maroon
//                                         }`}
//                                 >
//                                     Select Report Type:
//                                 </label>
//                                 <select
//                                     value={reportType}
//                                     onChange={(e) => {
//                                         setReportType(e.target.value);
//                                         setSolarType("");
//                                     }}
//                                     className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent ${isReportTypeDisabled()
//                                             ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
//                                             : "border-gray-300"
//                                         }`}
//                                     required
//                                     disabled={isReportTypeDisabled()}
//                                 >
//                                     <option value="">Select Report Type</option>
//                                     <option value="FixedSolarData">
//                                         Fixed Solar Data Submission Report
//                                     </option>
//                                     {/* Uncomment as more report types are implemented:
//                                     <option value="VariableSolarData">Variable Solar Data Submission Report</option>
//                                     */}
//                                 </select>
//                             </div>

//                             {/* Solar Type */}
//                             <div className="flex flex-col">
//                                 <label
//                                     className={`text-xs font-medium mb-1 ${isSolarTypeDisabled() ? "text-gray-400" : maroon
//                                         }`}
//                                 >
//                                     Select Solar Type:
//                                 </label>
//                                 <select
//                                     value={solarType}
//                                     onChange={(e) => setSolarType(e.target.value)}
//                                     className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent ${isSolarTypeDisabled()
//                                             ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
//                                             : "border-gray-300"
//                                         }`}
//                                     required
//                                     disabled={isSolarTypeDisabled()}
//                                 >
//                                     <option value="">Select Solar Type</option>
//                                     <option value="Net Accounting">Net Accounting</option>
//                                     <option value="Net Plus">Net Plus</option>
//                                     <option value="Net Plus Plus">Net Plus Plus</option>
//                                 </select>
//                             </div>
//                         </div>

//                         {/* Submit button */}
//                         <div className="w-full mt-6 flex justify-end">
//                             <button
//                                 type="submit"
//                                 className={`px-6 py-2 rounded-md font-medium transition-opacity duration-300 shadow ${maroonGrad} text-white ${loading || !canSubmit()
//                                         ? "opacity-70 cursor-not-allowed"
//                                         : "hover:opacity-90"
//                                     }`}
//                                 disabled={loading || !canSubmit()}
//                             >
//                                 {loading ? (
//                                     <span className="flex items-center">
//                                         <svg
//                                             className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                                             xmlns="http://www.w3.org/2000/svg"
//                                             fill="none"
//                                             viewBox="0 0 24 24"
//                                         >
//                                             <circle
//                                                 className="opacity-25"
//                                                 cx="12"
//                                                 cy="12"
//                                                 r="10"
//                                                 stroke="currentColor"
//                                                 strokeWidth="4"
//                                             />
//                                             <path
//                                                 className="opacity-75"
//                                                 fill="currentColor"
//                                                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                                             />
//                                         </svg>
//                                         Loading...
//                                     </span>
//                                 ) : (
//                                     "Generate Report"
//                                 )}
//                             </button>
//                         </div>
//                     </form>
//                 </>
//             )}

//             {/* ── Report Section ────────────────────────────────────────────── */}
//             {reportVisible && (
//                 <div className="mt-6">
//                     {/* Report Header */}
//                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
//                         <div>
//                             <h2 className={`text-xl font-bold ${maroon}`}>
//                                 PUCSL Fixed Solar Data Submission Report
//                             </h2>
//                             <p className="text-sm text-gray-600 mt-1">
//                                 {reportCategory === "Entire CEB"
//                                     ? "Entire CEB"
//                                     : `${reportCategory}: ${selectedCategoryName}`}{" "}
//                                 | Month: {selectedBillCycleDisplay} | Solar Type: {solarType}
//                             </p>
//                         </div>
//                         <div className="flex space-x-2 mt-2 md:mt-0">
//                             <button
//                                 onClick={downloadAsCSV}
//                                 className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
//                             >
//                                 <FaFileDownload className="w-3 h-3" /> CSV
//                             </button>
//                             <button
//                                 onClick={printPDF}
//                                 className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
//                             >
//                                 <FaPrint className="w-3 h-3" /> PDF
//                             </button>
//                             <button
//                                 onClick={() => setReportVisible(false)}
//                                 className="px-4 py-1.5 bg-[#7A0000] hover:bg-[#A52A2A] text-xs rounded-md text-white flex items-center"
//                             >
//                                 Back to Form
//                             </button>
//                         </div>
//                     </div>

//                     {/* Report Table */}
//                     <div className="overflow-x-auto max-h-[calc(100vh-250px)] border border-gray-300 rounded-lg">
//                         <div ref={printRef} className="min-w-full py-4">
//                             {renderTable()}
//                         </div>
//                     </div>

//                     {/* Error Message */}
//                     {reportError && (
//                         <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
//                             {reportError}
//                         </div>
//                     )}
//                 </div>
//             )}

//             {/* Error Message (when not in report view) */}
//             {!reportVisible && reportError && (
//                 <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
//                     {reportError}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default PUCSLSolarConnection;

import React, { useState, useEffect, useRef } from "react";
import { FaFileDownload, FaPrint } from "react-icons/fa";

import {
    BillCycleOption, Province, Division,
    FixedSolarDataModel, VariableSolarDataModel, TotalSolarCustomersResponse,
    RawDataForSolarResponse,
} from "../../components/mainTopics/PUCSLSolarConnection/pucslTypes.ts";
import {
    NET_METERING_SUPPORTED_REPORTS, NO_SOLAR_TYPE_REPORTS,
    getReportTitle, getSolarTypeValue, getReportCategoryValue,
    fetchWithErrorHandling, buildAndDownloadCSV, buildTotalSolarCSV,
    buildRawDataForSolarCSV, printReportPDF,
} from "../../components/mainTopics/PUCSLSolarConnection/pucslUtils.ts";
import FixedSolarTable from "../../components/mainTopics/PUCSLSolarConnection/FixedSolarTable.tsx";
import VariableSolarTable from "../../components/mainTopics/PUCSLSolarConnection/VariableSolarTable.tsx";
import TotalSolarCustomersTable from "../../components/mainTopics/PUCSLSolarConnection/TotalSolarCustomersTable.tsx";
import RawDataForSolarTable from "../../components/mainTopics/PUCSLSolarConnection/RawDataForSolarTable.tsx";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAROON = "text-[#7A0000]";
const MAROON_GRAD = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

// ── Component ─────────────────────────────────────────────────────────────────

const PUCSLSolarConnection: React.FC = () => {

    // ── Form state ────────────────────────────────────────────────────────────
    const [reportCategory, setReportCategory] = useState<string>("Province");
    const [categoryValue, setCategoryValue] = useState<string>("");
    const [billCycle, setBillCycle] = useState<string>("");
    const [reportType, setReportType] = useState<string>("");
    const [solarType, setSolarType] = useState<string>("");
    const [loading, setLoading] = useState(false);

    // ── Dropdown data ─────────────────────────────────────────────────────────
    const [billCycleOptions, setBillCycleOptions] = useState<BillCycleOption[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [isLoadingBillCycles, setIsLoadingBillCycles] = useState(false);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
    const [billCycleError, setBillCycleError] = useState<string | null>(null);
    const [provinceError, setProvinceError] = useState<string | null>(null);
    const [divisionError, setDivisionError] = useState<string | null>(null);

    // ── Report state ──────────────────────────────────────────────────────────
    const [reportData, setReportData] = useState<FixedSolarDataModel[]>([]);
    const [variableReportData, setVariableReportData] = useState<VariableSolarDataModel[]>([]);
    const [totalSolarData, setTotalSolarData] = useState<TotalSolarCustomersResponse | null>(null);
    const [rawSolarData, setRawSolarData] = useState<RawDataForSolarResponse | null>(null);
    const [reportVisible, setReportVisible] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
    const [selectedBillCycleDisplay, setSelectedBillCycleDisplay] = useState<string>("");

    const printRef = useRef<HTMLDivElement>(null);

    // ── Derived ───────────────────────────────────────────────────────────────
    const showNetMetering = NET_METERING_SUPPORTED_REPORTS.includes(reportType);
    const hideSolarType = NO_SOLAR_TYPE_REPORTS.includes(reportType);

    // ── Cascade disable logic ─────────────────────────────────────────────────
    const isBillCycleDisabled = () =>
        !reportCategory || (reportCategory !== "Entire CEB" && !categoryValue);

    const isReportTypeDisabled = () => isBillCycleDisabled() || !billCycle;

    const isSolarTypeDisabled = () => isReportTypeDisabled() || !reportType;

    const canSubmit = () => {
        if (!reportCategory) return false;
        if (reportCategory !== "Entire CEB" && !categoryValue) return false;
        if (!billCycle || !reportType) return false;
        if (!hideSolarType && !solarType) return false;
        return true;
    };

    // ── Fetch bill cycles ─────────────────────────────────────────────────────
    useEffect(() => {
        const fetchBillCycles = async () => {
            setIsLoadingBillCycles(true);
            setBillCycleError(null);
            try {
                const response = await fetchWithErrorHandling("/misapi/api/areas/billcycle/max");
                const { BillCycles, MaxBillCycle } = response?.data ?? {};
                if (!Array.isArray(BillCycles) || !MaxBillCycle)
                    throw new Error("Invalid bill cycle data format");
                const max = parseInt(MaxBillCycle);
                setBillCycleOptions(
                    BillCycles.map((cycle: string, i: number) => ({
                        display: `${max - i} - ${cycle}`,
                        code: String(max - i),
                    }))
                );
            } catch (err: any) {
                setBillCycleError(err.message || "Failed to load bill cycles");
            } finally {
                setIsLoadingBillCycles(false);
            }
        };
        fetchBillCycles();
    }, []);

    // ── Fetch provinces ───────────────────────────────────────────────────────
    useEffect(() => {
        if (reportCategory !== "Province") return;
        const fetchProvinces = async () => {
            setIsLoadingProvinces(true);
            setProvinceError(null);
            try {
                const response = await fetchWithErrorHandling("/misapi/api/ordinary/province");
                if (!Array.isArray(response?.data)) throw new Error("Invalid provinces data format");
                setProvinces(response.data);
            } catch (err: any) {
                setProvinceError(err.message || "Failed to load provinces");
            } finally {
                setIsLoadingProvinces(false);
            }
        };
        fetchProvinces();
    }, [reportCategory]);

    // ── Fetch divisions ───────────────────────────────────────────────────────
    useEffect(() => {
        if (reportCategory !== "Division") return;
        const fetchDivisions = async () => {
            setIsLoadingDivisions(true);
            setDivisionError(null);
            try {
                const response = await fetchWithErrorHandling("/misapi/api/ordinary/region");
                if (!Array.isArray(response?.data)) throw new Error("Invalid divisions data format");
                setDivisions(response.data);
            } catch (err: any) {
                setDivisionError(err.message || "Failed to load divisions");
            } finally {
                setIsLoadingDivisions(false);
            }
        };
        fetchDivisions();
    }, [reportCategory]);

    // ── Form submit ───────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setReportError(null);
        setReportData([]);
        setVariableReportData([]);
        setTotalSolarData(null);
        setRawSolarData(null);

        try {
            const requestBody = {
                reportCategory: getReportCategoryValue(reportCategory),
                typeCode: reportCategory !== "Entire CEB" ? categoryValue : "",
                billCycle,
                reportType,
                solarType: hideSolarType ? "" : getSolarTypeValue(solarType),
            };

            const response = await fetch("/misapi/api/pucsl/solarConnections", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                let msg = `HTTP error! status: ${response.status}`;
                try { const d = await response.json(); if (d.errorMessage) msg = d.errorMessage; } catch { }
                throw new Error(msg);
            }

            const result = await response.json();
            if (result.errorMessage) throw new Error(result.errorMessage);

            // ── Route to the correct state based on report type ───────────────
            if (reportType === "TotalSolarCustomers") {
                const tsc = result.data as TotalSolarCustomersResponse;
                if (!tsc?.Ordinary && !tsc?.Bulk)
                    throw new Error("No data found for the selected criteria.");
                setTotalSolarData(tsc);
            } else if (reportType === "RawDataForSolar") {
                const rds = result.data as RawDataForSolarResponse;
                if (!rds?.Ordinary && !rds?.Bulk)
                    throw new Error("No data found for the selected criteria.");
                setRawSolarData(rds);
            } else if (reportType === "VariableSolarData") {
                if (!Array.isArray(result.data)) throw new Error("No data found for the selected criteria.");
                setVariableReportData(result.data as VariableSolarDataModel[]);
            } else {
                if (!Array.isArray(result.data)) throw new Error("No data found for the selected criteria.");
                setReportData(result.data as FixedSolarDataModel[]);
            }

            // ── Set display labels ────────────────────────────────────────────
            if (reportCategory === "Province") {
                const p = provinces.find((p) => p.ProvinceCode === categoryValue);
                setSelectedCategoryName(p ? `${p.ProvinceCode} - ${p.ProvinceName}` : categoryValue);
            } else if (reportCategory === "Division") {
                setSelectedCategoryName(categoryValue);
            } else {
                setSelectedCategoryName("Entire CEB");
            }

            const cycle = billCycleOptions.find((o) => o.code === billCycle);
            setSelectedBillCycleDisplay(cycle?.display || billCycle);
            setReportVisible(true);

        } catch (err: any) {
            setReportError(err.message || "Failed to generate report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── CSV export ────────────────────────────────────────────────────────────
    const handleDownloadCSV = () => {
        const title = getReportTitle(reportType);
        const selectionInfo = reportCategory === "Entire CEB"
            ? "Entire CEB"
            : `${reportCategory}: ${selectedCategoryName}`;

        if (reportType === "TotalSolarCustomers" && totalSolarData) {
            buildTotalSolarCSV(title, selectionInfo, selectedBillCycleDisplay, billCycle, totalSolarData);

        } else if (reportType === "RawDataForSolar" && rawSolarData) {
            buildRawDataForSolarCSV(title, selectionInfo, selectedBillCycleDisplay, solarType, billCycle, rawSolarData);

        } else if (reportType === "VariableSolarData") {
            const groupLabels = [
                "0 < x \u2264 20 (Capacity x in kW)",
                "20 < x \u2264 100 (Capacity x in kW)",
                "100 < x \u2264 500 (Capacity x in kW)",
                "x > 500 (Capacity x in kW)",
                "Aggregator Scheme",
            ];
            buildAndDownloadCSV(title, selectionInfo, selectedBillCycleDisplay, solarType, billCycle,
                [
                    ["Consumer Tariff Category", "Year", "Month", ...groupLabels.flatMap((l) => [l, "", ""])],
                    ["", "", "", ...groupLabels.flatMap(() => ["No of Consumers", "kWh Units Purchased", "Paid Amount LKR"])],
                ],
                variableReportData.map((item) => [
                    item.Category, item.Year, item.Month,
                    item.NoOfCustomers0To20, item.KwhUnits0To20, item.PaidAmount0To20,
                    item.NoOfCustomers20To100, item.KwhUnits20To100, item.PaidAmount20To100,
                    item.NoOfCustomers100To500, item.KwhUnits100To500, item.PaidAmount100To500,
                    item.NoOfCustomersAbove500, item.KwhUnitsAbove500, item.PaidAmountAbove500,
                    item.NoOfCustomersAggregator, item.KwhUnitsAggregator, item.PaidAmountAggregator,
                ]),
                "VariableSolar"
            );
        } else {
            buildAndDownloadCSV(title, selectionInfo, selectedBillCycleDisplay, solarType, billCycle,
                [["Tariff Category", "Year", "Month", "No of Customers",
                    "kWh Purchased at 15.50", "kWh Purchased at 22.00", "kWh Purchased at 34.50",
                    "kWh Purchased at 37.00", "kWh Purchased at 23.18", "kWh Purchased at 27.06",
                    "kWh Others", "Paid Amount (Rs.)"]],
                reportData.map((item) => [
                    item.Category, item.Year, item.Month, item.NoOfCustomers,
                    item.KwhAt1550, item.KwhAt22, item.KwhAt3450, item.KwhAt37,
                    item.KwhAt2318, item.KwhAt2706, item.KwhOthers, item.PaidAmount,
                ]),
                "FixedSolar"
            );
        }
    };

    // ── PDF print ─────────────────────────────────────────────────────────────
    const handlePrint = () => {
        if (!printRef.current) return;
        const selectionInfo = reportCategory === "Entire CEB"
            ? "Entire CEB"
            : `${reportCategory}: ${selectedCategoryName}`;
        printReportPDF(
            printRef.current.innerHTML,
            getReportTitle(reportType),
            selectionInfo,
            selectedBillCycleDisplay,
            hideSolarType ? "" : solarType
        );
    };

    // ── Select styling helpers ────────────────────────────────────────────────
    const selectClass = (disabled: boolean) =>
        `w-full px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent ${
            disabled ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "border-gray-300"
        }`;

    const labelClass = (disabled: boolean) =>
        `text-xs font-medium mb-1 ${disabled ? "text-gray-400" : MAROON}`;

    // ── Render the correct table ──────────────────────────────────────────────
    const renderTable = () => {
        if (reportType === "TotalSolarCustomers" && totalSolarData) {
            return <TotalSolarCustomersTable data={totalSolarData} />;
        }
        if (reportType === "RawDataForSolar" && rawSolarData) {
            return <RawDataForSolarTable data={rawSolarData} />;
        }
        if (reportType === "VariableSolarData") {
            return <VariableSolarTable data={variableReportData} />;
        }
        return <FixedSolarTable data={reportData} />;
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 bg-white rounded-lg shadow-md">

            {/* ── Form ─────────────────────────────────────────────────────── */}
            {!reportVisible && (
                <>
                    <h2 className={`text-xl font-bold mb-6 ${MAROON}`}>
                        PUCSL Solar Connection Report
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Row 1 — Report Category | Province/Division */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div className="flex flex-col">
                                <label className={`text-xs font-medium mb-1 ${MAROON}`}>
                                    Select Report Category:
                                </label>
                                <select
                                    value={reportCategory}
                                    onChange={(e) => {
                                        setReportCategory(e.target.value);
                                        setCategoryValue(""); setBillCycle("");
                                        setReportType(""); setSolarType("");
                                    }}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
                                    required
                                >
                                    <option value="Province">Province</option>
                                    <option value="Division">Division</option>
                                    <option value="Entire CEB">Entire CEB</option>
                                </select>
                            </div>

                            {reportCategory !== "Entire CEB" && (
                                <div className="flex flex-col">
                                    <label className={`text-xs font-medium mb-1 ${MAROON}`}>
                                        {reportCategory === "Province" ? "Select Province:" : "Select Division:"}
                                    </label>

                                    {reportCategory === "Province" && (
                                        <select
                                            value={categoryValue}
                                            onChange={(e) => {
                                                setCategoryValue(e.target.value);
                                                setBillCycle(""); setReportType(""); setSolarType("");
                                            }}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
                                            required
                                        >
                                            <option value="">Select Province</option>
                                            {isLoadingProvinces ? <option>Loading...</option>
                                                : provinceError ? <option>Error loading provinces</option>
                                                : provinces.map((p) => (
                                                    <option key={p.ProvinceCode} value={p.ProvinceCode}>
                                                        {p.ProvinceCode} - {p.ProvinceName}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    )}

                                    {reportCategory === "Division" && (
                                        <select
                                            value={categoryValue}
                                            onChange={(e) => {
                                                setCategoryValue(e.target.value);
                                                setBillCycle(""); setReportType(""); setSolarType("");
                                            }}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
                                            required
                                        >
                                            <option value="">Select Division</option>
                                            {isLoadingDivisions ? <option>Loading...</option>
                                                : divisionError ? <option>Error loading divisions</option>
                                                : divisions.map((d) => (
                                                    <option key={d.RegionCode} value={d.RegionCode}>
                                                        {d.RegionCode}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Row 2 — Bill Cycle | Report Type | Solar Type (conditional) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div className="flex flex-col">
                                <label className={labelClass(isBillCycleDisabled())}>Select Bill Cycle:</label>
                                <select
                                    value={billCycle}
                                    onChange={(e) => { setBillCycle(e.target.value); setReportType(""); setSolarType(""); }}
                                    className={selectClass(isBillCycleDisabled())}
                                    required disabled={isBillCycleDisabled()}
                                >
                                    <option value="">Select Bill Cycle</option>
                                    {isLoadingBillCycles ? <option>Loading...</option>
                                        : billCycleError ? <option>Error loading bill cycles</option>
                                        : billCycleOptions.map((o) => (
                                            <option key={o.code} value={o.code}>{o.display}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelClass(isReportTypeDisabled())}>Select Report Type:</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => { setReportType(e.target.value); setSolarType(""); }}
                                    className={selectClass(isReportTypeDisabled())}
                                    required disabled={isReportTypeDisabled()}
                                >
                                    <option value="">Select Report Type</option>
                                    <option value="FixedSolarData">Fixed Solar Data Submission Report</option>
                                    <option value="VariableSolarData">Variable Solar Data Submission Report</option>
                                    <option value="TotalSolarCustomers">Total No of Solar Customers</option>
                                    <option value="RawDataForSolar">Raw Data for Solar</option>
                                    {/* Add more report types here as they are implemented */}
                                </select>
                            </div>

                            {/* Solar Type — hidden for reports that don't need it */}
                            {!hideSolarType && (
                                <div className="flex flex-col">
                                    <label className={labelClass(isSolarTypeDisabled())}>Select Solar Type:</label>
                                    <select
                                        value={solarType}
                                        onChange={(e) => setSolarType(e.target.value)}
                                        className={selectClass(isSolarTypeDisabled())}
                                        required disabled={isSolarTypeDisabled()}
                                    >
                                        <option value="">Select Solar Type</option>
                                        {showNetMetering && <option value="Net Metering">Net Metering</option>}
                                        <option value="Net Accounting">Net Accounting</option>
                                        <option value="Net Plus">Net Plus</option>
                                        <option value="Net Plus Plus">Net Plus Plus</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end mt-6">
                            <button
                                type="submit"
                                disabled={loading || !canSubmit()}
                                className={`px-6 py-2 rounded-md font-medium transition-opacity duration-300 shadow ${MAROON_GRAD} text-white ${
                                    loading || !canSubmit() ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Loading...
                                    </span>
                                ) : "Generate Report"}
                            </button>
                        </div>
                    </form>

                    {reportError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {reportError}
                        </div>
                    )}
                </>
            )}

            {/* ── Report ───────────────────────────────────────────────────── */}
            {reportVisible && (
                <div className="mt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                            <h2 className={`text-xl font-bold ${MAROON}`}>{getReportTitle(reportType)}</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {reportCategory === "Entire CEB" ? "Entire CEB" : `${reportCategory}: ${selectedCategoryName}`}
                                {" "}| Bill Cycle: {selectedBillCycleDisplay}
                                {!hideSolarType && ` | Solar Type: ${solarType}`}
                            </p>
                        </div>
                        <div className="flex space-x-2 mt-2 md:mt-0">
                            <button onClick={handleDownloadCSV} className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-blue-50 transition">
                                <FaFileDownload className="w-3 h-3" /> CSV
                            </button>
                            <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-green-50 transition">
                                <FaPrint className="w-3 h-3" /> PDF
                            </button>
                            <button onClick={() => setReportVisible(false)} className="px-4 py-1.5 bg-[#7A0000] hover:bg-[#A52A2A] text-xs rounded-md text-white">
                                Back to Form
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[calc(100vh-250px)] border border-gray-300 rounded-lg">
                        <div ref={printRef} className="min-w-full py-4 px-2">
                            {renderTable()}
                        </div>
                    </div>

                    {reportError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {reportError}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PUCSLSolarConnection;