import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CostCalculator() {
  const [items, setItems] = useState([{ name: "", cost: "" }]);
  const navigate = useNavigate();

  // Load saved items on mount
useEffect(() => {
  try {
    const saved = localStorage.getItem("costItems");
    const parsed = saved ? JSON.parse(saved) : null;

    if (Array.isArray(parsed) && parsed.length > 0) {
      setItems(parsed);
    } else {
      // If nothing valid found, start with 1 empty item
      setItems([{ name: "", cost: "" }]);
    }
  } catch (err) {
    console.error("Error loading costItems:", err);
    setItems([{ name: "", cost: "" }]);
  }
}, []);


  // Save items to localStorage on every change
  useEffect(() => {
    localStorage.setItem("costItems", JSON.stringify(items));
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { name: "", cost: "" }]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = field === "cost" ? value.replace(/[^\d.]/g, "") : value;
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + parseFloat(item.cost || 0), 0).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">💰 Idea Cost Estimator</h1>

        {items.map((item, index) => (
          <div key={index} className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Item name"
              className="flex-1 p-3 border border-gray-300 rounded-md"
              value={item.name}
              onChange={(e) => handleItemChange(index, "name", e.target.value)}
            />
            <input
              type="text"
              placeholder="Cost ($)"
              className="w-32 p-3 border border-gray-300 rounded-md"
              value={item.cost}
              onChange={(e) => handleItemChange(index, "cost", e.target.value)}
            />
          </div>
        ))}

        <button
          onClick={handleAddItem}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + Add Item
        </button>

        <div className="text-lg font-semibold text-gray-700 mb-4">
          Total Cost: <span className="text-green-600">${calculateTotal()}</span>
        </div>

        <button
          onClick={() =>
            navigate("/DesignIdea", {
              state: { totalCost: calculateTotal() },
            })
          }
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
        >
          ← Back to Planner
        </button>
      </div>
    </div>
  );
}
