import React, { useState, useEffect } from "react";
import { FaSearch, FaSyncAlt, FaTimes } from "react-icons/fa";

interface Department {
  DeptId: string;
  DeptName: string;
}

interface DepartmentModalProps {
  modalOpen: boolean;
  closeDepartmentModal: () => void;
  selectedCompName: string | null;
  departments: Department[];
  deptLoading: boolean;
  handleSelection: (dept: Department, year: number, month: string) => void;
  maroon: string;
  maroonBg: string;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  modalOpen,
  closeDepartmentModal,
  selectedCompName,
  departments,
  deptLoading,
  handleSelection,
  maroon,
  maroonBg
}) => {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>("January");
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
    "13th Period",
  ];

  useEffect(() => {
    const filtered = departments.filter(
      (dept) =>
        (!searchId || dept.DeptId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || dept.DeptName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFilteredDepartments(filtered);
  }, [searchId, searchName, departments]);

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };

  const handleConfirm = () => {
    if (selectedDept) {
      handleSelection(selectedDept, selectedYear, selectedMonth);
    }
  };

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold ${maroon}`}>
            {selectedDept
              ? `Cost Center ID: ${selectedDept.DeptId} — ${selectedDept.DeptName}`
              : `Cost Center Name ${selectedCompName}`}
          </h3>
          <button onClick={closeDepartmentModal} className="text-gray-500 hover:text-red-500">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        {!selectedDept ? (
          <>
            <div className="flex flex-wrap gap-3 justify-end mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={searchId}
                  placeholder="Search by Dept ID"
                  onChange={(e) => setSearchId(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-48 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
                />
              </div>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={searchName}
                  placeholder="Search by Dept Name"
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-48 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
                />
              </div>
              {(searchId || searchName) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                >
                  <FaSyncAlt className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            {deptLoading ? (
              <div className="text-center p-4 text-sm text-gray-500 animate-pulse">
                Loading cost centers...
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="text-center p-4 text-sm text-gray-600 bg-gray-100 rounded">
                {departments.length === 0 ? "No cost centers found." : "No cost centers match your search."}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-gray-700 text-sm">
                    <thead className={`${maroonBg} text-white sticky top-0`}>
                      <tr>
                        <th className="px-4 py-2 w-1/4">Dept ID</th>
                        <th className="px-4 py-2 w-1/2">Dept Name</th>
                        <th className="px-4 py-2 w-1/4 text-center">Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDepartments.map((dept, i) => (
                        <tr key={dept.DeptId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2 truncate">{dept.DeptId}</td>
                          <td className="px-4 py-2 truncate">{dept.DeptName}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => setSelectedDept(dept)}
                              className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Back button for department list view - now under the table */}
            <div className="mt-4 flex justify-start">
              <button
                onClick={closeDepartmentModal}
                className="bg-gray-500 text-white py-2 px-6 rounded hover:brightness-110 text-sm"
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
              <div className="grid grid-cols-7 gap-2 max-h-32 overflow-y-auto mb-4">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`text-xs py-1 rounded cursor-pointer border transition-colors duration-150
                    ${selectedYear === year
                      ? "bg-[#7A0000] text-white border-[#7A0000]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                    style={{ minWidth: "40px" }}
                  >
                    {year}
                  </button>
                ))}
              </div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
              <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {months.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`text-xs py-1 rounded cursor-pointer border transition-colors duration-150
                    ${selectedMonth === month
                      ? "bg-[#7A0000] text-white border-[#7A0000]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                    style={{ minWidth: "50px" }}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDept(null)}
                className="bg-gray-500 text-white py-2 px-6 rounded hover:brightness-110 text-sm"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="bg-[#7A0000] text-white py-2 px-6 rounded hover:brightness-110 text-sm"
              >
                View
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DepartmentModal; 