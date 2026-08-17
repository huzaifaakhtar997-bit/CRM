import { Resend } from "resend";
import { config } from "../config/env";
import { AppError } from "../types/auth.types";

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  id: string; // The provider's message ID
}

export class EmailService {
  private resend: Resend | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (config.emailProvider === "resend" && config.resendApiKey) {
      this.resend = new Resend(config.resendApiKey);
      this.isConfigured = true;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.isConfigured || !this.resend) {
      throw new AppError("Email provider is not configured. Outbound email is currently unavailable.", 503);
    }

    try {
      const payload: any = {
        from: options.from,
        to: options.to,
        subject: options.subject,
      };
      if (options.html) payload.html = options.html;
      if (options.text) payload.text = options.text;
      if (options.replyTo) payload.reply_to = options.replyTo;

      const { data, error } = await this.resend.emails.send(payload);

      if (error) {
        throw new AppError(`Email delivery rejected by provider: ${error.message}`, 400);
      }

      if (!data || !data.id) {
        throw new AppError("Email provider did not return a valid message ID.", 500);
      }

      return {
        id: data.id,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Unexpected error communicating with email provider: ${err.message}`, 500);
    }
  }
}

export const emailService = new EmailService();
