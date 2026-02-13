import React from "react";
import CustomButton from "../../shared/Button";
import ReportTable from "../../shared/ReportTable";


interface AgeCategoryData {
  Age_0_1: number;
  Age_1_2: number;
  Age_2_3: number;
  Age_3_4: number;
  Age_4_5: number;
  Age_5_6: number;
  Age_6_7: number;
  Age_7_8: number;
  Age_Above_8: number;
  AgreementDateNull: number;
  ErrorMessage: string | null;
}

interface SolaAgeAnalysisTableProps {
  ageCategoryData: AgeCategoryData | null;
  onViewCategory: (category: string) => void;
  areaName?: string;
}

const SolaAgeAnalysisTable: React.FC<SolaAgeAnalysisTableProps> = ({
  ageCategoryData,
  onViewCategory,
  areaName,
}) => {
  const totals = React.useMemo(() => {
    if (!ageCategoryData) return null;

    return {
      totalCount:
        ageCategoryData.Age_0_1 +
        ageCategoryData.Age_1_2 +
        ageCategoryData.Age_2_3 +
        ageCategoryData.Age_3_4 +
        ageCategoryData.Age_4_5 +
        ageCategoryData.Age_5_6 +
        ageCategoryData.Age_6_7 +
        ageCategoryData.Age_7_8 +
        ageCategoryData.Age_Above_8 +
        ageCategoryData.AgreementDateNull,
    };
  }, [ageCategoryData]);

  const buildRow = (label: string, value: number) => ({
    category: label,
    count: value,
    actions: (
      <div className="flex justify-center">
        <CustomButton
          color="bg-blue-600 hover:bg-blue-700"
          onClick={() => onViewCategory(label)}
          className="text-xs px-4 py-1 rounded-md shadow-sm min-w-[70px]"
        >
          View
        </CustomButton>
      </div>
    ),
  });

  const hasData = ageCategoryData && totals && totals.totalCount > 0;

  const tableData = ageCategoryData
    ? [
        buildRow("0-1 Years", ageCategoryData.Age_0_1),
        buildRow("1-2 Years", ageCategoryData.Age_1_2),
        buildRow("2-3 Years", ageCategoryData.Age_2_3),
        buildRow("3-4 Years", ageCategoryData.Age_3_4),
        buildRow("4-5 Years", ageCategoryData.Age_4_5),
        buildRow("5-6 Years", ageCategoryData.Age_5_6),
        buildRow("6-7 Years", ageCategoryData.Age_6_7),
        buildRow("7-8 Years", ageCategoryData.Age_7_8),
        buildRow("Above 8 Years", ageCategoryData.Age_Above_8),
        buildRow("Agreement Date Null", ageCategoryData.AgreementDateNull),
        {
          category: "Total",
          count: totals?.totalCount || 0,
          actions: <div className="text-center text-gray-400">—</div>,
        },
      ]
    : [];

  const tableColumns = [
    { label: "Age Category", accessor: "category", align: "left" as const },
    { label: "Customer Count", accessor: "count", align: "right" as const },
    {
      label: "Actions",
      accessor: "actions",
      align: "center" as const,
      width: "120px",
    },
  ];

  if (!ageCategoryData || !hasData) {
    return (
      <div className="text-center text-gray-500 py-10 border rounded-lg bg-gray-50">
        No data available for Age Analysis for solar customers.
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-xl shadow border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-[#7A0000] mb-1">
        Solar Age Analysis Summary
      </h3>

      {areaName && (
        <p className="text-sm text-gray-600 mb-4">
          Area : <span className="font-semibold">{areaName}</span>
        </p>
      )}

      <ReportTable
        columns={tableColumns}
        data={tableData}
        emptyMessage="No data available"
      />
    </div>
  );
};

export default SolaAgeAnalysisTable;
