import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface ProvinceStock {
  Province: string;
  QtyOnHand: number;
}

interface ProvinceChartSectionProps {
  provinceStocks: ProvinceStock[];
  provinceChartType: "donut" | "bar" | "pie";
  setProvinceChartType: (type: "donut" | "bar" | "pie") => void;
  PROVINCE_COLORS: string[];
  selectedRegion: string | null;
  allProvincesZero: boolean;
  provinceLoading: boolean;
  provinceError: string | null;
  renderProvinceTooltip: (props: any) => React.ReactElement | null;
}

const ProvinceChartSection: React.FC<ProvinceChartSectionProps> = ({
  provinceStocks,
  provinceChartType,
  setProvinceChartType,
  PROVINCE_COLORS,
  selectedRegion,
  allProvincesZero,
  provinceLoading,
  provinceError,
  renderProvinceTooltip
}) => (
  <div className="w-full md:w-1/2 flex flex-col md:flex-row gap-4">
    <div className="flex-1 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col min-h-[420px] relative">
      <div className="flex justify-between items-center mb-3 pb-1 border-b border-gray-100">
        <h3 className="text-[13px] font-semibold text-gray-700 tracking-tight flex items-center gap-2">
          Province Quantity On Hand
        </h3>
        <select
          value={provinceChartType}
          onChange={(e) => setProvinceChartType(e.target.value as "donut" | "bar" | "pie")}
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
            There is no material in stock for this material (province wise).
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
                          fill={PROVINCE_COLORS[index % PROVINCE_COLORS.length]}
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
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Province" fontSize={9} angle={-45} textAnchor="end" height={1} interval={0} />
                    <YAxis fontSize={11} />
                    <Tooltip content={renderProvinceTooltip} />
                    <Bar dataKey="QtyOnHand" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
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
                          fill={PROVINCE_COLORS[index % PROVINCE_COLORS.length]}
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
          {selectedRegion ? `${selectedRegion} Provinces` : "All Provinces"}
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
                backgroundColor: PROVINCE_COLORS[index % PROVINCE_COLORS.length],
              }}
            ></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 truncate" title={province.Province}>
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
);

export default ProvinceChartSection; 