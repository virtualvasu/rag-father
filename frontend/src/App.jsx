import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import ChatInterface from './pages/ChatInterface';
import AdminInterface from './pages/AdminInterface';
import EvaluationInterface from './pages/EvaluationInterface';

function App() {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage toggleTheme={toggleTheme} isDark={isDark} />} />
        <Route path="/chat" element={<ChatInterface toggleTheme={toggleTheme} isDark={isDark} />} />
        <Route path="/admin" element={<AdminInterface toggleTheme={toggleTheme} isDark={isDark} />} />
        <Route path="/evaluate" element={<EvaluationInterface toggleTheme={toggleTheme} isDark={isDark} />} />
      </Routes>
    </Router>
  );
}

export default App;
