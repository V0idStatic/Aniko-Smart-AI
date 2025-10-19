"use client"

import type React from "react"
import { useEffect, useState } from "react"
import supabase from "../CONFIG/supabaseClient"
import supabaseAdmin from "../CONFIG/supabaseAdmin"
import HeaderLogged from "../INCLUDE/header-logged"
import HeaderUnlogged from "../INCLUDE/header-unlogged"
import Footer from "../INCLUDE/footer"
import { useNavigate } from "react-router-dom"

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

const TestimonialDisplay: React.FC = () => {
  const [authUser, setAuthUser] = useState<any>(null)
  const [data, setData] = useState<TestimonialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(9)
  const navigate = useNavigate()

  // ✅ Use Supabase auth instead of Firebase
  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setAuthUser(session?.user || null)
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true)
      
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

        if (!testimonials.length) {
          console.log("⚠️ No testimonials found");
          setData([]);
          setLoading(false);
          return;
        }

        // Fetch ALL auth users using supabaseAdmin
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

        // Create a map of user ID to user data
        const usersMap: Record<string, AuthUser> = {};
        if (authUsers) {
          authUsers.forEach((authUser) => {
            const cleanId = authUser.id.trim();
            usersMap[cleanId] = authUser as AuthUser;
            console.log(`👤 Mapped user: ${cleanId} -> ${authUser.email}`);
          });
        }

        // Combine testimonials with user data
        const combined: TestimonialRow[] = testimonials.map((t) => {
          const cleanUserId = t.user_id?.trim();
          const matchedAuthUser = cleanUserId ? usersMap[cleanUserId] : null;
          
          if (matchedAuthUser) {
            console.log(`✅ Found user for testimonial ${t.id}:`, {
              name: matchedAuthUser.user_metadata?.full_name,
              email: matchedAuthUser.email,
              avatar: matchedAuthUser.user_metadata?.avatar_url
            });
          } else {
            console.log(`❌ No user found for testimonial ${t.id} with user_id: "${cleanUserId}"`);
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

    fetchTestimonials()
  }, [])

  const toggleView = () => {
    setVisibleCount((prev) => (prev === 9 ? data.length : 9))
  }

  // 🟢 Button handler for redirect/login logic
  const handleSubmitClick = () => {
    if (authUser) {
      navigate("/testimonialSubmit")
    } else {
      navigate("/login", { state: { redirectTo: "/testimonialSubmit" } })
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Zalando+Sans+Expanded:ital,wght@0,200..900;1,200..900&display=swap');

        :root {
            --primary-green: #1D492C;
            --accent-green: #84cc16;
            --pastel-green: #BDE08A;
            --light-green: #f0fdf4;
            --dark-green: #143820;
            --dark-gray: #374151;
            --light-gray: #f9fafb;
            --white: #ffffff;
            --bg-color: #cfc4b2ff;
            --primary-brown: #8A6440;
            --dark-brown: #4D2D18;
            --gradient-primary: linear-gradient(135deg, var(--primary-green), var(--accent-green));
            --gradient-secondary: linear-gradient(135deg, var(--primary-green), var(--pastel-green));
            --gradient-secondary-light: linear-gradient(135deg, var(--pastel-green), var(--light-green));
            --gradient-brown: linear-gradient(135deg, var(--primary-brown), var(--dark-brown));
            --gradient-brown-light: linear-gradient(135deg, var(--primary-brown), #c9b29e);
        }

        /* Base Styles */
        .testDisplay-section {
            padding: 3rem 1rem;
            background: var(--gradient-secondary-light) !important;
            font-family: system-ui, sans-serif;
            min-height: 100vh;
            margin: 0 !important;
            position: relative;
            z-index: 1;
        }

        .testDisplay-section h2 {
            text-align: center;
            font-weight: 700;
            margin-top: 6rem;
            color: var(--primary-green);
            font-size: 50px !important;
            font-weight: bold !important;
            font-family: "Zalando Sans Expanded";
        }

        .testDisplay-section h6 {
            color: var(--dark-gray) !important;
            opacity: 70% !important;
            text-align: center;
            font-weight: 500;
            font-size: 18px !important;
            margin-bottom: 3rem; 
            font-family: "Lexend";
        }

        .testimonialSubmit-headerBtn {
            justify-content: center;
            align-items: center;
            display: block !important;
            margin: 0 auto !important; 
            margin-bottom: 3rem !important;
            background-color: transparent !important;
            border: 2px solid var(--primary-brown) !important;
            border-radius: 25px !important; 
            padding: 10px; 
            width: 15%;
            color: var(--primary-brown);
            text-decoration: none !important; 
            font-weight: 500 !important; 
            box-shadow: 0px 0px 20px 5px var(--light-green) !important;
            transition: 
                background 0.4s ease-in-out,
                transform 0.3s ease,
                box-shadow 0.4s ease,
                color 0.3s ease;
            font-family: "Lexend";
        }

        .testimonialSubmit-headerBtn:hover {
            background: var(--gradient-brown) !important;
            color: var(--light-green); 
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0px 0px 30px 12px var(--accent-green);
            border-color: var(--dark-brown) !important;
        }

        .testSubmit-link {
            text-decoration: none !important;
            text-shadow: 0px 0px 10px var(--light-green) !important;
        }

        .testDisplay-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }

        .testDisplay-card {
            background-color: var(--light-green);
            border-radius: 80px;
            border-bottom-left-radius: 0 !important;
            padding: 2rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            text-align: center;
            transition: transform 0.2s ease;
            margin-bottom: 3rem;
        }

        .testDisplay-card:hover {
            transform: translateY(-4px);
        }

        .testDisplay-userDetails {
            display: flex;
            font-family: "Lexend"; 
            align-items: center;
        }

        .testDisplay-userProfile {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
            margin-bottom: 1rem;
        }

        .testDisplay-defaultAvatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: var(--pastel-green);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
        }

        .testDisplay-defaultAvatar i {
            font-size: 30px;
            color: var(--primary-green);
        }

        .testDisplay-nameDeets {
            margin-left: 1rem;
            text-align: left;
        }

        .testDisplay-username {
            margin: 0 0 0.25rem;
            font-size: 1.1rem;
            color: var(--dark-brown);
            font-weight: bold !important; 
            font-family: "Lexend";
        }

        .testDisplay-email {
            display: block;
            color: var(--primary-brown);
            font-family: "Lexend";
            font-size: 0.9rem;
        }

        .testDisplay-text {
            font-size: 0.95rem;
            line-height: 1.4;
            color: var(--primary-green);
            font-family: "Lexend";
            text-align: left !important;
            margin-top: 1.55rem;  
        }

        .testDisplay-date {
            display: block;
            margin-top: 1rem;
            color: var(--dark-gray);
            font-size: 0.85rem;
            text-align: right;
            font-family: "Lexend";
        }

        .testDisplay-view-more-container {
            text-align: center;
            margin-top: 2rem;
            position: relative;
            z-index: 1;
        }

        .testDisplay-view-more-btn {
            background: var(--gradient-secondary);
            color: #fff;
            padding: 0.6rem 1.5rem;
            border-radius: 20px;
            cursor: pointer;
            border: none;
            font-size: 1rem;
            width: 15%;
            box-shadow: 0px 0px 20px 5px var(--pastel-green);
            transition: 
                background 0.4s ease-in-out,
                transform 0.3s ease,
                box-shadow 0.4s ease;
            font-weight: 500; 
            font-family: "Lexend";
        }

        .testDisplay-view-more-btn:hover {
            background: var(--gradient-primary) !important;
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0px 0px 30px 12px var(--pastel-green);
        }

        /* Extra Small Mobile: 0px - 374px */
        @media (min-width: 0px) and (max-width: 374px) {
            .testDisplay-section {
                padding: 2rem 0.75rem;
            }

            .testDisplay-section h2 {
                font-size: 28px !important;
                margin-top: 3rem;
            }

            .testDisplay-section h6 {
                font-size: 14px !important;
                margin-bottom: 2rem;
                padding: 0 0.5rem;
            }

            .testimonialSubmit-headerBtn {
                width: 90%;
                padding: 12px;
                font-size: 14px;
            }

            .testDisplay-grid {
                grid-template-columns: 1fr;
                gap: 1.25rem;
            }

            .testDisplay-card {
                padding: 1.25rem;
                border-radius: 60px;
                margin-bottom: 1.5rem;
            }

            .testDisplay-userProfile, .testDisplay-defaultAvatar {
                width: 40px;
                height: 40px;
            }

            .testDisplay-defaultAvatar i {
                font-size: 24px;
            }

            .testDisplay-username {
                font-size: 0.95rem;
            }

            .testDisplay-email {
                font-size: 0.75rem;
            }

            .testDisplay-text {
                font-size: 0.85rem;
            }

            .testDisplay-view-more-btn {
                width: 90%;
                padding: 12px;
                font-size: 14px;
            }
        }

        /* Mobile: 375px - 639px */
        @media (min-width: 375px) and (max-width: 639px) {
            .testDisplay-section {
                padding: 2.5rem 1rem;
            }

            .testDisplay-section h2 {
                font-size: 32px !important;
                margin-top: 4rem;
            }

            .testDisplay-section h6 {
                font-size: 15px !important;
                margin-bottom: 2.25rem;
            }

            .testimonialSubmit-headerBtn {
                width: 80%;
                padding: 12px;
                font-size: 15px;
            }

            .testDisplay-grid {
                grid-template-columns: 1fr;
                gap: 1.35rem;
            }

            .testDisplay-card {
                padding: 1.5rem;
                border-radius: 65px;
                margin-bottom: 2rem;
            }

            .testDisplay-userProfile, .testDisplay-defaultAvatar {
                width: 45px;
                height: 45px;
            }

            .testDisplay-defaultAvatar i {
                font-size: 26px;
            }

            .testDisplay-username {
                font-size: 1rem;
            }

            .testDisplay-email {
                font-size: 0.8rem;
            }

            .testDisplay-text {
                font-size: 0.9rem;
            }

            .testDisplay-view-more-btn {
                width: 80%;
                padding: 12px 1.25rem;
                font-size: 15px;
            }
        }

        /* Tablet: 640px - 767px */
        @media (min-width: 640px) and (max-width: 767px) {
            .testDisplay-section {
                padding: 2.75rem 1.5rem;
            }

            .testDisplay-section h2 {
                font-size: 38px !important;
                margin-top: 5rem;
            }

            .testDisplay-section h6 {
                font-size: 16px !important;
                margin-bottom: 2.5rem;
            }

            .testimonialSubmit-headerBtn {
                width: 50%;
                padding: 11px;
                font-size: 15px;
            }

            .testDisplay-grid {
                grid-template-columns: 1fr;
                gap: 1.4rem;
            }

            .testDisplay-card {
                padding: 1.75rem;
                border-radius: 70px;
                margin-bottom: 2.25rem;
            }

            .testDisplay-userProfile, .testDisplay-defaultAvatar {
                width: 48px;
                height: 48px;
            }

            .testDisplay-defaultAvatar i {
                font-size: 28px;
            }

            .testDisplay-username {
                font-size: 1.05rem;
            }

            .testDisplay-email {
                font-size: 0.85rem;
            }

            .testDisplay-text {
                font-size: 0.92rem;
            }

            .testDisplay-view-more-btn {
                width: 50%;
                padding: 11px 1.35rem;
                font-size: 15px;
            }
        }

        /* Tablet: 768px - 1023px */
        @media (min-width: 768px) and (max-width: 1023px) {
            .testDisplay-section {
                padding: 3rem 2rem;
            }

            .testDisplay-section h2 {
                font-size: 42px !important;
                margin-top: 5.5rem;
            }

            .testDisplay-section h6 {
                font-size: 17px !important;
                margin-bottom: 2.75rem;
            }

            .testimonialSubmit-headerBtn {
                width: 35%;
                padding: 11px;
                font-size: 16px;
            }

            .testDisplay-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 1.45rem;
            }

            .testDisplay-card {
                padding: 1.85rem;
                border-radius: 75px;
                margin-bottom: 2.5rem;
            }

            .testDisplay-userProfile, .testDisplay-defaultAvatar {
                width: 50px;
                height: 50px;
            }

            .testDisplay-defaultAvatar i {
                font-size: 30px;
            }

            .testDisplay-username {
                font-size: 1.08rem;
            }

            .testDisplay-email {
                font-size: 0.88rem;
            }

            .testDisplay-text {
                font-size: 0.94rem;
            }

            .testDisplay-view-more-btn {
                width: 35%;
                padding: 11px 1.4rem;
                font-size: 16px;
            }
        }

        /* Desktop: 1024px - 1279px */
        @media (min-width: 1024px) and (max-width: 1279px) {
            .testDisplay-section {
                padding: 3rem 2.5rem;
            }

            .testDisplay-section h2 {
                font-size: 46px !important;
                margin-top: 5.75rem;
            }

            .testDisplay-section h6 {
                font-size: 17.5px !important;
                margin-bottom: 2.85rem;
            }

            .testimonialSubmit-headerBtn {
                width: 22%;
                padding: 10px;
                font-size: 16px;
            }

            .testDisplay-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 1.48rem;
            }

            .testDisplay-card {
                padding: 1.9rem;
                border-radius: 78px;
                margin-bottom: 2.75rem;
            }

            .testDisplay-userProfile, .testDisplay-defaultAvatar {
                width: 50px;
                height: 50px;
            }

            .testDisplay-defaultAvatar i {
                font-size: 30px;
            }

            .testDisplay-username {
                font-size: 1.09rem;
            }

            .testDisplay-email {
                font-size: 0.9rem;
            }

            .testDisplay-text {
                font-size: 0.95rem;
            }

            .testDisplay-view-more-btn {
                width: 22%;
                padding: 11px 1.45rem;
                font-size: 16px;
            }
        }

        /* Desktop: 1280px - 1439px */
        @media (min-width: 1280px) and (max-width: 1439px) {
            .testDisplay-section {
                padding: 3rem 1.5rem;
            }

            .testDisplay-section h2 {
                font-size: 48px !important;
                margin-top: 5.85rem;
            }

            .testDisplay-section h6 {
                font-size: 17.75px !important;
                margin-bottom: 2.9rem;
            }

            .testimonialSubmit-headerBtn {
                width: 18%;
                padding: 10px;
                font-size: 16px;
            }

            .testDisplay-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 1.49rem;
            }

            .testDisplay-card {
                padding: 1.95rem;
                border-radius: 79px;
                margin-bottom: 2.85rem;
            }

            .testDisplay-userProfile, .testDisplay-defaultAvatar {
                width: 50px;
                height: 50px;
            }

            .testDisplay-defaultAvatar i {
                font-size: 30px;
            }

            .testDisplay-username {
                font-size: 1.095rem;
            }

            .testDisplay-email {
                font-size: 0.92rem;
            }

            .testDisplay-text {
                font-size: 0.95rem;
            }

            .testDisplay-view-more-btn {
                width: 18%;
                padding: 11px 1.48rem;
                font-size: 16px;
            }
        }

        /* Large Desktop: 1440px+ */
        @media (min-width: 1440px) {
            .testDisplay-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
      `}</style>

      {/* ✅ Conditionally render header based on Supabase auth state */}
      {authUser ? <HeaderLogged /> : <HeaderUnlogged />}
      
      <main>
        <section className="testDisplay-section">
          <h2>Hear Directly From Our Users</h2>
          <h6>
            We don't just create solutions—we build relationships that last. Discover how our work has <br /> made a
            difference through the voices of those who matter most.
          </h6>

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
          {!loading && !data.length && <p style={{ textAlign: "center" }}>No testimonials yet.</p>}

          {!loading && data.length > 0 && (
            <>
              <div className="testDisplay-grid">
                {data.slice(0, visibleCount).map((t) => (
                  <div className="testDisplay-card" key={t.id}>
                    <div className="testDisplay-userDetails">
                      {t.user?.avatar ? (
                        <img
                          src={t.user.avatar}
                          alt={t.user.name || "User"}
                          className="testDisplay-userProfile"
                          onError={(e) => {
                            e.currentTarget.src = "/PICTURES/default-avatar.png";
                          }}
                        />
                      ) : (
                        <div className="testDisplay-userProfile testDisplay-defaultAvatar">
                          <i className="bi bi-person-circle"></i>
                        </div>
                      )}
                      <div className="testDisplay-nameDeets">
                        <h5 className="testDisplay-username">{t.user?.name ?? "Anonymous User"}</h5>
                        <small className="testDisplay-email">{t.user?.email ?? "No email"}</small>
                      </div>
                    </div>
                    <p className="testDisplay-text">"{t.testimonial}"</p>
                    {t.created_at && (
                      <small className="testDisplay-date">
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
              {data.length > 9 && (
                <div className="testDisplay-view-more-container">
                  <button className="testDisplay-view-more-btn" onClick={toggleView}>
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
  )
}

export default TestimonialDisplay