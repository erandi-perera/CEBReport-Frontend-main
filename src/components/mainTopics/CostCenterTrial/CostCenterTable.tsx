import React from "react";
import { FaSearch, FaSyncAlt, FaEye } from "react-icons/fa";

interface CostCenter {
  compId: string;
  CompName: string;
}

interface CostCenterTableProps {
  filtered: CostCenter[];
  paginated: CostCenter[];
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  maroon: string;
  maroonGrad: string;
  viewDetails: (compId: string, compName: string) => void;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  searchId: string;
  setSearchId: (v: string) => void;
  searchName: string;
  setSearchName: (v: string) => void;
  clearFilters: () => void;
  epfNo: string;
  user: any;
}

const CostCenterTable: React.FC<CostCenterTableProps> = ({
  filtered,
  paginated,
  page,
  setPage,
  pageSize,
  maroon,
  maroonGrad,
  viewDetails,
  loading,
  error,
  lastUpdated,
  searchId,
  setSearchId,
  searchName,
  setSearchName,
  clearFilters,
  epfNo,
  user
}) => (
  <>
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className={`text-xl font-bold ${maroon}`}>
          Cost Center Details
          <span className="ml-2 text-xs text-gray-500">(Total: {filtered.length})</span>
        </h2>
        {epfNo && (
          <div className="text-xs text-gray-600 mt-1 space-y-1">
            <p>
              EPF Number: <span className="font-mono font-medium">{epfNo}</span>
            </p>
            {user?.Name && (
              <p>
                User: <span className="font-medium">{user.Name}</span>
              </p>
            )}
          </div>
        )}
      </div>
      {lastUpdated && (
        <p className="text-[10px] text-gray-400">Last updated: {lastUpdated.toLocaleString()}</p>
      )}
    </div>
    <div className="flex flex-wrap gap-3 justify-end mb-4">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={searchId}
          placeholder="Search by Code"
          onChange={(e) => setSearchId(e.target.value)}
          className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition"
        />
      </div>
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={searchName}
          placeholder="Search by Name"
          onChange={(e) => setSearchName(e.target.value)}
          className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition"
        />
      </div>
      {(searchId || searchName) && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          <FaSyncAlt className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
    {loading && (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading cost centers...</p>
      </div>
    )}

    {/* No EPF Number State */}
    {!loading && !epfNo && (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Authentication Required</h3>
        <p className="text-gray-500 text-center max-w-md">
          No EPF number available. Please <strong>login again</strong> to access this feature.
        </p>
      </div>
    )}

    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        Error: {error}
      </div>
    )}
    {!loading && !error && epfNo && filtered.length === 0 && (
      <div className="text-gray-600 bg-gray-100 p-4 rounded">No cost centers found.</div>
    )}
    {!loading && !error && epfNo && filtered.length > 0 && (
      <>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full table-fixed text-left text-gray-700 text-sm">
              <thead className={`${maroonGrad} text-white sticky top-0`}>
                <tr>
                  <th className="px-4 py-2 w-1/4">Divition Code</th>
                  <th className="px-4 py-2 w-1/2">Divition Name</th>
                  <th className="px-4 py-2 w-1/4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(({ compId, CompName }, i) => (
                  <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2 truncate">{compId}</td>
                    <td className="px-4 py-2 truncate">{CompName}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => viewDetails(compId, CompName)}
                        className={`px-3 py-1 ${maroonGrad} text-white rounded-md text-xs font-medium hover:brightness-110 transition shadow`}
                      >
                        <FaEye className="inline-block mr-1 w-3 h-3" /> View
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
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {Math.ceil(filtered.length / pageSize)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
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

export default CostCenterTable; 