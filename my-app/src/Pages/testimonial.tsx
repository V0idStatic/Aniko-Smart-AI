import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";

type Testimonial = {
  id: string;
  testimonial: string;
  created_at: string;
  user: {
    email: string;
    profile_picture: string | null;
  } | null;
};

const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select(`
          id,
          testimonial,
          created_at,
          user:user_id (
            email,
            profile_picture
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((item: any) => ({
        id: item.id,
        testimonial: item.testimonial,
        created_at: item.created_at,
        user: item.user
          ? {
              email: item.user.email,
              profile_picture: item.user.profile_picture,
            }
          : null, // if no user linked
      }));

      setTestimonials(normalized);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading testimonials...</p>;

  if (testimonials.length === 0) return <p>No testimonials available yet.</p>;

  return (
    <div className="testimonials">
      <h2>What People Say</h2>
      <ul>
        {testimonials.map((t) => (
          <li key={t.id} style={{ marginBottom: "16px" }}>
            <p>{t.testimonial}</p>
            <small style={{ display: "flex", alignItems: "center" }}>
              {t.user?.profile_picture && (
                <img
                  src={t.user.profile_picture}
                  alt={t.user.email}
                  width={40}
                  height={40}
                  style={{ borderRadius: "50%", marginRight: "8px" }}
                />
              )}
              {t.user?.email || "Anonymous"}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Testimonials;
