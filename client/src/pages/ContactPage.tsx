import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Phone, MessageCircle, Bot, User, Mail, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const faqResponses = [
  { keywords: ["price", "cost", "fee", "charge"], response: "Our platform fees are among the lowest in the industry. Brands pay only 5% platform fee. Creators keep 95% of their earnings!" },
  { keywords: ["payment", "pay", "when"], response: "Payments are processed within 7 business days after campaign completion and approval. We support UPI, NEFT, and RTGS." },
  { keywords: ["campaign", "how", "create"], response: "To create a campaign, go to your Brand Dashboard and click 'New Campaign'. Fill in details like title, budget, genre, and deadline." },
  { keywords: ["influencer", "creator", "find"], response: "You can browse creators in our Marketplace by tier (Nano, Micro, Macro, Celebrity), location, genre, and budget!" },
  { keywords: ["contact", "support", "help"], response: "You can reach our support team at support@kalakaarian.com or use this form to get a callback. We're here to help!" },
];

export default function ContactPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    phone: "",
  });
  const [chatMessages, setChatMessages] = useState<Array<{ type: "user" | "bot"; text: string }>>([
    { type: "bot", text: "Hi! I'm Kalakaarian AI. How can I help you today? Try asking about pricing, payments, campaigns, or influencers." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [requestingCall, setRequestingCall] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    setSubmitted(true);
    toast({ title: "Success", description: "Your message has been sent! We'll get back to you soon." });
  };

  const handleRequestCall = async () => {
    if (!formData.phone) {
      toast({ title: "Error", description: "Please enter your phone number", variant: "destructive" });
      return;
    }
    setRequestingCall(true);
    toast({ title: "Success", description: "Callback requested! Our team will call you within 24 hours." });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { type: "user", text: userMessage }]);
    setChatInput("");

    const matched = faqResponses.find(faq => 
      faq.keywords.some(keyword => userMessage.toLowerCase().includes(keyword))
    );

    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        type: "bot", 
        text: matched?.response || "I'm not sure about that. Try asking about pricing, payments, campaigns, or influencers. Or fill out the form above to connect with our team!" 
      }]);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 border border-border rounded-md hover:bg-secondary transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/k-logo-no-bg.png" alt="Kalakaarian" className="h-10 w-auto" />
              <h1 className="font-mono text-sm uppercase tracking-[0.3em] font-bold">KALAKAARIAN</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
            Contact Us
          </h1>
          <p className="text-muted-foreground text-center mb-12">
            Get in touch with our team. We're here to help!
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-xl font-semibold mb-6">Get In Touch</h2>
              
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground text-sm">We'll get back to you at {formData.email} soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Message *</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="How can we help you?"
                        className="pl-10 min-h-[120px]"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Request a Callback
                </h3>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="flex-1"
                  />
                  <Button onClick={handleRequestCall} variant="outline" disabled={requestingCall}>
                    {requestingCall ? "Requested" : "Call Me"}
                  </Button>
                </div>
              </div>
            </div>

            {/* AI Chatbot */}
            <div className="bg-card rounded-xl border border-border flex flex-col">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">AI Assistant</h2>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px] space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.type === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleChatSubmit} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about pricing, campaigns..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </form>

              <div className="px-4 pb-4">
                <Button variant="outline" className="w-full text-sm" onClick={() => {
                  setChatMessages([{ 
                    type: "bot", 
                    text: "A representative will connect with you shortly. In the meantime, try asking our AI about pricing, payments, or campaigns!" 
                  }]);
                }}>
                  Connect with Representative
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-card rounded-lg border border-border">
              <h3 className="font-medium mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground">support@kalakaarian.com</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <h3 className="font-medium mb-2">Business Inquiries</h3>
              <p className="text-sm text-muted-foreground">business@kalakaarian.com</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <h3 className="font-medium mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground">Within 24 hours</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
