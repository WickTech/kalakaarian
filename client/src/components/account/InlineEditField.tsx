import { useRef, useState } from 'react';
import { Pencil, Check, X, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'image';

export interface InlineEditFieldProps {
  label: string;
  value: string | string[];
  type?: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  maxLength?: number;
  display?: (v: string | string[]) => React.ReactNode;
  onSave: (next: string | string[]) => Promise<void>;
  disabled?: boolean;
  hint?: string;
}

export function InlineEditField(props: InlineEditFieldProps) {
  const { label, value, type = 'text', placeholder, options, maxLength, display, onSave, disabled, hint } = props;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | string[]>(value);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const start = () => { setDraft(value); setEditing(true); };
  const cancel = () => { setDraft(value); setEditing(false); };

  const commit = async (next: string | string[]) => {
    setSaving(true);
    try {
      await onSave(next);
      toast({ title: `${label} updated` });
      setEditing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast({ title: msg, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleImageFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast({ title: 'Image exceeds 2MB', variant: 'destructive' }); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      void commit(result);
    };
    reader.readAsDataURL(file);
  };

  const renderRead = () => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-chalk-faint">{label}</p>
        <div className="mt-1 text-sm text-chalk break-words">
          {display ? display(value) : Array.isArray(value) ? value.join(', ') || '—' : value || '—'}
        </div>
        {hint && <p className="mt-1 text-[11px] text-chalk-faint">{hint}</p>}
      </div>
      {!disabled && (
        <button onClick={start} className="shrink-0 p-1.5 rounded-md text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors" aria-label={`Edit ${label}`}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  const inputCls = 'w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-chalk focus:border-purple-500 focus:outline-none';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      {!editing && renderRead()}
      {editing && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wide text-chalk-faint">{label}</p>
          {type === 'text' && (
            <input value={String(draft)} maxLength={maxLength} placeholder={placeholder} onChange={e => setDraft(e.target.value)} className={inputCls} />
          )}
          {type === 'textarea' && (
            <textarea value={String(draft)} maxLength={maxLength} placeholder={placeholder} rows={4} onChange={e => setDraft(e.target.value)} className={inputCls + ' resize-none'} />
          )}
          {type === 'select' && options && (
            <select value={String(draft)} onChange={e => setDraft(e.target.value)} className={inputCls}>
              <option value="">Select…</option>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          {type === 'multiselect' && options && (
            <div className="flex flex-wrap gap-1.5">
              {options.map(o => {
                const arr = Array.isArray(draft) ? draft : [];
                const active = arr.includes(o.value);
                return (
                  <button key={o.value} type="button"
                    onClick={() => setDraft(active ? arr.filter(x => x !== o.value) : [...arr, o.value])}
                    className={`px-2.5 py-1.5 rounded-full text-xs border transition-colors ${active ? 'border-purple-500/50 bg-purple-500/10 text-chalk' : 'border-white/10 text-chalk-dim hover:border-white/20'}`}>
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}
          {type === 'image' && (
            <div className="flex items-center gap-3">
              {typeof draft === 'string' && draft && <img src={draft} alt="preview" className="w-16 h-16 rounded-full object-cover border border-white/10" />}
              <button type="button" onClick={() => fileRef.current?.click()} disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 text-sm text-chalk-dim hover:text-chalk hover:bg-white/5 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Choose image
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
            </div>
          )}
          {type !== 'image' && (
            <div className="flex justify-end gap-2">
              <button onClick={cancel} disabled={saving} className="px-3 py-1.5 rounded-md text-xs text-chalk-dim hover:text-chalk hover:bg-white/5 transition-colors">
                <X className="w-3.5 h-3.5 inline mr-1" />Cancel
              </button>
              <button onClick={() => commit(draft)} disabled={saving}
                className="px-3 py-1.5 rounded-md text-xs bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : <Check className="w-3.5 h-3.5 inline mr-1" />}
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
