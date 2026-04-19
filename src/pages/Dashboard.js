import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const agent = JSON.parse(localStorage.getItem("agentUser") || "{}");

  useEffect(() => {
    if (!localStorage.getItem("agentToken")) {
      navigate("/");
      return;
    }
    fetchOrders();
  }, [navigate]);

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
      setMessage(`Order status updated to ${status}!`);
      fetchOrders();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error updating status");
    }
  };

  const logout = () => {
    localStorage.removeItem("agentToken");
    localStorage.removeItem("agentUser");
    navigate("/");
  };

  const getStatusColor = (status) => {
    const colors = { pending: "#f39c12", picked_up: "#3498db", in_transit: "#9b59b6", delivered: "#27ae60", cancelled: "#e74c3c", delayed: "#e67e22" };
    return colors[status] || "#95a5a6";
  };

  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "picked_up" || o.status === "in_transit");
  const completedOrders = orders.filter(o => o.status === "delivered" || o.status === "cancelled");

  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", background: "#f4f6f8" }}>
      <nav style={{ background: "#2c3e50", padding: "15px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "white", margin: 0 }}>🚚 STeX Logistics - Agent Portal</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ color: "white" }}>👤 {agent.name}</span>
          <button onClick={logout} style={{ padding: "8px 16px", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px" }}>
        {message && <div style={{ background: message.includes("Error") ? "#fee" : "#d4edda", color: message.includes("Error") ? "#e74c3c" : "#27ae60", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>{message}</div>}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
          {[
            { label: "Active Orders", value: pendingOrders.length, color: "#f39c12", icon: "📦" },
            { label: "Delivered", value: completedOrders.filter(o => o.status === "delivered").length, color: "#27ae60", icon: "✅" },
            { label: "Total Assigned", value: orders.length, color: "#3498db", icon: "📋" }
          ].map((stat, i) => (
            <div key={i} style={{ background: "white", borderRadius: "12px", padding: "25px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${stat.color}`, textAlign: "center" }}>
              <div style={{ fontSize: "30px" }}>{stat.icon}</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
              <div style={{ color: "#7f8c8d" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Active Orders */}
        <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>📦 Active Orders</h3>
        {loading ? <p>Loading orders...</p> : pendingOrders.length === 0 ? (
          <div style={{ background: "white", padding: "40px", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "30px" }}>
            <p style={{ color: "#7f8c8d" }}>No active orders assigned to you</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
            {pendingOrders.map((order, i) => (
              <div key={i} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${getStatusColor(order.status)}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#3498db", fontSize: "16px" }}>{order.trackingNumber}</div>
                    <div style={{ color: "#555", marginTop: "8px" }}><strong>📤 Pickup:</strong> {order.sender?.address}</div>
                    <div style={{ color: "#555" }}><strong>📥 Deliver to:</strong> {order.recipient?.address}</div>
                    <div style={{ color: "#555" }}><strong>👤 Recipient:</strong> {order.recipient?.name} - {order.recipient?.phone}</div>
                    <div style={{ color: "#555" }}><strong>📦 Package:</strong> {order.package?.description} ({order.package?.weight}kg)</div>
                    {order.package?.fragile && <div style={{ color: "#e74c3c", fontWeight: "bold" }}>⚠️ FRAGILE</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ background: getStatusColor(order.status), color: "white", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" }}>
                      {order.status.replace("_", " ")}
                    </span>
                    <div style={{ marginTop: "15px" }}>
                      <select
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        value={order.status}
                        style={{ padding: "8px", border: "2px solid #ecf0f1", borderRadius: "6px", cursor: "pointer", width: "150px" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="delayed">Delayed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Orders */}
        <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>✅ Completed Orders</h3>
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#2c3e50", color: "white" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Tracking #</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Recipient</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Address</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((order, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #ecf0f1", background: i % 2 === 0 ? "white" : "#f8f9fa" }}>
                  <td style={{ padding: "12px", color: "#3498db", fontWeight: "bold" }}>{order.trackingNumber}</td>
                  <td style={{ padding: "12px" }}>{order.recipient?.name}</td>
                  <td style={{ padding: "12px" }}>{order.recipient?.address}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: getStatusColor(order.status), color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {completedOrders.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: "#7f8c8d" }}>No completed orders yet</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;