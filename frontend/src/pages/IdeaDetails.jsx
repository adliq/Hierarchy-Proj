import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function IdeaDetails() {
  const { id } = useParams();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchIdea = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:3000/api/ideas/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIdea(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load idea.");
      } finally {
        setLoading(false);
      }
    };
    fetchIdea();
  }, [id]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!idea) return <div className="p-8">Idea not found.</div>;

  const renderAttachments = () => {
    if (!idea.attachments || idea.attachments.length === 0) return null;

    const token = localStorage.getItem("token");
    const handleAttachmentClick = (file) => {
      const url = `http://localhost:3000/api/files/${idea._id}/${file.filename}`;
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => {
          if (!r.ok) throw new Error("Unauthorized or file error");
          return r.blob();
        })
        .then((blob) => {
          const dl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = dl;
          a.download = file.originalname;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => window.URL.revokeObjectURL(dl), 10000);
        })
        .catch((e) => alert("Error downloading file: " + e.message));
    };

    return (
      <div className="mt-4">
        <div className="font-semibold mb-1">Attachments</div>
        <ul className="list-disc pl-5">
          {idea.attachments.map((file, idx) => (
            <li key={idx} className="mb-1">
              <button
                type="button"
                className="text-blue-600 underline"
                onClick={() => handleAttachmentClick(file)}
              >
                {file.originalname}
              </button>{" "}
              <span className="text-xs text-gray-500">({file.mimetype})</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const ndaRequired = idea.ndaRequired === true || (!idea.details && idea.message);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{idea.title}</h1>
        <p className="text-gray-700 mb-4">{idea.summary}</p>

        {ndaRequired ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              NDA required to view full details. Go to IdeaHub to sign the NDA for this idea.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 whitespace-pre-wrap">{idea.details}</p>
            {renderAttachments()}
          </>
        )}

        <div className="mt-6 text-sm text-gray-500">
          Category: {idea.category} • Created at:{" "}
          {new Date(idea.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
