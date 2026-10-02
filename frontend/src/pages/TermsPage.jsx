import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function TermsPage() {
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/settings/terms");
        setTerms(res.data.terms);
      } catch (err) {
        console.error("Error fetching terms:", err);
        setError("Failed to load Terms and Conditions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <button
        onClick={() => navigate("/settings")}
        className="mb-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
      >
        ← Back to Settings
      </button>

      <h2 className="text-2xl font-semibold mb-4">Terms and Conditions</h2>

      {loading ? (
        <p>Loading Terms and Conditions...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <pre className="whitespace-pre-wrap bg-white p-4 rounded shadow">{terms}</pre>
      )}
    </div>
  );
}
