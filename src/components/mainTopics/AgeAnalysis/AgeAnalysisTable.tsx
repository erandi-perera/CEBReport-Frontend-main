import React from 'react';
import { Debtor, FormData, Area, BillCycleOption } from './types';
import { formatCurrency, getFullName, getFullAddress } from './utils';

interface AgeAnalysisTableProps {
  debtors: Debtor[];
  formData: FormData;
  areas: Area[];
  billCycleOptions: BillCycleOption[];
  reportLoading: boolean;
  reportError: string | null;
}

const AgeAnalysisTable: React.FC<AgeAnalysisTableProps> = ({
  debtors,
  formData,
  reportLoading,
  reportError
}) => {
  if (!debtors.length && !reportLoading && !reportError) return null;

  const renderTableHeaders = () => {
    const baseHeaders = [
      "Account Number",
      "Name", 
      "Address",
      "Tariff",
      "Outstanding Balance"
    ];

    let additionalHeaders: string[] = [];

    if (formData.timePeriod === "0-6") {
      additionalHeaders = [
        "Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"
      ];
    } else if (formData.timePeriod === "7-12") {
      additionalHeaders = [
        "7 Months", "8 Months", "9 Months", "10 Months", "11 Months", "12 Months"
      ];
    } else if (formData.timePeriod === "1-2") {
      additionalHeaders = ["1-2 Years"];
    } else if (formData.timePeriod === "2-3") {
      additionalHeaders = ["2-3 Years"];
    } else if (formData.timePeriod === "3-4") {
      additionalHeaders = ["3-4 Years"];
    } else if (formData.timePeriod === "4-5") {
      additionalHeaders = ["4-5 Years"];
    } else if (formData.timePeriod === ">5") {
      additionalHeaders = ["5+ Years"];
    } else if (formData.timePeriod === "All") {
      additionalHeaders = [
        "0-6 Months", "7-12 Months", "1-2 Years", "2-3 Years", 
        "3-4 Years", "4-5 Years", "5+ Years"
      ];
    }

    return [...baseHeaders, ...additionalHeaders];
  };

  const renderTableRow = (debtor: Debtor, _index?: number) => {
    const baseCells = [
      debtor.AccountNumber,
      getFullName(debtor),
      getFullAddress(debtor),
      debtor.TariffCode,
      formatCurrency(debtor.OutstandingBalance)
    ];

    let additionalCells: string[] = [];

    if (formData.timePeriod === "0-6") {
      additionalCells = [
        formatCurrency(debtor.Month0),
        formatCurrency(debtor.Month1),
        formatCurrency(debtor.Month2),
        formatCurrency(debtor.Month3),
        formatCurrency(debtor.Month4),
        formatCurrency(debtor.Month5)
      ];
    } else if (formData.timePeriod === "7-12") {
      additionalCells = [
        formatCurrency(debtor.Months7_9),
        formatCurrency(debtor.Months7_9),
        formatCurrency(debtor.Months7_9),
        formatCurrency(debtor.Months10_12),
        formatCurrency(debtor.Months10_12),
        formatCurrency(debtor.Months10_12)
      ];
    } else if (formData.timePeriod === "1-2") {
      additionalCells = [formatCurrency(debtor.Months13_24)];
    } else if (formData.timePeriod === "2-3") {
      additionalCells = [formatCurrency(debtor.Months25_36)];
    } else if (formData.timePeriod === "3-4") {
      additionalCells = [formatCurrency(debtor.Months37_48)];
    } else if (formData.timePeriod === "4-5") {
      additionalCells = [formatCurrency(debtor.Months49_60)];
    } else if (formData.timePeriod === ">5") {
      additionalCells = [formatCurrency(debtor.Months61Plus)];
    } else if (formData.timePeriod === "All") {
      additionalCells = [
        formatCurrency(debtor.Month0 + debtor.Month1 + debtor.Month2 + 
                      debtor.Month3 + debtor.Month4 + debtor.Month5 + debtor.Month6),
        formatCurrency(debtor.Months7_9 + debtor.Months10_12),
        formatCurrency(debtor.Months13_24),
        formatCurrency(debtor.Months25_36),
        formatCurrency(debtor.Months37_48),
        formatCurrency(debtor.Months49_60),
        formatCurrency(debtor.Months61Plus)
      ];
    }

    return [...baseCells, ...additionalCells];
  };

  const headers = renderTableHeaders();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header, index) => (
              <th 
                key={index} 
                className="border border-gray-300 px-2 py-1 text-left sticky top-0 bg-gray-100"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {debtors.map((debtor, index) => {
            const cells = renderTableRow(debtor, index);
            return (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {cells.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex} 
                    className={`border border-gray-300 px-2 py-1 ${
                      cellIndex >= 4 ? 'text-right' : ''
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AgeAnalysisTable; 