import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuth } from "../context/AuthContext";

const CustomerAuth = () => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const googleStatus = searchParams.get("google");
    const authEncoded = searchParams.get("auth");

    if (googleStatus === "not_configured") {
      toast.error("Google login is not configured on the server", { id: "google-not-configured" });
      navigate("/customer-auth", { replace: true });
      return;
    }

    if (googleStatus === "failed") {
      toast.error("Google authentication failed", { id: "google-auth-failed" });
      navigate("/customer-auth", { replace: true });
      return;
    }

    if (!authEncoded) {
      return;
    }

    try {
      const normalized = authEncoded.replace(/-/g, "+").replace(/_/g, "/");
      const padded = `${normalized}${"=".repeat((4 - (normalized.length % 4)) % 4)}`;
      const parsed = JSON.parse(atob(padded));

      if (!parsed?.token || !parsed?.user) {
        throw new Error("Invalid Google auth payload");
      }

      login(parsed);
      toast.success("Signed in with Google", { id: "google-auth-success" });
      navigate("/products", { replace: true });
    } catch (error) {
      toast.error("Google authentication failed", { id: "google-auth-failed" });
      navigate("/customer-auth", { replace: true });
    }
  }, [login, navigate, searchParams]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const normalizedPassword = form.password;
      const normalizedName = form.name.trim();
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const payload =
        mode === "register"
          ? { name: normalizedName, email: normalizedEmail, password: normalizedPassword }
          : { email: normalizedEmail, password: normalizedPassword, role: "customer" };

      const { data } = await api.post(endpoint, payload);
      login(data);
      toast.success(mode === "register" ? "Welcome to LUMEHEAVEN" : "Welcome back");
      navigate("/products");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (error?.request ? "Cannot reach server. Check backend and CORS settings." : "Authentication failed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Customer {mode === "login" ? "Login" : "Register"}</h2>
        <p>Access curated products and discover elegant collections.</p>
        <div className="tab-row">
          <button
            type="button"
            className={`tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="form-grid">
          {mode === "register" && (
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>
        <GoogleAuthButton />
      </div>
    </div>
  );
};

export default CustomerAuth;
