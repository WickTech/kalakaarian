import { CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';
import { TIMELINE_STAGES, STAGE_LABELS, WorkflowStage } from '@/lib/workflow';

interface StageTimelineProps {
  currentStage: WorkflowStage | null;
}

export function StageTimeline({ currentStage }: StageTimelineProps) {
  const isRejected = currentStage === 'rejected_workflow';

  function stageState(stage: WorkflowStage): 'completed' | 'active' | 'pending' {
    if (isRejected) return 'pending';
    if (!currentStage) return 'pending';
    const ci = TIMELINE_STAGES.indexOf(currentStage as WorkflowStage);
    const si = TIMELINE_STAGES.indexOf(stage);
    if (ci === -1) return 'pending';
    if (si < ci) return 'completed';
    if (si === ci) return 'active';
    return 'pending';
  }

  return (
    <div className="w-full">
      {isRejected && (
        <div className="flex items-center gap-2 mb-4 text-red-400 text-sm font-medium">
          <XCircle className="w-4 h-4" />
          Proposal rejected
        </div>
      )}
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {TIMELINE_STAGES.map((stage, i) => {
          const state = stageState(stage);
          return (
            <div key={stage} className="flex items-center min-w-0">
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0
                  transition-all duration-300
                  ${state === 'completed' ? 'border-purple-500 bg-purple-500/20 text-purple-400' : ''}
                  ${state === 'active' ? 'border-gold bg-gold/10 text-gold ring-2 ring-gold/20 ring-offset-1 ring-offset-transparent' : ''}
                  ${state === 'pending' ? 'border-white/20 bg-transparent text-chalk-dim' : ''}
                `}>
                  {state === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : state === 'active' ? (
                    <Clock className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Circle className="w-4 h-4 opacity-40" />
                  )}
                </div>
                <span className={`text-xs mt-1 text-center whitespace-nowrap max-w-[72px] leading-tight
                  transition-colors duration-300
                  ${state === 'active' ? 'text-gold font-medium' : state === 'completed' ? 'text-purple-400' : 'text-chalk-dim'}
                `}>
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              {i < TIMELINE_STAGES.length - 1 && (
                <div className={`h-0.5 w-6 mx-1 shrink-0 mt-[-16px] transition-colors duration-300
                  ${state === 'completed' ? 'bg-purple-500' : 'bg-white/10'}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
