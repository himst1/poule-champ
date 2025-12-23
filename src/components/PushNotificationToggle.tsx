import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PushNotificationToggleProps {
  userId?: string;
}

export const PushNotificationToggle = ({ userId }: PushNotificationToggleProps) => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications(userId);

  if (!isSupported) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isSubscribed ? "default" : "outline"}
            size="sm"
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSubscribed ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            {isSubscribed ? "Notificaties aan" : "Notificaties"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isSubscribed 
              ? "Je ontvangt herinneringen voor naderende deadlines" 
              : "Schakel notificaties in voor deadline herinneringen"
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
