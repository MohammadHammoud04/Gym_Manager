"use client"

import { useState } from "react"
import axios from "axios"
import logo from "/Logo.png"


export default function Login({ onLogin }) {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post("http://localhost:5000/login", { name, password })
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("role", res.data.role)
      onLogin(res.data.role)
    } catch (err) {
      setError(err.response?.data.message || "Login Failed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gym-black">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 bg-gym-gray rounded-2xl border-2 border-gym-yellow flex items-center justify-center">
            <img src={logo} alt="Gym Logo" className="w-25 h-25 object-contain"/>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 bg-gym-gray-dark rounded-2xl border border-gym-gray-border shadow-xl"
        >
          <h1 className="text-3xl text-white font-bold mb-2 text-center">Welcome Back</h1>
          <p className="text-gray-400 text-center mb-6">Sign in to continue</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
            <input
              className="w-full p-3 rounded-lg bg-gym-gray border border-gym-gray-border text-white placeholder-gray-500 focus:outline-none focus:border-gym-yellow transition"
              placeholder="Enter your username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <input
              className="w-full p-3 rounded-lg bg-gym-gray border border-gym-gray-border text-white placeholder-gray-500 focus:outline-none focus:border-gym-yellow transition"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gym-yellow text-gym-black font-bold rounded-lg hover:bg-gym-yellow-bright hover:scale-[1.02] transition-all shadow-lg"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
