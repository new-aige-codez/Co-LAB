import { useEffect, useState } from 'react';
import { useTaskStore, type Task, type TaskPriority, type TaskStatus } from '../../store/taskStore';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'quality_review', label: 'Quality Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  const {
    updateTask,
    deleteTask,
    fetchComments,
    addComment,
    comments,
    fetchReviews,
    submitReview,
    reviews,
    isLoading,
  } = useTaskStore();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'reviews'>('details');

  useEffect(() => {
    fetchComments(task.id);
    fetchReviews(task.id);
  }, [task.id]);

  const handleSave = async () => {
    await updateTask(task.id, {
      title,
      description: description || null,
      status,
      priority,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
      onClose();
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleSubmitForReview = async () => {
    await submitReview(task.id, { reviewerType: 'human' });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 w-full"
              />
            ) : (
              task.title
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(['details', 'comments', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
              {tab === 'comments' && comments.length > 0 && (
                <span className="ml-1 text-xs">({comments.length})</span>
              )}
              {tab === 'reviews' && reviews.length > 0 && (
                <span className="ml-1 text-xs">({reviews.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  {isEditing ? (
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 w-full"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-100 capitalize">{task.status.replace('_', ' ')}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                  {isEditing ? (
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 w-full"
                    >
                      {priorityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-100 capitalize">{task.priority}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 w-full resize-none"
                    placeholder="Add a description..."
                  />
                ) : (
                  <p className="text-gray-100 whitespace-pre-wrap">
                    {task.description || 'No description'}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {task.tags.length > 0 ? (
                    task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-sm bg-gray-700 text-gray-300 rounded"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No tags</span>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Created:</span>{' '}
                  <span className="text-gray-100">{formatDate(task.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Updated:</span>{' '}
                  <span className="text-gray-100">{formatDate(task.updatedAt)}</span>
                </div>
                {task.completedAt && (
                  <div>
                    <span className="text-gray-400">Completed:</span>{' '}
                    <span className="text-gray-100">{formatDate(task.completedAt)}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div>
                    <span className="text-gray-400">Due:</span>{' '}
                    <span className="text-gray-100">{formatDate(task.dueDate)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {task.status === 'review' && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={isLoading}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  Submit for Quality Review
                </button>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comment list */}
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-700 rounded p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{comment.userId}</span>
                      <span className="text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-100 mt-1">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>

              {/* Add comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-700 rounded p-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        review.status === 'approved'
                          ? 'bg-green-600'
                          : review.status === 'rejected'
                          ? 'bg-red-600'
                          : review.status === 'changes_requested'
                          ? 'bg-orange-600'
                          : 'bg-yellow-600'
                      } text-white`}
                    >
                      {review.status}
                    </span>
                    <span className="text-sm text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.notes && <p className="text-gray-100 mt-2">{review.notes}</p>}
                  {review.checklist && review.checklist.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {review.checklist.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <span className={item.passed ? 'text-green-400' : 'text-red-400'}>
                            {item.passed ? '✓' : '✗'}
                          </span>
                          <span className="text-gray-300">{item.item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-gray-500 text-center py-4">No reviews yet</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
