import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { FaPrint, FaDownload, FaArrowLeft, FaCubes } from "react-icons/fa";
import ReportTable from "../../components/shared/ReportTable";
import type {
  MaterialStock,
  ProvinceStock,
  StockBalance,
} from "../../interfaces/materialTypes";

const REGION_COLORS = ["#1E40AF", "#059669", "#DC2626", "#7C3AED", "#EA580C"];
const PROVINCE_COLORS = [
  "#6366F1",
  "#06B6D4",
  "#22D3EE",
  "#F59E42",
  "#34D399",
  "#F43F5E",
  "#A78BFA",
  "#FBBF24",
  "#38BDF8",
  "#F87171",
  "#10B981",
  "#818CF8",
];
//map regions to provinces
const REGION_TO_PROVINCES: Record<string, string[]> = {
  DD1: ["NCP", "NWP", "PDR1", "NWP 2", "CC", "PROC", "PHMR1", "NP"],
  DD2: ["PDR2", "PHMR2", "CP2", "WPN", "EP", "CCR2", "CP"],
  DD3: ["PHMR3", "CCR3", "SABP", "WPSII", "UVAP"],
  DD4: ["LSSEP", "LSHP", "SP", "PHMR4", "SP2", "WPS1", "DGMPH"],
};
//map reagion id to region name
const mapRegionName = (region: string): string => {
  const regionMap: { [key: string]: string } = {
    DISCO1: "DD1",
    DISCO2: "DD2",
    DISCO3: "DD3",
    DISCO4: "DD4",
  };
  return regionMap[region] || region;
};
//chart cursor display details
const renderCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg text-xs border border-gray-200">
        <div className="font-medium">MatCd: {data.MatCd}</div>
        <div>Region: {mapRegionName(data.Region)}</div>
        <div className="font-semibold text-blue-600">
          Qty On Hand: {data.QtyOnHand}
        </div>
      </div>
    );
  }
  return null;
};
//province chart cursor display details
const renderProvinceTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg text-xs border border-gray-200">
        <div className="font-medium">MatCd: {data.MatCd}</div>
        <div>Province: {data.Province}</div>
        <div className="font-semibold text-purple-600">
          Qty On Hand: {data.QtyOnHand}
        </div>
      </div>
    );
  }
  return null;
};
// Main component for displaying material details use states
const MaterialDetails: React.FC = () => {
  const { matCd } = useParams<{ matCd: string }>();
  console.log("MaterialDetails component rendered with matCd:", matCd);
  console.log("Current URL:", window.location.href);

  const [materials, setMaterials] = useState<MaterialStock[]>([]);
  const [provinceStocks, setProvinceStocks] = useState<ProvinceStock[]>([]);
  const [allProvinceStocks, setAllProvinceStocks] = useState<ProvinceStock[]>(
    []
  );
  const [stockBalances, setStockBalances] = useState<StockBalance[]>([]);
  const [materialName, setMaterialName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [provinceLoading, setProvinceLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [provinceError, setProvinceError] = useState<string | null>(null);

  const [chartType, setChartType] = useState<"bar" | "donut" | "pie">("pie");
  const [provinceChartType, setProvinceChartType] = useState<
    "donut" | "bar" | "pie"
  >("pie");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  //get material details by matCd on region wise
  useEffect(() => {
    const fetchMaterial = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/misapi/api/materials/stocks/by-matcd/${matCd}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`
          );
        }
        const data = await response.json();
        let materialData: MaterialStock[] = [];
        if (Array.isArray(data)) {
          materialData = data;
        } else if (data.data && Array.isArray(data.data)) {
          materialData = data.data;
        } else if (data.result && Array.isArray(data.result)) {
          materialData = data.result;
        }
        setMaterials(materialData);
        if (materialData.length > 0) {
          setMaterialName(materialData[0].MatNm || null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch material details.");
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };
    if (matCd) fetchMaterial();
  }, [matCd]);
  //get province stocks by matCd on province wise
  useEffect(() => {
    const fetchProvinceStocks = async () => {
      setProvinceLoading(true);
      setProvinceError(null);
      try {
        const url = `/misapi/api/materials/stocks/by-matcd-province-wise/${matCd}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`
          );
        }
        const data = await response.json();
        let provinceData: ProvinceStock[] = [];
        if (Array.isArray(data)) {
          provinceData = data;
        } else if (data.data && Array.isArray(data.data)) {
          provinceData = data.data;
        } else if (data.result && Array.isArray(data.result)) {
          provinceData = data.result;
        }

        // Add region information to each province
        const provincesWithRegion = provinceData.map((province) => {
          const region =
            Object.entries(REGION_TO_PROVINCES).find(([_, provinces]) =>
              provinces.includes(province.Province)
            )?.[0] || "Unknown";
          return { ...province, Region: region };
        });

        setProvinceStocks(provincesWithRegion);
        setAllProvinceStocks(provincesWithRegion);
      } catch (err: any) {
        setProvinceError(err.message || "Failed to fetch province stocks");
        setProvinceStocks([]);
        setAllProvinceStocks([]);
      } finally {
        setProvinceLoading(false);
      }
    };
    if (matCd) fetchProvinceStocks();
  }, [matCd]);
  //get stock balances by matCd to display in table
  useEffect(() => {
    const fetchStockBalances = async () => {
   
      try {
        const url = `/misapi/api/materials/stock-balances?matCd=${matCd}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`
          );
        }
        const data = await response.json();
        let stockBalanceData: StockBalance[] = [];
        if (Array.isArray(data)) {
          stockBalanceData = data;
        } else if (data.data && Array.isArray(data.data)) {
          stockBalanceData = data.data;
        } else if (data.result && Array.isArray(data.result)) {
          stockBalanceData = data.result;
        }
        setStockBalances(stockBalanceData);
      } catch (err: any) {
 
        setStockBalances([]);
      } finally {
     
      }
    };
    if (matCd) fetchStockBalances();
  }, [matCd]);

  useEffect(() => {
    if (selectedRegion) {
      const filteredProvinces = allProvinceStocks.filter(
        (province) => province.Region === selectedRegion
      );
      setProvinceStocks(filteredProvinces);
    } else {
      setProvinceStocks(allProvinceStocks);
    }
  }, [selectedRegion, allProvinceStocks]);

  const handleRegionClick = (_: any, index: number) => {
    const region = materials[index].Region;
    const mappedRegion = mapRegionName(region);
    setSelectedRegion(selectedRegion === mappedRegion ? null : mappedRegion);
  };

  const clearRegionSelection = () => {
    setSelectedRegion(null);
  };

  const downloadAsCSV = () => {
    if (!stockBalances || stockBalances.length === 0) return;
    const csvRows = [
      [
        "Region",
        "Province",
        "Department",
        "Material Name",
        "Unit Price",
        "Committed Cost",
        "Reorder Qty",
        "UOM",
      ],
      ...stockBalances.map((balance) => [
        mapRegionName(balance.Region),
        balance.Province,
        balance.DeptId,
        balance.MatNm,
        balance.UnitPrice?.toString() ?? "",
        balance.CommittedCost?.toString() ?? "",
        balance.ReorderQty?.toString() ?? "",
        balance.UomCd,
      ]),
    ];
    const csvContent = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StockBalances_${matCd}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const allMaterialsZero =
    materials.length > 0 && materials.every((m) => m.QtyOnHand === 0);
  const allProvincesZero =
    provinceStocks.length > 0 && provinceStocks.every((p) => p.QtyOnHand === 0);

  if (loading)
    return (
      <div className="flex justify-center items-center py-8 text-blue-600">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded">
        Error: {error}
      </div>
    );

  return (
    <div
      className="max-w-5xl mx-auto p-4 bg-white rounded-lg shadow border border-gray-100 text-[11px] font-sans"
      ref={printRef}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/report/inventory")}
        className="mb-4 flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200 transition border border-gray-200"
      >
        <FaArrowLeft className="w-3 h-3" />
        Back to Inventory
      </button>

      {/* heading */}
      <div className="mb-8">
        <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white rounded-lg shadow-sm border border-gray-100 px-6 py-4 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 border border-blue-100 shadow-sm mr-3">
            <FaCubes className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="text-lg font-normal text-gray-800 tracking-tight leading-tight mb-0.5">
              Material Details Dashboard
            </h1>
            <div className="text-xs text-gray-500 font-medium truncate">
              {matCd && (
                <span className="mr-2">
                  Material Code:{" "}
                  <span className="text-gray-700 font-semibold">{matCd}</span>
                </span>
              )}
              {materialName && (
                <span className="mr-2">
                  | Name:{" "}
                  <span className="text-gray-700 font-semibold">
                    {materialName}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AllCharts Section */}
      {materials.length > 0 || provinceStocks.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Region-wise Chart + Details */}
          <div className="w-full md:w-1/2 flex flex-col md:flex-row gap-4">
            {/* Chart Card */}
            <div className="flex-1 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col min-h-[420px] relative">
              <div className="flex justify-between items-center mb-3 pb-1 border-b border-gray-100">
                <h3 className="text-[13px] font-semibold text-gray-700 tracking-tight flex items-center gap-2">
                  Region Quantity On Hand
                </h3>
                <select
                  value={chartType}
                  onChange={(e) =>
                    setChartType(e.target.value as "donut" | "bar" | "pie")
                  }
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="donut">Donut</option>
                  <option value="bar">Bar</option>
                  <option value="pie">Pie</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center">
                {allMaterialsZero ? (
                  <div className="flex items-center justify-center h-full text-red-500 font-semibold text-base">
                    There is no material in stock for this material (Region
                    Wise).
                  </div>
                ) : materials.length > 0 ? (
                  <div className="w-full h-[320px] flex items-center justify-center">
                    {chartType === "donut" && (
                      <div className="w-full h-full flex items-center justify-center bg-white/70 rounded-lg shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={materials}
                              dataKey="QtyOnHand"
                              nameKey="Region"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={110}
                              paddingAngle={0}
                              cornerRadius={0}
                              onClick={handleRegionClick}
                            >
                              {materials.map((_, index) => (
                                <Cell
                                  key={`donut-${index}`}
                                  fill={
                                    REGION_COLORS[index % REGION_COLORS.length]
                                  }
                                  stroke={
                                    selectedRegion ===
                                    mapRegionName(materials[index].Region)
                                      ? "#000"
                                      : "#fff"
                                  }
                                  strokeWidth={
                                    selectedRegion ===
                                    mapRegionName(materials[index].Region)
                                      ? 2
                                      : 1
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip content={renderCustomTooltip} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {chartType === "bar" && (
                      <div className="w-full h-full flex items-center justify-center bg-white/70 rounded-lg shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={materials}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            onClick={handleRegionClick}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="Region"
                              tickFormatter={mapRegionName}
                              fontSize={11}
                            />
                            <YAxis fontSize={11} />
                            <Tooltip content={renderCustomTooltip} />
                            <Bar
                              dataKey="QtyOnHand"
                              fill="#1E40AF"
                              radius={[4, 4, 0, 0]}
                              onClick={handleRegionClick}
                            >
                              {materials.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    REGION_COLORS[index % REGION_COLORS.length]
                                  }
                                  stroke={
                                    selectedRegion ===
                                    mapRegionName(entry.Region)
                                      ? "#000"
                                      : "#fff"
                                  }
                                  strokeWidth={
                                    selectedRegion ===
                                    mapRegionName(entry.Region)
                                      ? 2
                                      : 1
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {chartType === "pie" && (
                      <div className="w-full h-full flex items-center justify-center bg-white/70 rounded-lg shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={materials}
                              dataKey="QtyOnHand"
                              nameKey="Region"
                              cx="50%"
                              cy="50%"
                              outerRadius={110}
                              paddingAngle={0}
                              cornerRadius={0}
                              onClick={handleRegionClick}
                            >
                              {materials.map((_, index) => (
                                <Cell
                                  key={`pie-${index}`}
                                  fill={
                                    REGION_COLORS[index % REGION_COLORS.length]
                                  }
                                  stroke={
                                    selectedRegion ===
                                    mapRegionName(materials[index].Region)
                                      ? "#000"
                                      : "#fff"
                                  }
                                  strokeWidth={
                                    selectedRegion ===
                                    mapRegionName(materials[index].Region)
                                      ? 2
                                      : 1
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip content={renderCustomTooltip} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 italic">
                    No region data available
                  </div>
                )}
              </div>
            </div>
            {/* Region Data Table */}
            <div className="w-full md:w-[180px] bg-white rounded-xl shadow border border-gray-200 flex flex-col ml-0 md:ml-2 mt-4 md:mt-0 max-h-[420px] overflow-y-auto">
              <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-100 flex justify-between items-center z-10">
                <h4 className="text-xs font-semibold text-gray-600 tracking-wide">
                  Region Data
                </h4>
                {selectedRegion && (
                  <button
                    onClick={clearRegionSelection}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {materials.map((region, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 flex items-center hover:bg-blue-50 cursor-pointer transition-colors ${
                      selectedRegion === mapRegionName(region.Region)
                        ? "bg-blue-50"
                        : ""
                    }`}
                    onClick={() => {
                      const mappedRegion = mapRegionName(region.Region);
                      setSelectedRegion(
                        selectedRegion === mappedRegion ? null : mappedRegion
                      );
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-sm mr-2 flex-shrink-0 border border-gray-200"
                      style={{
                        backgroundColor:
                          REGION_COLORS[index % REGION_COLORS.length],
                      }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-medium text-gray-700 truncate"
                        title={mapRegionName(region.Region)}
                      >
                        {mapRegionName(region.Region)}
                        {selectedRegion === mapRegionName(region.Region) && (
                          <span className="ml-1 text-blue-600">(selected)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Qty: {region.QtyOnHand.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Province-wise Chart + Details */}
          <div className="w-full md:w-1/2 flex flex-col md:flex-row gap-4">
            {/* Chart Card */}
            <div className="flex-1 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col min-h-[420px] relative">
              <div className="flex justify-between items-center mb-3 pb-1 border-b border-gray-100">
                <h3 className="text-[13px] font-semibold text-gray-700 tracking-tight flex items-center gap-2">
                  Province Quantity On Hand
                </h3>
                <select
                  value={provinceChartType}
                  onChange={(e) =>
                    setProvinceChartType(
                      e.target.value as "donut" | "bar" | "pie"
                    )
                  }
                  className="px-2 py-1 text-xs bg-white border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="donut">Donut</option>
                  <option value="bar">Bar</option>
                  <option value="pie">Pie</option>
                </select>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center">
                {provinceLoading ? (
                  <div className="flex items-center justify-center h-full text-blue-600">
                    Loading province data...
                  </div>
                ) : provinceError ? (
                  <div className="flex items-center justify-center h-full text-red-600 text-xs p-4">
                    <div className="text-center">
                      <div className="mb-1">Error loading province data:</div>
                      <div className="text-red-500">{provinceError}</div>
                    </div>
                  </div>
                ) : allProvincesZero ? (
                  <div className="flex items-center justify-center h-full text-red-500 font-semibold text-base">
                    There is no material in stock for this material (province
                    wise).
                  </div>
                ) : provinceStocks.length > 0 ? (
                  <div className="w-full h-[320px] flex items-center justify-center">
                    {provinceChartType === "donut" && (
                      <div className="w-full h-full flex items-center justify-center bg-white/70 rounded-lg shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={provinceStocks}
                              dataKey="QtyOnHand"
                              nameKey="Province"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={110}
                              paddingAngle={0}
                              cornerRadius={0}
                            >
                              {provinceStocks.map((_, index) => (
                                <Cell
                                  key={`province-donut-${index}`}
                                  fill={
                                    PROVINCE_COLORS[
                                      index % PROVINCE_COLORS.length
                                    ]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip content={renderProvinceTooltip} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {provinceChartType === "bar" && (
                      <div className="w-full h-full flex items-center justify-center bg-white/70 rounded-lg shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={provinceStocks}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 100,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="Province"
                              fontSize={9}
                              angle={-45}
                              textAnchor="end"
                              height={1}
                              interval={0}
                            />
                            <YAxis fontSize={11} />
                            <Tooltip content={renderProvinceTooltip} />
                            <Bar
                              dataKey="QtyOnHand"
                              fill="#8B5CF6"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {provinceChartType === "pie" && (
                      <div className="w-full h-full flex items-center justify-center bg-white/70 rounded-lg shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={provinceStocks}
                              dataKey="QtyOnHand"
                              nameKey="Province"
                              cx="50%"
                              cy="50%"
                              outerRadius={110}
                              paddingAngle={0}
                              cornerRadius={0}
                            >
                              {provinceStocks.map((_, index) => (
                                <Cell
                                  key={`province-pie-${index}`}
                                  fill={
                                    PROVINCE_COLORS[
                                      index % PROVINCE_COLORS.length
                                    ]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip content={renderProvinceTooltip} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 italic">
                    No province data available
                  </div>
                )}
              </div>
            </div>
            {/* Province Data Table */}
            <div className="w-full md:w-[180px] bg-white rounded-xl shadow border border-gray-200 flex flex-col ml-0 md:ml-2 mt-4 md:mt-0 max-h-[420px] overflow-y-auto">
              <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-600 tracking-wide">
                  {selectedRegion
                    ? `${selectedRegion} Provinces`
                    : "All Provinces"}
                </h4>
              </div>
              <div className="divide-y divide-gray-100">
                {provinceStocks.map((province, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 flex items-center hover:bg-purple-50 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-sm mr-2 flex-shrink-0 border border-gray-200"
                      style={{
                        backgroundColor:
                          PROVINCE_COLORS[index % PROVINCE_COLORS.length],
                      }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-medium text-gray-700 truncate"
                        title={province.Province}
                      >
                        {province.Province}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Qty: {province.QtyOnHand.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500 mb-8">
          No chart data found for material code: {matCd}
        </div>
      )}

      {/* Stock Balances Table */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <div className="px-2 sm:px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
              <h3 className="text-[12px] sm:text-[13px] font-semibold text-gray-700">
                Stock Balances Of - {matCd}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={printPDF}
                  className="flex items-center gap-1 px-3 py-1.5 border border-blue-400 text-blue-700 bg-white rounded-md text-[11px] font-medium shadow-sm hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                >
                  <FaPrint className="w-3 h-3" /> Print PDF
                </button>
                <button
                  onClick={downloadAsCSV}
                  className="flex items-center gap-1 px-3 py-1.5 border border-green-400 text-green-700 bg-white rounded-md text-[11px] font-medium shadow-sm hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
                >
                  <FaDownload className="w-3 h-3" /> Download CSV
                </button>
              </div>
            </div>
            {stockBalances.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                <div className="flex">
                  <div className="text-gray-500 font-semibold mr-2">
                    Material Name:
                  </div>
                  <div className="text-gray-700">{stockBalances[0].MatNm}</div>
                </div>
                <div className="flex">
                  <div className="text-gray-500 font-semibold mr-2">
                    Unit Price:
                  </div>
                  <div className="text-gray-700">
                    {typeof stockBalances[0].UnitPrice === "number"
                      ? stockBalances[0].UnitPrice.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "-"}
                  </div>
                </div>
              </div>
            )}
          </div>
          <ReportTable
            columns={[
              { label: "Region", accessor: "Region" },
              { label: "Province", accessor: "Province" },
              { label: "Department", accessor: "DeptId" },
              {
                label: "Quantity On Hand",
                accessor: "CommittedCost",
                align: "right",
              },
              { label: "Reorder Qty", accessor: "ReorderQty", align: "right" },
              { label: "UOM", accessor: "UomCd" },
            ]}
            data={stockBalances}
            rowKey={(_, idx) => idx}
          />
        </div>
      </div>
    </div>
  );
};
export default MaterialDetails;
