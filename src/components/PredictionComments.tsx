import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Trash2, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface PredictionCommentsProps {
  predictionId: string;
  predictorName: string;
  matchInfo: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PredictionComments = ({
  predictionId,
  predictorName,
  matchInfo,
  isOpen,
  onClose,
}: PredictionCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ["prediction-comments", predictionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prediction_comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq("prediction_id", predictionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
    enabled: isOpen,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel(`comments-${predictionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prediction_comments",
          filter: `prediction_id=eq.${predictionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["prediction-comments", predictionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [predictionId, isOpen, queryClient]);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Je moet ingelogd zijn");
      
      const { error } = await supabase.from("prediction_comments").insert({
        prediction_id: predictionId,
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["prediction-comments", predictionId] });
    },
    onError: (error: Error) => {
      toast.error("Fout bij plaatsen: " + error.message);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("prediction_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prediction-comments", predictionId] });
      toast.success("Reactie verwijderd");
    },
    onError: (error: Error) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Reacties</h3>
              <p className="text-xs text-muted-foreground">
                {predictorName} • {matchInfo}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Nog geen reacties. Wees de eerste!
              </p>
            </div>
          ) : (
            comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-xs">
                    {getInitials(comment.profiles?.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.profiles?.display_name || "Anoniem"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: nl,
                      })}
                    </span>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-1 hover:text-destructive"
                        disabled={deleteCommentMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm mt-0.5 break-words">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        {user ? (
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Schrijf een reactie..."
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="shrink-0 h-[44px] w-[44px]"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
            Log in om te reageren
          </div>
        )}
      </div>
    </div>
  );
};
