import React, {useEffect, useState} from "react";
import {FaSearch, FaSyncAlt, FaEye, FaChevronDown} from "react-icons/fa";
import {TrialBalanceModal} from "../../components/mainTopics/RegionTrial/test-import";
import {useUser} from "../../contexts/UserContext";

interface Region {
	compId: string;
	CompName: string;
}

interface TrialBalanceData {
	AccountCode: string;
	AccountName: string;
	TitleFlag: string;
	CostCenter: string;
	CompanyName: string;
	DepartmentId: string;
	OpeningBalance: number;
	DebitAmount: number;
	CreditAmount: number;
	ClosingBalance: number;
}

const RegionTrial: React.FC = () => {
	// Get user from context
	const {user} = useUser();

	// Main state
	const [data, setData] = useState<Region[]>([]);
	const [searchId, setSearchId] = useState("");
	const [searchName, setSearchName] = useState("");
	const [filtered, setFiltered] = useState<Region[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 50;

	// Selection state
	const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

	// Date selection state - changed to undefined initially
	const [selectedYear, setSelectedYear] = useState<number | undefined>(
		undefined
	);
	const [selectedMonth, setSelectedMonth] = useState<number | undefined>(
		undefined
	);

	// Dropdown state
	const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
	const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

	// Trial balance modal state
	const [trialModalOpen, setTrialModalOpen] = useState(false);
	const [trialData, setTrialData] = useState({
		companyId: "",
		year: 0,
		month: "",
		regionName: "",
	});

	// Trial balance table state
	const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData[]>(
		[]
	);
	const [trialLoading, setTrialLoading] = useState(false);
	const [trialError, setTrialError] = useState<string | null>(null);

	// Get EPF Number from user context (Userno field)
	const epfNo = user?.Userno || "";

	// Colors
	const maroon = "text-[#7A0000]";
	const maroonBg = "bg-[#7A0000]";
	const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

	// Available years and months
	const years = Array.from(
		{length: 21},
		(_, i) => new Date().getFullYear() - i
	);
	const months = Array.from({length: 13}, (_, i) => i + 1); // [1, 2, ..., 13] - Includes 13th period

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (
				!target.closest(".year-dropdown") &&
				!target.closest(".month-dropdown")
			) {
				setYearDropdownOpen(false);
				setMonthDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Fetch regions
	useEffect(() => {
		const fetchData = async () => {
			if (!epfNo) {
				setError("No EPF number available. Please login again.");
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const res = await fetch(
					`/misapi/api/incomeexpenditure/Usercompanies/${epfNo}/70`
				);
				if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

				const txt = await res.text();
				const parsed = JSON.parse(txt);
				const rawData = Array.isArray(parsed) ? parsed : parsed.data || [];
				const final: Region[] = rawData.map((item: any) => ({
					compId: item.CompId,
					CompName: item.CompName,
				}));
				setData(final);
				setFiltered(final);
			} catch (e: any) {
				setError(e.message);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [epfNo]);

	// Filter regions
	useEffect(() => {
		const f = data.filter(
			(c) =>
				(!searchId ||
					c.compId.toLowerCase().includes(searchId.toLowerCase())) &&
				(!searchName ||
					c.CompName.toLowerCase().includes(searchName.toLowerCase()))
		);
		setFiltered(f);
		setPage(1);
	}, [searchId, searchName, data]);

	const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

	// Handle region selection - Auto fetch data when selected
	const handleRegionSelect = (region: Region) => {
		console.log("Region selected:", region);
		setSelectedRegion(region);
		if (selectedMonth && selectedYear) {
			fetchTrialBalanceData(region);
		}
	};

	// Fetch trial balance data
	const fetchTrialBalanceData = async (region?: Region) => {
		const targetRegion = region || selectedRegion;
		if (!targetRegion || !selectedMonth || !selectedYear) return;

		setTrialLoading(true);
		setTrialError(null);
		try {
			const monthNum = selectedMonth;
			const apiUrl = `/misapi/api/regionwisetrial?companyId=${targetRegion.compId}&month=${monthNum}&year=${selectedYear}`;
			const response = await fetch(apiUrl, {
				credentials: "include",
				headers: {Accept: "application/json"},
			});

			if (!response.ok)
				throw new Error(`HTTP error! status: ${response.status}`);

			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				const text = await response.text();
				throw new Error(
					`Expected JSON but got ${contentType}. Response: ${text.substring(
						0,
						100
					)}`
				);
			}

			const jsonData = await response.json();
			let trialBalanceArray: TrialBalanceData[] = [];

			if (Array.isArray(jsonData)) {
				trialBalanceArray = jsonData;
			} else if (jsonData.data && Array.isArray(jsonData.data)) {
				trialBalanceArray = jsonData.data;
			} else if (jsonData.result && Array.isArray(jsonData.result)) {
				trialBalanceArray = jsonData.result;
			} else {
				throw new Error("Unexpected data format received from server");
			}

			setTrialBalanceData(trialBalanceArray);

			setTrialData({
				companyId: targetRegion.compId,
				year: selectedYear,
				month: getMonthName(selectedMonth),
				regionName: targetRegion.CompName,
			});

			setTrialModalOpen(true);
		} catch (error: any) {
			setTrialError(
				error.message.includes("JSON.parse")
					? "Invalid data format received from server"
					: error.message
			);
		} finally {
			setTrialLoading(false);
		}
	};

	// Helper functions
	const getMonthName = (monthNum: number | undefined): string => {
		if (!monthNum) return "Select Month";
		const monthNames = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
			"13th Period",
		];
		return monthNames[monthNum - 1] || "Select Month";
	};

	const clearFilters = () => {
		setSearchId("");
		setSearchName("");
	};

	const closeTrialModal = () => {
		setTrialModalOpen(false);
		setTrialBalanceData([]);
		setSelectedRegion(null);
	};

	const formatNumber = (num: number): string => {
		if (num === undefined || num === null || isNaN(num)) return "-";
		const numValue = typeof num === "string" ? parseFloat(num) : num;
		if (numValue === 0) return "-";
		const absValue = Math.abs(numValue);
		const formatted = new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(absValue);
		return numValue < 0 ? `(${formatted})` : formatted;
	};

	const getCategory = (accountCode: string): string => {
		const firstChar = accountCode.charAt(0).toUpperCase();
		switch (firstChar) {
			case "A":
				return "Assets";
			case "E":
				return "Expenditure";
			case "L":
				return "Liabilities";
			case "R":
				return "Revenue";
			default:
				return "Other";
		}
	};

	const calculateTotals = () => {
		const categories = ["A", "E", "L", "R"];
		const categoryTotals: Record<
			string,
			{
				opening: number;
				debit: number;
				credit: number;
				closing: number;
				count: number;
			}
		> = {};
		categories.forEach((cat) => {
			categoryTotals[cat] = {
				opening: 0,
				debit: 0,
				credit: 0,
				closing: 0,
				count: 0,
			};
		});

		trialBalanceData.forEach((row) => {
			const firstChar = row.AccountCode.charAt(0).toUpperCase();
			if (categories.includes(firstChar)) {
				categoryTotals[firstChar].opening += row.OpeningBalance || 0;
				categoryTotals[firstChar].debit += row.DebitAmount || 0;
				categoryTotals[firstChar].credit += row.CreditAmount || 0;
				categoryTotals[firstChar].closing += row.ClosingBalance || 0;
				categoryTotals[firstChar].count += 1;
			}
		});

		const grandTotals = {
			opening: Object.values(categoryTotals).reduce(
				(sum, cat) => sum + cat.opening,
				0
			),
			debit: Object.values(categoryTotals).reduce(
				(sum, cat) => sum + cat.debit,
				0
			),
			credit: Object.values(categoryTotals).reduce(
				(sum, cat) => sum + cat.credit,
				0
			),
			closing: Object.values(categoryTotals).reduce(
				(sum, cat) => sum + cat.closing,
				0
			),
			count: trialBalanceData.length,
		};

		return {categoryTotals, grandTotals};
	};

	// Custom Dropdown Components
	const YearDropdown = () => (
		<div className="year-dropdown relative">
			<label className="block text-xs font-medium text-gray-700 mb-1">
				Year
			</label>
			<button
				type="button"
				onClick={() => {
					setYearDropdownOpen(!yearDropdownOpen);
					setMonthDropdownOpen(false);
				}}
				className="w-full flex justify-between items-center px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-[#7A0000]"
			>
				<span>{selectedYear || "Select Year"}</span>
				<FaChevronDown
					className={`w-3 h-3 text-gray-400 transition-transform ${
						yearDropdownOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{yearDropdownOpen && (
				<div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
					{years.map((year) => (
						<button
							key={year}
							type="button"
							onClick={() => {
								setSelectedYear(year);
								setYearDropdownOpen(false);
								if (selectedMonth && selectedRegion) {
									fetchTrialBalanceData();
								}
							}}
							className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
								selectedYear === year
									? "bg-[#7A0000] text-white"
									: "text-gray-700"
							}`}
						>
							{year}
						</button>
					))}
				</div>
			)}
		</div>
	);

	const MonthDropdown = () => (
		<div className="month-dropdown relative">
			<label className="block text-xs font-medium text-gray-700 mb-1">
				Month
			</label>
			<button
				type="button"
				onClick={() => {
					setMonthDropdownOpen(!monthDropdownOpen);
					setYearDropdownOpen(false);
				}}
				className="w-full flex justify-between items-center px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-[#7A0000]"
			>
				<span>{getMonthName(selectedMonth)}</span>
				<FaChevronDown
					className={`w-3 h-3 text-gray-400 transition-transform ${
						monthDropdownOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{monthDropdownOpen && (
				<div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
					{months.map((month) => (
						<button
							key={month}
							type="button"
							onClick={() => {
								setSelectedMonth(month);
								setMonthDropdownOpen(false);
								if (selectedYear && selectedRegion) {
									fetchTrialBalanceData();
								}
							}}
							className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
								selectedMonth === month
									? "bg-[#7A0000] text-white"
									: "text-gray-700"
							}`}
						>
							{getMonthName(month)}
						</button>
					))}
				</div>
			)}
		</div>
	);

	// UPDATED CSV FUNCTION to match CompletedCostCenterWise style
	const downloadAsCSV = () => {
		if (!trialBalanceData || trialBalanceData.length === 0) return;

		const {categoryTotals, grandTotals} = calculateTotals();

		const formatNum = (num: number) => {
			if (num === undefined || num === null || isNaN(num)) return "0.00";
			if (num === 0) return "0.00";
			return num.toFixed(2);
		};

		const escape = (field: string | number): string => {
			const str = String(field || "");
			if (str.includes(",") || str.includes('"') || str.includes("\n")) {
				return '"' + str.replace(/"/g, '""') + '"';
			}
			return str;
		};

		const sortedData = [...trialBalanceData].sort((a, b) => {
			const categoryOrder: {[key: string]: number} = {
				A: 1,
				E: 2,
				L: 3,
				R: 4,
			};
			const aCat = a.AccountCode.charAt(0).toUpperCase();
			const bCat = b.AccountCode.charAt(0).toUpperCase();
			return (categoryOrder[aCat] || 5) - (categoryOrder[bCat] || 5);
		});

		const csvRows = [
			[`Region Wise Trial Balance - ${trialData.month}/${trialData.year}`],
			[`Region: ${trialData.companyId} / ${trialData.regionName}`],
			[`Generated: ${new Date().toLocaleString()}`],
			[],
			[
				"Account Code",
				"Account Name",
				"Title Flag",
				"Cost Center",
				"Company Name",
				"Cost Center Code",
				"Opening Balance",
				"Debit Amount",
				"Credit Amount",
				"Closing Balance",
			],
		];

		let currentCategory = "";
		sortedData.forEach((row, index) => {
			const rowCategory = getCategory(row.AccountCode);
			const categoryKey = row.AccountCode.charAt(0).toUpperCase();

			if (rowCategory !== currentCategory) {
				currentCategory = rowCategory;
				csvRows.push([]);
				csvRows.push([rowCategory.toUpperCase()]);
			}

			csvRows.push([
				row.AccountCode.trim(),
				escape(row.AccountName.trim()),
				row.TitleFlag,
				row.CostCenter,
				escape(row.CompanyName.trim()),
				row.DepartmentId,
				formatNum(row.OpeningBalance),
				formatNum(row.DebitAmount),
				formatNum(row.CreditAmount),
				formatNum(row.ClosingBalance),
			]);

			const nextIndex = index + 1;
			const isLastInCategory =
				nextIndex >= sortedData.length ||
				getCategory(sortedData[nextIndex].AccountCode) !== currentCategory;

			if (isLastInCategory && categoryTotals[categoryKey]) {
				csvRows.push([]);
				csvRows.push([
					`TOTAL ${rowCategory.toUpperCase()}`,
					"",
					"",
					"",
					"",
					"",
					formatNum(categoryTotals[categoryKey].opening),
					formatNum(categoryTotals[categoryKey].debit),
					formatNum(categoryTotals[categoryKey].credit),
					formatNum(categoryTotals[categoryKey].closing),
				]);
			}
		});

		csvRows.push([]);
		csvRows.push([]);
		csvRows.push([
			"GRAND TOTAL",
			"",
			"",
			"",
			"",
			"",
			formatNum(grandTotals.opening),
			formatNum(grandTotals.debit),
			formatNum(grandTotals.credit),
			formatNum(grandTotals.closing),
		]);

		csvRows.push([]);
		csvRows.push(["SUMMARY"]);
		csvRows.push(["Total Opening Balance", formatNum(grandTotals.opening)]);
		csvRows.push(["Total Debit Amount", formatNum(grandTotals.debit)]);
		csvRows.push(["Total Credit Amount", formatNum(grandTotals.credit)]);
		csvRows.push(["Total Closing Balance", formatNum(grandTotals.closing)]);

		csvRows.push([]);
		csvRows.push([`CEB@${new Date().getFullYear()}`]);

		const csvContent = csvRows.map((row) => row.join(",")).join("\n");
		const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `RegionTrialBalance_${trialData.regionName}_${trialData.month}_${trialData.year}.csv`;
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const printPDF = () => {
		if (!trialBalanceData || trialBalanceData.length === 0) return;

		const {categoryTotals, grandTotals} = calculateTotals();

		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		let tableRowsHTML = "";
		trialBalanceData.forEach((row, index) => {
			const currentCategory = getCategory(row.AccountCode);
			const prevCategory =
				index > 0
					? getCategory(trialBalanceData[index - 1].AccountCode)
					: null;
			const showCategoryHeader = currentCategory !== prevCategory;
			const nextCategory =
				index < trialBalanceData.length - 1
					? getCategory(trialBalanceData[index + 1].AccountCode)
					: null;
			const showCategoryTotal = currentCategory !== nextCategory;

			if (showCategoryHeader) {
				tableRowsHTML += `
          <tr class="category-header">
            <td colspan="10" style="text-align: center; font-weight: bold; background-color: #f5f5f5; color: #7A0000;">${currentCategory}</td>
          </tr>
        `;
			}

			tableRowsHTML += `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.AccountCode.trim()}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.AccountName.trim()}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${
					row.TitleFlag
				}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${
					row.CostCenter
				}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${row.CompanyName.trim()}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${
					row.DepartmentId
				}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(
					row.OpeningBalance
				)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(
					row.DebitAmount
				)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(
					row.CreditAmount
				)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">${formatNumber(
					row.ClosingBalance
				)}</td>
        </tr>
      `;

			if (showCategoryTotal) {
				const categoryKey = row.AccountCode.charAt(0).toUpperCase();
				tableRowsHTML += `
          <tr class="category-total">
            <td colspan="6" style="padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Total ${currentCategory}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(
					categoryTotals[categoryKey].opening
				)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(
					categoryTotals[categoryKey].debit
				)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(
					categoryTotals[categoryKey].credit
				)}</td>
            <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace; background-color: #f9f9f9; font-weight: bold;">${formatNumber(
					categoryTotals[categoryKey].closing
				)}</td>
          </tr>
        `;
			}
		});

		tableRowsHTML += `
      <tr style="background-color: #7A0000; color: white; font-weight: bold;">
        <td colspan="6" style="padding: 8px; border: 1px solid #7A0000;">Grand Total</td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">${formatNumber(
				grandTotals.opening
			)}</td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">${formatNumber(
				grandTotals.debit
			)}</td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">${formatNumber(
				grandTotals.credit
			)}</td>
        <td style="padding: 8px; border: 1px solid #7A0000; text-align: right; font-family: monospace;">${formatNumber(
				grandTotals.closing
			)}</td>
      </tr>
    `;

		const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Region Trial Balance - ${trialData.month}/${
			trialData.year
		}</title>
        <style>
          * { text-transform: none !important; }
          body {font-family: Arial, sans-serif;margin:20px;font-size:10px;color:#333;}
          .header {text-align:center;margin-bottom:30px;border-bottom:2px solid #7A0000;padding-bottom:15px;}
          .header h1 {color:#7A0000;font-size:18px;margin:0;font-weight:bold;text-transform:none;}
          .header h2 {color:#7A0000;font-size:14px;margin:5px 0;text-transform:none;}
          table {width:100%;border-collapse:collapse;margin-bottom:20px;}
          th {background:#7A0000;color:white;font-weight:bold;text-align:center;padding:8px;border:1px solid #7A0000;}
          @media print {
            body {margin:0;}
            .header {page-break-inside:avoid;}
            table {page-break-inside:auto;}
            tr {page-break-inside:avoid;}
            @page {
              @bottom-left {content:"Printed on: ${new Date().toLocaleString(
						"en-US",
						{timeZone: "Asia/Colombo"}
					)}";font-size:0.75rem;color:gray;}
              @bottom-right {content:"Page " counter(page) " of " counter(pages);font-size:0.75rem;color:gray;}
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Region Wise Trial Balance - ${trialData.month}/${
			trialData.year
		}</h1>
          <h2>Region: ${trialData.regionName}</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Title Flag</th>
              <th>Cost Center</th>
              <th>Company Name</th>
              <th>Cost Center Code</th>
              <th>Opening Balance</th>
              <th>Debit Amount</th>
              <th>Credit Amount</th>
              <th>Closing Balance</th>
            </tr>
          </thead>
          <tbody>${tableRowsHTML}</tbody>
        </table>
      </body>
      </html>
    `;

		printWindow.document.write(htmlContent);
		printWindow.document.close();
		printWindow.onload = () => {
			printWindow.print();
			printWindow.close();
		};
	};

	// Custom Region Table Component with integrated date selection
	const CustomRegionTable = () => (
		<>
			<div className="flex justify-between items-center mb-4">
				<div>
					<h2 className={`text-xl font-bold ${maroon} normal-case`}>
						Region Wise Trial Balance
					</h2>
				</div>
			</div>

			{/* Search and Date Selection Section */}
			<div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
				<div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
					{/* Search by Code */}
					<div>
						<label className="block text-xs font-medium text-gray-700 mb-1">
							Search by Code
						</label>
						<div className="relative">
							<FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
							<input
								type="text"
								value={searchId}
								placeholder="Code"
								onChange={(e) => setSearchId(e.target.value)}
								className="pl-7 pr-2 py-1.5 w-full rounded border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#7A0000] text-sm"
							/>
						</div>
					</div>

					{/* Search by Name */}
					<div>
						<label className="block text-xs font-medium text-gray-700 mb-1">
							Search by Name
						</label>
						<div className="relative">
							<FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
							<input
								type="text"
								value={searchName}
								placeholder="Name"
								onChange={(e) => setSearchName(e.target.value)}
								className="pl-7 pr-2 py-1.5 w-full rounded border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#7A0000] text-sm"
							/>
						</div>
					</div>

					{/* Year Dropdown */}
					<YearDropdown />

					{/* Month Dropdown */}
					<MonthDropdown />

					{/* Clear Filters Button */}
					<div>
						{(searchId || searchName) && (
							<button
								onClick={clearFilters}
								className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm w-full justify-center"
							>
								<FaSyncAlt className="w-3 h-3" /> Clear
							</button>
						)}
					</div>
				</div>

				{selectedRegion && (
					<div className="mt-2 text-xs text-gray-600">
						Selected:{" "}
						<span className="font-semibold">
							{selectedRegion.CompName}
						</span>{" "}
						({selectedRegion.compId})
					</div>
				)}
			</div>

			{loading && (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
					<p className="mt-2 text-gray-600">Loading regions...</p>
				</div>
			)}

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					Error: {error}
				</div>
			)}

			{!loading && !error && filtered.length === 0 && (
				<div className="text-gray-600 bg-gray-100 p-4 rounded">
					No regions found.
				</div>
			)}

			{!loading && !error && filtered.length > 0 && (
				<>
					<div className="overflow-x-auto rounded-lg border border-gray-200">
						<div className="max-h-[70vh] overflow-y-auto">
							<table className="w-full table-fixed text-left text-gray-700 text-sm">
								<thead
									className={`${maroonGrad} text-white sticky top-0`}
								>
									<tr>
										<th className="px-4 py-2 w-1/4">Region Code</th>
										<th className="px-4 py-2 w-1/2">Region Name</th>
										<th className="px-4 py-2 w-1/4 text-center">
											Action
										</th>
									</tr>
								</thead>
								<tbody>
									{paginated.map((region, i) => (
										<tr
											key={i}
											className={`${
												i % 2 ? "bg-white" : "bg-gray-50"
											} ${
												selectedRegion?.compId === region.compId
													? "ring-2 ring-[#7A0000] ring-inset"
													: ""
											}`}
										>
											<td className="px-4 py-2 truncate">
												{region.compId}
											</td>
											<td className="px-4 py-2 truncate">
												{region.CompName}
											</td>
											<td className="px-4 py-2 text-center">
												<button
													onClick={() =>
														handleRegionSelect(region)
													}
													disabled={
														!selectedMonth || !selectedYear
													}
													className={`px-3 py-1 ${
														selectedRegion?.compId ===
														region.compId
															? "bg-green-600 text-white"
															: maroonGrad + " text-white"
													} rounded text-xs font-medium hover:brightness-110 transition shadow disabled:opacity-50 disabled:cursor-not-allowed`}
												>
													<FaEye className="inline-block mr-1 w-3 h-3" />
													{selectedRegion?.compId === region.compId
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
		</>
	);

	return (
		<div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
			<CustomRegionTable />

			<TrialBalanceModal
				trialModalOpen={trialModalOpen}
				closeTrialModal={closeTrialModal}
				trialData={trialData}
				trialBalanceData={trialBalanceData}
				trialLoading={trialLoading}
				trialError={trialError}
				maroon={maroon}
				maroonBg={maroonBg}
				formatNumber={formatNumber}
				getCategory={getCategory}
				calculateTotals={calculateTotals}
				downloadAsCSV={downloadAsCSV}
				printPDF={printPDF}
				goBack={() => setTrialModalOpen(false)}
			/>
		</div>
	);
};

export default RegionTrial;
