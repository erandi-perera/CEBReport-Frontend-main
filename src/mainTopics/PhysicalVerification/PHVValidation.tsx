import React, { useEffect, useState, useMemo } from "react";
import { useUser } from "../../contexts/UserContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface CostCentre {
  DeptId: string;
  DeptName: string;
}

interface PHVValidationItem {
  MatCd: string;
  MatNm: string;
  UomCd: string;
  GradeCd: string;
  Qty: number; // Stock Book Quantity
  Rate: number; // Standard Price
  CntedQty: number; // Physical
  Reason?: string; // Reason - empty
  [key: string]: any;
}

function PHVValidationForm() {
  const { user } = useUser();
  const epfNo = user?.Userno || "";

  const [costCentres, setCostCentres] = useState<CostCentre[]>([]);
  const [deptId, setDeptId] = useState("");
  const [repMonth, setRepMonth] = useState("");
  const [repYear, setRepYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PHVValidationItem[]>([]);
  const [error, setError] = useState("");

  // Updated display names
  const columnDisplayNames: Record<string, string> = {
    MatCd: "Code No",
    MatNm: "Description",
    GradeCd: "Grade Code",
    UomCd: "UOM",
    Rate: "Standard Price",
    Qty: "Stock Book Quantity",
    CntedQty: "Physical",
    Reason: "Reason",
  };

  // Months dropdown 
 const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];


  const currentYear = new Date().getFullYear();


const years = Array.from({ length: 20 }, (_, i) =>
  (currentYear - i).toString()
);

useEffect(() => {
  setRepYear(currentYear.toString());
}, []);

  useEffect(() => {
    if (!epfNo) return;

    const loadCostCentres = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/misapi/api/incomeexpenditure/departments/${epfNo}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setCostCentres(list);
      } catch (err: any) {
        setError("Failed to load Cost Centres");
      } finally {
        setLoading(false);
      }
    };

    loadCostCentres();
  }, [epfNo]);

  const handleView = async () => {
    setError("");
    setResult([]);
    if (!deptId) return setError("Please select Cost Centre");
    if (!repMonth) return setError("Please select Month");
    if (!repYear) return setError("Please select Year");

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:44381/api/physical-verification-validation?deptId=${encodeURIComponent(deptId)}&repYear=${encodeURIComponent(repYear)}&repMonth=${encodeURIComponent(repMonth)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResult(Array.isArray(json) ? json : json.data || []);
    } catch (err: any) {
      setError("Error fetching PHV Validation data: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDeptId("");
    setRepMonth("");
    setRepYear("");
    setResult([]);
    setError("");
  };

  // === EXPORT: PDF ===
  const handleExportPDF = () => {
    if (result.length === 0) {
      setError("No data to export");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text("CEYLON ELECTRICITY BOARD", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text(`ANNUAL VERIFICATION OF STORES ${repYear} (Validation)`, pageWidth / 2, 23, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Cost center : ${deptId}`, 14, 35);

    const exportHeaders = [
      "Serial No",
      "Code No",
      "Description",
      "Grade Code",
      "UOM",
      "Standard Price",
      "Stock Book Quantity",
      "Physical",
      "Reason",
    ];

    const exportRows = result.map((item, index) => [
      index + 1,
      item.MatCd || "",
      item.MatNm || "",
      item.GradeCd || "",
      item.UomCd || "",
      (item.UnitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }),
      (item.QtyOnHand || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }),
      (item.CntedQty || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }),
      "", // Empty Reason
    ]);

    autoTable(doc, {
      head: [exportHeaders],
      body: exportRows,
      startY: 45,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [122, 0, 0], textColor: 255, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 18, halign: "center" },
        1: { cellWidth: 28 },
        2: { cellWidth: 60 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 16, halign: "center" },
        5: { cellWidth: 28, halign: "right" },
        6: { cellWidth: 28, halign: "right" },
        7: { cellWidth: 28, halign: "right" },
        8: { cellWidth: 30 },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    const now = new Date();
    doc.setFontSize(9);
    doc.text(`Date & time of the Report Generated : ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, 285);

    doc.save(`PHV_Validation_Report_${deptId}_${repYear}_${repMonth}.pdf`);
  };

  //  EXCEL 
  const handleExportExcel = () => {
    if (result.length === 0) return;

    const exportData = result.map((item, index) => ({
      "Serial No": index + 1,
      "Code No": item.MatCd || "",
      "Description": item.MatNm || "",
      "Grade Code": item.GradeCd || "",
      "UOM": item.UomCd || "",
      "Standard Price": item.UnitPrice || 0,
      "Stock Book Quantity": item.QtyOnHand || 0,
      "Physical": item.CntedQty ?? 0,
      "Reason": "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PHV Validation Data");
    XLSX.writeFile(workbook, `PHV_Validation_Report_${deptId}_${repYear}_${repMonth}.xlsx`);
  };

  // CSV 
  const handleExportCSV = () => {
    if (result.length === 0) return;

    const headers = [
      "Serial No",
      "Code No",
      "Description",
      "Grade Code",
      "UOM",
      "Standard Price",
      "Stock Book Quantity",
      "Physical",
      "Reason",
    ];
    const rows = result.map((item, index) => [
      index + 1,
      item.MatCd || "",
      item.MatNm || "",
      item.GradeCd || "",
      item.UomCd || "",
      item.UnitPrice || 0,
      item.QtyOnHand || 0,
      item.CntedQty ?? 0,
      "",
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PHV_Validation_Report_${deptId}_${repYear}_${repMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "30px",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ color: "#7A0000", textAlign: "center", marginBottom: "30px", fontSize: "24px" }}>
          PHV Validation Form
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontWeight: "bold", minWidth: "110px" }}>Cost Centre:</label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "220px",
                fontSize: "14px",
              }}
            >
              <option value="">Select One</option>
              {costCentres.map((cc) => (
                <option key={cc.DeptId} value={cc.DeptId}>
                  {cc.DeptId} - {cc.DeptName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontWeight: "bold", minWidth: "100px" }}>Month:</label>
            <select
              value={repMonth}
              onChange={(e) => setRepMonth(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "150px",
                fontSize: "14px",
              }}
            >
              <option value="">Select Month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontWeight: "bold", minWidth: "100px" }}>Year:</label>
            <select
              value={repYear}
              onChange={(e) => setRepYear(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "150px",
                fontSize: "14px",
              }}
            >
              <option value="">Select Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleView}
            disabled={loading}
            style={{
              backgroundColor: "#7A0000",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Loading..." : "View"}
          </button>

          <button
            onClick={handleReset}
            style={{
              backgroundColor: "#f0f0f0",
              color: "#333",
              border: "1px solid #ccc",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        {result.length > 0 && (
          <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={handleExportPDF} style={{ backgroundColor: "#7A0000", color: "white", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer" }}>
              Export PDF
            </button>
            <button onClick={handleExportExcel} style={{ backgroundColor: "#1e6b3a", color: "white", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer" }}>
              Export Excel
            </button>
            <button onClick={handleExportCSV} style={{ backgroundColor: "#2c5234", color: "white", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer" }}>
              Export CSV
            </button>
          </div>
        )}

        {error && <div style={{ marginTop: "15px", color: "red", fontWeight: "bold" }}>{error}</div>}
        {loading && <div style={{ marginTop: "15px", color: "#7A0000" }}>Loading data...</div>}

        {result.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <div
              style={{
                maxHeight: "500px",
                overflowX: "auto",
                overflowY: "visible",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >

              <table
                style={{
                  width: "100%",
                  minWidth: "800px",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#7A0000", color: "white", position: "sticky", top: 0, zIndex: 1 }}>
                    {Object.keys(result[0]).map((key) => (
                      <th
                        key={key}
                        style={{
                          padding: "12px 10px",
                          border: "1px solid #ddd",
                          textAlign: typeof result[0][key] === "number" ? "right" : "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {columnDisplayNames[key] || key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                      {Object.keys(item).map((key) => (
                        <td
                          key={key}
                          style={{
                            padding: "10px",
                            border: "1px solid #ddd",
                            textAlign: typeof item[key] === "number" ? "right" : "left",
                          }}
                        >
                          {typeof item[key] === "number"
                            ? item[key].toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                            : item[key] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PHVValidationForm;