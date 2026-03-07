/**
 * Unified Database Schema for Mission Control + Co-Lab Merger
 *
 * This schema combines:
 * - Mission Control's agent/task/goal management
 * - Co-Lab's feature development pipeline, research, and collaboration features
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// USERS & AUTH
// ============================================================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'operator', 'viewer'] }).notNull().default('operator'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }),
});

// ============================================================================
// PROJECTS & WORKSPACES
// ============================================================================

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  // Project type determines which agent teams are shown
  projectType: text('project_type', { enum: ['development', 'business', 'both'] }).notNull().default('both'),
  status: text('status', { enum: ['active', 'paused', 'completed', 'archived'] }).notNull().default('active'),
  color: text('color'),
  // Git repository info (from co-lab)
  repoUrl: text('repo_url'),
  repoPath: text('repo_path'),
  currentCommitHash: text('current_commit_hash'),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  // Metadata
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ============================================================================
// GOALS & MILESTONES (Mission Control) - MUST BE BEFORE TASKS
// ============================================================================

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', { enum: ['long-term', 'medium-term'] }).notNull(),
  timeframe: text('timeframe'), // "Q1 2026" or ISO date
  parentGoalId: text('parent_goal_id'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['not-started', 'in-progress', 'completed'] }).notNull().default('not-started'),
  milestones: text('milestones', { mode: 'json' }).$type<string[]>().default([]), // Child milestone IDs
  linkedTasks: text('linked_tasks', { mode: 'json' }).$type<string[]>().default([]),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// ============================================================================
// FEATURES (Feature Development Pipeline - from co-lab)
// ============================================================================

export const features = sqliteTable('features', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(), // Sequential feature number
  name: text('name').notNull(),
  description: text('description'),
  // Feature status (maps to KanPlan buckets)
  status: text('status', {
    enum: [
      'inbox',
      'awaiting_deep_research',
      'deep_research_received',
      'research',
      'developing',
      'failed',
      'testing',
      'in_review',
      'completed',
      'approved',
      'ready_for_review',
      'done',
      'paused',
      'deferred',
    ]
  }).notNull().default('inbox'),
  // Priority
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
  // Assignment
  assignedTo: text('assigned_to'), // Agent ID or user ID
  // Research context
  researchContext: text('research_context'), // JSON
  deepResearchResult: text('deep_research_result'),
  // Attempt tracking
  attemptCount: integer('attempt_count').default(0),
  maxAttempts: integer('max_attempts').default(3),
  // Terminal/session tracking
  terminalHistory: text('terminal_history'), // JSON array of terminal output
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// Feature artifacts (files created/modified)
export const featureArtifacts = sqliteTable('feature_artifacts', {
  id: text('id').primaryKey(),
  featureId: text('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  folder: text('folder'),
  absolutePath: text('absolute_path').notNull(),
  changeType: text('change_type', { enum: ['created', 'modified', 'deleted'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Feature commits
export const featureCommits = sqliteTable('feature_commits', {
  id: text('id').primaryKey(),
  featureId: text('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
  branchId: text('branch_id'),
  commitHash: text('commit_hash').notNull(),
  shortHash: text('short_hash').notNull(),
  message: text('message').notNull(),
  author: text('author').notNull(),
  phase: text('phase', { enum: ['research', 'development', 'testing'] }),
  aiServiceId: text('ai_service_id'),
  aiModelId: text('ai_model_id'),
  committedAt: integer('committed_at', { mode: 'timestamp' }).notNull(),
});

// Feature branches
export const featureBranches = sqliteTable('feature_branches', {
  id: text('id').primaryKey(),
  featureId: text('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
  branchName: text('branch_name').notNull(),
  baseBranch: text('base_branch').notNull(),
  status: text('status', { enum: ['active', 'merged', 'abandoned'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  mergedAt: integer('merged_at', { mode: 'timestamp' }),
});

// ============================================================================
// TASKS (Mission Control's task system - enhanced)
// ============================================================================

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  featureId: text('feature_id').references(() => features.id, { onDelete: 'set null' }),
  milestoneId: text('milestone_id').references(() => goals.id, { onDelete: 'set null' }),
  // Basic info
  title: text('title').notNull(),
  description: text('description'),
  // Kanban status
  kanbanStatus: text('kanban_status', {
    enum: ['inbox', 'scheduled', 'in_progress', 'review', 'done']
  }).notNull().default('inbox'),
  // Eisenhower Matrix
  importance: text('importance', { enum: ['important', 'not-important'] }).notNull().default('important'),
  urgency: text('urgency', { enum: ['urgent', 'not-urgent'] }).notNull().default('not-urgent'),
  // Priority
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
  // Assignment (Mission Control agent or user)
  assignedTo: text('assigned_to'), // Agent role (me, researcher, developer, etc.)
  assigneeIds: text('assignee_ids', { mode: 'json' }).$type<string[]>().default([]),
  collaborators: text('collaborators', { mode: 'json' }).$type<string[]>().default([]),
  // Quality review (from co-lab)
  reviewStatus: text('review_status', {
    enum: ['pending', 'approved', 'rejected', 'changes_requested']
  }),
  reviewerId: text('reviewer_id').references(() => users.id),
  reviewNotes: text('review_notes'),
  // Time tracking
  estimatedMinutes: integer('estimated_minutes'),
  actualMinutes: integer('actual_minutes'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  // Subtasks & daily actions
  subtasks: text('subtasks', { mode: 'json' }).$type<{ id: string; title: string; done: boolean }[]>(),
  dailyActions: text('daily_actions', { mode: 'json' }).$type<{ id: string; title: string; done: boolean; date: string }[]>(),
  // Dependencies
  blockedBy: text('blocked_by', { mode: 'json' }).$type<string[]>().default([]),
  // Acceptance criteria
  acceptanceCriteria: text('acceptance_criteria', { mode: 'json' }).$type<string[]>().default([]),
  // Tags and metadata
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  notes: text('notes'),
  // Metadata
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// Task comments (threaded)
export const taskComments = sqliteTable('task_comments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  parentId: text('parent_id'),
  content: text('content').notNull(),
  isEdited: integer('is_edited', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Quality reviews
export const qualityReviews = sqliteTable('quality_reviews', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  reviewerId: text('reviewer_id').notNull().references(() => users.id),
  reviewerType: text('reviewer_type', { enum: ['human', 'ai_agent', 'automated'] }).notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'changes_requested'] }).notNull().default('pending'),
  notes: text('notes'),
  checklist: text('checklist', { mode: 'json' }).$type<{ item: string; passed: boolean }[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
});

// ============================================================================
// BRAIN DUMP (Enhanced with repo context)
// ============================================================================

export const brainDump = sqliteTable('brain_dump', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  capturedAt: integer('captured_at', { mode: 'timestamp' }).notNull(),
  processed: integer('processed', { mode: 'boolean' }).default(false),
  convertedTo: text('converted_to'), // Task ID or Feature ID if converted
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  // Source type (new)
  sourceType: text('source_type', {
    enum: ['manual', 'git_repo', 'file_import', 'ai_generated']
  }).notNull().default('manual'),
  // Repo metadata (when sourceType is git_repo)
  repoUrl: text('repo_url'),
  repoLocalPath: text('repo_local_path'),
  repoBranch: text('repo_branch'),
  repoCommitHash: text('repo_commit_hash'),
  repoContextFiles: text('repo_context_files', { mode: 'json' }).$type<string[]>(),
  // Project linkage
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
});

// ============================================================================
// RESEARCH MODULE (from co-lab)
// ============================================================================

// Custom research sources
export const customSources = sqliteTable('custom_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  type: text('type', { enum: ['rss', 'web', 'api'] }).notNull().default('web'),
  reputationScore: integer('reputation_score').default(5),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Source reputation database
export const sourceReputation = sqliteTable('source_reputation', {
  domain: text('domain').primaryKey(),
  reputationScore: integer('reputation_score').notNull(),
  category: text('category'),
  notes: text('notes'),
});

// Saved research reports
export const researchReports = sqliteTable('research_reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  featureId: text('feature_id').references(() => features.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  query: text('query'),
  sources: text('sources', { mode: 'json' }).$type<string[]>(), // Source types used
  dateRange: text('date_range'),
  results: text('results').notNull(), // JSON array of ResearchResult
  totalResults: integer('total_results').default(0),
  executionTimeMs: integer('execution_time_ms').default(0),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  notes: text('notes'),
  isStarred: integer('is_starred', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ============================================================================
// COLLABORATION (Real-time features)
// ============================================================================

// Work sessions (who's working on what)
export const workSessions = sqliteTable('work_sessions', {
  id: text('id').primaryKey(),
  featureId: text('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
  workerType: text('worker_type', { enum: ['user', 'ai_agent'] }).notNull(),
  workerId: text('worker_id').notNull(),
  workerName: text('worker_name').notNull(),
  aiServiceId: text('ai_service_id'),
  aiModelId: text('ai_model_id'),
  status: text('status', { enum: ['active', 'paused', 'completed'] }).notNull().default('active'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  gitCommitHash: text('git_commit_hash'),
  summary: text('summary'),
});

// Presence tracking
export const presence = sqliteTable('presence', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  connectionId: text('connection_id').notNull(),
  status: text('status', { enum: ['online', 'away', 'busy', 'offline'] }).notNull().default('online'),
  currentActivity: text('current_activity'),
  lastHeartbeat: integer('last_heartbeat', { mode: 'timestamp' }).notNull(),
});

// Resource locks (prevent concurrent edits)
export const resourceLocks = sqliteTable('resource_locks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  resourceType: text('resource_type', { enum: ['feature', 'task', 'file', 'brain_dump'] }).notNull(),
  resourceId: text('resource_id').notNull(),
  lockedBy: text('locked_by').notNull().references(() => users.id),
  lockedAt: integer('locked_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata'), // JSON
});

// Activity log
export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  details: text('details'), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Notifications
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['mention', 'assignment', 'status_change', 'due_date', 'review_request', 'review_complete', 'system']
  }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  entityType: text('entity_type', { enum: ['task', 'feature', 'project', 'agent', 'review', 'comment'] }),
  entityId: text('entity_id'),
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  readAt: integer('read_at', { mode: 'timestamp' }),
});

// ============================================================================
// SESSIONS (Auth sessions)
// ============================================================================

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

// ============================================================================
// AI SERVICES (LLM provider configuration - from co-lab)
// ============================================================================

export const aiServices = sqliteTable('ai_services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
  endpoint: text('endpoint'),
  isConfigured: integer('is_configured', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const aiModels = sqliteTable('ai_models', {
  id: text('id').primaryKey(),
  serviceId: text('service_id').notNull().references(() => aiServices.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  displayName: text('display_name'),
  sortOrder: integer('sort_order').default(0),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
  comments: many(taskComments),
  reviews: many(qualityReviews),
  notifications: many(notifications),
  researchReports: many(researchReports),
  presence: many(presence),
  workSessions: many(workSessions),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  features: many(features),
  tasks: many(tasks),
  goals: many(goals),
  brainDump: many(brainDump),
  presence: many(presence),
  activityLog: many(activityLog),
  locks: many(resourceLocks),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  project: one(projects, {
    fields: [goals.projectId],
    references: [projects.id],
  }),
  parentGoal: one(goals, {
    fields: [goals.parentGoalId],
    references: [goals.id],
  }),
  childMilestones: many(goals),
  tasks: many(tasks),
}));

export const featuresRelations = relations(features, ({ one, many }) => ({
  project: one(projects, {
    fields: [features.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
  artifacts: many(featureArtifacts),
  commits: many(featureCommits),
  branches: many(featureBranches),
  workSessions: many(workSessions),
  researchReports: many(researchReports),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  feature: one(features, {
    fields: [tasks.featureId],
    references: [features.id],
  }),
  milestone: one(goals, {
    fields: [tasks.milestoneId],
    references: [goals.id],
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [tasks.reviewerId],
    references: [users.id],
  }),
  comments: many(taskComments),
  reviews: many(qualityReviews),
}));

export const taskCommentsRelations = relations(taskComments, ({ one, many }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
  replies: many(taskComments, { relationName: 'replies' }),
  parent: one(taskComments, {
    fields: [taskComments.parentId],
    references: [taskComments.id],
    relationName: 'replies',
  }),
}));

export const qualityReviewsRelations = relations(qualityReviews, ({ one }) => ({
  task: one(tasks, {
    fields: [qualityReviews.taskId],
    references: [tasks.id],
  }),
  reviewer: one(users, {
    fields: [qualityReviews.reviewerId],
    references: [users.id],
  }),
}));

export const brainDumpRelations = relations(brainDump, ({ one }) => ({
  project: one(projects, {
    fields: [brainDump.projectId],
    references: [projects.id],
  }),
}));

export const researchReportsRelations = relations(researchReports, ({ one }) => ({
  user: one(users, {
    fields: [researchReports.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [researchReports.projectId],
    references: [projects.id],
  }),
  feature: one(features, {
    fields: [researchReports.featureId],
    references: [features.id],
  }),
}));

export const workSessionsRelations = relations(workSessions, ({ one }) => ({
  feature: one(features, {
    fields: [workSessions.featureId],
    references: [features.id],
  }),
}));

export const presenceRelations = relations(presence, ({ one }) => ({
  user: one(users, {
    fields: [presence.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [presence.projectId],
    references: [projects.id],
  }),
}));

export const resourceLocksRelations = relations(resourceLocks, ({ one }) => ({
  project: one(projects, {
    fields: [resourceLocks.projectId],
    references: [projects.id],
  }),
  lockedByUser: one(users, {
    fields: [resourceLocks.lockedBy],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  project: one(projects, {
    fields: [activityLog.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const aiServicesRelations = relations(aiServices, ({ many }) => ({
  models: many(aiModels),
}));

export const aiModelsRelations = relations(aiModels, ({ one }) => ({
  service: one(aiServices, {
    fields: [aiModels.serviceId],
    references: [aiServices.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectType = Project['projectType'];

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;
export type FeatureStatus = Feature['status'];

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type KanbanStatus = Task['kanbanStatus'];
export type EisenhowerImportance = Task['importance'];
export type EisenhowerUrgency = Task['urgency'];

export type BrainDumpEntry = typeof brainDump.$inferSelect;
export type NewBrainDumpEntry = typeof brainDump.$inferInsert;
export type BrainDumpSourceType = BrainDumpEntry['sourceType'];

export type ResearchReport = typeof researchReports.$inferSelect;
export type NewResearchReport = typeof researchReports.$inferInsert;

export type WorkSession = typeof workSessions.$inferSelect;
export type NewWorkSession = typeof workSessions.$inferInsert;

export type Presence = typeof presence.$inferSelect;
export type NewPresence = typeof presence.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type AIService = typeof aiServices.$inferSelect;
export type AIModel = typeof aiModels.$inferSelect;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
