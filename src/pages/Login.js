import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", { email, password });
      if (res.data.user.role !== "agent") {
        setError("Access denied. Agents only.");
        return;
      }
      localStorage.setItem("agentToken", res.data.token);
      localStorage.setItem("agentUser", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Left Side */}
      <div style={{
        flex: 1,
        background: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url('https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200')`,
        backgroundSize: "cover", backgroundPosition: "center",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "60px", color: "white"
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>🚚</div>
          <h1 style={{ fontSize: "42px", fontWeight: "900", marginBottom: "10px" }}>STeX Logistics</h1>
          <div style={{ color: "#e74c3c", fontSize: "13px", letterSpacing: "3px", marginBottom: "30px" }}>AGENT PORTAL</div>
          <p style={{ fontSize: "16px", opacity: 0.85, lineHeight: "1.8" }}>
            Manage your deliveries, update order status, and track your performance all in one place.
          </p>
          <div style={{ display: "flex", gap: "30px", justifyContent: "center", marginTop: "40px" }}>
            {[{ value: "Fast", label: "Delivery" }, { value: "Live", label: "Tracking" }, { value: "24/7", label: "Support" }].map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "900", color: "#e74c3c" }}>{stat.value}</div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div style={{ width: "480px", background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 50px" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <h2 style={{ color: "#2c3e50", fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>Agent Login</h2>
          <p style={{ color: "#7f8c8d", marginBottom: "35px" }}>Sign in to your agent dashboard</p>

          {error && <div style={{ background: "#fdedec", color: "#e74c3c", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", borderLeft: "4px solid #e74c3c" }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#2c3e50", fontWeight: "600", fontSize: "14px" }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "14px 16px", border: "2px solid #ecf0f1", borderRadius: "10px", fontSize: "15px", boxSizing: "border-box", outline: "none" }}
                placeholder="agent@stexlogistics.com" />
            </div>
            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#2c3e50", fontWeight: "600", fontSize: "14px" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                style={{ width: "100%", padding: "14px 16px", border: "2px solid #ecf0f1", borderRadius: "10px", fontSize: "15px", boxSizing: "border-box", outline: "none" }}
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "15px", background: loading ? "#95a5a6" : "#e74c3c", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 15px rgba(231,76,60,0.3)" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "10px" }}>
            <p style={{ color: "#7f8c8d", fontSize: "13px", margin: 0, textAlign: "center" }}>
              🔒 Authorized agents only. Contact admin if you need access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;