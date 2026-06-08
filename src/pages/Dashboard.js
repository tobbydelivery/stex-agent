import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { io } from "socket.io-client";

const BACKEND_URL = "https://tobby-delivery-backend.onrender.com";
const Skeleton = ({ width = "100%", height = "16px", borderRadius = "8px" }) => (
  <div style={{
    width, height, borderRadius,
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite"
  }} />
);

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [tracking, setTracking] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [location, setLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const watchIdRef = useRef(null);
  const navigate = useNavigate();
  const agent = JSON.parse(localStorage.getItem("agentUser") || "{}");

  useEffect(() => {
    if (!localStorage.getItem("agentToken")) { navigate("/"); return; }
    fetchOrders();
    initSocket();
    return () => { stopTracking(); if (socket) socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const initSocket = () => {
    const newSocket = io(BACKEND_URL);
    newSocket.on("connect", () => newSocket.emit("agent_online", { agentId: agent.id }));
    setSocket(newSocket);
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders");
      setOrders(res.data.orders);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status, note: "Status updated by agent" });
      showMessage(`Order updated to ${status.replace(/_/g, " ")}`, "success");
      fetchOrders();
    } catch (err) { showMessage("Error updating status", "error"); }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const startTracking = (orderId) => {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    setActiveOrderId(orderId);
    setTracking(true);
    if (socket) socket.emit("agent_online", { agentId: agent.id, orderId });
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        const locationData = { latitude, longitude, speed: speed || 0, heading: heading || 0 };
        setLocation(locationData);
        if (socket) socket.emit("update_location", { agentId: agent.id, orderId, ...locationData });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (socket) socket.emit("agent_offline", { agentId: agent.id });
    setTracking(false);
    setActiveOrderId(null);
    setLocation(null);
  };

  const logout = () => {
    stopTracking();
    localStorage.removeItem("agentToken");
    localStorage.removeItem("agentUser");
    navigate("/");
  };

  const getStatusColor = (status) => {
    const colors = { pending: "#f39c12", picked_up: "#3498db", in_transit: "#9b59b6", delivered: "#27ae60", cancelled: "#e74c3c", delayed: "#e67e22" };
    return colors[status] || "#95a5a6";
  };

  const getStatusIcon = (status) => {
    const icons = { pending: "⏳", picked_up: "📦", in_transit: "🚚", delivered: "✅", cancelled: "❌", delayed: "⚠️" };
    return icons[status] || "📦";
  };

  const pendingOrders = orders.filter(o => ["pending", "picked_up", "in_transit"].includes(o.status));
  const completedOrders = orders.filter(o => ["delivered", "cancelled"].includes(o.status));

  const glassStyle = {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', sans-serif",
      minHeight: "100vh",
      background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('https://i.ibb.co/XkVB3qCd/B13-E95-AC-6-A36-48-B8-8-E92-E7881-B1-FB33-A.png')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed"
    }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a1a2e; color: white; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "14px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #e74c3c, #c0392b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🚚</div>
          <div>
            <div style={{ color: "white", fontWeight: "800", fontSize: "16px" }}>STeX Logistics</div>
            <div style={{ color: "#e74c3c", fontSize: "9px", letterSpacing: "2px" }}>AGENT PORTAL</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {tracking && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(39,174,96,0.15)", padding: "8px 16px", borderRadius: "20px", border: "1px solid rgba(39,174,96,0.4)" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27ae60", animation: "pulse 1s infinite" }} />
              <span style={{ color: "#27ae60", fontSize: "12px", fontWeight: "700" }}>LIVE TRACKING</span>
              {location && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>📍 {location.latitude?.toFixed(3)}, {location.longitude?.toFixed(3)}</span>}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.06)", padding: "7px 14px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #e74c3c, #c0392b)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "12px", color: "white" }}>
              {agent.name?.charAt(0)?.toUpperCase()}
            </div>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: "600" }}>{agent.name}</span>
          </div>

          <button onClick={logout} style={{ padding: "8px 18px", background: "rgba(231,76,60,0.2)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.4)", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 20px" }}>

        {/* Message Toast */}
        {message.text && (
          <div style={{
            background: message.type === "success" ? "rgba(39,174,96,0.15)" : "rgba(231,76,60,0.15)",
            border: `1px solid ${message.type === "success" ? "rgba(39,174,96,0.4)" : "rgba(231,76,60,0.4)"}`,
            borderRadius: "14px", padding: "13px 18px", marginBottom: "20px",
            display: "flex", alignItems: "center", gap: "10px",
            animation: "slideDown 0.3s ease"
          }}>
            <span>{message.type === "success" ? "✅" : "⚠️"}</span>
            <span style={{ color: message.type === "success" ? "#27ae60" : "#e74c3c", fontWeight: "600", fontSize: "14px" }}>{message.text}</span>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {[
            { label: "Active Orders", value: pendingOrders.length, color: "#f39c12", icon: "📦" },
            { label: "Delivered", value: completedOrders.filter(o => o.status === "delivered").length, color: "#27ae60", icon: "✅" },
            { label: "Total Assigned", value: orders.length, color: "#3498db", icon: "📋" },
            { label: "GPS Status", value: tracking ? "LIVE" : "OFF", color: tracking ? "#27ae60" : "#95a5a6", icon: "📍" }
          ].map((stat, i) => (
            <div key={i} style={{ ...glassStyle, padding: "20px", borderTop: `2px solid ${stat.color}40` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>{stat.label}</div>
                  <div style={{ fontSize: "26px", fontWeight: "900", color: stat.color }}>{loading ? <Skeleton width="40px" height="26px" /> : stat.value}</div>
                </div>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: `${stat.color}15`, border: `1px solid ${stat.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[
            { key: "active", label: "📦 Active Orders", count: pendingOrders.length },
            { key: "completed", label: "✅ Completed", count: completedOrders.length }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "10px 20px", borderRadius: "20px", cursor: "pointer",
              background: activeTab === tab.key ? "rgba(231,76,60,0.8)" : "rgba(255,255,255,0.06)",
              color: "white", border: activeTab === tab.key ? "none" : "1px solid rgba(255,255,255,0.1)",
              fontWeight: activeTab === tab.key ? "700" : "500", fontSize: "13px",
              display: "flex", alignItems: "center", gap: "8px"
            }}>
              {tab.label}
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Earnings Summary */}
        <div style={{ ...glassStyle, padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ color: "white", margin: "0 0 4px", fontSize: "15px", fontWeight: "800" }}>💰 My Earnings</h3>
              <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "12px" }}>Based on completed deliveries</p>
         </div>
       </div>
       <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
         {[
           { label: "Today", value: `₦${completedOrders.filter(o => new Date(o.updatedAt).toDateString() === new Date().toDateString()).length * 1500}`, color: "#27ae60", icon: "📅" },
           { label: "This Week", value: `₦${completedOrders.length * 1500}`, color: "#3498db", icon: "📊" },
           { label: "Total Orders", value: completedOrders.filter(o => o.status === "delivered").length, color: "#f39c12", icon: "✅" }
         ].map((stat, i) => (
           <div key={i} style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30`, borderRadius: "14px", padding: "16px", textAlign: "center" }}>
             <div style={{ fontSize: "22px", marginBottom: "6px" }}>{stat.icon}</div>
             <div style={{ fontSize: "18px", fontWeight: "900", color: stat.color, marginBottom: "4px" }}>{stat.value}</div>
             <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
           </div>
         ))}
       </div>
       <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
         <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>💡 Earn ₦1,500 per completed delivery</span>
         <span style={{ color: "#27ae60", fontWeight: "700", fontSize: "13px" }}>Active ✓</span>
       </div>
     </div>

        {/* Active Orders */}
        {activeTab === "active" && (
          <div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ ...glassStyle, padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                      <Skeleton width="140px" height="16px" />
                      <Skeleton width="80px" height="22px" borderRadius="20px" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <Skeleton height="80px" borderRadius="12px" />
                      <Skeleton height="80px" borderRadius="12px" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingOrders.length === 0 ? (
              <div style={{ ...glassStyle, padding: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "50px", marginBottom: "16px" }}>📭</div>
                <h3 style={{ color: "white", fontWeight: "800", marginBottom: "8px" }}>No Active Orders</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", margin: 0 }}>You have no pending deliveries right now</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {pendingOrders.map((order, i) => (
                  <div key={i} style={{
                    ...glassStyle,
                    overflow: "hidden",
                    border: `1px solid ${getStatusColor(order.status)}30`,
                    animation: "slideDown 0.3s ease"
                  }}>
                    {/* Status Bar */}
                    <div style={{ height: "3px", background: `linear-gradient(90deg, ${getStatusColor(order.status)}, ${getStatusColor(order.status)}60)` }} />

                    {/* Order Header */}
                    <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "20px" }}>{getStatusIcon(order.status)}</span>
                        <span style={{ fontWeight: "800", color: "#3498db", fontSize: "15px" }}>{order.trackingNumber}</span>
                        <span style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status), padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", border: `1px solid ${getStatusColor(order.status)}40` }}>
                          {order.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                        {order.package?.fragile && (
                          <span style={{ background: "rgba(231,76,60,0.2)", color: "#e74c3c", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", border: "1px solid rgba(231,76,60,0.3)" }}>⚠️ FRAGILE</span>
                        )}
                      </div>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</span>
                    </div>

                    {/* Order Body */}
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ background: "rgba(52,152,219,0.1)", border: "1px solid rgba(52,152,219,0.2)", borderRadius: "12px", padding: "14px" }}>
                          <div style={{ fontSize: "10px", color: "#3498db", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>📤 PICKUP LOCATION</div>
                          <div style={{ fontSize: "14px", color: "white", fontWeight: "700", marginBottom: "4px" }}>{order.sender?.name}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>📞 {order.sender?.phone}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px", lineHeight: "1.4" }}>{order.sender?.address}</div>
                        </div>
                        <div style={{ background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.2)", borderRadius: "12px", padding: "14px" }}>
                          <div style={{ fontSize: "10px", color: "#27ae60", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.5px" }}>📥 DELIVERY LOCATION</div>
                          <div style={{ fontSize: "14px", color: "white", fontWeight: "700", marginBottom: "4px" }}>{order.recipient?.name}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>📞 {order.recipient?.phone}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px", lineHeight: "1.4" }}>{order.recipient?.address}</div>
                        </div>
                      </div>

                      {/* Package & Actions */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          {/* GPS Button */}
                          {activeOrderId === order._id ? (
                            <button onClick={stopTracking} style={{ padding: "10px 20px", background: "rgba(231,76,60,0.2)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.4)", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e74c3c", animation: "pulse 1s infinite", display: "inline-block" }} />
                              Stop Tracking
                            </button>
                          ) : (
                            <button onClick={() => startTracking(order._id)} style={{ padding: "10px 20px", background: "rgba(39,174,96,0.2)", color: "#27ae60", border: "1px solid rgba(39,174,96,0.4)", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                              📍 Start GPS Tracking
                            </button>
                          )}

                          <div style={{ background: "rgba(155,89,182,0.15)", border: "1px solid rgba(155,89,182,0.25)", borderRadius: "10px", padding: "8px 14px" }}>
                            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>📦 {order.package?.description} • ⚖ {order.package?.weight}kg</span>
                          </div>
                        </div>

                        {/* Status Dropdown */}
                        <select onChange={(e) => updateStatus(order._id, e.target.value)} value={order.status}
                          style={{ padding: "10px 14px", border: `1.5px solid ${getStatusColor(order.status)}50`, borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: getStatusColor(order.status), background: `${getStatusColor(order.status)}15`, outline: "none" }}>
                          <option value="pending">⏳ Pending</option>
                          <option value="picked_up">📦 Picked Up</option>
                          <option value="in_transit">🚚 In Transit</option>
                          <option value="delivered">✅ Delivered</option>
                          <option value="delayed">⚠️ Delayed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Orders */}
        {activeTab === "completed" && (
          <div style={{ ...glassStyle, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "white", margin: 0, fontSize: "15px", fontWeight: "800" }}>Completed Deliveries</h3>
              <span style={{ background: "rgba(39,174,96,0.2)", color: "#27ae60", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", border: "1px solid rgba(39,174,96,0.3)" }}>{completedOrders.length} Total</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Tracking #", "Recipient", "Address", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((order, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "13px 20px", color: "#3498db", fontWeight: "800", fontSize: "13px" }}>{order.trackingNumber}</td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ fontSize: "13px", color: "white", fontWeight: "600" }}>{order.recipient?.name}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{order.recipient?.phone}</div>
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: "12px", color: "rgba(255,255,255,0.45)", maxWidth: "180px" }}>{order.recipient?.address}</td>
                    <td style={{ padding: "13px 20px" }}>
                      <span style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status), padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", border: `1px solid ${getStatusColor(order.status)}40` }}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {completedOrders.length === 0 && (
              <div style={{ padding: "50px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
                <p>No completed orders yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

        {/* Proof of Delivery - show when delivered */}
        {order.status === "in_transit" && (
          <div style={{ marginTop: "12px", padding: "12px", background: "rgba(39,174,96,0.1)", borderRadius: "12px", border: "1px solid rgba(39,174,96,0.2)" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "0 0 8px" }}>
              📸 Upload proof of delivery when package is delivered
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("photo", file);
                formData.append("orderId", order._id);
                try {
                   await fetch(`https://tobby-delivery-backend.onrender.com/api/orders/${order._id}/proof`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${localStorage.getItem("agentToken")}` },
                      body: formData
                    });
                    showMessage("Photo uploaded successfully!", "success");
                  } catch (err) {
                    showMessage("Error uploading photo", "error");
                  }
                }}
                style={{ display: "none" }}
                id={`photo-${order._id}`}
              />
              <label htmlFor={`photo-${order._id}`} style={{ padding: "8px 18px", background: "rgba(39,174,96,0.2)", color: "#27ae60", border: "1px solid rgba(39,174,96,0.4)", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
               📸 Upload Delivery Photo
             </label>
           </div>
         )}

export default Dashboard;