import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface PouleChatProps {
  pouleId: string;
  pouleName: string;
}

export const PouleChat = ({ pouleId, pouleName }: PouleChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["poule-chat", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poule_chat_messages")
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            display_name,
            email,
            avatar_url
          )
        `)
        .eq("poule_id", pouleId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: isOpen,
  });

  // Realtime subscription
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel(`poule-chat-${pouleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poule_chat_messages",
          filter: `poule_id=eq.${pouleId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["poule-chat", pouleId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, pouleId, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Je moet ingelogd zijn");

      const { error } = await supabase.from("poule_chat_messages").insert({
        poule_id: pouleId,
        user_id: user.id,
        content,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      textareaRef.current?.focus();
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("poule_chat_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const unreadCount = messages?.length || 0;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">{pouleName}</h3>
            <p className="text-xs text-muted-foreground">Groepschat</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Laden...
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.user_id === user?.id;
              const senderName =
                message.profiles?.display_name ||
                message.profiles?.email?.split("@")[0] ||
                "Onbekend";

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">
                      {isOwn ? "Jij" : senderName}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {format(parseISO(message.created_at), "HH:mm", { locale: nl })}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => deleteMessageMutation.mutate(message.id)}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary text-foreground rounded-tl-sm"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Nog geen berichten</p>
            <p className="text-xs">Start de conversatie!</p>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {user ? (
        <div className="p-3 border-t border-border bg-secondary/20">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Typ een bericht..."
              className="min-h-[40px] max-h-[100px] resize-none text-sm"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              size="icon"
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-border bg-secondary/20 text-center text-sm text-muted-foreground">
          Log in om berichten te sturen
        </div>
      )}
    </div>
  );
};
