/**
 * Database Connection - SQLite with Drizzle ORM
 *
 * Uses better-sqlite3 for synchronous SQLite operations.
 * The database file is stored in mission-control/data/db/
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as schema from './schema';

// Database path - stored in mission-control/data/db/
const DATA_DIR = join(process.cwd(), 'data');
const DB_DIR = join(DATA_DIR, 'db');
const DB_PATH = join(DB_DIR, 'mission-control.db');

// Ensure directories exist
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

// Create SQLite connection
const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL');

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw SQLite instance for advanced operations
export { sqlite };

// Export all schema types and tables
export * from './schema';

/**
 * Initialize database with default data
 * Called on first run or when resetting
 */
export async function initializeDatabase() {
  console.log('Initializing database...');

  // Create default AI services (from co-lab)
  const defaultServices = [
    { id: 'anthropic', name: 'Anthropic', icon: 'Brain', endpoint: 'https://api.anthropic.com', isConfigured: true, sortOrder: 1 },
    { id: 'openai', name: 'OpenAI', icon: 'Zap', endpoint: 'https://api.openai.com', isConfigured: false, sortOrder: 2 },
    { id: 'google', name: 'Google AI', icon: 'Sparkles', endpoint: 'https://generativelanguage.googleapis.com', isConfigured: false, sortOrder: 3 },
    { id: 'ollama', name: 'Ollama (Local)', icon: 'Server', endpoint: 'http://localhost:11434', isConfigured: false, sortOrder: 4 },
  ];

  // Check if services already exist
  const existingServices = db.select().from(schema.aiServices).all();
  if (existingServices.length === 0) {
    const now = new Date();
    for (const service of defaultServices) {
      db.insert(schema.aiServices).values({
        ...service,
        id: `service_${service.id}`,
        createdAt: now,
      }).run();
    }
    console.log('Created default AI services');
  }

  // Create default AI models
  const defaultModels = [
    // Anthropic
    { serviceId: 'service_anthropic', name: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4', sortOrder: 1 },
    { serviceId: 'service_anthropic', name: 'claude-opus-4-20250514', displayName: 'Claude Opus 4', sortOrder: 2 },
    { serviceId: 'service_anthropic', name: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku', sortOrder: 3 },
    // OpenAI
    { serviceId: 'service_openai', name: 'gpt-4o', displayName: 'GPT-4o', sortOrder: 1 },
    { serviceId: 'service_openai', name: 'gpt-4o-mini', displayName: 'GPT-4o Mini', sortOrder: 2 },
    { serviceId: 'service_openai', name: 'o1-preview', displayName: 'o1 Preview', sortOrder: 3 },
    // Google
    { serviceId: 'service_google', name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', sortOrder: 1 },
    { serviceId: 'service_google', name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', sortOrder: 2 },
    // Ollama
    { serviceId: 'service_ollama', name: 'llama3.2', displayName: 'Llama 3.2', sortOrder: 1 },
    { serviceId: 'service_ollama', name: 'codellama', displayName: 'Code Llama', sortOrder: 2 },
  ];

  const existingModels = db.select().from(schema.aiModels).all();
  if (existingModels.length === 0) {
    for (const model of defaultModels) {
      db.insert(schema.aiModels).values({
        id: `model_${model.name}`,
        ...model,
      }).run();
    }
    console.log('Created default AI models');
  }

  console.log('Database initialization complete');
}

/**
 * Close database connection
 * Call on shutdown
 */
export function closeDatabase() {
  sqlite.close();
  console.log('Database connection closed');
}
