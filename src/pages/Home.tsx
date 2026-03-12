import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, CreditCard, Sun, Zap } from "lucide-react";

// ── Mock Data (Bill Cycle 448 · March 2026) ──────────────────────────────────

const ordinaryCustomers = 245_670;
const bulkCustomers     = 12_845;

const solarOrdinary = { netMetering: 3240, netAccounting: 1567, netPlus: 892, netPlusPlus: 445 };
const solarBulk     = { netMetering: 234,  netAccounting: 87,   netPlus: 45,  netPlusPlus: 22  };
const totalSolarOrdinary = Object.values(solarOrdinary).reduce((s, v) => s + v, 0);
const totalSolarBulk     = Object.values(solarBulk).reduce((s, v) => s + v, 0);
const totalSolar         = totalSolarOrdinary + totalSolarBulk;

const zeroConsumptionData = [
  { month: "Jan 2026", count: 1245 },
  { month: "Feb 2026", count: 1387 },
  { month: "Mar 2026", count: 1156 },
];

const top10Customers = [
  { rank: 1,  id: "B001234", name: "Lanka IOC (Pvt) Ltd",         type: "Bulk",     units: 485_200, amount: 24_500_000 },
  { rank: 2,  id: "B002345", name: "Ceylon Steel Corporation",     type: "Bulk",     units: 412_800, amount: 20_800_000 },
  { rank: 3,  id: "B003456", name: "Sri Lanka Telecom PLC",        type: "Bulk",     units: 356_900, amount: 18_200_000 },
  { rank: 4,  id: "B004567", name: "John Keells Holdings",         type: "Bulk",     units: 298_700, amount: 15_400_000 },
  { rank: 5,  id: "B005678", name: "Dialog Axiata PLC",            type: "Bulk",     units: 245_600, amount: 12_700_000 },
  { rank: 6,  id: "O112345", name: "Colombo Port Authority",       type: "Ordinary", units: 198_400, amount: 10_100_000 },
  { rank: 7,  id: "B006789", name: "Hayleys PLC",                  type: "Bulk",     units: 187_300, amount: 9_600_000  },
  { rank: 8,  id: "B007890", name: "Distilleries Co. of SL",       type: "Bulk",     units: 165_200, amount: 8_500_000  },
  { rank: 9,  id: "O223456", name: "National Water Supply Board",  type: "Ordinary", units: 142_800, amount: 7_300_000  },
  { rank: 10, id: "B008901", name: "LOLC Holdings PLC",            type: "Bulk",     units: 128_500, amount: 6_600_000  },
];

const salesCollectionData = [
  { month: "Mar'25", ordinary: 748,  bulk: 3180 },
  { month: "Apr'25", ordinary: 762,  bulk: 3240 },
  { month: "May'25", ordinary: 785,  bulk: 3310 },
  { month: "Jun'25", ordinary: 771,  bulk: 3290 },
  { month: "Jul'25", ordinary: 803,  bulk: 3420 },
  { month: "Aug'25", ordinary: 816,  bulk: 3480 },
  { month: "Sep'25", ordinary: 790,  bulk: 3350 },
  { month: "Oct'25", ordinary: 821,  bulk: 3510 },
  { month: "Nov'25", ordinary: 838,  bulk: 3570 },
  { month: "Dec'25", ordinary: 865,  bulk: 3680 },
  { month: "Jan'26", ordinary: 852,  bulk: 3620 },
  { month: "Feb'26", ordinary: 831,  bulk: 3540 },
  { month: "Mar'26", ordinary: 858,  bulk: 3600 },
];

const newCustomersData = [
  { month: "Mar'25", ordinary: 1245, bulk: 34 },
  { month: "Apr'25", ordinary: 1380, bulk: 28 },
  { month: "May'25", ordinary: 1520, bulk: 35 },
  { month: "Jun'25", ordinary: 1290, bulk: 31 },
  { month: "Jul'25", ordinary: 1455, bulk: 42 },
  { month: "Aug'25", ordinary: 1610, bulk: 38 },
  { month: "Sep'25", ordinary: 1345, bulk: 29 },
  { month: "Oct'25", ordinary: 1490, bulk: 36 },
  { month: "Nov'25", ordinary: 1720, bulk: 45 },
  { month: "Dec'25", ordinary: 1850, bulk: 52 },
  { month: "Jan'26", ordinary: 1680, bulk: 40 },
  { month: "Feb'26", ordinary: 1540, bulk: 37 },
  { month: "Mar'26", ordinary: 1620, bulk: 43 },
];

