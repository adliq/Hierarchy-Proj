import { useEffect, useState } from "react";

export default function DisplaySettings() {
  const [theme, setTheme] = useState("light");

  // Load saved theme
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
  <div className="min-h-screen bg-gray-100 dark:bg-black text-black dark:text-white p-6 flex flex-col items-center">
    <button
      onClick={() => window.history.back()}
      className="self-start mb-6 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
    >
      ← Back to Settings
    </button>

    <h2 className="text-3xl font-semibold mb-8">System Display</h2>

    <div className="flex space-x-4">
      <button
        onClick={() => setTheme("light")}
        className={`px-6 py-2 rounded border text-white bg-black ${
          theme === "light" ? "ring-2 ring-white" : ""
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`px-6 py-2 rounded border text-white bg-black ${
          theme === "dark" ? "ring-2 ring-white" : ""
        }`}
      >
        Dark
      </button>
    </div>
  </div>
);
}
