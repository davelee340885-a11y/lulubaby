/**
 * Chat.tsx - Internal training chat page
 * 
 * Lightweight wrapper that resolves personaId from URL params
 * and renders the unified CustomerChatClient component.
 * 
 * Route: /chat/:personaId
 * Mode: isInternalTraining=true (shows "Return to Dashboard" button)
 */
import { useParams } from "wouter";
import CustomerChatClient from "@/components/CustomerChatClient";

export default function Chat() {
  const params = useParams<{ personaId: string }>();
  const personaId = parseInt(params.personaId || "0");

  return (
    <CustomerChatClient
      personaId={personaId}
      sessionKey={String(personaId)}
      isInternalTraining={true}
    />
  );
}
