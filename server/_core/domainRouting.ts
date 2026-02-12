import type { Request, Response, NextFunction } from 'express';
import { getPublishedDomainByName, getPersonaBySubdomain } from '../db';

/**
 * Domain routing middleware
 * Identifies custom domains and loads corresponding persona configuration
 */
export async function domainRoutingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get the host from request headers
    const host = req.headers.host || '';
    
    // Remove port if present (e.g., localhost:3000 -> localhost)
    const domain = host.split(':')[0];
    
    // Skip domain routing for:
    // 1. localhost (development)
    // 2. Internal API routes
    // 3. Static assets
    if (
      domain === 'localhost' ||
      domain === '127.0.0.1' ||
      req.path.startsWith('/api/') ||
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/@') // Vite HMR
    ) {
      return next();
    }
    
    // Check if this is a lulubaby.xyz subdomain (e.g., abc123.lulubaby.xyz)
    if (domain.endsWith('.lulubaby.xyz')) {
      const subdomain = domain.replace('.lulubaby.xyz', '');
      if (subdomain && !subdomain.includes('.')) {
        const result = await getPersonaBySubdomain(subdomain);
        if (result) {
          (req as any).customDomainPersonaId = result.personaId;
          (req as any).customDomain = domain;
          (req as any).lulubabySubdomain = subdomain;
          console.log(`[Domain Routing] Lulubaby subdomain: ${subdomain}.lulubaby.xyz -> Persona ID: ${result.personaId}`);
        }
        return next();
      }
    }

    // Check if this is a published custom domain
    const publishedDomain = await getPublishedDomainByName(domain);
    
    if (publishedDomain && publishedDomain.personaId) {
      // Store persona ID in request for later use
      (req as any).customDomainPersonaId = publishedDomain.personaId;
      (req as any).customDomain = domain;
      
      console.log(`[Domain Routing] Custom domain detected: ${domain} -> Persona ID: ${publishedDomain.personaId}`);
    }
    
    next();
  } catch (error) {
    console.error('[Domain Routing] Error:', error);
    // Don't block the request on error, just continue
    next();
  }
}

/**
 * Get persona ID from custom domain if available
 */
export function getCustomDomainPersonaId(req: Request): number | null {
  return (req as any).customDomainPersonaId || null;
}

/**
 * Check if request is from a custom domain
 */
export function isCustomDomain(req: Request): boolean {
  return !!(req as any).customDomain;
}

/**
 * Get custom domain name from request
 */
export function getCustomDomain(req: Request): string | null {
  return (req as any).customDomain || null;
}
