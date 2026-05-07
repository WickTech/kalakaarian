import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, User, Loader2, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNavigateBack } from "@/hooks/useNavigateBack";

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    role: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
  updatedAt: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { goBack } = useNavigateBack(user?.role === 'brand' ? '/brand-dashboard' : '/influencer-dashboard');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      const interval = setInterval(() => fetchMessages(activeConversation, true), 5000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string, silent = false) => {
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data);
      if (!silent) api.markAsRead(conversationId);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;

    const currentConversation = conversations.find(c => c._id === activeConversation);
    const receiver = currentConversation?.participants.find(p => p._id !== user.id);

    if (!receiver) return;

    setSending(true);
    try {
      await api.sendMessage(receiver._id, newMessage);
      setNewMessage("");
      fetchMessages(activeConversation);
      fetchConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== user?.id);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-full border-r md:w-80 lg:w-96">
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <p>No conversations yet.</p>
                  <Button variant="link" asChild>
                    <Link to="/marketplace">Find influencers</Link>
                  </Button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setActiveConversation(conv._id)}
                      className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted ${
                        activeConversation === conv._id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{other?.name || "User"}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {conv.lastMessage?.createdAt && new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {conv.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                      {conv.unreadCount ? (
                        <Badge variant="default" className="ml-auto h-5 w-5 justify-center rounded-full p-0">
                          {conv.unreadCount}
                        </Badge>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="hidden flex-1 flex-col md:flex">
          {activeConversation ? (
            <>
              <div className="border-b p-4 font-semibold">
                {getOtherParticipant(conversations.find(c => c._id === activeConversation)!)?.name || "Chat"}
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isMe
                              ? "bg-purple-600 text-white rounded-tr-none"
                              : "bg-muted rounded-tl-none"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-purple-100" : "text-muted-foreground"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && (
                              msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <div className="rounded-full bg-muted p-6">
                <Send className="h-10 w-10" />
              </div>
              <p className="mt-4">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
