import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, type Project } from '../store/projectStore';
import {
    Briefcase,
    Plus,
    FolderOpen,
    ArrowRight,
    X,
    Activity,
    Clock,
    AlertCircle,
    Upload,
    FilePlus,
} from 'lucide-react';

type AddMode = null | 'choose' | 'scratch' | 'existing';

function StatusBadge({ status }: { status: Project['status'] }) {
    const cfg = {
        active: { label: 'Active', cls: 'bg-green-900/40 text-green-400', Icon: Activity },
        paused: { label: 'Paused', cls: 'bg-yellow-900/40 text-yellow-400', Icon: Clock },
        blocked: { label: 'Blocked', cls: 'bg-red-900/40 text-red-400', Icon: AlertCircle },
    };
    const { label, cls, Icon } = cfg[status] || cfg.active;
    return (
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${cls}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

export default function WorkspaceListPage() {
    const navigate = useNavigate();
    const { projects, addProject, setActiveProject } = useProjectStore();

    const [addMode, setAddMode] = useState<AddMode>(null);
    const [scratchName, setScratchName] = useState('');
    const [scratchDesc, setScratchDesc] = useState('');
    const [existingPath, setExistingPath] = useState('');
    const [existingName, setExistingName] = useState('');
    const [existingDesc, setExistingDesc] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    function resetModal() {
        setAddMode(null);
        setScratchName('');
        setScratchDesc('');
        setExistingPath('');
        setExistingName('');
        setExistingDesc('');
    }

    function handleCreateScratch() {
        if (!scratchName.trim()) return;
        const id = scratchName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        addProject({
            id,
            name: scratchName.trim(),
            description: scratchDesc.trim() || 'New project',
            status: 'active',
            lastOpened: new Date().toISOString(),
        });
        setActiveProject(id);
        resetModal();
        navigate(`/workspace/${id}`);
    }

    function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const folderName = (files[0] as any).webkitRelativePath?.split('/')[0] || 'Imported Project';
        setExistingPath(folderName);
        setExistingName(folderName);
        setAddMode('existing');
    }

    function handleCreateExisting() {
        if (!existingName.trim()) return;
        const id = existingName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        addProject({
            id,
            name: existingName.trim(),
            description: existingDesc.trim() || `Imported from ${existingPath}`,
            status: 'active',
            lastOpened: new Date().toISOString(),
            repoPath: existingPath,
        });
        setActiveProject(id);
        resetModal();
        navigate(`/workspace/${id}`);
    }

    function handleOpenWorkspace(project: Project) {
        setActiveProject(project.id);
        navigate(`/workspace/${project.id}`);
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
                <h1 className="text-base font-semibold text-gray-100">Workspaces</h1>
                <button
                    onClick={() => setAddMode('choose')}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add New
                </button>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
                {/* Project cards */}
                {projects.map((project) => (
                    <div
                        key={project.id}
                        className="group flex items-center justify-between p-5 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-600 transition-all"
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/10 transition-colors">
                                <Briefcase className="w-5 h-5 text-gray-500 group-hover:text-orange-400 transition-colors" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-semibold text-gray-100 text-sm group-hover:text-orange-300 transition-colors truncate">
                                    {project.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 truncate">{project.description}</div>
                                {project.lastOpened && (
                                    <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Last opened {new Date(project.lastOpened).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            <StatusBadge status={project.status} />
                            <button
                                onClick={() => handleOpenWorkspace(project)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-orange-600 text-gray-300 hover:text-white rounded-lg transition-all"
                            >
                                Open
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add New card */}
                <button
                    onClick={() => setAddMode('choose')}
                    className="w-full flex items-center justify-center gap-3 p-5 rounded-xl border border-dashed border-gray-700 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group"
                >
                    <Plus className="w-5 h-5 text-gray-600 group-hover:text-orange-400 transition-colors" />
                    <span className="text-sm text-gray-500 group-hover:text-orange-400 transition-colors font-medium">
                        Add New Workspace
                    </span>
                </button>
            </div>

            {/* ─── Modal ─── */}
            {addMode && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-800">
                            <h2 className="text-base font-semibold text-gray-100">
                                {addMode === 'choose'
                                    ? 'Add New Workspace'
                                    : addMode === 'scratch'
                                        ? 'Start From Scratch'
                                        : 'Upload Existing Project'}
                            </h2>
                            <button onClick={resetModal} className="text-gray-500 hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ── Choose mode ── */}
                        {addMode === 'choose' && (
                            <div className="p-6 space-y-3">
                                <p className="text-sm text-gray-400 mb-4">How would you like to start?</p>
                                <button
                                    onClick={() => setAddMode('scratch')}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all group text-left"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-700 group-hover:bg-orange-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                                        <FilePlus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-100 text-sm">From Scratch</div>
                                        <div className="text-xs text-gray-500 mt-0.5">Create a new empty workspace</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all group text-left"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-700 group-hover:bg-orange-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-100 text-sm">Upload Existing</div>
                                        <div className="text-xs text-gray-500 mt-0.5">Choose a folder from your computer</div>
                                    </div>
                                </button>
                                {/* Hidden folder input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    // @ts-ignore
                                    webkitdirectory=""
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChosen}
                                />
                            </div>
                        )}

                        {/* ── From Scratch form ── */}
                        {addMode === 'scratch' && (
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Project Name *</label>
                                    <input
                                        type="text"
                                        value={scratchName}
                                        onChange={(e) => setScratchName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateScratch()}
                                        placeholder="My Awesome Project"
                                        className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-3 py-2 text-gray-100 text-sm outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        value={scratchDesc}
                                        onChange={(e) => setScratchDesc(e.target.value)}
                                        placeholder="What is this project about?"
                                        className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-3 py-2 text-gray-100 text-sm outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => setAddMode('choose')}
                                        className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleCreateScratch}
                                        disabled={!scratchName.trim()}
                                        className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                                    >
                                        Create Workspace
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Upload Existing form ── */}
                        {addMode === 'existing' && (
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-700/30 rounded-lg">
                                    <FolderOpen className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    <span className="text-xs text-green-300 truncate">{existingPath}</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Project Name *</label>
                                    <input
                                        type="text"
                                        value={existingName}
                                        onChange={(e) => setExistingName(e.target.value)}
                                        placeholder="Project name"
                                        className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-3 py-2 text-gray-100 text-sm outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        value={existingDesc}
                                        onChange={(e) => setExistingDesc(e.target.value)}
                                        placeholder="What is this project?"
                                        className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500 rounded-lg px-3 py-2 text-gray-100 text-sm outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => setAddMode('choose')}
                                        className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleCreateExisting}
                                        disabled={!existingName.trim()}
                                        className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                                    >
                                        Import Workspace
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
