import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";

interface Testimonial {
  id: number;
  testimonial: string;
  created_at: string;
  user: {
    full_name: string;
    profile_image: string;
  };
}

const Testimonials: React.FC = () => {
  const [approvedTestimonials, setApprovedTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("testimonials")
      .select(
        `
        id,
        testimonial,
        created_at,
        user_id,
        user:users (
          full_name,
          profile_image
        )
      `
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching testimonials:", error);
      setErrorMsg("Failed to load testimonials. Please try again later.");
      setLoading(false);
      return;
    }

    if (data) {
      // Map and provide fallback values for missing fields
      const testimonialsWithUser: Testimonial[] = data.map((t: any) => ({
        id: t.id,
        testimonial: t.testimonial || "No testimonial text",
        created_at: t.created_at || new Date().toISOString(), // fallback for NULL
        user: {
          full_name: t.user?.full_name || "Anonymous User",
          profile_image:
            t.user?.profile_image || "https://via.placeholder.com/80",
        },
      }));

      setApprovedTestimonials(testimonialsWithUser);
    }

    setLoading(false);
  };

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <h2 className="text-center mb-4">What Our Users Say</h2>

        {/* ✅ Loading State */}
        {loading && (
          <p className="text-center text-muted">Loading testimonials...</p>
        )}

        {/* ✅ Error State */}
        {errorMsg && (
          <p className="text-center text-danger">{errorMsg}</p>
        )}

        {/* ✅ Testimonials Grid */}
        {!loading && !errorMsg && (
          <div className="row">
            {approvedTestimonials.length > 0 ? (
              approvedTestimonials.map((t) => (
                <div key={t.id} className="col-md-4 mb-4">
                  <div className="card shadow-sm h-100 text-center p-3">
                    <img
                      src={t.user.profile_image}
                      alt={`Profile picture of ${t.user.full_name}`}
                      className="rounded-circle mx-auto mb-3"
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                      }}
                    />
                    <h5 className="mb-1">{t.user.full_name}</h5>
                    <small className="text-muted mb-2 d-block">
                      {new Date(t.created_at).toLocaleDateString()}
                    </small>
                    <p className="card-text">"{t.testimonial}"</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted">
                No approved testimonials yet.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
