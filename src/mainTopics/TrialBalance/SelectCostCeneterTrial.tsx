// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { FaEye, FaSearch, FaSyncAlt, FaArrowLeft } from "react-icons/fa";

// interface Department {
//   DeptId: string;
//   DeptName: string;
// }

// const SelectCostCenterTrial: React.FC = () => {
//   const { compId } = useParams<{ compId: string }>();
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [filtered, setFiltered] = useState<Department[]>([]);
//   const [searchId, setSearchId] = useState("");
//   const [searchName, setSearchName] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const navigate = useNavigate();

//   const maroon = "text-[#7A0000]";
//   const maroonBg = "bg-[#7A0000]";
//   const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

//   useEffect(() => {
//     const fetchDepartments = async () => {
//       setLoading(true);
//       try {
//         const res = await fetch(`/misapi/api/trialbalance/departments/${compId}`);
//         const txt = await res.text();
//         const parsed = JSON.parse(txt);
//         const list = Array.isArray(parsed) ? parsed : parsed.data || [];
//         setDepartments(list);
//         setFiltered(list);
//         setLastUpdated(new Date());
//       } catch (e: any) {
//         setError(e.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (compId) fetchDepartments();
//   }, [compId]);

//   useEffect(() => {
//     const f = departments.filter(d =>
//       (!searchId || d.DeptId.toLowerCase().includes(searchId.toLowerCase())) &&
//       (!searchName || d.DeptName.toLowerCase().includes(searchName.toLowerCase()))
//     );
//     setFiltered(f);
//   }, [searchId, searchName, departments]);

//   const clearFilters = () => {
//     setSearchId("");
//     setSearchName("");
//   };

//   const handleBack = () => {
//     navigate(-1);
//   };

//   const viewDepartmentDetails = (deptId: string) => {
//     console.log("View department details:", deptId);
//   };

//   return (
//     <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center">
//           <button
//             onClick={handleBack}
//             className="mr-3 flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200 transition border border-gray-200"
//           >
//             <FaArrowLeft className="w-3 h-3" /> Back
//           </button>
//           <h2 className={`text-xl font-bold ${maroon}`}>
//             Departments under Cost Center: {compId}
//             <span className="ml-2 text-xs text-gray-500">(Total: {filtered.length})</span>
//           </h2>
//         </div>
//         {lastUpdated && (
//           <p className="text-[10px] text-gray-400">Last updated: {lastUpdated.toLocaleString()}</p>
//         )}
//       </div>

//       <div className="flex flex-wrap gap-3 justify-end mb-4">
//         {[
//           { val: searchId, set: setSearchId, ph: "Search by ID" },
//           { val: searchName, set: setSearchName, ph: "Search by Name" }
//         ].map((f, i) => (
//           <div key={i} className="relative">
//             <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
//             <input
//               type="text"
//               value={f.val}
//               placeholder={f.ph}
//               onChange={e => f.set(e.target.value)}
//               className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition"
//             />
//           </div>
//         ))}
//         {(searchId || searchName) && (
//           <button
//             onClick={clearFilters}
//             className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
//           >
//             <FaSyncAlt className="w-3 h-3" /> Clear
//           </button>
//         )}
//       </div>

//       {loading ? (
//         <div className={`text-center py-8 ${maroon} text-sm animate-pulse`}>Loading...</div>
//       ) : error ? (
//         <div className="text-red-700 bg-red-100 border border-red-300 p-4 rounded text-sm">Error: {error}</div>
//       ) : filtered.length === 0 ? (
//         <div className="text-red-700 bg-red-100 border border-red-300 p-4 rounded text-center">
//           No departments found under this cost center.
//         </div>
//       ) : (
//         <div className="overflow-x-auto rounded-lg border border-gray-200">
//           <div className="max-h-80 overflow-y-auto">
//             <table className="w-full table-fixed text-left text-gray-700 text-sm">
//               <thead className={`${maroonBg} text-white sticky top-0 z-10`}>
//                 <tr>
//                   <th className="px-4 py-2 w-1/4">Dept ID</th>
//                   <th className="px-4 py-2 w-1/2">Dept Name</th>
//                   <th className="px-4 py-2 w-1/4 text-center">Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map(({ DeptId, DeptName }, i) => (
//                   <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
//                     <td className="px-4 py-2 truncate">{DeptId}</td>
//                     <td className="px-4 py-2 truncate">{DeptName}</td>
//                     <td className="px-4 py-2 text-center">
//                       <button
//                         onClick={() => viewDepartmentDetails(DeptId)}
//                         className={`px-3 py-1 ${maroonGrad} text-white rounded-md text-xs font-medium hover:brightness-110 transition shadow`}
//                       >
//                         <FaEye className="inline-block mr-1 w-3 h-3" /> View
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SelectCostCenterTrial;
