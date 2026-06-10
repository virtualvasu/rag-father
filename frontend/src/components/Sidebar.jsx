import { Link, useLocation } from 'react-router-dom';
import { Plus, MessageSquare, Settings2, BarChart3, Database, Globe } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Chat Interface', path: '/chat', icon: MessageSquare },
    { name: 'Pipeline Admin', path: '/admin', icon: Settings2 },
    { name: 'Evaluation', path: '/evaluate', icon: BarChart3 }
  ];

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
      <div className="px-6 mb-8">
        <button 
          onClick={() => {
            if (location.pathname === '/chat') {
              window.location.reload();
            } else {
              window.location.href = '/chat';
            }
          }}
          className="w-full bg-primary hover:bg-primary-light text-white rounded-xl font-sans text-sm font-semibold flex items-center justify-center gap-2 py-3 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
        >
          <Plus className="w-4 h-4" />
          New Inquiry
        </button>
      </div>

      {/* Navigation */}
      <div className="px-4 flex-1">
        <h2 className="px-2 font-mono text-[10px] text-text-muted uppercase tracking-widest mb-3">Modules</h2>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path.split('?')[0] && 
                             (item.path.includes('tab=') ? location.search.includes(item.path.split('?')[1]) : true);
            
            // Special handling for the chat route to make it active when on /chat
            const isChatRoute = item.path === '/chat' && location.pathname === '/chat';
            
            const currentlyActive = isActive || isChatRoute;

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-all ${
                    currentlyActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${currentlyActive ? 'text-primary' : 'text-text-muted'}`} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* System Status Footer */}
      <div className="px-6 mt-auto">
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
