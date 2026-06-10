import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Trash2, Globe, Database } from 'lucide-react';
import { getAllSessions, deleteSession } from '../utils/chatDb';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  const currentSessionId = new URLSearchParams(location.search).get('session');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getAllSessions();
        setSessions(data);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    };
    
    fetchSessions();

    const handleUpdate = () => {
      fetchSessions();
    };

    window.addEventListener('chat-sessions-updated', handleUpdate);
    return () => window.removeEventListener('chat-sessions-updated', handleUpdate);
  }, []);

  const handleDeleteSession = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteSession(id);
      if (currentSessionId === id) {
        navigate('/chat');
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  return (
    <nav className="h-screen w-64 fixed left-0 top-0 bg-surface-dark border-r border-border flex flex-col py-6 z-50 transition-colors duration-300">
      {/* Header */}
      <div className="px-6 mb-8">
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all border border-primary/20">
            <Globe className="text-primary group-hover:text-white w-5 h-5 transition-colors" />
          </div>
          <div>
            <h1 className="font-display text-xl text-text-primary uppercase font-bold tracking-tight">Ragfather</h1>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Control Room</p>
          </div>
        </Link>
      </div>

      {/* New Conversation Button */}
      <div className="px-6 mb-6">
        <Link 
          to="/chat"
          className="w-full bg-primary hover:bg-primary-light text-white rounded-xl font-sans text-sm font-semibold flex items-center justify-center gap-2 py-3 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Link>
      </div>

      {/* Navigation / Sessions */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar">
        <h2 className="px-2 font-mono text-[10px] text-text-muted uppercase tracking-widest mb-3">Recent Chats</h2>
        <ul className="space-y-1">
          {sessions.length === 0 ? (
            <div className="px-2 text-xs text-text-muted font-sans italic">No recent chats</div>
          ) : (
            sessions.map((session) => {
              const isActive = currentSessionId === session.id;

              return (
                <li key={session.id}>
                  <Link
                    to={`/chat?session=${session.id}`}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                    <span className="truncate flex-1" title={session.title}>{session.title || "New Chat"}</span>
                    <button 
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className={`flex-shrink-0 text-text-muted hover:text-error transition-colors ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* System Status Footer */}
      <div className="px-6 mt-4 pt-4 border-t border-border">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="font-mono text-xs uppercase text-text-primary">System Online</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Database className="w-3 h-3" />
            <span className="font-mono text-[10px] uppercase">Vectors Loaded</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
