'use client'
import React, { useEffect, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileText, Copy, CheckCircle, Edit3, Save, X, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatusFile {
    folder: string
    filename: string
    relativePath: string
    sizeBytes: number
    modifiedAt: number
}

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || 'dev-token'

const FOLDER_ORDER = ['In Progress', 'In review', 'Completed', 'Research', 'Failed attempts']

const FOLDER_META: Record<string, { icon: string; color: string }> = {
    'In Progress': { icon: '🔄', color: '#6366f1' },
    'In review': { icon: '🤖', color: '#f59e0b' },
    'Completed': { icon: '✅', color: '#10b981' },
    'Research': { icon: '🔬', color: '#8b5cf6' },
    'Failed attempts': { icon: '❌', color: '#ef4444' },
}

function formatBytes(b: number): string {
    if (b < 1024) return `${b}B`
    if (b < 1024 * 1024) return `${Math.round(b / 1024)}KB`
    return `${(b / (1024 * 1024)).toFixed(1)}MB`
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function FeatureStatusPanel() {
    const [files, setFiles] = useState<StatusFile[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [content, setContent] = useState('')
    const [editContent, setEditContent] = useState('')
    const [contentLoading, setContentLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const [saveMsg, setSaveMsg] = useState('')
    const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())

    const fetchFiles = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch(`${API_BASE}/api/feature-dev/feature-status-files`, {
                headers: { 'x-api-token': API_TOKEN }
            })
            const d = await r.json()
            setFiles(d.files || [])
        } catch { /* ignore */ }
        setLoading(false)
    }, [])

    useEffect(() => { fetchFiles() }, [fetchFiles])

    const selectFile = useCallback(async (relPath: string) => {
        setSelectedPath(relPath)
        setIsEditing(false)
        setContentLoading(true)
        setContent('')
        try {
            const r = await fetch(
                `${API_BASE}/api/feature-dev/feature-status-files/content?path=${encodeURIComponent(relPath)}`,
                { headers: { 'x-api-token': API_TOKEN } }
            )
            const d = await r.json()
            setContent(d.content || '')
            setEditContent(d.content || '')
        } catch { /* ignore */ }
        setContentLoading(false)
    }, [])

    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const handleSave = async () => {
        if (!selectedPath) return
        setSaving(true)
        setSaveMsg('')
        try {
            const r = await fetch(
                `${API_BASE}/api/feature-dev/feature-status-files/content?path=${encodeURIComponent(selectedPath)}`,
                {
                    method: 'PATCH',
                    headers: { 'x-api-token': API_TOKEN, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: editContent })
                }
            )
            if (r.ok) {
                setContent(editContent)
                setIsEditing(false)
                setSaveMsg('✅ Saved')
                setTimeout(() => setSaveMsg(''), 2500)
            } else {
                setSaveMsg('⚠️ Save failed')
            }
        } catch {
            setSaveMsg('⚠️ Save failed')
        }
        setSaving(false)
    }

    const toggleFolder = (folder: string) => {
        setCollapsedFolders(prev => {
            const next = new Set(prev)
            if (next.has(folder)) next.delete(folder)
            else next.add(folder)
            return next
        })
    }

    // Group files by folder
    const grouped = FOLDER_ORDER.reduce<Record<string, StatusFile[]>>((acc, folder) => {
        acc[folder] = files.filter(f => f.folder === folder)
        return acc
    }, {})

    const hasAnyFiles = files.length > 0

    return (
        <div className="feature-status-panel">
            {/* Panel Header */}
            <div className="fsp-header">
                <div className="fsp-header-left">
                    <FileText size={14} style={{ color: '#6366f1' }} />
                    <span className="fsp-title">Feature Status Files</span>
                    <span className="fsp-subtitle">features-status/ · git tracked</span>
                </div>
                <button className="fsp-refresh-btn" onClick={fetchFiles} disabled={loading} title="Refresh file list">
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="fsp-body">
                {/* Left: File browser */}
                <div className="fsp-browser">
                    {loading && <div className="fsp-loading">Loading…</div>}
                    {!loading && !hasAnyFiles && (
                        <div className="fsp-empty">No .md files found in features-status/</div>
                    )}
                    {!loading && hasAnyFiles && FOLDER_ORDER.map(folder => {
                        const folderFiles = grouped[folder]
                        if (!folderFiles || folderFiles.length === 0) return null
                        const meta = FOLDER_META[folder] || { icon: '📁', color: '#6b7280' }
                        const collapsed = collapsedFolders.has(folder)

                        return (
                            <div key={folder} className="fsp-folder-group">
                                <button
                                    className="fsp-folder-header"
                                    onClick={() => toggleFolder(folder)}
                                    style={{ borderLeftColor: meta.color }}
                                >
                                    {collapsed
                                        ? <ChevronRight size={11} style={{ color: '#6b7280' }} />
                                        : <ChevronDown size={11} style={{ color: '#6b7280' }} />
                                    }
                                    <span className="fsp-folder-icon">{meta.icon}</span>
                                    <span className="fsp-folder-name">{folder}</span>
                                    <span className="fsp-folder-count">{folderFiles.length}</span>
                                </button>
                                {!collapsed && folderFiles.map(file => (
                                    <button
                                        key={file.relativePath}
                                        className={`fsp-file-item ${selectedPath === file.relativePath ? 'active' : ''}`}
                                        onClick={() => selectFile(file.relativePath)}
                                        title={file.relativePath}
                                    >
                                        <span className="fsp-file-name">{file.filename}</span>
                                        <span className="fsp-file-size">{formatBytes(file.sizeBytes)}</span>
                                    </button>
                                ))}
                            </div>
                        )
                    })}
                </div>

                {/* Right: Content viewer / editor */}
                <div className="fsp-viewer">
                    {!selectedPath && (
                        <div className="fsp-viewer-placeholder">
                            <FileText size={28} style={{ color: '#374151', marginBottom: '0.5rem' }} />
                            <p>Select a file to view or edit</p>
                        </div>
                    )}

                    {selectedPath && (
                        <>
                            {/* Viewer toolbar */}
                            <div className="fsp-viewer-toolbar">
                                <span className="fsp-viewer-path">{selectedPath}</span>
                                <div className="fsp-viewer-actions">
                                    {saveMsg && <span className="fsp-save-msg">{saveMsg}</span>}
                                    {!isEditing ? (
                                        <>
                                            <button className="fsp-action-btn" onClick={handleCopy} title="Copy raw markdown">
                                                {copied ? <><CheckCircle size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                                            </button>
                                            <button className="fsp-action-btn" onClick={() => { setIsEditing(true); setEditContent(content) }} title="Edit this file">
                                                <Edit3 size={11} /> Edit
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="fsp-action-btn cancel" onClick={() => setIsEditing(false)} title="Cancel editing">
                                                <X size={11} /> Cancel
                                            </button>
                                            <button className="fsp-action-btn save" onClick={handleSave} disabled={saving} title="Save to disk">
                                                <Save size={11} /> {saving ? 'Saving…' : 'Save'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="fsp-viewer-content">
                                {contentLoading && <div className="fsp-loading">Loading…</div>}
                                {!contentLoading && isEditing && (
                                    <textarea
                                        className="fsp-editor"
                                        value={editContent}
                                        onChange={e => setEditContent(e.target.value)}
                                        spellCheck={false}
                                    />
                                )}
                                {!contentLoading && !isEditing && content && (
                                    <div className="md-prose fsp-prose">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    const inline = !match
                                                    return inline ? (
                                                        <code className="md-inline-code" {...props}>{children}</code>
                                                    ) : (
                                                        <pre className="md-code-block"><code className={className}>{children}</code></pre>
                                                    )
                                                },
                                                table({ children }: any) {
                                                    return <div className="md-table-wrap"><table>{children}</table></div>
                                                }
                                            }}
                                        >
                                            {content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
