import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";

interface HeroImage {
  id: number;
  uploaded_at: string;
  image_url: string;
}

const Hero: React.FC = () => {
  const [heroImage, setHeroImage] = useState<HeroImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const { data, error } = await supabase
          .from("home_images")
          .select("id, uploaded_at, image_url")
          .order("uploaded_at", { ascending: false })
          .limit(1);

        console.log("Hero image response:", { data, error });

        if (error) {
          setErr(error.message);
          return;
        }

        if (data && data.length > 0) {
          setHeroImage(data[0]);
        }
      } catch (e: any) {
        setErr(e?.message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchHero();
  }, []);

  if (loading) return <p className="text-center">Loading hero image...</p>;
  if (err) return <p className="text-center text-danger">Error: {err}</p>;
  if (!heroImage) return null; // nothing if no record

  return (
    <div className="container-fluid my-5">
      <div className="home-img-container text-center">
        <img
          src={heroImage.image_url}
          alt="Hero"
          className="img-fluid"
          style={{ maxWidth: "600px" }}
        />
    
      </div>
    </div>
  );
};

export default Hero;
