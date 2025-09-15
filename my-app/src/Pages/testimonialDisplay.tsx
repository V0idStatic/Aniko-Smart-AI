import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase"; // adjust path if needed
import supabase from "../CONFIG/supabaseClient";

import HeaderLogged from "../INCLUDE/header-logged";
import HeaderUnlogged from "../INCLUDE/header-unlogged";
import Footer from "../INCLUDE/footer";

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

  useEffect(() => {
    // track logged in user for header
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

  return (
    <>
      {authUser ? <HeaderLogged /> : <HeaderUnlogged />}
      <main style={{ paddingTop: "90px" }}>
        <style>{`
          .testimonial-section {
            padding: 3rem 1rem;
            background: #f8f9fa;
            font-family: system-ui, sans-serif;
            min-height: 80vh;
          }
          .testimonial-section h2 {
            text-align: center;
            font-weight: 700;
            margin-bottom: 2rem;
          }
          .testimonial-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
          }
          .testimonial-card {
            background: #fff;
            border-radius: 1rem;
            padding: 1.5rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            text-align: center;
            transition: transform 0.2s ease;
          }
          .testimonial-card:hover {
            transform: translateY(-4px);
          }
          .testimonial-card img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            margin-bottom: 1rem;
          }
          .testimonial-card h5 {
            margin: 0 0 0.25rem;
            font-size: 1.1rem;
          }
          .testimonial-card small {
            display: block;
            color: #6c757d;
            margin-bottom: 0.75rem;
          }
          .testimonial-card p {
            font-size: 0.95rem;
            line-height: 1.4;
            color: #333;
          }
          .view-more-container {
            text-align: center;
            margin-top: 2rem;
          }
          .view-more-btn {
            background: #1d492c;
            color: #fff;
            padding: 0.6rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            border: none;
            font-size: 1rem;
            transition: background 0.2s;
          }
          .view-more-btn:hover {
            background: #146d3a;
          }
        `}</style>

        <section className="testimonial-section">
          <h2>All Approved Testimonials</h2>
          {loading && <p style={{ textAlign: "center" }}>Loading…</p>}
          {!loading && !data.length && (
            <p style={{ textAlign: "center" }}>No testimonials yet.</p>
          )}

          {!loading && data.length > 0 && (
            <>
              <div className="testimonial-grid">
                {data.slice(0, visibleCount).map((t) => (
                  <div className="testimonial-card" key={t.id}>
                    <img
                      src={t.users?.profile_picture || "/PICTURES/default-avatar.png"}
                      alt={t.users?.username || "User"}
                    />
                    <h5>{t.users?.username ?? "Unknown User"}</h5>
                    <small>{t.users?.email ?? "No email"}</small>
                    <p>“{t.testimonial}”</p>
                  </div>
                ))}
              </div>
              {data.length > 9 && (
                <div className="view-more-container">
                  <button className="view-more-btn" onClick={toggleView}>
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
