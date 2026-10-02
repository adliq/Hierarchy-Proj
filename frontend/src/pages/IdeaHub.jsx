import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaRegStar, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function IdeaHub() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIdea, setActiveIdea] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [signedIdeas, setSignedIdeas] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [chatContacts, setChatContacts] = useState({});

  const [ndaName, setNdaName] = useState("");
  const [ndaAddress, setNdaAddress] = useState("");
  const [ndaEmail, setNdaEmail] = useState("");
  const [ndaSignature, setNdaSignature] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // simple dedupe guard for status fetches
  const fetchingStatus = useRef(new Set());

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchAndCacheContact = async (ideaId) => {
    try {
      if (!ideaId) return;
      if (fetchingStatus.current.has(ideaId)) return; // prevent parallel dupes
      fetchingStatus.current.add(ideaId);

      const statusRes = await axios.get(
        `http://localhost:3000/api/ndas/status/${ideaId}`,
        authHeader
      );
      const s = statusRes.data || {};
      if (s.signed) {
        setChatContacts((prev) => ({
          ...prev,
          [ideaId]: {
            name: s.disclosingPartyName || s.creatorName || "Idea Owner",
            email: s.disclosingPartyEmail || s.creatorEmail,
            creatorId: s.creatorId,
          },
        }));
      }
    } catch (e) {
      // swallow; not fatal to the page
    } finally {
      fetchingStatus.current.delete(ideaId);
    }
  };

  useEffect(() => {
  const fetchIdeas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/api/ideas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIdeas(res.data); // ✅ Use backend-filtered ideas directly
    } catch (err) {
      console.error("Error fetching ideas:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchIdeas();
}, []);

  // Rehydrate chatContacts for any signed ideas whenever signedIdeas changes
  useEffect(() => {
    if (!signedIdeas || signedIdeas.length === 0) return;
    signedIdeas.forEach((id) => {
      if (!chatContacts[id]) fetchAndCacheContact(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIdeas]);

  const refreshSignedIdeas = async () => {
    try {
      const ndaRes = await axios.get("http://localhost:3000/api/ndas", authHeader);
      const ndaIdeaIds = (ndaRes.data || [])
        .map((n) => (n.idea?._id || n.idea)?.toString())
        .filter(Boolean);
      setSignedIdeas(ndaIdeaIds);
    } catch {
      // ignore
    }
  };

  const handleViewDetails = async (idea) => {
    setActiveIdea(idea);
    try {
      const statusRes = await axios.get(
        `http://localhost:3000/api/ndas/status/${idea._id}`,
        authHeader
      );

      const s = statusRes.data || {};
      if (s.signed) {
        // mark as signed if not already
        setSignedIdeas((prev) => {
          const id = idea._id.toString();
          return prev.includes(id) ? prev : [...prev, id];
        });

        // cache contact/chat
        setChatContacts((prev) => ({
          ...prev,
          [idea._id]: {
            name: s.disclosingPartyName || s.creatorName || "Idea Owner",
            email: s.disclosingPartyEmail || s.creatorEmail,
            creatorId: s.creatorId,
          },
        }));
      } else {
        setShowModal(true);
      }
    } catch (err) {
      console.error("Failed to check NDA status:", err.response?.data || err.message);
      alert("Could not check NDA status. Please try again.");
    }
  };

  const handleSignNDA = async () => {
    try {
      const ndaId = activeIdea?.nda;
      if (!ndaId) {
        alert("This idea does not have an NDA linked.");
        return;
      }
      const ndaBody = {
        receivingPartyName: ndaName,
        receivingPartyAddress: ndaAddress,
        receivingPartyEmail: ndaEmail,
        receivingPartySignature: ndaSignature,
        receivingPartySignedDate: new Date().toISOString(),
      };
      await axios.put(
        `http://localhost:3000/api/ndas/${ndaId}/sign-receiving`,
        ndaBody,
        authHeader
      );

      try {
        await fetchAndCacheContact(activeIdea._id);
        setSignedIdeas((prev) => {
          const id = activeIdea._id.toString();
          return prev.includes(id) ? prev : [...prev, id];
        });
      } catch {}

      setShowModal(false);
      setNdaName("");
      setNdaAddress("");
      setNdaEmail("");
      setNdaSignature("");
      alert("NDA signed successfully. You can now view details.");
      await refreshSignedIdeas();
    } catch (err) {
      alert("Failed to sign NDA. Please try again.");
    }
  };

  const toggleFavorite = async (ideaId) => {
    try {
      const res = await axios.put(
        `http://localhost:3000/api/users/favorite/${ideaId}`,
        {},
        authHeader
      );

      setFavorites(
        res.data.favorites.map((fav) => (typeof fav === "object" ? fav._id : fav))
      );
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      alert("Failed to update favorite status.");
    }
  };

  const handleAttachmentClick = (ideaId, file) => {
    const url = `http://localhost:3000/api/files/${ideaId}/${file.filename}`;
    fetch(url, authHeader)
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or file error");
        return res.blob();
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
      .catch((err) => alert("Error downloading file: " + err.message));
  };

  const renderAttachments = (idea) => {
    if (!idea.attachments || idea.attachments.length === 0) return null;
    return (
      <div className="mt-4">
        <div className="font-semibold mb-1 text-gray-800">Attachments:</div>
        <ul>
          {idea.attachments.map((file, idx) => (
            <li key={idx} className="mb-1">
              <button
                onClick={() => handleAttachmentClick(idea._id, file)}
                className="text-blue-600 underline break-all hover:text-blue-800 transition-colors"
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {file.originalname}
              </button>
              <span className="ml-2 text-xs text-gray-500">({file.mimetype})</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-600 text-lg">No ideas available to show.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <button
        onClick={() => (window.location.href = "/home")}
        className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-200"
      >
        Return to Homepage
      </button>

      <h1 className="text-3xl font-bold text-center mb-8">IdeaHub</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea) => {
          const isSigned = signedIdeas.includes(idea._id.toString());
          const contact = chatContacts[idea._id];

          // Auto-hydrate contact if signed but missing
          if (isSigned && !contact) fetchAndCacheContact(idea._id);

          return (
            <div
              key={idea._id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold mb-2">{idea.title}</h2>
                {favorites.includes(idea._id.toString()) ? (
                  <FaStar
                    className="text-yellow-400 text-xl cursor-pointer"
                    onClick={() => toggleFavorite(idea._id)}
                  />
                ) : (
                  <FaRegStar
                    className="text-gray-400 text-xl cursor-pointer"
                    onClick={() => toggleFavorite(idea._id)}
                  />
                )}
              </div>
              <p className="text-gray-700 mb-4">{idea.summary}</p>

              {isSigned ? (
                <>
                  <p className="text-gray-800 mb-4">{idea.details}</p>

                  {renderAttachments(idea)}

                  {contact ? (
                    <div className="mt-3 p-3 border rounded bg-gray-100">
                      <p className="text-sm text-gray-800">
                        Contact: {contact.name} ({contact.email})
                      </p>
                      <button
                        onClick={() => navigate(`/chat/${contact.creatorId}`)}
                        className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Chat with {contact.name}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 border rounded bg-gray-50 text-sm text-gray-600">
                      Loading contact…
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-500 italic mb-2">
                    Details are protected. NDA required to view.
                  </p>
                  <button
                    onClick={() => handleViewDetails(idea)}
                    className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </>
              )}

              <p className="text-sm text-gray-500 mt-2">
                Category: {idea.category}
              </p>
              <p className="text-xs text-gray-400">
                Created by:{" "}
                {idea.createdBy
                  ? `${idea.createdBy.name} (${idea.createdBy.email})`
                  : "Unknown"}
              </p>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Sign NDA to View Details
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-700">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-400 rounded px-3 py-2"
                  value={ndaName}
                  onChange={(e) => setNdaName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Address</label>
                <input
                  type="text"
                  className="w-full border border-gray-400 rounded px-3 py-2"
                  value={ndaAddress}
                  onChange={(e) => setNdaAddress(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-400 rounded px-3 py-2"
                  value={ndaEmail}
                  onChange={(e) => setNdaEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  Signature (Type Your Name)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-400 rounded px-3 py-2"
                  value={ndaSignature}
                  onChange={(e) => setNdaSignature(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSignNDA}
                disabled={!ndaName || !ndaAddress || !ndaEmail || !ndaSignature}
                className={`bg-blue-600 text-white px-4 py-2 rounded ${
                  !ndaName || !ndaAddress || !ndaEmail || !ndaSignature
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                Sign NDA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
