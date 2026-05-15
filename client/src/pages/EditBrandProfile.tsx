import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, Lock, Save, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";

const CATEGORIES = [
  "Fashion", "Technology", "Food & Beverage", "Health & Wellness",
  "Finance", "Entertainment", "Retail", "Education", "Travel", "Beauty", "Other",
];

interface PwForm { current: string; next: string; confirm: string }

export default function EditBrandProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [pw, setPw] = useState<PwForm>({ current: "", next: "", confirm: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    api.getBrandSettings().then(({ user, profile }) => {
      setName(user.name || profile.contactPerson || "");
      setEmail(user.email || profile.email || "");
      setPhone(user.phone || profile.phone || "");
      setIndustry(profile.industry || "");
      const logoUrl = (profile as { logo_url?: string }).logo_url || profile.logo;
      if (logoUrl) setAvatarPreview(logoUrl);
    }).catch(() => toast({ title: "Failed to load profile", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | undefined> => {
    if (!avatarFile) return undefined;
    const { uploadUrl, fileUrl } = await api.getUploadUrl(avatarFile.name, avatarFile.type, "profile");
    await fetch(uploadUrl, { method: "PUT", body: avatarFile, headers: { "Content-Type": avatarFile.type } });
    return fileUrl;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const logo = await uploadAvatar();
      await api.updateBrandProfile({ companyName: name, email, phone, industry, ...(logo ? { logo } : {}) });
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (pw.next.length < 8) { toast({ title: "Password must be 8+ characters", variant: "destructive" }); return; }
    setPwSaving(true);
    try {
      await api.changePassword(pw.current, pw.next);
      toast({ title: "Password updated" });
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password update failed";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian">
      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
    </div>
  );

  const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-chalk placeholder:text-chalk-dim focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors";
  const card = "rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4";

  return (
    <div className="min-h-screen bg-obsidian py-10 px-4">
      <div className="mx-auto max-w-xl space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-chalk-dim hover:text-chalk transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-chalk">Account Settings</h1>
          <p className="text-sm text-chalk-dim mt-1">Manage your brand profile and security</p>
        </div>

        {/* Profile image */}
        <div className={card}>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-chalk uppercase tracking-wide">Profile Image</h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border border-white/15 bg-white/5 overflow-hidden flex items-center justify-center">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                  : <User className="h-8 w-8 text-chalk-dim" />}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-colors"
              >
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-chalk">{name || "Your Name"}</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-purple-400 hover:text-purple-300 mt-0.5">
                Change photo
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
        </div>

        {/* Profile info */}
        <form onSubmit={handleSave} className={`${card} space-y-5`}>
          <h2 className="text-sm font-semibold text-chalk uppercase tracking-wide">Profile Info</h2>

          <div className="space-y-1.5">
            <Label className="text-xs text-chalk-dim">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand contact name" className={field} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-chalk-dim">Work Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="work@brand.com" className={field} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-chalk-dim">Phone (WhatsApp)</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" className={field} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-chalk-dim">Brand Category</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className={field + " flex"}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-medium">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
          </Button>
        </form>

        {/* Password */}
        <form onSubmit={handlePassword} className={card}>
          <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-purple-400" /><h2 className="text-sm font-semibold text-chalk uppercase tracking-wide">Change Password</h2></div>
          <div className="space-y-1.5">
            <Label className="text-xs text-chalk-dim">Current Password</Label>
            <Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" className={field} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-chalk-dim">New Password</Label>
            <Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="Min 8 characters" className={field} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-chalk-dim">Confirm New Password</Label>
            <Input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="Repeat password" className={field} />
          </div>
          <Button type="submit" disabled={pwSaving} variant="outline" className="w-full border-white/10 text-chalk hover:bg-white/5">
            {pwSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : "Update Password"}
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-red-500/20 bg-white/[0.03] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Danger Zone</h2>
        </div>
        <p className="text-xs text-chalk-dim">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete Account
        </button>
      </div>

      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}
