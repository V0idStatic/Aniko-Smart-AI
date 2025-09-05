import React, { useEffect, useState } from "react";
import supabase from "../CONFIG/supabaseClient";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  uploaded_at: string;
  image_url?: string | null; // optional
}

const TeamMembers: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
	const fetchMembers = async () => {
	  try {
		const { data, error } = await supabase
		  .from("team_members")
		  .select("id, name, role, uploaded_at, image_url")
		  .order("id", { ascending: true });
		console.log("Team members response:", { data, error });
		if (error) {
		  setErr(error.message);
		  return;
		}
		setMembers(data ?? []);
	  } catch (e: any) {
		setErr(e?.message ?? "Unexpected error");
	  } finally {
		setLoading(false);
	  }
	};
	fetchMembers();
  }, []);

  if (loading) return <p className="text-center">Loading team...</p>;
  if (err) return <p className="text-center text-danger">Error: {err}</p>;
  if (!members.length) return <p className="text-center">No team members found.</p>;

  return (
	<section className="team-members py-5">
	  <div className="container-fluid text-center">
		<div className="row justify-content-center">
		  {members.map((m) => (
			<div key={m.id} className="col-md-4 mb-4">
			  {/* If you’re storing images in /public/PICTURES, save paths as /PICTURES/xxx.png */}
			  {m.image_url ? (
				<img
				  src={m.image_url}
				  alt={m.name}
				  className="rounded-circle mb-3 team-member-img"
				  style={{ width: 150, height: 150, objectFit: "cover" }}
				/>
			  ) : (
				<div
				  className="rounded-circle mb-3"
				  style={{
					width: 150,
					height: 150,
					background: "#e5e5e5",
					margin: "0 auto",
				  }}
				/>
			  )}
			  <h5 className="fw-bold">{m.name}</h5>
			  <p className="text-muted">{m.role}</p>
		
			</div>
		  ))}
		</div>
	  </div>
	</section>
  );
};

export default TeamMembers;