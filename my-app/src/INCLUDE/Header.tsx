import React, { useEffect, useState } from "react"
import supabase from "../CONFIG/supabaseClient"
import HeaderLogged from "./header-logged"
import HeaderUnlogged from "./header-unlogged"

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null) // null = loading
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log("Header - Session check:", session?.user?.email || "No user")
      setIsLoggedIn(!!session?.user)
    } catch (error) {
      console.error("Header - Auth check error:", error)
      setIsLoggedIn(false)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <header className="floating-header" style={{
        background: '#112822',
        color: 'white',
        padding: '10px 20px',
        width: 'calc(100% - 40px)',
        margin: '0 auto',
        borderRadius: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1060,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <span style={{ color: '#BDE08A' }}>Loading...</span>
      </header>
    )
  }

  // Render appropriate header based on auth state
  return isLoggedIn ? <HeaderLogged /> : <HeaderUnlogged />
}

export default Header