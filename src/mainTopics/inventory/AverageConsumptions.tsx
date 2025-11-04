import React, {useEffect, useState, useRef} from "react";
import {Search, RotateCcw, Eye, X, Download, Printer} from "lucide-react";
import {useUser} from "../../contexts/UserContext";
import {toast} from "react-toastify";

interface Department {
	DeptId: string;
	DeptName: string;
}

interface Warehouse {
	WarehouseCode: string;
	CostCenterId?: string;
}

interface AverageConsumption {
	WarehouseCode: string;
	MaterialCode: string;
	MaterialName: string;
	GradeCode: string;
	UnitPrice: number;
	QuantityOnHand: number;
	TransactionQuantity: number;
	AverageConsumption: number;
	CostCenterName: string;
}

interface ApiDepartmentResponse {
	DeptId: string;
	DeptName: string;
}

interface ApiWarehouseResponse {
	WarehouseCode: string;
	CostCenterId?: string;
}

interface ApiInventoryResponse {
	WarehouseCode: string;
	MaterialCode: string;
	MaterialName: string;
	GradeCode: string;
	UnitPrice: number;
	QuantityOnHand: number;
	TransactionQuantity: number;
	AverageConsumption: number;
	CostCenterName: string;
}

const formatNumber = (num: number | string | null | undefined): string => {
	const n = num === null || num === undefined ? NaN : Number(num);
	if (isNaN(n)) return "0.00";
	return n.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

const AverageConsumption: React.FC = () => {
	const {user} = useUser();
	const [data, setData] = useState<Department[]>([]);
	const [searchId, setSearchId] = useState("");
	const [searchName, setSearchName] = useState("");
	const [filtered, setFiltered] = useState<Department[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [, setWarehouseError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [selectedDepartment, setSelectedDepartment] =
		useState<Department | null>(null);
	const [fromDate, setFromDate] = useState("");
	const [toDate, setToDate] = useState("");
	const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
	const [selectedWarehouse, setSelectedWarehouse] = useState("");
	const [inventoryData, setInventoryData] = useState<AverageConsumption[]>([]);
	const [inventoryLoading, setInventoryLoading] = useState(false);
	const [inventoryError, setInventoryError] = useState<string | null>(null);
	const [showInventoryModal, setShowInventoryModal] = useState(false);
	const pageSize = 9;
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const [showOrientationModal, setShowOrientationModal] = useState(false);
	const [, setSelectedOrientation] = useState<"portrait" | "landscape" | null>(
		null
	);
	const maroon = "text-[#7A0000]";
	const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

	const epfNo = user?.Userno || "";
	const currentYear = new Date().getFullYear();
	const minDate = `${currentYear - 20}-01-01`;

	const parseApiResponse = (response: any): any[] => {
		if (Array.isArray(response)) return response;
		if (response.data && Array.isArray(response.data)) return response.data;
		if (response.result && Array.isArray(response.result))
			return response.result;
		if (response.departments && Array.isArray(response.departments))
			return response.departments;
		if (response.Data && Array.isArray(response.Data)) return response.Data;
		if (response.warehouses && Array.isArray(response.warehouses))
			return response.warehouses;
		console.warn("Unexpected API response format:", response);
		return [];
	};

	useEffect(() => {
		const fetchDepartments = async () => {
			if (!epfNo) {
				setError("No EPF number available. Please login again.");
				toast.error("No EPF number available. Please login again.");
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const res = await fetch(
					`/misapi/api/incomeexpenditure/departments/${encodeURIComponent(
						epfNo
					)}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json",
						},
						credentials: "include",
					}
				);
				if (!res.ok) {
					const errorText = await res.text();
					throw new Error(
						`HTTP error! status: ${res.status}, message: ${errorText}`
					);
				}

				const contentType = res.headers.get("content-type");
				if (!contentType || !contentType.includes("application/json")) {
					const text = await res.text();
					throw new Error(
						`Expected JSON but got ${contentType}. Response: ${text.substring(
							0,
							100
						)}`
					);
				}

				const parsed = await res.json();
				const rawData = parseApiResponse(parsed);

				const final: Department[] = rawData.map(
					(item: ApiDepartmentResponse) => ({
						DeptId: item.DeptId?.toString() || "",
						DeptName: item.DeptName?.toString().trim() || "",
					})
				);

				setData(final);
				setFiltered(final);
			} catch (e: any) {
				console.error("Cost Center Fetch Error:", e);
				const errorMessage = e.message.includes("JSON.parse")
					? "Invalid data format received from server."
					: e.message.includes("Failed to fetch")
					? "Failed to connect to the server. Please check if the server is running."
					: e.message;
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};
		fetchDepartments();
	}, [epfNo]);

	useEffect(() => {
		const f = data.filter(
			(d) =>
				(!searchId ||
					d.DeptId.toLowerCase().includes(searchId.toLowerCase())) &&
				(!searchName ||
					d.DeptName.toLowerCase().includes(searchName.toLowerCase()))
		);
		setFiltered(f);
		setPage(1);
	}, [searchId, searchName, data]);

	useEffect(() => {
		const fetchWarehouses = async () => {
			setWarehouses([]);
			setSelectedWarehouse("");
			setWarehouseError(null);

			if (!selectedDepartment || !epfNo) {
				setWarehouseError(
					"Please select a cost center to view associated warehouses."
				);
				return;
			}

			setLoading(true);
			try {
				const url = `/misapi/api/inventoryaverageconsumption/warehouses/${encodeURIComponent(
					epfNo
				)}?costCenterId=${encodeURIComponent(
					selectedDepartment.DeptId
				)}&t=${Date.now()}`;
				console.log("Fetching warehouses from:", url);
				console.log("Selected Cost Center ID:", selectedDepartment.DeptId);
				const response = await fetch(url, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					credentials: "include",
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`HTTP error! status: ${response.status}, message: ${errorText}`
					);
				}

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

				const result = await response.json();
				console.log("Raw Warehouse API Response:", result);
				const rawData = parseApiResponse(result);
				const data: Warehouse[] = rawData.map(
					(item: ApiWarehouseResponse) => ({
						WarehouseCode: item.WarehouseCode?.toString().trim() || "",
						CostCenterId: item.CostCenterId?.toString().trim() || "",
					})
				);

				// Fallback client-side filter
				const filteredData = data.filter(
					(item) =>
						!item.CostCenterId ||
						item.CostCenterId === selectedDepartment.DeptId
				);
				console.log("Filtered Warehouses:", filteredData);

				setWarehouses(filteredData);
				if (filteredData.length === 0) {
					setWarehouseError(
						`No warehouses found for cost center ${selectedDepartment.DeptId}.`
					);
					toast.warn(
						`No warehouses found for cost center ${selectedDepartment.DeptId}.`
					);
				} else {
					if (filteredData.length === 1) {
						setSelectedWarehouse(filteredData[0].WarehouseCode);
					}
					toast.success(
						`Successfully fetched ${filteredData.length} warehouse(s) for cost center ${selectedDepartment.DeptId}.`
					);
				}
			} catch (error: any) {
				console.error("Warehouse Fetch Error Details:", error);
				const errorMessage = error.message.includes("Failed to fetch")
					? "Failed to connect to the server. Please verify the warehouse endpoint exists."
					: error.message;
				setWarehouseError(errorMessage);
				toast.error(`Failed to fetch warehouses: ${errorMessage}`);
			} finally {
				setLoading(false);
			}
		};

		fetchWarehouses();
	}, [selectedDepartment, epfNo]);

	const handleViewClick = async () => {
		if (!selectedDepartment) {
			toast.error("Please select a cost center.");
			return;
		}
		if (!fromDate) {
			toast.error("Please enter a from date.");
			return;
		}
		if (!toDate) {
			toast.error("Please enter a to date.");
			return;
		}

		// Prevent same-day range — require a range with at least one day difference
		if (fromDate === toDate) {
			toast.error(
				"From date and To date cannot be the same. Please select a different range."
			);
			return;
		}
		if (new Date(toDate) < new Date(fromDate)) {
			toast.error("To date cannot be earlier than from date.");
			return;
		}
		if (!selectedWarehouse) {
			toast.error("Please select a warehouse code.");
			return;
		}

		setInventoryLoading(true);
		setInventoryError(null);
		setInventoryData([]);
		setShowInventoryModal(true);

		try {
			const formattedFromDate = fromDate.replace(/-/g, "");
			const formattedToDate = toDate.replace(/-/g, "");
			const response = await fetch(
				`/avgConsumption/api/inventoryaverageconsumption/report/${encodeURIComponent(
					selectedDepartment.DeptId
				)}/${encodeURIComponent(
					selectedWarehouse
				)}/${formattedFromDate}/${formattedToDate}`,
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
					`HTTP error! status: ${response.status}, message: ${errorText}`
				);
			}

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

			const result = await response.json();
			const data: AverageConsumption[] = parseApiResponse(result).map(
				(item: ApiInventoryResponse) => ({
					WarehouseCode: item.WarehouseCode?.toString().trim() || "",
					MaterialCode: item.MaterialCode?.toString().trim() || "",
					MaterialName: item.MaterialName?.toString().trim() || "",
					GradeCode: item.GradeCode?.toString().trim() || "",
					UnitPrice: Number(item.UnitPrice) || 0,
					QuantityOnHand: Number(item.QuantityOnHand) || 0,
					TransactionQuantity: Number(item.TransactionQuantity) || 0,
					AverageConsumption: Number(item.AverageConsumption) || 0,
					CostCenterName: item.CostCenterName?.toString().trim() || "",
				})
			);

			const filteredData = data.filter(
				(item) => item.WarehouseCode === selectedWarehouse
			);

			setInventoryData(filteredData);
			if (filteredData.length === 0) {
				toast.warn(
					`No inventory data found for cost center ${selectedDepartment.DeptId}, warehouse ${selectedWarehouse}, from ${fromDate} to ${toDate}.`
				);
			} else {
				toast.success(`Successfully fetched inventory data.`);
			}
		} catch (error: any) {
			console.error("Inventory Data Fetch Error:", error);
			const errorMessage = error.message.includes("Failed to fetch")
				? "Failed to connect to the server. Please check if the server is running."
				: error.message;
			setInventoryError(errorMessage);
			toast.error(`Failed to fetch inventory data: ${errorMessage}`);
		} finally {
			setInventoryLoading(false);
		}
	};

	const clearFilters = () => {
		setSearchId("");
		setSearchName("");
	};

	const printPDF = (
		data: AverageConsumption[],
		costCenterName: string,
		orientation: "portrait" | "landscape"
	) => {
		if (!data || data.length === 0 || !iframeRef.current) {
			toast.error("Cannot print: No data or print iframe unavailable.");
			return;
		}

		const columnWidths =
			orientation === "portrait"
				? {
						materialCode: "w-[15%]",
						materialName: "w-[20%]",
						gradeCode: "w-[10%]",
						unitPrice: "w-[10%]",
						quantityOnHand: "w-[12%]",
						transactionQuantity: "w-[12%]",
						averageConsumption: "w-[11%]",
				  }
				: {
						materialCode: "w-[15%]",
						materialName: "w-[22%]",
						gradeCode: "w-[8%]",
						unitPrice: "w-[10%]",
						quantityOnHand: "w-[12%]",
						transactionQuantity: "w-[12%]",
						averageConsumption: "w-[13%]",
				  };

		let tableRowsHTML = "";
		data.forEach((item, index) => {
			tableRowsHTML += `
        <tr class="${index % 2 ? "bg-white" : "bg-gray-50"}">
         
          <td class="${
					columnWidths.materialCode
				} p-1 border border-gray-300 text-left">${item.MaterialCode}</td>
          <td class="${
					columnWidths.materialName
				} p-1 border border-gray-300 text-left break-words">${
				item.MaterialName
			}</td>
          <td class="${
					columnWidths.gradeCode
				} p-1 border border-gray-300 text-left">${item.GradeCode}</td>
          <td class="${
					columnWidths.unitPrice
				} p-1 border border-gray-300 text-right font-mono">${formatNumber(
				item.UnitPrice
			)}</td>
          <td class="${
					columnWidths.quantityOnHand
				} p-1 border border-gray-300 text-right font-mono">${formatNumber(
				item.QuantityOnHand
			)}</td>
          <td class="${
					columnWidths.transactionQuantity
				} p-1 border border-gray-300 text-right font-mono">${formatNumber(
				item.TransactionQuantity
			)}</td>
          <td class="${
					columnWidths.averageConsumption
				} p-1 border border-gray-300 text-right font-mono">${formatNumber(
				item.AverageConsumption
			)}</td>
        </tr>
      `;
		});

		const reportTitle = "Inventory Average Consumption Report";

		const htmlContent = `
	  <html>
		<head>
		  <style>
			@media print {
			  @page { size: A4 ${orientation}; margin: 20mm 15mm 25mm 15mm; }
			  body { margin: 0; font-family: Arial, sans-serif; }
			  .print-container { width: 100%; margin: 0; padding: 0; }
			  .print-header { margin-bottom: 2.5rem; margin-top: 3rem; margin-left: 2rem; font-size: 1.125rem; text-align: center; }
			  .print-header h2 { font-weight: bold; color: #7A0000; }
			  .print-summary { margin-left: 0.4rem; margin-right: 1rem; font-size: 0.875rem; margin-bottom: 1rem; }
			  .print-summary p { margin: 0.125rem 0; }
			  .print-summary .font-bold { font-weight: bold; }
			  .print-equation { margin-left: 0.3rem; margin-right: 0.75rem; font-size: 0.75rem; color: #D1D5DB; }
			  .print-signoff { margin-top: 4rem; display: flex; justify-content: space-between; font-size: 0.875rem; padding: 0 2rem; }
			  .print-currency { text-align: right; font-size: 0.875rem; font-weight: 600; color: #4B5563; margin-bottom: 0.25rem; margin-top: 1rem; margin-right: 0.45rem; }

			  table.print-table { border-collapse: collapse; width: 100%; margin-left: 0; margin-right: 3rem; }
			  table.print-table th, table.print-table td { border: 1px solid #D1D5DB; padding: 0.25rem; font-size: 0.75rem; }
			  table.print-table th { background: linear-gradient(to right, #7A0000, #A52A2A); color: white; text-align: center; }
			  table.print-table td { text-align: right; }
			  table.print-table td.text-left { text-align: left; }
			  table.print-table tr.bg-white { background-color: #fff; }
			  table.print-table tr.bg-gray-50 { background-color: #F9FAFB; }
			  table.print-table tr { page-break-inside: avoid; }
			  thead { display: table-header-group; }
			  @page {
				@bottom-left { content: "Printed on: ${new Date().toLocaleString("en-US", {
					timeZone: "Asia/Colombo",
				})}"; font-size: 0.75rem; color: gray; }
				@bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 0.75rem; color: gray; }
			  }
			}
		  </style>
		</head>
		<body>
		  <div class="print-container">
						<div class="print-header">
							<h2>${reportTitle}</h2>
						</div>
			  <div class="print-summary">
			  <p><span class="font-bold">Cost Center:</span> 
			  ${selectedDepartment?.DeptId || ""} - ${costCenterName}</p>
			  <p><span class="font-bold">Warehouse:</span> ${selectedWarehouse}</p>
			  <p><span class="font-bold">Date Range:</span> ${fromDate || ""} to ${
			toDate || ""
		}</p>

			  <p class="font-bold">Calculation based on:</p>
			    
	  <div class="print-equation">
              <p class="mt-1">
                Average Consumption = Σ(Issue + Issue Cancellation within Date Range) ÷ Round(MonthsBetween(ToDate, FromDate))
              </p>
            </div>
			<div class="print-currency">Currency: LKR</div>
            </div>
            <table class="print-table">
              <thead>
                <tr>
                  <th class="${columnWidths.materialCode}">Material Code</th>
                  <th class="${columnWidths.materialName}">Material Name</th>
                  <th class="${columnWidths.gradeCode}">Grade Code</th>
                  <th class="${columnWidths.unitPrice}">Unit Price</th>
                  <th class="${
							columnWidths.quantityOnHand
						}">Quantity On Hand</th>
                  <th class="${
							columnWidths.transactionQuantity
						}">Transaction Quantity</th>
                  <th class="${
							columnWidths.averageConsumption
						}">Average Consumption</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHTML}
              </tbody>
            </table>
			 <div class="print-signoff">
              <div>Prepared By: ____________________</div>
              <div>Checked By: ____________________</div>
            </div>
          </div>
        </body>
      </html>
    `;

		const iframeDoc =
			iframeRef.current.contentDocument ||
			iframeRef.current.contentWindow?.document;
		if (iframeDoc) {
			iframeDoc.open();
			iframeDoc.write(htmlContent);
			iframeDoc.close();
			iframeRef.current.contentWindow?.print();
		}
	};

	const handlePrintClick = () => {
		setShowOrientationModal(true);
	};

	const handleOrientationSelect = (orientation: "portrait" | "landscape") => {
		setSelectedOrientation(orientation);
		setShowOrientationModal(false);
		printPDF(inventoryData, selectedDepartment?.DeptName || "", orientation);
	};

	const handleDownloadCSV = () => {
		if (inventoryData.length === 0) return;

		const headers = [
			"Material Code",
			"Material Name",
			"Grade Code",
			"Unit Price",
			"Quantity On Hand",
			"Transaction Quantity",
			"Average Consumption",
		];

		const escapeCsv = (value: string | number | null | undefined) => {
			const s = value === null || value === undefined ? "" : String(value);
			return `"${s.replace(/"/g, '""')}"`;
		};

		const csvContent = [
			`Inventory Average Consumption Report`,
			`Cost Center: ${selectedDepartment?.DeptId || ""} - ${
				selectedDepartment?.DeptName || ""
			}`,
			`Warehouse: ${selectedWarehouse}`,
			`Date Range: ${fromDate || ""} to ${toDate || ""}`,
			`Printed on: ${new Date().toLocaleString("en-US")}`,
			`Currency: LKR`,
			"",
			headers.join(","),
			...inventoryData.map((item) => {
				const unitPrice = formatNumber(item.UnitPrice ?? 0);
				const qtyOnHand = formatNumber(item.QuantityOnHand ?? 0);
				const txnQty = formatNumber(item.TransactionQuantity ?? 0);
				const avgCons = formatNumber(item.AverageConsumption ?? 0);

				return [
					escapeCsv(`\t${item.MaterialCode || ""}`),
					escapeCsv(item.MaterialName || ""),
					escapeCsv(item.GradeCode || ""),
					escapeCsv(unitPrice),
					escapeCsv(qtyOnHand),
					escapeCsv(txnQty),
					escapeCsv(avgCons),
				].join(",");
			}),
		].join("\n");

		const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `inventory_average_consumption_${selectedWarehouse}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleCostCenterSelect = (department: Department) => {
		setSelectedDepartment(department);
		setWarehouses([]);
		setSelectedWarehouse("");
		setWarehouseError(null);
		setInventoryData([]);
		setShowInventoryModal(false);
	};

	const paginatedDepartments = filtered.slice(
		(page - 1) * pageSize,
		page * pageSize
	);

	return (
		<div className="max-w-[95%] mx-auto p-2 md:p-4 bg-white rounded-xl shadow border border-gray-200 text-sm md:text-base font-sans">
			<h2 className={`text-lg md:text-xl font-bold mb-4 ${maroon}`}>
				Inventory Average Consumption
			</h2>

			<div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-3 mb-4 justify-end items-end">
				{/* From Date */}
				<div className="flex w-full md:w-auto items-center gap-2">
					<label
						className={`text-xs md:text-sm font-bold ${maroon} whitespace-nowrap`}
					>
						From Date:
					</label>
					<input
						type="date"
						value={fromDate}
						min={minDate}
						onChange={(e) => setFromDate(e.target.value)}
						className="pl-2 md:pl-3 pr-2 md:pr-3 py-1 md:py-1.5 w-full md:w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-xs md:text-sm"
					/>
				</div>

				{/* To Date */}
				<div className="flex w-full md:w-auto items-center gap-2">
					<label
						className={`text-xs md:text-sm font-bold ${maroon} whitespace-nowrap`}
					>
						To Date:
					</label>
					<input
						type="date"
						value={toDate}
						min={minDate}
						onChange={(e) => setToDate(e.target.value)}
						className="pl-2 md:pl-3 pr-2 md:pr-3 py-1 md:py-1.5 w-full md:w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-xs md:text-sm"
					/>
				</div>

				{/* Warehouse Code + View Button */}
				<div className="flex flex-col md:flex-row w-full md:w-auto gap-2 md:gap-2 items-end">
					<div className="flex flex-col">
						<label
							className={`text-xs md:text-sm font-bold ${maroon} mb-1`}
						>
							Warehouse Code
						</label>
						<select
							value={selectedWarehouse}
							onChange={(e) => setSelectedWarehouse(e.target.value)}
							className="pl-2 md:pl-3 pr-2 md:pr-3 py-1 md:py-1.5 w-full md:w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-xs md:text-sm"
							disabled={!selectedDepartment || loading}
						>
							<option value="">Select Warehouse</option>
							{warehouses.map((wh) => (
								<option key={wh.WarehouseCode} value={wh.WarehouseCode}>
									{wh.WarehouseCode}
								</option>
							))}
						</select>
					</div>
					<button
						onClick={handleViewClick}
						disabled={
							!selectedDepartment || !selectedWarehouse || loading
						}
						className={`px-2 md:px-3 py-1 md:py-1 ${maroonGrad} text-white rounded-md text-xs md:text-sm font-medium hover:brightness-110 transition shadow ${
							!selectedDepartment || !selectedWarehouse || loading
								? "opacity-50 cursor-not-allowed"
								: ""
						}`}
					>
						<Eye className="inline-block mr-1 w-3 md:w-3 h-3 md:h-3" />{" "}
						View
					</button>
				</div>
			</div>

			<div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-3 mb-2 md:mb-4">
				<div className="relative w-full md:w-auto">
					<Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 md:w-3 h-3 md:h-3" />
					<input
						type="text"
						value={searchId}
						placeholder="Search by Cost Center ID"
						onChange={(e) => setSearchId(e.target.value)}
						className="pl-8 md:pl-8 pr-2 md:pr-3 py-1 md:py-1.5 w-full md:w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-xs md:text-sm"
						autoComplete="off"
					/>
				</div>
				<div className="relative w-full md:w-auto">
					<Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 md:w-3 h-3 md:h-3" />
					<input
						type="text"
						value={searchName}
						placeholder="Search by Name"
						onChange={(e) => setSearchName(e.target.value)}
						className="pl-8 md:pl-10 pr-2 md:pr-3 py-1 md:py-1.5 w-full md:w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-xs md:text-sm"
						autoComplete="off"
					/>
				</div>
				{(searchId || searchName) && (
					<button
						onClick={clearFilters}
						className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs md:text-sm"
					>
						<RotateCcw className="w-3 md:w-3 h-3 md:h-3" /> Clear
					</button>
				)}
			</div>

			{loading && !warehouses.length && (
				<div className="text-center py-4 md:py-8">
					<div className="animate-spin rounded-full h-6 md:h-8 w-6 md:w-8 border-b-2 border-[#7A0000] mx-auto"></div>
					<p className="mt-1 md:mt-2 text-gray-600 text-xs md:text-sm">
						Loading cost centers...
					</p>
				</div>
			)}

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-2 md:px-4 py-2 md:py-3 rounded mb-2 md:mb-4 text-xs md:text-sm">
					Error: {error}
				</div>
			)}

			{!loading && !error && filtered.length === 0 && (
				<div className="text-gray-600 bg-gray-100 p-2 md:p-4 rounded text-xs md:text-sm">
					No cost centers found.
				</div>
			)}

			{!loading && !error && filtered.length > 0 && (
				<>
					<div className="overflow-x-auto rounded-lg border border-gray-200">
						<div className="max-h-[50vh] overflow-y-auto">
							<table className="w-full table-fixed text-left text-gray-700 text-xs md:text-sm">
								<thead
									className={`${maroonGrad} text-white sticky top-0`}
								>
									<tr>
										<th className="px-2 md:px-4 py-1 md:py-2 w-1/2 md:w-auto">
											Cost Center Code
										</th>
										<th className="px-2 md:px-4 py-1 md:py-2 w-1/2 md:w-auto">
											Cost Center Name
										</th>
									</tr>
								</thead>
								<tbody>
									{paginatedDepartments.map((department, i) => (
										<tr
											key={`${department.DeptId}-${i}`}
											onClick={() =>
												handleCostCenterSelect(department)
											}
											className={`cursor-pointer ${
												selectedDepartment?.DeptId ===
												department.DeptId
													? "bg-[#7A0000] text-white"
													: i % 2
													? "bg-white hover:bg-gray-100"
													: "bg-gray-50 hover:bg-gray-100"
											}`}
										>
											<td className="px-2 md:px-4 py-1 md:py-2 truncate min-w-0">
												{department.DeptId}
											</td>
											<td className="px-2 md:px-4 py-1 md:py-2 truncate min-w-0">
												{department.DeptName}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="flex flex-col md:flex-row justify-end items-center gap-2 md:gap-3 mt-2 md:mt-3">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="px-2 md:px-3 py-1 md:py-1 border rounded bg-white text-gray-600 text-xs md:text-sm hover:bg-gray-100 disabled:opacity-40"
						>
							Previous
						</button>
						<span className="text-xs md:text-sm text-gray-600">
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
							className="px-2 md:px-3 py-1 md:py-1 border rounded bg-white text-gray-600 text-xs md:text-sm hover:bg-gray-100 disabled:opacity-40"
						>
							Next
						</button>
					</div>
				</>
			)}

			{showInventoryModal && selectedDepartment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 print:static print:inset-auto print:p-0 print:flex-col print:items-start print:justify-start print:overflow-visible">
					<style>{`
            @media print {
              @page { size: A4; margin: 20mm 15mm 25mm 15mm; }
              body { margin: 0; font-family: Arial, sans-serif; }
              .print-container { width: 100%; margin: 0; padding: 0; }
              .print-table { border-collapse: collapse; width: 100%; }
              .print-table th, .print-table td { border: 1px solid #D1D5DB; padding: 0.25rem; font-size: 0.75rem; }
              .print-table th { background: linear-gradient(to right, #7A0000, #A52A2A); color: white; text-align: center; }
              .print-table td { text-align: right; }
              .print-table td.text-left { text-align: left; }
              .print-table tr { page-break-inside: avoid; }
              thead { display: table-header-group; }
              @page {
                @bottom-left { content: "Printed on: ${new Date().toLocaleString(
							"en-US",
							{timeZone: "Asia/Colombo"}
						)}"; font-size: 0.75rem; color: gray; }
                @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 0.75rem; color: gray; }
              }
            }
          `}</style>

					<div className="absolute inset-0 bg-white/90 print:hidden"></div>
					<div className="relative bg-white w-full max-w-[95vw] sm:max-w-4xl md:max-w-6xl lg:max-w-7xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden print:relative print:w-full print:max-w-none print:rounded-none print:shadow-none print:border-none print:overflow-visible print-container mt-40 ml-60">
						<div className="p-2 md:p-2 max-h-[80vh] overflow-y-auto print:p-0 print:max-h-none print:overflow-visible print:mt-10 print:ml-12">
							<div className="flex justify-end gap-3 mb-6 md:mb-8 print:hidden">
								<button
									onClick={handleDownloadCSV}
									className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
								>
									<Download className="w-4 h-4" /> CSV
								</button>
								<button
									onClick={handlePrintClick}
									className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
								>
									<Printer className="w-4 h-4" /> Print
								</button>
								<button
									onClick={() => setShowInventoryModal(false)}
									className="flex items-center gap-1 px-3 py-1.5 border border-red-400 text-red-700 bg-white rounded-md text-xs font-medium shadow-sm hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 transition"
								>
									<X className="w-4 h-4" /> Close
								</button>
							</div>
							<h2
								className={`text-lg md:text-xl font-bold text-center md:mb-6 ${maroon}`}
							>
								{`Inventory Average Consumption Report${
									fromDate && toDate
										? ` - ${fromDate} to ${toDate}`
										: ""
								}`}
							</h2>
							<div className="flex justify-between md:mb-2 md:text-sm leading-5">
								<div className="ml-5">
									<p>
										<span className="font-bold">Cost Center: </span>
										{""}
										{selectedDepartment?.DeptId || ""}
										{" - "}
										{selectedDepartment.DeptName}
									</p>
									<p>
										<span className="font-bold">Warehouse:</span>{" "}
										{selectedWarehouse}
									</p>

									<p>
										<span className="font-bold">
											Calculation based on:{" "}
										</span>
										<span className="text-gray-400">
											Average Consumption = Σ(Issue + Issue
											Cancellation within Date Range) ÷
											Round(MonthsBetween(ToDate, FromDate))
										</span>
									</p>
								</div>
							</div>
							<div className="flex justify-end text-sm md:text-base font-semibold text-gray-600 mr-5">
								Currency: LKR
							</div>
							<div className="ml-5 mt-1 border border-gray-200 rounded-lg overflow-x-auto print:ml-12 print:mt-12 print:overflow-visible">
								<table className="w-full border-collapse text-sm min-w-[700px] print-table">
									<thead className="bg-gradient-to-r from-[#7A0000] to-[#A52A2A] text-white">
										<tr>
											<th className="px-2 py-1.5 border-r border-gray-200 w-[15%] text-xs">
												Material Code
											</th>
											<th className="px-2 py-1.5 border-r border-gray-200 w-[20%] text-xs">
												Material Name
											</th>
											<th className="px-2 py-1.5 border-r border-gray-200 w-[10%] text-xs">
												Grade Code
											</th>
											<th className="px-2 py-1.5 border-r border-gray-200 w-[12%] text-xs">
												Unit Price
											</th>
											<th className="px-2 py-1.5 border-r border-gray-200 w-[12%] text-xs">
												Quantity On Hand
											</th>
											<th className="px-2 py-1.5 border-r border-gray-200 w-[12%] text-xs">
												Transaction Quantity
											</th>
											<th className="px-2 py-1.5 w-[12%] text-xs">
												Average Consumption
											</th>
										</tr>
									</thead>
									<tbody>
										{inventoryLoading ? (
											<tr>
												<td
													colSpan={8}
													className="text-center py-6"
												>
													<div className="animate-spin rounded-full h-6 md:h-8 w-6 md:w-8 border-b-2 border-[#7A0000] mx-auto"></div>
													<p className="mt-1 md:mt-2 text-gray-600 text-xs md:text-sm">
														Loading inventory data...
													</p>
												</td>
											</tr>
										) : inventoryError ? (
											<tr>
												<td
													colSpan={8}
													className="text-center py-6"
												>
													<div className="bg-red-100 border border-red-400 text-red-700 px-2 md:px-4 py-2 md:py-3 rounded text-xs md:text-sm">
														Error: {inventoryError}
													</div>
												</td>
											</tr>
										) : inventoryData.length === 0 ? (
											<tr>
												<td
													colSpan={8}
													className="text-center py-6"
												>
													<div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-10">
														<div className="text-gray-400 mb-4 md:mb-6">
															No inventory data available.
														</div>
													</div>
												</td>
											</tr>
										) : (
											inventoryData.map((item, index) => (
												<tr
													key={`${item.WarehouseCode}-${item.MaterialCode}-${index}`}
													className={
														index % 2 ? "bg-white" : "bg-gray-50"
													}
												>
													<td className="px-2 py-1.5 border-r border-gray-200 text-xs text-left">
														{item.MaterialCode}
													</td>
													<td className="px-2 py-1.5 border-r border-gray-200 text-xs text-left break-words">
														{item.MaterialName}
													</td>
													<td className="px-2 py-1.5 border-r border-gray-200 text-xs text-left">
														{item.GradeCode}
													</td>
													<td className="px-2 py-1.5 border-r border-gray-200 text-right font-mono text-xs">
														{formatNumber(item.UnitPrice)}
													</td>
													<td className="px-2 py-1.5 border-r border-gray-200 text-right font-mono text-xs">
														{formatNumber(item.QuantityOnHand)}
													</td>
													<td className="px-2 py-1.5 border-r border-gray-200 text-right font-mono text-xs">
														{formatNumber(
															item.TransactionQuantity
														)}
													</td>
													<td className="px-2 py-1.5 text-right font-mono text-xs">
														{formatNumber(
															item.AverageConsumption
														)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
							<div className="hidden print:block text-xs text-gray-500 mt-12 text-center">
								Printed on:{" "}
								{new Date().toLocaleString("en-US", {
									timeZone: "Asia/Colombo",
								})}
							</div>
						</div>
						<iframe ref={iframeRef} className="hidden" />
						{showOrientationModal && (
							<div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
								<div className="bg-white rounded-lg p-6 w-full max-w-md">
									<h3 className="text-lg font-semibold mb-4">
										Select Print Orientation
									</h3>
									<div className="flex justify-between mb-4">
										<button
											onClick={() =>
												handleOrientationSelect("portrait")
											}
											className="px-4 py-2 bg-[#7A0000] text-white rounded-md hover:bg-[#A52A2A] transition"
										>
											Portrait
										</button>
										<button
											onClick={() =>
												handleOrientationSelect("landscape")
											}
											className="px-4 py-2 bg-[#7A0000] text-white rounded-md hover:bg-[#A52A2A] transition"
										>
											Landscape
										</button>
									</div>
									<button
										onClick={() => setShowOrientationModal(false)}
										className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition"
									>
										Cancel
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default AverageConsumption;
