import React, { useState } from "react";
import { signInUser, signUpUser } from "../firebase";

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login logic
        if (email && password) {
          const user = await signInUser(email, password);
          if (user) {
            onLoginSuccess && onLoginSuccess(user);
          } else {
            setError("Invalid credentials");
          }
        } else {
          setError("Please enter valid credentials");
        }
      } else {
        // Sign up logic
        if (password !== confirmPassword) {
          setError("Passwords do not match");
        } else if (email && password && name) {
          const user = await signUpUser(email, password, name);
          if (user) {
            onLoginSuccess && onLoginSuccess(user);
          } else {
            setError("Failed to create account");
          }
        } else {
          setError("Please fill in all fields");
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-5 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-500 hover:scale-105">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
            NaviCV
          </h1>
          <p className="text-slate-600 text-base">
            Your AI-Powered Resume Assistant
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-300 bg-slate-50 focus:outline-none focus:border-slate-600 focus:bg-white focus:shadow-lg focus:shadow-slate-600/10 placeholder-slate-400"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-300 bg-slate-50 focus:outline-none focus:border-slate-600 focus:bg-white focus:shadow-lg focus:shadow-slate-600/10 placeholder-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-300 bg-slate-50 focus:outline-none focus:border-slate-600 focus:bg-white focus:shadow-lg focus:shadow-slate-600/10 placeholder-slate-400"
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-300 bg-slate-50 focus:outline-none focus:border-slate-600 focus:bg-white focus:shadow-lg focus:shadow-slate-600/10 placeholder-slate-400"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-3 rounded-lg text-sm border border-red-200 animate-bounce">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-800 text-white border-0 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 min-h-12 hover:transform hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-600/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-5 border-t border-slate-200">
          <p className="text-slate-600 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              className="bg-transparent border-0 text-slate-600 font-semibold cursor-pointer underline text-sm transition-colors duration-300 hover:text-slate-800"
              onClick={toggleMode}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
