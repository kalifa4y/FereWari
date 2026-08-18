import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface WizardStep {
  id: string;
  title: string;
  shortTitle?: string;
  description?: string;
  icon?: React.ReactNode;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
  maxAccessibleStepIndex?: number;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
  maxAccessibleStepIndex = steps.length - 1,
}) => {
  const currentStep = steps[currentStepIndex];
  const progressPercent = ((currentStepIndex) / (steps.length - 1)) * 100;

  return (
    <div className="w-full mb-6">
      {/* Mobile view (< sm): Compact bar with step title */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-brand-vibrant uppercase tracking-wider text-[11px]">
            Étape {currentStepIndex + 1} sur {steps.length}
          </span>
          <span className="font-black text-brand-navy truncate max-w-[200px]">
            {currentStep?.title}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-brand-primary to-brand-vibrant transition-all duration-300 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop / Tablet view (>= sm): Rich stepper */}
      <div className="hidden sm:block">
        <div className="relative flex items-center justify-between">
          {/* Connecting line background */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0" />

          {/* Active progress line */}
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-brand-primary to-brand-vibrant rounded-full z-0 transition-all duration-500"
            style={{ width: `calc(${progressPercent}% * (1 - 48px / 100%))` }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isClickable = onStepClick && (idx <= maxAccessibleStepIndex || idx <= currentStepIndex + 1);

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick && onStepClick(idx)}
                className={clsx(
                  'relative z-10 flex flex-col items-center group focus:outline-none transition-all duration-200',
                  !isClickable && 'cursor-default'
                )}
              >
                {/* Step Circle */}
                <div
                  className={clsx(
                    'w-10 h-10 rounded-2xl flex items-center justify-center font-display font-black text-sm transition-all duration-300 shadow-sm',
                    isCompleted
                      ? 'bg-brand-primary text-white scale-95 shadow-brand-primary/20'
                      : isCurrent
                      ? 'bg-gradient-to-br from-brand-navy to-brand-vibrant text-white ring-4 ring-brand-pale ring-offset-2 scale-110 shadow-md'
                      : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-slate-300'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : step.icon ? (
                    <span className="w-5 h-5 flex items-center justify-center">{step.icon}</span>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={clsx(
                      'text-xs font-bold transition-colors duration-200 whitespace-nowrap',
                      isCurrent
                        ? 'text-brand-navy font-black'
                        : isCompleted
                        ? 'text-brand-primary'
                        : 'text-slate-400'
                    )}
                  >
                    {step.shortTitle || step.title}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-slate-400 max-w-[100px] truncate hidden md:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
