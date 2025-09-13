import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import AdminHeader from "../INCLUDE/admin-sidebar";


interface HomeImage {
  id: number;
  created_at: string;
  image_url: string;
}

const AdminCMS: React.FC = () => {
  const [view, setView] = useState<"upload" | "uploaded">("upload");
  const [images, setImages] = useState<HomeImage[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch images
  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("home_images")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data) {
      setImages(data as HomeImage[]);
    }
  };

  useEffect(() => {
    fetchImages();

    // Realtime subscription
    const imagesSub = supabase
      .channel("home-images-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "home_images" },
        () => {
          fetchImages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(imagesSub);
    };
  }, []);

  // Handle image upload
  const handleUpload = async () => {
    if (!file) {
      alert("⚠️ Please select a file first.");
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `home_images/${fileName}`;

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("home_images")
        .upload(filePath, file);

      if (storageError) {
        alert("❌ Upload failed: " + storageError.message);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("home_images")
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // Insert into DB
      const { error: dbError } = await supabase.from("home_images").insert([
        {
          image_url: imageUrl,
          created_at: new Date().toISOString(),
        },
      ]);

      if (dbError) {
        alert("❌ Failed to save in database: " + dbError.message);
        return;
      }

      setFile(null);
      setShowSuccessModal(true);
      fetchImages();
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ An error occurred during upload.");
    }
  };

  // Confirm delete
  const confirmDelete = (id: number) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  // Handle delete (DB + Storage)
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      // Find the image row first
      const targetImg = images.find((img) => img.id === deleteTarget);
      if (!targetImg) return;

      // Extract file name from public URL
      const urlParts = targetImg.image_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `home_images/${fileName}`;

      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from("home_images")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // 2. Delete from DB
      await supabase.from("home_images").delete().eq("id", deleteTarget);

      setDeleteTarget(null);
      setShowDeleteModal(false);
      fetchImages();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div>
      <AdminHeader />

      <div style={{ marginLeft: "280px", padding: "20px" }}>
        <h1 className="adminCMS-header">Content Management</h1>
        <h6 className="adminCMS-subheader">
          Manage uploaded images for the homepage carousel/banner.
        </h6>

        {/* Toggle buttons */}
        <div className="mb-3">
          <button
            className={`btn me-2 ${
              view === "upload" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setView("upload")}
          >
            Upload Image
          </button>
          <button
            className={`btn me-2 ${
              view === "uploaded" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setView("uploaded")}
          >
            Uploaded Images
          </button>
        </div>

        {/* Upload Section */}
        {view === "upload" && (
          <div className="card p-4 adminCMS-card">
            <h5>
              <i className="bi bi-upload"></i> Upload New Image
            </h5>
            <div className="mt-3">
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) =>
                  setFile(e.target.files ? e.target.files[0] : null)
                }
              />
            </div>
            <div className="mt-3">
              <button className="btn btn-success" onClick={handleUpload}>
                <i className="bi bi-cloud-arrow-up-fill"></i> Upload
              </button>
            </div>
          </div>
        )}

        {/* Uploaded Table */}
        {view === "uploaded" && (
          <div className="card adminCMS-card">
            <h5>
              <i className="bi bi-images"></i> Uploaded Images
            </h5>
            <table className="table table-bordered table-striped mt-3 adminCMS-table">
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
                        <img
                          src={img.image_url}
                          alt="uploaded"
                          width={80}
                          height={60}
                          style={{ objectFit: "cover", borderRadius: "8px" }}
                        />
                      </td>
                      <td>
                        <a
                          href={img.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {img.image_url}
                        </a>
                      </td>
                      <td>{new Date(img.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm d-flex"
                          onClick={() => confirmDelete(img.id)}
                        >
                          <i className="bi bi-trash3-fill"></i> Delete
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this image?</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">Success</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSuccessModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>✅ Image uploaded successfully!</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-success"
                  onClick={() => setShowSuccessModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCMS;
