// ReusableCompanyList.tsx
import {useEffect, useState} from "react";
import {Search, RotateCcw, Eye} from "lucide-react";
import {toast} from "react-toastify";

interface Company {
	id: string; // e.g., compId
	name: string; // e.g., CompName
	[key: string]: any; // allow extra fields if needed
}

interface ReusableCompanyListProps<T extends Company> {
	/** Function to fetch the list of items */
	fetchItems: () => Promise<T[]>;
	/** Callback when user clicks "View" on an item */
	onViewItem: (item: T) => void;
	/** Optional: Custom column titles */
	idColumnTitle?: string;
	nameColumnTitle?: string;
	actionButtonText?: string;
	/** Optional: Loading message */
	loadingMessage?: string;
	/** Optional: Empty state message */
	emptyMessage?: string;
	/** Optional: Page size (default 50) */
	pageSize?: number;
}

const ReusableCompanyList = <T extends Company>({
	fetchItems,
	onViewItem,
	idColumnTitle = "Company Code",
	nameColumnTitle = "Company Name",
	actionButtonText = "View",
	loadingMessage = "Loading items...",
	emptyMessage = "No items found.",
	pageSize = 50,
}: ReusableCompanyListProps<T>) => {
	const [items, setItems] = useState<T[]>([]);
	const [filtered, setFiltered] = useState<T[]>([]);
	const [searchId, setSearchId] = useState("");
	const [searchName, setSearchName] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);

	// Fetch items on mount
	useEffect(() => {
		const loadItems = async () => {
			setLoading(true);
			setError(null);
			try {
				const data = await fetchItems();
				setItems(data);
				setFiltered(data);
			} catch (err: any) {
				const msg = err.message || "Failed to load data";
				setError(msg);
				toast.error(msg);
			} finally {
				setLoading(false);
			}
		};
		loadItems();
	}, [fetchItems]);

	// Filter items when search changes
	useEffect(() => {
		const filteredList = items.filter(
			(item) =>
				(!searchId ||
					item.id.toLowerCase().includes(searchId.toLowerCase())) &&
				(!searchName ||
					item.name.toLowerCase().includes(searchName.toLowerCase()))
		);
		setFiltered(filteredList);
		setPage(1); // Reset to first page on filter
	}, [searchId, searchName, items]);

	const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
	const totalPages = Math.ceil(filtered.length / pageSize);

	return (
		<div className="space-y-4">
			{/* Search Inputs */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
					<input
						type="text"
						placeholder={`Search by ID`}
						value={searchId}
						onChange={(e) => setSearchId(e.target.value)}
						className="pl-10 pr-4 py-1.5 w-48 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
					/>
				</div>

				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
					<input
						type="text"
						placeholder={`Search by Name`}
						value={searchName}
						onChange={(e) => setSearchName(e.target.value)}
						className="pl-10 pr-4 py-1.5 w-48 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
					/>
				</div>

				{(searchId || searchName) && (
					<button
						onClick={() => {
							setSearchId("");
							setSearchName("");
						}}
						className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded border text-xs font-medium"
					>
						<RotateCcw className="w-3.5 h-3.5" /> Clear
					</button>
				)}
			</div>

			{/* Loading State */}
			{loading && (
				<div className="text-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
					<p className="mt-2">{loadingMessage}</p>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					Error: {error}
				</div>
			)}

			{/* Table - Only show when not loading and has data */}
			{!loading && !error && filtered.length > 0 && (
				<>
					<div className="rounded-lg border border-gray-200 overflow-hidden">
						<table className="w-full text-left">
							<thead className="bg-gradient-to-r from-[#7A0000] to-[#A52A2A] text-white">
								<tr>
									<th className="px-4 py-2">{idColumnTitle}</th>
									<th className="px-4 py-2">{nameColumnTitle}</th>
									<th className="px-4 py-2 text-center">Action</th>
								</tr>
							</thead>
						</table>

						<div className="max-h-[40vh] overflow-y-auto">
							<table className="w-full text-left">
								<tbody>
									{paginated.map((item, i) => (
										<tr key={i} className="hover:bg-gray-50">
											<td className="px-4 py-2">{item.id}</td>
											<td className="px-4 py-2">{item.name}</td>
											<td className="px-4 py-2 text-center">
												<button
													onClick={() => onViewItem(item)}
													className="px-3 py-1 rounded text-white text-xs font-medium bg-gradient-to-r from-[#7A0000] to-[#A52A2A] hover:brightness-110 flex items-center mx-auto"
												>
													<Eye className="inline w-3 h-3 mr-1" />{" "}
													{actionButtonText}
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Pagination */}
					<div className="flex justify-end items-center gap-3 mt-4">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
						>
							Previous
						</button>
						<span className="text-xs text-gray-500">
							Page {page} of {totalPages}
						</span>
						<button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page >= totalPages}
							className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
						>
							Next
						</button>
					</div>
				</>
			)}

			{/* Empty State */}
			{!loading && !error && filtered.length === 0 && (
				<div className="text-center py-12 text-gray-500 text-lg">
					{emptyMessage}
				</div>
			)}
		</div>
	);
};

export default ReusableCompanyList;
