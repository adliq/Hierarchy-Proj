import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ViewNdas() {
  const [ndas, setNdas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNdas = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/settings/signed-ndas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNdas(res.data);
      } catch (err) {
        console.error("Error fetching signed NDAs:", err);
        setError("Failed to load signed NDAs.");
      } finally {
        setLoading(false);
      }
    };
    fetchNdas();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <button
        onClick={() => navigate("/settings")}
        className="mb-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
      >
        ← Back to Settings
      </button>
      <h2 className="text-2xl font-bold mb-4">Your Signed NDAs</h2>
      {loading ? (
        <p>Loading signed NDAs...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : ndas.length === 0 ? (
        <p>No signed NDAs found.</p>
      ) : (
        <ul className="space-y-4">
          {ndas.map((nda) => (
            <li key={nda._id} className="border p-4 rounded shadow-sm bg-gray-50">
              <p><strong>Idea:</strong> {nda.idea?.title || "No title available"}</p>
              <p><strong>Effective Date:</strong> {new Date(nda.effectiveDate).toLocaleDateString()}</p>
              <p><strong>Disclosing Party:</strong> {nda.disclosingPartyName}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
