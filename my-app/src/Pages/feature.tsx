import { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";

interface FeatureImage {
  id: number;
  image_url: string;
  uploaded_at: string;
}

const Feature: React.FC = () => {
  const [featureImage, setFeatureImage] = useState<FeatureImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatureImage = async () => {
      try {
        const { data, error } = await supabase
          .from("benefits_images")
          .select("id, image_url, uploaded_at")
          .order("uploaded_at", { ascending: false })
          .limit(1);

        console.log("Feature image response:", { data, error });

        if (error) {
          setErr(error.message);
          return;
        }

        if (data && data.length > 0) {
          setFeatureImage(data[0]);
        }
      } catch (e: any) {
        setErr(e?.message ?? "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureImage();
  }, []);

  if (loading) return <p className="text-center">Loading feature image...</p>;
  if (err) return <p className="text-center text-danger">Error: {err}</p>;
  if (!featureImage) return null; // nothing if no record

  return (
    <div className="col-lg-4 text-center mt-4 mt-lg-0 solution-img-side">
      <img
        src={featureImage.image_url}
        alt="Aniko App Interface"
        className="img-fluid"
        style={{ maxWidth: "380px" }}
      />
    </div>
  );
};

export default Feature;
