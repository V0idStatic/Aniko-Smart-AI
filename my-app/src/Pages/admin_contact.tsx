import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient"; // ✅ always use default import
import AdminHeader from "../INCLUDE/admin-sidebar";
import "../CSS/admin_contact.css";

interface ContactMessage {
  [key: string]: any; // 🔎 allow dynamic keys so we can see the actual ID field
}

const AdminContact: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // Reply modal
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyTo, setReplyTo] = useState<string>("");
  const [replySubject, setReplySubject] = useState("Reply from Admin");
  const [replyMessage, setReplyMessage] = useState("");

  // Success/Error modal
  const [modalMessage, setModalMessage] = useState<string>("");
  const [modalType, setModalType] = useState<"success" | "error" | "">("");

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase.from("contact_messages").select("*");

      if (error) {
        console.error("❌ Error fetching messages:", error.message);
      } else {
        if (data && data.length > 0) {
          console.log("📥 First row received from DB:", data[0]);
          console.log("🗝️ Available keys:", Object.keys(data[0]));
        } else {
          console.log("📭 No messages found.");
        }
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Real-time subscription
    const sub = supabase
      .channel("contact_messages_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  // Confirm delete
  const confirmDelete = (id: number) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;

    const numericId = Number(deleteTarget);

    console.log("🗑️ Attempting to delete row with id:", numericId);

    // ❗ Temporarily keep "id", but logs above will show the real key to use
    const { data, error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", numericId)
      .select();

    console.log("Delete response:", { data, error });

    if (error) {
      setModalType("error");
      setModalMessage("❌ Failed to delete message: " + error.message);
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== numericId));
      setModalType("success");
      setModalMessage("✅ Message deleted successfully.");
    }

    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // Open reply modal
  const handleReply = (email: string, subject: string) => {
    setReplyTo(email);
    setReplySubject(`Re: ${subject}`);
    setReplyMessage("");
    setShowReplyModal(true);
  };

  // Send reply
  const handleSendReply = async () => {
    try {
      const response = await fetch("http://localhost:5000/send-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_email: replyTo,
          subject: replySubject,
          reply_message: replyMessage,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setModalType("success");
        setModalMessage("✅ Reply sent successfully!");
        setShowReplyModal(false);
        setReplyMessage("");
        setReplySubject("Reply from Admin");
      } else {
        setModalType("error");
        setModalMessage("❌ Failed to send reply: " + result.message);
      }
    } catch (err) {
      console.error("❌ Error sending reply:", err);
      setModalType("error");
      setModalMessage("❌ Error sending reply. Check console for details.");
    }
  };

  if (loading) {
    return <p>Loading messages...</p>;
  }

  return (
    <div>
      <AdminHeader />

      <div style={{ marginLeft: "280px", padding: "20px" }}>
        <h1 className="adminCon-header">Contact Messages</h1>
        <h6 className="adminCon-subheader">
          Manage support requests and customer feedback
        </h6>

        <div className="card adminCon-card">
          <h5>
            <i className="bi bi-envelope-fill"></i> Recent Messages
          </h5>
          {messages.length === 0 ? (
            <p>No messages found.</p>
          ) : (
            <table className="table table-bordered adminCon-table">
              <thead>
                <tr>
                  {Object.keys(messages[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id || msg.contact_id || msg.message_id}>
                    {Object.keys(msg).map((key) => (
                      <td key={key}>{String(msg[key])}</td>
                    ))}
                    <td>
                      <div className="d-flex gap-2 justify-content-center w-100">
                        <button
                          className="btn btn-primary btn-sm me-2 reply-btn"
                          onClick={() => handleReply(msg.email, msg.subject)}
                        >
                          <i className="bi bi-reply-fill"></i> Reply
                        </button>
                        <button
                          className="btn btn-danger btn-sm del-btn"
                          onClick={() =>
                            confirmDelete(
                              msg.id || msg.contact_id || msg.message_id
                            )
                          }
                        >
                          <i className="bi bi-trash3-fill"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Deletion</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDeleteModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this message?</p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={handleDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {showReplyModal && (
          <div
            className="modal show d-block"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Reply to {replyTo}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowReplyModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label>Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label>Message</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowReplyModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSendReply}>
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Modal */}
        {modalType && (
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5
                    className={`modal-title ${
                      modalType === "success" ? "text-success" : "text-danger"
                    }`}
                  >
                    {modalType === "success" ? "Success" : "Error"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setModalType("")}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>{modalMessage}</p>
                </div>
                <div className="modal-footer">
                  <button
                    className={`btn ${
                      modalType === "success" ? "btn-success" : "btn-danger"
                    }`}
                    onClick={() => setModalType("")}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContact;
