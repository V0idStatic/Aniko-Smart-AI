import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import AdminHeader from "../INCLUDE/admin-header";
import "../CSS/admin_testimonial.css";


interface Testimonial {
  id: number;
  testimonial: string;
  status: string;
  user_id: string;
  created_at: string;
}

const AdminTestimonial: React.FC = () => {
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [approvedTestimonials, setApprovedTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const { data, error } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching testimonials:", error);
      return;
    }

    if (data) {
      setPendingTestimonials(data.filter((t) => t.status === "pending"));
      setApprovedTestimonials(data.filter((t) => t.status === "approved"));
    }
  };

  const handleApprove = async (id: number) => {
    const { error } = await supabase.from("testimonials").update({ status: "approved" }).eq("id", id);

    if (error) {
      console.error("❌ Error approving testimonial:", error);
      return;
    }

    fetchTestimonials(); 
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);

    if (error) {
      console.error("❌ Error deleting testimonial:", error);
      return;
    }

    fetchTestimonials(); 
  };

  return (
    <div>
      <AdminHeader />

      <div style={{ marginLeft: "280px", padding: "20px" }} className="adminTest-container">
        <h1 className="adminTest-header">Testimonial Management</h1>
        <h6 className="adminTest-subheader">Review and approve customer stories before publishing.</h6>
        <div className="card adminTest-card">
          <h5><i className="bi bi-clock"></i>Pending Testimonials</h5>
          <table className="table table-bordered table-hover adminTest-pending-table">
            <thead className="table-warning">
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Testimonial</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingTestimonials.length > 0 ? (
                pendingTestimonials.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.user_id}</td>
                    <td>{t.testimonial}</td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-success btn-sm me-2" onClick={() => handleApprove(t.id)}>
                        <i className="bi bi-check-circle-fill"></i>Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                        <i className="bi bi-trash3-fill"></i>Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    No pending testimonials
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        <div className="card adminTest-card">
          <h5><i className="bi bi-check2-circle"></i>Approved Testimonials</h5>
          <table className="table table-bordered table-hover adminTest-approved-table">
            <thead className="table-success">
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Testimonial</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvedTestimonials.length > 0 ? (
                approvedTestimonials.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.user_id}</td>
                    <td>{t.testimonial}</td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                        <i className="bi bi-trash3-fill"></i>Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    No approved testimonials
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      
      </div>
    </div>
  );
};

export default AdminTestimonial;
