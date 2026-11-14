
import { useState } from "react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = new URLSearchParams(window.location.search).get("token");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("Invalid or missing reset link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed.");
      }

      setMessage("Password successfully reset! You can now sign in.");

      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10">

        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
          <span className="text-2xl">🔐</span>
        </div>

        <h1 className="text-3xl font-black text-slate-900">
          Reset Password
        </h1>

        <p className="text-sm text-slate-500 mt-3 leading-6">
          Create a new password for your SmartMarket account.
        </p>

        <form onSubmit={handleReset} className="space-y-5 mt-8">

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              New Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl p-3">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token || !!message}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 font-bold shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition disabled:opacity-60"
          >
            {loading ? "Updating Password..." : "Reset Password"}
          </button>

        </form>

      </div>
    </div>
  );
}
