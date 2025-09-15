import React, { useEffect, useRef, useState } from "react";
import supabase from "../CONFIG/supabaseClient";

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

  // Drag-to-scroll using pointer events (works for mouse & touch)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let isPointerDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    // pointerdown
    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      // capture pointer so we reliably get pointerup even if pointer leaves element
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        /* ignore if not supported */
      }
      startX = e.clientX;
      startScrollLeft = container.scrollLeft;
      container.classList.add("dragging");
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      // prevent default so browser doesn't do text selection / native scroll
      e.preventDefault();
      const x = e.clientX;
      const walk = x - startX; // positive when moving right
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
      <style>{`
        #testimonials {
          padding: 3rem 0;
          background: #f8f9fa;
          font-family: system-ui, sans-serif;
        }
        #testimonials h2 {
          text-align: center;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .testimonial-scroll {
          display: flex;
          gap: 1rem;
          padding: 0 1rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -ms-overflow-style: none;  /* IE/Edge */
          scrollbar-width: none;     /* Firefox */
          touch-action: pan-y;       /* allow vertical page scroll, handle horizontal in JS */
          cursor: grab;
        }
        .testimonial-scroll::-webkit-scrollbar { display: none; }

        .testimonial-scroll.dragging {
          cursor: grabbing;
        }

        .testimonial-card {
          flex: 0 0 calc(33.333% - 1rem); /* show 3 cards on large screens */
          min-width: 280px;
          background: #fff;
          border-radius: 1rem;
          padding: 1.25rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          text-align: center;
          scroll-snap-align: start;
          user-select: none; /* prevent selection while dragging */
        }
        .testimonial-card img {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 0.75rem;
          -webkit-user-drag: none; /* Safari */
        }
        .testimonial-card h5 {
          margin: 0 0 0.25rem;
          font-size: 1.05rem;
        }
        .testimonial-card small {
          display: block;
          color: #6c757d;
          margin-bottom: 0.5rem;
        }
        .testimonial-card p {
          font-size: 0.95rem;
          line-height: 1.4;
          color: #333;
          margin: 0;
        }

        /* responsive adjustments */
        @media (max-width: 900px) {
          .testimonial-card { flex: 0 0 calc(50% - 1rem); min-width: 240px; }
        }
        @media (max-width: 540px) {
          .testimonial-card { flex: 0 0 calc(100% - 1rem); min-width: 220px; }
        }
      `}</style>

      <section id="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonial-scroll" ref={scrollRef}>
          {data.map((t) => (
            <div className="testimonial-card" key={t.id}>
              <img
                src={t.users?.profile_picture || "/PICTURES/default-avatar.png"}
                alt={t.users?.username || "User"}
                draggable={false}
              />
              <h5>{t.users?.username ?? "Unknown User"}</h5>
              <small>{t.users?.email ?? "No email"}</small>
              <p>“{t.testimonial}”</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Testimonials;
