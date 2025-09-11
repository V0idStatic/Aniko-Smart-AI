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

  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyEmail, setReplyEmail] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyToId, setReplyToId] = useState<number | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    const { error } = await supabase.from("contact_messages").delete().eq("id", id);

    if (error) {
      console.error("Error deleting message:", error);
    } else {
      setMessages(messages.filter((msg) => msg.id !== id));
    }
  };

  const openReplyModal = (id: number, email: string, subject: string) => {
    setReplyToId(id);
    setReplyEmail(email);
    setReplySubject("Re: " + subject);
    setReplyMessage("");
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyToId || !replyMessage.trim()) {
      alert("Reply message cannot be empty.");
      return;
    }

    try {
      const response = await fetch("http://localhost/YOUR_PROJECT/send_reply.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          contact_id: replyToId.toString(),
          to_email: replyEmail,
          subject: replySubject,
          reply_message: replyMessage,
        }),
      });

      if (response.ok) {
        alert("Reply sent successfully to " + replyEmail);
        setShowReplyModal(false);
      } else {
        alert("Failed to send reply.");
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("An error occurred while sending the reply.");
    }
  };

  return (
    <div>
      <AdminHeader />
      <div style={{ marginLeft: "280px", padding: "20px" }}>
        <h1 className="adminCon-header">Contact Messages</h1>
        <h6 className="adminCon-subheader">Manage support requests and customer feedback</h6>

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
