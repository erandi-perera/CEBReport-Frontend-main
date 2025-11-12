import React, {useState, useRef} from "react";
import {Eye, X, Download, Printer, RotateCcw} from "lucide-react";
import {toast} from "react-toastify";

interface SubAccountItem {
	GlCd: string;
	SubAc: string;
	OpBal: number | null;
	DrAmt: number | null;
	CrAmt: number | null;
	ClBal: number | null;
	AcName: string | null;
	GLOpeningBalance: number | null;
	GLClosingBalance: number | null;
	CctName: string | null;
}

/* ────── Number formatting – negative → (123.45) ────── */
const formatNumber = (num: number | string | null | undefined): string => {
	const n = num === null || num === undefined ? NaN : Number(num);
	if (isNaN(n)) return "0.00";

	const abs = Math.abs(n);
	const formatted = abs.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	return n < 0 ? `(${formatted})` : formatted;
};

/* ────── MAIN COMPONENT ────── */
const LedgerCardSubAccountTotal: React.FC = () => {
	const [ledgerCode, setLedgerCode] = useState("");
	const [year, setYear] = useState(new Date().getFullYear().toString());
	const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

	const [data, setData] = useState<SubAccountItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showReport, setShowReport] = useState(false);
	const [showOrientationModal, setShowOrientationModal] = useState(false);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const maroon = "text-[#7A0000]";
	const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

	const currentYear = new Date().getFullYear();
	const minYear = currentYear - 20;

	/* ────── FETCH ────── */
	const handleViewClick = async () => {
		if (!ledgerCode.trim()) return toast.error("Please enter Ledger Code.");
		if (!year || isNaN(+year))
			return toast.error("Please enter a valid year.");
		if (+month < 1 || +month > 12) return toast.error("Month must be 1-12.");

		setLoading(true);
		setError(null);
		setData([]);
		setShowReport(false);

		try {
			const resp = await fetch(
				`/misapi/api/ledgercardtotal/report/${encodeURIComponent(
					ledgerCode.trim()
				)}/${year}/${month}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					credentials: "include",
				}
			);

			if (!resp.ok) {
				const txt = await resp.text();
				throw new Error(`HTTP ${resp.status}: ${txt || "Unknown error"}`);
			}

			const json = await resp.json();
			const items: SubAccountItem[] = json.data || [];

			if (items.length === 0) {
				toast.warn("No records found.");
				return;
			}

			setData(items);
			setShowReport(true);
			toast.success("Data loaded.");
		} catch (e: any) {
			const msg = e.message.includes("Failed to fetch")
				? "Cannot connect to server."
				: e.message;
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	const clearFilters = () => {
		setLedgerCode("");
		setYear(new Date().getFullYear().toString());
		setMonth((new Date().getMonth() + 1).toString());
	};

	/* ────── PRINT ────── */
	const printPDF = (orientation: "portrait" | "landscape") => {
		if (data.length === 0 || !iframeRef.current) return;

		const first = data[0];
		const monthName = new Date(+year, +month - 1).toLocaleString("en", {
			month: "long",
		});

		const totalOp = data.reduce((s, x) => s + (x.OpBal ?? 0), 0);
		const totalDr = data.reduce((s, x) => s + (x.DrAmt ?? 0), 0);
		const totalCr = data.reduce((s, x) => s + (x.CrAmt ?? 0), 0);
		const totalCl = data.reduce((s, x) => s + (x.ClBal ?? 0), 0);

		let rows = "";
		data.forEach((it, i) => {
			rows += `
        <tr class="${i % 2 ? "bg-white" : "bg-gray-50"}">
          <td class="p-1 border border-gray-300 text-left text-xs">${
					it.SubAc
				}</td>
          <td class="p-1 border border-gray-300 text-right font-mono text-xs">${formatNumber(
					it.OpBal
				)}</td>
          <td class="p-1 border border-gray-300 text-right font-mono text-xs">${formatNumber(
					it.DrAmt
				)}</td>
          <td class="p-1 border border-gray-300 text-right font-mono text-xs">${formatNumber(
					it.CrAmt
				)}</td>
          <td class="p-1 border border-gray-300 text-right font-mono text-xs">${formatNumber(
					it.ClBal
				)}</td>
        </tr>`;
		});

		const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    @media print {
      @page { size: A4 ${orientation}; margin: 10mm 5mm 15mm 5mm; }
      body { margin:0; font-family:Arial,sans-serif; font-size:10px; }
      .title { margin:15px 10px 8px; text-align:center; font-weight:bold; color:#7A0000; font-size:14px; }
      .info  { margin:8px 10px; font-size:10px; display:flex; justify-content:space-between; }
      .info p { margin:2px 0; }
      .cur   { text-align:right; margin-right:3px; font-weight:600; color:#4B5563; font-size:10px; }
      table { border-collapse:collapse; width:100%; margin:0; table-layout:fixed; }
      th, td { border:1px solid #D1D5DB; padding:3px; font-size:9px; }
      th { background:linear-gradient(to right,#7A0000,#A52A2A); color:white; text-align:center; }
      .font-mono { font-family:monospace; }
      .total-row { background:#f9f9f9 !important; font-weight:bold; }
      @page {
        @bottom-left  { content:"Printed on: ${new Date().toLocaleString(
				"en-US",
				{timeZone: "Asia/Colombo"}
			)}"; font-size:8px; color:gray; }
        @bottom-right { content:"Page " counter(page) " of " counter(pages); font-size:8px; color:gray; }
      }
    }
  </style>
</head>
<body>
  <div class="title">Ledger Codes Sub Account Balances ${monthName} / ${year}</div>

  <div class="info">
    <div>
      <p><span style="font-weight:bold;">Cost Centre :</span> ${
			first.CctName || "N/A"
		}</p>
      <p><span style="font-weight:bold;">GL Code :</span> ${first.GlCd} - ${
			first.AcName || "N/A"
		}</p>
    </div>
    <div class="cur">Currency : LKR</div>
  </div>

  <!-- Opening & Closing Balance (above table) -->
  <div style="margin:8px 10px; display:flex; justify-content:space-between; font-size:10px;">
    <div><span style="font-weight:bold;">Opening Balance for 08/${year} :</span> ${formatNumber(
			first.GLOpeningBalance
		)}</div>
    <div><span style="font-weight:bold;">Closing Balance :</span> ${formatNumber(
			first.GLClosingBalance
		)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:35%">Sub Account</th>
        <th style="width:16.25%">Opening Balance</th>
        <th style="width:16.25%">Dr Amount</th>
        <th style="width:16.25%">Cr Amount</th>
        <th style="width:16.25%">Closing Balance</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td class="p-1 border border-gray-300"></td>
        <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
				totalOp
			)}</td>
        <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
				totalDr
			)}</td>
        <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
				totalCr
			)}</td>
        <td class="p-1 border border-gray-300 text-right font-mono">${formatNumber(
				totalCl
			)}</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top:30px;display:flex;justify-content:space-between;padding:0 20px;font-size:10px;">
    <div>Prepared By: ____________________</div>
    <div>Checked By: ____________________</div>
  </div>
</body>
</html>`;

		const doc = iframeRef.current?.contentDocument;
		if (doc) {
			doc.open();
			doc.write(html);
			doc.close();
			setTimeout(() => iframeRef.current?.contentWindow?.print(), 500);
		}
	};

	/* ────── CSV ────── */
	const handleDownloadCSV = () => {
		if (data.length === 0) return;

		const first = data[0];
		const monthName = new Date(+year, +month - 1).toLocaleString("en", {
			month: "long",
		});

		// ── Title block ─────────────────────────────────────
		const titleRows = [
			`Ledger Codes Sub Account Balances Report`,
			`GL Code: ${first.GlCd} - ${first.AcName || "N/A"}`,
			`Cost Centre: ${first.CctName || "N/A"}`,
			`Period: ${monthName} ${year}`,
			`"Opening Balance: ${formatNumber(first.GLOpeningBalance)}"`,
			`"Closing Balance: ${formatNumber(first.GLClosingBalance)}"`,
			`Currency: LKR`,
			"", // empty line
		];

		// ── Headers ───────────────────────────────────────────────────────────
		const headers = [
			"Sub Account",
			"Opening Balance",
			"Dr Amount",
			"Cr Amount",
			"Closing Balance",
		];

		// ── Data rows ─────────────────────────────────────────────────────────
		const rows = data.map((it) => [
			`"${it.SubAc}"`,
			`"${formatNumber(it.OpBal)}"`,
			`"${formatNumber(it.DrAmt)}"`,
			`"${formatNumber(it.CrAmt)}"`,
			`"${formatNumber(it.ClBal)}"`,
		]);

		// ── Totals ───────────────────────────────────────────────────────────
		const totalOp = data.reduce((s, x) => s + (x.OpBal ?? 0), 0);
		const totalDr = data.reduce((s, x) => s + (x.DrAmt ?? 0), 0);
		const totalCr = data.reduce((s, x) => s + (x.CrAmt ?? 0), 0);
		const totalCl = data.reduce((s, x) => s + (x.ClBal ?? 0), 0);

		const totalsRow = [
			"TOTAL",
			`"${formatNumber(totalOp)}"`,
			`"${formatNumber(totalDr)}"`,
			`"${formatNumber(totalCr)}"`,
			`"${formatNumber(totalCl)}"`,
		];

		// ── Build CSV ────────────────────────────────────────────────────────
		const csvContent = [
			...titleRows,
			headers.join(","),
			...rows.map((r) => r.join(",")),
			"", // blank line before totals
			totalsRow.join(","),
		].join("\n");

		const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `subaccount_balances_${ledgerCode}_${year}_${month}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	/* ────── RENDER ────── */
	return (
		<div className="max-w-[95%] mx-auto p-2 md:p-4 bg-white rounded-xl shadow border border-gray-200 text-sm md:text-base font-sans">
			<h2 className={`text-lg md:text-xl font-bold mb-4 ${maroon}`}>
				Ledger Codes Sub Account Balances
			</h2>

			{/* INPUTS */}
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
						placeholder="Enter Ledger Code"
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
						Month
					</label>
					<select
						value={month}
						onChange={(e) => setMonth(e.target.value)}
						className="w-full pl-3 pr-2 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7A0000] text-xs md:text-sm"
					>
						{Array.from({length: 12}, (_, i) => (
							<option key={i + 1} value={i + 1}>
								{i + 1} -{" "}
								{new Date(0, i).toLocaleString("en", {month: "long"})}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* BUTTONS */}
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

			{/* LOADING / ERROR */}
			{loading && (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
					<p className="mt-2 text-gray-600">Loading data...</p>
				</div>
			)}
			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					Error: {error}
				</div>
			)}

			{/* REPORT MODAL */}
			{showReport && data.length > 0 && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 print:static print:inset-auto print:p-0 print:bg-white">
					<div className="relative bg-white w-full max-w-[95vw] sm:max-w-4xl md:max-w-6xl lg:max-w-7xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden print:relative print:w-full print:max-w-none print:rounded-none print:shadow-none print:border-none print:overflow-visible print-container mt-20 ml-60">
						<div className="p-2 md:p-2 max-h-[80vh] overflow-y-auto print:p-0 print:max-h-none print:overflow-visible print:mt-10 print:ml-12">
							<div className="flex justify-end gap-3 mb-6 md:mb-8  print:hidden">
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

							{/* Title */}
							<h2
								className={`text-xl font-bold text-center mb-2 ${maroon}`}
							>
								Ledger Codes Sub Account Balances{" "}
								{new Date(+year, +month - 1).toLocaleString("en", {
									month: "long",
								})}{" "}
								/ {year}
							</h2>

							{/* Info */}
							<div className="flex justify-between text-sm mb-2">
								<div>
									<p>
										<span className="font-bold">Cost Centre :</span>{" "}
										{data[0].CctName}
									</p>
									<p>
										<span className="font-bold">GL Code :</span>{" "}
										{data[0].GlCd} - {data[0].AcName}
									</p>
								</div>
								<div className="font-semibold text-gray-600">
									Currency : LKR
								</div>
							</div>

							{/* Opening & Closing Balance (above table) */}
							<div className="flex justify-between text-sm mb-3 font-medium">
								<div>
									<span className="font-bold">
										Opening Balance for 08/{year} :
									</span>{" "}
									{formatNumber(data[0].GLOpeningBalance)}
								</div>
								<div>
									<span className="font-bold">Closing Balance :</span>{" "}
									{formatNumber(data[0].GLClosingBalance)}
								</div>
							</div>

							{/* Table */}
							<div className="overflow-x-auto border rounded-lg">
								<table className="w-full text-xs border-collapse table-fixed min-w-[800px]">
									<thead className={`${maroonGrad} text-white`}>
										<tr>
											<th className="px-2 py-1.5 w-[35%]">
												Sub Account
											</th>
											<th className="px-2 py-1.5 w-[16.25%]">
												Opening Balance
											</th>
											<th className="px-2 py-1.5 w-[16.25%]">
												Dr Amount
											</th>
											<th className="px-2 py-1.5 w-[16.25%]">
												Cr Amount
											</th>
											<th className="px-2 py-1.5 w-[16.25%]">
												Closing Balance
											</th>
										</tr>
									</thead>
									<tbody>
										{data.map((it, i) => (
											<tr
												key={i}
												className={
													i % 2 ? "bg-white" : "bg-gray-50"
												}
											>
												<td className="px-2 py-1 text-left">
													{it.SubAc}
												</td>
												<td className="px-2 py-1 text-right font-mono">
													{formatNumber(it.OpBal)}
												</td>
												<td className="px-2 py-1 text-right font-mono">
													{formatNumber(it.DrAmt)}
												</td>
												<td className="px-2 py-1 text-right font-mono">
													{formatNumber(it.CrAmt)}
												</td>
												<td className="px-2 py-1 text-right font-mono">
													{formatNumber(it.ClBal)}
												</td>
											</tr>
										))}
										{/* TOTAL ROW – clean gray background */}
										{(() => {
											const totalOp = data.reduce(
												(s, x) => s + (x.OpBal ?? 0),
												0
											);
											const totalDr = data.reduce(
												(s, x) => s + (x.DrAmt ?? 0),
												0
											);
											const totalCr = data.reduce(
												(s, x) => s + (x.CrAmt ?? 0),
												0
											);
											const totalCl = data.reduce(
												(s, x) => s + (x.ClBal ?? 0),
												0
											);
											return (
												<tr className="bg-gray-100 font-bold text-xs">
													<td></td>
													<td className="px-2 py-1 text-right border border-gray-300">
														{formatNumber(totalOp)}
													</td>
													<td className="px-2 py-1 text-right font-mono border border-gray-300">
														{formatNumber(totalDr)}
													</td>
													<td className="px-2 py-1 text-right font-mono border border-gray-300">
														{formatNumber(totalCr)}
													</td>
													<td className="px-2 py-1 text-right font-mono border border-gray-300">
														{formatNumber(totalCl)}
													</td>
												</tr>
											);
										})()}
									</tbody>
								</table>
							</div>
						</div>
					</div>

					<iframe ref={iframeRef} className="hidden" title="print-frame" />
				</div>
			)}

			{/* PRINT ORIENTATION MODAL */}
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

export default LedgerCardSubAccountTotal;
