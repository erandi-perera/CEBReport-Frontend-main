import React, {useState, useRef, JSX} from "react";
import {Eye, X, Download, Printer, RotateCcw} from "lucide-react";
import {toast} from "react-toastify";

interface LedgerCardItem {
	GlCd: string;
	SubAc: string;
	Remarks: string | null;
	AcctDt: string | null;
	DocPf: string | null;
	DocNo: string | null;
	Ref1: string | null;
	ChqNo: string | null;
	CrAmt: number | null;
	DrAmt: number | null;
	SeqNo: number | null;
	LogMth: number | null;
	OpeningBalance: number | null;
	ClosingBalance: number | null;
	GLOpeningBalance: number | null;
	GLClosingBalance: number | null;
	AcName: string | null;
	AcName1: string | null;
	CctName: string | null;
}

const formatNumber = (num: number | string | null | undefined): string => {
	const n = num === null || num === undefined ? NaN : Number(num);
	if (isNaN(n)) return "0.00";
	return n.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

const LedgerCardReport: React.FC = () => {
	const [ledgerCode, setLedgerCode] = useState("");
	const [year, setYear] = useState(new Date().getFullYear().toString());
	const [startMonth, setStartMonth] = useState("1");
	const [endMonth, setEndMonth] = useState("12");
	const [data, setData] = useState<LedgerCardItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showReport, setShowReport] = useState(false);
	const [subAccountTotals, setSubAccountTotals] = useState<
		Record<
			string,
			{dr: number; cr: number; runningTotal: number; openingBalance: number}
		>
	>({});
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [showOrientationModal, setShowOrientationModal] = useState(false);

	const maroon = "text-[#7A0000]";
	const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

	const currentYear = new Date().getFullYear();
	const minYear = currentYear - 20;

	const handleViewClick = async () => {
		if (!ledgerCode.trim()) {
			toast.error("Please enter Ledger Code.");
			return;
		}
		if (!year || isNaN(+year)) {
			toast.error("Please enter a valid year.");
			return;
		}
		if (
			+startMonth < 1 ||
			+startMonth > 12 ||
			+endMonth < 1 ||
			+endMonth > 12
		) {
			toast.error("Months must be between 1 and 12.");
			return;
		}
		if (+endMonth < +startMonth) {
			toast.error("End Month cannot be before Start Month.");
			return;
		}

		setLoading(true);
		setError(null);
		setData([]);
		setShowReport(false);

		try {
			const response = await fetch(
				`/misapi/api/ledgercard/report/${encodeURIComponent(
					ledgerCode.trim()
				)}/${year}/${startMonth}/${endMonth}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					credentials: "include",
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`HTTP ${response.status}: ${errorText || "Unknown error"}`
				);
			}

			const result = await response.json();
			const items: LedgerCardItem[] = result.data || [];

			if (items.length === 0) {
				toast.warn("No ledger entries found for the given criteria.");
				return;
			}

			// Group by Sub Account and compute running totals
			const grouped = items.reduce((acc, item) => {
				const subAc = item.SubAc || "UNKNOWN";
				if (!acc[subAc]) {
					acc[subAc] = {
						dr: 0,
						cr: 0,
						runningTotal: item.OpeningBalance || 0,
						openingBalance: item.OpeningBalance || 0,
						entries: [],
					};
				}

				const dr = item.DrAmt || 0;
				const cr = item.CrAmt || 0;
				acc[subAc].dr += dr;
				acc[subAc].cr += cr;
				acc[subAc].runningTotal += dr - cr;
				acc[subAc].entries.push({
					...item,
					runningTotal: acc[subAc].runningTotal,
				});

				return acc;
			}, {} as Record<string, any>);

			const flatData: LedgerCardItem[] = [];
			Object.keys(grouped).forEach((subAc) => {
				flatData.push(...grouped[subAc].entries);
			});

			setData(flatData);
			setSubAccountTotals(
				Object.keys(grouped).reduce((acc, subAc) => {
					acc[subAc] = {
						dr: grouped[subAc].dr,
						cr: grouped[subAc].cr,
						runningTotal: grouped[subAc].runningTotal,
						openingBalance: grouped[subAc].openingBalance,
					};
					return acc;
				}, {} as any)
			);
			setShowReport(true);
			toast.success("Ledger card data loaded successfully.");
		} catch (err: any) {
			console.error("Fetch Error:", err);
			const msg = err.message.includes("Failed to fetch")
				? "Cannot connect to server. Please check your connection."
				: err.message;
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	const clearFilters = () => {
		setLedgerCode("");
		setYear(new Date().getFullYear().toString());
		setStartMonth("1");
		setEndMonth("12");
	};

	const printPDF = (orientation: "portrait" | "landscape") => {
		if (data.length === 0 || !iframeRef.current) return;

		const firstItem = data[0];
		const ledgerName = firstItem.AcName || "N/A";

		const columnWidths =
			orientation === "portrait"
				? {
						docPf: "w-[6%]",
						docNo: "w-[7%]",
						remarks: "w-[15%]",
						date: "w-[8%]",
						ref: "w-[10%]",
						chq: "w-[8%]",
						dr: "w-[10%]",
						cr: "w-[10%]",
						running: "w-[11%]",
				  }
				: {
						docPf: "w-[6%]",
						docNo: "w-[7%]",
						remarks: "w-[20%]",
						date: "w-[8%]",
						ref: "w-[10%]",
						chq: "w-[8%]",
						dr: "w-[9%]",
						cr: "w-[9%]",
						running: "w-[10%]",
				  };

		let tableRows = "";
		let currentSubAc = "";
		let subAcRunning = 0;
		let subAcOpening = 0;

		data.forEach((item, i) => {
			const isNewSubAc = item.SubAc !== currentSubAc;
			if (isNewSubAc && currentSubAc) {
				const subTotal = subAccountTotals[currentSubAc];
				const subNetMovement = subTotal.dr - subTotal.cr;
				tableRows += `
          <tr class="bg-yellow-50 font-bold">
            <td colspan="6" class="p-1 border border-gray-300 text-right">Sub Account Total - ${currentSubAc}:</td>
            <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subTotal.dr
				)}</td>
            <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subTotal.cr
				)}</td>
            <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subTotal.runningTotal
				)}</td>
          </tr>
          <tr class="bg-yellow-100 font-bold">
            <td colspan="6" class="p-1 border border-gray-300 text-right">Net Movement - ${currentSubAc}:</td>
            <td colspan="3" class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subNetMovement
				)}</td>
          </tr>
          <tr class="bg-yellow-100 font-bold">
            <td colspan="6" class="p-1 border border-gray-300 text-right">Closing Balance - ${currentSubAc}:</td>
            <td colspan="3" class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subTotal.runningTotal
				)}</td>
          </tr>
          <tr><td colspan="9" class="p-2 border-0">&nbsp;</td></tr>`;
			}

			if (isNewSubAc) {
				currentSubAc = item.SubAc || "";
				subAcOpening = subAccountTotals[currentSubAc]?.openingBalance || 0;
				subAcRunning = subAcOpening;
				tableRows += `
          <tr class="bg-gray-100 font-bold">
            <td colspan="9" class="p-1 border border-gray-300 text-left">
              Sub Account: ${currentSubAc} | Opening Balance: ${formatNumber(
					subAcOpening
				)}
            </td>
          </tr>`;
			}

			const dr = item.DrAmt || 0;
			const cr = item.CrAmt || 0;
			subAcRunning += dr - cr;

			tableRows += `
        <tr class="${i % 2 ? "bg-white" : "bg-gray-50"}">
          <td class="${
					columnWidths.docPf
				} p-1 border border-gray-300 text-left text-xs">
            ${item.DocPf || ""}
          </td>
          <td class="${
					columnWidths.docNo
				} p-1 border border-gray-300 text-left text-xs">
            ${item.DocNo || ""}
          </td>
          <td class="${
					columnWidths.remarks
				} p-1 border border-gray-300 text-left text-xs break-words">
            ${item.Remarks || ""}
          </td>
          <td class="${
					columnWidths.date
				} p-1 border border-gray-300 text-center text-xs">
            ${item.AcctDt ? new Date(item.AcctDt).toLocaleDateString() : ""}
          </td>
          <td class="${
					columnWidths.ref
				} p-1 border border-gray-300 text-left text-xs">
            ${item.Ref1 || ""}
          </td>
          <td class="${
					columnWidths.chq
				} p-1 border border-gray-300 text-left text-xs">
            ${item.ChqNo || ""}
          </td>
          <td class="${
					columnWidths.dr
				} p-1 border border-gray-300 text-right font-mono text-xs">
            ${formatNumber(item.DrAmt)}
          </td>
          <td class="${
					columnWidths.cr
				} p-1 border border-gray-300 text-right font-mono text-xs">
            ${formatNumber(item.CrAmt)}
          </td>
          <td class="${
					columnWidths.running
				} p-1 border border-gray-300 text-right font-mono text-xs">
            ${formatNumber(subAcRunning)}
          </td>
        </tr>`;
		});

		if (currentSubAc) {
			const subTotal = subAccountTotals[currentSubAc];
			const subNetMovement = subTotal.dr - subTotal.cr;
			tableRows += `
        <tr class="bg-yellow-50 font-bold">
          <td colspan="6" class="p-1 border border-gray-300 text-right">Sub Account Total - ${currentSubAc}:</td>
          <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subTotal.dr
				)}</td>
          <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subTotal.cr
				)}</td>
          <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subTotal.runningTotal
				)}</td>
        </tr>
        <tr class="bg-yellow-100 font-bold">
          <td colspan="6" class="p-1 border border-gray-300 text-right">Net Movement - ${currentSubAc}:</td>
          <td colspan="3" class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subNetMovement
				)}</td>
        </tr>
        <tr class="bg-yellow-100 font-bold">
          <td colspan="6" class="p-1 border border-gray-300 text-right">Closing Balance - ${currentSubAc}:</td>
          <td colspan="3"class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
					subTotal.runningTotal
				)}</td>
        </tr>`;
		}

		const htmlContent = `
      <html>
        <head>
          <style>
            @media print {
              @page { size: A4 ${orientation}; margin: 15mm 5mm 20mm 10mm; }
              body { margin: 0; font-family: Arial, sans-serif; font-size: 11px; }
              .print-header { margin: 20px 15px 10px; text-align: center; }
              .print-header h2 { font-weight: bold; color: #7A0000; margin: 0; }
              .print-summary { margin: 10px 15px; font-size: 11px; }
              .print-summary p { margin: 3px 5px; }
              .print-equation { margin: 8px 15px; font-size: 10px; color: #666; }
              .print-currency { text-align: right; margin-right: 4px; font-weight: 600; color: #4B5563; }
            table {
  border-collapse: collapse;
  width: 100%;
  margin: 0;
}

th, td {
  border: 1px solid #D1D5DB; /* light gray border */
  padding: 4px;
  font-size: 10px;
}

              th { background: linear-gradient(to right, #7A0000, #A52A2A); color: white; text-align: center; }
              td { text-align: right; }
              td.text-left { text-align: left; }
              .bg-yellow-50 { background-color: #FFFBEB !important; }
              .bg-yellow-100 { background-color: #FEF3C7 !important; }
              .bg-gray-100 { background-color: #F3F4F6 !important; }
              .font-bold { font-weight: bold; }
              .font-mono { font-family: monospace; }
              @page {
                @bottom-left { content: "Printed on: ${new Date().toLocaleString(
							"en-US",
							{timeZone: "Asia/Colombo"}
						)}"; font-size: 9px; color: gray; }
                @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: gray; }
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2> Ledger Card - Details ${startMonth.padStart(
					2,
					"0"
				)}/${year} to ${endMonth.padStart(2, "0")}/${year}</h2>
          </div>
          <div class="print-summary">
            <p><span class="font-bold">Cost Centre :</span> ${
					firstItem.CctName || "N/A"
				}</p>
            <p><span class="font-bold">GL Code :</span> ${
					firstItem.GlCd
				} - ${ledgerName}</p>
            <p><span class="font-bold">Opening Balance for 01/01/${year} :</span> ${formatNumber(
			firstItem.GLOpeningBalance
		)}</p>
          </div>
          <div class="print-currency">Currency : LKR</div>
          <table>
            <thead>
              <tr>
                <th class="${columnWidths.docPf}">Doc Pf</th>
                <th class="${columnWidths.docNo}">Doc No</th>
                <th class="${columnWidths.remarks}">Remarks</th>
                <th class="${columnWidths.date}">Acct. Date</th>
                <th class="${columnWidths.ref}">Reference 1</th>
                <th class="${columnWidths.chq}">Cheque No</th>
                <th class="${columnWidths.dr}">Dr Amount</th>
                <th class="${columnWidths.cr}">Cr Amount</th>
                <th class="${columnWidths.running}">Running Total</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <p class="font-bold">
		  Closing Balance: ${formatNumber(firstItem.GLClosingBalance)}</p> 
		           <div style="margin-top: 40px; display: flex; justify-content: space-between; padding: 0 30px; font-size: 11px;">
            <div>Prepared By: ____________________</div>
            <div>Checked By: ____________________</div>
          </div>
        </body>
      </html>`;

		const iframeDoc = iframeRef.current?.contentDocument;
		if (iframeDoc) {
			iframeDoc.open();
			iframeDoc.write(htmlContent);
			iframeDoc.close();
			setTimeout(() => iframeRef.current?.contentWindow?.print(), 500);
		}
	};

	const handleDownloadCSV = () => {
		if (data.length === 0) return;

		const headers = [
			"Document Profile",
			"Document No",
			"Remarks",
			"Acct. Date",
			"Reference 1",
			"Cheque No",
			"Dr Amount",
			"Cr Amount",
			"Running Total",
			"Sub Account",
		];

		const escapeCsv = (value: any) =>
			`"${String(value ?? "").replace(/"/g, '""')}"`;

		const rows = data.map((item) => {
			const subAc = item.SubAc || "";
			const runningTotal =
				(subAccountTotals[subAc]?.openingBalance || 0) +
				(item.DrAmt || 0) -
				(item.CrAmt || 0);
			return [
				item.DocPf || "",
				item.DocNo || "",
				item.Remarks || "",
				item.AcctDt ? new Date(item.AcctDt).toLocaleDateString() : "",
				item.Ref1 || "",
				item.ChqNo || "",
				formatNumber(item.DrAmt),
				formatNumber(item.CrAmt),
				formatNumber(runningTotal),
				subAc,
			]
				.map(escapeCsv)
				.join(",");
		});

		const totalDr = Object.values(subAccountTotals).reduce(
			(s, t) => s + t.dr,
			0
		);
		const totalCr = Object.values(subAccountTotals).reduce(
			(s, t) => s + t.cr,
			0
		);
		const netMovement = totalDr - totalCr;

		const csvContent = [
			`Cost Center Ledger Card - ${startMonth}/${year} to ${endMonth}/${year}`,
			`GL Code: ${data[0].GlCd} - ${data[0].AcName}`,
			`Cost Centre: ${data[0].CctName}`,
			`Opening Balance: ${formatNumber(data[0].OpeningBalance)}`,
			`Currency: LKR`,
			"",
			headers.join(","),
			...rows,
			"",
			`Net Movement: ${formatNumber(netMovement)}`,
			`Closing Balance: ${formatNumber(data[0].ClosingBalance)}`,
		].join("\n");

		const blob = new Blob([csvContent], {type: "text/csv"});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `ledger_card_${ledgerCode}_${year}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="max-w-[95%] mx-auto p-2 md:p-4 bg-white rounded-xl shadow border border-gray-200 text-sm md:text-base font-sans">
			<h2 className={`text-lg md:text-xl font-bold mb-4 ${maroon}`}>
				Cost Center Ledger Card
			</h2>

			{/* Input Fields */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
				<div>
					<label
						className={`block text-xs md:text-sm font-bold ${maroon} mb-1`}
					>
						Ledger Code
					</label>
					<input
						type="text"
						value={ledgerCode}
						onChange={(e) => setLedgerCode(e.target.value)}
						placeholder="e.g. 510.20-A3900"
						className="w-full pl-3 pr-2 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7A0000] text-xs md:text-sm"
					/>
				</div>

				<div>
					<label
						className={`block text-xs md:text-sm font-bold ${maroon} mb-1`}
					>
						Year
					</label>
					<input
						type="number"
						value={year}
						min={minYear}
						max={currentYear}
						onChange={(e) => setYear(e.target.value)}
						className="w-full pl-3 pr-2 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7A0000] text-xs md:text-sm"
					/>
				</div>

				<div>
					<label
						className={`block text-xs md:text-sm font-bold ${maroon} mb-1`}
					>
						Start Month
					</label>
					<select
						value={startMonth}
						onChange={(e) => setStartMonth(e.target.value)}
						className="w-full pl-3 pr-2 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7A0000] text-xs md:text-sm"
					>
						{Array.from({length: 12}, (_, i) => (
							<option key={i + 1} value={i + 1}>
								{i + 1} -{" "}
								{new Date(0, i).toLocaleString("en", {month: "short"})}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						className={`block text-xs md:text-sm font-bold ${maroon} mb-1`}
					>
						End Month
					</label>
					<select
						value={endMonth}
						onChange={(e) => setEndMonth(e.target.value)}
						className="w-full pl-3 pr-2 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7A0000] text-xs md:text-sm"
					>
						{Array.from({length: 12}, (_, i) => (
							<option key={i + 1} value={i + 1}>
								{i + 1} -{" "}
								{new Date(0, i).toLocaleString("en", {month: "short"})}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex flex-wrap gap-2 mb-4 justify-end">
				<button
					onClick={handleViewClick}
					disabled={loading}
					className={`flex items-center gap-1 px-3 py-1.5 ${maroonGrad} text-white rounded-md text-xs md:text-sm font-medium hover:brightness-110 transition shadow ${
						loading ? "opacity-50 cursor-not-allowed" : ""
					}`}
				>
					<Eye className="w-4 h-4" /> View
				</button>
				<button
					onClick={clearFilters}
					className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs md:text-sm"
				>
					<RotateCcw className="w-4 h-4" /> Clear
				</button>
			</div>

			{loading && (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
					<p className="mt-2 text-gray-600">Loading ledger data...</p>
				</div>
			)}

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					Error: {error}
				</div>
			)}

			{/* Report Modal */}
			{showReport && data.length > 0 && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 print:static print:inset-auto print:p-0 print:bg-white">
					<div className="relative bg-white w-full max-w-[95vw] sm:max-w-4xl md:max-w-6xl lg:max-w-7xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden print:relative print:w-full print:max-w-none print:rounded-none print:shadow-none print:border-none print:overflow-visible print-container mt-60 ml-65">
						<div className="p-2 md:p-2 max-h-[80vh] overflow-y-auto print:p-0 print:max-h-none print:overflow-visible print:mt-10 print:ml-12">
							<div className="flex justify-end gap-3 mb-6 md:mb-8  print:hidden">
								{" "}
								<button
									onClick={handleDownloadCSV}
									className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium hover:bg-blue-50"
								>
									<Download className="w-4 h-4" /> CSV
								</button>
								<button
									onClick={() => setShowOrientationModal(true)}
									className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium hover:bg-green-50"
								>
									<Printer className="w-4 h-4" /> Print
								</button>
								<button
									onClick={() => setShowReport(false)}
									className="flex items-center gap-1 px-3 py-1.5 border border-red-400 text-red-700 bg-white rounded-md text-xs font-medium hover:bg-red-50"
								>
									<X className="w-4 h-4" /> Close
								</button>
							</div>

							<h2
								className={`text-xl font-bold text-center mb-4 ${maroon}`}
							>
								Ledger Card - Details {startMonth}/{year} to {endMonth}/
								{year}
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 text-sm mb-2">
								<div>
									<p>
										<span className="font-bold">Cost Center :</span>{" "}
										{data[0].CctName}
									</p>
									<p>
										<span className="font-bold">
											Opening Balance for 01/01/{year} :
										</span>{" "}
										{formatNumber(data[0].GLOpeningBalance)}
									</p>
								</div>
								<div className="text-right font-semibold text-gray-600">
									Currency : LKR
								</div>
							</div>

							<div className="overflow-x-auto border rounded-lg">
								<table className="w-full text-xs border-collapse table-fixed min-w-[800px]">
									<thead className={`${maroonGrad} text-white`}>
										<tr>
											<th className="px-2 py-1.5 w-[10%]">
												Document No
											</th>
											<th className="px-2 py-1.5 w-[20%]">
												Remarks
											</th>
											<th className="px-2 py-1.5 w-[10%]">
												Acct. Date
											</th>
											<th className="px-2 py-1.5 w-[15%]">
												Reference 1 / Cheque No
											</th>
											<th className="px-2 py-1.5 w-[12%]">
												Dr Amount
											</th>
											<th className="px-2 py-1.5 w-[12%]">
												Cr Amount
											</th>
											<th className="px-2 py-1.5 w-[13%]">
												Running Total
											</th>
										</tr>
									</thead>
									<tbody>
										{(() => {
											let currentSubAc = "";
											let running = 0;
											let opening = 0;
											const rows: JSX.Element[] = [];
											data.forEach((item, i) => {
												const isNewSubAc =
													item.SubAc !== currentSubAc;
												const dr = item.DrAmt || 0;
												const cr = item.CrAmt || 0;

												if (isNewSubAc) {
													if (currentSubAc) {
														rows.push(
															<tr key={`spacer-${currentSubAc}`}>
																<td
																	colSpan={7}
																	className="h-6"
																/>
															</tr>
														);
													}
													currentSubAc = item.SubAc || "";
													opening =
														subAccountTotals[currentSubAc]
															?.openingBalance || 0;
													running = opening;
												}
												running += dr - cr;

												const isLastInSubAc =
													i === data.length - 1 ||
													data[i + 1].SubAc !== currentSubAc;

												rows.push(
													<React.Fragment key={i}>
														{isNewSubAc && (
															<tr className="bg-gray-100 font-bold text-xs">
																<td
																	colSpan={7}
																	className="px-2 py-1"
																>
																	Sub Account: {item.AcName1} |
																	Opening Balance:{" "}
																	{formatNumber(opening)}
																</td>
															</tr>
														)}
														<tr
															className={
																i % 2
																	? "bg-white"
																	: "bg-gray-50"
															}
														>
															<td className="px-2 py-1 text-left truncate">
																{item.DocPf}
																{item.DocNo}
															</td>
															<td className="px-2 py-1 text-left break-words">
																{item.Remarks}
															</td>
															<td className="px-2 py-1 text-center">
																{item.AcctDt
																	? new Date(
																			item.AcctDt
																	  ).toLocaleDateString()
																	: ""}
															</td>
															<td className="px-2 py-1 text-left truncate">
																{item.Ref1}{" "}
																{item.ChqNo &&
																	`/ Chq: ${item.ChqNo}`}
															</td>
															<td className="px-2 py-1 text-right font-mono">
																{formatNumber(dr)}
															</td>
															<td className="px-2 py-1 text-right font-mono">
																{formatNumber(cr)}
															</td>
															<td className="px-2 py-1 text-right font-mono">
																{formatNumber(running)}
															</td>
														</tr>
														{isLastInSubAc && (
															<>
																<tr className="bg-yellow-50 font-bold text-xs">
																	<td
																		colSpan={4}
																		className="px-2 py-1 text-right"
																	>
																		Sub Account Total -{" "}
																		{currentSubAc}:
																	</td>
																	<td className="px-2 py-1 text-right font-mono">
																		{formatNumber(
																			subAccountTotals[
																				currentSubAc
																			]?.dr || 0
																		)}
																	</td>
																	<td className="px-2 py-1 text-right font-mono">
																		{formatNumber(
																			subAccountTotals[
																				currentSubAc
																			]?.cr || 0
																		)}
																	</td>
																	<td className="px-2 py-1 text-right font-mono">
																		{formatNumber(running)}
																	</td>
																</tr>
																<tr className="bg-yellow-100 font-bold text-xs">
																	<td
																		colSpan={7}
																		className="px-2 py-1 text-left"
																	>
																		Closing Balance -{" "}
																		{currentSubAc}:
																		{formatNumber(running)}
																	</td>
																</tr>
															</>
														)}
													</React.Fragment>
												);
											});
											return rows;
										})()}
									</tbody>
								</table>
							</div>

							<div className="mt-4 grid grid-cols-1 md:grid-cols-2 text-sm font-bold">
								<div>
									<p>
										Net Movement:{" "}
										{formatNumber(
											Object.values(subAccountTotals).reduce(
												(s, t) => s + t.dr,
												0
											) -
												Object.values(subAccountTotals).reduce(
													(s, t) => s + t.cr,
													0
												)
										)}
									</p>
								</div>
								<div className="text-right">
									<p>
										Closing Balance for Sub Account:{" "}
										{formatNumber(data[0].ClosingBalance)}
									</p>
								</div>
							</div>
						</div>
					</div>

					<iframe ref={iframeRef} className="hidden" title="print-frame" />
				</div>
			)}

			{/* Print Orientation Modal */}
			{showOrientationModal && (
				<div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
					<div className="bg-white rounded-lg p-6 w-full max-w-sm">
						<h3 className="text-lg font-semibold mb-4">
							Select Print Orientation
						</h3>
						<div className="flex gap-3 mb-4">
							<button
								onClick={() => {
									printPDF("portrait");
									setShowOrientationModal(false);
								}}
								className="flex-1 px-4 py-2 bg-[#7A0000] text-white rounded hover:bg-[#A52A2A]"
							>
								Portrait
							</button>
							<button
								onClick={() => {
									printPDF("landscape");
									setShowOrientationModal(false);
								}}
								className="flex-1 px-4 py-2 bg-[#7A0000] text-white rounded hover:bg-[#A52A2A]"
							>
								Landscape
							</button>
						</div>
						<button
							onClick={() => setShowOrientationModal(false)}
							className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default LedgerCardReport;
