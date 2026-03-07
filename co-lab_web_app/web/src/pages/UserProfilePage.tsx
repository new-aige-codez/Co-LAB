import { useState } from 'react';
import {
    User,
    Palette,
    Bell,
    Cpu,
    Key,
    Clock,
    Camera,
    Shield,
    Moon,
    Sun,
    Save,
} from 'lucide-react';

interface ProfileSection {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const SECTIONS: ProfileSection[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'llm', label: 'Default LLM', icon: <Cpu className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Keys', icon: <Shield className="w-4 h-4" /> },
    { id: 'session', label: 'Session Info', icon: <Clock className="w-4 h-4" /> },
];

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-10 h-5.5 rounded-full transition-colors ${enabled ? 'bg-orange-500' : 'bg-gray-600'}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-[18px]' : ''}`}
                style={{ width: 18, height: 18 }}
            />
        </button>
    );
}

export default function UserProfilePage() {
    const [activeSection, setActiveSection] = useState('profile');
    const [displayName, setDisplayName] = useState('Developer');
    const [email, setEmail] = useState('dev@example.com');
    const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
    const [notifications, setNotifications] = useState({
        taskUpdates: true,
        agentAlerts: true,
        researchComplete: true,
        emailDigest: false,
        sounds: true,
    });
    const [defaultLlm, setDefaultLlm] = useState('claude-sonnet');

    return (
        <div className="flex-1 flex bg-gray-950 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-56 bg-gray-900 border-r border-gray-800 overflow-y-auto">
                <div className="px-4 py-5">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">User Settings</h2>
                    <nav className="space-y-0.5">
                        {SECTIONS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeSection === s.id
                                    ? 'bg-orange-500/15 text-orange-400'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                    }`}
                            >
                                {s.icon}
                                {s.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-3">
                    <h1 className="text-base font-semibold text-gray-100">User Profile</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage your account and preferences</p>
                </header>

                <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

                    {/* ─── Profile ─── */}
                    {activeSection === 'profile' && (
                        <div className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                        <Camera className="w-3.5 h-3.5" />
                                        Change Avatar
                                    </button>
                                    <p className="text-xs text-gray-600 mt-1.5">JPG, PNG, or GIF. Max 2MB.</p>
                                </div>
                            </div>

                            {/* Fields */}
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-xs text-gray-400 mb-1.5 block">Display Name</span>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-lg px-4 py-2.5 text-sm text-gray-100 outline-none transition-colors"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs text-gray-400 mb-1.5 block">Email</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-lg px-4 py-2.5 text-sm text-gray-100 outline-none transition-colors"
                                    />
                                </label>
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-lg transition-colors">
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    )}

                    {/* ─── Appearance ─── */}
                    {activeSection === 'appearance' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-100">Theme</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {(['dark', 'light', 'system'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${theme === t
                                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                                            }`}
                                    >
                                        {t === 'dark' ? <Moon className="w-5 h-5" /> : t === 'light' ? <Sun className="w-5 h-5" /> : <Palette className="w-5 h-5" />}
                                        <span className="text-sm capitalize">{t}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── Notifications ─── */}
                    {activeSection === 'notifications' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-100">Notification Preferences</h3>
                            {Object.entries(notifications).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-800">
                                    <div>
                                        <span className="text-sm text-gray-200 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {key === 'taskUpdates' && 'Get notified when tasks change status'}
                                            {key === 'agentAlerts' && 'Alerts when agents encounter errors'}
                                            {key === 'researchComplete' && 'Notify when research queries finish'}
                                            {key === 'emailDigest' && 'Receive a daily email summary'}
                                            {key === 'sounds' && 'Play notification sounds'}
                                        </p>
                                    </div>
                                    <ToggleSwitch enabled={val} onChange={v => setNotifications(n => ({ ...n, [key]: v }))} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ─── Default LLM ─── */}
                    {activeSection === 'llm' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-100">Default Model Provider</h3>
                            <p className="text-xs text-gray-500">This model will be used as the default for new agents and tasks.</p>
                            <select
                                value={defaultLlm}
                                onChange={e => setDefaultLlm(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-lg px-4 py-2.5 text-sm text-gray-100 outline-none transition-colors"
                            >
                                <option value="claude-sonnet">Claude 3.5 Sonnet</option>
                                <option value="claude-opus">Claude 3 Opus</option>
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gemini-pro">Gemini Pro</option>
                                <option value="ollama-local">Ollama (Local)</option>
                            </select>
                        </div>
                    )}

                    {/* ─── Security & Keys ─── */}
                    {activeSection === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-100 mb-2">API Keys</h3>
                                <p className="text-xs text-gray-500 mb-4">Manage API keys for Claude and other LLM providers.</p>
                                <div className="space-y-3">
                                    {[
                                        { provider: 'Anthropic (Claude)', status: 'configured' },
                                        { provider: 'OpenAI', status: 'not configured' },
                                        { provider: 'Google (Gemini)', status: 'not configured' },
                                    ].map(key => (
                                        <div key={key.provider} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <Key className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-200">{key.provider}</span>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${key.status === 'configured'
                                                ? 'text-green-400 bg-green-900/30'
                                                : 'text-gray-500 bg-gray-800'
                                                }`}>
                                                {key.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-100 mb-2">Change Password</h3>
                                <button className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                    Update Password
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── Session Info ─── */}
                    {activeSection === 'session' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-100">Session Information</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Last Login', value: new Date().toLocaleString() },
                                    { label: 'Account Created', value: 'March 2025' },
                                    { label: 'Active Sessions', value: '1' },
                                    { label: 'Browser', value: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Unknown' },
                                    { label: 'Platform', value: navigator.platform },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-800">
                                        <span className="text-sm text-gray-400">{item.label}</span>
                                        <span className="text-sm text-gray-200">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
