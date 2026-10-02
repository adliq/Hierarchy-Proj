import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

export default function SettingsPage() {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [deactivateError, setDeactivateError] = useState("");
  const [deactivateMessage, setDeactivateMessage] = useState("");

  const [showReset, setShowReset] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState(1);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const handleDeactivate = async () => {
    setDeactivateError("");
    setDeactivateMessage("");

    if (!password) {
      setDeactivateError("Please enter your password.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/api/users/deactivate",
        { password },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setDeactivateMessage(res.data.message);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      setTimeout(() => navigate("/signup"), 1500);
    } catch (err) {
      setDeactivateError(err.response?.data?.message || "Failed to deactivate account.");
    }
  };

  const verifyOldPassword = async () => {
    setResetError("");
    try {
      const res = await axios.post(
        "http://localhost:3000/api/users/verify-password",
        { oldPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (res.data.success) {
        setResetStep(2);
      }
    } catch (err) {
      setResetError("Incorrect old password. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    setResetError("");
    setResetSuccess("");

    if (newPassword !== confirmPassword) {
      setResetError("New passwords do not match.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/api/users/reset-current-password",
        { newPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setResetSuccess("Password updated successfully.");
      setTimeout(() => {
        setShowReset(false);
        setResetStep(1);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }, 1500);
    } catch (err) {
      setResetError("Error updating password. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-black dark:text-white p-4">
      <h1 className="text-4xl font-bold text-center mb-6">Settings</h1>

      <div className="flex justify-center mb-4">
        <button
          onClick={() => navigate("/Home")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          ← Back to Home
        </button>
      </div>

      <div className="flex justify-center space-x-2 mb-6">
        <button onClick={() => navigate("/settings/ndas")} className="bg-black text-white px-4 py-2 rounded">
          Signed NDAs
        </button>
        <button onClick={() => navigate("/settings/terms")} className="bg-black text-white px-4 py-2 rounded">
          Terms and Conditions
        </button>
        <button onClick={() => navigate("/settings/display")} className="bg-black text-white px-4 py-2 rounded">
          Display
        </button>
      </div>

      <hr className="my-6 border-white" />
      <h2 className="text-center text-xl font-semibold mb-4">Account Management</h2>

      <div className="flex justify-center space-x-4 flex-wrap">
        <button onClick={handleSignOut} className="bg-black text-white px-6 py-2 rounded">
          Sign Out
        </button>
        <button onClick={() => setShowModal(true)} className="bg-black text-white px-6 py-2 rounded">
          Deactivate Account
        </button>
        <button onClick={() => setShowReset(true)} className="bg-black text-white px-6 py-2 rounded">
          Reset Password
        </button>
      </div>

      {/* Reset Password Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md text-black dark:text-white">
            <h2 className="text-lg font-semibold text-blue-600 mb-2">Reset Password</h2>

            {resetStep === 1 ? (
              <>
                <label className="block text-sm font-medium mb-1">Enter your current password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded mb-3"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <button
                  onClick={verifyOldPassword}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 w-full"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded mb-2"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border rounded mb-3"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  onClick={handleResetPassword}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 w-full"
                >
                  Save New Password
                </button>
              </>
            )}

            {resetError && <p className="text-red-500 mt-2">{resetError}</p>}
            {resetSuccess && <p className="text-green-500 mt-2">{resetSuccess}</p>}

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowReset(false);
                  setResetStep(1);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setResetError("");
                  setResetSuccess("");
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md text-black dark:text-white">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Deactivate Account</h2>
            <p className="text-sm mb-4">Deactivating your account is permanent and cannot be undone.</p>

            <label className="block text-sm font-medium mb-1">Enter your password</label>
            <input
              type="password"
              className="w-full p-2 border rounded mb-3"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {deactivateError && <p className="text-red-500 mb-2">{deactivateError}</p>}
            {deactivateMessage && <p className="text-green-500 mb-2">{deactivateMessage}</p>}

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
