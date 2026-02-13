import React from "react";
import ReportTable from "../../shared/ReportTable";

import jsPDF from "jspdf";
import "jspdf-autotable";
declare module "jspdf" {
  interface jsPDF {
    autoTable: (...args: any[]) => void;
  }
}

interface SolarAgeCategoryData {
  AccountNumber: string;
  Name: string;
  Address: string;
  NetType: string;
  InitialAgreementDate: string;
}

interface SolaAgeCategoryTableProps {
  data: SolarAgeCategoryData[];
  loading: boolean;
  error: string | null;
  category: string;
  onClose: () => void;
}

const SolaAgeCategoryTable: React.FC<SolaAgeCategoryTableProps> = ({
  data,
  loading,
  error,
  category,
  onClose,
}) => {
  const downloadAsCSV = () => {
    if (!data.length) return;

    try {
      const headers = [
        "Account Number",
        "Name",
        "Address",
        "Net Type",
        "Initial Agreement Date",
      ];

      const rows = data.map((item) => [
        item.AccountNumber,
        item.Name,
        item.Address,
        item.NetType,
        item.InitialAgreementDate,
      ]);

      // Add metadata at the top
      const metadata = [
        [`Solar Age Category Report - ${category}`],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Total Records: ${data.length}`],
        [],
      ];

      const csvContent = [
        ...metadata,
        headers,
        ...rows,
      ]
        .map((row) => row.map((cell) => `"${String(cell)}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Solar_Age_Category_${category.replace(/\s+/g, "_")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("CSV downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Error downloading CSV. Please try again.");
    }
  };

  const downloadAsPDF = () => {
    if (!data.length) return;

    try {
      const doc = new jsPDF();
      // Debug: Check if autoTable is available
      if (typeof doc.autoTable !== "function") {
        console.error("autoTable is not a function on jsPDF instance", doc);
        alert("PDF export setup error: autoTable is not available. Check jsPDF/jspdf-autotable import.");
        return;
      }
      // Set colors
      const maroonColor = [122, 0, 0];
      const lightGrayColor = [245, 245, 245];

      // Add header
      doc.setFontSize(16);
      doc.setTextColor(maroonColor[0], maroonColor[1], maroonColor[2]);
      doc.text("Solar Age Category Report", 14, 15);

      // Add category info
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Category: ${category}`, 14, 25);
      // Add generated date
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 31);
      doc.text(`Total Records: ${data.length}`, 14, 36);

      // Table columns and rows
      const tableColumn = [
        "Account Number",
        "Name",
        "Address",
        "Net Type",
        "Agreement Date",
      ];
      const tableRows = data.map((item) => [
        item.AccountNumber,
        item.Name,
        item.Address,
        item.NetType,
        item.InitialAgreementDate,
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 42,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: "linebreak",
          halign: "left",
          valign: "middle",
        },
        headStyles: {
          fillColor: maroonColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          lineColor: maroonColor,
        },
        bodyStyles: {
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
        },
        alternateRowStyles: {
          fillColor: lightGrayColor,
        },
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        didDrawPage: function (data: any) {
          // Footer
          const pageCount = (doc as any).internal.pages.length - 1;
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.getHeight();
          const pageWidth = pageSize.getWidth();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        },
      });
      doc.save(`Solar_Age_Category_${category.replace(/\s+/g, "_")}.pdf`);
      console.log("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading data...</p>
      </div>
    );
  }

  const tableColumns = [
    { label: "Account Number", accessor: "AccountNumber", align: "left" as const },
    { label: "Name", accessor: "Name", align: "left" as const },
    { label: "Address", accessor: "Address", align: "left" as const },
    { label: "Net Type", accessor: "NetType", align: "left" as const },
    { label: "Initial Agreement Date", accessor: "InitialAgreementDate", align: "left" as const },
  ];

  if (!data || data.length === 0) {
    return (
      <div className="mt-6 bg-white rounded-xl shadow border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-[#7A0000] mb-4">
          Solar Age Category: {category}
        </h3>
        <div className="text-center text-gray-500 py-10 border rounded-lg bg-gray-50">
          {error ? (
            <div>
              <p className="text-red-600 mb-2">{error}</p>
              <p className="text-sm">No data available for this category</p>
            </div>
          ) : (
            <p>No data available for this category</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-xl shadow border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#7A0000]">
            Solar Age Category: {category}
          </h3>
          {error && (
            <p className="text-xs text-orange-600 mt-1">⚠️ {error}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadAsCSV}
            className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
            disabled={!data.length}
          >
            CSV
          </button>
          <button
            onClick={downloadAsPDF}
            className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
            disabled={!data.length}
          >
            PDF
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#7A0000] hover:bg-[#A52A2A] rounded text-sm text-white"
          >
            Close
          </button>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <ReportTable
          columns={tableColumns}
          data={data}
          emptyMessage="No data available for this category"
        />
      </div>
    </div>
  );
};

export default SolaAgeCategoryTable;