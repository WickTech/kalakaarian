import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Plus, X, Upload, CheckCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CampaignFile {
  fileUrl: string;
  fileName: string;
  fileType: "brief" | "contract" | "other";
}

const PLATFORMS = ["Instagram", "YouTube", "TikTok", "Multiple"] as const;
const NICHES = ["Fashion", "Tech", "Food", "Fitness", "Beauty", "Lifestyle", "Gaming", "Travel"] as const;
const FILE_TYPES = ["brief", "contract", "other"] as const;

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: undefined as Date | undefined,
    deliverables: "",
    platform: "" as typeof PLATFORMS[number] | "",
    niche: "" as typeof NICHES[number] | "",
  });
  const [files, setFiles] = useState<CampaignFile[]>([]);
  const [newFile, setNewFile] = useState<CampaignFile>({ fileUrl: "", fileName: "", fileType: "brief" });
  const [showFileForm, setShowFileForm] = useState(false);
  const [createdTitle, setCreatedTitle] = useState("");

  const handleAddFile = () => {
    if (newFile.fileUrl && newFile.fileName) {
      setFiles([...files, newFile]);
      setNewFile({ fileUrl: "", fileName: "", fileType: "brief" });
      setShowFileForm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const campaign = await api.createCampaign({
        title: formData.title,
        description: formData.description,
        budget: Number(formData.budget),
        deadline: formData.deadline?.toISOString() || "",
        deliverables: formData.deliverables,
        platform: formData.platform,
        niche: formData.niche,
      });
      for (const file of files) {
        await api.uploadCampaignFile(campaign._id, file.fileUrl, file.fileName, file.fileType);
      }
      setCreatedTitle(formData.title);
      setDone(true);
      toast({ title: "Campaign Created", description: "Your campaign is live and awaiting proposals." });
    } catch {
      toast({ title: "Error", description: "Failed to create campaign. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-obsidian flex items-center justify-center px-4">
        <div className="bento-card p-10 max-w-sm w-full text-center space-y-5">
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
          <div>
            <p className="font-display font-bold text-chalk text-xl mb-1">Campaign Created!</p>
            <p className="text-chalk-dim text-sm">"{createdTitle}" is live and ready for creator proposals.</p>
          </div>
          <button onClick={() => navigate("/brand/dashboard")} className="purple-pill w-full py-2.5">
            View Dashboard →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-obsidian px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/brand/dashboard" className="inline-flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="font-display text-2xl font-bold text-chalk">Create New Campaign</h1>
          <p className="text-chalk-dim text-sm mt-1">Fill in the details to attract the right creators.</p>
        </div>

        <form onSubmit={handleSubmit} className="bento-card p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs text-chalk-faint uppercase tracking-widest">Campaign Title *</label>
            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Summer Collection Launch" className="dark-input w-full" required />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs text-chalk-faint uppercase tracking-widest">Description *</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your campaign goals and requirements" rows={3}
              className="dark-input w-full resize-none" required />
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-xs text-chalk-faint uppercase tracking-widest">Total Budget (₹) *</label>
            <input type="number" min="0" value={formData.budget}
              onChange={e => setFormData({ ...formData, budget: e.target.value })}
              placeholder="e.g. 50000" className="dark-input w-full" required />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="text-xs text-chalk-faint uppercase tracking-widest">Deadline</label>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="dark-input w-full flex items-center gap-2 text-left">
                  <CalendarIcon className="w-4 h-4 text-chalk-faint" />
                  <span className={formData.deadline ? "text-chalk" : "text-chalk-faint"}>
                    {formData.deadline ? formData.deadline.toLocaleDateString("en-IN") : "Select deadline"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-charcoal border-white/10" align="start">
                <Calendar mode="single" selected={formData.deadline}
                  onSelect={date => setFormData({ ...formData, deadline: date })} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Deliverables */}
          <div className="space-y-1.5">
            <label className="text-xs text-chalk-faint uppercase tracking-widest">Deliverables *</label>
            <textarea value={formData.deliverables} onChange={e => setFormData({ ...formData, deliverables: e.target.value })}
              placeholder="e.g. 1 Instagram Reel + 2 Stories" rows={2}
              className="dark-input w-full resize-none" required />
          </div>

          {/* Platform chips */}
          <div className="space-y-2">
            <label className="text-xs text-chalk-faint uppercase tracking-widest">Target Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p} type="button" onClick={() => setFormData({ ...formData, platform: p })}
                  className={`goal-chip text-xs px-3 py-1.5 ${formData.platform === p ? "border-gold text-gold" : ""}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Niche chips */}
          <div className="space-y-2">
            <label className="text-xs text-chalk-faint uppercase tracking-widest">Target Niche</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button key={n} type="button" onClick={() => setFormData({ ...formData, niche: n })}
                  className={`goal-chip text-xs px-3 py-1.5 ${formData.niche === n ? "border-gold text-gold" : ""}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Files */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-chalk-faint uppercase tracking-widest">Campaign Files (Optional)</label>
              <button type="button" onClick={() => setShowFileForm(!showFileForm)}
                className="flex items-center gap-1 text-xs text-gold hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add File
              </button>
            </div>

            {showFileForm && (
              <div className="bento-card-dark p-4 space-y-3 rounded-xl">
                <input placeholder="File name (e.g. Campaign Brief)"
                  value={newFile.fileName} onChange={e => setNewFile({ ...newFile, fileName: e.target.value })}
                  className="dark-input w-full text-sm" />
                <input placeholder="File URL (Google Drive, Dropbox, etc.)"
                  value={newFile.fileUrl} onChange={e => setNewFile({ ...newFile, fileUrl: e.target.value })}
                  className="dark-input w-full text-sm" />
                <div className="flex gap-2">
                  {FILE_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setNewFile({ ...newFile, fileType: t })}
                      className={`goal-chip text-xs px-3 py-1 capitalize ${newFile.fileType === t ? "border-gold text-gold" : ""}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddFile} type="button" className="purple-pill flex-1 py-1.5 text-sm">Add</button>
                  <button type="button" onClick={() => setShowFileForm(false)} className="text-sm text-chalk-dim hover:text-chalk px-3">Cancel</button>
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3">
                    <Upload className="w-4 h-4 text-gold shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-chalk truncate">{file.fileName}</p>
                      <p className="text-xs text-chalk-faint capitalize">{file.fileType}</p>
                    </div>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="text-chalk-faint hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="purple-pill w-full py-3 text-base font-semibold" disabled={loading}>
            {loading ? "Creating Campaign…" : "Create Campaign"}
          </button>
        </form>
      </div>
    </main>
  );
}
