import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface BrandRegisterFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  industry: string;
}

interface BrandRegisterErrors {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  password?: string;
  industry?: string;
}

export default function BrandRegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const [form, setForm] = useState<BrandRegisterFormData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
    industry: "",
  });
  const [errors, setErrors] = useState<BrandRegisterErrors>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: BrandRegisterErrors = {};
    if (!form.companyName.trim()) nextErrors.companyName = "Brand / Company Name is required.";
    if (!form.contactName.trim()) nextErrors.contactName = "Contact Person Full Name is required.";
    if (!form.email.trim()) nextErrors.email = "Email ID is required.";
    if (!form.phone.trim()) nextErrors.phone = "Contact Number is required.";
    if (!form.password.trim()) nextErrors.password = "Password is required.";
    if (!form.industry) nextErrors.industry = "Industry Type is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await register({
        email: form.email,
        phone: form.phone,
        password: form.password,
        name: form.contactName,
        role: "brand",
        companyName: form.companyName,
        industry: form.industry,
      });
      navigate("/brand/dashboard");
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-500 px-4 py-10">
      <div className="w-full max-w-xl space-y-4">
        <Link to="/role-select" className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Brand Registration</CardTitle>
            <CardDescription>Create your account and brand profile to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Full Name *</Label>
                <Input id="contactName" value={form.contactName} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} />
                {errors.contactName && <p className="text-xs text-destructive">{errors.contactName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email ID *</Label>
                <Input id="email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+91 9876543210" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Min 6 characters" />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Brand / Company Name *</Label>
                <Input id="companyName" value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} />
                {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Industry Type *</Label>
                <Select value={form.industry} onValueChange={(value) => setForm((prev) => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                    <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.industry && <p className="text-xs text-destructive">{errors.industry}</p>}
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-95" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
