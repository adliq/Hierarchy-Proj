// src/pages/Home.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // Contact Us (moved from Landing)
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // If you later hook this to backend, call axios.post here.
    console.log("Message sent:", contact);
    setStatus("Thanks! We’ll get back to you soon.");
    setContact({ name: "", email: "", message: "" });
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <div className="card" style={{ padding: 24, textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ marginBottom: 8 }}>Welcome to Hierarchy</h1>
          <p className="form-hint" style={{ marginBottom: 16 }}>
            Your platform for sharing and discovering ideas.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link to="/DesignIdea" className="btn btn-primary">Design an Idea</Link>
            <Link to="/submit" className="btn btn-primary">Submit an Idea</Link>
            <Link to="/ideas" className="btn btn-primary">Idea Hub</Link>
            <Link to="/profile" className="btn btn-primary">Go to Profile</Link>
            <Link to="/settings" className="btn btn-primary">Settings</Link>
            <Link to={userId ? `/chat/${userId}` : "/chat"} className="btn btn-primary">Go to Chat</Link>
            <button onClick={handleSignOut} className="btn">Sign Out</button>
          </div>
        </div>

        {/* Contact Us section */}
        <section className="contact-section">
          <div className="contact-card">
            <h2 className="contact-title">📨 Contact Us</h2>
            <p className="contact-text">Questions or feedback? Send us a note.</p>

            <form className="form" onSubmit={handleContactSubmit}>
              <div className="form-group">
                <label className="form-label">Your name</label>
                <input
                  className="form-input"
                  name="name"
                  value={contact.name}
                  onChange={handleContactChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your email</label>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  value={contact.email}
                  onChange={handleContactChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="textarea"
                  name="message"
                  rows={4}
                  value={contact.message}
                  onChange={handleContactChange}
                  required
                />
              </div>

              <button type="submit" className="btn-signin">Send Message</button>
              {status && <p className="form-hint" style={{ marginTop: 10 }}>{status}</p>}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
