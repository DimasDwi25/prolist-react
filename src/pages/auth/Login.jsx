import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api"; // axios instance
import { setAuth } from "../../utils/storage"; // simpan user + token ke cookie

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    setIsSubmitting(true);
    setErrors({});

    try {
      // 🔑 Kirim login request via axios (JWT)
      const { data } = await api.post("/login", { email, password });

      // ✅ Simpan user + token ke cookies
      setAuth(data.user, data.token);

      // ✅ Redirect sesuai role
      navigate(data.redirect_url || "/", { replace: true });
    } catch (err) {
      console.error("❌ Login error:", err);
      if (err.response) {
        setErrors({
          general:
            err.response.data.error ||
            err.response.data.message ||
            "Login failed",
        });
      } else {
        setErrors({ general: "Failed to connect to server" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 py-6 px-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-full shadow">
                <i className="fas fa-tasks text-blue-600 text-xl"></i>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">ProList-APP</h1>
            <p className="text-blue-100 text-sm">
              Internal Task Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 bg-white">
            {errors.general && (
              <p className="text-sm text-red-500 mb-3">{errors.general}</p>
            )}

            {/* Email */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                <i className="fas fa-envelope mr-2 text-blue-500"></i> Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-1 focus:ring-blue-500 outline-none transition`}
                placeholder="your.name@company.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-gray-700 text-sm font-medium mb-1"
              >
                <i className="fas fa-lock mr-2 text-blue-500"></i> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.password
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  } focus:ring-1 focus:ring-blue-500 outline-none transition pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-blue-600"
                  tabIndex={-1}
                >
                  <i
                    className={`fas ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <div className="mb-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full text-white py-3 px-4 rounded-lg font-semibold transition duration-200 ${
                  isSubmitting
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-gradient-to-br from-blue-500 to-blue-700 hover:opacity-90"
                }`}
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                {isSubmitting ? "Logging in..." : "Login to Dashboard"}
              </button>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-400">
              <p>For authorized personnel only</p>
              <p className="mt-1">
                © {currentYear} ProList-APP. All rights reserved.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
