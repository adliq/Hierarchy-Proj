import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SubmitIdea() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('allIndustries');
  const [industry, setIndustry] = useState('');

  // NDA fields
  const [ndaName, setNdaName] = useState('');
  const [ndaAddress, setNdaAddress] = useState('');
  const [ndaEmail, setNdaEmail] = useState('');
  const [ndaSignature, setNdaSignature] = useState('');

  // Attachment state: holds actual File objects
  const [attachments, setAttachments] = useState([null]);

  const navigate = useNavigate();

  // Add a new (empty) file input
  const handleAddAttachment = () => {
    setAttachments([...attachments, null]);
  };

  // Remove a file input
  const handleRemoveAttachment = (idx) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  // Update the file at the given index
  const handleAttachmentChange = (idx, file) => {
    const newAttachments = [...attachments];
    newAttachments[idx] = file;
    setAttachments(newAttachments);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to submit an idea.");
      return;
    }

    try {
      // Step 1: Create NDA
      const ndaBody = {
        disclosingPartyName: ndaName,
        disclosingPartyAddress: ndaAddress,
        disclosingPartyEmail: ndaEmail,
        disclosingPartySignature: ndaSignature,
        disclosingPartySignedDate: new Date().toISOString(),
        effectiveDate: new Date().toISOString()
      };

      const ndaRes = await fetch('http://localhost:3000/api/ndas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ndaBody),
      });

      if (!ndaRes.ok) {
        const ndaData = await ndaRes.json();
        alert('Failed to create NDA: ' + (ndaData.error || ndaData.message));
        return;
      }

      const ndaData = await ndaRes.json();
      const ndaId = ndaData._id;

      // Step 2: Create idea with attachments using FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('summary', summary);
      formData.append('details', details);
      formData.append('category', category);
      formData.append('visibility', visibility);
      formData.append('nda', ndaId);
      if (visibility === 'industry' && industry !== '') {
        formData.append('visibleToIndustries', JSON.stringify([industry]));
      }

      // Add all non-null attachments
      attachments.forEach((file) => {
        if (file) formData.append('attachments', file);
      });

      const ideaRes = await fetch('http://localhost:3000/api/ideas', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (ideaRes.ok) {
        alert('Idea submitted successfully!');
        setTitle('');
        setSummary('');
        setDetails('');
        setCategory('');
        setVisibility('allIndustries');
        setIndustry('');
        setNdaName('');
        setNdaAddress('');
        setNdaEmail('');
        setNdaSignature('');
        setAttachments([null]);
      } else {
        const data = await ideaRes.json();
        alert('Failed to submit idea: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('Error submitting idea:', error);
      alert('An error occurred while submitting your idea. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="fixed top-0 left-0 w-full flex justify-start p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">Hierarchy</h2>
      </div>

      <div className="pt-24 text-center">
        <h1 className="text-4xl font-bold mb-8">Submit a New Idea 💡</h1>
      </div>

      <div className="flex justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
            <div>
              <label className="block text-gray-300 mb-1">Idea Title</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Summary (visible to everyone)</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Details (protected behind NDA)</label>
              <textarea
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Category</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Visibility</label>
              <select
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="allIndustries">All Industries</option>
                <option value="industry">Specific Industry</option>
              </select>
            </div>

            {visibility === 'industry' && (
              <div>
                <label className="block text-gray-300 mb-1">Select Industry</label>
                <select
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required
                >
                  <option value="">Select Industry</option>
                  <option value="accounting">Accounting</option>
                  <option value="technology">Technology</option>
                  <option value="education">Education</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="retail">Retail</option>
                  <option value="finance">Finance</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            )}

            {/* Attachment section */}
            <div>
              <label className="block text-gray-300 mb-1">Attach Documents</label>
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input
                    type="file"
                    className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                    onChange={(e) => handleAttachmentChange(idx, e.target.files[0])}
                    accept="*"
                  />
                  {attachments.length > 1 && (
                    <button
                      type="button"
                      className="ml-2 px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleRemoveAttachment(idx)}
                      aria-label="Remove"
                    >
                      &minus;
                    </button>
                  )}
                  {idx === attachments.length - 1 && (
                    <button
                      type="button"
                      className="ml-2 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleAddAttachment}
                      aria-label="Add more"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-1">
                Supported: pdf, doc, docx, xlsx, ppt, zip, txt, png, jpg, jpeg, etc.
              </p>
            </div>

            <hr className="border-gray-600 my-4" />

            <h3 className="text-lg font-bold text-gray-300 mb-2">NDA Information (Your Details)</h3>

            <div>
              <label className="block text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={ndaName}
                onChange={(e) => setNdaName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Address</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={ndaAddress}
                onChange={(e) => setNdaAddress(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Email</label>
              <input
                type="email"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={ndaEmail}
                onChange={(e) => setNdaEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Signature (Type Your Name)</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={ndaSignature}
                onChange={(e) => setNdaSignature(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition-colors"
            >
              Submit Idea
            </button>
          </form>

          <button
            onClick={() => navigate('/home')}
            className="w-full mt-4 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
