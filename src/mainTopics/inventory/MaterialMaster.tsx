import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaSyncAlt, FaEye } from "react-icons/fa";
import type {
  Material,
  MaterialMasterProps,
} from "../../interfaces/materialTypes";

const MaterialMaster: React.FC<MaterialMasterProps> = ({
  title = "Material Details",
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTermName, setSearchTermName] = useState("");
  const [searchTermCode, setSearchTermCode] = useState("");
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const navigate = useNavigate();

  useEffect(() => {
    const loadMaterials = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/misapi/api/materials");
        const text = await response.text();
        console.log("API raw response:", text);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data: Material[] = [];
        try {
          const result = JSON.parse(text);
          if (Array.isArray(result)) {
            data = result;
          } else if (result.data && Array.isArray(result.data)) {
            data = result.data;
          }
        } catch (e) {
          throw new Error("Response is not valid JSON.");
        }
        setMaterials(data);
        setFilteredMaterials(data);
        setLastUpdated(new Date());
      } catch (err: any) {
        setError(err.message || "Failed to load materials.");
        setMaterials([]);
        setFilteredMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, []);

  useEffect(() => {
    if (searchTermName.trim() === "" && searchTermCode.trim() === "") {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter((material) => {
        const nameMatch =
          searchTermName.trim() === "" ||
          material.MatNm.toLowerCase().includes(searchTermName.toLowerCase());
        const codeMatch =
          searchTermCode.trim() === "" ||
          material.MatCd.toLowerCase().includes(searchTermCode.toLowerCase());
        return nameMatch && codeMatch;
      });
      setFilteredMaterials(filtered);
    }
  }, [searchTermName, searchTermCode, materials]);

  // Calculate paginated materials
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Update page if filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredMaterials]);

  const clearAllFilters = () => {
    setSearchTermName("");
    setSearchTermCode("");
  };

  const handleView = (matCd: string) => {
    console.log("handleView called with matCd:", matCd);
    console.log("Current location:", window.location.href);
    navigate(`/report/inventory/material-details/${matCd}`);
    console.log(
      "Navigation attempted to:",
      `/report/inventory/material-details/${matCd}`
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-blue-600 text-[11px] font-sans">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded text-[11px] font-sans">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow border border-gray-100 font-sans text-[11px]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
        <h2 className="text-[13px] font-semibold text-gray-800">
          {title}{" "}
          <span className="text-[10px] font-normal text-gray-500">
            (Total: {filteredMaterials.length})
          </span>
        </h2>
        {lastUpdated && (
          <span className="text-[9px] text-gray-400">
            Last updated: {lastUpdated.toLocaleString()}
          </span>
        )}
      </div>

      <div className="flex flex-wrap justify-end items-center gap-2 mb-3">
        <div className="relative">
          <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            placeholder="Material Code..."
            value={searchTermCode}
            onChange={(e) => setSearchTermCode(e.target.value)}
            className="pl-7 pr-2 border border-gray-300 rounded py-1 text-[11px] focus:outline-none focus:border-blue-500 transition w-36 bg-gray-50"
          />
        </div>
        <div className="relative">
          <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            placeholder="Material Name..."
            value={searchTermName}
            onChange={(e) => setSearchTermName(e.target.value)}
            className="pl-7 pr-2 border border-gray-300 rounded py-1 text-[11px] focus:outline-none focus:border-blue-500 transition w-36 bg-gray-50"
          />
        </div>
        {(searchTermName || searchTermCode) && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors text-gray-600"
            title="Clear all filters"
          >
            <FaSyncAlt className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="text-gray-600 bg-gray-50 border border-gray-200 p-3 rounded text-[11px]">
          No materials found.
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-[11px] text-gray-700 table-fixed">
              <thead className="bg-gray-100 text-[10px] text-gray-700 sticky top-0 z-10 shadow">
                <tr>
                  <th className="w-1/4 px-3 py-2 text-left font-medium">
                    Material Code
                  </th>
                  <th className="w-1/2 px-3 py-2 text-left font-medium">
                    Material Name
                  </th>
                  <th className="w-1/4 px-3 py-2 text-center font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedMaterials.map((material, idx) => (
                  <tr
                    key={idx}
                    className={
                      idx % 2 === 0
                        ? "bg-white hover:bg-gray-50 transition"
                        : "bg-gray-50 hover:bg-gray-100 transition"
                    }
                  >
                    <td className="w-1/4 px-3 py-2 truncate">
                      {material.MatCd}
                    </td>
                    <td className="w-1/2 px-3 py-2 truncate">
                      {material.MatNm}
                    </td>
                    <td className="w-1/4 px-3 py-2 text-center">
                      <button
                        onClick={() => handleView(material.MatCd)}
                        className="inline-flex items-center justify-center px-3 py-1 text-[11px] font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 min-w-[60px]"
                      >
                        <FaEye className="w-3 h-3 mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end items-center gap-2 mt-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-2 py-1 text-[11px] bg-gray-100 border border-gray-300 rounded disabled:opacity-50 text-gray-600 hover:bg-gray-200"
        >
          Prev
        </button>
        <span className="text-[11px] text-gray-500">
          Page {currentPage} of {Math.ceil(filteredMaterials.length / pageSize)}
        </span>
        <button
          disabled={
            currentPage === Math.ceil(filteredMaterials.length / pageSize)
          }
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-2 py-1 text-[11px] bg-gray-100 border border-gray-300 rounded disabled:opacity-50 text-gray-600 hover:bg-gray-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MaterialMaster;
