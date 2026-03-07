import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useProjectStore } from '../store/projectStore';
import {
  KanbanSquare,
  Bot,
  Brain,
  FlaskConical,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react';

const QUICK_LINKS = [
  {
    label: 'Task Board',
    description: 'Kanban workflow — Inbox → Done',
    to: '/tasks',
    icon: <KanbanSquare className="w-6 h-6" />,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
  {
    label: 'Agent Squad',
    description: 'Monitor connected AI agents',
    to: '/agents',
    icon: <Bot className="w-6 h-6" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    label: 'Memory Browser',
    description: 'Search and explore agent memory',
    to: '/memory',
    icon: <Brain className="w-6 h-6" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    label: 'Research Hub',
    description: 'Web, Reddit, YouTube research',
    to: '/research',
    icon: <FlaskConical className="w-6 h-6" />,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'active') return <Activity className="w-3.5 h-3.5 text-green-400" />;
  if (status === 'paused') return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
  return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: 'bg-green-900/40 text-green-400',
    paused: 'bg-yellow-900/40 text-yellow-400',
    blocked: 'bg-red-900/40 text-red-400',
  };
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${styles[status as keyof typeof styles] || styles.paused}`}>
      <StatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function DashboardPage() {
  const { projects, activeProjectId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto bg-gray-950">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-3">
          <h1 className="text-base font-semibold text-gray-100">Co-LAB</h1>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

          {/* Active Project Summary */}
          {activeProject && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Active Project
              </h2>
              <Link
                to={`/workspace/${activeProject.id}`}
                className="flex items-center justify-between p-5 rounded-xl bg-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-100 text-base group-hover:text-orange-300 transition-colors">
                      {activeProject.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{activeProject.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={activeProject.status} />
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors" />
                </div>
              </Link>
            </section>
          )}

          {/* Quick links */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Features
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${item.bg} hover:brightness-110 transition-all group`}
                >
                  <div className={`flex-shrink-0 ${item.color}`}>{item.icon}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-100 text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 ml-auto flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </section>

          {/* Workspaces shortcut */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Workspaces
              </h2>
              <Link to="/workspace" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                Manage →
              </Link>
            </div>
            <div className="grid gap-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/workspace/${p.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 transition-all group"
                >
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${p.id === activeProjectId ? 'text-orange-400' : 'text-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-100 group-hover:text-orange-400 transition-colors">{p.name}</div>
                    <div className="text-xs text-gray-500 truncate">{p.description}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
