import React, { useEffect, useRef, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import "../CSS/testimonialSec.css";

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

const Testimonials: React.FC = () => {
  const [data, setData] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
      if (!testimonials.length) {
        setData([]);
        setLoading(false);
        return;
      }

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
        //ignore 
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

  if (loading) return <p style={{ textAlign: "center" }}>Loading testimonials…</p>;
  if (!data.length) return <p style={{ textAlign: "center" }}>No testimonials yet.</p>;

  return (
    <>
      <section id="testimonials" className="testSection container">
        <div className="testSection-header-wrapper">
          <div className="testSection-headers">
            <h2 className="testSec-header">What Our Users Say</h2>
            <h6 className="testSec-subheader">Real experiences from real farmers who are growing smarter with Aniko.</h6>
          </div>

          <div className="testSection-headerBtn">
            <button className="testDisplay-btn"><a href="testimonialDisplay.tsx">View Testimonials</a></button>
          </div>
        </div>
        
        <div className="testimonial-scroll testSec-scroll" ref={scrollRef}>
          {data.map((t) => (
            <div className="card testSec-card" key={t.id}>
              <div className="testSec-userDetails">
                 <img
                  src={t.users?.profile_picture || "/PICTURES/default-avatar.png"}
                  alt={t.users?.username || "User"}
                  draggable={false}
                  className="testSec-userProfile"
                />
                <div className="testSec-nameDeets">
                  <h5 className="testSec-username">{t.users?.username ?? "Unknown User"}</h5>
                  <small className="testSec-email">{t.users?.email ?? "No email"}</small>
                </div>
               
              </div>
              
              <p className="testSec-text">“{t.testimonial}”</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Testimonials;
