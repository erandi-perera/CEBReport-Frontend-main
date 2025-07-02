import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/Store";
import { Bulk_Billing_Report_API } from "../../../../../services/BackendServices";
import {
  FaArrowLeft,
  FaFileDownload,
  FaPrint,
  FaUserCircle,
  FaMapMarkerAlt,
  FaHome,
  FaBolt,
  FaListOl,
  FaCalendarAlt,
  FaBalanceScale,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReportTable from "../../../../shared/ReportTable";
import type {
  CustomerDetails,
  BulkReportRow,
} from "../../../../../interfaces/chartTypes";

const BulkReporting = () => {
  const [rows, setRows] = useState<BulkReportRow[]>([]);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
 
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { acctNo, FbillCycle, TbillCycle } = useSelector(
    (state: RootState) => state.billing
  );

  useEffect(() => {
    const fetchData = async () => {
    
      setError(null);
      setRows([]);
      setCustomer(null);

      try {
        const payload = { acctNo, FbillCycle, TbillCycle };

        const response = await fetch(Bulk_Billing_Report_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Bulk API error");
        const apiData = await response.json();

        // Extract customer details
        if (apiData.customerMasDetail) {
          setCustomer({
            acctNumber: apiData.customerMasDetail.acctNumber || "",
            name: apiData.customerMasDetail.name || "",
            address: apiData.customerMasDetail.address || "",
            tariff: apiData.customerMasDetail.tariff || "",
            wlkOdr: apiData.customerMasDetail.wlkOdr || "",
            province: apiData.customerMasDetail.province || "",
            areaName: apiData.customerMasDetail.areaName || "",
          });
        }

        // Extract transaction rows
        const dataArray =
          apiData.customerTransDetail ||
          apiData.details ||
          apiData.data ||
          (Array.isArray(apiData) ? apiData : []);

        const mappedRows: BulkReportRow[] = dataArray.map((item: any) => ({
          billCycle: item.billCycle || "",
          year: item.year || "",
          transDate: item.transDate || "",
          transType: item.transType || "",
          reading: item.reading || "",
          units: item.units || "",
          rate: item.rate ?? null,
          amount: item.amount ?? null,
          monthlyChg: item.monthlyChg ?? null,
          payments: item.payments ?? null,
          debits: item.debits ?? null,
          credits: item.credits ?? null,
          dueAmount: item.dueAmount ?? null,
          dueAmtDrCr: item.dueAmtDrCr || null,
          balance: item.balance ?? null,
          balanceDrCr: item.balanceDrCr || "",
        }));

        setRows(mappedRows);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
        console.log(error);
      } finally {
   
      }
    };

    if (acctNo && FbillCycle && TbillCycle) {
      fetchData();
    }
  }, [acctNo, FbillCycle, TbillCycle]);

  const downloadAsCSV = () => {
    if (!rows.length) return;
    const csvRows = [
      [
        "Bill Month",
        "Year",
        "TXN/Read Date",
        "Trans. Description",
        "Current Reading",
        "Total Units",
        "Rate",
        "Amount",
        "Total Monthly Charge",
        "Payment",
        "Debits",
        "Credits",
        "Total Amount Due",
        "Balance",
      ],
      ...rows.map((row) => [
        row.billCycle,
        row.year,
        row.transDate,
        row.transType,
        row.reading,
        row.units,
        row.rate,
        row.amount,
        row.monthlyChg,
        row.payments,
        row.debits,
        row.credits,
        row.dueAmount,
        row.dueAmtDrCr || "",
        row.balance + " " + (row.balanceDrCr || ""),
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `BulkReport_${customer?.acctNumber || "bulk"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print as PDF
  const printPDF = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // Helper function to display empty cell for zero, null, or empty string
 
   

  return (
    <div
      className="max-w-6xl mx-auto p-4 bg-white rounded-lg shadow border border-gray-100 relative"
      ref={printRef}
      style={{ width: "100%", maxWidth: "100%" }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/report/billing-payment")}
        className="mb-4 flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200 transition border border-gray-200"
      >
        <FaArrowLeft className="w-3 h-3" />
        Back to Charts
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6 mt-2">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <FaListOl className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight break-words">
            Bulk Billing Details
          </h2>
          <span className="ml-2 text-xs text-gray-500 font-normal">
            Account:{" "}
            <span className="text-gray-700 font-semibold">
              {customer?.acctNumber}
            </span>
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={printPDF}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200 hover:bg-gray-200 transition"
          >
            <FaPrint className="w-3 h-3" /> Print PDF
          </button>
          <button
            onClick={downloadAsCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200 hover:bg-gray-200 transition"
          >
            <FaFileDownload className="w-3 h-3" /> Download Excel
          </button>
        </div>
      </div>

      {/* Customer Details */}
      {customer && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded border border-gray-200">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="break-words flex items-center gap-1">
              <FaUserCircle className="text-gray-300 w-4 h-4" />{" "}
              <span>
                <strong>Account:</strong> {customer.acctNumber}
              </span>
            </div>
            <div className="break-words flex items-center gap-1">
              <FaUserCircle className="text-gray-300 w-4 h-4" />{" "}
              <span>
                <strong>Name:</strong> {customer.name}
              </span>
            </div>
            <div className="break-words flex items-center gap-1">
              <FaHome className="text-gray-300 w-4 h-4" />{" "}
              <span>
                <strong>Address:</strong> {customer.address}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FaCalendarAlt className="text-gray-300 w-4 h-4" />{" "}
              <span>
                <strong>Date:</strong> {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FaBalanceScale className="text-gray-300 w-4 h-4" />{" "}
              <span>
                <strong>Tariff:</strong> {customer.tariff}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FaListOl className="text-gray-300 w-4 h-4" />{" "}
              <span>
                <strong>Walk Order:</strong> {customer.wlkOdr}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FaMapMarkerAlt className="text-gray-300 w-4 h-4" />{" "}
              <span>
                <strong>Province:</strong> {customer.province}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FaBolt className="text-gray-300 w-4 h-4" />{" "}
              <span>
                <strong>Area:</strong> {customer.areaName}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <ReportTable
        columns={[
          { label: "Bill Month", accessor: "billCycle" },
          { label: "Year", accessor: "year" },
          { label: "TXN/Read Date", accessor: "transDate" },
          { label: "Trans. Description", accessor: "transType" },
          { label: "Current Reading", accessor: "reading" },
          { label: "Total Units", accessor: "units" },
          { label: "Rate", accessor: "rate", align: "right" },
          { label: "Amount", accessor: "amount", align: "right" },
          { label: "Monthly Charge", accessor: "monthlyChg", align: "right" },
          { label: "Payment", accessor: "payments", align: "right" },
          { label: "Debits", accessor: "debits", align: "right" },
          { label: "Credits", accessor: "credits", align: "right" },
          { label: "Amount Due", accessor: "dueAmount", align: "right" },
          { label: "Due Dr/Cr", accessor: "dueAmtDrCr" },
          { label: "Balance", accessor: "balance", align: "right" },
          { label: "Balance Dr/Cr", accessor: "balanceDrCr" },
        ]}
        data={rows}
        rowKey={(_, idx) => idx}
      />
    </div>
  );
};

export default BulkReporting;
