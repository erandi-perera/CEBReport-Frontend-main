import React, { useState } from "react";
import axios from "axios";
import {
  ORDINARY_SALES_API,
  BULK_SALES_API,
} from "../../services/BackendServices";
import SalesForm from "../../components/mainTopics/general/SalesForm";
import SalesReportTable from "../../components/mainTopics/general/SalesReportTable";

const SalesReports: React.FC = () => {
  const [formData, setFormData] = useState<{
    billCycle: number;
    customerType: "ordinary" | "bulk";
  }>({
    billCycle: 0,
    customerType: "ordinary",
  });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (details: {
    billCycle: number;
    customerType: "ordinary" | "bulk";
  }) => {
    setFormData(details);
    setLoading(true);
    setError(null);
    setData([]);

    try {
      let response;
      if (details.customerType === "ordinary") {
        response = await axios.post(ORDINARY_SALES_API, {
          billCycle: details.billCycle,
        });
        setData(response.data.OrdList || []);
      } else {
        response = await axios.post(BULK_SALES_API, {
          billCycle: details.billCycle,
        });
        setData(response.data.BulkList || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch sales data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 sm:p-2 md:p-1 w-full max-w-[2000px] mx-auto">
      <div className="mb-6">
        <p className="text-gray-600 text-sm">
          Generate sales reports for ordinary and bulk customers
        </p>
      </div>

      <div className="w-full flex flex-col gap-2 sm:gap-4 text-sm mb-6">
        <SalesForm onSubmit={handleFormSubmit} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <SalesReportTable
          data={data}
          title={
            formData.customerType === "ordinary"
              ? "Ordinary Sales Report"
              : "Bulk Sales Report"
          }
          loading={loading}
        />
      </div>
    </div>
  );
};

export default SalesReports;
