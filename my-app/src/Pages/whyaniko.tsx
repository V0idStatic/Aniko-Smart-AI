import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import "../CSS/whyaniko.css";

interface WhyAnikoImage {
  id: number;
  image_url: string;
  uploaded_at: string;
}

const WhyAniko: React.FC = () => {
  const [image, setImage] = useState<WhyAnikoImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const { data, error } = await supabase
          .from("why_aniko_images")
          .select("id, image_url, uploaded_at")
          .order("uploaded_at", { ascending: false }) // get latest image
          .limit(1)
          .single();

        console.log("Why Aniko response:", { data, error });

        if (error) {
          setErr(error.message);
          return;
        }
        setImage(data);
      } catch (e: any) {
        setErr(e?.message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };
    fetchImage();
  }, []);

  if (loading) return <p className="text-center">Loading image...</p>;
  if (err) return <p className="text-center text-danger">Error: {err}</p>;
  if (!image) return <p className="text-center">No image found.</p>;

  return (
    <div className="col-lg-6 text-center">
      <img
        src={image.image_url}
        alt="Why Aniko"
        className="img-fluid rounded shadow-sm laptopImg"
      />
  
    </div>
  );
};

export default WhyAniko;
