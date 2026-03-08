/**
 * Unified Agent Store
 *
 * Manages both Business Team (Mission Control) and Development Team (Co-Lab) agents.
 * Shows relevant agents based on project type selection.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type AgentTeam = 'business' | 'development';

export interface BaseAgent {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'active' | 'idle' | 'disabled';
  team: AgentTeam;
}

export interface BusinessAgent extends BaseAgent {
  team: 'business';
  role: 'me' | 'researcher' | 'developer' | 'marketer' | 'business-analyst' | 'tester';
  capabilities: string[];
}

export interface DevelopmentAgent extends BaseAgent {
  team: 'development';
  role: 'codebase-research' | 'web-research' | 'coding-dev' | 'planning' | 'debugging' | 'testing';
  capabilities: string[];
  assignedModelId: string | null;
}

export type Agent = BusinessAgent | DevelopmentAgent;

// Feature statuses for KanPlan buckets
export type FeatureStatus =
  | 'inbox'
  | 'awaiting_deep_research'
  | 'research'
  | 'deep_research_received'
  | 'developing'
  | 'failed'
  | 'testing'
  | 'in_review'
  | 'completed'
  | 'approved'
  | 'ready_for_review'
  | 'done'
  | 'paused'
  | 'deferred';

export interface LLMProvider {
  id: string;
  name: string;
  endpoint?: string;
  isConfigured: boolean;
}

interface AgentState {
  // Agents
  businessAgents: BusinessAgent[];
  developmentAgents: DevelopmentAgent[];

  // LLM Providers (for development team)
  llmProviders: LLMProvider[];

  // Project type filter
  activeTeams: AgentTeam[];

  // Actions
  setAgentStatus: (agentId: string, status: Agent['status']) => void;
  setAgentModel: (agentId: string, modelId: string | null) => void;
  setActiveTeams: (teams: AgentTeam[]) => void;
  addLLMProvider: (provider: Omit<LLMProvider, 'id'>) => void;
  removeLLMProvider: (providerId: string) => void;

  // Computed
  getActiveAgents: () => Agent[];
  getAgentsByTeam: (team: AgentTeam) => Agent[];
}

// ============================================================================
// Default Agents
// ============================================================================

const DEFAULT_BUSINESS_AGENTS: BusinessAgent[] = [
  {
    id: 'agent-me',
    name: 'Me',
    icon: 'User',
    description: 'Decisions, approvals, creative direction',
    role: 'me',
    team: 'business',
    status: 'active',
    capabilities: ['decision-making', 'approvals', 'creative-direction', 'relationship-building'],
  },
  {
    id: 'agent-researcher',
    name: 'Researcher',
    icon: 'Search',
    description: 'Market research, competitive analysis, report writing',
    role: 'researcher',
    team: 'business',
    status: 'active',
    capabilities: ['web-research', 'competitive-analysis', 'report-writing', 'data-gathering'],
  },
  {
    id: 'agent-developer',
    name: 'Developer',
    icon: 'Code',
    description: 'Implementation, bug fixes, testing, deployment',
    role: 'developer',
    team: 'business',
    status: 'active',
    capabilities: ['full-stack-development', 'bug-fixes', 'testing', 'code-review', 'deployment', 'architecture'],
  },
  {
    id: 'agent-marketer',
    name: 'Marketer',
    icon: 'Megaphone',
    description: 'Copy, growth strategy, content, SEO',
    role: 'marketer',
    team: 'business',
    status: 'active',
    capabilities: ['copywriting', 'growth-strategy', 'content-creation', 'seo', 'social-media', 'positioning'],
  },
  {
    id: 'agent-business-analyst',
    name: 'Business Analyst',
    icon: 'BarChart3',
    description: 'Strategy, planning, prioritization, financials',
    role: 'business-analyst',
    team: 'business',
    status: 'active',
    capabilities: ['market-analysis', 'feature-prioritization', 'business-modeling', 'financial-projections'],
  },
  {
    id: 'agent-tester',
    name: 'Tester',
    icon: 'Bug',
    description: 'QA testing, bug reporting, performance analysis',
    role: 'tester',
    team: 'business',
    status: 'active',
    capabilities: ['functional-testing', 'bug-reporting', 'performance-profiling', 'playtest-analysis'],
  },
];

const DEFAULT_DEVELOPMENT_AGENTS: DevelopmentAgent[] = [
  {
    id: 'agent-codebase-research',
    name: 'Codebase Research',
    icon: 'Search',
    description: 'Analyzes project structure, finds relevant code patterns, maps dependencies',
    role: 'codebase-research',
    team: 'development',
    status: 'active',
    assignedModelId: 'claude-sonnet',
    capabilities: ['codebase_search', 'file_analysis', 'dependency_mapping', 'architecture_review'],
  },
  {
    id: 'agent-web-research',
    name: 'Web Research',
    icon: 'Globe',
    description: 'Searches the web, Reddit, YouTube, and documentation for technical information',
    role: 'web-research',
    team: 'development',
    status: 'active',
    assignedModelId: 'claude-sonnet',
    capabilities: ['web_search', 'reddit_search', 'youtube_search', 'documentation_lookup'],
  },
  {
    id: 'agent-coding-dev',
    name: 'Coding / Dev',
    icon: 'Code',
    description: 'Writes, refactors, and reviews code. Handles implementation and PRs',
    role: 'coding-dev',
    team: 'development',
    status: 'active',
    assignedModelId: 'claude-sonnet',
    capabilities: ['code_generation', 'refactoring', 'code_review', 'pr_management', 'file_editing'],
  },
  {
    id: 'agent-planning',
    name: 'Planning',
    icon: 'Map',
    description: 'Creates implementation plans, breaks down features into tasks, estimates effort',
    role: 'planning',
    team: 'development',
    status: 'active',
    assignedModelId: 'claude-opus',
    capabilities: ['task_breakdown', 'effort_estimation', 'milestone_planning', 'coordination'],
  },
  {
    id: 'agent-debugging',
    name: 'Debugging / Diagnostics',
    icon: 'Bug',
    description: 'Diagnoses bugs, analyzes error logs, traces execution flows, proposes fixes',
    role: 'debugging',
    team: 'development',
    status: 'active',
    assignedModelId: 'claude-sonnet',
    capabilities: ['error_analysis', 'log_tracing', 'stack_trace_analysis', 'fix_proposals', 'bisection'],
  },
  {
    id: 'agent-testing',
    name: 'Testing',
    icon: 'FlaskConical',
    description: 'Writes and runs unit tests, integration tests, E2E tests. Validates coverage',
    role: 'testing',
    team: 'development',
    status: 'idle',
    assignedModelId: 'claude-sonnet',
    capabilities: ['unit_testing', 'integration_testing', 'e2e_testing', 'coverage_analysis', 'assertion_gen'],
  },
];

const DEFAULT_LLM_PROVIDERS: LLMProvider[] = [
  { id: 'claude-sonnet', name: 'Claude 3.5 Sonnet', isConfigured: true },
  { id: 'claude-opus', name: 'Claude 3 Opus', isConfigured: true },
  { id: 'gpt-4o', name: 'GPT-4o', isConfigured: false },
  { id: 'gemini-pro', name: 'Gemini Pro', isConfigured: false },
  { id: 'ollama-local', name: 'Ollama (Local)', isConfigured: false },
];

// ============================================================================
// Store
// ============================================================================

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      businessAgents: DEFAULT_BUSINESS_AGENTS,
      developmentAgents: DEFAULT_DEVELOPMENT_AGENTS,
      llmProviders: DEFAULT_LLM_PROVIDERS,
      activeTeams: ['business', 'development'], // Show both by default

      setAgentStatus: (agentId, status) =>
        set((state) => {
          // Check business agents
          const businessIndex = state.businessAgents.findIndex((a) => a.id === agentId);
          if (businessIndex !== -1) {
            const newBusinessAgents = [...state.businessAgents];
            newBusinessAgents[businessIndex] = { ...newBusinessAgents[businessIndex], status };
            return { businessAgents: newBusinessAgents };
          }

          // Check development agents
          const devIndex = state.developmentAgents.findIndex((a) => a.id === agentId);
          if (devIndex !== -1) {
            const newDevelopmentAgents = [...state.developmentAgents];
            newDevelopmentAgents[devIndex] = { ...newDevelopmentAgents[devIndex], status };
            return { developmentAgents: newDevelopmentAgents };
          }

          return state;
        }),

      setAgentModel: (agentId, modelId) =>
        set((state) => {
          const index = state.developmentAgents.findIndex((a) => a.id === agentId);
          if (index !== -1) {
            const newAgents = [...state.developmentAgents];
            newAgents[index] = { ...newAgents[index], assignedModelId: modelId };
            return { developmentAgents: newAgents };
          }
          return state;
        }),

      setActiveTeams: (teams) => set({ activeTeams: teams }),

      addLLMProvider: (provider) =>
        set((state) => ({
          llmProviders: [...state.llmProviders, { ...provider, id: `custom-${Date.now()}` }],
        })),

      removeLLMProvider: (providerId) =>
        set((state) => ({
          llmProviders: state.llmProviders.filter((p) => p.id !== providerId),
          // Unassign removed provider from agents
          developmentAgents: state.developmentAgents.map((a) =>
            a.assignedModelId === providerId ? { ...a, assignedModelId: null } : a
          ),
        })),

      getActiveAgents: () => {
        const state = get();
        const agents: Agent[] = [];

        if (state.activeTeams.includes('business')) {
          agents.push(...state.businessAgents.filter((a) => a.status !== 'disabled'));
        }

        if (state.activeTeams.includes('development')) {
          agents.push(...state.developmentAgents.filter((a) => a.status !== 'disabled'));
        }

        return agents;
      },

      getAgentsByTeam: (team) => {
        const state = get();
        return team === 'business' ? state.businessAgents : state.developmentAgents;
      },
    }),
    {
      name: 'colab-agent-store',
    }
  )
);

// ============================================================================
// Hooks
// ============================================================================

export function useActiveAgents(): Agent[] {
  return useAgentStore((state) => state.getActiveAgents());
}

export function useBusinessAgents(): BusinessAgent[] {
  return useAgentStore((state) => state.businessAgents);
}

export function useDevelopmentAgents(): DevelopmentAgent[] {
  return useAgentStore((state) => state.developmentAgents);
}

export function useLLMProviders(): LLMProvider[] {
  return useAgentStore((state) => state.llmProviders);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function mapKanplanStatusToFeatureStatus(kanplanStatus: string): FeatureStatus | undefined {
  // Map simplified KanPlan statuses to detailed feature statuses
  const statusMap: Record<string, FeatureStatus> = {
    'inbox': 'inbox',
    'up_next': 'inbox',
    'active': 'developing',  // Default active status
    'complete': 'done',
  };
  return statusMap[kanplanStatus] || 'inbox';
}

export function getBucketsForStatus(status: FeatureStatus): string {
  // Group statuses into KanPlan buckets
  if (['paused', 'deferred'].includes(status)) {
    return 'back_burner';
  }
  if (['inbox', 'awaiting_deep_research'].includes(status)) {
    return 'in_queue';
  }
  if (['research', 'awaiting_deep_research', 'deep_research_received'].includes(status)) {
    return 'research';
  }
  if (status === 'developing') {
    return 'development';
  }
  if (status === 'failed') {
    return 'diagnostics';
  }
  if (['testing', 'in_review', 'completed'].includes(status)) {
    return 'testing';
  }
  if (['approved', 'ready_for_review'].includes(status)) {
    return 'review';
  }
  if (status === 'done') {
    return 'complete';
  }
  return 'in_queue';
}

export function useAgentByRole(role: string): Agent | undefined {
  return useAgentStore((state) => {
    const business = state.businessAgents.find((a) => a.role === role);
    if (business) return business;
    return state.developmentAgents.find((a) => a.role === role);
  });
}
