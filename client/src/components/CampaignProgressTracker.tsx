import { Check, Flag, Users, FileText, Video, Eye, Package, Wallet, RotateCcw, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STAGES = [
  { key: 'created',             label: 'Campaign\nCreated',   Icon: Flag     },
  { key: 'shortlisted',         label: 'Creators\nNotified',  Icon: Users    },
  { key: 'accepted',            label: 'Scripts\nReviewed',   Icon: FileText },
  { key: 'content_in_progress', label: 'Content\nCreated',    Icon: Video    },
  { key: 'under_review',        label: 'Brand\nReview',       Icon: Eye      },
  { key: 'approved',            label: 'Content\nDelivered',  Icon: Package  },
  { key: 'payment_released',    label: 'Payment\nReleased',   Icon: Wallet   },
] as const;

const STAGE_IDX: Record<string, number> = {
  shortlisted: 1, accepted: 2,
  content_in_progress: 3, submitted: 3,
  under_review: 4,
  approved: 5, payment_pending: 5,
  payment_released: 6,
};

interface Props {
  currentStage: string | null;
  updatedAt?: string | null;
  compact?: boolean;
  isRevision?: boolean;
}

export function CampaignProgressTracker({ currentStage, updatedAt, compact = false, isRevision }: Props) {
  const N = STAGES.length;
  const rejected = currentStage === 'rejected_workflow';
  const activeIdx = rejected ? -1 : (currentStage ? (STAGE_IDX[currentStage] ?? 0) : 0);

  // Track spans from center of first circle to center of last (each item = 1/N width)
  const trackLeft   = `${100 / (2 * N)}%`;
  const trackWidth  = `${100 - 100 / N}%`;
  const fillWidth   = activeIdx <= 0 ? '0%' : `${(activeIdx / (N - 1)) * (100 - 100 / N)}%`;

  const sz = compact ? 'w-7 h-7' : 'w-9 h-9';
  const ic = compact ? 'w-3 h-3' : 'w-4 h-4';
  const top = compact ? 'top-[14px]' : 'top-[18px]';

  if (rejected) return (
    <div className="flex items-center gap-2 text-xs text-red-400 font-medium py-1">
      <XCircle className="w-4 h-4 shrink-0" />
      Campaign rejected
    </div>
  );

  return (
    <div className="relative overflow-x-auto w-full">
      <div className="relative" style={{ minWidth: compact ? '280px' : '400px' }}>
        {/* Track background */}
        <div className={`absolute ${top} h-px bg-white/8`} style={{ left: trackLeft, width: trackWidth }} />
        {/* Track fill */}
        <div
          className={`absolute ${top} h-px bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-700 ease-out`}
          style={{ left: trackLeft, width: fillWidth }}
        />
        {/* Circles */}
        <div className="flex">
          {STAGES.map(({ key, label, Icon }, i) => {
            const done    = i < activeIdx;
            const current = i === activeIdx;
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative">
                  <div className={`
                    ${sz} rounded-full border-2 flex items-center justify-center
                    transition-all duration-500
                    ${done    ? 'border-purple-500 bg-purple-500/20' : ''}
                    ${current ? 'border-purple-400 bg-purple-400/10 shadow-[0_0_14px_rgba(168,85,247,0.45)] ring-2 ring-purple-400/25 ring-offset-1 ring-offset-obsidian' : ''}
                    ${!done && !current ? 'border-white/10 bg-white/[0.02]' : ''}
                  `}>
                    {done
                      ? <Check className={`${ic} text-purple-400`} />
                      : <Icon className={`${ic} ${current ? 'text-purple-300' : 'text-white/18'}`} />
                    }
                  </div>
                  {current && isRevision && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
                      <RotateCcw className="w-2 h-2 text-obsidian" />
                    </span>
                  )}
                </div>
                {!compact && (
                  <div className="flex flex-col items-center">
                    <span className={`text-[9px] leading-tight text-center whitespace-pre-line font-medium px-0.5
                      ${current ? 'text-purple-300' : done ? 'text-chalk-dim/60' : 'text-white/18'}
                    `}>{label}</span>
                    {current && updatedAt && (
                      <span className="text-[8px] text-chalk-faint mt-0.5">
                        {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
