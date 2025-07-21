"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useTelegram } from "./TelegramContext"

interface AdminProfile {
  id: string
  telegram_id?: string
  first_name: string
  last_name: string
  username?: string
  phone_number?: string
  email?: string
  avatar_url?: string
  is_verified: boolean
  role: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: AdminProfile | null
  loading: boolean
  signOut: () => void
  checkWebsiteLoginStatus: (token: string) => Promise<AdminProfile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: tgUser, isReady, isTelegramWebApp } = useTelegram()
  const [user, setUser] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isReady) {
      if (isTelegramWebApp && tgUser) {
        // Telegram Web App automatic login - only for admins
        console.log("Starting Telegram Web App admin login...")
        handleTelegramWebAppLogin()
      } else {
        // Regular web - check for login token or local session
        console.log("Checking admin web session...")
        checkWebSession()
      }
    }
  }, [isReady, isTelegramWebApp, tgUser])

  const handleTelegramWebAppLogin = async () => {
    if (!tgUser) {
      console.log("No Telegram user found")
      setLoading(false)
      return
    }

    try {
      console.log("Auto login for Telegram Web App admin user:", tgUser.id)

      // Find admin user by Telegram ID
      const { data: existingUser, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", tgUser.id.toString())
        .eq("role", "admin") // Only allow admin users
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        console.log("Admin search error handled:", searchError.message)
        setLoading(false)
        return
      }

      if (!existingUser) {
        console.log("Admin user not found for Telegram ID:", tgUser.id)
        setLoading(false)
        return
      }

      // Update existing admin user info
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          first_name: tgUser.first_name,
          last_name: tgUser.last_name || "",
          username: tgUser.username || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.log("Admin update error handled:", updateError.message)
        setUser(existingUser) // Use existing data if update fails
      } else {
        setUser(updatedUser)
      }

      localStorage.setItem("jamolstroy_admin", JSON.stringify(updatedUser || existingUser))
      console.log("Telegram Web App admin login successful for:", existingUser.first_name)
    } catch (error) {
      console.log("Telegram Web App admin login error handled:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkWebSession = async () => {
    try {
      // Check for login token in URL
      const urlParams = new URLSearchParams(window.location.search)
      const loginToken = urlParams.get("token")

      if (loginToken) {
        console.log("Admin login token found, checking status...")
        const userData = await checkWebsiteLoginStatus(loginToken)
        if (userData && userData.role === "admin") {
          setUser(userData)
          localStorage.setItem("jamolstroy_admin", JSON.stringify(userData))
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }
      }

      // Check local storage
      const savedUser = localStorage.getItem("jamolstroy_admin")
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          if (parsedUser.role === "admin") {
            console.log("Local admin session found for:", parsedUser.first_name)
            setUser(parsedUser)
          } else {
            console.log("User is not admin, removing session")
            localStorage.removeItem("jamolstroy_admin")
          }
        } catch (parseError) {
          console.error("Error parsing saved admin user:", parseError)
          localStorage.removeItem("jamolstroy_admin")
        }
      }
    } catch (error) {
      console.error("Admin web session check error:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkWebsiteLoginStatus = async (token: string): Promise<AdminProfile | null> => {
    try {
      console.log("Checking admin login status for token:", token)

      const { data: session, error: sessionError } = await supabase
        .from("website_login_sessions")
        .select(`
          *,
          user:users(*)
        `)
        .eq("temp_token", token)
        .eq("status", "approved")
        .single()

      if (sessionError || !session) {
        console.log("No approved admin session found")
        return null
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        console.log("Admin session expired")
        return null
      }

      // Check if user is admin
      if (session.user.role !== "admin") {
        console.log("User is not admin")
        return null
      }

      console.log("Admin login approved, user data:", session.user)
      return session.user as AdminProfile
    } catch (error) {
      console.error("Admin login status check error:", error)
      return null
    }
  }

  const signOut = () => {
    console.log("Signing out admin user")
    setUser(null)
    localStorage.removeItem("jamolstroy_admin")

    // Clear all jamolstroy admin related data
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("jamolstroy_admin")) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  }

  const value = {
    user,
    loading,
    signOut,
    checkWebsiteLoginStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
