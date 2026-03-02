import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ManagerLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { ...form, role: "manager" });
      login(data);
      toast.success("Manager access granted");
      navigate("/manager/dashboard");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (error?.request ? "Cannot reach server. Check backend and CORS settings." : "Login failed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Manager Login</h2>
        <p>Access your modern control center to manage products, categories, and orders.</p>
        <form onSubmit={submit} className="form-grid">
          <input
            type="email"
            placeholder="Manager Email"
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
          />
          <button className="btn btn-primary ripple" disabled={loading} type="submit">
            {loading ? "Authenticating..." : "Login as Manager"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManagerLogin;
