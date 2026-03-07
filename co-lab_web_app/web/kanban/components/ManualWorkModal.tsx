'use client'
import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useFeatureDevStore } from '@/store/featureDevStore'
import { useKanbanStore, type AIService, type AIModel } from '@/store/kanbanStore'

export default function ManualWorkModal() {
    const { showManualWork, currentJob, toggleManualWork, submitManualWork } = useFeatureDevStore()
    const { aiServices, loadAIServices } = useKanbanStore()
    const [phase, setPhase] = useState<'research' | 'development' | 'testing' | 'review'>('development')
    const [description, setDescription] = useState('')
    const [filePath, setFilePath] = useState('')
    const [filePaths, setFilePaths] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // AI Service state
    const [aiServiceId, setAiServiceId] = useState('')
    const [aiModelId, setAiModelId] = useState('')
    const [customServiceName, setCustomServiceName] = useState('')
    const [customModelName, setCustomModelName] = useState('')

    // Load AI services on mount
    useEffect(() => {
        if (showManualWork && aiServices.length === 0) {
            loadAIServices()
        }
    }, [showManualWork, aiServices.length, loadAIServices])

    // Get models for selected service
    const selectedService = aiServices.find(s => s.id === aiServiceId)
    const availableModels = selectedService?.models || []

    if (!showManualWork || !currentJob) return null

    const addPath = () => {
        if (filePath.trim()) {
            setFilePaths(p => [...p, filePath.trim()])
            setFilePath('')
        }
    }

    const removePath = (i: number) => setFilePaths(p => p.filter((_, idx) => idx !== i))

    const handleSubmit = async () => {
        if (description.length < 10) { setError('Please describe what you did (10+ chars)'); return }
        setSubmitting(true); setError('')

        // Determine if custom service/model
        const serviceId = aiServiceId === 'other' ? undefined : aiServiceId || undefined
        const modelId = aiModelId === 'other' ? undefined : aiModelId || undefined
        const customSvc = aiServiceId === 'other' ? customServiceName : undefined
        const customMod = aiModelId === 'other' ? customModelName : undefined

        await submitManualWork(
            currentJob.id,
            phase,
            description,
            filePaths,
            serviceId,
            modelId,
            customSvc,
            customMod
        )
        setSubmitting(false)
        setDescription(''); setFilePaths([]); setFilePath('')
        setAiServiceId(''); setAiModelId(''); setCustomServiceName(''); setCustomModelName('')
    }

    const phaseDescriptions: Record<string, string> = {
        research: 'Manually researched the feature or gathered info',
        development: 'Manually wrote or edited code for this feature',
        testing: 'Manually tested the feature and verified it works',
        review: 'Reviewed the code or documentation',
    }

    return (
        <div className="summary-overlay" onClick={e => { if (e.target === e.currentTarget) toggleManualWork() }}>
            <div className="manual-work-modal">
                <div className="summary-header">
                    <div>
                        <h2>Submit Manual Work</h2>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>
                            {currentJob.feature_name}
                        </p>
                    </div>
                    <button className="summary-close-btn" onClick={toggleManualWork}><X size={14} /></button>
                </div>

                <div className="manual-work-form">
                    {/* Phase */}
                    <label className="mw-label">Phase</label>
                    <div className="mw-phase-grid">
                        {(['research', 'development', 'testing', 'review'] as const).map(p => (
                            <button key={p} onClick={() => setPhase(p)}
                                className={`mw-phase-btn ${phase === p ? 'active' : ''}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <p className="mw-hint">{phaseDescriptions[phase]}</p>

                    {/* AI Service Used */}
                    <label className="mw-label">AI Service Used <span style={{ color: '#6b7280' }}>(optional)</span></label>
                    <select
                        className="mw-select"
                        value={aiServiceId}
                        onChange={e => { setAiServiceId(e.target.value); setAiModelId('') }}
                    >
                        <option value="">None (Manual work only)</option>
                        {aiServices.map(s => (
                            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                        ))}
                        <option value="other">Other...</option>
                    </select>

                    {/* Custom service name if "other" selected */}
                    {aiServiceId === 'other' && (
                        <input
                            className="mw-input"
                            placeholder="Enter service name..."
                            value={customServiceName}
                            onChange={e => setCustomServiceName(e.target.value)}
                            style={{ marginTop: '0.5rem' }}
                        />
                    )}

                    {/* Model selection if service selected */}
                    {aiServiceId && aiServiceId !== 'other' && availableModels.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <label className="mw-label">Model</label>
                            <select
                                className="mw-select"
                                value={aiModelId}
                                onChange={e => setAiModelId(e.target.value)}
                            >
                                <option value="">Select model...</option>
                                {availableModels.map(m => (
                                    <option key={m.id} value={m.id}>{m.display_name || m.name}</option>
                                ))}
                                <option value="other">Other model...</option>
                            </select>
                        </div>
                    )}

                    {/* Custom model name if "other" selected */}
                    {aiModelId === 'other' && (
                        <input
                            className="mw-input"
                            placeholder="Enter model name..."
                            value={customModelName}
                            onChange={e => setCustomModelName(e.target.value)}
                            style={{ marginTop: '0.5rem' }}
                        />
                    )}

                    {/* Description */}
                    <label className="mw-label">What did you do?</label>
                    <textarea
                        className="mw-textarea"
                        placeholder="Describe the work you did manually…"
                        value={description}
                        onChange={e => { setDescription(e.target.value); setError('') }}
                        rows={4}
                    />

                    {/* File Paths */}
                    <label className="mw-label">Files touched <span style={{ color: '#6b7280' }}>(optional)</span></label>
                    <div className="mw-file-row">
                        <input
                            className="mw-input"
                            placeholder="C:\path\to\file.ts"
                            value={filePath}
                            onChange={e => setFilePath(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addPath()}
                        />
                        <button className="mw-add-btn" onClick={addPath}><Plus size={14} /></button>
                    </div>
                    <div className="mw-file-list">
                        {filePaths.map((fp, i) => (
                            <div key={i} className="mw-file-item">
                                <span className="mw-file-path">{fp}</span>
                                <button onClick={() => removePath(i)}><Trash2 size={11} /></button>
                            </div>
                        ))}
                    </div>

                    {error && <p className="mw-error">{error}</p>}

                    <button
                        className="mw-submit-btn"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting…' : 'Submit Work'}
                    </button>
                </div>
            </div>
        </div>
    )
}
