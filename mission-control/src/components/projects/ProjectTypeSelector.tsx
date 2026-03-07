/**
 * Project Type Selector Component
 *
 * Allows users to select which agent teams to enable:
 * - Development: Shows development subagents (Codebase Research, Coding, Debugging, etc.)
 * - Business: Shows business agents (Researcher, Developer, Marketer, etc.)
 */

'use client';

import { useState } from 'react';
import { Code, Briefcase, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProjectTypeSelection {
  development: boolean;
  business: boolean;
}

interface ProjectTypeSelectorProps {
  value: ProjectTypeSelection;
  onChange: (selection: ProjectTypeSelection) => void;
  className?: string;
}

export function ProjectTypeSelector({
  value,
  onChange,
  className,
}: ProjectTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<'development' | 'business' | null>(null);

  const toggleType = (type: 'development' | 'business') => {
    onChange({
      ...value,
      [type]: !value[type],
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        What type of project is this?
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Select the agent teams that will help with this project
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Development Option */}
        <button
          type="button"
          onClick={() => toggleType('development')}
          onMouseEnter={() => setHoveredType('development')}
          onMouseLeave={() => setHoveredType(null)}
          className={cn(
            'relative p-6 rounded-xl border-2 transition-all text-left',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500',
            value.development
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          )}
        >
          {/* Checkbox indicator */}
          <div
            className={cn(
              'absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
              value.development
                ? 'border-orange-500 bg-orange-500 text-white'
                : 'border-gray-300 dark:border-gray-600'
            )}
          >
            {value.development && <Check className="w-4 h-4" />}
          </div>

          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                value.development
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              )}
            >
              <Code className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Development
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Code, debug, test, and research for technical implementation
              </p>

              {/* Preview of agents */}
              {(hoveredType === 'development' || value.development) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['Codebase Research', 'Web Research', 'Coding', 'Planning', 'Debugging', 'Testing'].map(
                    (agent) => (
                      <span
                        key={agent}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      >
                        {agent}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Business Option */}
        <button
          type="button"
          onClick={() => toggleType('business')}
          onMouseEnter={() => setHoveredType('business')}
          onMouseLeave={() => setHoveredType(null)}
          className={cn(
            'relative p-6 rounded-xl border-2 transition-all text-left',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500',
            value.business
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          )}
        >
          {/* Checkbox indicator */}
          <div
            className={cn(
              'absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
              value.business
                ? 'border-orange-500 bg-orange-500 text-white'
                : 'border-gray-300 dark:border-gray-600'
            )}
          >
            {value.business && <Check className="w-4 h-4" />}
          </div>

          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                value.business
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              )}
            >
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Business</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Marketing, strategy, research, and business operations
              </p>

              {/* Preview of agents */}
              {(hoveredType === 'business' || value.business) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['Researcher', 'Developer', 'Marketer', 'Business Analyst', 'Tester'].map((agent) => (
                    <span
                      key={agent}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Validation message */}
      {!value.development && !value.business && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Please select at least one project type
        </p>
      )}

      {/* Both selected message */}
      {value.development && value.business && (
        <p className="text-sm text-green-600 dark:text-green-400">
          All agent teams will be available for this project
        </p>
      )}
    </div>
  );
}
