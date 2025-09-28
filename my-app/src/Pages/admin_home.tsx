import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../INCLUDE/admin-sidebar";
import supabase from "../CONFIG/supabaseClient";
import "../CSS/admin_home.css";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AdminHome: React.FC = () => {
  const navigate = useNavigate();

  const [userCount, setUserCount] = useState<number>(0);
  const [testimonialCount, setTestimonialCount] = useState<number>(0);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<
    { id: number; email: string; message: string; submitted_at: string }[]
  >([]);
  const [pendingTestimonials, setPendingTestimonials] = useState<
    { id: number; user_id: string; testimonial: string; status: string }[]
  >([]);

  // 🔴 Hard-coded admin count
  const adminCount = 3;

  const COLORS = ["#4CAF50", "#2E7D32"];

  const fetchDashboard = async () => {
    try {
      const { count: users, error: usersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });
      if (usersError) throw usersError;
      setUserCount(users || 0);

      const { count: testimonials, error: testimonialsError } = await supabase
        .from("testimonials")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");
      if (testimonialsError) throw testimonialsError;
      setTestimonialCount(testimonials || 0);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { data, error } = await supabase
        .from("users")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString());
      if (error) throw error;

      const dailyCounts: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dailyCounts[label] = 0;
      }

      data?.forEach((user) => {
        const label = new Date(user.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (dailyCounts[label] !== undefined) dailyCounts[label] += 1;
      });

      const chartData = Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        registrations: count,
      }));
      setRegistrations(chartData);
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
    }
  };

  const fetchContactMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, email, message, submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      setContactMessages(data || []);
    } catch (err) {
      console.error("❌ Error fetching contact messages:", err);
    }
  };

  const fetchPendingTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, user_id, testimonial, status")
        .eq("status", "pending")
        .order("id", { ascending: false })
        .limit(5);
      if (error) throw error;
      setPendingTestimonials(data || []);
    } catch (err) {
      console.error("❌ Error fetching pending testimonials:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchContactMessages();
    fetchPendingTestimonials();
  }, []);

  return (
    <div>
      <AdminHeader />
      <div style={{ marginLeft: "290px", padding: "20px" }}>
        <h1 className="adminHome-header">Welcome, Admin!</h1>
        <h6 className="adminHome-subheader">Steamline Your Operations</h6>

        {/* Dashboard Cards */}
        <div className="row mt-4">
          <div className="col-md-4 mb-3">
            <div className="card shadow text-center adminHome-anaCard">
              <div className="card-body">
                <h5 className="card-title">Total Users</h5>
                <h2>{userCount}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow text-center adminHome-anaCard">
              <div className="card-body">
                <h5 className="card-title">Total Feedback</h5>
                <h2>{testimonialCount}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow text-center adminHome-anaCard">
              <div className="card-body">
                <h5 className="card-title">Downloads</h5>
                <h2>Coming Soon</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Graphs */}
        <div className="row mt-4">
          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow-sm adminHome-regCard">
              <h5>
                <i className="bi bi-clipboard-data"></i>Registrations (Past 7
                Days)
              </h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={registrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#4CAF50"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow-sm adminHome-accCard">
              <h5>
                <i className="bi bi-person-lines-fill"></i>Accounts Overview
              </h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  {/* Glow filter definition */}
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <Pie
                    data={[
                      { name: "Users", value: userCount },
                      { name: "Admins", value: adminCount },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {COLORS.map((color, index) => (
                      <Cell
                        key={index}
                        fill={color}
                        style={{ filter: "url(#glow)" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 📬 Contact Messages Table */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="card p-3 shadow-sm adminHome-tableCard">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5><i className="bi bi-inbox"></i>Recent Contact Messages</h5>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate("/admin_contact")}
                >
                  View More
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-striped table-hover adminHome-table">
                  <thead className="table-dark">
                    <tr>
                      <th>Email</th>
                      <th>Message</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactMessages.length > 0 ? (
                      contactMessages.map((msg) => (
                        <tr key={msg.id}>
                          <td>{msg.email}</td>
                          <td style={{ whiteSpace: "pre-wrap" }}>
                            {msg.message}
                          </td>
                          <td>
                            {new Date(msg.submitted_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No messages found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 🟠 Pending Testimonials Table */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="card p-3 shadow-sm adminHome-tableCard">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5><i className="bi bi-chat-dots"></i>Pending Testimonials</h5>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate("/admin_testimonial")}
                >
                  View More
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-striped table-hover adminHome-table">
                  <thead className="table-dark">
                    <tr>
                      <th>User ID</th>
                      <th>Testimonial</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTestimonials.length > 0 ? (
                      pendingTestimonials.map((item) => (
                        <tr key={item.id}>
                          <td>{item.user_id}</td>
                          <td style={{ whiteSpace: "pre-wrap" }}>
                            {item.testimonial}
                          </td>
                          <td>{item.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No pending testimonials.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
