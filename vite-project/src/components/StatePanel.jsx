import React from "react";

const tones = {
  slate: "border-slate-200 bg-white text-slate-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  teal: "border-teal-200 bg-teal-50 text-teal-900",
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
    <div className={`rounded-[28px] border p-8 shadow-sm ${palette} ${className}`}>
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};

export default StatePanel;
