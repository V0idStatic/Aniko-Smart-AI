import React, { useEffect, useRef, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import supabaseAdmin from "../CONFIG/supabaseAdmin";
import "../CSS/testimonialSec.css";

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
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
  user: {
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
};

const Testimonials: React.FC = () => {
  const [data, setData] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      
      try {
        console.log("🔄 Starting to fetch testimonials...");
        
        // Fetch approved testimonials
        const { data: tData, error: tErr } = await supabase
          .from("testimonials")
          .select("id, testimonial, status, created_at, user_id")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (tErr) {
          console.error("❌ Error fetching testimonials:", tErr);
          setData([]);
          setLoading(false);
          return;
        }

        const testimonials = (tData as RawTestimonial[]) ?? [];
        console.log("✅ Fetched testimonials:", testimonials.length);
        console.log("📋 Testimonial user_ids:", testimonials.map(t => ({
          testimonial_id: t.id,
          user_id: t.user_id,
          user_id_length: t.user_id?.length,
          user_id_trimmed: t.user_id?.trim()
        })));

        if (!testimonials.length) {
          console.log("⚠️ No testimonials found");
          setData([]);
          setLoading(false);
          return;
        }

        // Fetch ALL auth users
        console.log("🔄 Fetching all auth users...");
        const { data: { users: authUsers }, error: uErr } = await supabaseAdmin.auth.admin.listUsers();

        if (uErr) {
          console.error("❌ Error fetching auth users:", uErr);
          // Still show testimonials but without user info
          const combined: TestimonialRow[] = testimonials.map((t) => ({
            id: t.id,
            testimonial: t.testimonial,
            status: t.status ?? null,
            created_at: t.created_at ?? null,
            user: null,
          }));
          setData(combined);
          setLoading(false);
          return;
        }

        console.log("✅ Fetched auth users:", authUsers?.length || 0);
        console.log("📋 Auth user IDs:", authUsers?.map(u => ({
          id: u.id,
          id_length: u.id.length,
          email: u.email,
          display_name: u.user_metadata?.full_name
        })));

        // Create a map of user ID to user data
        const usersMap: Record<string, AuthUser> = {};
        if (authUsers) {
          authUsers.forEach((authUser) => {
            // Trim whitespace from user ID just in case
            const cleanId = authUser.id.trim();
            usersMap[cleanId] = authUser as AuthUser;
            console.log(`👤 Mapped user: ${cleanId} -> ${authUser.email}`);
          });
        }

        console.log("🗺️ Users map keys:", Object.keys(usersMap));

        // Combine testimonials with user data
        const combined: TestimonialRow[] = testimonials.map((t) => {
          // Trim whitespace from user_id
          const cleanUserId = t.user_id?.trim();
          console.log(`🔍 Looking for user_id: "${cleanUserId}" (length: ${cleanUserId?.length})`);
          
          const matchedAuthUser = cleanUserId ? usersMap[cleanUserId] : null;
          
          if (matchedAuthUser) {
            console.log(`✅ Found user for testimonial ${t.id}:`, {
              name: matchedAuthUser.user_metadata?.full_name,
              email: matchedAuthUser.email,
              avatar: matchedAuthUser.user_metadata?.avatar_url
            });
          } else {
            console.log(`❌ No user found for testimonial ${t.id} with user_id: "${cleanUserId}"`);
            console.log(`Available user IDs:`, Object.keys(usersMap));
          }
          
          const userData = matchedAuthUser
            ? {
                name: matchedAuthUser.user_metadata?.full_name || matchedAuthUser.email?.split("@")[0] || "Anonymous",
                email: matchedAuthUser.email || "No email",
                avatar: matchedAuthUser.user_metadata?.avatar_url ?? undefined,
              }
            : null;
          
          return {
            id: t.id,
            testimonial: t.testimonial,
            status: t.status ?? null,
            created_at: t.created_at ?? null,
            user: userData,
          };
        });

        console.log("✅ Final combined data:", combined);
        setData(combined);
      } catch (err) {
        console.error("❌ Error in fetchTestimonials:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let isPointerDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      startX = e.clientX;
      startScrollLeft = container.scrollLeft;
      container.classList.add("dragging");
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      e.preventDefault();
      const x = e.clientX;
      const walk = x - startX;
      container.scrollLeft = startScrollLeft - walk;
    };

    const onPointerUpOrCancel = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      container.classList.remove("dragging");
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUpOrCancel);
    container.addEventListener("pointercancel", onPointerUpOrCancel);

    // cleanup
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUpOrCancel);
      container.removeEventListener("pointercancel", onPointerUpOrCancel);
    };
  }, [data]);

  if (loading) {
    return (
      <section id="testimonials" className="testSection container">
        <p style={{ textAlign: "center", padding: "40px" }}>Loading testimonials…</p>
      </section>
    );
  }

  if (!data.length) {
    return (
      <section id="testimonials" className="testSection container">
        <p style={{ textAlign: "center", padding: "40px" }}>No testimonials yet.</p>
      </section>
    );
  }

  return (
    <>
      <section id="testimonials" className="testSection container">
        <div className="testSection-header-wrapper">
          <div className="testSection-headers">
            <h2 className="testSec-header">What Our Users Say</h2>
            <h6 className="testSec-subheader">
              Real experiences from real farmers who are growing smarter with Aniko.
            </h6>
          </div>

          <div className="testSection-headerBtn">
            <a href="/testimonialDisplay">
              <button className="testDisplay-btn">View Testimonials</button>
            </a>
          </div>
        </div>

        <div className="testimonial-scroll testSec-scroll" ref={scrollRef}>
          {data.map((t) => (
            <div className="card testSec-card" key={t.id}>
              <div className="testSec-userDetails">
                {t.user?.avatar ? (
                  <img
                    src={t.user.avatar}
                    alt={t.user.name || "User"}
                    draggable={false}
                    className="testSec-userProfile"
                    onError={(e) => {
                      // Fallback to default avatar if image fails to load
                      e.currentTarget.src = "/PICTURES/default-avatar.png";
                    }}
                  />
                ) : (
                  <div className="testSec-userProfile testSec-defaultAvatar">
                    <i className="bi bi-person-circle"></i>
                  </div>
                )}
                <div className="testSec-nameDeets">
                  <h5 className="testSec-username">{t.user?.name ?? "Anonymous User"}</h5>
                  <small className="testSec-email">{t.user?.email ?? "No email"}</small>
                </div>
              </div>

              <p className="testSec-text">"{t.testimonial}"</p>
              
              {t.created_at && (
                <small className="testSec-date">
                  {new Date(t.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </small>
              )}
            </div>
          ))}
        </div>

        <div className="mobile-testSec-btn">
          <a href="/testimonialDisplay">
            <button className="testDisplay-btn">View Testimonials</button>
          </a>
        </div>
      </section>
    </>
  );
};

export default Testimonials;