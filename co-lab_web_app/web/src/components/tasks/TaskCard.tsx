import React from 'react';
import { useTaskStore, type Task, type TaskPriority } from '../../store/taskStore';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { setDragging, draggedTaskId } = useTaskStore();
  const isDragging = draggedTaskId === task.id;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(true, task.id);
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`
        bg-gray-800 rounded-lg p-3 cursor-pointer
        border border-gray-700 hover:border-gray-600
        transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
      `}
    >
      {/* Priority indicator */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full text-white ${priorityColors[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </span>
        {isOverdue && (
          <span className="text-red-400 text-xs">Overdue</span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-100 mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
        {/* Assignees */}
        <div className="flex -space-x-2">
          {task.assigneeIds.slice(0, 3).map((assigneeId) => (
            <div
              key={assigneeId}
              className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white ring-2 ring-gray-800"
              title={assigneeId}
            >
              {assigneeId.charAt(0).toUpperCase()}
            </div>
          ))}
          {task.assigneeIds.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white ring-2 ring-gray-800">
              +{task.assigneeIds.length - 3}
            </div>
          )}
        </div>

        {/* Due date */}
        {task.dueDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
