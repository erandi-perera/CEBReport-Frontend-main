import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
} from "recharts";

type Props = {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  name: string;
  unit?: string;
};

const CustomBarChart = ({
  data,
  dataKey,
  xAxisKey,
  name,

}: Props) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
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
        <Bar dataKey={dataKey} name={name} fill="#00bfae" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default CustomBarChart;
