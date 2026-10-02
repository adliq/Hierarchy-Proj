import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁 Toggle
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("http://localhost:3000/api/users/login", {
      email: email.toLowerCase(),
      password,
    });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("userId", res.data.user.id);
    navigate("/home");
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    const status = err.response?.status;
    if (status === 403) {
      // Unverified: send them to verify page with email prefilled
      alert("Please verify your account. We’re taking you to the verify page.");
      navigate(`/verify?email=${encodeURIComponent(email.toLowerCase())}`);
      return;
    }
    console.error("Login failed:", msg);
    alert("Login failed: " + (msg || "Check credentials"));
  }
};

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <div className="relative w-full mb-6">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 cursor-pointer select-none"
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Log In
        </button>
        <p className="mt-4 text-center">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-500 hover:underline">Sign Up</a>
        </p>
        <p className="mt-2 text-center">
          Don't remember your password?{" "}
          <a href="/forgot-password" className="text-blue-500 hover:underline">Forgot Password</a>
        </p>
      </form>
    </div>
  );
}
