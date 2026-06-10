import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import ChatInterface from './pages/ChatInterface';
import AdminInterface from './pages/AdminInterface';
import EvaluationInterface from './pages/EvaluationInterface';
function App() {
  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatInterface />} />
        <Route path="/admin" element={<AdminInterface />} />
        <Route path="/evaluate" element={<EvaluationInterface />} />
      </Routes>
    </Router>
  );
}

export default App;
