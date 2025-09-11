import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import AdminHeader from "../INCLUDE/admin-header";
import "../CSS/admin_contact.css";

interface ContactMessage {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  newsletter: boolean;
  submitted_at: string;
}

const AdminContact: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
  // Reply modal states
>>>>>>> Stashed changes
=======
  // Reply modal states
>>>>>>> Stashed changes
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyTo, setReplyTo] = useState<string>("");
  const [replySubject, setReplySubject] = useState("Reply from Admin");
  const [replyMessage, setReplyMessage] = useState("");

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase.from("contact_messages").select("*");
      if (error) {
        console.error("Error fetching messages:", error.message);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();
  }, []);

  // Delete message
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) {
      console.error("Error deleting message:", error.message);
    } else {
      setMessages(messages.filter((msg) => msg.id !== id));
    }
  };

  // Open reply modal
  const handleReply = (email: string, subject: string) => {
    setReplyTo(email);
    setReplySubject(`Re: ${subject}`);
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
        alert(result.message);
        setShowReplyModal(false);
        setReplyMessage("");
        setReplySubject("Reply from Admin");
      } else {
        alert("Failed to send reply: " + result.message);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Error sending reply. Check console for details.");
    }
  };

  if (loading) {
    return <p>Loading messages...</p>;
  }

  return (
    <div>
      <AdminHeader />
<<<<<<< Updated upstream
      <div style={{ marginLeft: "280px", padding: "20px" }}>
        <h1 className="adminCon-header">Contact Messages</h1>
        <h6 className="adminCon-subheader">Manage support requests and customer feedback</h6>
=======
      <div style={{ marginLeft: "290px", padding: "20px" }}>
        <h1>Contact Messages</h1>
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Newsletter</th>
              <th>Submitted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg.id}>
                <td>{msg.id}</td>
                <td>{msg.first_name}</td>
                <td>{msg.last_name}</td>
                <td>{msg.email}</td>
                <td>{msg.phone}</td>
                <td>{msg.subject}</td>
                <td>{msg.message}</td>
                <td>{msg.newsletter ? "Yes" : "No"}</td>
                <td>{new Date(msg.submitted_at).toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => handleReply(msg.email, msg.subject)}
                  >
                    Reply
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(msg.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

        <div className="card adminCon-card">
          <h5><i className="bi bi-envelope-fill"></i>Recent Messages</h5>
              {loading ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p>No messages found.</p>
          ) : (
            <table className="table table-bordered adminCon-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Newsletter</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id}>
                    <td>{msg.id}</td>
                    <td>{msg.first_name}</td>
                    <td>{msg.last_name}</td>
                    <td>{msg.email}</td>
                    <td>{msg.phone}</td>
                    <td>{msg.subject}</td>
                    <td>{msg.message}</td>
                    <td>{msg.newsletter ? "Yes" : "No"}</td>
                    <td>{new Date(msg.submitted_at).toLocaleString()}</td>
                    <td>
                      <div className="d-flex gap-2 justify-content-center w-100">
                        <button
                          className="btn btn-primary btn-sm me-2 reply-btn"
                          onClick={() => openReplyModal(msg.id, msg.email, msg.subject)}
                        >
                        <i className="bi bi-reply-fill"></i>Reply
                        </button>
                        <button
                          className="btn btn-danger btn-sm del-btn"
                          onClick={() => handleDelete(msg.id)}
                        >
                          <i className="bi bi-trash3-fill"></i>Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      
        {/* Reply Modal */}
        {showReplyModal && (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
          <div
            className="modal fade show replyModal"
            style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered replyModal-dialog">
              <div className="modal-content replyMod-content">
                <div className="modal-header replyMod-header">
                  <h6 className="modal-title replyMod-title">Reply to {replyEmail}<i className="bi bi-reply-fill"></i></h6>
                  <button
                    className="btn-close adminCon-close"
                    onClick={() => setShowReplyModal(false)}
                  ></button>
                </div>
                <div className="modal-body replyMod-body">
                  <input
                    type="text"
                    className="form-control mb-2 replyMod-fc"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    readOnly
                  />
                  <textarea
                    className="form-control replyMod-textarea"
                    rows={5}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                  ></textarea>
                </div>
                <div className="modal-footer replyMod-footer">
                  <button
                    className="btn btn-secondary cancelRep-btn"
                    onClick={() => setShowReplyModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-success sendRep-btn" onClick={handleSendReply}>
                    <i className="bi bi-send"></i>Send Reply
=======
          <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
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
                  <button className="btn btn-secondary" onClick={() => setShowReplyModal(false)}>
                    Cancel
                  </button>
=======
          <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
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
                  <button className="btn btn-secondary" onClick={() => setShowReplyModal(false)}>
                    Cancel
                  </button>
>>>>>>> Stashed changes
                  <button className="btn btn-primary" onClick={handleSendReply}>
                    Send Reply
>>>>>>> Stashed changes
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