const solarCapacityData = [
  { type: "Net Metering",   ordinary: 12450, bulk: 8760 },
  { type: "Net Accounting", ordinary: 5870,  bulk: 3240 },
  { type: "Net Plus",       ordinary: 3210,  bulk: 1980 },
  { type: "Net Plus Plus",  ordinary: 1560,  bulk: 980  },
];

const MAROON = "#800000";
const AMBER  = "#B45309";
const fmt    = (n: number) => n.toLocaleString();

const kioskCurrentMonth = 675;
const kioskPrevMonth    = 628;
const kioskChange       = (((kioskCurrentMonth - kioskPrevMonth) / kioskPrevMonth) * 100).toFixed(1);

const lastNewCustomers = newCustomersData[newCustomersData.length - 1];
const yearlyNewOrdinary = newCustomersData.reduce((s, d) => s + d.ordinary, 0);
const yearlyNewBulk     = newCustomersData.reduce((s, d) => s + d.bulk, 0);

const SOLAR_COLORS = ["#800000", "#b45309", "#c2410c", "#92400e"];

const solarOrdinaryPieData = [
  { name: "Net Metering",   value: solarOrdinary.netMetering },
  { name: "Net Accounting", value: solarOrdinary.netAccounting },
  { name: "Net Plus",       value: solarOrdinary.netPlus },
  { name: "Net Plus Plus",  value: solarOrdinary.netPlusPlus },
];

const solarBulkPieData = [
  { name: "Net Metering",   value: solarBulk.netMetering },
  { name: "Net Accounting", value: solarBulk.netAccounting },
  { name: "Net Plus",       value: solarBulk.netPlus },
  { name: "Net Plus Plus",  value: solarBulk.netPlusPlus },
];

const solarCapacityPieData = solarCapacityData.map((r) => ({
  name: r.type,
  value: r.ordinary + r.bulk,
}));

const maxUnits = Math.max(...top10Customers.map((c) => c.units));

