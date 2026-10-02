import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from "react";
import Home from './pages/Home';
import IdeaHub from './pages/IdeaHub';
import SubmitIdea from './pages/SubmitIdea';
import Profile from './pages/Profile';
import DesignIdeaPage from './pages/DesignIdea';
import CostCalculator from './pages/CostCalculator';
import MyDrafts from './pages/MyDrafts';
import SearchResults from './pages/SearchResults'; 
import Layout from './components/layout'; 
import SignupPage from "./pages/SignupPage";
import VerifyPage from "./pages/VerifyPage";
import LandingPage from "./pages/LandingPage"; 
import EditProfile from "./pages/EditProfile"; 
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChatPage from "./pages/ChatPage"; 
import SettingsPage from "./pages/SettingsPage";
import ViewNdas from './pages/ViewNdas';
import TermsPage from "./pages/TermsPage";
import DisplaySettings from "./pages/DisplaySettings"; 
import IdeaDetails from "./pages/IdeaDetails";


function App() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);


  return (
    <Router>
      <Routes>
        {/* Routes without layout */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify" element={<VerifyPage />} /> 

        {/* Routes with layout (navbar + search) */}
        <Route element={<Layout title="Hierarchy" />}>
          <Route path="/home" element={<Home />} />
          <Route path="/ideas" element={<IdeaHub />} />
          <Route path="/submit" element={<SubmitIdea />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />       
          <Route path="/Designidea" element={<DesignIdeaPage />} />
          <Route path="/costcalculator" element={<CostCalculator />} />
          <Route path="/my-drafts" element={<MyDrafts />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/chat/:userId" element={<ChatPage />} />
          <Route path="/chat" element={<p style={{ padding: "2rem" }}>Invalid chat link. No user selected.</p>} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/ndas" element={<ViewNdas />} />
          <Route path="/settings/terms" element={<TermsPage />} />
          <Route path="/settings/display" element={<DisplaySettings />} /> 
          <Route path="/idea/:id" element={<IdeaDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App
