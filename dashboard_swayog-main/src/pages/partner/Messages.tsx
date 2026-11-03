import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, UserCircle } from "lucide-react";
import { useListConversations, useListMessages, useSendMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

export default function PartnerMessages() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: convos } = useListConversations();
  const adminId = convos?.[0]?.id;
  const adminName = convos?.[0]?.fullName || "SWAYOG Admin Support";
  const { toast } = useToast();

  const { data: messages = [] } = useListMessages(adminId);
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
    if (!content.trim()) return;
    if (!adminId) {
      toast({ title: "Connecting...", description: "Please wait while we connect you to an admin." });
      return;
    }
    sendMessageMutation.mutate({ receiverId: adminId, content });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <SidebarLayout>
      <PageHeader title="Messages" description="Communicate directly with SWAYOG admin team." />

      <Card className="h-[calc(100vh-200px)] flex flex-col shadow-sm border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{adminName}</h3>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block"></span> Online
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-500'}`}>
                    {isMe ? <span className="text-xs font-medium">Me</span> : <UserCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className={`${isMe ? 'bg-primary text-white rounded-2xl rounded-tr-sm' : 'bg-white border text-slate-800 rounded-2xl rounded-tl-sm'} p-3 text-sm shadow-sm`}>
                      {msg.content}
                    </div>
                    <span className={`text-[10px] text-slate-400 mt-1 block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2 relative">
            <Input 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..." 
              className="pr-12 h-12 rounded-full border-slate-300 focus-visible:ring-primary"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              onClick={handleSend}
              disabled={!content.trim() || sendMessageMutation.isPending}
              size="icon" 
              className="absolute right-1 top-1 h-10 w-10 rounded-full gradient-bg border-0"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </Card>
    </SidebarLayout>
  );
}
