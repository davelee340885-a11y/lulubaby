import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { domainRoutingMiddleware } from "./domainRouting";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Stripe webhook needs raw body, so we add it before body parser
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const { handleWebhookEvent, verifyWebhookSignature } = await import("../webhooks/stripe");
      try {
        const signature = req.headers["stripe-signature"];
        if (!signature) {
          return res.status(400).send("Missing stripe-signature header");
        }
        
        const webhookSecret = "whsec_aKJeNqsAR89h0m2k8V4i2eDMpTSrwBjY";
        const event = verifyWebhookSignature(
          req.body.toString(),
          signature as string,
          webhookSecret
        );
        
        console.log(`[Stripe Webhook] Received event: ${event.type}`);
        await handleWebhookEvent(event);
        
        res.json({ received: true });
      } catch (error: any) {
        console.error("[Stripe Webhook] Error:", error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
      }
    }
  );
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Domain routing middleware - must be before other routes
  app.use(domainRoutingMiddleware);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
