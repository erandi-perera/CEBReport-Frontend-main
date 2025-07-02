import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
} from "recharts";

type Props = {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  name: string;
  unit?: string;
};

const CustomLineChart = ({
  data,
  dataKey,
  xAxisKey,
  name,
 
}: Props) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
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
        <Line
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke="#007bff"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default CustomLineChart;