// ── Component ────────────────────────────────────────────────────────────────
const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-5">

      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="w-1 h-8 rounded-full" style={{ background: MAROON }} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CEB Operations Dashboard</h1>
          {/* <p className="text-sm text-gray-400 mt-0.5">Bill Cycle 448 &nbsp;·&nbsp; March 2026 &nbsp;·&nbsp; Mock Data</p> */}
        </div>
      </div>

      {/* ── Row 1: KPI cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ordinary Customers</span>
            <div className="p-2 rounded-lg" style={{ background: "#80000015" }}>
              <Users className="w-4 h-4" style={{ color: MAROON }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fmt(ordinaryCustomers)}</p>
          <p className="text-xs text-gray-400 mt-1">Active — current bill cycle</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Bulk Customers</span>
            <div className="p-2 rounded-lg" style={{ background: "#B4530915" }}>
              <Users className="w-4 h-4" style={{ color: AMBER }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fmt(bulkCustomers)}</p>
          <p className="text-xs text-gray-400 mt-1">Active connections</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Solar Customers</span>
            <div className="p-2 rounded-lg" style={{ background: "#B4530920" }}>
              <Sun className="w-4 h-4" style={{ color: AMBER }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fmt(totalSolar)}</p>
          <div className="flex gap-3 mt-1">
            <span className="text-xs font-medium" style={{ color: MAROON }}>Ord: {fmt(totalSolarOrdinary)}</span>
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs font-medium" style={{ color: AMBER }}>Bulk: {fmt(totalSolarBulk)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Kiosk Collection</span>
            <div className="p-2 rounded-lg" style={{ background: "#80000015" }}>
              <CreditCard className="w-4 h-4" style={{ color: MAROON }} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">LKR {fmt(kioskCurrentMonth)}M</p>
          <p className={`text-xs mt-1 font-medium ${Number(kioskChange) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {Number(kioskChange) >= 0 ? "↑" : "↓"} {Math.abs(Number(kioskChange))}% vs Feb '26
          </p>
        </div>

      </div>

      {/* ── Row 2: Charts ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">

        {/* Sales & Collection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Sales &amp; Collection</p>
          <p className="text-sm font-semibold text-gray-700 mb-4">Monthly charges (LKR Million) — Ordinary &amp; Bulk</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesCollectionData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="M" />
                <Tooltip formatter={(v) => [`LKR ${(v as number).toLocaleString()}M`]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ordinary" name="Ordinary" fill={MAROON} radius={[3, 3, 0, 0]} />
                <Bar dataKey="bulk"     name="Bulk"     fill={AMBER}  radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Customers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">New Customer Registrations</p>
          <p className="text-sm font-semibold text-gray-700 mb-4">Monthly new connections — Ordinary &amp; Bulk</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newCustomersData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [(v as number).toLocaleString()]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ordinary" name="Ordinary" fill={MAROON} radius={[3, 3, 0, 0]} />
                <Bar dataKey="bulk"     name="Bulk"     fill={AMBER}  radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Year-to-date summary */}
          <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-400">This Month (Ord)</p>
              <p className="text-base font-bold" style={{ color: MAROON }}>{fmt(lastNewCustomers.ordinary)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">This Month (Bulk)</p>
              <p className="text-base font-bold" style={{ color: AMBER }}>{fmt(lastNewCustomers.bulk)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">YTD Total</p>
              <p className="text-base font-bold text-gray-800">{fmt(yearlyNewOrdinary + yearlyNewBulk)}</p>
            </div>
          </div>
        </div>

      </div>

      {/* ── Row 3: Solar breakdown + Zero consumption ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">

        {/* Solar Customer Breakdown */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Solar Customer Breakdown</p>
          <p className="text-sm font-semibold text-gray-700 mb-2">By net metering type — current bill cycle</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-center font-semibold" style={{ color: MAROON }}>Ordinary &nbsp;·&nbsp; {fmt(totalSolarOrdinary)}</p>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={solarOrdinaryPieData} cx="50%" cy="50%" innerRadius={48} outerRadius={74} dataKey="value" paddingAngle={2}>
                    {solarOrdinaryPieData.map((_, i) => <Cell key={i} fill={SOLAR_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [fmt(v as number)]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-center font-semibold" style={{ color: AMBER }}>Bulk &nbsp;·&nbsp; {fmt(totalSolarBulk)}</p>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={solarBulkPieData} cx="50%" cy="50%" innerRadius={48} outerRadius={74} dataKey="value" paddingAngle={2}>
                    {solarBulkPieData.map((_, i) => <Cell key={i} fill={SOLAR_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [fmt(v as number)]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Zero Consumption Accounts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Zero Consumption Accounts</p>
          <p className="text-sm font-semibold text-gray-700 mb-3">No-usage accounts — last 3 months</p>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zeroConsumptionData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [(v as number).toLocaleString(), "Accounts"]} />
                <Bar dataKey="count" name="Accounts" fill={MAROON} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Row 4: Solar gen capacity + Top 10 customers ─────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">

        {/* Solar Generation Capacity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Solar Generation Capacity</p>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            <Zap className="inline w-3.5 h-3.5 mr-1 mb-0.5" style={{ color: AMBER }} />
            Mar 2026 — total kW by type
          </p>
          <ResponsiveContainer width="100%" height={235}>
            <PieChart>
              <Pie data={solarCapacityPieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} dataKey="value" paddingAngle={2}>
                {solarCapacityPieData.map((_, i) => <Cell key={i} fill={SOLAR_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${(v as number).toLocaleString()} kW`]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 Largest Customers */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Top 10 Largest Customers</p>
          <p className="text-sm font-semibold text-gray-700 mb-4">Current month — ranked by units consumed</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide text-left">
                  <th className="pb-2 pr-3 font-semibold">#</th>
                  <th className="pb-2 pr-3 font-semibold">Name</th>
                  <th className="pb-2 pr-3 font-semibold">Type</th>
                  <th className="pb-2 pr-3 font-semibold text-right">Units (kWh)</th>
                  <th className="pb-2 font-semibold text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {top10Customers.map((c) => (
                  <tr key={c.rank} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                    <td className="py-2 pr-3 text-gray-400 font-medium">{c.rank}</td>
                    <td className="py-2 pr-3 font-medium text-gray-800">{c.name}</td>
                    <td className="py-2 pr-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={c.type === "Bulk"
                          ? { background: "#B4530918", color: AMBER }
                          : { background: "#80000015", color: MAROON }}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[50px]">
                          <div className="h-1.5 rounded-full" style={{ width: `${(c.units / maxUnits) * 100}%`, background: c.type === "Bulk" ? AMBER : MAROON }} />
                        </div>
                        <span className="tabular-nums text-gray-700 text-xs w-16 text-right shrink-0">{fmt(c.units)}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-700">{fmt(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Home;
