import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'Segoe UI', sans-serif",
      background: `linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.82)), url('https://i.ibb.co/XkVB3qCd/B13-E95-AC-6-A36-48-B8-8-E92-E7881-B1-FB33-A.png')`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px rgba(255,255,255,0.05) inset !important; -webkit-text-fill-color: white !important; }
      `}</style>

      {/* Left Panel */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        animation: "fadeIn 0.5s ease"
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "24px",
            background: "linear-gradient(135deg, #e74c3c, #c0392b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px", fontSize: "36px",
            boxShadow: "0 12px 40px rgba(231,76,60,0.4)",
            transform: "perspective(500px) rotateX(5deg)"
          }}>🚚</div>

          <h1 style={{ color: "white", fontSize: "38px", fontWeight: "900", margin: "0 0 8px", letterSpacing: "0.5px" }}>STeX Logistics</h1>
          <div style={{ color: "#e74c3c", fontSize: "12px", letterSpacing: "4px", marginBottom: "32px", fontWeight: "700" }}>AGENT PORTAL</div>

          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: "1.8", marginBottom: "40px" }}>
            Manage your deliveries, update order status, and track your performance all in one place.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            {[
              { value: "Fast", label: "Delivery", icon: "⚡" },
              { value: "Live", label: "Tracking", icon: "📍" },
              { value: "24/7", label: "Support", icon: "🎧" }
            ].map((stat, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                padding: "16px 20px",
                textAlign: "center",
                flex: 1
              }}>
                <div style={{ fontSize: "20px", marginBottom: "6px" }}>{stat.icon}</div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "#e74c3c" }}>{stat.value}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div style={{ marginTop: "32px", textAlign: "left" }}>
            {[
              "View and manage assigned deliveries",
              "Update delivery status in real time",
              "Share live GPS location with customers",
              "Earn based on completed deliveries"
            ].map((feature, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(39,174,96,0.2)", border: "1px solid rgba(39,174,96,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>✓</div>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        width: "480px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
        animation: "fadeIn 0.6s ease"
      }}>
        <div style={{ width: "100%" }}>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#27ae60", animation: "pulse 2s infinite" }} />
              <span style={{ color: "#27ae60", fontSize: "12px", fontWeight: "700" }}>AGENT PORTAL ACTIVE</span>
            </div>
            <h2 style={{ color: "white", fontSize: "26px", fontWeight: "900", margin: "0 0 6px" }}>Agent Sign In</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>Access your delivery dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(231,76,60,0.15)",
              border: "1px solid rgba(231,76,60,0.4)",
              borderRadius: "14px",
              padding: "13px 16px",
              marginBottom: "22px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ fontSize: "16px" }}>⚠️</span>
              <span style={{ color: "#ff6b6b", fontSize: "13px", fontWeight: "500" }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.5px" }}>
                EMAIL ADDRESS
              </label>
              <div style={{
                position: "relative",
                borderRadius: "14px",
                border: `1.5px solid ${emailFocused ? "rgba(231,76,60,0.7)" : "rgba(255,255,255,0.1)"}`,
                background: "rgba(255,255,255,0.05)",
                transition: "all 0.2s",
                boxShadow: emailFocused ? "0 0 0 3px rgba(231,76,60,0.12)" : "none"
              }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  autoComplete="email"
                  style={{ width: "100%", padding: "14px 14px 14px 44px", background: "transparent", border: "none", outline: "none", color: "white", fontSize: "14px", boxSizing: "border-box" }}
                />
                {email && (
                  <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px" }}>
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "✅" : "❌"}
                  </span>
                )}
              </div>
              <p style={{ margin: "5px 0 0 2px", fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>Enter your agent email address</p>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: "700", letterSpacing: "0.5px" }}>
                PASSWORD
              </label>
              <div style={{
                position: "relative",
                borderRadius: "14px",
                border: `1.5px solid ${passwordFocused ? "rgba(231,76,60,0.7)" : "rgba(255,255,255,0.1)"}`,
                background: "rgba(255,255,255,0.05)",
                transition: "all 0.2s",
                boxShadow: passwordFocused ? "0 0 0 3px rgba(231,76,60,0.12)" : "none"
              }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  autoComplete="current-password"
                  style={{ width: "100%", padding: "14px 44px 14px 44px", background: "transparent", border: "none", outline: "none", color: "white", fontSize: "14px", boxSizing: "border-box" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: 0 }}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <p style={{ margin: "5px 0 0 2px", fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>Enter your secure password</p>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "15px",
              background: loading ? "rgba(149,165,166,0.3)" : "linear-gradient(135deg, #e74c3c, #c0392b)",
              color: "white", border: "none", borderRadius: "14px",
              fontSize: "15px", fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 8px 24px rgba(231,76,60,0.4)",
              transition: "all 0.2s"
            }}
              onMouseEnter={e => { if (!loading) e.target.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.target.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Signing you in...
                </span>
              ) : "Access Agent Dashboard →"}
            </button>
          </form>

          {/* Footer Note */}
          <div style={{
            marginTop: "24px",
            padding: "14px 16px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            textAlign: "center"
          }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: 0 }}>
              🔒 Authorized agents only. Contact admin at <span style={{ color: "#e74c3c" }}>support@stexlogistics.com</span> if you need access.
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;