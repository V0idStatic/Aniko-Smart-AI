import React, { useState, useEffect } from "react";
import { supabase } from "../firebase"; // 

// Define User type for better type safety
interface User {
  uid: string;
  username: string;
  email: string;
  profile_picture?: string;
  last_login: string;
}

const QueryComponent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Supabase database
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("last_login", { ascending: false })
          .limit(10);

        if (error) {
          console.error("❌ Supabase error:", error);
          throw error;
        }

        setUsers(data || []);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError("Error fetching users: " + (err instanceof Error ? err.message : err));
      }
    };

    fetchUsers();

    // Real-time subscription using the current Supabase API
    const channel = supabase
      .channel('users-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log("New user added:", payload.new);
          setUsers((prevUsers) => [...prevUsers, payload.new as User]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log("User updated:", payload.new);
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.uid === (payload.new as User).uid ? (payload.new as User) : user
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log("User deleted:", payload.old);
          setUsers((prevUsers) =>
            prevUsers.filter((user) => user.uid !== (payload.old as User).uid)
          );
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div>
      <h1>Users List</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {users.map((user) => (
          <li key={user.uid}>
            <p>{user.profile_picture}</p>
            <p>{user.username}</p>
            <p>{user.email}</p>
            <p>{new Date(user.last_login).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QueryComponent;
