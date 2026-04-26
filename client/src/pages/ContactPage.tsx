import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Phone, MessageCircle, Bot, User, Mail, MessageSquare, CheckCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const faqResponses = [
  { keywords: ["price", "cost", "fee", "charge"], response: "Our platform fees are among the lowest in the industry. Brands pay only 5% platform fee. Creators keep 95% of their earnings!" },
  { keywords: ["payment", "pay", "when"], response: "Payments are processed within 7 business days after campaign completion and approval. We support UPI, NEFT, and RTGS." },
  { keywords: ["campaign", "how", "create"], response: "To create a campaign, go to your Brand Dashboard and click 'New Campaign'. Fill in details like title, budget, genre, and deadline." },
  { keywords: ["influencer", "creator", "find"], response: "You can browse creators in our Marketplace by tier (Nano, Micro, Macro, Celebrity), location, genre, and budget!" },
  { keywords: ["contact", "support", "help"], response: "You can reach our support team at support@kalakaarian.com or use this form to get a callback. We're here to help!" },
];

const FAQ_ITEMS = [
  { q: "How much does it cost to run a campaign?", a: "Brands pay a 5% platform fee on the total campaign budget. Creators receive 95% of their agreed rates. There are no hidden charges." },
  { q: "When do creators get paid?", a: "Payments are released within 7 business days after campaign completion and content approval. We support UPI, NEFT, and RTGS transfers." },
  { q: "How do I find the right influencer?", a: "Use our Marketplace to filter creators by tier (Nano to Celebrity), location, genre, engagement rate, and budget. Real analytics — no fake follower counts." },
  { q: "Is my payment secure?", a: "Yes. All funds are held in escrow until campaign milestones are approved. You only pay when content is delivered and accepted." },
  { q: "Can I cancel a campaign after starting?", a: "Campaigns can be paused or cancelled before content submission begins. Once a creator has submitted work, escrow terms apply. Contact support for details." },
];

export default function ContactPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "", phone: "" });
  const [chatMessages, setChatMessages] = useState<Array<{ type: "user" | "bot"; text: string }>>([
    { type: "bot", text: "Hi! I'm Kalakaarian AI. Ask me about pricing, payments, campaigns, or influencers." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [requestingCall, setRequestingCall] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      toast({ title: "Error", description: "Please fill in name and message", variant: "destructive" });
      return;
    }
    if (!formData.email && !formData.phone) {
      toast({ title: "Error", description: "Please provide either email or phone number", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.submitContact({ name: formData.name, email: formData.email, phone: formData.phone, message: formData.message, type: "general" });
      setSubmitted(true);
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
    } catch {
      toast({ title: "Error", description: "Failed to send. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCall = async () => {
    if (!formData.phone && !formData.email) {
      toast({ title: "Error", description: "Please provide phone or email first", variant: "destructive" });
      return;
    }
    setRequestingCall(true);
    try {
      await api.submitContact({ name: formData.name || "Anonymous", email: formData.email, phone: formData.phone, message: "Callback requested", type: "callback" });
      toast({ title: "Callback requested!", description: "Our team will call you within 24 hours." });
    } catch {
      toast({ title: "Error", description: "Failed to request callback.", variant: "destructive" });
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { type: "user", text: userMessage }]);
    setChatInput("");
    const matched = faqResponses.find(faq => faq.keywords.some(kw => userMessage.toLowerCase().includes(kw)));
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        type: "bot",
        text: matched?.response || "I'm not sure about that. Try asking about pricing, payments, campaigns, or influencers. Or fill out the form to connect with our team!",
      }]);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-obsidian">
      {/* Hero */}
      <div className="border-b border-white/5 px-4 py-14 text-center">
        <p className="text-xs text-gold uppercase tracking-widest font-medium mb-3">Support</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-chalk mb-3">Get in Touch</h1>
        <p className="text-chalk-dim text-sm max-w-sm mx-auto">
          Our team typically responds within 24 hours. You can also chat with our AI assistant for instant answers.
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 space-y-12">

        {/* Contact + Chat row */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Contact form */}
          <div className="bento-card p-6 space-y-5">
            <h2 className="font-display font-bold text-chalk text-lg">Send a Message</h2>

            {submitted ? (
              <div className="flex flex-col items-center py-10 gap-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-400" />
                <p className="font-medium text-chalk">Message Sent!</p>
                <p className="text-sm text-chalk-dim">We'll reply to {formData.email || formData.phone} soon.</p>
                <Link to="/" className="text-xs text-gold hover:underline">← Back to Home</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk-faint" />
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name *" className="dark-input pl-9 w-full" required />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk-faint" />
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email address" className="dark-input pl-9 w-full" />
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-chalk-faint" />
                  <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help? *" rows={4} className="dark-input pl-9 w-full resize-none" required />
                </div>
                <button type="submit" className="purple-pill w-full py-2.5 flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-chalk-dim mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Request a Callback
              </p>
              <div className="flex gap-2">
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number" className="dark-input flex-1 text-sm" />
                <button onClick={handleRequestCall} disabled={requestingCall}
                  className="px-4 py-2 rounded-lg border border-white/20 text-chalk text-sm hover:border-white/40 transition-colors disabled:opacity-50">
                  {requestingCall ? "Requested ✓" : "Call Me"}
                </button>
              </div>
            </div>
          </div>

          {/* AI Chatbot */}
          <div className="bento-card flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Bot className="w-4 h-4 text-gold" />
              <span className="font-display font-bold text-chalk text-sm">AI Assistant</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[320px]">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.type === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-chalk-dim border border-white/8"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/5 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about pricing, campaigns…" className="dark-input flex-1 text-sm py-2" />
              <button type="submit" className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
              </button>
            </form>

            <div className="px-3 pb-3">
              <button onClick={() => setChatMessages([{ type: "bot", text: "A representative will connect with you shortly. In the meantime, ask our AI about pricing, payments, or campaigns!" }])}
                className="w-full py-2 text-xs text-chalk-dim border border-white/10 rounded-lg hover:border-white/25 hover:text-chalk transition-colors">
                Connect with Representative
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div>
          <h2 className="font-display font-bold text-chalk text-xl mb-6">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} className="bento-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-white/3 transition-colors">
                  <span className="text-sm font-medium text-chalk">{item.q}</span>
                  {openFaq === idx
                    ? <ChevronUp className="w-4 h-4 text-chalk-faint shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-chalk-faint shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-sm text-chalk-dim border-t border-white/5 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick info strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Email Support", value: "support@kalakaarian.com" },
            { label: "Business Inquiries", value: "business@kalakaarian.com" },
            { label: "Response Time", value: "Within 24 hours" },
          ].map(({ label, value }) => (
            <div key={label} className="bento-card p-5 text-center">
              <p className="text-xs text-chalk-faint uppercase tracking-widest mb-1">{label}</p>
              <p className="text-sm text-chalk">{value}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
