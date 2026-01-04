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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("speakup_user")
    const storedToken = localStorage.getItem("speakup_token")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("speakup_user")
      }
    }
    if (storedToken) {
      setToken(storedToken)
    }
    setLoading(false)
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

  return { user, token, login, register, logout, loading }
}
