import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

// Mock Data for different quarters
const quarterlyData = {
  Q1: [
    { name: "AAPL", payout: 135.40, color: "#d2bbff" },
    { name: "MSFT", payout: 210.20, color: "#d2bbff" },
    { name: "NVDA", payout: 88.50, color: "#d2bbff" },
    { name: "O", payout: 295.00, color: "#fbbf24" },
    { name: "JNJ", payout: 180.00, color: "#d2bbff" },
    { name: "PG", payout: 155.20, color: "#d2bbff" },
    { name: "KO", payout: 198.50, color: "#d2bbff" }
  ],
  Q2: [
    { name: "AAPL", payout: 145.20, color: "#d2bbff" },
    { name: "MSFT", payout: 220.50, color: "#d2bbff" },
    { name: "NVDA", payout: 95.80, color: "#d2bbff" },
    { name: "O", payout: 310.00, color: "#fbbf24" },
    { name: "JNJ", payout: 185.30, color: "#d2bbff" },
    { name: "PG", payout: 160.40, color: "#d2bbff" },
    { name: "KO", payout: 210.00, color: "#d2bbff" }
  ],
  Q3: [
    { name: "AAPL", payout: 148.10, color: "#d2bbff" },
    { name: "MSFT", payout: 225.00, color: "#d2bbff" },
    { name: "NVDA", payout: 110.20, color: "#d2bbff" },
    { name: "O", payout: 315.50, color: "#fbbf24" },
    { name: "JNJ", payout: 188.00, color: "#d2bbff" },
    { name: "PG", payout: 165.00, color: "#d2bbff" },
    { name: "KO", payout: 212.40, color: "#d2bbff" }
  ]
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-2xl border border-white/15 bg-[#0c0b11]/95 p-3.5 shadow-2xl backdrop-blur-md">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Holding Asset
        </p>
        <p className="m-0 mt-1 font-space-grotesk text-base font-bold text-white flex items-center gap-2">
          <span 
            className="inline-block h-2 w-2 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          {data.name}
        </p>
        <div className="mt-2.5 border-t border-white/10 pt-2 flex items-center justify-between gap-6">
          <span className="text-[10px] font-semibold text-neutral-400">PAYOUT</span>
          <span className="font-space-grotesk text-sm font-black text-amber-300">
            ₹{data.payout.toFixed(2)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const DividendIncomeChart = () => {
  const [selectedQuarter, setSelectedQuarter] = useState("Q2");
  const data = quarterlyData[selectedQuarter];

  // Calculate stats
  const totalPayout = data.reduce((sum, item) => sum + item.payout, 0);
  const highestHolding = [...data].sort((a, b) => b.payout - a.payout)[0];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-md flex flex-col gap-6 sm:p-6 w-full box-border">
      {/* Decorative Radial Glows (Apple Style) */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col gap-4 justify-between sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-5 items-center justify-center rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-300">
              Portfolio Stats
            </span>
            <span className="text-[10px] font-bold text-white/45 tracking-widest uppercase">
              {selectedQuarter} Report
            </span>
          </div>
          <h2 className="m-0 mt-2 font-space-grotesk text-xl font-bold text-white tracking-tight sm:text-2xl">
            {selectedQuarter} Dividend Income
          </h2>
          <p className="m-0 mt-1 text-xs text-white/50 leading-relaxed max-w-sm">
            Quarterly dividend payouts across your portfolio holdings.
          </p>
        </div>

        {/* Quarter Selector Tab */}
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-black/35 border border-white/5 p-1 self-start">
          {["Q1", "Q2", "Q3"].map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuarter(q)}
              className={`rounded-lg px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all duration-200 border-none cursor-pointer ${
                selectedQuarter === q
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-white/45 bg-transparent hover:text-white/80"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Key Insights Row */}
      <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4">
        <div>
          <p className="m-0 text-[9px] font-bold uppercase tracking-wider text-white/40">
            Total Dividend Payout
          </p>
          <p className="m-0 mt-1 font-space-grotesk text-xl font-black text-emerald-300 sm:text-2xl">
            ₹{totalPayout.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="m-0 text-[9px] font-bold uppercase tracking-wider text-white/40">
            Top Contributor
          </p>
          <p className="m-0 mt-1 font-space-grotesk text-xl font-black text-amber-300 sm:text-2xl">
            {highestHolding.name} <span className="text-xs font-medium text-white/40">(₹{highestHolding.payout.toFixed(0)})</span>
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-60 w-full text-[10px] font-bold tracking-wider font-mono sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
          >
            <defs>
              {/* Purple Gradient for standard holdings */}
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4c1fb" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.25} />
              </linearGradient>
              {/* Amber Gradient for top highlighted holding (e.g. Realty Income "O") */}
              <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ea580c" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(255, 255, 255, 0.06)" 
            />
            
            <XAxis
              dataKey="name"
              stroke="rgba(255, 255, 255, 0.35)"
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            
            <YAxis
              stroke="rgba(255, 255, 255, 0.35)"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255, 255, 255, 0.03)", radius: 12 }}
            />
            
            <Bar 
              dataKey="payout" 
              radius={[10, 10, 0, 0]}
              maxBarSize={38}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.name === "O" ? "url(#amberGradient)" : "url(#purpleGradient)"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DividendIncomeChart;
