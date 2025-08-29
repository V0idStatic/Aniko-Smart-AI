import React, { useState, useEffect } from 'react';
import { supabase } from '../firebase'; // Import Supabase client
import { db } from '../firebase'; // Import Firebase database
import { ref, onValue, off } from 'firebase/database'; // Firebase real-time functions

interface User {
  uid: string;
  username: string;
  email: string;
  profile_picture?: string;
  last_login: string;
  status?: string;
}

const DualQueryComponent: React.FC = () => {
  const [supabaseUsers, setSupabaseUsers] = useState<User[]>([]);
  const [firebaseUsers, setFirebaseUsers] = useState<User[]>([]);
  const [supabaseError, setSupabaseError] = useState<string>("");
  const [firebaseError, setFirebaseError] = useState<string>("");
  const [supabaseLoading, setSupabaseLoading] = useState<boolean>(true);
  const [firebaseLoading, setFirebaseLoading] = useState<boolean>(true);

  useEffect(() => {
    // Supabase real-time subscription
    const fetchSupabaseUsers = async () => {
      try {
        console.log("🔍 Fetching users from Supabase...");
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("last_login", { ascending: false })
          .limit(10);

        if (error) {
          console.error("❌ Supabase error:", error);
          throw error;
        }

        setSupabaseUsers(data || []);
        console.log("✅ Supabase users fetched:", data?.length);
      } catch (err) {
        console.error("❌ Supabase fetch error:", err);
        setSupabaseError("Error fetching Supabase users: " + (err instanceof Error ? err.message : err));
      } finally {
        setSupabaseLoading(false);
      }
    };

    // Fetch Supabase users initially
    fetchSupabaseUsers();

    // Supabase Real-time subscription
    const supabaseChannel = supabase
      .channel('users-channel-dual')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log("🆕 New Supabase user added:", payload.new);
          setSupabaseUsers((prevUsers) => [...prevUsers, payload.new as User]);
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
          console.log("🔄 Supabase user updated:", payload.new);
          setSupabaseUsers((prevUsers) => 
            prevUsers.map(user => 
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
          console.log("🗑️ Supabase user deleted:", payload.old);
          setSupabaseUsers((prevUsers) => 
            prevUsers.filter(user => user.uid !== (payload.old as User).uid)
          );
        }
      )
      .subscribe();

    // Firebase Real-time subscription
    const fetchFirebaseUsers = () => {
      try {
        console.log("🔍 Setting up Firebase real-time listener...");
        const usersRef = ref(db, 'users');
        
        const unsubscribeFirebase = onValue(usersRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // Convert Firebase object to array
            const usersArray: User[] = Object.keys(data).map(key => ({
              uid: key,
              ...data[key]
            }));
            
            // Sort by last_login (most recent first)
            const sortedUsers = usersArray
              .sort((a, b) => new Date(b.last_login).getTime() - new Date(a.last_login).getTime())
              .slice(0, 10); // Limit to 10 users
            
            setFirebaseUsers(sortedUsers);
            console.log("✅ Firebase users updated:", sortedUsers.length);
          } else {
            setFirebaseUsers([]);
            console.log("📭 No Firebase users found");
          }
          setFirebaseLoading(false);
        }, (error) => {
          console.error("❌ Firebase error:", error);
          setFirebaseError("Error fetching Firebase users: " + error.message);
          setFirebaseLoading(false);
        });

        return unsubscribeFirebase;
      } catch (err) {
        console.error("❌ Firebase setup error:", err);
        setFirebaseError("Error setting up Firebase listener: " + (err instanceof Error ? err.message : err));
        setFirebaseLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    const unsubscribeFirebase = fetchFirebaseUsers();

    // Cleanup subscriptions when component unmounts
    return () => {
      console.log("🧹 Cleaning up subscriptions...");
      supabaseChannel.unsubscribe();
      if (unsubscribeFirebase) {
        unsubscribeFirebase();
      }
    };
  }, []);

  const renderUserCard = (user: User, source: string) => (
    <div 
      key={`${source}-${user.uid}`}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '12px',
        margin: '8px 0',
        backgroundColor: source === 'Supabase' ? '#f0f9ff' : '#fff7ed'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user.profile_picture && (
          <img 
            src={user.profile_picture} 
            alt={`${user.username} avatar`}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        )}
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>
            {user.username}
            <span style={{ 
              fontSize: '12px', 
              color: source === 'Supabase' ? '#0369a1' : '#ea580c',
              marginLeft: '8px',
              padding: '2px 6px',
              borderRadius: '12px',
              backgroundColor: source === 'Supabase' ? '#dbeafe' : '#fed7aa'
            }}>
              {source}
            </span>
          </h4>
          <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>{user.email}</p>
          <p style={{ margin: '0', color: '#888', fontSize: '12px' }}>
            Last login: {new Date(user.last_login).toLocaleString()}
          </p>
          {user.status && (
            <p style={{ 
              margin: '4px 0 0 0', 
              color: user.status === 'online' ? '#16a34a' : '#6b7280',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              Status: {user.status}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        🔄 Real-time Users Dashboard (Firebase + Supabase)
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Supabase Users Section */}
        <div>
          <h2 style={{ color: '#0369a1', borderBottom: '2px solid #0369a1', paddingBottom: '8px' }}>
            📊 Supabase Users
          </h2>
          
          {supabaseLoading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              🔄 Loading Supabase users...
            </div>
          )}
          
          {supabaseError && (
            <div style={{ 
              color: 'red', 
              backgroundColor: '#fee2e2',
              padding: '12px',
              borderRadius: '6px',
              margin: '12px 0'
            }}>
              ❌ {supabaseError}
            </div>
          )}

          <div>
            {supabaseUsers.length === 0 && !supabaseLoading && !supabaseError ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                📭 No Supabase users found
              </p>
            ) : (
              supabaseUsers.map(user => renderUserCard(user, 'Supabase'))
            )}
          </div>
        </div>

        {/* Firebase Users Section */}
        <div>
          <h2 style={{ color: '#ea580c', borderBottom: '2px solid #ea580c', paddingBottom: '8px' }}>
            🔥 Firebase Users
          </h2>
          
          {firebaseLoading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              🔄 Loading Firebase users...
            </div>
          )}
          
          {firebaseError && (
            <div style={{ 
              color: 'red', 
              backgroundColor: '#fee2e2',
              padding: '12px',
              borderRadius: '6px',
              margin: '12px 0'
            }}>
              ❌ {firebaseError}
            </div>
          )}

          <div>
            {firebaseUsers.length === 0 && !firebaseLoading && !firebaseError ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                📭 No Firebase users found
              </p>
            ) : (
              firebaseUsers.map(user => renderUserCard(user, 'Firebase'))
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '12px' }}>📈 Real-time Statistics</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px' }}>
          <div>
            <strong style={{ color: '#0369a1', fontSize: '24px' }}>{supabaseUsers.length}</strong>
            <br />
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Supabase Users</span>
          </div>
          <div>
            <strong style={{ color: '#ea580c', fontSize: '24px' }}>{firebaseUsers.length}</strong>
            <br />
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Firebase Users</span>
          </div>
          <div>
            <strong style={{ color: '#16a34a', fontSize: '24px' }}>{supabaseUsers.length + firebaseUsers.length}</strong>
            <br />
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Users</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualQueryComponent;
