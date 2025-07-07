// import React from "react";
// import { FaTimes } from "react-icons/fa";
// import TrialBalanceTable from "./TrialBalanceTable";

// interface TrialBalanceModalProps {
//   open: boolean;
//   onClose: () => void;
//   costctr: string;
//   year: number;
//   month: string;
//   deptName: string;
// }

// const TrialBalanceModal: React.FC<TrialBalanceModalProps> = ({
//   open,
//   onClose,
//   costctr,
//   year,
//   month,
//   deptName,
// }) => {
//   const maroon = "text-[#7A0000]";
//   const maroonBg = "bg-[#7A0000]";

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white w-full max-w-6xl rounded-xl shadow-xl border border-gray-200 max-h-[90vh] flex flex-col">
//         <div className="flex justify-between items-center p-4 border-b">
//           <h3 className={`text-lg font-bold ${maroon}`}>
//             Trial Balance for {deptName} ({costctr}) - {month} {year}
//           </h3>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-red-500"
//             aria-label="Close modal"
//           >
//             <FaTimes className="w-5 h-5" />
//           </button>
//         </div>
        
//         <div className="p-4 overflow-y-auto flex-grow">
//           <TrialBalanceTable costctr={costctr} year={year} month={month} />
//         </div>
        
//         <div className="p-4 border-t flex justify-end">
//           <button
//             onClick={onClose}
//             className={`px-4 py-2 ${maroonBg} text-white rounded hover:brightness-110`}
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TrialBalanceModal;