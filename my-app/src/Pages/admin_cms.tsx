import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";
import AdminHeader from "../INCLUDE/admin-sidebar";
import "../CSS/admin_cms.css";

// ----- Types -----
interface ImageRow {
  id: number;
  uploaded_at: string;
  image_url: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  uploaded_at: string;
  image_url: string;
}

const AdminCMS: React.FC = () => {
  const [homeImages, setHomeImages] = useState<ImageRow[]>([]);
  const [benefitImages, setBenefitImages] = useState<ImageRow[]>([]);
  const [whyAnikoImages, setWhyAnikoImages] = useState<ImageRow[]>([]);

  const [homeFile, setHomeFile] = useState<File | null>(null);
  const [benefitFile, setBenefitFile] = useState<File | null>(null);
  const [whyFile, setWhyFile] = useState<File | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberFile, setMemberFile] = useState<File | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const [activeSection, setActiveSection] = useState<"hero" | "benefits" | "why" | "team">("hero");

  const fetchTable = async (table: string, setter: (rows: any[]) => void) => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true });
    if (!error && data) setter(data as any[]);
    else if (error) console.error(`❌ Fetch ${table}:`, error);
  };

  useEffect(() => {
    fetchTable("home_images", setHomeImages);
    fetchTable("benefits_images", setBenefitImages);
    fetchTable("why_aniko_images", setWhyAnikoImages);
    fetchTable("team_members", setTeamMembers);

    const subs = [
      { table: "home_images", setter: setHomeImages },
      { table: "benefits_images", setter: setBenefitImages },
      { table: "why_aniko_images", setter: setWhyAnikoImages },
      { table: "team_members", setter: setTeamMembers },
    ].map(({ table, setter }) =>
      supabase
        .channel(`${table}_changes`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () =>
          fetchTable(table, setter)
        )
        .subscribe()
    );

    return () => subs.forEach((s) => supabase.removeChannel(s));
  }, []);

  const uploadToTable = async (file: File, table: string) => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error: storageErr } = await supabase.storage
      .from(table)
      .upload(fileName, file, { upsert: true });
    if (storageErr) throw storageErr;

    const { data: pub } = supabase.storage.from(table).getPublicUrl(fileName);
    const { error: dbErr } = await supabase
      .from(table)
      .insert([{ image_url: pub.publicUrl, uploaded_at: new Date().toISOString() }]);
    if (dbErr) throw dbErr;
  };

  const handleUpload = async (file: File | null, table: string, refetch: () => void) => {
    if (!file) return;
    try {
      await uploadToTable(file, table);
      refetch();
      setModalMessage(`Image added to ${table} successfully!`);
      setShowModal(true);
    } catch (e) {
      console.error(`❌ Upload to ${table}:`, e);
      alert(`Upload to ${table} failed. Check console.`);
    }
  };

  const deleteFromTable = async (table: string, id: number, url: string, refetch: () => void) => {
    const fileName = url.split("/").pop() || "";
    await supabase.storage.from(table).remove([fileName]);
    await supabase.from(table).delete().eq("id", id);
    refetch();
    setModalMessage(`Deleted from ${table} successfully!`);
    setShowModal(true);
  };

  const handleMemberUpload = async () => {
    if (!memberFile || !memberName || !memberRole) return alert("Fill all fields");
    try {
      const ext = memberFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;

      const { error: storageErr } = await supabase.storage
        .from("team_members")
        .upload(fileName, memberFile, { upsert: true });
      if (storageErr) throw storageErr;

      const { data: pub } = supabase.storage.from("team_members").getPublicUrl(fileName);

      const { error: dbErr } = await supabase.from("team_members").insert([
        {
          name: memberName,
          role: memberRole,
          image_url: pub.publicUrl,
          uploaded_at: new Date().toISOString(),
        },
      ]);
      if (dbErr) throw dbErr;

      setMemberName("");
      setMemberRole("");
      setMemberFile(null);
      fetchTable("team_members", setTeamMembers);
      setModalMessage("Team member added successfully!");
      setShowModal(true);
    } catch (e) {
      console.error("❌ Upload team member:", e);
      alert("Failed to add team member. Check console.");
    }
  };

  const TableSection = ({
    title,
    rows,
    file,
    setFile,
    tableName,
    refetch,
  }: {
    title: string;
    rows: ImageRow[];
    file: File | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    tableName: string;
    refetch: () => void;
  }) => (
    <>
      {/* Upload Card */}
      <section className="card p-4 adminCms-card mb-4">
        <h5>{title} - Upload</h5>
        <div className="adminCms-form">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="adminCms-chooseBtn"
          />
          <button
            className="btn btn-success mt-2 adminCms-uploadBtn"
            onClick={() => handleUpload(file, tableName, refetch)}
          >
            Upload Image
          </button>
        </div>
        
      </section>

      {/* Table Card */}
      <section className="card p-4 adminCms-card mb-5">
        <h5>{title} - Images</h5>
        <table className="table table-bordered adminCms-table mt-3">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>URL</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((img) => (
                <tr key={img.id}>
                  <td>{img.id}</td>
                  <td>
                    <img src={img.image_url} alt="" width={80} height={60} />
                  </td>
                  <td>
                    <a href={img.image_url} target="_blank" rel="noreferrer">
                      {img.image_url}
                    </a>
                  </td>
                  <td>{new Date(img.uploaded_at).toLocaleString()}</td>
                  <td>
                  <button
                className="btn btn-danger btn-sm d-inline-flex align-items-center gap-1"
                onClick={() =>
                  deleteFromTable(tableName, img.id, img.image_url, refetch)
                }
              >
                <i className="bi bi-trash3-fill"></i>
                <span>Delete</span>
              </button>

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">
                  No images.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );


  return (
    <div>
      {/* Success Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Success</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>{modalMessage}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => setShowModal(false)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminHeader />
      <div style={{ marginLeft: "280px", padding: "20px" }}>
        <h1 className="adminCms-header">Content Management</h1>
        <h6 className="adminCms-subheader">Manage Home, Benefits, Why Aniko, and Team Members</h6>

        {/* Section Toggle Buttons */}
        <div className="mb-4 adminCms-navBtn">
          <button
            className={`btn adminCms-heroBtn me-2 ${activeSection === "hero" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveSection("hero")}
          >
            Hero
          </button>
          <button
            className={`btnadminCms-benBtn me-2 ${activeSection === "benefits" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveSection("benefits")}
          >
            Benefits
          </button>
          <button
            className={`btn adminCms-whyBtn me-2 ${activeSection === "why" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveSection("why")}
          >
            Why Aniko
          </button>
          <button
            className={`btn adminCms-teamBtn ${activeSection === "team" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setActiveSection("team")}
          >
            Team
          </button>
        </div>

        {/* Conditional Sections */}
        {activeSection === "hero" && (
          <TableSection
            title="Home Images"
            rows={homeImages}
            file={homeFile}
            setFile={setHomeFile}
            tableName="home_images"
            refetch={() => fetchTable("home_images", setHomeImages)}
          />
        )}

        {activeSection === "benefits" && (
          <TableSection
            title="Benefits Images"
            rows={benefitImages}
            file={benefitFile}
            setFile={setBenefitFile}
            tableName="benefits_images"
            refetch={() => fetchTable("benefits_images", setBenefitImages)}
          />
        )}

        {activeSection === "why" && (
          <TableSection
            title="Why Aniko Images"
            rows={whyAnikoImages}
            file={whyFile}
            setFile={setWhyFile}
            tableName="why_aniko_images"
            refetch={() => fetchTable("why_aniko_images", setWhyAnikoImages)}
          />
        )}

        {activeSection === "team" && (
          <>
            {/* Upload Form Card */}
            <section className="card p-4 adminCms-card mb-4">
              <h5>Add Team Member</h5>
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  className="form-control mb-2 adminCms-fc"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Role"
                  className="form-control mb-2 adminCms-fc"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="form-control mb-2 adminCms-chooseTeamBtn"
                  onChange={(e) => setMemberFile(e.target.files?.[0] || null)}
                />
                <button className="btn adminCms-addBtn btn-success mt-2" onClick={handleMemberUpload}>
                  Add Member
                </button>
              </div>
            </section>

            {/* Table Card */}
            <section className="card p-4 adminCms-card mb-5">
              <h5>Team Members</h5>
              <table className="table table-bordered mt-3 adminCms-table">
                <thead className="adminCms-thead">
                  <tr>
                    <th>ID</th>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Uploaded</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.length ? (
                    teamMembers.map((m) => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>
                          <img src={m.image_url} alt={m.name} width={80} height={60} />
                        </td>
                        <td>{m.name}</td>
                        <td>{m.role}</td>
                        <td>{new Date(m.uploaded_at).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm adminCms-delBtn"
                            onClick={() =>
                              deleteFromTable("team_members", m.id, m.image_url, () =>
                                fetchTable("team_members", setTeamMembers)
                              )
                            }
                          >
                            <i className="bi bi-trash3-fill"></i>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center">
                        No team members.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCMS;
