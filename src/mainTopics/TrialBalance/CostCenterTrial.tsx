import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaSyncAlt, FaEye } from "react-icons/fa";

interface CostCenter {
  CompId: string;
  CompName: string;
}

const CostCenterTrial: React.FC<{ title?: string }> = ({ title = "Cost Center Details" }) => {
  const [data, setData] = useState<CostCenter[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filtered, setFiltered] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const navigate = useNavigate();

  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/misapi/api/trialbalance/companies/level/70");
        const txt = await res.text();
        const parsed = JSON.parse(txt);
        const final = Array.isArray(parsed) ? parsed : parsed.data || [];
        setData(final);
        setFiltered(final);
        setLastUpdated(new Date());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const f = data.filter(c =>
      (!searchId || c.CompId.toLowerCase().includes(searchId.toLowerCase())) &&
      (!searchName || c.CompName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFiltered(f);
    setPage(1);
  }, [searchId, searchName, data]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const viewDetails = (compId: string) => {
    navigate(`/report/TrialBalance/select-cost-center/${compId}`);
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };

  if (loading)
    return <div className={`text-center py-8 ${maroon} text-sm animate-pulse`}>Loading...</div>;

  if (error)
    return <div className="text-red-700 bg-red-100 border border-red-300 p-4 rounded text-sm">Error: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${maroon}`}>
          {title}
          <span className="ml-2 text-xs text-gray-500">(Total: {filtered.length})</span>
        </h2>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400">Last updated: {lastUpdated.toLocaleString()}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-end mb-4">
        {[
          { val: searchId, set: setSearchId, ph: "Search by ID" }, 
          { val: searchName, set: setSearchName, ph: "Search by Name" }
        ].map((f, i) => (
          <div key={i} className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={f.val}
              placeholder={f.ph}
              onChange={e => f.set(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition"
            />
          </div>
        ))}
        {(searchId || searchName) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <FaSyncAlt className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-gray-600 bg-gray-100 p-4 rounded">No cost centers found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full table-fixed text-left text-gray-700 text-sm">
              <thead className={`${maroonBg} text-white sticky top-0 z-10`}>
                <tr>
                  <th className="px-4 py-2 w-1/4">ID</th>
                  <th className="px-4 py-2 w-1/2">Name</th>
                  <th className="px-4 py-2 w-1/4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(({ CompId, CompName }, i) => (
                  <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2 truncate">{CompId}</td>
                    <td className="px-4 py-2 truncate">{CompName}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => viewDetails(CompId)}
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
      )}

      <div className="flex justify-end items-center gap-3 mt-3">
        <button
          onClick={() => setPage(p => p - 1)}
          disabled={page === 1}
          className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-xs text-gray-500">
          Page {page} of {Math.ceil(filtered.length / pageSize)}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= Math.ceil(filtered.length / pageSize)}
          className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CostCenterTrial;