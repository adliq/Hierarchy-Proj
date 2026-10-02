import { useState } from "react";
import axios from "axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showPasswordInputs, setShowPasswordInputs] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false); // 👁 Toggle
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 👁 Toggle

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/users/forgot-password", {
        email: email.toLowerCase(),
      });

      alert("Reset email sent. Check your inbox for the 6-digit code.");
      setShowCodeInput(true);
    } catch (err) {
      console.error("Reset failed:", err.response?.data?.message || err.message);
      alert("Reset failed: " + (err.response?.data?.message || "Check email address"));
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      setShowPasswordInputs(true);
    } catch (err) {
      console.error("Code verification failed:", err.response?.data?.message || err.message);
      alert("Invalid code.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/users/reset-password-code", {
        email: email.toLowerCase(),
        code,
        password: newPassword,
        confirmPassword,
      });

      alert("Password reset successful! You can now log in.");
      window.location.href = "/login";
    } catch (err) {
      console.error("Password reset failed:", err.response?.data?.message || err.message);
      alert("Failed to reset: " + (err.response?.data?.message || "Please check details"));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>

        {/* Email input */}
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <button
          onClick={handleSendEmail}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 mb-4"
        >
          Send Reset Email
        </button>

        {/* Code input */}
        {showCodeInput && !showPasswordInputs && (
          <>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2 mb-4 border rounded"
              required
            />
            <button
              onClick={handleVerifyCode}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mb-4"
            >
              Verify Code
            </button>
          </>
        )}

        {/* New password inputs */}
        {showPasswordInputs && (
          <>
            <div className="relative w-full mb-4">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <span
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2 cursor-pointer select-none"
              >
                {showNewPassword ? "🙈" : "👁️"}
              </span>
            </div>

            <div className="relative w-full mb-4">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2 cursor-pointer select-none"
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </span>
            </div>

            <button
              onClick={handleResetPassword}
              className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
            >
              Reset Password
            </button>
          </>
        )}

        <p className="mt-4 text-center">
          Back to{" "} 
          <a href="/login" className="text-blue-500 hover:underline">Log In</a>
        </p>
      </form>
    </div>
  );
}
