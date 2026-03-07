# ClaudeClaw Migration Guide

This guide explains how to migrate ClaudeClaw from local SQLite to cloud hosting on Render with PostgreSQL.

## Overview

ClaudeClaw now supports both SQLite (local development) and PostgreSQL (production). The migration involves:

1. Database migration: SQLite → PostgreSQL
2. File storage migration: Local files → Database storage
3. Search migration: FTS5 → PostgreSQL full-text search

## Architecture Changes

### Before (SQLite)
```
store/claudeclaw.db          # SQLite database
store/memory/{chatId}/       # Markdown memory files
workspace/uploads/           # Uploaded files
```

### After (PostgreSQL on Render)
```
PostgreSQL Database (Render)
├── All tables including:
│   ├── memories (with tsvector index)
│   ├── memory_files (cloud storage)
│   ├── uploads (binary data)
│   └── ... other tables
```

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Have your secrets ready

## Step-by-Step Migration

### Step 1: Create Render PostgreSQL Database

1. Log into Render dashboard
2. Go to **Blueprints** → **New PostgreSQL**
3. Choose:
   - Name: `claudeclaw-db`
   - Region: Oregon (free tier)
   - Plan: Free
4. Click **Create Database**
5. **Important**: Copy the `Internal Database URL` - you'll need this for `DATABASE_URL`

### Step 2: Create Render Web Service

1. In Render dashboard, click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - Name: `claudeclaw`
   - Region: Oregon (same as database)
   - Branch: `main`
   - Root Directory: `Claude-Claw` (if monorepo)
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free

### Step 3: Add Environment Variables

In the Render web service, add these environment variables:

#### Required
| Variable | Description | How to get it |
|----------|-------------|---------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | From @BotFather |
| `ALLOWED_CHAT_ID` | Your Telegram chat ID | Send /chatid to your bot |
| `WEB_API_TOKEN` | API authentication token | Generate: `openssl rand -hex 32` |

#### Automatic (from database)
| Variable | Source |
|----------|--------|
| `DATABASE_URL` | From database connection |

#### Optional but Recommended
| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Voice transcription |
| `GOOGLE_API_KEY` | Video analysis |
| `TAVILY_API_KEY` | Web search |
| `LOG_LEVEL` | Set to `info` |

### Step 4: Migrate Existing Data (Optional)

If you have existing SQLite data you want to preserve:

1. **Export from SQLite**:
   ```bash
   # Run locally with SQLite
   npm run memory export > memory_backup.json
   ```

2. **Import to PostgreSQL** (after deployment):
   ```bash
   # Set DATABASE_URL to your Render database
   DATABASE_URL=postgresql://... npm run memory import memory_backup.json
   ```

### Step 5: Deploy

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Add PostgreSQL support for Render deployment"
   git push origin main
   ```

2. Render will automatically deploy

3. Check logs in Render dashboard

4. Test your bot by sending a message on Telegram

## Environment Variable Reference

### Development (.env)
```env
# SQLite mode (no DATABASE_URL = SQLite)
TELEGRAM_BOT_TOKEN=your_bot_token
ALLOWED_CHAT_ID=your_chat_id
WEB_API_TOKEN=your_api_token
```

### Production (Render)
```env
# PostgreSQL mode (DATABASE_URL enables PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/db
TELEGRAM_BOT_TOKEN=your_bot_token
ALLOWED_CHAT_ID=your_chat_id
WEB_API_TOKEN=your_api_token
RENDER=true
```

## Database Schema

The PostgreSQL schema is defined in `src/db/schema.ts` using Drizzle ORM. Key tables:

| Table | Purpose |
|-------|---------|
| `sessions` | Claude session IDs per chat |
| `memories` | Persistent memory with FTS |
| `scheduled_tasks` | Cron-scheduled jobs |
| `conversations` | Chat history |
| `messages` | Individual messages |
| `memory_files` | Cloud-based memory storage |
| `uploads` | Binary file storage |
| `feature_dev_jobs` | Feature development tracking |
| `canvas_sessions` | Canvas UI sessions |

## Full-Text Search

PostgreSQL uses `tsvector` for full-text search instead of SQLite FTS5:

```sql
-- SQLite FTS5 (old)
SELECT * FROM memories_fts WHERE content MATCH 'query'

-- PostgreSQL tsvector (new)
SELECT * FROM memories
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'query:*')
ORDER BY ts_rank(...)
```

## Troubleshooting

### Database Connection Issues

**Symptom**: App fails to start with database errors

**Solution**:
1. Check `DATABASE_URL` is set correctly
2. Verify database is not in sleep mode (free tier sleeps after inactivity)
3. First request may be slow (waking up database)

### Memory Not Persisting

**Symptom**: Memories disappear after restart

**Solution**:
1. Verify `DATABASE_URL` is set
2. Check logs for migration errors
3. Run `npm run memory list` to check storage

### Web UI Not Loading

**Symptom**: 502 errors from web UI

**Solution**:
1. Check `WEB_API_TOKEN` matches in both places
2. Verify frontend is built (`npm run build` in web/)
3. Check Render logs for build errors

## Rollback Plan

If you need to rollback to SQLite:

1. **Local Development**: Simply don't set `DATABASE_URL` - SQLite is used by default

2. **Production**:
   - Remove `DATABASE_URL` environment variable
   - Set `USE_SQLITE=true` (if implemented)
   - Redeploy

 The code supports both SQLite and PostgreSQL, so you migration is reversible.

## Cost Estimate (Free Tier)

| Resource | Free Tier | Notes |
|----------|-----------|-------|
| PostgreSQL | 90 days, 1GB | Expires after 90 days of inactivity |
| Web Service | 750 hours/month | ~15 hours/day average |

## Next Steps

After successful migration:

1. **Set up monitoring**: Use Render dashboard to monitor logs and usage
2. **Configure alerts**: Set up Render notifications for downtime
3. **Optimize database**: Add indexes if queries are slow
4. **Backup strategy**: Regular exports of important data

 ## Support

For issues or questions:
1. Check the GitHub Issues page
2. Review Render logs
3. Consult `src/db/schema.ts` for database structure questions
