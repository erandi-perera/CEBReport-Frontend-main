// File: ProvincePIV.tsx
import React, {useEffect, useState, useRef} from "react";
import {Search, RotateCcw, Eye, X, Download, Printer} from "lucide-react";
import {useUser} from "../../contexts/UserContext";
import {toast} from "react-toastify";

interface Company {
	compId: string;
	CompName: string;
}

interface PIVItem {
	CostCenter: string;
	CCT_NAME: string;
	PivNo: string;
	PivReceiptNo: string;
	PivDate: string | null;
	PaidDate: string | null;
	ChequeNo: string;
	GrandTotal: number;
	AccountCode: string;
	Amount: number;
	BankCheckNo: string;
	PaymentMode: string;
}

/* ────── CSV safe escape ────── */
const csvEscape = (val: string | number | null | undefined): string => {
	if (val == null) return '""';
	const str = String(val);
	if (/[,\n"']/.test(str)) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
};

const formatNumber = (num: number | null | undefined): string => {
	if (num === null || num === undefined || isNaN(num)) return "0.00";
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
};

const formatDate = (dateStr: string | null): string => {
	if (!dateStr) return "-";
	try {
		return new Date(dateStr).toLocaleDateString("en-GB");
	} catch {
		return dateStr;
	}
};

const ProvincePIV: React.FC = () => {
	const {user} = useUser();
	const epfNo = user?.Userno || "";
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const [companies, setCompanies] = useState<Company[]>([]);
	const [filtered, setFiltered] = useState<Company[]>([]);
	const [searchId, setSearchId] = useState("");
	const [searchName, setSearchName] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 50;

	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");

	const [reportData, setReportData] = useState<PIVItem[]>([]);
	const [reportLoading, setReportLoading] = useState(false);
	const [showReport, setShowReport] = useState(false);

	const maroon = "text-[#7A0000]";
	const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

	useEffect(() => {
		const fetchCompanies = async () => {
			if (!epfNo) {
				setError("No EPF number available.");
				setLoading(false);
				return;
			}
			setLoading(true);
			try {
				const res = await fetch(
					`/misapi/api/incomeexpenditure/Usercompanies/${epfNo}/60`
				);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const txt = await res.text();
				const parsed = JSON.parse(txt);
				const raw = Array.isArray(parsed) ? parsed : parsed.data || [];
				const comps: Company[] = raw.map((c: any) => ({
					compId: c.CompId,
					CompName: c.CompName,
				}));
				setCompanies(comps);
				setFiltered(comps);
			} catch (e: any) {
				setError(e.message);
				toast.error(e.message);
			} finally {
				setLoading(false);
			}
		};
		fetchCompanies();
	}, [epfNo]);

	useEffect(() => {
		const f = companies.filter(
			(c) =>
				(!searchId ||
					c.compId.toLowerCase().includes(searchId.toLowerCase())) &&
				(!searchName ||
					c.CompName.toLowerCase().includes(searchName.toLowerCase()))
		);
		setFiltered(f);
		setPage(1);
	}, [searchId, searchName, companies]);

	const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

	const handleViewReport = async (company: Company) => {
		if (!fromDate || !toDate) return toast.error("Select both dates");
		if (new Date(toDate) < new Date(fromDate))
			return toast.error("Invalid date range");

		setSelectedCompany(company);
		setReportLoading(true);
		setReportData([]);
		setShowReport(true);

		try {
			const url = `/misapi/api/provincepivbank/get?compId=${
				company.compId
			}&fromDate=${fromDate.replace(/-/g, "")}&toDate=${toDate.replace(
				/-/g,
				""
			)}`;
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			const items: PIVItem[] = Array.isArray(data) ? data : data.data || [];
			setReportData(items);
			items.length === 0
				? toast.warn("No records")
				: toast.success("Loaded");
		} catch (err: any) {
			toast.error("Failed: " + err.message);
		} finally {
			setReportLoading(false);
		}
	};

	const closeReport = () => {
		setShowReport(false);
		setReportData([]);
		setSelectedCompany(null);
	};

	const groupData = () => {
		const grouped: Record<string, Record<string, PIVItem[]>> = {};
		reportData.forEach((item) => {
			const cc = item.CostCenter || "Unknown";
			const acc = item.AccountCode || "Unknown";
			if (!grouped[cc]) grouped[cc] = {};
			if (!grouped[cc][acc]) grouped[cc][acc] = [];
			grouped[cc][acc].push(item);
		});
		return grouped;
	};

	const accountCodes = Array.from(
		new Set(reportData.map((i) => i.AccountCode))
	).sort();

	const calculateCCTotal = (cc: string) => {
		return reportData
			.filter((i) => i.CostCenter === cc)
			.reduce((sum, i) => sum + i.GrandTotal, 0);
	};

	const grandTotal = reportData.reduce((sum, i) => sum + i.GrandTotal, 0);

	const handleDownloadCSV = () => {
		if (reportData.length === 0) return;

		const grouped = groupData();

		const headers = [
			"Cost Center",
			"CC Name",
			"PIV No",
			"Receipt No",
			"PIV Date",
			"Paid Date",
			"Cheque No",
			"Bank Chq No",
			"Mode",
			...accountCodes,
			"Paid Amount",
		];

		const rows: string[] = [
			`Branch/Province wise PIV Collections Paid to Bank`,
			`Company: ${selectedCompany?.compId} - ${selectedCompany?.CompName}`,
			`Period: ${fromDate} to ${toDate}`,
			`Generated: ${new Date().toLocaleString()}`,
			"",
			headers.map(csvEscape).join(","),
		];

		Object.keys(grouped).forEach((cc) => {
			const ccName =
				reportData.find((i) => i.CostCenter === cc)?.CCT_NAME || cc;
			const ccItems = Object.values(grouped[cc]).flat();

			ccItems.forEach((item) => {
				const row = [
					csvEscape(item.CostCenter),
					csvEscape(ccName),
					csvEscape(item.PivNo),
					csvEscape(item.PivReceiptNo),
					csvEscape(formatDate(item.PivDate)),
					csvEscape(formatDate(item.PaidDate)),
					csvEscape(item.ChequeNo || ""),
					csvEscape(item.BankCheckNo || ""),
					csvEscape(item.PaymentMode),
				];
				accountCodes.forEach((acc) => {
					const match = grouped[cc][acc]?.find(
						(x) => x.PivNo === item.PivNo
					);
					row.push(csvEscape(match ? formatNumber(match.Amount) : "0.00"));
				});
				row.push(csvEscape(formatNumber(item.GrandTotal)));
				rows.push(row.join(","));
			});

			const totalRow = Array(headers.length).fill('""');
			totalRow[0] = csvEscape("TOTAL");
			totalRow[totalRow.length - 1] = csvEscape(
				formatNumber(calculateCCTotal(cc))
			);
			rows.push(totalRow.join(","));

			rows.push("");
		});

		const grandRow = Array(headers.length).fill('""');
		grandRow[0] = csvEscape("GRAND TOTAL");
		grandRow[grandRow.length - 1] = csvEscape(formatNumber(grandTotal));
		rows.push(grandRow.join(","));

		const blob = new Blob([rows.join("\n")], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `ProvincePIV_${selectedCompany?.compId}_${fromDate}_to_${toDate}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const printPDF = () => {
  if (reportData.length === 0 || !iframeRef.current || !selectedCompany) return;

  const grouped = groupData();
  const numAccCols = accountCodes.length;

  // Grand Total per Account Code
  const grandAccountTotals = accountCodes.reduce((acc, code) => {
    acc[code] = reportData
      .filter((i) => i.AccountCode === code)
      .reduce((sum, i) => sum + i.Amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const baseFontSize =
    numAccCols > 20 ? "4.2px" : numAccCols > 15 ? "4.5px" : numAccCols > 10 ? "4.8px" : "5.2px";

  let bodyHTML = "";

  Object.keys(grouped).forEach((cc, groupIndex) => {
    const ccName = reportData.find((i) => i.CostCenter === cc)?.CCT_NAME || cc;
    const ccItems = Object.values(grouped[cc]).flat();

    const ccAccountTotals = accountCodes.reduce((acc, code) => {
      acc[code] = reportData
        .filter((i) => i.CostCenter === cc && i.AccountCode === code)
        .reduce((s, i) => s + i.Amount, 0);
      return acc;
    }, {} as Record<string, number>);

    ccItems.forEach((item, idx) => {
      bodyHTML += `<tr class="${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}">
        ${idx === 0
          ? `<td rowspan="${ccItems.length}" class="border border-gray-300 p-1 text-2xs bg-gray-100 align-top font-medium" style="word-break: break-word; white-space: normal;">
               ${cc}<br/><small style="font-size:4.8px; color:#444;">${ccName}</small>
             </td>`
          : ""
        }
        <td class="border border-gray-300 p-1 text-2xs">${item.ChequeNo || "-"}</td>
        <td class="border border-gray-300 p-1 text-2xs text-center">${formatDate(item.PaidDate)}</td>
        <td class="border border-gray-300 p-1 text-right text-2xs font-bold">${formatNumber(item.GrandTotal)}</td>
        <td class="border border-gray-300 p-1 text-2xs">${item.PivNo}</td>
        <td class="border border-gray-300 p-1 text-2xs">${item.PaymentMode}</td>
        <td class="border border-gray-300 p-1 text-2xs">${item.PivReceiptNo}</td>
        ${accountCodes
          .map((acc) => {
            const match = grouped[cc][acc]?.find((x) => x.PivNo === item.PivNo);
            return `<td class="border border-gray-300 p-1 text-right text-2xs">${match ? formatNumber(match.Amount) : "0.00"}</td>`;
          })
          .join("")}
        <td class="border border-gray-300 p-1 text-right text-2xs font-bold">${formatNumber(item.GrandTotal)}</td>
      </tr>`;
    });

    // Cost Center Total Row (keeps borders)
    bodyHTML += `<tr class="bg-gray-200 font-bold">
      <td colspan="2" class="border border-gray-300 p-1 text-2xs"></td>
      <td colspan="5" class="border border-gray-300 p-1 text-right text-2xs">Total - ${ccName}</td>
      ${accountCodes
        .map((acc) => `<td class="border border-gray-300 p-1 text-right text-2xs font-bold">${formatNumber(ccAccountTotals[acc] || 0)}</td>`)
        .join("")}
      <td class="border border-gray-300 p-1 text-right text-2xs font-bold">${formatNumber(calculateCCTotal(cc))}</td>
    </tr>`;

    // Only add spacing row if not the last group
    if (groupIndex < Object.keys(grouped).length - 1) {
      bodyHTML += `<tr class="no-border-row">
        <td colspan="${7 + accountCodes.length + 1}" style="height: 14px; border: none !important; padding: 0; background: transparent;"></td>
      </tr>`;
    }
  });

  // Grand Total Row
  bodyHTML += `<tr class="bg-gray-300 font-bold">
    <td colspan="7" class="border border-gray-300 p-2 text-right text-xs">GRAND TOTAL</td>
    ${accountCodes
      .map((acc) => `<td class="border border-gray-300 p-2 text-right text-xs font-bold">${formatNumber(grandAccountTotals[acc] || 0)}</td>`)
      .join("")}
    <td class="border border-gray-300 p-2 text-right text-xs font-bold">${formatNumber(grandTotal)}</td>
  </tr>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  @media print {
    @page { margin: 10mm; size: landscape; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: ${baseFontSize}; line-height: 1.3; }
    .title { margin: 8px 0; text-align: center; font-weight: bold; color: #7A0000; font-size: 13px; }
    .info { margin: 4px 8px; font-size: 8px; display: flex; justify-content: space-between; color: #333; }
    
table {
  width: 100%;
  border-collapse: collapse !important;
}    
    th {
      background: #555 !important;
      color: white !important;
      font-weight: bold;
      font-size: 6.5px;
      text-align: center;
      padding: 5px 2px;
      border: 1px solid #ccc;
    }
    
    td {
      border: 1px solid #ccc;
      padding: 3px 4px;
      font-size: 5.2px;
      white-space: nowrap;
      overflow: hidden;
    }
    
    /* Only remove borders from spacing rows */
    .no-border-row td {
      border: none !important;
      padding: 0 !important;
      height: 14px !important;
    }
    
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    @page {
      @bottom-left { content: "Printed on: ${new Date().toLocaleString()}"; font-size: 7px; color: #666; }
      @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 7px; color: #666; }
    }
  }
</style>
</head>
<body>
  <div class="title">Branch/Province wise PIV Collections Paid to Bank</div>
  <div class="info">
    <div>
      <strong>Company:</strong> ${selectedCompany.compId} - ${
		selectedCompany.CompName
  }<br>
      <strong>Period:</strong> ${fromDate} to ${toDate}
    </div>
    <div style="text-align:right"><strong>Currency: LKR</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th width="11%">Cost Center</th>
        <th width="7%">Chq No</th>
        <th width="6%">Date</th>
        <th width="8%">Paid Amt</th>
        <th width="8%">PIV No</th>
        <th width="5%">Mode</th>
        <th width="8%">Receipt</th>
        ${accountCodes.map(() => `<th width="4.8%">Account</th>`).join("")}
        <th width="9%">Total</th>
      </tr>
    </thead>
    <tbody>${bodyHTML}</tbody>
  </table>
</body>
</html>`;

  const doc = iframeRef.current!.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => iframeRef.current?.contentWindow?.print(), 800);
	};	return (
		<div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
			<h2 className={`text-xl font-bold mb-4 ${maroon}`}>
				Branch/Province wise PIV Collections Paid to Bank
			</h2>

			{/* Date Pickers - Right Aligned */}
			<div className="flex justify-end gap-6 mb-4">
				<div className="flex items-center gap-2">
					<label className="text-xs font-bold text-[#7A0000]">
						From Date:
					</label>
					<input
						type="date"
						value={fromDate}
						onChange={(e) => setFromDate(e.target.value)}
						className="pl-3 pr-3 py-1.5 rounded-md border border-gray-300 bg-white
                 focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
					/>
				</div>
				<div className="flex items-center gap-2">
					<label className="text-xs font-bold text-[#7A0000]">
						To Date:
					</label>
					<input
						type="date"
						value={toDate}
						onChange={(e) => setToDate(e.target.value)}
						className="pl-3 pr-3 py-1.5 rounded-md border border-gray-300 bg-white
                 focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
					/>
				</div>
			</div>

			{/* Search Filters */}
			<div className="flex flex-wrap items-center gap-3 mb-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
					<input
						type="text"
						value={searchId}
						placeholder="Search by  ID"
						onChange={(e) => setSearchId(e.target.value)}
						className="pl-10 pr-4 py-1.5 w-48 rounded-md border border-gray-300 
                 focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
					/>
				</div>

				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
					<input
						type="text"
						value={searchName}
						placeholder="Search by Name"
						onChange={(e) => setSearchName(e.target.value)}
						className="pl-10 pr-4 py-1.5 w-48 rounded-md border border-gray-300 
                 focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
					/>
				</div>

				{/* Clear Button */}
				{(searchId || searchName) && (
					<button
						onClick={() => {
							setSearchId("");
							setSearchName("");
						}}
						className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 
                 border border-gray-300 rounded-md text-xs font-medium transition"
					>
						<RotateCcw className="w-3.5 h-3.5" />
						Clear
					</button>
				)}
			</div>

			{/* Loading & Error */}
			{loading && (
				<div className="text-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
					<p className="mt-2 text-gray-600 text-sm">
						Loading companies...
					</p>
				</div>
			)}

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					Error: {error}
				</div>
			)}

			{!loading && filtered.length > 0 && (
				<>
					<div className="overflow-x-auto rounded-lg border border-gray-200">
						<div className="max-h-[70vh] overflow-y-auto">
							<table className="w-full table-auto text-left text-sm">
								<thead className={`${maroonGrad} text-white`}>
									<tr>
										<th className="px-4 py-2">Company Code</th>
										<th className="px-4 py-2">Company Name</th>
										<th className="px-4 py-2 text-center">Action</th>
									</tr>
								</thead>
								<tbody>
									{paginated.map((c, i) => (
										<tr
											key={i}
											className={
												i % 2 === 0 ? "bg-white" : "bg-gray-50"
											}
										>
											<td className="px-4 py-2">{c.compId}</td>
											<td className="px-4 py-2">{c.CompName}</td>
											<td className="px-4 py-2 text-center">
												<button
													onClick={() => handleViewReport(c)}
													disabled={!fromDate || !toDate}
													className={`px-3 py-1 rounded text-white text-xs font-medium ${
														selectedCompany?.compId === c.compId
															? "bg-green-600"
															: maroonGrad
													} disabled:opacity-50 hover:brightness-110 transition`}
												>
													<Eye className="inline mr-1 w-3 h-3" />
													{selectedCompany?.compId === c.compId
														? "Viewing"
														: "View"}
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="flex justify-end items-center gap-3 mt-3">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
						>
							Previous
						</button>
						<span className="text-xs text-gray-500">
							Page {page} of {Math.ceil(filtered.length / pageSize)}
						</span>
						<button
							onClick={() =>
								setPage((p) =>
									Math.min(
										Math.ceil(filtered.length / pageSize),
										p + 1
									)
								)
							}
							disabled={page >= Math.ceil(filtered.length / pageSize)}
							className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
						>
							Next
						</button>
					</div>
				</>
			)}

			{/* Report Modal */}
			{showReport && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 print:static print:inset-auto print:p-0 print:bg-white">
					<div className="relative bg-white w-full max-w-[95vw] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mt-20 lg:ml-64 mx-auto print:w-full print:max-w-none print:rounded-none print:shadow-none print:border-none">
						<div className="p-4 max-h-[85vh] overflow-y-auto print:p-0 print:max-h-none print:overflow-visible">
							<div className="flex justify-end gap-3 mb-4 print:hidden">
								<button
									onClick={handleDownloadCSV}
									className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded hover:bg-blue-50 text-xs"
								>
									<Download className="w-4 h-4" /> CSV
								</button>
								<button
									onClick={printPDF}
									className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded hover:bg-green-50 text-xs"
								>
									<Printer className="w-4 h-4" /> Print
								</button>
								<button
									onClick={closeReport}
									className="flex items-center gap-1 px-3 py-1.5 border border-red-400 text-red-700 bg-white rounded hover:bg-red-50 text-xs"
								>
									<X className="w-4 h-4" /> Close
								</button>
							</div>

							<h2
								className={`text-xl font-bold text-center mb-2 ${maroon}`}
							>
								Branch/Province wise PIV Collections Paid to Bank{" "}
							</h2>
							<div className="flex justify-between text-sm mb-3">
								<div>
									<p>
										<strong>Company:</strong>{" "}
										{selectedCompany?.compId} -{" "}
										{selectedCompany?.CompName}
									</p>
									<p>
										<strong>Period:</strong> {fromDate} to {toDate}
									</p>
								</div>
								<div className="font-semibold text-gray-600">
									Currency: LKR
								</div>
							</div>

							{reportLoading ? (
								<div className="text-center py-20">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
									<p className="mt-2 text-gray-600">
										Loading report data...
									</p>
								</div>
							) : reportData.length === 0 ? (
								<div className="text-center py-20 text-gray-500 text-lg">
									No records found.
								</div>
							) : (
								<div className="overflow-x-auto border rounded-lg">
									<table className="w-full text-xs min-w-max table-auto">
										<thead className={`${maroonGrad} text-white`}>
											<tr>
												<th className="px-2 py-1.5">Cost Center</th>
												<th className="px-2 py-1.5">Cheque No</th>
												<th className="px-2 py-1.5">Paid Date</th>
												<th className="px-2 py-1.5 text-right font-bold">
													Paid Amount
												</th>
												<th className="px-2 py-1.5">PIV No</th>
												<th className="px-2 py-1.5">Mode</th>
												<th className="px-2 py-1.5">Piv Code</th>
												{accountCodes.map((acc) => (
													<th
														key={acc}
														className="px-2 py-1.5 text-right font-mono"
													>
														{acc}
													</th>
												))}
												<th className="px-2 py-1.5 text-right font-bold">
													Total
												</th>
											</tr>
										</thead>
										<tbody>
											{Object.keys(groupData()).map((cc) => {
												const ccName =
													reportData.find(
														(i) => i.CostCenter === cc
													)?.CCT_NAME || cc;
												const ccItems = Object.values(
													groupData()[cc]
												).flat();
												const ccAccountTotals = accountCodes.reduce(
													(acc, code) => {
														acc[code] = reportData
															.filter(
																(i) =>
																	i.CostCenter === cc &&
																	i.AccountCode === code
															)
															.reduce(
																(sum, i) => sum + i.Amount,
																0
															);
														return acc;
													},
													{} as Record<string, number>
												);
												const ccGrandTotal = calculateCCTotal(cc);

												return (
													<React.Fragment key={cc}>
														{ccItems.map((item, idx) => {
															const isFirst = idx === 0;
															return (
																<tr
																	key={item.PivNo}
																	className={
																		idx % 2 === 0
																			? "bg-white"
																			: "bg-gray-50"
																	}
																>
																	{isFirst && (
																		<>
																			<td
																				rowSpan={
																					ccItems.length
																				}
																				className="px-2 py-1 border border-gray-200 font-medium bg-gray-100 text-left align-top break-words"
																			>
																				{cc} - {ccName}
																			</td>
																		</>
																	)}
																	<td className="px-2 py-1 border border-gray-200">
																		{item.ChequeNo || "-"}
																	</td>
																	<td className="px-2 py-1 border border-gray-200 text-center">
																		{formatDate(
																			item.PaidDate
																		)}
																	</td>
																	<td className="px-2 py-1 border border-gray-200 text-right font-mono font-bold">
																		{formatNumber(
																			item.GrandTotal
																		)}
																	</td>
																	<td className="px-2 py-1 border border-gray-200">
																		{item.PivNo}
																	</td>
																	<td className="px-2 py-1 border border-gray-200">
																		{item.PaymentMode}
																	</td>
																	<td className="px-2 py-1 border border-gray-200">
																		{item.PivReceiptNo}
																	</td>
																	{accountCodes.map((acc) => {
																		const match = groupData()[
																			cc
																		][acc]?.find(
																			(x) =>
																				x.PivNo ===
																				item.PivNo
																		);
																		return (
																			<td
																				key={acc}
																				className="px-2 py-1 border border-gray-200 text-right font-mono"
																			>
																				{match
																					? formatNumber(
																							match.Amount
																					  )
																					: "0.00"}
																			</td>
																		);
																	})}
																	<td className="px-2 py-1 border border-gray-200 text-right font-mono font-bold">
																		{formatNumber(
																			item.GrandTotal
																		)}
																	</td>
																</tr>
															);
														})}
														<tr className="bg-gray-200 font-bold">
															<td
																colSpan={7}
																className="px-2 py-1 border border-gray-200 text-right"
															>
																Total - {ccName}
															</td>
															{accountCodes.map((acc) => (
																<td
																	key={acc}
																	className="px-2 py-1 border border-gray-200 text-right font-mono"
																>
																	{formatNumber(
																		ccAccountTotals[acc] || 0
																	)}
																</td>
															))}
															<td className="px-2 py-1 border border-gray-200 text-right font-mono">
																{formatNumber(ccGrandTotal)}
															</td>
														</tr>
														<tr>
															<td
																colSpan={
																	7 + accountCodes.length + 1
																}
																className="h-4"
															></td>
														</tr>
													</React.Fragment>
												);
											})}
											<tr className="bg-gray-200 font-bold">
												<td
													colSpan={7}
													className="px-2 py-2 border border-gray-200 text-right text-sm"
												>
													GRAND TOTAL
												</td>
												{accountCodes.map(() => (
													<td
														key={Math.random()}
														className="px-2 py-2 border border-gray-200"
													></td>
												))}
												<td className="px-2 py-2 border border-gray-200 text-right font-mono font-bold text-base">
													{formatNumber(grandTotal)}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
					<iframe ref={iframeRef} className="hidden" title="print-frame" />
				</div>
			)}
		</div>
	);
};

export default ProvincePIV;
