import React, { useEffect, useState } from "react";

interface Area {
  AreaCode: string;
  AreaName: string;
  ErrorMessage?: string | null;
}

interface BillCycleModel {
  MaxBillCycle: string;
  BillCycles: string[];
  ErrorMessage?: string | null;
}


interface ApiResponse<T> {
  data: T;
  errorMessage: string | null;
}

const AgeAnalysis: React.FC = () => {
  const maroon = "text-[#7A0000]";
  const fontFamily = "font-sans";

  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [billCycles, setBillCycles] = useState<string[]>([]);
  const [selectedBillCycle, setSelectedBillCycle] = useState<string>("");
  const [selectedCustType, setSelectedCustType] = useState<string>("A");
  // Removed unused customerDescription state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const areaRes = await fetch("/debtorsage/api/areas");
        const areaJson: ApiResponse<Area[]> = await areaRes.json();
        const areaData = areaJson.data || [];
        setAreas(areaData);
        if (areaData.length > 0) setSelectedArea(areaData[0].AreaCode);

        const maxCycleRes = await fetch("/debtorsage/api/billcycle/max");
        const maxCycleJson: ApiResponse<BillCycleModel> = await maxCycleRes.json();

        if (maxCycleJson.data && maxCycleJson.data.BillCycles.length > 0) {
          setBillCycles(maxCycleJson.data.BillCycles);
          setSelectedBillCycle(maxCycleJson.data.BillCycles[0]);
        } else {
          setBillCycles([]);
          setSelectedBillCycle("");
        }
      } catch (err: any) {
        setError("Error loading data: " + (err.message || err.toString()));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Removed useEffect for fetching customerDescription since it's unused

  const isAllSelected = selectedArea && selectedBillCycle && selectedCustType;

  if (loading) {
    return (
      <div className={`text-center py-8 ${maroon} text-sm animate-pulse ${fontFamily}`}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-100 border border-red-300 p-4 rounded text-sm">
        Error: {error}
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm ${fontFamily}`}>
      <h2 className={`text-xl font-bold mb-6 ${maroon}`}>Age Analysis</h2>

      <div className="flex flex-wrap gap-8 items-center">
        {/* Area Dropdown */}
        <div className="flex flex-col w-64">
          <label className={`${maroon} text-sm font-medium mb-1`}>Select Area:</label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#7A0000] shadow-sm"
          >
            {areas.map((area) => (
              <option key={area.AreaCode} value={area.AreaCode}>
                {area.AreaName} ({area.AreaCode})
              </option>
            ))}
          </select>
        </div>

        {/* Bill Cycle Dropdown */}
        <div className="flex flex-col w-64">
          <label className={`${maroon} text-sm font-medium mb-1`}>Select Bill Cycle:</label>
          <select
            value={selectedBillCycle}
            onChange={(e) => setSelectedBillCycle(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#7A0000] shadow-sm"
          >
            {billCycles.map((cycle) => (
              <option key={cycle} value={cycle}>
                {cycle}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Type Dropdown */}
        <div className="flex flex-col w-96">
          <label className={`${maroon} text-sm font-medium mb-1`}>Select Customer Type:</label>
          <select
            value={selectedCustType}
            onChange={(e) => setSelectedCustType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#7A0000] mb-1 shadow-sm"
          >
            <option value="A">Active</option>
            <option value="G">Government</option>
            <option value="F">Finalized</option>
          </select>
        </div>
      </div>

      {/* View Report Button */}
      <div className="w-full mt-6 flex justify-end">
        <button
          onClick={() => console.log("View Report clicked")}
          disabled={!isAllSelected}
          className={`
            px-6 py-2 rounded-md font-medium transition-opacity duration-300 shadow
            ${isAllSelected
              ? "bg-[#7A0000] text-white opacity-100 hover:bg-[#5c0000]"
              : "opacity-0 pointer-events-none"}
          `}
        >
          View Report
        </button>
      </div>
    </div>
  );
};

export default AgeAnalysis;
