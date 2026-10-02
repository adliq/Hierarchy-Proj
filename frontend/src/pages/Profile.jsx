import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          setError("No token or user ID found. Please log in again.");
          setLoading(false);
          return;
        }

        const res = await axios.get("http://localhost:3000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const foundUser = res.data;

        if (!foundUser) {
          setError("User not found. Please log in again.");
          setLoading(false);
          return;
        }

        setUser(foundUser);

        const ideasRes = await axios.get(`http://localhost:3000/api/ideas/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIdeas(ideasRes.data);

        const favoritesRes = await axios.get("http://localhost:3000/api/users/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(favoritesRes.data.favorites);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [location.pathname]);

  const handleDeleteIdea = async (ideaId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in again.");
        return;
      }

      await axios.delete(`http://localhost:3000/api/ideas/${ideaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIdeas((prevIdeas) => prevIdeas.filter((idea) => idea._id !== ideaId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete idea.");
    }
  };

  const getFullImageUrl = (path) => {
    if (!path) return "";
    return path.startsWith("/uploads") ? `http://localhost:3000${path}` : path;
  };

  const renderSocialLinks = () => {
    if (!user || !user.socials || Object.keys(user.socials).length === 0) return null;
    return (
      <div className="w-full flex flex-col items-center mt-2 mb-2">
        <h3 className="text-lg font-semibold mb-1">Social Media Links</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {Object.entries(user.socials).map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-200 px-2"
              title={platform}
            >
              {platform}
            </a>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-20">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
      {/* Navbar */}
      <div className="fixed top-0 left-0 w-full flex justify-start p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">Hierarchy</h2>
      </div>

      {/* Main Container */}
      <div className="pt-32 w-full max-w-4xl bg-gray-800 rounded-lg shadow-lg px-8 py-10 mt-4">
        {/* Cover Picture */}
        {user.coverPicture && (
          <img
            src={getFullImageUrl(user.coverPicture)}
            alt="Cover"
            className="w-full h-48 object-cover rounded-lg mb-6"
          />
        )}

        {/* User Info */}
        <div className="flex flex-col items-center space-y-3">
          {user.profilePicture && (
            <img
              src={getFullImageUrl(user.profilePicture)}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white -mt-20 bg-gray-900"
            />
          )}
          <h1 className="text-3xl font-bold">{user.name}</h1>
          {user.bio && <p className="text-gray-400">{user.bio}</p>}
          {renderSocialLinks()}
          <p className="text-gray-500">{user.email}</p>
          <p className="text-gray-400">
            Role: {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "N/A"}
            {user.role === "business" && user.industry && <> | Industry: {user.industry}</>}
          </p>

          <Link to="/edit-profile">
            <button className="mt-2 bg-blue-600 px-6 py-2 rounded text-white hover:bg-blue-700 transition-colors">
              Edit Profile
            </button>
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Ideas Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Ideas 💡</h2>
          <div className="grid gap-4">
            {ideas.length > 0 ? (
              ideas.map((idea) => (
                <div
                  key={idea._id}
                  className="bg-gray-700 p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold mb-2">{idea.title}</h3>
                  <p className="text-gray-300 mb-3">{idea.summary}</p>

                  <Link to={`/idea/${idea._id}`}>
                    <button className="bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-700 transition-colors">
                      View
                    </button>
                  </Link>

                  <button
                    onClick={() => handleDeleteIdea(idea._id)}
                    className="bg-red-600 px-3 py-1 mt-2 rounded text-white hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-400">You haven't posted any ideas yet.</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Drafts button */}
        <button
          onClick={() => navigate("/my-drafts")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          📂 View My Drafts
        </button>

        {/* Favorites section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Your Favorite Ideas ⭐</h2>
          <div className="grid gap-4">
            {favorites.length > 0 ? (
              favorites.map((idea) => (
                <div
                  key={idea._id}
                  className="bg-gray-700 p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold mb-2">{idea.title}</h3>
                  <p className="text-gray-300 mb-3">{idea.summary}</p>
                  <Link to={`/idea/${idea._id}`}>
                    <button className="bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-700 transition-colors">
                      View
                    </button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-gray-400">You haven't favorited any ideas yet.</p>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={() => navigate("/home")}
          className="w-full mt-6 bg-gray-600 px-4 py-2 rounded text-white hover:bg-gray-700 transition-colors"
        >
          Return to Homepage
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full mt-4 bg-gray-600 px-4 py-2 rounded text-white hover:bg-gray-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
