import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import AdminHeader from "../INCLUDE/admin-sidebar";
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
  const [modalAction, setModalAction] = useState<{
    type: "approve" | "delete" | null;
    id: number | null;
  }>({ type: null, id: null });

  // Fetch data once and set up polling every 5 seconds
  useEffect(() => {
    fetchTestimonials();
    const interval = setInterval(fetchTestimonials, 5000); // auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchTestimonials = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching testimonials:", error);
      return;
    }

    if (data) {
      setPendingTestimonials(data.filter((t) => t.status === "pending"));
      setApprovedTestimonials(data.filter((t) => t.status === "approved"));
    }
  };

  const approveTestimonial = async (id: number) => {
    const { error } = await supabase
      .from("testimonials")
      .update({ status: "approved" })
      .eq("id", id);
    if (error) console.error("❌ Error approving testimonial:", error);
    fetchTestimonials();
  };

  const deleteTestimonial = async (id: number) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) console.error("❌ Error deleting testimonial:", error);
    fetchTestimonials();
  };

  const handleConfirm = async () => {
    if (!modalAction.type || !modalAction.id) return;

    if (modalAction.type === "approve") {
      await approveTestimonial(modalAction.id);
    } else if (modalAction.type === "delete") {
      await deleteTestimonial(modalAction.id);
    }
    setModalAction({ type: null, id: null });
  };

  return (
    <div>
      <AdminHeader />
      <div style={{ marginLeft: "280px", padding: "20px" }} className="adminTest-container">
        <h1 className="adminTest-header">Testimonial Management</h1>
        <h6 className="adminTest-subheader">
          Review and approve customer stories before publishing.
        </h6>

        {/* Pending Table */}
        <div className="card adminTest-card">
          <h5>
            <i className="bi bi-clock"></i> Pending Testimonials
          </h5>
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
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => setModalAction({ type: "approve", id: t.id })}
                      >
                        <i className="bi bi-check-circle-fill"></i> Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setModalAction({ type: "delete", id: t.id })}
                      >
                        <i className="bi bi-trash3-fill"></i> Delete
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

        {/* Approved Table */}
        <div className="card adminTest-card">
          <h5>
            <i className="bi bi-check2-circle"></i> Approved Testimonials
          </h5>
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
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setModalAction({ type: "delete", id: t.id })}
                      >
                        <i className="bi bi-trash3-fill"></i> Delete
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

      {/* Confirmation Modal */}
      {modalAction.type && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalAction.type === "approve" ? "Approve Testimonial" : "Delete Testimonial"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalAction({ type: null, id: null })}
                ></button>
              </div>
              <div className="modal-body">
                {modalAction.type === "approve"
                  ? "Are you sure you want to approve this testimonial?"
                  : "Are you sure you want to delete this testimonial? This action cannot be undone."}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalAction({ type: null, id: null })}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleConfirm}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonial;
