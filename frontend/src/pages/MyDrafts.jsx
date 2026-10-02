import { useEffect, useState } from "react";
import axios from "axios";

export default function MyDrafts() {
  const [drafts, setDrafts] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/users/drafts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDrafts(res.data);
      } catch (err) {
        console.error("Error fetching drafts:", err);
      }
    };

    fetchDrafts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">📂 My Drafts</h1>
      {drafts.length === 0 ? (
        <p>No drafts found.</p>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <div key={draft._id} className="bg-white p-4 shadow rounded-md">
              <h2 className="font-semibold text-lg">{draft.title || "Untitled Draft"}</h2>
              <p className="text-sm text-gray-600">Industry: {draft.industry}</p>
              <p className="text-sm text-gray-800 mt-2">Problem: {draft.problem}</p>
              <p className="text-sm text-gray-800">Solution: {draft.solution}</p>
            {draft.filePath && (
            <a
                href={`http://localhost:3000/${draft.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mt-2 inline-block"
            >
                📎 View Attached File
            </a>
            )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
