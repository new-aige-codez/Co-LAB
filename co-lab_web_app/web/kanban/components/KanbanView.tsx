'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { LayoutDashboard, RefreshCw, ExternalLink, PlusCircle, CheckCircle2, User, Bot, Play, RotateCcw } from 'lucide-react'
import { useFeatureDevStore, type FeatureDevJob, type ArtifactFile } from '@/store/featureDevStore'
import { useKanbanStore, useActiveWorkers, type WorkSession } from '@/store/kanbanStore'
import FeatureStatusPanel from './FeatureStatusPanel'

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
    const seconds = ts > 1e12 ? Math.floor(ts / 1000) : ts
    const diff = Math.floor(Date.now() / 1000) - seconds
    if (diff < 0) return 'just now'
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(ts > 1e12 ? ts : ts * 1000).toLocaleDateString()
}

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS = [
    {
        id: 'research',
        label: 'Research',
        icon: '🔬',
        color: '#7c3aed',
        statuses: ['research', 'awaiting_deep_research', 'deep_research_received'],
        subCategories: [
            { id: 'codebase', label: 'Codebase', statuses: ['research'] },
            { id: 'deep', label: 'Deep', statuses: ['awaiting_deep_research', 'deep_research_received'] },
        ],
    },
    {
        id: 'development',
        label: 'Development',
        icon: '⚡',
        color: '#2563eb',
        statuses: ['developing', 'testing'],
    },
    {
        id: 'debugging',
        label: 'Debugging',
        icon: '🐛',
        color: '#dc2626',
        statuses: ['failed'],
    },
    {
        id: 'testing',
        label: 'Testing',
        icon: '🧪',
        color: '#059669',
        statuses: ['in_review', 'completed'],
        subCategories: [
            { id: 'bot', label: 'Bot', statuses: ['in_review'] },
            { id: 'human', label: 'Human', statuses: ['completed'] },
        ],
    },
    {
        id: 'review',
        label: 'Review',
        icon: '✅',
        color: '#d97706',
        statuses: ['approved', 'ready_for_review'],
    },
]

// ── Per-card artifact fetcher ──────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || 'dev-token'

function useArtifacts(jobId: string, autoLoad: boolean) {
    const [artifacts, setArtifacts] = useState<ArtifactFile[]>([])
    const [changedFiles, setChangedFiles] = useState<{ file_path: string; change_type: string }[]>([])

    useEffect(() => {
        if (!autoLoad) return
        fetch(`${API_BASE}/api/feature-dev/jobs/${jobId}/artifacts`, {
            headers: { 'x-api-token': API_TOKEN }
        })
            .then(r => r.json())
            .then(d => { setArtifacts(d.artifacts || []); setChangedFiles(d.changedFiles || []) })
            .catch(() => { })
    }, [jobId, autoLoad])

    return { artifacts, changedFiles }
}

// ── Worker Badges Component ───────────────────────────────────────────────────

