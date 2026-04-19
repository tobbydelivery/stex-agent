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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #2c3e50, #e74c3c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#2c3e50", fontSize: "28px", margin: 0 }}>🚚 STeX Logistics</h1>
          <p style={{ color: "#7f8c8d", marginTop: "8px" }}>Agent Portal</p>
        </div>
        {error && <div style={{ background: "#fee", color: "#e74c3c", padding: "10px", borderRadius: "6px", marginBottom: "20px", textAlign: "center" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "#2c3e50", fontWeight: "bold" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "12px", border: "2px solid #ecf0f1", borderRadius: "6px", fontSize: "16px", boxSizing: "border-box" }} placeholder="agent@example.com" />
          </div>
          <div style={{ marginBottom: "25px" }}>
            <label style={{ display: "block", marginBottom: "6px", color: "#2c3e50", fontWeight: "bold" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: "12px", border: "2px solid #ecf0f1", borderRadius: "6px", fontSize: "16px", boxSizing: "border-box" }} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#95a5a6" : "#e74c3c", color: "white", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;