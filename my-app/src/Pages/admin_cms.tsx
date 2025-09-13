import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import AdminHeader from "../INCLUDE/admin-sidebar";

interface HomeImage {
  id: number;
  uploaded_at: string;
  image_url: string;
}

const AdminCMS: React.FC = () => {
  const [view, setView] = useState<"upload" | "uploaded">("upload");
  const [images, setImages] = useState<HomeImage[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch images from DB
  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("home_images")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("❌ Fetch images error:", error);
    } else {
      setImages(data as HomeImage[]);
    }
  };

  useEffect(() => {
    fetchImages();
    const imagesSub = supabase
      .channel("home-images-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "home_images" }, () => {
        fetchImages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(imagesSub);
    };
  }, []);

  // Handle upload
  const handleUpload = async () => {
    if (!file) {
      alert("⚠️ Please select a file first.");
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      console.log("📂 Uploading file:", fileName);

      // Upload to storage (bucket = home_images)
      const { error: storageError, data: storageData } = await supabase.storage
        .from("home_images")
        .upload(fileName, file, { upsert: true });

      if (storageError) {
        console.error("❌ Storage upload error:", storageError);
        alert("❌ Upload failed:\n" + JSON.stringify(storageError, null, 2));
        return;
      }
      console.log("✅ Storage upload success:", storageData);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("home_images")
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;
      console.log("🌍 Public URL:", imageUrl);

      // Insert record in DB
      const { error: dbError } = await supabase.from("home_images").insert([
        {
          image_url: imageUrl,
          uploaded_at: new Date().toISOString(),
        },
      ]);

      if (dbError) {
        console.error("❌ Database insert error:", dbError);
        alert("❌ DB Insert failed:\n" + JSON.stringify(dbError, null, 2));
        return;
      }

      console.log("✅ Inserted into DB successfully");
      setFile(null);
      setShowSuccessModal(true);
      fetchImages();
    } catch (err) {
      console.error("❌ Unexpected upload error:", err);
      alert("❌ Unexpected error:\n" + (err as Error).message);
    }
  };

  // Delete file + DB record
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const targetImg = images.find((img) => img.id === deleteTarget);
      if (!targetImg) return;

      const urlParts = targetImg.image_url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      const { error: storageError } = await supabase.storage
        .from("home_images")
        .remove([fileName]);

      if (storageError) console.error("⚠️ Storage delete error:", storageError);

      await supabase.from("home_images").delete().eq("id", deleteTarget);

      console.log("✅ Deleted image:", fileName);
      setDeleteTarget(null);
      setShowDeleteModal(false);
      fetchImages();
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  return (
    <div>
      <AdminHeader />
      <div style={{ marginLeft: "280px", padding: "20px" }}>
        <h1 className="adminCMS-header">Content Management</h1>
        <h6 className="adminCMS-subheader">Manage uploaded images</h6>

        <div className="mb-3">
          <button
            className={`btn me-2 ${view === "upload" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setView("upload")}
          >
            Upload Image
          </button>
          <button
            className={`btn me-2 ${view === "uploaded" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setView("uploaded")}
          >
            Uploaded Images
          </button>
        </div>

        {view === "upload" && (
          <div className="card p-4 adminCMS-card">
            <h5>Upload New Image</h5>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
            <button className="btn btn-success mt-3" onClick={handleUpload}>
              Upload
            </button>
          </div>
        )}

        {view === "uploaded" && (
          <div className="card adminCMS-card">
            <h5>Uploaded Images</h5>
            <table className="table table-bordered mt-3">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>URL</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {images.length > 0 ? (
                  images.map((img) => (
                    <tr key={img.id}>
                      <td>{img.id}</td>
                      <td>
                        <img src={img.image_url} alt="uploaded" width={80} height={60} />
                      </td>
                      <td>
                        <a href={img.image_url} target="_blank" rel="noreferrer">
                          {img.image_url}
                        </a>
                      </td>
                      <td>{new Date(img.uploaded_at).toLocaleString()}</td>
                      <td>
                     <button 
  className="btn btn-danger btn-sm" 
  onClick={() => {
    setDeleteTarget(img.id);
    handleDelete();
  }}
>
  Delete
</button>

                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center">
                      No images found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCMS;
