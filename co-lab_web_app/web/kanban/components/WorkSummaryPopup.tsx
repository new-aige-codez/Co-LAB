'use client'
import React, { useEffect, useState } from 'react'
import { X, GitBranch, Clock, User, Bot, RefreshCw, Play, Redo, ExternalLink } from 'lucide-react'
import { useKanbanStore, type WorkSession, type FeatureCommit, type FeatureBranch } from '@/store/kanbanStore'
import { useFeatureDevStore } from '@/store/featureDevStore'

function timeAgo(ts: number): string {
    const seconds = ts > 1e12 ? Math.floor(ts / 1000) : ts
    const diff = Math.floor(Date.now() / 1000) - seconds
    if (diff < 0) return 'just now'
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(ts > 1e12 ? ts : ts * 1000).toLocaleDateString()
}

export default function WorkSummaryPopup() {
    const {
        showWorkSummary,
        selectedJobId,
        closeWorkSummary,
        gitHistory,
        gitBranches,
        isLoadingGit,
        loadGitHistory,
        activeWorkers,
        loadActiveWorkers,
    } = useKanbanStore()

    const { currentJob, startDevelopment, loadJobSummary, jobSummary } = useFeatureDevStore()

    const [showRedoInput, setShowRedoInput] = useState(false)
    const [redoContext, setRedoContext] = useState('')
    const [selectedCommit, setSelectedCommit] = useState<string | null>(null)

    // Load data on open
    useEffect(() => {
        if (showWorkSummary && selectedJobId) {
            loadGitHistory(selectedJobId)
            loadActiveWorkers(selectedJobId)
            loadJobSummary(selectedJobId)
        }
    }, [showWorkSummary, selectedJobId, loadGitHistory, loadActiveWorkers, loadJobSummary])

    if (!showWorkSummary || !selectedJobId) return null

    const workers = activeWorkers.get(selectedJobId) || []
    const activeBranch = gitBranches.find(b => b.status === 'active')

    const handleRedo = () => {
        if (redoContext.trim()) {
            // Add context to job somehow - would need API endpoint
            console.log('Redo with context:', redoContext)
        }
        // Reset job to research phase - would need API endpoint
        setShowRedoInput(false)
        closeWorkSummary()
    }

    const handleContinue = () => {
        startDevelopment(selectedJobId)
        closeWorkSummary()
    }

    const handleCheckoutCommit = (commitHash: string) => {
        // Would call git checkout API
        console.log('Checkout to:', commitHash)
        setSelectedCommit(commitHash)
    }

    return (
        <div className="summary-overlay" onClick={e => { if (e.target === e.currentTarget) closeWorkSummary() }}>
            <div className="work-summary-modal">
                {/* Header */}
                <div className="summary-header">
                    <div>
                        <h2>Work Summary</h2>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>
                            {currentJob?.feature_name || jobSummary?.job?.feature_name || 'Unknown Feature'}
                        </p>
                    </div>
                    <button className="summary-close-btn" onClick={closeWorkSummary}><X size={14} /></button>
                </div>

                <div className="work-summary-content">
                    {/* Active Workers */}
                    {workers.length > 0 && (
                        <div className="summary-section">
                            <h3><User size={14} /> Active Workers</h3>
                            <div className="workers-list">
                                {workers.map(w => (
                                    <div key={w.id} className="worker-item">
                                        <span className="worker-icon">
                                            {w.worker_type === 'ai_service' ? <Bot size={14} /> : <User size={14} />}
                                        </span>
                                        <span className="worker-name">{w.worker_name}</span>
                                        <span className={`worker-status status-${w.status}`}>
                                            {w.status}
                                        </span>
                                        <span className="worker-time">{timeAgo(w.started_at)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Git Branch Info */}
                    {activeBranch && (
                        <div className="summary-section">
                            <h3><GitBranch size={14} /> Branch</h3>
                            <div className="branch-info">
                                <code>{activeBranch.branch_name}</code>
                                <span className="branch-base">based on {activeBranch.base_branch}</span>
                            </div>
                        </div>
                    )}

                    {/* Git History */}
                    <div className="summary-section">
                        <h3>
                            <Clock size={14} /> Git History
                            {isLoadingGit && <RefreshCw size={12} className="animate-spin" style={{ marginLeft: '0.5rem' }} />}
                        </h3>
                        <div className="git-history-list">
                            {gitHistory.length === 0 ? (
                                <div className="git-empty">No commits yet</div>
                            ) : (
                                gitHistory.map(commit => (
                                    <div
                                        key={commit.id}
                                        className={`git-commit-item ${selectedCommit === commit.commit_hash ? 'selected' : ''}`}
                                        onClick={() => handleCheckoutCommit(commit.commit_hash)}
                                    >
                                        <code className="commit-hash">{commit.short_hash}</code>
                                        <span className="commit-message">{commit.message}</span>
                                        <span className="commit-author">{commit.author}</span>
                                        <span className="commit-time">{timeAgo(commit.committed_at)}</span>
                                        <button
                                            className="commit-open-btn"
                                            onClick={e => {
                                                e.stopPropagation()
                                                window.open(`vscode://file/`)
                                            }}
                                        >
                                            <ExternalLink size={10} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Manual Work */}
                    {jobSummary?.manualWork && jobSummary.manualWork.length > 0 && (
                        <div className="summary-section">
                            <h3>Manual Work</h3>
                            <div className="manual-work-list">
                                {jobSummary.manualWork.slice(-5).reverse().map(mw => (
                                    <div key={mw.id} className="manual-work-item">
                                        <span className="mw-phase">{mw.phase}</span>
                                        <span className="mw-desc">{mw.description.slice(0, 100)}...</span>
                                        <span className="mw-time">{timeAgo(mw.submitted_at)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Redo Input */}
                    {showRedoInput && (
                        <div className="summary-section redo-section">
                            <h3>Additional Context for Redo</h3>
                            <textarea
                                className="redo-textarea"
                                placeholder="Add any context or notes for the redo..."
                                value={redoContext}
                                onChange={e => setRedoContext(e.target.value)}
                                rows={3}
                            />
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="summary-actions">
                    <button
                        className="summary-btn redo-btn"
                        onClick={() => showRedoInput ? handleRedo() : setShowRedoInput(true)}
                    >
                        <Redo size={14} />
                        {showRedoInput ? 'Confirm Redo' : 'Redo'}
                    </button>
                    <button
                        className="summary-btn continue-btn"
                        onClick={handleContinue}
                    >
                        <Play size={14} />
                        Continue Development
                    </button>
                </div>
            </div>
        </div>
    )
}
