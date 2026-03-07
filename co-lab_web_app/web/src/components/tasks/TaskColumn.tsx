import React, { ReactNode } from 'react';
import { useTaskStore, type TaskStatus } from '../../store/taskStore';
import { TaskCard } from './TaskCard';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  icon?: ReactNode;
  color: string;
  onTaskClick: (taskId: string) => void;
}

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  inbox: { label: 'Inbox', color: 'bg-gray-500' },
  assigned: { label: 'Assigned', color: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500' },
  review: { label: 'Review', color: 'bg-purple-500' },
  quality_review: { label: 'Quality Review', color: 'bg-orange-500' },
  done: { label: 'Done', color: 'bg-green-500' },
};

export function TaskColumn({ status, title, color, onTaskClick }: TaskColumnProps) {
  const { tasks, setDragging, updateTaskStatus, isDragging } = useTaskStore();
  const columnTasks = tasks.filter((t) => t.status === status);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setDragging(false);

    // Find the task and check if it can move to this status
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== status) {
      await updateTaskStatus(taskId, status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the column entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      // Left the column
    }
  };

  return (
    <div
      className={`
        flex-1 min-w-[280px] max-w-[350px] bg-gray-850 rounded-lg
        flex flex-col h-full
        ${isDragging ? 'ring-2 ring-primary-500/30' : ''}
      `}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-700">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h3 className="font-medium text-gray-100">{title}</h3>
        <span className="ml-auto text-sm text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
          {columnTasks.length}
        </span>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
        {columnTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task.id)}
          />
        ))}

        {/* Empty state */}
        {columnTasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

export { statusConfig };
