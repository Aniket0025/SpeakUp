"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type AuthUser = {
  id: string
  fullName: string
  email: string
  role: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null
    const storedUser = localStorage.getItem("speakup_user")
    if (!storedUser) return null
    try {
      return JSON.parse(storedUser)
    } catch {
      localStorage.removeItem("speakup_user")
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("speakup_token")
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "speakup_user") {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue))
          } catch {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
      if (e.key === "speakup_token") {
        setToken(e.newValue)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage)
      }
    }
  }, [])

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Login failed")
      }

      const data = await res.json()
      const loggedInUser: AuthUser = data.user
      const jwt: string = data.token

      localStorage.setItem("speakup_user", JSON.stringify(loggedInUser))
      localStorage.setItem("speakup_token", jwt)

      setUser(loggedInUser)
      setToken(jwt)

      router.push("/")
    } catch (error) {
      console.error("Login error", error)
      throw error
    }
  }

  const register = async (payload: { fullName: string; email: string; password: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...payload, role: "user" }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Registration failed")
      }

      const data = await res.json()
      const registeredUser: AuthUser = data.user
      const jwt: string = data.token

      localStorage.setItem("speakup_user", JSON.stringify(registeredUser))
      localStorage.setItem("speakup_token", jwt)

      setUser(registeredUser)
      setToken(jwt)

      router.push("/")
    } catch (error) {
      console.error("Register error", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("speakup_user")
    localStorage.removeItem("speakup_token")
    setUser(null)
    setToken(null)
    router.push("/login")
  }

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem("speakup_user", JSON.stringify(next))
      } catch {}
      return next
    })
  }

  return { user, token, login, register, logout, updateUser, loading }
}
