import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PieData {
  name: string;
  value: number;
}

interface DebtorsPieChartProps {
  data: PieData[];
  title: string;
  chartColors: string[];
  formatCurrency: (value: number | undefined) => string;
}

const DebtorsPieChart: React.FC<DebtorsPieChartProps> = ({ data, title, chartColors, formatCurrency }) => (
  <div className="mt-6 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
    <div className="font-bold text-sm mb-3 text-center">{title}</div>
    <div className="flex justify-center">
      <div className="w-full" style={{ maxWidth: '600px', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} layout="horizontal" verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default DebtorsPieChart; 