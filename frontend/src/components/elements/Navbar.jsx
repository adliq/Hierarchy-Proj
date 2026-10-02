import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <Link to="/" className="text-xl font-bold text-gray-800">Hierarchy</Link>

      <form onSubmit={handleSearch} className="flex w-full md:w-1/2">
        <input
          type="text"
          placeholder="Search users or ideas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-l-md"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700 transition"
        >
          Search
        </button>
      </form>
    </nav>
  );
}
