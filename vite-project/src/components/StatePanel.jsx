import React from "react";

const tones = {
  slate: {
    panel: "bg-white text-slate-900",
    icon: "bg-slate-100 text-slate-700",
    body: "text-slate-600",
  },
  amber: {
    panel: "bg-amber-50 text-amber-950 border-amber-200",
    icon: "bg-white/80 text-amber-700",
    body: "text-amber-900/75",
  },
  teal: {
    panel: "bg-emerald-50 text-emerald-950 border-emerald-200",
    icon: "bg-white/85 text-emerald-700",
    body: "text-emerald-900/75",
  },
  rose: {
    panel: "bg-rose-50 text-rose-950 border-rose-200",
    icon: "bg-white/85 text-rose-700",
    body: "text-rose-900/75",
  },
};

const StatePanel = ({
  title,
  message,
  action,
  icon: Icon,
  tone = "slate",
  className = "",
}) => {
  const palette = tones[tone] || tones.slate;

  return (
    <div className={`erp-state-panel ${palette.panel} ${className}`}>
      {Icon && (
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${palette.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className={`mt-2 max-w-xl text-sm leading-7 ${palette.body}`}>{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};

export default StatePanel;
