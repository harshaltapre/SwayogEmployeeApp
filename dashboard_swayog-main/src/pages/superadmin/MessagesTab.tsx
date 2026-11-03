import { useState, useRef, useEffect } from "react";
import { UserCircle, Send, Search } from "lucide-react";
import { useListConversations, useListMessages, useSendMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { C } from "./shared";

export default function MessagesTab() {
  const { user } = useAuth();
  const { data: convos = [] } = useListConversations();
  
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!activePartnerId && convos.length > 0) {
      setActivePartnerId(convos[0].id);
    }
  }, [convos, activePartnerId]);

  const { data: messages = [] } = useListMessages(activePartnerId || undefined);
  const { toast } = useToast();
  const sendMessageMutation = useSendMessage({
    mutation: {
      onSuccess: () => setContent(""),
      onError: (err: any) => {
        toast({ 
          title: "Message Failed", 
          description: err.message || err.error || "Unable to send message.", 
          variant: "destructive" 
        });
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!content.trim() || !activePartnerId) return;
    sendMessageMutation.mutate({ receiverId: activePartnerId, content });
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConvos = convos.filter(c => c.fullName.toLowerCase().includes(search.toLowerCase()));
  const activePartner = convos.find(c => c.id === activePartnerId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Sidebar - Conversations List */}
        <div style={{ width: 320, borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #E2E8F0", background: "#fff" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px 0", color: C.ink }}>Partner Messages</h2>
            <div style={{ position: "relative" }}>
              <Search size={16} color={C.slate} style={{ position: "absolute", left: 12, top: 12 }} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search partners..." 
                style={{ paddingLeft: 36, height: 40, borderRadius: 10, background: "#F1F5F9", border: "none" }} 
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredConvos.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: C.slate, fontSize: 13 }}>No partners found.</div>
            ) : (
              filteredConvos.map(convo => (
                <div 
                  key={convo.id} 
                  onClick={() => setActivePartnerId(convo.id)}
                  style={{ 
                    padding: "16px 20px", 
                    display: "flex", 
                    gap: 12, 
                    cursor: "pointer",
                    borderBottom: "1px solid #F1F5F9",
                    background: activePartnerId === convo.id ? "#fff" : "transparent",
                    borderLeft: activePartnerId === convo.id ? `3px solid ${C.gold}` : "3px solid transparent",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", color: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <UserCircle size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{convo.fullName}</span>
                      {convo.lastMessageAt && (
                        <span style={{ fontSize: 10, color: C.slate, flexShrink: 0 }}>
                          {format(new Date(convo.lastMessageAt), "MMM d")}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.slate, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {convo.lastMessage || "Click to start chatting"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Chat Window */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", color: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserCircle size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink }}>{activePartner.fullName}</h3>
                  <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>Partner Account</div>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16, background: "#F8FAFC" }}>
                {messages.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.slate, fontSize: 14 }}>
                    No messages in this conversation. Send one below!
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} style={{ display: "flex", gap: 12, maxWidth: "75%", alignSelf: isMe ? "flex-end" : "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: isMe ? C.gold : "#E2E8F0", color: isMe ? "#fff" : C.slate, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 600 }}>
                          {isMe ? "Me" : <UserCircle size={20} />}
                        </div>
                        <div>
                          <div style={{ 
                            background: isMe ? C.ink : "#fff", 
                            color: isMe ? "#fff" : C.ink, 
                            padding: "12px 16px", 
                            borderRadius: 16, 
                            borderTopRightRadius: isMe ? 4 : 16,
                            borderTopLeftRadius: !isMe ? 4 : 16,
                            fontSize: 14,
                            lineHeight: 1.5,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            border: isMe ? "none" : "1px solid #E2E8F0"
                          }}>
                            {msg.content}
                          </div>
                          <div style={{ fontSize: 10, color: C.slate, marginTop: 6, textAlign: isMe ? "right" : "left", padding: "0 4px" }}>
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{ padding: 20, borderTop: "1px solid #E2E8F0", background: "#fff" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Input 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Reply to ${activePartner.fullName}...`}
                    style={{ flex: 1, height: 48, borderRadius: 24, paddingLeft: 20, border: "1px solid #E2E8F0", background: "#F8FAFC" }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button 
                    onClick={handleSend}
                    disabled={!content.trim() || sendMessageMutation.isPending}
                    style={{ width: 48, height: 48, borderRadius: 24, background: C.gold, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.slate, flexDirection: "column", gap: 12 }}>
              <UserCircle size={48} color="#CBD5E1" />
              <div style={{ fontSize: 15, fontWeight: 600 }}>Select a partner to start messaging</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
