import React, { useEffect, useState } from 'react';
import { useTaskStore, type Task } from '../store/taskStore';
import { KanbanBoard } from '../components/tasks/KanbanBoard';

export default function TaskBoardPage() {
  const {
    tasks,
    isLoading,
    error,
    fetchProjects,
    fetchTasks,
    createProject,
    createTask,
    selectTask,
    selectedTask,
    clear,
  } = useTaskStore();

  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
    return () => clear();
  }, []);

  // Load tasks when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      const project = await createProject({
        workspaceId: 'default', // Using default workspace
        name: newProjectName.trim(),
      });
      if (project) {
        setSelectedProjectId(project.id);
        setShowNewProject(false);
        setNewProjectName('');
      }
    }
  };

  const handleCreateTask = async () => {
    if (newTaskTitle.trim() && selectedProjectId) {
      await createTask({
        projectId: selectedProjectId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
      });
      setShowNewTask(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
    }
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      selectTask(task);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Page header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-100">Task Board</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewProject(true)}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-100 rounded transition-colors"
          >
            + Project
          </button>
          {selectedProjectId && (
            <button
              onClick={() => setShowNewTask(true)}
              className="px-4 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
            >
              + Task
            </button>
          )}
        </div>
      </header>


      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-700 px-6 py-3 text-red-200">
          {error}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-6 overflow-hidden">
        {!selectedProjectId ? (
          /* No project selected */
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <p className="text-lg mb-2">No project selected</p>
            <p className="text-sm mb-4">Select a project from the dropdown or create a new one</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
            >
              Create Project
            </button>
          </div>
        ) : isLoading ? (
          /* Loading state */
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          /* Kanban board */
          <KanbanBoard onTaskClick={handleTaskClick} />
        )}
      </main>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Create New Project</h2>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              placeholder="Project name"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewProject(false);
                  setNewProjectName('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Create New Task</h2>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 mb-3"
              autoFocus
            />
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 mb-4 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewTask(false);
                  setNewTaskTitle('');
                  setNewTaskDescription('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) selectTask(null);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {/* Import TaskDetail dynamically to avoid circular dependency */}
            <TaskDetailModal task={selectedTask} onClose={() => selectTask(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component to avoid circular import issues
function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  // Lazy import to avoid circular dependencies
  const [TaskDetailComponent, setTaskDetailComponent] = useState<React.ComponentType<{
    task: Task;
    onClose: () => void;
  }> | null>(null);

  useEffect(() => {
    import('../components/tasks/TaskDetail').then((mod) => {
      setTaskDetailComponent(() => mod.TaskDetail);
    });
  }, []);

  if (!TaskDetailComponent) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return <TaskDetailComponent task={task} onClose={onClose} />;
}
