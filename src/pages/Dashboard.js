import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { io } from "socket.io-client";

const BACKEND_URL = "https://tobby-delivery-backend.onrender.com";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tracking, setTracking] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [location, setLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const watchIdRef = useRef(null);
  const navigate = useNavigate();
  const agent = JSON.parse(localStorage.getItem("agentUser") || "{}");

  useEffect(() => {
    if (!localStorage.getItem("agentToken")) {
      navigate("/");
      return;
    }
    fetchOrders();
    initSocket();
    return () => {
      stopTracking();
      if (socket) socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);


  const initSocket = () => {
    const newSocket = io(BACKEND_URL);
    newSocket.on("connect", () => {
      newSocket.emit("agent_online", { agentId: agent.id });
    });
    setSocket(newSocket);
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders");
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status, note: `Status updated by agent` });
      setMessage(`✅ Order status updated to ${status.replace(/_/g, " ")}!`);
      fetchOrders();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Error updating status");
    }
  };

  const startTracking = (orderId) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setActiveOrderId(orderId);
    setTracking(true);

    if (socket) socket.emit("agent_online", { agentId: agent.id, orderId });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        const locationData = { latitude, longitude, speed: speed || 0, heading: heading || 0 };
        setLocation(locationData);

        if (socket) {
          socket.emit("update_location", {
            agentId: agent.id,
            orderId,
            ...locationData
          });
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
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

  const pendingOrders = orders.filter(o => ["pending", "picked_up", "in_transit"].includes(o.status));
  const completedOrders = orders.filter(o => ["delivered", "cancelled"].includes(o.status));

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f0f2f5" }}>

      {/* Navbar */}
      <nav style={{ background: "linear-gradient(180deg, #1a252f, #2c3e50)", padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "28px" }}>🚚</span>
          <div>
            <div style={{ color: "white", fontWeight: "800", fontSize: "18px" }}>STeX Logistics</div>
            <div style={{ color: "#e74c3c", fontSize: "10px", letterSpacing: "2px" }}>AGENT PORTAL</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {tracking && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(39,174,96,0.2)", padding: "8px 16px", borderRadius: "20px", border: "1px solid #27ae60" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27ae60", animation: "pulse 1s infinite" }} />
              <span style={{ color: "#27ae60", fontSize: "13px", fontWeight: "600" }}>Live Tracking</span>
              {location && <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px" }}>📍 {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}</span>}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#e74c3c", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700" }}>
              {agent.name?.charAt(0)}
            </div>
            <span style={{ color: "white", fontWeight: "600" }}>{agent.name}</span>
          </div>
          <button onClick={logout} style={{ padding: "10px 20px", background: "#e74c3c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "30px auto", padding: "0 20px" }}>

        {/* Message */}
        {message && (
          <div style={{ background: message.includes("❌") ? "#fdedec" : "#eafaf1", color: message.includes("❌") ? "#e74c3c" : "#27ae60", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", borderLeft: `4px solid ${message.includes("❌") ? "#e74c3c" : "#27ae60"}`, fontWeight: "600" }}>
            {message}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "25px" }}>
          {[
            { label: "Active Orders", value: pendingOrders.length, color: "#f39c12", bg: "#fef9e7", icon: "📦" },
            { label: "Delivered", value: completedOrders.filter(o => o.status === "delivered").length, color: "#27ae60", bg: "#eafaf1", icon: "✅" },
            { label: "Total Assigned", value: orders.length, color: "#3498db", bg: "#ebf5fb", icon: "📋" },
            { label: "Tracking", value: tracking ? "ON" : "OFF", color: tracking ? "#27ae60" : "#95a5a6", bg: tracking ? "#eafaf1" : "#f8f9fa", icon: "📍" }
          ].map((stat, i) => (
            <div key={i} style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 15px rgba(0,0,0,0.06)", borderTop: `4px solid ${stat.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#7f8c8d", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{stat.label}</div>
                  <div style={{ fontSize: "26px", fontWeight: "900", color: stat.color }}>{stat.value}</div>
                </div>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Orders */}
        <div style={{ background: "white", borderRadius: "16px", padding: "25px", boxShadow: "0 2px 15px rgba(0,0,0,0.06)", marginBottom: "25px" }}>
          <h3 style={{ color: "#2c3e50", margin: "0 0 20px", fontWeight: "800", fontSize: "18px" }}>📦 Active Orders</h3>

          {loading ? (
            <p style={{ color: "#7f8c8d", textAlign: "center", padding: "30px" }}>Loading orders...</p>
          ) : pendingOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#7f8c8d" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
              <p>No active orders assigned to you</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {pendingOrders.map((order, i) => (
                <div key={i} style={{ borderRadius: "12px", border: `1px solid ${getStatusColor(order.status)}30`, overflow: "hidden" }}>
                  {/* Order Header */}
                  <div style={{ background: `${getStatusColor(order.status)}15`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${getStatusColor(order.status)}20` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontWeight: "800", color: "#3498db", fontSize: "16px" }}>{order.trackingNumber}</span>
                      <span style={{ background: getStatusColor(order.status), color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      {order.package?.fragile && <span style={{ background: "#e74c3c", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>⚠️ FRAGILE</span>}
                    </div>
                    <div style={{ fontSize: "13px", color: "#7f8c8d" }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>

                  {/* Order Details */}
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                      <div style={{ background: "#ebf5fb", borderRadius: "10px", padding: "12px" }}>
                        <div style={{ fontSize: "11px", color: "#3498db", fontWeight: "700", marginBottom: "4px" }}>📤 PICKUP</div>
                        <div style={{ fontSize: "13px", color: "#2c3e50", fontWeight: "600" }}>{order.sender?.name}</div>
                        <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{order.sender?.address}</div>
                        <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{order.sender?.phone}</div>
                      </div>
                      <div style={{ background: "#eafaf1", borderRadius: "10px", padding: "12px" }}>
                        <div style={{ fontSize: "11px", color: "#27ae60", fontWeight: "700", marginBottom: "4px" }}>📥 DELIVERY</div>
                        <div style={{ fontSize: "13px", color: "#2c3e50", fontWeight: "600" }}>{order.recipient?.name}</div>
                        <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{order.recipient?.address}</div>
                        <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{order.recipient?.phone}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {/* GPS Tracking Button */}
                        {activeOrderId === order._id ? (
                          <button onClick={stopTracking} style={{ padding: "10px 18px", background: "#e74c3c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                            🔴 Stop Tracking
                          </button>
                        ) : (
                          <button onClick={() => startTracking(order._id)} style={{ padding: "10px 18px", background: "#27ae60", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                            📍 Start Tracking
                          </button>
                        )}

                        {/* Package Info */}
                        <span style={{ fontSize: "13px", color: "#7f8c8d" }}>📦 {order.package?.description} • {order.package?.weight}kg</span>
                      </div>

                      {/* Status Update */}
                      <select
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        value={order.status}
                        style={{ padding: "10px 14px", border: "2px solid #ecf0f1", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#2c3e50", background: "white" }}
                      >
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

        {/* Completed Orders */}
        <div style={{ background: "white", borderRadius: "16px", padding: "25px", boxShadow: "0 2px 15px rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#2c3e50", margin: "0 0 20px", fontWeight: "800", fontSize: "18px" }}>✅ Completed Orders</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                {["Tracking #", "Recipient", "Address", "Status", "Date"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#2c3e50", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((order, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "14px 16px", color: "#3498db", fontWeight: "700", fontSize: "14px" }}>{order.trackingNumber}</td>
                  <td style={{ padding: "14px 16px", fontSize: "14px" }}>{order.recipient?.name}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#7f8c8d" }}>{order.recipient?.address}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: getStatusColor(order.status), color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#7f8c8d" }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {completedOrders.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#7f8c8d" }}>No completed orders yet</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;