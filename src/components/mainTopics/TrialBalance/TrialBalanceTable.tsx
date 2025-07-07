// import React, { useEffect, useState } from "react";

// interface TrialBalanceTableProps {
//   costctr: string;
//   year: number;
//   month: string;
// }

// interface TrialBalanceData {
//   AccountCode: string;
//   Description: string;
//   OpeningBalance: number;
//   DrAmount: number;
//   CrAmount: number;
//   ClosingBalance: number;
// }

// const TrialBalanceTable: React.FC<TrialBalanceTableProps> = ({ costctr, year, month }) => {
//   const maroonBg = "bg-[#7A0000]";
//   const maroonText = "text-[#7A0000]";
  
//   const [data, setData] = useState<TrialBalanceData[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   const monthToNumber = (monthName: string): number => {
//     const months = [
//       "January", "February", "March", "April", "May", "June",
//       "July", "August", "September", "October", "November", "December",
//       "13th Period",
//     ];
    
//     if (monthName === "13th Period") return 13;
    
//     const monthIndex = months.indexOf(monthName);
//     return monthIndex >= 0 && monthIndex < 12 ? monthIndex + 1 : 1;
//   };

//   useEffect(() => {
//     if (!costctr || !year || !month) return;

//     const fetchTrialBalanceData = async () => {
//       setLoading(true);
//       setError(null);
//       setData([]);

//       try {
//         const monthNum = monthToNumber(month);
//         const apiUrl = `/misapi/api/trialbalance/${costctr}/${year}/${monthNum}`;
        
//         const response = await fetch(apiUrl);
        
//         if (!response.ok) {
//           throw new Error(`API error: ${response.status} ${response.statusText}`);
//         }
        
//         const jsonData = await response.json();
        
//         let trialBalanceArray: TrialBalanceData[] = [];
        
//         if (Array.isArray(jsonData)) {
//           trialBalanceArray = jsonData;
//         } else if (jsonData.data && Array.isArray(jsonData.data)) {
//           trialBalanceArray = jsonData.data;
//         } else if (jsonData.result && Array.isArray(jsonData.result)) {
//           trialBalanceArray = jsonData.result;
//         } else {
//           console.warn('Unexpected API response structure:', jsonData);
//           trialBalanceArray = [];
//         }
        
//         const formattedData: TrialBalanceData[] = trialBalanceArray.map((item: any) => ({
//           AccountCode: item.AccountCode || item.accountCode || '',
//           Description: item.Description || item.description || '',
//           OpeningBalance: parseFloat(item.OpeningBalance || item.openingBalance || '0'),
//           DrAmount: parseFloat(item.DrAmount || item.drAmount || '0'),
//           CrAmount: parseFloat(item.CrAmount || item.crAmount || '0'),
//           ClosingBalance: parseFloat(item.ClosingBalance || item.closingBalance || '0'),
//         }));
        
//         setData(formattedData);
        
//       } catch (error: any) {
//         console.error('Error fetching trial balance:', error);
//         setError(error.message || 'Failed to load trial balance data');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTrialBalanceData();
//   }, [costctr, year, month]);

//   // Calculate totals
//   const totals = data.reduce(
//     (acc, row) => ({
//       opening: acc.opening + (row.OpeningBalance || 0),
//       debit: acc.debit + (row.DrAmount || 0),
//       credit: acc.credit + (row.CrAmount || 0),
//       closing: acc.closing + (row.ClosingBalance || 0),
//     }),
//     { opening: 0, debit: 0, credit: 0, closing: 0 }
//   );

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-8">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mr-3"></div>
//         <span className={`${maroonText} text-sm`}>Loading trial balance...</span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
//         <strong>Error:</strong> {error}
//       </div>
//     );
//   }

//   if (data.length === 0) {
//     return (
//       <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded-lg text-sm">
//         No trial balance data found for the selected criteria.
//       </div>
//     );
//   }

//   return (
//     <div className="overflow-x-auto max-w-full border border-gray-200 rounded-lg">
//       <table className="min-w-full text-sm text-gray-700 divide-y divide-gray-200">
//         <thead className={`${maroonBg} text-white`}>
//           <tr>
//             <th className="px-4 py-3 text-left font-medium">Account Code</th>
//             <th className="px-4 py-3 text-left font-medium">Description</th>
//             <th className="px-4 py-3 text-right font-medium">Opening Balance</th>
//             <th className="px-4 py-3 text-right font-medium">Debit Amount</th>
//             <th className="px-4 py-3 text-right font-medium">Credit Amount</th>
//             <th className="px-4 py-3 text-right font-medium">Closing Balance</th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//           {data.map((row, index) => (
//             <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
//               <td className="px-4 py-3 truncate font-mono text-xs">{row.AccountCode}</td>
//               <td className="px-4 py-3 truncate">{row.Description}</td>
//               <td className="px-4 py-3 text-right font-mono">
//                 {row.OpeningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//               </td>
//               <td className="px-4 py-3 text-right font-mono">
//                 {row.DrAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//               </td>
//               <td className="px-4 py-3 text-right font-mono">
//                 {row.CrAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//               </td>
//               <td className="px-4 py-3 text-right font-mono">
//                 {row.ClosingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//         <tfoot className={`${maroonBg} text-white font-semibold`}>
//           <tr>
//             <td className="px-4 py-3 text-left" colSpan={2}>
//               <strong>Total ({data.length} accounts)</strong>
//             </td>
//             <td className="px-4 py-3 text-right font-mono">
//               {totals.opening.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </td>
//             <td className="px-4 py-3 text-right font-mono">
//               {totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </td>
//             <td className="px-4 py-3 text-right font-mono">
//               {totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </td>
//             <td className="px-4 py-3 text-right font-mono">
//               {totals.closing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//             </td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   );
// };

// export default TrialBalanceTable;