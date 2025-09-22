import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../INCLUDE/admin-sidebar";
import supabase from "../CONFIG/supabaseClient";
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
  const [adminCount, setAdminCount] = useState<number>(0);
  const [registrations, setRegistrations] = useState<any[]>([]);

  const COLORS = ["#4CAF50", "#2E7D32"]; // Users, Admins

  const handleLogout = () => {
    localStorage.removeItem("adminToken"); // clear session
    navigate("/admin_login");
  };

  // ✅ Fetch counts + registration history
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get total users
        const { count: users, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        if (usersError) throw usersError;
        setUserCount(users || 0);

        // Get only approved testimonials
        const { count: testimonials, error: testimonialsError } =
          await supabase
            .from("testimonials")
            .select("*", { count: "exact", head: true })
            .eq("status", "approved");

        if (testimonialsError) throw testimonialsError;
        setTestimonialCount(testimonials || 0);

        // Get admins count
        const { count: admins, error: adminsError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");

        if (adminsError) throw adminsError;
        setAdminCount(admins || 0);

        // Get registrations in last 7 days
        const { data, error } = await supabase
          .from("users")
          .select("created_at")
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          );

        if (error) throw error;

        // Process into daily counts
        const dailyCounts: { [key: string]: number } = {};
        data?.forEach((user) => {
          const date = new Date(user.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });

        const chartData = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const label = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return { date: label, registrations: dailyCounts[label] || 0 };
        });

        setRegistrations(chartData);
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* ✅ Floating Sidebar */}
      <AdminHeader />

      {/* ✅ Main Content shifted right */}
      <div style={{ marginLeft: "290px", padding: "20px" }}>
        <h1>Welcome, Admin!</h1>

        {/* ✅ Dashboard Cards */}
        <div className="row mt-4">
          {/* Total Users */}
          <div className="col-md-4 mb-3">
            <div className="card shadow text-center">
              <div className="card-body">
                <h5 className="card-title">Total Users</h5>
                <h2>{userCount}</h2>
              </div>
            </div>
          </div>

          {/* Total Testimonials */}
          <div className="col-md-4 mb-3">
            <div className="card shadow text-center">
              <div className="card-body">
                <h5 className="card-title">Total Feedback</h5>
                <h2>{testimonialCount}</h2>
              </div>
            </div>
          </div>

          {/* Downloads (Coming Soon) */}
          <div className="col-md-4 mb-3">
            <div className="card shadow text-center">
              <div className="card-body">
                <h5 className="card-title">Downloads</h5>
                <h2>Coming Soon</h2>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Graphs Row */}
        <div className="row mt-4">
          {/* 📈 Registrations Line Chart */}
          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow-sm">
              <h5>Registrations (Last 7 Days)</h5>
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

          {/* 🟢 Accounts Overview Pie Chart */}
          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow-sm">
              <h5>Accounts Overview</h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
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
                      <Cell key={index} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
