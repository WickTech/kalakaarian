import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FEEDBACK_CATEGORIES = ['creative', 'brief_match', 'quality', 'timing', 'compliance'] as const;
const FEEDBACK_SEVERITIES = ['minor', 'major', 'blocking'] as const;

type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];
type FeedbackSeverity = typeof FEEDBACK_SEVERITIES[number];

interface FeedbackPayload {
  category: FeedbackCategory;
  severity: FeedbackSeverity;
  required_changes: string[];
  notes?: string;
}

// ─── Submit Content Dialog (creator) ─────────────────────────────────────────

interface SubmitContentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { url: string; platform: string; notes?: string }) => void;
  loading: boolean;
}

export function SubmitContentDialog({ open, onClose, onSubmit, loading }: SubmitContentDialogProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    if (!url.trim() || !platform.trim()) return;
    onSubmit({ url: url.trim(), platform: platform.trim(), notes: notes.trim() || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-charcoal border-white/10">
        <DialogHeader>
          <DialogTitle className="text-chalk">Submit Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-chalk-dim text-sm mb-1 block">Content URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="bg-white/5 border-white/10 text-chalk"
            />
          </div>
          <div>
            <Label className="text-chalk-dim text-sm mb-1 block">Platform</Label>
            <Input
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Instagram, YouTube…"
              className="bg-white/5 border-white/10 text-chalk"
            />
          </div>
          <div>
            <Label className="text-chalk-dim text-sm mb-1 block">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for the brand…"
              className="bg-white/5 border-white/10 text-chalk resize-none"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/20 text-chalk-dim">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !url.trim() || !platform.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? 'Submitting…' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Feedback / Request Revision Dialog (brand) ───────────────────────────────

interface FeedbackDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (data: FeedbackPayload) => void;
  loading: boolean;
}

export function FeedbackDialog({ open, title, onClose, onSubmit, loading }: FeedbackDialogProps) {
  const [category, setCategory] = useState<FeedbackCategory>('creative');
  const [severity, setSeverity] = useState<FeedbackSeverity>('minor');
  const [changesText, setChangesText] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    const required_changes = changesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (!required_changes.length) return;
    onSubmit({ category, severity, required_changes, notes: notes.trim() || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-charcoal border-white/10">
        <DialogHeader>
          <DialogTitle className="text-chalk">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-chalk-dim text-sm mb-1 block">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-chalk">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-charcoal border-white/10">
                {FEEDBACK_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-chalk capitalize">{c.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-chalk-dim text-sm mb-1 block">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as FeedbackSeverity)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-chalk">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-charcoal border-white/10">
                {FEEDBACK_SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s} className="text-chalk capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-chalk-dim text-sm mb-1 block">Required Changes (one per line, max 10)</Label>
            <Textarea
              value={changesText}
              onChange={(e) => setChangesText(e.target.value)}
              placeholder="Change 1&#10;Change 2"
              className="bg-white/5 border-white/10 text-chalk resize-none"
              rows={4}
            />
          </div>
          <div>
            <Label className="text-chalk-dim text-sm mb-1 block">Additional Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/5 border-white/10 text-chalk resize-none"
              rows={2}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/20 text-chalk-dim">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !changesText.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? 'Sending…' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
