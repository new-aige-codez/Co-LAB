'use client'
import React, { useState, useEffect } from 'react'
import { useKanbanStore } from '@/store/kanbanStore'

interface AIServiceSelectorProps {
    value: string
    onChange: (value: string) => void
    modelValue: string
    onModelChange: (value: string) => void
    customServiceName?: string
    onCustomServiceChange?: (value: string) => void
    customModelName?: string
    onCustomModelChange?: (value: string) => void
    label?: string
    required?: boolean
}

export function AIServiceSelector({
    value,
    onChange,
    modelValue,
    onModelChange,
    customServiceName = '',
    onCustomServiceChange,
    customModelName = '',
    onCustomModelChange,
    label = 'AI Service',
    required = false,
}: AIServiceSelectorProps) {
    const { aiServices, loadAIServices, isLoadingServices } = useKanbanStore()
    const [showCustomService, setShowCustomService] = useState(false)
    const [showCustomModel, setShowCustomModel] = useState(false)

    // Load AI services on mount
    useEffect(() => {
        if (aiServices.length === 0) {
            loadAIServices()
        }
    }, [aiServices.length, loadAIServices])

    // Get models for selected service
    const selectedService = aiServices.find(s => s.id === value)
    const availableModels = selectedService?.models || []

    const handleServiceChange = (newValue: string) => {
        if (newValue === 'other') {
            setShowCustomService(true)
            onChange('')
        } else {
            setShowCustomService(false)
            onChange(newValue)
            onModelChange('') // Reset model when service changes
        }
    }

    const handleModelChange = (newValue: string) => {
        if (newValue === 'other') {
            setShowCustomModel(true)
            onModelChange('')
        } else {
            setShowCustomModel(false)
            onModelChange(newValue)
        }
    }

    return (
        <div className="ai-service-selector">
            {/* Service Dropdown */}
            <label className="mw-label">
                {label}
                {required && <span style={{ color: '#ef4444' }}> *</span>}
            </label>
            <select
                className="mw-select"
                value={showCustomService ? 'other' : value}
                onChange={e => handleServiceChange(e.target.value)}
                disabled={isLoadingServices}
            >
                <option value="">None (Manual)</option>
                {aiServices.map(s => (
                    <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                    </option>
                ))}
                <option value="other">Other...</option>
            </select>

            {/* Custom Service Input */}
            {showCustomService && onCustomServiceChange && (
                <input
                    className="mw-input"
                    placeholder="Enter service name..."
                    value={customServiceName}
                    onChange={e => onCustomServiceChange(e.target.value)}
                    style={{ marginTop: '0.5rem' }}
                />
            )}

            {/* Model Dropdown */}
            {(value || showCustomService) && availableModels.length > 0 && !showCustomService && (
                <div style={{ marginTop: '0.5rem' }}>
                    <label className="mw-label">Model</label>
                    <select
                        className="mw-select"
                        value={showCustomModel ? 'other' : modelValue}
                        onChange={e => handleModelChange(e.target.value)}
                    >
                        <option value="">Select model...</option>
                        {availableModels.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.display_name || m.name}
                            </option>
                        ))}
                        <option value="other">Other model...</option>
                    </select>
                </div>
            )}

            {/* Custom Model Input */}
            {showCustomModel && onCustomModelChange && (
                <input
                    className="mw-input"
                    placeholder="Enter model name..."
                    value={customModelName}
                    onChange={e => onCustomModelChange(e.target.value)}
                    style={{ marginTop: '0.5rem' }}
                />
            )}
        </div>
    )
}

// Compact badge display for showing selected service/model
interface AIServiceBadgeProps {
    serviceId: string | null
    modelName: string | null
    customService?: string | null
    customModel?: string | null
}

export function AIServiceBadge({ serviceId, modelName, customService, customModel }: AIServiceBadgeProps) {
    const { aiServices } = useKanbanStore()

    if (!serviceId && !customService) return null

    const service = aiServices.find(s => s.id === serviceId)
    const serviceName = customService || service?.name || 'Unknown'
    const serviceIcon = service?.icon || '🤖'

    // Find model display name
    let modelDisplay = ''
    if (customModel) {
        modelDisplay = customModel
    } else if (modelName && service) {
        const model = service.models?.find(m => m.id === modelName)
        modelDisplay = model?.display_name || model?.name || modelName
    }

    return (
        <span className="ai-service-badge">
            {serviceIcon} {serviceName}
            {modelDisplay && <span className="ai-model-badge">/ {modelDisplay}</span>}
        </span>
    )
}
