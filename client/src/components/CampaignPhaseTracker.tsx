import { Check, Users, Video, Upload, Wallet, XCircle } from 'lucide-react';

const PHASES = [
  { key: 'selection', label: 'Creator Selection', Icon: Users  },
  { key: 'shooting',  label: 'Shooting Started',  Icon: Video  },
  { key: 'uploaded',  label: 'Video Uploaded',    Icon: Upload },
  { key: 'paid',      label: 'Payment Done',      Icon: Wallet },
] as const;

const STAGE_TO_PHASE: Record<string, number> = {
  shortlisted: 0, accepted: 0,
  content_in_progress: 1, submitted: 1,
  under_review: 2, approved: 2,
  payment_pending: 3, payment_released: 3,
};

const PHASE_DONE_AT: Record<string, number> = {
  shortlisted: -1, accepted: 0,
  content_in_progress: 0, submitted: 1,
  under_review: 1, approved: 2,
  payment_pending: 2, payment_released: 3,
};

interface Props {
  currentStage: string | null;
  compact?: boolean;
}

export function CampaignPhaseTracker({ currentStage, compact = false }: Props) {
  if (currentStage === 'rejected_workflow') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400 font-medium py-1">
        <XCircle className="w-4 h-4 shrink-0" />
        Campaign rejected
      </div>
    );
  }

  const activePhase = currentStage ? STAGE_TO_PHASE[currentStage] ?? -1 : -1;
  const lastDone   = currentStage ? PHASE_DONE_AT[currentStage] ?? -1 : -1;

  const sz   = compact ? 'w-8 h-8'  : 'w-10 h-10';
  const ic   = compact ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const top  = compact ? 'top-[16px]'  : 'top-[20px]';
  const N    = PHASES.length;
  const trackLeft  = `${100 / (2 * N)}%`;
  const trackWidth = `${100 - 100 / N}%`;
  const progress   = activePhase < 0 ? 0 : (activePhase / (N - 1));
  const fillWidth  = `${progress * (100 - 100 / N)}%`;

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="relative" style={{ minWidth: compact ? '260px' : '380px' }}>
        <div className={`absolute ${top} h-px bg-white/10`} style={{ left: trackLeft, width: trackWidth }} />
        <div
          className={`absolute ${top} h-px bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-700 ease-out`}
          style={{ left: trackLeft, width: fillWidth }}
        />
        <div className="flex">
          {PHASES.map(({ key, label, Icon }, i) => {
            const done    = i <= lastDone;
            const current = i === activePhase && !done;
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`
                  ${sz} rounded-full border-2 flex items-center justify-center transition-all duration-500
                  ${done    ? 'border-purple-500 bg-purple-500/20' : ''}
                  ${current ? 'border-purple-400 bg-purple-400/10 shadow-[0_0_16px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/30 ring-offset-1 ring-offset-obsidian' : ''}
                  ${!done && !current ? 'border-white/10 bg-white/[0.02]' : ''}
                `}>
                  {done
                    ? <Check className={`${ic} text-purple-400`} />
                    : <Icon className={`${ic} ${current ? 'text-purple-300' : 'text-white/20'}`} />}
                </div>
                {!compact && (
                  <span className={`text-[10px] leading-tight text-center font-medium px-0.5
                    ${current ? 'text-purple-300' : done ? 'text-chalk-dim' : 'text-white/25'}
                  `}>{label}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
