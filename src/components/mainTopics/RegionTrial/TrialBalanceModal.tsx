import React, {JSX, useRef} from "react";
import {FaDownload, FaPrint} from "react-icons/fa";
import {ChevronLeft} from "lucide-react";

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

interface TrialData {
	companyId: string;
	year: number;
	month: string;
	regionName: string;
}

interface TrialBalanceModalProps {
	trialModalOpen: boolean;
	closeTrialModal: () => void;
	trialData: TrialData;
	trialBalanceData: TrialBalanceData[];
	trialLoading: boolean;
	trialError: string | null;
	maroon: string;
	maroonBg: string;
	formatNumber: (num: number) => string;
	getCategory: (accountCode: string) => string;
	downloadAsCSV: () => void;
	printPDF: () => void;
	goBack: () => void;
}

const TrialBalanceModal: React.FC<TrialBalanceModalProps> = ({
	trialModalOpen,
	closeTrialModal,
	trialData,
	trialBalanceData,
	trialLoading,
	trialError,
	maroon,
	maroonBg,
	formatNumber,
	getCategory,
	downloadAsCSV,
	printPDF,
	goBack,
}) => {
	const printRef = useRef<HTMLDivElement>(null);

	if (!trialModalOpen) return null;

	const formatOrZero = (num: number | undefined): string => {
		if (num === undefined || num === null || isNaN(num) || num === 0)
			return "0.00";
		return formatNumber(num);
	};

	const uniqueCostCenters = [
		...new Set(trialBalanceData.map((row) => row.CostCenter)),
	].sort((a, b) => parseFloat(a) - parseFloat(b));

	const companyHeaders = uniqueCostCenters.map((cc) => `${cc || "-"}`);

	const accountsMap = new Map<
		string,
		{name: string; titleFlag: string; values: Map<string, number>}
	>();

	trialBalanceData.forEach((row) => {
		if (!accountsMap.has(row.AccountCode)) {
			accountsMap.set(row.AccountCode, {
				name: row.AccountName,
				titleFlag: row.TitleFlag,
				values: new Map(),
			});
		}
		accountsMap
			.get(row.AccountCode)!
			.values.set(row.CostCenter, row.ClosingBalance);
	});

	const sortedAccounts = Array.from(accountsMap.keys()).sort((a, b) =>
		a.localeCompare(b, undefined, {numeric: true})
	);

	return (
		<div className="fixed inset-0 bg-white flex items-start justify-end z-50 pt-24 pb-8 pl-64">
			<div
				className="bg-white w-full max-w-6xl rounded-lg shadow-lg border border-gray-300 max-h-[85vh] flex flex-col mr-4"
				ref={printRef}
			>
				{/* Header */}
				<div className="p-5 border-b no-print">
					<div className="space-y-1">
						<h2 className="text-base font-bold text-gray-800">
							Region Wise Trial Balance - {trialData.month}/
							{trialData.year}
						</h2>
						<h3 className={`text-sm ${maroon}`}>
							Region: {trialData.regionName} ({trialData.companyId})
						</h3>
					</div>
					{trialError && (
						<div className="text-red-600 text-xs mt-2 text-center">
							{trialError.includes("JSON.parse")
								? "Data format error"
								: trialError}
						</div>
					)}
				</div>

				{/* Main Content */}
				<div className="px-6 py-5 overflow-y-auto flex-grow print:overflow-visible">
					{trialLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mr-3"></div>
							<span className={`${maroon} text-sm`}>Loading...</span>
						</div>
					) : trialBalanceData.length === 0 ? (
						<div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded text-sm text-center">
							No data found
						</div>
					) : (
						<div>
							{/* Buttons */}
							<div className="flex justify-between items-center mb-2">
								<div></div>
								<div className="flex gap-2">
									<button
										onClick={downloadAsCSV}
										className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
									>
										<FaDownload className="w-3 h-3" /> CSV
									</button>
									<button
										onClick={printPDF}
										className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
									>
										<FaPrint className="w-3 h-3" /> PDF
									</button>
									<button
										onClick={goBack}
										className="flex items-center gap-2 px-4 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700"
									>
										<ChevronLeft className="w-4 h-4" /> Back to Date
										Selection
									</button>
									<button
										onClick={closeTrialModal}
										className={`px-4 py-1.5 text-sm ${maroonBg} text-white rounded hover:brightness-110`}
									>
										Back To Home
									</button>
								</div>
							</div>

							{/* Table */}
							<div className="w-full overflow-x-auto text-xs">
								<table className="w-full border-collapse">
									<thead>
										<tr className="bg-gradient-to-r from-[#7A0000] to-[#A52A2A] text-white">
											<th className="px-4 py-3 text-left font-medium">
												Account
											</th>
											<th className="px-4 py-3 text-left font-medium">
												Description
											</th>
											{companyHeaders.map((header, i) => (
												<th
													key={i}
													className="px-4 py-3 text-right font-medium"
												>
													{header}
												</th>
											))}
											<th className="px-4 py-3 text-right font-bold">
												Total of Company
											</th>
										</tr>
									</thead>
									<tbody className="text-gray-800">
										{sortedAccounts.map((code, idx) => {
											const acc = accountsMap.get(code)!;
											const category = getCategory(code);

											let rows: JSX.Element[] = [];

											// Category Header
											if (
												idx === 0 ||
												getCategory(sortedAccounts[idx - 1]) !==
													category
											) {
												rows.push(
													<tr key={`header-${category}`}>
														<td
															colSpan={companyHeaders.length + 3}
															className="bg-gray-200 text-[#7A0000] text-left px-6 py-3 text-sm font-bold border-t-2 border-b-2 border-[#7A0000]"
														>
															{category.toUpperCase()}
														</td>
													</tr>
												);
											}

											// Account Row
											let rowTotal = 0;
											const cells = uniqueCostCenters.map(
												(cc) => {
													const val = acc.values.get(cc) || 0;
													rowTotal += val;
													return (
														<td
															key={cc}
															className="px-4 py-2 text-right font-mono"
														>
															{formatOrZero(val)}
														</td>
													);
												}
											);

											rows.push(
												<tr
													key={code}
													className="border-b hover:bg-gray-50"
												>
													<td className="px-4 py-2 font-mono">
														{code}
													</td>
													<td className="px-4 py-2">
														{acc.name.trim()}
													</td>
													{cells}
													<td className="px-4 py-2 text-right font-bold font-mono">
														{formatOrZero(rowTotal)}
													</td>
												</tr>
											);

											// End of category total
											const isLastInCategory =
												idx === sortedAccounts.length - 1 ||
												getCategory(sortedAccounts[idx + 1]) !==
													category;

											if (isLastInCategory) {
												const categoryTotals =
													uniqueCostCenters.map((cc) =>
														sortedAccounts
															.filter(
																(c) =>
																	getCategory(c) === category
															)
															.reduce(
																(sum, c) =>
																	sum +
																	(accountsMap
																		.get(c)!
																		.values.get(cc) || 0),
																0
															)
													);
												const categoryGrandTotal =
													categoryTotals.reduce(
														(a, b) => a + b,
														0
													);

												rows.push(
													<tr
														key={`total-final-${category}`}
														className="bg-gray-200 font-bold"
													>
														<td
															colSpan={2}
															className="px-4 py-3 text-left"
														>
															TOTAL {category.toUpperCase()}
														</td>
														{categoryTotals.map((sum, i) => (
															<td
																key={i}
																className="px-4 py-3 text-right font-mono"
															>
																{formatOrZero(sum)}
															</td>
														))}
														<td className="px-4 py-3 text-right font-bold font-mono">
															{formatOrZero(categoryGrandTotal)}
														</td>
													</tr>
												);
												rows.push(
													<tr key={`gap-${category}`}>
														<td
															colSpan={companyHeaders.length + 3}
															className="h-4"
														></td>
													</tr>
												);
											}

											return rows;
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TrialBalanceModal;
