import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Camera, ImagePlus, Loader2, Lock, Save, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { BRAND_INDUSTRIES } from "@/lib/industries";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";

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
  const [notifs, setNotifs] = useState({ campaigns: true, proposals: true, messages: true });

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

        {/* Brand Logo */}
        <div className={card}>
          <div className="flex items-center gap-2"><ImagePlus className="h-4 w-4 text-purple-400" /><h2 className="text-sm font-semibold text-chalk uppercase tracking-wide">Brand Logo</h2></div>
          <p className="text-xs text-chalk-dim -mt-1">Shown to creators on your campaigns and public profile.</p>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-xl border border-white/15 bg-white/5 overflow-hidden flex items-center justify-center">
                {avatarPreview ? <img src={avatarPreview} alt="logo" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-chalk-dim" />}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-colors">
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-chalk">{name || "Your Brand"}</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-purple-400 hover:text-purple-300 mt-0.5">{avatarPreview ? "Change logo" : "Upload logo"}</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
        </div>

        {/* Profile info */}
        <form onSubmit={handleSave} className={`${card} space-y-4`}>
          <h2 className="text-sm font-semibold text-chalk uppercase tracking-wide">Profile Info</h2>
          {([
            { label: "Name", type: "text", value: name, set: setName, placeholder: "Brand contact name" },
            { label: "Work Email", type: "email", value: email, set: setEmail, placeholder: "work@brand.com" },
            { label: "Phone (WhatsApp)", type: "tel", value: phone, set: setPhone, placeholder: "+91 9876543210" },
          ] as const).map(({ label, type, value, set, placeholder }) => (
            <div key={label} className="space-y-1.5">
              <Label className="text-xs text-chalk-dim">{label}</Label>
              <Input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} className={field} />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs text-chalk-dim">Brand Category</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className={field + " flex"}><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {(industry && !(BRAND_INDUSTRIES as readonly string[]).includes(industry)
                  ? [...BRAND_INDUSTRIES, industry]
                  : BRAND_INDUSTRIES
                ).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
          {([
            { id: "current" as const, label: "Current Password", placeholder: "••••••••" },
            { id: "next" as const, label: "New Password", placeholder: "Min 8 characters" },
            { id: "confirm" as const, label: "Confirm New Password", placeholder: "Repeat password" },
          ]).map(({ id, label, placeholder }) => (
            <div key={id} className="space-y-1.5">
              <Label className="text-xs text-chalk-dim">{label}</Label>
              <Input type="password" value={pw[id]} onChange={(e) => setPw(p => ({ ...p, [id]: e.target.value }))} placeholder={placeholder} className={field} />
            </div>
          ))}
          <Button type="submit" disabled={pwSaving} variant="outline" className="w-full border-white/10 text-chalk hover:bg-white/5">
            {pwSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : "Update Password"}
          </Button>
        </form>

        {/* Notifications */}
        <div className={card}>
          <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-purple-400" /><h2 className="text-sm font-semibold text-chalk uppercase tracking-wide">Notifications</h2></div>
          {([
            { key: "campaigns" as const, label: "Campaign opportunities", desc: "When creators match your active campaigns" },
            { key: "proposals" as const, label: "Proposal updates", desc: "When creators respond to your campaign posts" },
            { key: "messages" as const, label: "Messages", desc: "New messages from creators and platform" },
          ]).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm text-chalk">{label}</p>
                <p className="text-[11px] text-chalk-dim">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${notifs[key] ? "bg-purple-600" : "bg-white/10"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifs[key] ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-500/20 bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-400" /><h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Danger Zone</h2></div>
          <p className="text-xs text-chalk-dim">Permanently delete your account and all associated data. This cannot be undone.</p>
          <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>

      </div>

      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}
