
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function IdeaPlanner() {
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [status, setStatus] = useState(""); // optional feedback
  const navigate = useNavigate();
  const location = useLocation();
  const totalCost = location.state?.totalCost;
  const [goals, setGoals] = useState([""]);
  const [industry, setIndustry] = useState("");
  const [custom, setCustom] = useState([{ label: "", text: "" }]);
  const [file, setFile] = useState(null);
  const [uploadedFilePath, setUploadedFilePath] = useState(null);

  const token = localStorage.getItem("token");



  const handleGoalChange = (index, value) => {
    const updated = [...goals];
    updated[index] = value;
    setGoals(updated);
  };

  const handleAddGoal = () => {
    setGoals([...goals, ""]);
  };

  const handleRemoveGoal = (index) => {
    const updated = goals.filter((_, i) => i !== index);
    setGoals(updated);
  };

  const handleCustomChange = (index, key, val) => {
    const updated = [...custom];
    updated[index][key] = val;
    setCustom(updated);
  };

  const handleAddCustom = () => {
    setCustom([...custom, { label: "", text: "" }]);
  };

  const handleRemoveCustom = (index) => {
    const updated = custom.filter((_, i) => i !== index);
    setCustom(updated);
  };

  const handleFileUpload = async (file) => {
    const formdata = new FormData();
    formdata.append('file', file);

    try {
      const response = await axios.post('http://localhost:3000/api/users/upload-file', formdata, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log("File uploaded successfully:", response.data);
      setUploadedFilePath(response.data.filePath);
      setStatus("File uploaded successfully.");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus("Error uploading file.");
      setTimeout(() => setStatus(""), 3000);
    }
  };



  const handleSaveDraft = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post(
      'http://localhost:3000/api/users/drafts',
      { title, problem, solution, industry, goals, custom, filePath: uploadedFilePath },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setStatus("Draft saved successfully.");
    setTimeout(() => setStatus(""), 3000);
  } catch (error) {
    setStatus("Error saving draft.");
    setTimeout(() => setStatus(""), 3000);
  }
};

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📝 Idea Planner (Draft Mode)</h1>
        <form onSubmit={handleSaveDraft} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Idea Title (optional)</label>
            <input
              type="text"
              placeholder="Give your idea a short title..."
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-400 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Select Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="">-- Select an Industry --</option>
              <option value="Tech">Tech</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Finance">Finance</option>
              <option value="Construction">Construction</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Problem You’re Solving</label>
            <textarea
              rows="4"
              placeholder="What's the issue you're tackling?"
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-red-400 outline-none"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Your Proposed Solution</label>
            <textarea
              rows="4"
              placeholder="How does your idea solve this problem?"
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-green-400 outline-none"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              required
            />
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Upload any file
            </label>
            {uploadedFilePath && (
  <div className="text-sm text-green-700">
    ✅ File uploaded:&nbsp;
    <button
      type="button"
      className="underline text-blue-600"
      onClick={async () => {
        try {
          // Extract filename from uploadedFilePath (after "/uploads/")
          const parts = uploadedFilePath.split("/");
          const filename = parts[parts.length - 1];
          const response = await fetch(`http://localhost:3000/uploads/${filename}`);
          if (!response.ok) throw new Error("File not found");
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename; // Uses the stored filename (or use file.name if you saved it)
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch (err) {
          alert("Error downloading file: " + err.message);
        }
      }}
    >
      Download File
    </button>
  </div>
)}



            <div className="flex items-center gap-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-block px-5 py-2 bg-blue-600 text-white rounded-md font-medium shadow hover:bg-blue-700 transition"
              >
                📁 Choose File
              </label>
              <span className="text-gray-700 text-sm">
                {file ? file.name : " No file chosen"}
              </span>
              <input
                id="file-upload"
                type="file"
                style={{ display: "none" }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </div>
        </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Goals of Your Idea</label>
            {goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder={`Goal ${index + 1}`}
                  value={goal}
                  onChange={(e) => handleGoalChange(index, e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-md"
                />
                {goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddGoal}
              className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
            >
              + Add Goal
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/CostCalculator")}
            className="w-full mt-4 bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition"
          >
            🧮 Calculate Costs
          </button>

          {totalCost && (
            <div className="mt-2 text-md text-gray-700">
              Estimated Total Cost: <span className="font-semibold text-green-600">${totalCost}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Custom Info</label>
            {custom.map((field, index) => (
              <div key={index} className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  placeholder="Label"
                  value={field.label}
                  onChange={(e) => handleCustomChange(index, "label", e.target.value)}
                  className="w-1/3 p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Text"
                  value={field.text}
                  onChange={(e) => handleCustomChange(index, "text", e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustom(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✖
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddCustom}
              className="mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
            >
              + Add Custom Field
            </button>
          </div>
        {/* <form onSubmit={handleSaveDraft} className="space-y-6">
          {/* ...other form fields... */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition"
          >
            💾 Save Draft
          </button>
       

          {status && (
            <div className="text-green-600 font-medium text-center mt-2">{status}</div>
          )}

          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-full mt-4 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Return to Homepage
          </button>
        </form>
      </div>
    </div>
  );
}