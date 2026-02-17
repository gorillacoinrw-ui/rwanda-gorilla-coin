import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";

type Message = {
  id: string;
  trade_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export default function TradeChat({ tradeId }: { tradeId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    if (!open) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("trade_messages")
        .select("*")
        .eq("trade_id", tradeId)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) ?? []);
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`trade-chat-${tradeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_messages", filter: `trade_id=eq.${tradeId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tradeId, open]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);
    try {
      await supabase.from("trade_messages").insert({
        trade_id: tradeId,
        sender_id: user.id,
        message: text.trim(),
      });
      setText("");
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Chat with trader
        {messages.length > 0 && (
          <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs font-semibold flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-primary" />
          Trade Chat
        </span>
        <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
          Minimize
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-48 overflow-y-auto p-3 space-y-2 bg-background">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-1.5 rounded-xl text-xs ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                <p>{msg.message}</p>
                <p className={`text-[9px] mt-0.5 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-2 border-t border-border">
        <Input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="h-8 text-xs"
        />
        <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={handleSend} disabled={sending || !text.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
