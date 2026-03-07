import {
  Settings,
  Cpu,
  Globe,
  FolderGit2,
  LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

type SettingsSection = 'subagent-models' | 'research-sources' | 'general';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sections: { id: SettingsSection; icon: typeof Settings; label: string }[] = [
    { id: 'subagent-models', icon: Cpu, label: 'Subagent Models' },
    { id: 'research-sources', icon: Globe, label: 'Research Sources' },
    { id: 'general', icon: Settings, label: 'General' },
  ];

  return (
    <div className="w-14 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4">
      {/* Settings sections */}
      {sections.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onSectionChange(id)}
          className={`p-3 rounded-lg transition mb-2 ${
            activeSection === id
              ? 'bg-primary-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title={label}
        >
          <Icon className="h-6 w-6" />
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Dashboard link */}
      <Link
        to="/dashboard"
        className="p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition mb-2"
        title="Workspaces"
      >
        <FolderGit2 className="h-6 w-6" />
      </Link>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
        title="Sign out"
      >
        <LogOut className="h-6 w-6" />
      </button>
    </div>
  );
}
