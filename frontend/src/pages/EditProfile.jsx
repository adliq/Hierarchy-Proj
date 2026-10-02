import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    bio: '',
    role: '',
    industry: '',
  });
  const [socials, setSocials] = useState([{ platform: '', url: '' }]);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [coverPicFile, setCoverPicFile] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [coverPicUrl, setCoverPicUrl] = useState('');
  const navigate = useNavigate();

  // Helper to derive structured names from legacy "name"
  const parseDisplayName = (nameStr = '') => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 0) return { firstName: '', middleInitial: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], middleInitial: '', lastName: '' };
    const firstName = parts[0];
    const lastName = parts[parts.length - 1].replace(/\.$/, '');
    let middleInitial = '';
    if (parts.length > 2) {
      // take first character of the middle chunk if it looks like an initial
      const mid = parts.slice(1, -1).join(' ');
      const m = mid.match(/^[A-Za-z]/);
      middleInitial = m ? m[0].toUpperCase() : '';
    }
    return { firstName, middleInitial, lastName };
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const {
          firstName,
          middleInitial,
          lastName,
          name, // legacy
          bio,
          role,
          industry,
          socials: socialsMap,
          profilePicture,
          coverPicture
        } = res.data;

        // Prefer structured fields; fallback to parsing legacy `name`
        let init = {
          firstName: firstName || '',
          middleInitial: middleInitial || '',
          lastName: lastName || '',
          bio: bio || '',
          role: role || '',
          industry: industry || '',
        };
        if (!init.firstName && name) {
          const parsed = parseDisplayName(name);
          init = { ...init, ...parsed };
        }
        setFormData(init);

        setProfilePicUrl(profilePicture || '');
        setCoverPicUrl(coverPicture || '');

        // Load socials as rows
        if (socialsMap && typeof socialsMap === 'object' && Object.keys(socialsMap).length > 0) {
          setSocials(
            Object.entries(socialsMap).map(([platform, url]) => ({ platform, url }))
          );
        } else {
          setSocials([{ platform: '', url: '' }]);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to load user data.');
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'middleInitial') v = value.toUpperCase().slice(0, 1);
    setFormData((prev) => ({ ...prev, [name]: v }));
  };

  // Socials: change/add/remove
  const handleSocialChange = (idx, field, value) => {
    setSocials((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };
  const handleAddSocial = () => setSocials((prev) => [...prev, { platform: '', url: '' }]);
  const handleRemoveSocial = (idx) => {
    if (socials.length === 1) return;
    setSocials(socials.filter((_, i) => i !== idx));
  };

  // Pictures
  const handleRemovePicture = async (type) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        'http://localhost:3000/api/users/remove-picture',
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (type === 'profile') setProfilePicUrl('');
      if (type === 'cover') setCoverPicUrl('');
      alert('Picture removed!');
    } catch {
      alert('Failed to remove picture.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate names
    if (!formData.firstName.trim()) return alert('First name is required.');
    if (!formData.lastName.trim()) return alert('Last name is required.');
    if (formData.middleInitial && !/^[A-Za-z]$/.test(formData.middleInitial)) {
      return alert('Middle initial must be a single letter.');
    }

    const token = localStorage.getItem('token');

    try {
      // Socials -> object
      const socialsObj = {};
      socials.forEach(({ platform, url }) => {
        if (platform && url) socialsObj[platform] = url;
      });

      // Decide payload type
      let data;
      const includeFiles = !!(profilePicFile || coverPicFile);
      if (includeFiles) {
        data = new FormData();
        data.append('firstName', formData.firstName.trim());
        if (formData.middleInitial) data.append('middleInitial', formData.middleInitial);
        data.append('lastName', formData.lastName.trim());
        if (formData.bio) data.append('bio', formData.bio);
        if (formData.role) data.append('role', formData.role.toLowerCase());
        if (formData.role.toLowerCase() === 'business' && formData.industry) {
          data.append('industry', formData.industry);
        }
        if (Object.keys(socialsObj).length > 0) {
          data.append('socials', JSON.stringify(socialsObj));
        }
        if (profilePicFile) data.append('profilePicture', profilePicFile);
        if (coverPicFile) data.append('coverPicture', coverPicFile);
      } else {
        data = {
          firstName: formData.firstName.trim(),
          middleInitial: formData.middleInitial || undefined,
          lastName: formData.lastName.trim(),
          bio: formData.bio || undefined,
          role: formData.role ? formData.role.toLowerCase() : undefined,
          ...(formData.role.toLowerCase() === 'business' && formData.industry
            ? { industry: formData.industry }
            : {}),
          socials: Object.keys(socialsObj).length > 0 ? socialsObj : undefined,
        };
      }

      await axios.put('http://localhost:3000/api/users/profile', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(profilePicFile || coverPicFile
            ? { 'Content-Type': 'multipart/form-data' }
            : {}),
        },
      });

      alert('Profile updated!');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    }
  };

  const getFullImageUrl = (path) =>
    !path ? '' : path.startsWith('/uploads') ? `http://localhost:3000${path}` : path;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded shadow-md w-full max-w-lg"
        encType="multipart/form-data"
      >
        <h1 className="text-2xl mb-4">Edit Profile</h1>

        {/* Structured name fields */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First name*"
            className="p-2 rounded text-black"
            required
          />
          <input
            type="text"
            name="middleInitial"
            value={formData.middleInitial}
            onChange={handleChange}
            placeholder="M"
            className="p-2 rounded text-black"
            maxLength={1}
            aria-label="Middle initial (optional)"
          />
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last name*"
            className="p-2 rounded text-black"
            required
          />
        </div>

        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Bio"
          className="w-full mb-3 p-2 rounded text-black"
        />

        <label className="block mb-2">Social Media Links</label>
        {socials.map((s, idx) => (
          <div key={idx} className="flex space-x-2 mb-2">
            <input
              type="text"
              placeholder="Platform (e.g. LinkedIn)"
              value={s.platform}
              onChange={(e) => handleSocialChange(idx, 'platform', e.target.value)}
              className="flex-1 p-2 rounded text-black"
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={s.url}
              onChange={(e) => handleSocialChange(idx, 'url', e.target.value)}
              className="flex-1 p-2 rounded text-black"
            />
            <button
              type="button"
              onClick={() => handleRemoveSocial(idx)}
              className="bg-red-600 text-white rounded px-3"
              disabled={socials.length === 1}
              title={socials.length === 1 ? 'At least one row required' : 'Remove'}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="mb-4 bg-blue-700 px-3 py-1 rounded"
          onClick={handleAddSocial}
        >
          + Add Social Link
        </button>

        {/* Profile picture */}
        <label className="block mb-2">Upload Profile Picture</label>
        {profilePicUrl && (
          <div className="mb-2 flex items-center space-x-2">
            <img
              src={getFullImageUrl(profilePicUrl)}
              alt="Profile"
              className="w-20 h-20 object-cover rounded-full border"
            />
            <button
              type="button"
              onClick={() => handleRemovePicture('profile')}
              className="bg-red-600 text-white rounded px-3 py-1 ml-2"
            >
              Remove Profile Picture
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setProfilePicFile(e.target.files[0])}
          className="w-full mb-3 p-2 rounded bg-white text-black"
        />

        {/* Cover picture */}
        <label className="block mb-2">Upload Cover Picture</label>
        {coverPicUrl && (
          <div className="mb-2 flex items-center space-x-2">
            <img
              src={getFullImageUrl(coverPicUrl)}
              alt="Cover"
              className="w-32 h-16 object-cover rounded border"
            />
            <button
              type="button"
              onClick={() => handleRemovePicture('cover')}
              className="bg-red-600 text-white rounded px-3 py-1 ml-2"
            >
              Remove Cover Picture
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverPicFile(e.target.files[0])}
          className="w-full mb-3 p-2 rounded bg-white text-black"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded"
          required
        >
          <option value="">Select Role</option>
          <option value="individual">Individual</option>
          <option value="business">Business</option>
        </select>

        {formData.role === 'business' && (
          <select
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full mb-3 p-2 rounded"
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
        )}

        <button type="submit" className="w-full bg-green-600 p-2 rounded hover:bg-green-700">
          Save Changes
        </button>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-full mt-4 bg-gray-600 p-2 rounded hover:bg-gray-700"
        >
          Return to Profile
        </button>
      </form>
    </div>
  );
}
