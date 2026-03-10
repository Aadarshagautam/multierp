import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api.js";

const initialForm = {
  email: "",
  otp: "",
  newPassword: "",
};

const passwordHint = "Use 8+ characters with uppercase, lowercase, and a number.";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);

  const updateField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const requestCode = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/auth/send-reset-otp", {
        email: form.email.trim(),
      });

      toast.success(data.message);
      setStep("reset");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/auth/reset-password", {
        email: form.email.trim(),
        otp: form.otp.trim(),
        newPassword: form.newPassword,
      });

      toast.success(data.message || "Password updated");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-6 sm:px-6 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_90px_-48px_rgba(15,23,42,0.55)] lg:grid-cols-[1fr,0.95fr]">
          <section className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-12">
            <div className="absolute inset-0">
              <div className="absolute left-10 top-12 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl" />
              <div className="absolute bottom-8 right-10 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
            </div>

            <div className="relative flex h-full flex-col">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-200 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>

              <div className="mt-12">
                <span className="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-slate-100">
                  Account recovery
                </span>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Recover access without losing your workspace
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Request a verification code, confirm it, and set a stronger password for your owner or staff account.
                </p>
              </div>

              <div className="mt-10 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <Mail className="h-5 w-5 text-teal-300" />
                  <p className="mt-3 text-sm font-semibold">Email-based recovery</p>
                  <p className="mt-2 text-sm text-slate-300">
                    We send the code only to the registered email for that account.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <ShieldCheck className="h-5 w-5 text-amber-300" />
                  <p className="mt-3 text-sm font-semibold">Stronger password rules</p>
                  <p className="mt-2 text-sm text-slate-300">{passwordHint}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                {step === "request" ? "Step 1" : "Step 2"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                {step === "request" ? "Send verification code" : "Create a new password"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {step === "request"
                  ? "Enter the email address linked to your business software account."
                  : "Enter the 6-digit code from your email and choose a stronger password."}
              </p>
            </div>

            {step === "request" ? (
              <form onSubmit={requestCode} className="mt-10 max-w-md space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={updateField("email")}
                      className="w-full rounded-2xl border border-slate-300 px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                      placeholder="owner@business.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending code..." : "Send verification code"}
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="mt-10 max-w-md space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={updateField("email")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Verification code</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={form.otp}
                      onChange={updateField("otp")}
                      className="w-full rounded-2xl border border-slate-300 px-12 py-3 text-sm tracking-[0.35em] text-slate-900 outline-none transition focus:border-slate-950"
                      placeholder="123456"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
                  <input
                    type="password"
                    value={form.newPassword}
                    onChange={updateField("newPassword")}
                    minLength={8}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                    placeholder="Use a stronger password"
                    required
                  />
                  <p className="mt-2 text-xs text-slate-500">{passwordHint}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("request")}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Change email
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Updating..." : "Reset password"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
