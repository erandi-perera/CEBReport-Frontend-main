import React, { useEffect, useState, useMemo } from "react";
import { useUser } from "../../contexts/UserContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface CostCentre {
  DeptId: string;
  DeptName: string;
}

interface PHVItem {
  MatCd: string;
  MatNm: string;
  UomCd: string;
  GradeCd: string;
  Qty: number; 
  Rate: number; // Unit Price
  Amount: number;
  CntedQty?: number; 
  Remarks?: string; 
  [key: string]: any;
}

function PHVEntryForm() {
  const { user } = useUser();
  const epfNo = user?.Userno || "";

  const [costCentres, setCostCentres] = useState<CostCentre[]>([]);
  const [deptId, setDeptId] = useState("");
  const [docNo, setDocNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PHVItem[]>([]);
  const [error, setError] = useState("");

  const columnDisplayNames: Record<string, string> = {
    MatCd: "Code No",
    MatNm: "Description",
    GradeCd: "Grade Code",
    UomCd: "UOM",
    Rate: "Unit Price",
    CntedQty: "Counted Qty",
    Qty: "Qty on Hand",
    Amount: "Amount",
  };

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
    if (!docNo) return setError("Please enter Document No");

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:44381/api/physical-verification?deptId=${encodeURIComponent(deptId)}&docNo=${encodeURIComponent(docNo)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResult(Array.isArray(json) ? json : json.data || []);
    } catch (err: any) {
      setError("Error fetching PHV data: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDeptId("");
    setDocNo("");
    setResult([]);
    setError("");
  };

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    result.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (typeof item[key] === "number") {
          totals[key] = (totals[key] || 0) + item[key];
        }
      });
    });
    return totals;
  }, [result]);

  //   PDF format
  const handleExportPDF = () => {
    if (result.length === 0) {
      setError("No data to export");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.text("Ceylon Electricity Board", 105, 15, { align: "center" });
    doc.setFontSize(12);

    const repYear = "20" + docNo.split("/")[2];  // Extract the two-digit year from docNo and make it four-digit
    doc.text(`Annual Verification of Stores ${repYear}`, 105, 22, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Cost center : ${deptId}`, 14, 35);
    doc.text(`Verification Sheet No : ${docNo}`, pageWidth - 14, 35, { align: "right" });

    // Export columns: Serial No, Code No, Description, Grade Code, UOM, Unit Price, Counted Qty, Remarks (empty)
    const exportHeaders = ["Serial No", "Code No", "Description", "Grade Code", "UOM", "Unit Price", "Counted Qty", "Remarks"];

    const exportRows = result.map((item, index) => [
      index + 1,
      item.MatCd || "",
      item.MatNm || "",
      item.GradeCd || "",
      item.UomCd || "",
      (item.UnitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }),
      (item.CntedQty || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }),
      "",  // Empty Remarks
    ]);

    autoTable(doc, {
      head: [exportHeaders],
      body: exportRows,
      startY: 50,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [122, 0, 0] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;

    doc.setFontSize(10);
    doc.text(
      `Total Counted Quantity: ${columnTotals["CntedQty"]?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"
      }`,
      14,
      finalY + 10
    );

    // ===== MOVE VERIFICATION TO NEXT PAGE IF NEEDED =====
    const pageHeight = doc.internal.pageSize.getHeight();
    if (finalY + 80 > pageHeight) {
      doc.addPage();
    }

    const verifyStartY = 20;

    // ===== CERTIFICATION TEXT =====
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);

    doc.text(
      "We do hereby certify that Stocks were physically counted as per that given statment.",
      14,
      verifyStartY
    );

    // helper for dotted lines
    const dots = "........................................";

    // ===== VERIFIERS =====
    doc.setFont("helvetica", "bold");
    doc.text("Verifiers:", 14, verifyStartY + 10);

    autoTable(doc, {
      startY: verifyStartY + 16,
      head: [["No", "Name", "Designation", "Signature"]],
      body: [
        ["1.", dots, dots, dots],
        ["2.", dots, dots, dots],
        ["3.", dots, dots, dots],
      ],
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 70 },
        2: { cellWidth: 55 },
        3: { cellWidth: 45 },
      },
    });

    // ===== CEB OBSERVATION TEAM =====
    const afterVerifiersY = (doc as any).lastAutoTable.finalY;

    doc.setFont("helvetica", "bold");
    doc.text("CEB Observation Team:", 14, afterVerifiersY + 10);

    autoTable(doc, {
      startY: afterVerifiersY + 16,
      head: [["No", "Name", "Designation", "Signature"]],
      body: [
        ["1.", dots, dots, dots],
        ["2.", dots, dots, dots],
      ],
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 70 },
        2: { cellWidth: 55 },
        3: { cellWidth: 45 },
      },
    });

    // ===== AGREEMENT SECTION =====
    const afterObsY = (doc as any).lastAutoTable.finalY;

    const labelX = 14;
    const lineX = 90;
    const lineWidth = "....................................................";

    doc.setFont("helvetica", "normal");
    doc.text(
      "Agreed for above physical count Store keeper / Elect. Supirintendent",
      labelX,
      afterObsY + 12
    );

    doc.text("Signature:", labelX, afterObsY + 22);
    doc.text(lineWidth, lineX, afterObsY + 22);

    doc.text("Name / P.F. No / Designation:", labelX, afterObsY + 32);
    doc.text(lineWidth, lineX, afterObsY + 32);

    doc.text("Approved date:", labelX, afterObsY + 42);
    doc.text(lineWidth, lineX, afterObsY + 42);

    // ===== REMARKS =====
    doc.setFontSize(9);
    doc.text(
      "Note to Remarks : S : Slow Moving   N : Non Moving   D : Damage",
      14,
      afterObsY + 55
    );


    const now = new Date();
    doc.setFontSize(9);
    doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, 285);
    doc.text("Re-printed (Web Reporting)", 14, 292);

    doc.save(`PHV_Report_${docNo}.pdf`);
  };

  // === EXPORT: EXCEL ===
  const handleExportExcel = () => {
    if (result.length === 0) return;

    const exportData = result.map((item, index) => ({
      "Serial No": index + 1,
      "Code No": item.MatCd || "",
      "Description": item.MatNm || "",
      "Grade Code": item.GradeCd || "",
      "UOM": item.UomCd || "",
      "Unit Price": item.UnitPrice || 0,
      "Counted Qty": item.CntedQty ?? 0,
      "Remarks": "",  // Empty Remarks
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PHV Data");
    XLSX.writeFile(workbook, `PHV_Report_${docNo}.xlsx`);
  };

  // === EXPORT: CSV ===
  const handleExportCSV = () => {
    if (result.length === 0) return;

    const headers = ["Serial No", "Code No", "Description", "Grade Code", "UOM", "Unit Price", "Counted Qty", "Remarks"];
    const rows = result.map((item, index) => [
      index + 1,
      item.MatCd || "",
      item.MatNm || "",
      item.GradeCd || "",
      item.UomCd || "",
      item.UnitPrice || 0,
      item.CntedQty ?? 0,
      "",  // Empty Remarks
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PHV_Report_${docNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "30px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ color: "#7A0000", textAlign: "center", marginBottom: "30px" }}>
          Physical Verification Entry Form
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
              <option value="">Select Cost Centre</option>
              {costCentres.map((cc) => (
                <option key={cc.DeptId} value={cc.DeptId}>
                  {cc.DeptId} - {cc.DeptName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontWeight: "bold", minWidth: "120px" }}>Document No:</label>
            <input
              type="text"
              value={docNo}
              onChange={(e) => setDocNo(e.target.value)}
              placeholder="e.g. 520.11/PHV/25/0001"
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "280px",
                fontSize: "14px",
              }}
            />
          </div>

          <button
            onClick={handleView}
            style={{
              backgroundColor: "#7A0000",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              minWidth: "80px",
            }}
          >
            View
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
              minWidth: "80px",
            }}
          >
            Clear
          </button>
        </div>

        {result.length > 0 && (
          <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={handleExportPDF}
              style={{
                backgroundColor: "#7A0000",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              style={{
                backgroundColor: "#1e6b3a",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Export Excel
            </button>
            <button
              onClick={handleExportCSV}
              style={{
                backgroundColor: "#2c5234",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Export CSV
            </button>
          </div>
        )}

        {error && <div style={{ marginTop: "15px", color: "red", fontWeight: "bold" }}>{error}</div>}
        {loading && <div style={{ marginTop: "15px", color: "#7A0000" }}>Loading data...</div>}

        {/* Browser Table - Shows ALL columns */}
        {result.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <div
              style={{
                maxHeight: "500px",
                overflow: "auto",
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

export default PHVEntryForm;  