// import React, { useState, useEffect } from "react";
// import { FaTimes, FaSearch, FaSyncAlt } from "react-icons/fa";

// interface Department {
//   DeptId: string;
//   DeptName: string;
// }

// interface Props {
//   open: boolean;
//   onClose: () => void;
//   departments: Department[];
//   compName: string | null;
//   loading: boolean;
//   onSelection?: (dept: Department, year: number, month: string) => void;
// }

// const DepartmentModal: React.FC<Props> = ({
//   open,
//   onClose,
//   departments,
//   compName,
//   loading,
//   onSelection,
// }) => {
//   const maroon = "text-[#7A0000]";
//   const maroonBg = "bg-[#7A0000]";

//   const [selectedDept, setSelectedDept] = useState<Department | null>(null);
//   const [selectedYear, setSelectedYear] = useState<number>(2025);
//   const [selectedMonth, setSelectedMonth] = useState<string>("January");

//   // Search states
//   const [searchId, setSearchId] = useState("");
//   const [searchName, setSearchName] = useState("");
//   const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

//   const years = Array.from({ length: 21 }, (_, i) => 2025 - i);
//   const months = [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December",
//     "13th Period",
//   ];

//   // Filter departments based on search criteria
//   useEffect(() => {
//     const filtered = departments.filter(
//       (dept) =>
//         (!searchId || dept.DeptId.toLowerCase().includes(searchId.toLowerCase())) &&
//         (!searchName || dept.DeptName.toLowerCase().includes(searchName.toLowerCase()))
//     );
//     setFilteredDepartments(filtered);
//   }, [searchId, searchName, departments]);

//   const handleClose = () => {
//     onClose();
//     setSelectedDept(null);
//     setSelectedYear(2025);
//     setSelectedMonth("January");
//     setSearchId("");
//     setSearchName("");
//   };

//   const handleConfirm = () => {
//     if (selectedDept && onSelection) {
//       onSelection(selectedDept, selectedYear, selectedMonth);
//     }
//   };

//   const clearFilters = () => {
//     setSearchId("");
//     setSearchName("");
//   };

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4 overflow-auto">
//       <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] overflow-y-auto p-4">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className={`text-lg font-bold ${maroon}`}>
//             {selectedDept
//               ? `Dept ID: ${selectedDept.DeptId} — ${selectedDept.DeptName}`
//               : `Departments of ${compName}`}
//           </h3>
//           <button
//             onClick={handleClose}
//             className="text-gray-500 hover:text-red-500 text-sm"
//             aria-label="Close modal"
//           >
//             <FaTimes className="w-5 h-5" />
//           </button>
//         </div>

//         {!selectedDept && (
//           <>
//             <div className="flex flex-wrap gap-3 justify-end mb-4">
//               {[
//                 { val: searchId, set: setSearchId, ph: "Search by Dept ID" },
//                 { val: searchName, set: setSearchName, ph: "Search by Dept Name" },
//               ].map((f, i) => (
//                 <div key={i} className="relative">
//                   <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
//                   <input
//                     type="text"
//                     value={f.val}
//                     placeholder={f.ph}
//                     onChange={(e) => f.set(e.target.value)}
//                     className="pl-8 pr-3 py-1.5 w-48 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
//                   />
//                 </div>
//               ))}
//               {(searchId || searchName) && (
//                 <button
//                   onClick={clearFilters}
//                   className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
//                 >
//                   <FaSyncAlt className="w-3 h-3" /> Clear
//                 </button>
//               )}
//             </div>

//             <div className="mb-3">
//               <span className="text-xs text-gray-500">
//                 Showing {filteredDepartments.length} of {departments.length} departments
//               </span>
//             </div>

//             {loading ? (
//               <div className="text-center p-4 text-sm text-gray-500 animate-pulse">
//                 Loading departments...
//               </div>
//             ) : filteredDepartments.length === 0 ? (
//               <div className="text-center p-4 text-sm text-gray-600 bg-gray-100 rounded">
//                 {departments.length === 0 ? "No departments found." : "No departments match your search criteria."}
//               </div>
//             ) : (
//               <div className="overflow-x-auto rounded-lg border border-gray-200">
//                 <div className="max-h-96 overflow-y-auto">
//                   <table className="w-full text-left text-gray-700 text-sm">
//                     <thead className={`${maroonBg} text-white sticky top-0 z-10`}>
//                       <tr>
//                         <th className="px-4 py-2 w-1/4">Dept ID</th>
//                         <th className="px-4 py-2 w-1/2">Dept Name</th>
//                         <th className="px-4 py-2 w-1/4 text-center">Select</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {filteredDepartments.map((dept, i) => (
//                         <tr
//                           key={dept.DeptId}
//                           className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
//                         >
//                           <td className="px-4 py-2 truncate">{dept.DeptId}</td>
//                           <td className="px-4 py-2 truncate">{dept.DeptName}</td>
//                           <td className="px-4 py-2 text-center">
//                             <button
//                               onClick={() => {
//                                 setSelectedDept(dept);
//                                 setSelectedYear(2025);
//                                 setSelectedMonth("January");
//                               }}
//                               className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 transition"
//                             >
//                               Select
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </>
//         )}

//         {selectedDept && (
//           <>
//             <div className="mb-4">
//               <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
//               <div className="grid grid-cols-7 gap-2 max-h-32 overflow-y-auto mb-4">
//                 {years.map((year) => (
//                   <button
//                     key={year}
//                     onClick={() => setSelectedYear(year)}
//                     className={`text-xs py-1 rounded cursor-pointer border transition-colors duration-150
//                     ${
//                       selectedYear === year
//                         ? "bg-[#7A0000] text-white border-[#7A0000]"
//                         : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
//                     }`}
//                     style={{ minWidth: "40px" }}
//                     type="button"
//                     aria-pressed={selectedYear === year}
//                   >
//                     {year}
//                   </button>
//                 ))}
//               </div>

//               <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
//               <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
//                 {months.map((month) => (
//                   <button
//                     key={month}
//                     onClick={() => setSelectedMonth(month)}
//                     className={`text-xs py-1 rounded cursor-pointer border transition-colors duration-150
//                     ${
//                       selectedMonth === month
//                         ? "bg-[#7A0000] text-white border-[#7A0000]"
//                         : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
//                     }`}
//                     style={{ minWidth: "50px" }}
//                     type="button"
//                     aria-pressed={selectedMonth === month}
//                   >
//                     {month}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={() => setSelectedDept(null)}
//                 className="bg-gray-500 text-white py-2 px-6 rounded hover:brightness-110 text-sm"
//                 type="button"
//               >
//                 Back to Departments
//               </button>
//               <button
//                 onClick={handleConfirm}
//                 className="bg-[#7A0000] text-white py-2 px-6 rounded hover:brightness-110 text-sm"
//                 type="button"
//               >
//                 Confirm Selection
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DepartmentModal;