import { TaskColumn, statusConfig } from './TaskColumn';
import type { TaskStatus } from '../../store/taskStore';

interface KanbanBoardProps {
  onTaskClick: (taskId: string) => void;
}

// Define the column order for 6-column Kanban
const columns: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'inbox', title: 'Inbox', color: 'bg-gray-500' },
  { status: 'assigned', title: 'Assigned', color: 'bg-blue-500' },
  { status: 'in_progress', title: 'In Progress', color: 'bg-yellow-500' },
  { status: 'review', title: 'Review', color: 'bg-purple-500' },
  { status: 'quality_review', title: 'Quality', color: 'bg-orange-500' },
  { status: 'done', title: 'Done', color: 'bg-green-500' },
];

export function KanbanBoard({ onTaskClick }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {columns.map((column) => (
        <TaskColumn
          key={column.status}
          status={column.status}
          title={column.title}
          color={column.color}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}

export { statusConfig };
