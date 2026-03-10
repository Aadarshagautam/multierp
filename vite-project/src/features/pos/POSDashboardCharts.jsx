import React from "react";
import { formatShortCurrencyNpr } from "../../utils/nepal.js";

const PIE_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b"];

const EmptyChart = ({ message }) => (
  <div className="flex h-[210px] items-center justify-center text-sm text-gray-400">{message}</div>
);

const ChartCard = ({ title, children, className = "" }) => (
  <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
    <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
    {children}
  </div>
);

const formatCompactValue = (value) => {
  const amount = Number(value) || 0;

  if (amount >= 100000) return `${(amount / 100000).toFixed(amount >= 1000000 ? 1 : 0)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;

  return `${Math.round(amount)}`;
};

const buildDonutStyle = (items) => {
  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  if (!total) return { total: 0, style: {} };

  let offset = 0;
  const segments = items.map((item, index) => {
    const size = ((Number(item.value) || 0) / total) * 360;
    const start = offset;
    offset += size;
    return `${PIE_COLORS[index % PIE_COLORS.length]} ${start}deg ${offset}deg`;
  });

  return {
    total,
    style: {
      background: `conic-gradient(${segments.join(", ")})`,
    },
  };
};

const RevenueBars = ({ data }) => {
  const maxRevenue = Math.max(...data.map((item) => item.revenue || 0), 1);

  return (
    <div className="grid h-[210px] grid-cols-7 gap-3">
      {data.map((item) => {
        const barHeight = Math.max(12, Math.round(((item.revenue || 0) / maxRevenue) * 100));

        return (
          <div key={item.date} className="flex min-w-0 flex-col justify-end">
            <div className="mb-2 text-center text-[10px] font-medium text-slate-400">
              {formatCompactValue(item.revenue)}
            </div>
            <div className="flex flex-1 items-end rounded-2xl bg-slate-50 px-1.5 pb-1.5">
              <div
                className="w-full rounded-xl bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400"
                style={{ height: `${barHeight}%` }}
                title={`${item.date}: ${formatShortCurrencyNpr(item.revenue)}`}
              />
            </div>
            <div className="mt-2 truncate text-center text-[11px] text-slate-500">{item.date}</div>
          </div>
        );
      })}
    </div>
  );
};

const OrderMixDonut = ({ data }) => {
  const { total, style } = buildDonutStyle(data);

  if (!total) return <EmptyChart message="No orders today" />;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
      <div className="mx-auto">
        <div className="relative h-44 w-44 rounded-full" style={style}>
          <div className="absolute inset-6 flex items-center justify-center rounded-full bg-white text-center shadow-inner">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Today</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{formatShortCurrencyNpr(total)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const value = Number(item.value) || 0;
          const percent = total ? Math.round((value / total) * 100) : 0;

          return (
            <div key={item.name} className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-slate-700">{item.name}</span>
                  <span className="text-xs font-semibold text-slate-500">{percent}%</span>
                </div>
                <div className="text-xs text-slate-400">{formatShortCurrencyNpr(value)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HourlyBars = ({ data }) => {
  const maxRevenue = Math.max(...data.map((item) => item.revenue || 0), 1);
  const labelStep = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[36rem] items-end gap-2">
        {data.map((item, index) => {
          const barHeight = Math.max(10, Math.round(((item.revenue || 0) / maxRevenue) * 120));
          const showLabel = index % labelStep === 0 || index === data.length - 1;

          return (
            <div key={item.hour} className="flex flex-1 flex-col items-center">
              <div className="mb-2 text-[10px] text-slate-400">{showLabel ? formatCompactValue(item.revenue) : ""}</div>
              <div className="flex h-32 w-full items-end rounded-xl bg-slate-50 px-1 pb-1">
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-sky-500 to-cyan-300"
                  style={{ height: `${barHeight}px` }}
                  title={`${item.hour}: ${formatShortCurrencyNpr(item.revenue)}`}
                />
              </div>
              <div className="mt-2 text-[10px] text-slate-500">{showLabel ? item.hour.slice(0, 2) : ""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function POSDashboardCharts({ dailyChart, pieData, hourlyData }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Revenue, Last 7 Days" className="lg:col-span-2">
          {dailyChart.length > 0 ? <RevenueBars data={dailyChart} /> : <EmptyChart message="No sales data for the last 7 days" />}
        </ChartCard>

        <ChartCard title="Today by Order Type">
          <OrderMixDonut data={pieData} />
        </ChartCard>
      </div>

      {hourlyData.length > 0 && (
        <ChartCard title="Today's Hourly Revenue">
          <HourlyBars data={hourlyData} />
        </ChartCard>
      )}
    </>
  );
}
