import React from "react";

interface Column {
  label: string;
  accessor: string;
  className?: string;
  format?: (value: number | undefined) => string;
}

interface DebtorSummary {
  [key: string]: any;
}

interface DebtorsTableProps {
  data: DebtorSummary[];
  columns: Column[];
  totalRow?: DebtorSummary | null;
  // formatCurrency: (value: number | undefined) => string;
  title?: string;
  tableKeyPrefix: string;
}

const DebtorsTable: React.FC<DebtorsTableProps> = ({
  data,
  columns,
  totalRow,
  title,
  tableKeyPrefix,
}) => (
  <div className="w-full overflow-x-auto">
    {title && <div className="font-bold text-[13px] mb-2">{title}</div>}

    <table className="min-w-full table-fixed border-collapse">
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th
              key={`${tableKeyPrefix}-th-${idx}`}
              className={`px-4 py-2 border-b border-gray-200 bg-gray-50 text-[12px] font-medium text-gray-500 uppercase tracking-wider ${col.className || "text-left"}`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, rowIdx) => (
          <tr
            key={`${tableKeyPrefix}-${rowIdx}`}
            className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}
          >
            {columns.map((col, colIdx) => (
              <td
                key={`${tableKeyPrefix}-${rowIdx}-${colIdx}`}
                className={`px-4 py-2 whitespace-nowrap text-[12px] ${col.className || "text-left"}`}
              >
                {col.format
                  ? typeof row[col.accessor] === "number"
                    ? col.format(row[col.accessor])
                    : col.format(undefined)
                  : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}

        {totalRow && (
          <tr className="bg-gray-100 font-bold">
            <td className="px-4 py-2 text-left text-[12px]">Total</td>
            {columns.slice(1).map((col, idx) => (
              <td
                key={`total-${idx}`}
                className={`px-4 py-2 text-[12px] text-right ${col.className || ""}`}
              >
                {col.format
                  ? typeof totalRow[col.accessor] === "number"
                    ? col.format(totalRow[col.accessor])
                    : col.format(undefined)
                  : totalRow[col.accessor]}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default DebtorsTable;
