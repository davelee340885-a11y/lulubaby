import { describe, it, expect } from "vitest";
import nodemailer from "nodemailer";

describe("SMTP Credentials Validation (Titan Email)", () => {
  it("should have SMTP_USER set", () => {
    expect(process.env.SMTP_USER).toBeDefined();
    expect(process.env.SMTP_USER).toContain("@");
  });

  it("should have SMTP_PASS set", () => {
    expect(process.env.SMTP_PASS).toBeDefined();
    expect(process.env.SMTP_PASS!.length).toBeGreaterThan(0);
  });

  it("should have SMTP_HOST set", () => {
    expect(process.env.SMTP_HOST).toBeDefined();
    expect(process.env.SMTP_HOST).toBe("smtp.titan.email");
  });

  it("should have SMTP_PORT set", () => {
    expect(process.env.SMTP_PORT).toBeDefined();
    expect(process.env.SMTP_PORT).toBe("465");
  });

  it("should connect to Titan Email SMTP server successfully", async () => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.titan.email",
      port: parseInt(process.env.SMTP_PORT || "465", 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    // verify() checks the connection and authentication
    const result = await transporter.verify();
    expect(result).toBe(true);
  }, 30000);
});
