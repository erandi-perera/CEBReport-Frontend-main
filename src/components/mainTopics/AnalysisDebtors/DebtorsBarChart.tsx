import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface BarData {
  name: string;
  'Month 01': number;
  'Month 02': number;
  'Month 03': number;
  'Month 04': number;
  isGovernment?: boolean;
}

interface DebtorsBarChartProps {
  data: BarData[];
  title: string;
  chartColors: string[];
  formatCurrency: (value: number | undefined) => string;
  CustomTooltip: React.FC<any>;
  showGovSeparator?: boolean;
}

const DebtorsBarChart: React.FC<DebtorsBarChartProps> = ({ data, title, chartColors, formatCurrency, CustomTooltip, showGovSeparator }) => {
  let lastGovIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i].isGovernment) {
      lastGovIndex = i;
    } else if (lastGovIndex >= 0) {
      break;
    }
  }
  return (
    <div className="mt-6 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="font-bold text-sm mb-3 text-center">{title}</div>
      <div className="flex justify-center">
        <div className="w-full" style={{ maxWidth: '800px', height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              barSize={30}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 10 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} layout="horizontal" verticalAlign="bottom" />
              {showGovSeparator && lastGovIndex >= 0 && lastGovIndex < data.length - 1 && (
                <ReferenceLine x={data[lastGovIndex].name} stroke="#000" strokeDasharray="3 3" label={{ value: 'Gov/Non-Gov', position: 'top', fill: '#333', fontSize: 10 }} />
              )}
              <Bar dataKey="Month 01" fill={chartColors[0]} name="1 Month" />
              <Bar dataKey="Month 02" fill={chartColors[1]} name="2 Months " />
              <Bar dataKey="Month 03" fill={chartColors[2]} name="3 Months " />
              <Bar dataKey="Month 04" fill={chartColors[3]} name="4 Months " />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DebtorsBarChart; 