function WorkerBadges({ jobId }: { jobId: string }) {
    const workers = useActiveWorkers(jobId)

    if (workers.length === 0) return null

    return (
        <div className="kanban-workers">
            {workers.map(w => (
                <span key={w.id} className="worker-badge">
                    {w.worker_type === 'ai_service' ? <Bot size={10} /> : <User size={10} />}
                    <span className="worker-name">{w.worker_name}</span>
                </span>
            ))}
        </div>
    )
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

function KanbanCard({ job, onSelect, columnId }: {
    job: FeatureDevJob
    onSelect: () => void
    columnId: string
}) {
    const [expanded, setExpanded] = useState(false)
    const { artifacts, changedFiles } = useArtifacts(job.id, expanded)

    const isFailed = job.status === 'failed'
    const isHumanTesting = job.status === 'completed'
    const isBotTesting = job.status === 'in_review'
    const isInProgress = columnId === 'development'
    const { approveJob, continueDevelopment, retryAfterFailure, selectFeature, selectFeatureForContinue, connectTerminalSSE } = useFeatureDevStore()
    const [approved, setApproved] = useState(false)
    const [continuing, setContinuing] = useState(false)
    const [retrying, setRetrying] = useState(false)

    const canContinue = ['in_review', 'deep_research_received', 'failed', 'developing', 'testing'].includes(job.status)
    const canRetry = job.status === 'failed'

    const handleApprove = async (e: React.MouseEvent) => {
        e.stopPropagation()
        await approveJob(job.id)
        setApproved(true)
    }

    const handleContinue = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setContinuing(true)
        // Go straight to dev view (not detail view) and replay terminal history
        selectFeatureForContinue(job.feature_id)
        connectTerminalSSE(job.id)
        await continueDevelopment(job.id)
        setContinuing(false)
    }

    const handleRetry = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setRetrying(true)
        selectFeatureForContinue(job.feature_id)
        await retryAfterFailure(job.id)
        setRetrying(false)
    }

    return (
        <div
            className={`kanban-card ${isFailed ? 'kanban-card-failed' : ''}`}
            onClick={onSelect}
        >
            <div className="kanban-card-name">{job.feature_name}</div>

            <div className="kanban-card-meta">
                <span className={`kanban-status-dot status-${job.status}`} />
                <span className="kanban-status-label">{job.status.replace(/_/g, ' ')}</span>
            </div>

            <div className="kanban-time">{timeAgo(job.updated_at)}</div>

            {/* Worker badges */}
            <WorkerBadges jobId={job.id} />

            {job.attempt_count > 0 && (
                <div className="kanban-attempts">
                    {job.attempt_count}/{job.max_attempts} attempt{job.attempt_count !== 1 ? 's' : ''}
                </div>
            )}

            {/* Expand to show artifact links */}
            <button
                className="kanban-expand-btn"
                onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
            >
                {expanded ? '▲ Hide files' : '▾ Show files'}
            </button>

            {expanded && (
                <div className="kanban-artifacts" onClick={e => e.stopPropagation()}>
                    {artifacts.length === 0 && changedFiles.length === 0 ? (
                        <span className="kanban-empty" style={{ fontSize: '0.65rem', padding: '0.25rem 0' }}>No artifacts yet</span>
                    ) : (
                        <>
                            {artifacts.map((art, i) => (
                                <a key={i}
                                    href={`vscode://file/${art.absolutePath}`}
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(`vscode://file/${art.absolutePath}`) }}
                                    className="kanban-artifact-link"
                                    title={art.absolutePath}>
                                    📄 {art.filename}
                                    <span className="kanban-artifact-folder">({art.folder})</span>
                                </a>
                            ))}
                            {changedFiles.map((f, i) => (
                                <a key={`cf-${i}`}
                                    href={`vscode://file/${f.file_path}`}
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(`vscode://file/${f.file_path}`) }}
                                    className="kanban-artifact-link code"
                                    title={f.file_path}>
                                    ⚡ {f.file_path.split(/[\\/]/).pop()}
                                    <span className="kanban-artifact-folder">({f.change_type})</span>
                                </a>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Continue Work — prominent, visible without expanding */}
            {canContinue && !canRetry && (
                <button
                    className="kanban-continue-btn"
                    onClick={handleContinue}
                    disabled={continuing}
                >
                    <Play size={12} />
                    {continuing ? 'Starting…' : '▶ Continue Work'}
                </button>
            )}

            {/* Redo — for failed jobs */}
            {canRetry && (
                <div className="kanban-redo-row">
                    <button
                        className="kanban-continue-btn"
                        onClick={handleContinue}
                        disabled={continuing}
                    >
                        <Play size={12} />
                        {continuing ? 'Starting…' : '▶ Continue Work'}
                    </button>
                    <button
                        className="kanban-redo-btn"
                        onClick={handleRetry}
                        disabled={retrying}
                    >
                        <RotateCcw size={12} />
                        {retrying ? 'Retrying…' : '↺ Redo Work'}
                    </button>
                </div>
            )}

            {/* Bot testing: show approve button */}
            {isBotTesting && !approved && (
                <button className="kanban-approve-btn" onClick={handleApprove}>
                    <CheckCircle2 size={12} /> Approve for Human Testing
                </button>
            )}
            {approved && <div className="kanban-approved-badge">✅ Approved</div>}
        </div>
    )
}

// ── Main KanbanView ───────────────────────────────────────────────────────────

export default function KanbanView() {
    const { allJobs, features, loadAllJobs, selectFeature, toggleManualWork } = useFeatureDevStore()
    const { loadAllActiveWorkers, openWorkSummary } = useKanbanStore()
    const [busy, setBusy] = useState(false)

    const refresh = useCallback(async () => {
        setBusy(true)
        await Promise.all([
            loadAllJobs(),
            loadAllActiveWorkers(),
        ])
        setBusy(false)
    }, [loadAllJobs, loadAllActiveWorkers])

    useEffect(() => {
        loadAllJobs()
        loadAllActiveWorkers()
        const timer = setInterval(() => {
            loadAllJobs()
            loadAllActiveWorkers()
        }, 15000)
        return () => clearInterval(timer)
    }, [loadAllJobs, loadAllActiveWorkers])

    const jobsByCol = COLUMNS.map(col => ({
        ...col,
        jobs: allJobs.filter(j => col.statuses.includes(j.status))
    }))

    const allJobFeatureIds = new Set(allJobs.map(j => j.feature_id))
    const backlog = features.filter(f => !allJobFeatureIds.has(f.id))

    const handleSelectJob = (job: FeatureDevJob) => {
        selectFeature(job.feature_id)
        openWorkSummary(job.id)
    }

    return (
        <div className="kanban-view">
            {/* Header */}
            <div className="kanban-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <LayoutDashboard size={20} style={{ color: '#6366f1' }} />
                    <span className="kanban-title">Feature Development Pipeline</span>
                </div>
                <div className="kanban-stats">
                    <span>{allJobs.length} feature{allJobs.length !== 1 ? 's' : ''} tracked</span>
                    <button className="kanban-refresh-btn" onClick={refresh} disabled={busy}>
                        <RefreshCw size={12} className={busy ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Board */}
            <div className="kanban-board">
                {jobsByCol.map(col => (
                    <div key={col.id} className="kanban-column">
                        <div className="kanban-column-header" style={{ borderTopColor: col.color }}>
                            <span className="kanban-col-icon">{col.icon}</span>
                            <span className="kanban-col-title">{col.label}</span>
                            <span className="kanban-col-count">{col.jobs.length}</span>
                        </div>
                        <div className="kanban-column-body">
                            {col.subCategories ? (
                                // Column with sub-categories
                                col.subCategories.map(sub => {
                                    const subJobs = col.jobs.filter(j => sub.statuses.includes(j.status))
                                    return (
                                        <div key={sub.id} className="kanban-subcategory">
                                            <div className="kanban-subheader">
                                                <span>{sub.label}</span>
                                                <span className="kanban-subcount">{subJobs.length}</span>
                                            </div>
                                            {subJobs.length === 0 ? (
                                                <div className="kanban-empty kanban-sub-empty">—</div>
                                            ) : (
                                                subJobs.map(job => (
                                                    <KanbanCard
                                                        key={job.id}
                                                        job={job}
                                                        columnId={col.id}
                                                        onSelect={() => handleSelectJob(job)}
                                                    />
                                                ))
                                            )}
                                            {/* Manual work button in human sub-category of testing column */}
                                            {col.id === 'testing' && sub.id === 'human' && (
                                                <button
                                                    className="kanban-manual-btn"
                                                    onClick={() => toggleManualWork()}
                                                >
                                                    <PlusCircle size={12} /> Submit Outside Work
                                                </button>
                                            )}
                                        </div>
                                    )
                                })
                            ) : col.jobs.length === 0 ? (
                                <div className="kanban-empty">Empty</div>
                            ) : (
                                col.jobs.map(job => (
                                    <KanbanCard
                                        key={job.id}
                                        job={job}
                                        columnId={col.id}
                                        onSelect={() => handleSelectJob(job)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Backlog */}
            {backlog.length > 0 && (
                <div className="kanban-backlog">
                    <h3>Backlog — Not Started ({backlog.length})</h3>
                    <div className="kanban-backlog-list">
                        {backlog.map(f => (
                            <div
                                key={f.id}
                                className="kanban-backlog-item"
                                onClick={() => selectFeature(f.id)}
                            >
                                <span className="backlog-num">#{f.number}</span>
                                <span className="backlog-name">{f.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Feature Status MD Panel — inline below Kanban */}
            <FeatureStatusPanel />
        </div>
    )
}
