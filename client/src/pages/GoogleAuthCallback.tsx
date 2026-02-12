import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

const CUSTOMER_TOKEN_KEY = "customer_auth_token";

export default function GoogleAuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  
  const googleCallbackMutation = trpc.customerAuth.googleCallback.useMutation();

  useEffect(() => {
    const handleCallback = async () => {
      // Get the authorization code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const errorParam = urlParams.get("error");

      if (errorParam) {
        setError("Google 登入被取消或失敗");
        setTimeout(() => {
          window.close();
        }, 2000);
        return;
      }

      if (!code) {
        setError("未收到授權碼");
        setTimeout(() => {
          window.close();
        }, 2000);
        return;
      }

      // Get personaId from state or localStorage
      let personaId: number;
      try {
        if (state) {
          const stateData = JSON.parse(atob(state));
          personaId = stateData.personaId;
        } else {
          const storedPersonaId = localStorage.getItem("google_auth_persona_id");
          if (!storedPersonaId) {
            throw new Error("Missing personaId");
          }
          personaId = parseInt(storedPersonaId, 10);
        }
      } catch {
        setError("無效的登入狀態");
        setTimeout(() => {
          window.close();
        }, 2000);
        return;
      }

      const redirectUri = `${window.location.origin}/auth/google/callback`;

      try {
        const result = await googleCallbackMutation.mutateAsync({
          code,
          redirectUri,
          personaId,
        });

        if (result.success && result.token) {
          // Save token to localStorage
          localStorage.setItem(CUSTOMER_TOKEN_KEY, result.token);
          localStorage.removeItem("google_auth_persona_id");
          
          // Redirect back to chat page
          setLocation(`/chat/${personaId}`);
        } else {
          setError("登入失敗");
          setTimeout(() => {
            setLocation(`/chat/${personaId}`);
          }, 2000);
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        setError(error.message || "Google 登入失敗");
        setTimeout(() => {
          setLocation(`/chat/${personaId}`);
        }, 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground">正在返回...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">正在完成 Google 登入...</p>
          </>
        )}
      </div>
    </div>
  );
}
