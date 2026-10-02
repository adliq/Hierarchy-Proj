import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [userRes, ideaRes] = await Promise.all([
          axios.get(`http://localhost:3000/api/search/users?q=${query}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:3000/api/search/ideas?q=${query}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setUsers(userRes.data);
        setIdeas(ideaRes.data);
      } catch (err) {
        console.error("Search failed:", err);
      }
    };

    if (query) fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">🔍 Search Results for: <span className="text-blue-700">"{query}"</span></h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">👤 Users</h2>
        {users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user._id} className="p-3 bg-white rounded shadow">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">💡 Ideas</h2>
        {ideas.length === 0 ? (
          <p className="text-gray-600">No ideas found.</p>
        ) : (
          <ul className="space-y-2">
            {ideas.map((idea) => (
              <li key={idea._id} className="p-4 bg-white rounded shadow">
                <p className="font-semibold text-lg">{idea.title}</p>
                <p className="text-sm text-gray-700 mt-1">{idea.problem}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
