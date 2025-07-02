import { useEffect, useState, useRef } from "react";
import { postJSON } from "../../../../../helpers/LoginHelper";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/Store";
import { Ordinary_Reading_History_API } from "../../../../../services/BackendServices";
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
  ReadTransaction,
  CustomerTransactionHistory,
} from "../../../../../interfaces/chartTypes";

const ReadingHistoryReport = () => {
  const [data, setData] = useState<
    | (Omit<CustomerTransactionHistory, "transactions"> & {
        transactions: ReadTransaction[];
      })
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { acctNo, FbillCycle, TbillCycle } = useSelector(
    (state: RootState) => state.billing
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!acctNo || FbillCycle === undefined || TbillCycle === undefined) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = {
          acctNo: acctNo,
          FbillCycle: FbillCycle,
          TbillCycle: TbillCycle,
        };

        const result = await postJSON(Ordinary_Reading_History_API, payload);
        console.log("API result:", result);

        const customer = result.customerMasDetail;
        let transactions = (result.customerReadDetail || []).map((t: any) => ({
          billCycle: t.billCycle || "",
          year: t.year || "",
          readDate: t.readDate || "",
          readMet1: t.readMet1 || "",
          readMet2: t.readMet2 || "",
          readMet3: t.readMet3 || "",
          days: t.days || "",
          units: t.units || "",
          kwh: t.kwh || "",
        }));
        console.log("Transactions:", transactions);

        setData({
          accountNumber: customer.acctNumber || "",
          name: customer.name || "",
          address: customer.address || "",
          tariff: customer.tariff || "",
          area: customer.areaName || "",
          wlkOdr: customer.wlkOdr || "",
          met1: customer.met1 || "",
          met2: customer.met2 || "",
          met3: customer.met3 || "",
          province: customer.province || "",
          netType: customer.netType || "",
          date: new Date().toLocaleString(),
          balance: "",
          transactions,
        });
      } catch (error: any) {
        setError(error.message || "Failed to fetch report data");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [acctNo, FbillCycle, TbillCycle]);

  // Download as Excel (CSV)
  const downloadAsCSV = () => {
    if (!data) return;
    const csvRows = [
      [
        "Bill Cycle",
        "Bill Month",
        "Reading Date",
        "Meter 1",
        "Meter 2",
        "Meter 3",
        "Consumption",
        "Days",
        "Charge",
      ],
      ...data.transactions.map((t) => [
        t.billCycle,
        t.year,
        t.readDate,
        t.readMet1,
        t.readMet2,
        t.readMet3,
        t.units,
        t.days,
        t.kwh,
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ReadingHistory_${data.accountNumber}.csv`);
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

  if (loading)
    return (
      <div className="flex justify-center items-center py-8 text-blue-600">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded">
        Error: {error}
      </div>
    );
  if (!data)
    return (
      <div className="text-gray-600 bg-gray-50 border border-gray-200 p-4 rounded">
        No data found or invalid data received from the API.
      </div>
    );

  return (
    <div
      className="max-w-6xl mx-auto p-4 bg-white rounded-lg shadow border border-gray-100"
      ref={printRef}
      style={{ minWidth: 320, maxWidth: "80vw" }}
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <FaListOl className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 tracking-tight">
            Reading History
          </h2>
          <span className="ml-2 text-xs text-gray-500 font-normal">
            Account:{" "}
            <span className="text-gray-700 font-semibold">
              {data.accountNumber}
            </span>
          </span>
        </div>
        <div className="flex gap-2">
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

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-2">
        <div className="bg-gray-50 rounded p-3 shadow-sm flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <FaUserCircle className="text-gray-300 w-4 h-4" />
            Name: <span className="font-normal text-gray-800">{data.name}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <FaBalanceScale className="text-gray-300 w-4 h-4" />
            Tariff:{" "}
            <span className="font-normal text-gray-800">{data.tariff}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <FaListOl className="text-gray-300 w-4 h-4" />
            Walk Order:{" "}
            <span className="font-normal text-gray-800">{data.wlkOdr}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <FaHome className="text-gray-300 w-4 h-4" />
            Address:{" "}
            <span className="font-normal text-gray-800">{data.address}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <FaCalendarAlt className="text-gray-300 w-4 h-4" />
            Date: <span className="font-normal text-gray-800">{data.date}</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded p-3 shadow-sm flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <FaMapMarkerAlt className="text-gray-300 w-4 h-4" />
            Province:{" "}
            <span className="font-normal text-gray-800">{data.province}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <FaBolt className="text-gray-300 w-4 h-4" />
            Area: <span className="font-normal text-gray-800">{data.area}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <span className="text-gray-300 font-bold w-4 h-4">M1</span>
            Meter 1:{" "}
            <span className="font-normal text-gray-800">{data.met1}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <span className="text-gray-300 font-bold w-4 h-4">M2</span>
            Meter 2:{" "}
            <span className="font-normal text-gray-800">{data.met2}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <span className="text-gray-300 font-bold w-4 h-4">M3</span>
            Meter 3:{" "}
            <span className="font-normal text-gray-800">{data.met3}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium">
            <FaBolt className="text-gray-300 w-4 h-4" />
            Net Type:{" "}
            <span className="font-normal text-gray-800">{data.netType}</span>
          </div>
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-700 mb-2 flex items-center gap-1">
        <FaListOl className="text-gray-400 w-4 h-4" /> Reading Records
      </h3>
      <ReportTable
        columns={[
          { label: "Bill Cycle", accessor: "billCycle" },
          { label: "Bill Month", accessor: "year" },
          { label: "Reading Date", accessor: "readDate" },
          { label: "Meter 1", accessor: "readMet1" },
          { label: "Meter 2", accessor: "readMet2" },
          { label: "Meter 3", accessor: "readMet3" },
          { label: "Consumption", accessor: "units", align: "right" },
          { label: "Days", accessor: "days", align: "right" },
          { label: "Charge", accessor: "kwh", align: "right" },
        ]}
        data={data.transactions}
        rowKey={(_, idx) => idx}
      />
    </div>
  );
};

export default ReadingHistoryReport;
