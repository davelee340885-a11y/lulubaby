import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Extract the current workspaceId from the URL path (/w/:workspaceId/...).
 * Falls back to user.subdomain or user.id if the URL doesn't match.
 *
 * Also provides a helper `wsPath(path)` that prepends the workspace prefix.
 */
export function useWorkspaceId() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Try to extract from URL first
  const match = location.match(/^\/w\/([^/]+)/);
  const workspaceId = match?.[1] ?? user?.subdomain ?? (user ? String(user.id) : undefined);

  // Helper to build workspace-prefixed paths
  const wsPath = (path: string) => {
    if (!workspaceId) return path;
    return `/w/${workspaceId}${path}`;
  };

  return { workspaceId, wsPath };
}
