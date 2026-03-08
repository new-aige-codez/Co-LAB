/**
 * Git Service
 *
 * Handles repository cloning, context extraction, and management
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface GitRepo {
  id: string;
  url: string;
  name: string;
  localPath: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  lastSyncedAt: Date;
  contextFiles: string[];
}

export interface RepoContext {
  readme: string | null;
  claudeMd: string | null;
  packageJson: {
    name: string;
    description?: string;
    scripts?: Record<string, string>;
  } | null;
  keyFiles: {
    path: string;
    content: string;
  }[];
}

export interface CloneResult {
  success: boolean;
  repo?: GitRepo;
  context?: RepoContext;
  error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const REPOS_DIR = join(process.cwd(), 'repos');

// Ensure repos directory exists
if (!existsSync(REPOS_DIR)) {
  mkdirSync(REPOS_DIR, { recursive: true });
}

// ============================================================================
// Git Operations
// ============================================================================

/**
 * Clone a git repository
 */
export async function cloneRepo(
  url: string,
  options: { branch?: string; depth?: number } = {}
): Promise<CloneResult> {
  try {
    // Extract repo name from URL
    const repoName = basename(url, '.git');
    const localPath = join(REPOS_DIR, repoName);

    // Check if already cloned
    if (existsSync(localPath)) {
      // Pull latest changes instead
      return await updateRepo(repoName);
    }

    // Build clone command
    const depthFlag = options.depth ? `--depth ${options.depth}` : '';
    const branchFlag = options.branch ? `--branch ${options.branch}` : '';

    // Clone the repository
    execSync(
      `git clone ${depthFlag} ${branchFlag} "${url}" "${localPath}"`,
      { stdio: 'pipe', timeout: 60000 }
    );

    // Get current commit info
    const commitHash = execSync('git rev-parse HEAD', { cwd: localPath, encoding: 'utf-8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { cwd: localPath, encoding: 'utf-8' }).trim();
    const branch = options.branch || execSync('git rev-parse --abbrev-ref HEAD', { cwd: localPath, encoding: 'utf-8' }).trim();

    // Extract context
    const context = extractContext(localPath);

    const repo: GitRepo = {
      id: `repo_${Date.now()}`,
      url,
      name: repoName,
      localPath,
      branch,
      commitHash,
      commitMessage,
      lastSyncedAt: new Date(),
      contextFiles: getContextFilePaths(context),
    };

    return { success: true, repo, context };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during clone',
    };
  }
}

/**
 * Update an existing repository
 */
export async function updateRepo(repoName: string): Promise<CloneResult> {
  try {
    const localPath = join(REPOS_DIR, repoName);

    if (!existsSync(localPath)) {
      return { success: false, error: 'Repository not found' };
    }

    // Pull latest changes
    execSync('git pull', { cwd: localPath, stdio: 'pipe', timeout: 30000 });

    // Get current commit info
    const commitHash = execSync('git rev-parse HEAD', { cwd: localPath, encoding: 'utf-8' }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', { cwd: localPath, encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: localPath, encoding: 'utf-8' }).trim();
    const url = execSync('git config --get remote.origin.url', { cwd: localPath, encoding: 'utf-8' }).trim();

    // Extract context
    const context = extractContext(localPath);

    const repo: GitRepo = {
      id: `repo_${Date.now()}`,
      url,
      name: repoName,
      localPath,
      branch,
      commitHash,
      commitMessage,
      lastSyncedAt: new Date(),
      contextFiles: getContextFilePaths(context),
    };

    return { success: true, repo, context };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during update',
    };
  }
}

/**
 * Remove a cloned repository
 */
export function removeRepo(repoName: string): boolean {
  try {
    const localPath = join(REPOS_DIR, repoName);
    if (existsSync(localPath)) {
      rmSync(localPath, { recursive: true, force: true });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get repository status
 */
export function getRepoStatus(repoName: string): {
  exists: boolean;
  hasChanges: boolean;
  branch: string | null;
} {
  try {
    const localPath = join(REPOS_DIR, repoName);

    if (!existsSync(localPath)) {
      return { exists: false, hasChanges: false, branch: null };
    }

    const status = execSync('git status --porcelain', { cwd: localPath, encoding: 'utf-8' });
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: localPath, encoding: 'utf-8' }).trim();

    return {
      exists: true,
      hasChanges: status.trim().length > 0,
      branch,
    };
  } catch {
    return { exists: false, hasChanges: false, branch: null };
  }
}

// ============================================================================
// Context Extraction
// ============================================================================

const KEY_FILE_PATTERNS = [
  'README.md',
  'readme.md',
  'CLAUDE.md',
  'claude.md',
  'package.json',
  'tsconfig.json',
  'Cargo.toml',
  'go.mod',
  'requirements.txt',
  'pyproject.toml',
  'docker-compose.yml',
  'Dockerfile',
];

function extractContext(localPath: string): RepoContext {
  const context: RepoContext = {
    readme: null,
    claudeMd: null,
    packageJson: null,
    keyFiles: [],
  };

  // Extract README
  for (const pattern of ['README.md', 'readme.md', 'README', 'readme']) {
    const filePath = join(localPath, pattern);
    if (existsSync(filePath)) {
      context.readme = readFileSync(filePath, 'utf-8');
      break;
    }
  }

  // Extract CLAUDE.md
  const claudePath = join(localPath, 'CLAUDE.md');
  if (existsSync(claudePath)) {
    context.claudeMd = readFileSync(claudePath, 'utf-8');
  }

  // Extract package.json
  const packagePath = join(localPath, 'package.json');
  if (existsSync(packagePath)) {
    try {
      context.packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    } catch {
      // Invalid JSON, skip
    }
  }

  // Extract other key files
  for (const pattern of KEY_FILE_PATTERNS) {
    const filePath = join(localPath, pattern);
    if (existsSync(filePath) && !context.keyFiles.some(f => f.path === pattern)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        // Limit content size
        context.keyFiles.push({
          path: pattern,
          content: content.slice(0, 10000),
        });
      } catch {
        // Skip files that can't be read
      }
    }
  }

  return context;
}

function getContextFilePaths(context: RepoContext): string[] {
  const paths: string[] = [];
  if (context.readme) paths.push('README.md');
  if (context.claudeMd) paths.push('CLAUDE.md');
  if (context.packageJson) paths.push('package.json');
  paths.push(...context.keyFiles.map(f => f.path));
  return [...new Set(paths)]; // Unique paths
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * List all cloned repositories
 */
export function listClonedRepos(): string[] {
  if (!existsSync(REPOS_DIR)) return [];

  return readdirSync(REPOS_DIR).filter((name: string) => {
    const path = join(REPOS_DIR, name);
    return statSync(path).isDirectory() && existsSync(join(path, '.git'));
  });
}

/**
 * Validate a git URL
 */
export function isValidGitUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/.+\.git$/,
    /^git@.+:.+\.git$/,
    /^https?:\/\/github\.com\/.+\/.+$/,
    /^https?:\/\/gitlab\.com\/.+\/.+$/,
    /^https?:\/\/bitbucket\.org\/.+\/.+$/,
  ];

  return patterns.some(pattern => pattern.test(url));
}
