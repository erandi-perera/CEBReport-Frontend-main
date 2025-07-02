import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
} from "recharts";

type Props = {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  name: string;
  unit?: string;
};

const CustomAreaChart = ({
  data,
  dataKey,
  xAxisKey,
  name,
 
}: Props) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: "#333" }} />
        <YAxis
          domain={[0, "dataMax + 50"]}
          tick={{ fontSize: 12, fill: "#333" }}
        />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke="#007bff"
          fill="#b3d7ff"
          fillOpacity={0.4}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

export default CustomAreaChart;
