import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const emailQS = params.get("email") || "";
  const stateEmail = location.state?.email || "";

  const [email, setEmail] = useState(emailQS || stateEmail);
  const [code, setCode] = useState("");
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/users/verify-code", {
        email: email.toLowerCase(),
        code,
      });
      alert("Verification successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      alert("Verification failed: " + (err.response?.data?.message || "Check your code or email"));
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return alert("Enter your email first.");
    try {
      setResending(true);
      await axios.post("http://localhost:3000/api/users/send-verification", {
        email: email.toLowerCase(),
      });
      alert("A new verification code has been sent.");
    } catch (err) {
      alert("Resend failed: " + (err.response?.data?.message || "Try again in a moment"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleVerify} className="bg-white p-8 rounded shadow-md w-96 text-center">
        <h2 className="text-2xl font-bold mb-6">Verify Your Account</h2>

        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 border rounded text-black"
          required
        />

        <input
          type="text"
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-2 mb-4 border rounded text-black"
          required
        />

        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Verify
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="flex-1 bg-gray-600 text-white p-2 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend Code"}
          </button>
        </div>
      </form>
    </div>
  );
}
