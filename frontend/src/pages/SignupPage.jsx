import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [role, setRole] = useState("individual");
  const [industry, setIndustry] = useState("");

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    // client-side validation
    if (!firstName.trim()) return alert("First name is required.");
    if (!lastName.trim()) return alert("Last name is required.");
    if (middleInitial && middleInitial.length > 1)
      return alert("Middle initial must be a single character.");
    if (password !== confirmPassword)
      return alert("Passwords do not match.");

    try {
      const res = await axios.post("http://localhost:3000/api/users/", {
        firstName, middleInitial, lastName,
         email: email.toLowerCase(),
         password, confirmPassword, role,
          industry: role === "business" ? industry : undefined,
        });
        if (res.data.emailSent) {
           alert("Account created! We emailed you a 6-digit code for verification.");
          } else {
            alert("Account created, but the email couldn’t be sent. Tap 'Resend Code' on the Verify page.");
          }
          navigate(`/verify?email=${encodeURIComponent(email.toLowerCase())}`);
        } catch (err) {
      console.error("Sign up failed:", err.response?.data?.message || err.message);
      alert("Sign up failed: " + (err.response?.data?.message || "Check your input"));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSignUp} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        {/* Name fields */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <input
            type="text"
            placeholder="First name*"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="p-2 border rounded col-span-1"
            required
          />
          <input
            type="text"
            placeholder="M"
            value={middleInitial}
            onChange={(e) => setMiddleInitial(e.target.value.toUpperCase().slice(0, 1))}
            className="p-2 border rounded col-span-1"
            maxLength={1}
            aria-label="Middle initial (optional)"
          />
          <input
            type="text"
            placeholder="Last name*"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="p-2 border rounded col-span-1"
            required
          />
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        {/* Password */}
        <div className="relative w-full mb-4">
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
            title="Show/Hide password"
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Confirm Password */}
        <div className="relative w-full mb-4">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <span
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-2 cursor-pointer select-none"
            title="Show/Hide confirm password"
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        >
          <option value="individual">Individual</option>
          <option value="business">Business</option>
        </select>

        {role === "business" && (
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full p-2 mb-6 border rounded"
            required
          >
            <option value="">Select Industry</option>
            <option value="accounting">Accounting</option>
            <option value="technology">Technology</option>
            <option value="education">Education</option>
            <option value="healthcare">Healthcare</option>
            <option value="retail">Retail</option>
            <option value="finance">Finance</option>
            <option value="marketing">Marketing</option>
          </select>
        )}

        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
          Sign Up
        </button>

        <p className="mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">Log In</a>
        </p>
      </form>
    </div>
  );
}
