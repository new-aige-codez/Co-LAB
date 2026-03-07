import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import {
    KanbanSquare,
    Bot,
    Brain,
    FlaskConical,
    Settings,
    ChevronRight,
    ChevronDown,
    LogOut,
    Layers,
    Check,
    Plus,
    UserCircle,
    LayoutList,
    Lightbulb,
    Trash2,
} from 'lucide-react';

// ─── Sub-items for Task Board ───
interface SubNavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
}

const TASK_SUBITEMS: SubNavItem[] = [
    { label: 'KanPlan', to: '/tasks/kanplan', icon: <KanbanSquare className="w-4 h-4" /> },
    { label: 'Upcoming', to: '/tasks/upcoming', icon: <LayoutList className="w-4 h-4" /> },
    { label: 'Proposed', to: '/tasks/proposed', icon: <Lightbulb className="w-4 h-4" /> },
    { label: 'Recycle Bin', to: '/tasks/recycled', icon: <Trash2 className="w-4 h-4" /> },
];

// ─── Top-level nav items (no more Dashboard, Workspace, or Settings) ───
interface NavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
    hasChildren?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Task Board', to: '/tasks', icon: <KanbanSquare className="w-5 h-5" />, hasChildren: true },
    { label: 'Agent Squad', to: '/agents', icon: <Bot className="w-5 h-5" /> },
    { label: 'Memory', to: '/memory', icon: <Brain className="w-5 h-5" /> },
    { label: 'Research', to: '/research', icon: <FlaskConical className="w-5 h-5" /> },
];

function ProjectStatusDot({ status }: { status: string }) {
    const color =
        status === 'active' ? 'bg-green-400' :
            status === 'paused' ? 'bg-yellow-400' :
                'bg-red-400';
    return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${color}`} />;
}

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { projects, activeProjectId, setActiveProject, fetchProjects } = useProjectStore();
    const activeProject = projects.find(p => p.id === activeProjectId);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch projects from API on mount
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Task Board sub-nav is expanded when on any /tasks route
    const isOnTaskRoute = location.pathname.startsWith('/tasks');
    const [taskGroupOpen, setTaskGroupOpen] = useState(isOnTaskRoute);

    // Keep task group synced with route
    useEffect(() => {
        if (isOnTaskRoute) setTaskGroupOpen(true);
    }, [isOnTaskRoute]);

    // Close project dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => document.removeEventListener('mousedown', handleClick);
    }, [dropdownOpen]);

    function handleSelectProject(id: string) {
        setActiveProject(id);
        setDropdownOpen(false);
        navigate(`/workspace/${id}`);
    }

    function handleAddNew() {
        setDropdownOpen(false);
        navigate('/workspace');
    }

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            {/* ─── Sidebar ─── */}
            <aside className="w-60 flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800">

                {/* ── Branding block (logo = home) ── */}
                <div className="border-b border-gray-800">
                    <Link to="/dashboard" className="flex items-center gap-3 px-5 pt-5 pb-2 group">
                        <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-400 transition-colors">
                            <Layers className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-300 tracking-widest uppercase transition-colors">
                            Co-LAB
                        </span>
                    </Link>

                    {/* ── Project switcher ── */}
                    <div ref={dropdownRef} className="relative px-3 pb-3">
                        <button
                            onClick={() => setDropdownOpen(v => !v)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 transition-all group"
                        >
                            {activeProject ? (
                                <>
                                    <ProjectStatusDot status={activeProject.status || 'active'} />
                                    <span className="flex-1 text-left text-sm font-semibold text-gray-100 truncate">
                                        {activeProject.name}
                                    </span>
                                </>
                            ) : (
                                <span className="flex-1 text-left text-sm text-gray-500 italic truncate">
                                    Select project…
                                </span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                                <div className="py-1">
                                    {projects.map(project => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleSelectProject(project.id)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left group"
                                        >
                                            <ProjectStatusDot status={project.status || 'active'} />
                                            <span className="flex-1 text-sm text-gray-100 truncate">{project.name}</span>
                                            {project.id === activeProjectId && (
                                                <Check className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-gray-700">
                                    <button
                                        onClick={handleAddNew}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
                                    >
                                        <Plus className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-400">New workspace</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(item => {
                        if (item.hasChildren) {
                            // Task Board expandable group
                            return (
                                <div key={item.to}>
                                    <button
                                        onClick={() => {
                                            setTaskGroupOpen(v => !v);
                                            if (!isOnTaskRoute) navigate('/tasks/kanplan');
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isOnTaskRoute
                                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                                            : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                                            }`}
                                    >
                                        <span className={isOnTaskRoute ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300 transition-colors'}>
                                            {item.icon}
                                        </span>
                                        <span className="flex-1 text-left">{item.label}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${taskGroupOpen ? '' : '-rotate-90'} ${isOnTaskRoute ? 'text-orange-400/60' : 'text-gray-600'
                                            }`} />
                                    </button>

                                    {/* Sub-items */}
                                    {taskGroupOpen && (
                                        <div className="mt-0.5 ml-5 pl-3 border-l border-gray-800 space-y-0.5">
                                            {TASK_SUBITEMS.map(sub => (
                                                <NavLink
                                                    key={sub.to}
                                                    to={sub.to}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
                                                            ? 'text-orange-400 bg-orange-500/10'
                                                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                                                        }`
                                                    }
                                                >
                                                    {sub.icon}
                                                    {sub.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Regular nav item
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive
                                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                                        : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={isActive ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300 transition-colors'}>
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                        {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-orange-400/60" />}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* ── Bottom bar: Settings + Profile + Sign Out ── */}
                <div className="px-3 py-3 border-t border-gray-800 flex items-center gap-1">
                    <NavLink
                        to="/settings"
                        title="Settings"
                        className={({ isActive }) =>
                            `p-2.5 rounded-lg transition-all ${isActive
                                ? 'bg-orange-500/15 text-orange-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                            }`
                        }
                    >
                        <Settings className="w-5 h-5" />
                    </NavLink>

                    <NavLink
                        to="/profile"
                        title="User Profile"
                        className={({ isActive }) =>
                            `p-2.5 rounded-lg transition-all ${isActive
                                ? 'bg-orange-500/15 text-orange-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                            }`
                        }
                    >
                        <UserCircle className="w-5 h-5" />
                    </NavLink>

                    <div className="flex-1" />

                    <button
                        onClick={() => navigate('/login')}
                        title="Sign Out"
                        className="p-2.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </aside>

            {/* ─── Main content ─── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
