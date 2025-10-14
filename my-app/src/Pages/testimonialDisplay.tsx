import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase"; // adjust path if needed
import supabase from "../CONFIG/supabaseClient";
import "../CSS/testimonialDisplay.css";
import HeaderLogged from "../INCLUDE/header-logged";
import HeaderUnlogged from "../INCLUDE/header-unlogged";
import Footer from "../INCLUDE/footer";
import { useNavigate } from "react-router-dom";

type UserRow = {
  uid: string;
  username?: string | null;
  email?: string | null;
  profile_picture?: string | null;
};

type RawTestimonial = {
  id: string;
  testimonial: string;
  status?: string | null;
  created_at?: string | null;
  user_id?: string | null;
};

type TestimonialRow = {
  id: string;
  testimonial: string;
  status?: string | null;
  created_at?: string | null;
  users: {
    username?: string | null;
    email?: string | null;
    profile_picture?: string | null;
  } | null;
};

const TestimonialDisplay: React.FC = () => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [data, setData] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setAuthUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      const { data: tData, error: tErr } = await supabase
        .from("testimonials")
        .select("id, testimonial, status, created_at, user_id")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (tErr) {
        console.error("Error fetching testimonials:", tErr);
        setData([]);
        setLoading(false);
        return;
      }

      const testimonials = (tData as RawTestimonial[]) ?? [];
      const userIds = Array.from(
        new Set(testimonials.map((t) => t.user_id).filter(Boolean) as string[])
      );

      let usersMap: Record<string, UserRow> = {};
      if (userIds.length) {
        const { data: uData, error: uErr } = await supabase
          .from("users")
          .select("uid, username, email, profile_picture")
          .in("uid", userIds);

        if (!uErr && uData) {
          usersMap = (uData as UserRow[]).reduce<Record<string, UserRow>>(
            (acc, u) => {
              acc[u.uid] = u;
              return acc;
            },
            {}
          );
        }
      }

      const combined: TestimonialRow[] = testimonials.map((t) => ({
        id: t.id,
        testimonial: t.testimonial,
        status: t.status ?? null,
        created_at: t.created_at ?? null,
        users: t.user_id ? usersMap[t.user_id] ?? null : null,
      }));

      setData(combined);
      setLoading(false);
    };

    fetchTestimonials();
  }, []);

  const toggleView = () => {
    setVisibleCount((prev) => (prev === 9 ? data.length : 9));
  };

  // 🟢 Button handler for redirect/login logic
  const handleSubmitClick = () => {
    if (authUser) {
      navigate("/testimonialSubmit");
    } else {
      navigate("/login", { state: { redirectTo: "/testimonialSubmit" } });
    }
  };

  return (
    <>
      {authUser ? <HeaderLogged /> : <HeaderUnlogged />}
      <main>
        <section className="testDisplay-section">
          <h2>Hear Directly From Our Users</h2>
          <h6>
            We don’t just create solutions—we build relationships that last.
            Discover how our work has <br /> made a difference through the
            voices of those who matter most.
          </h6>

          {/* 🟣 Updated button with navigate() */}
          <button
            onClick={handleSubmitClick}
            className="testimonialSubmit-headerBtn"
            style={{
              cursor: "pointer",
            }}
          >
            Submit Testimonial
          </button>

          {loading && <p style={{ textAlign: "center" }}>Loading…</p>}
          {!loading && !data.length && (
            <p style={{ textAlign: "center" }}>No testimonials yet.</p>
          )}

          {!loading && data.length > 0 && (
            <>
              <div className="testDisplay-grid">
                {data.slice(0, visibleCount).map((t) => (
                  <div className="testDisplay-card" key={t.id}>
                    <div className="testDisplay-userDetails">
                      <img
                        src={
                          t.users?.profile_picture ||
                          "/PICTURES/default-avatar.png"
                        }
                        alt={t.users?.username || "User"}
                      />
                      <div>
                        <h5>{t.users?.username ?? "Unknown User"}</h5>
                        <small>{t.users?.email ?? "No email"}</small>
                      </div>
                    </div>
                    <p>“{t.testimonial}”</p>
                  </div>
                ))}
              </div>
              {data.length > 9 && (
                <div className="testDisplay-view-more-container">
                  <button
                    className="testDisplay-view-more-btn"
                    onClick={toggleView}
                  >
                    {visibleCount === 9 ? "View More" : "See Less"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default TestimonialDisplay;
