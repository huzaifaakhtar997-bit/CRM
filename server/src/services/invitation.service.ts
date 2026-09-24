import crypto from "crypto";
import { prisma } from "../config/database";
import { config } from "../config/env";
import { emailService } from "./email.service";
import { hashPassword, generateToken } from "../utils/jwt";
import { AppError } from "../types/auth.types";
import { CreateInvitationInput, RegisterWithInviteInput } from "../validators/invitation.validator";
import { UserRole } from "@prisma/client";

export class InvitationService {
  /**
   * Admin/Manager creates an invitation for a specific email and role
   */
  async createInvitation(input: CreateInvitationInput, invitedById: string, origin?: string) {
    const email = input.email.toLowerCase();

    // 1. Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new AppError("A user account with this email address already exists.", 400);
    }

    // 2. Generate secure token & expiration (7 days)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 3. Upsert invitation (if a pending unaccepted invite exists for this email, refresh it)
    const existingInvite = await prisma.userInvitation.findFirst({
      where: { email, isAccepted: false },
    });

    let invitation;
    if (existingInvite) {
      invitation = await prisma.userInvitation.update({
        where: { id: existingInvite.id },
        data: {
          role: input.role,
          token,
          expiresAt,
          invitedById,
        },
        include: {
          invitedBy: { select: { id: true, name: true, email: true } },
        },
      });
    } else {
      invitation = await prisma.userInvitation.create({
        data: {
          email,
          role: input.role,
          token,
          expiresAt,
          invitedById,
        },
        include: {
          invitedBy: { select: { id: true, name: true, email: true } },
        },
      });
    }

    // 4. Construct invite URL
    const baseUrl = origin || process.env.APP_URL || "http://localhost:5173";
    const inviteUrl = `${baseUrl.replace(/\/$/, "")}/register?token=${token}`;

    // 5. Send Email Invitation (graceful fallback if Resend not configured)
    let emailSent = false;
    try {
      const roleLabel = input.role.replace(/_/g, " ");
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 28px;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 8px;">You're Invited to Join CRM</h1>
            <p style="color: #64748b; font-size: 14px; margin: 0;">An account invitation has been prepared for you.</p>
          </div>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6;">
              <strong>${invitation.invitedBy?.name || "A team administrator"}</strong> has invited you to join the team as a <strong style="color: #4f46e5;">${roleLabel}</strong>.
            </p>
            <p style="margin: 0; font-size: 13px; color: #64748b;">
              This invitation link is valid for 7 days.
            </p>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${inviteUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Accept Invitation & Set Password
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin: 0 0 8px 0;">Or copy and paste this URL into your browser:</p>
            <p style="margin: 0; word-break: break-all; color: #64748b;">${inviteUrl}</p>
          </div>
        </div>
      `;

      await emailService.sendEmail({
        from: config.emailFromAddress,
        to: email,
        subject: `You've been invited to join CRM (${roleLabel})`,
        html: htmlBody,
      });
      emailSent = true;
    } catch (err: any) {
      console.warn(`[InvitationService] Could not send invite email to ${email}:`, err?.message || err);
    }

    return {
      invitation,
      inviteUrl,
      emailSent,
    };
  }

  /**
   * List all invitations
   */
  async listInvitations() {
    return prisma.userInvitation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Revoke/delete an invitation
   */
  async revokeInvitation(id: string) {
    const invite = await prisma.userInvitation.findUnique({ where: { id } });
    if (!invite) {
      throw new AppError("Invitation not found.", 404);
    }
    await prisma.userInvitation.delete({ where: { id } });
    return { success: true, message: "Invitation revoked successfully." };
  }

  /**
   * Validate token for public registration page
   */
  async validateToken(token: string) {
    if (!token) {
      return { valid: false, message: "Invitation token is required." };
    }

    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: {
        invitedBy: { select: { name: true, email: true } },
      },
    });

    if (!invitation) {
      return { valid: false, message: "Invalid invitation token." };
    }

    if (invitation.isAccepted) {
      return { valid: false, message: "This invitation has already been accepted." };
    }

    if (new Date() > invitation.expiresAt) {
      return { valid: false, message: "This invitation link has expired." };
    }

    return {
      valid: true,
      email: invitation.email,
      role: invitation.role,
      invitedBy: invitation.invitedBy?.name || "Administrator",
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Complete registration using invitation token
   */
  async registerWithInvite(input: RegisterWithInviteInput) {
    // 1. Verify invitation token
    const invitation = await prisma.userInvitation.findUnique({
      where: { token: input.token },
    });

    if (!invitation) {
      throw new AppError("Invalid invitation token.", 400);
    }

    if (invitation.isAccepted) {
      throw new AppError("This invitation has already been used.", 400);
    }

    if (new Date() > invitation.expiresAt) {
      throw new AppError("This invitation link has expired.", 400);
    }

    // 2. Ensure email is not already registered
    const existing = await prisma.user.findUnique({
      where: { email: invitation.email },
    });
    if (existing) {
      throw new AppError("A user with this email address is already registered.", 400);
    }

    // 3. Hash password and create user with the LOCKED role from the invitation
    const hashedPassword = await hashPassword(input.password);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email: invitation.email,
          passwordHash: hashedPassword,
          role: invitation.role, // LOCKED from invitation!
          phone: input.phone?.trim() || null,
          avatarUrl: input.avatarUrl || null,
          status: "ACTIVE",
        },
      });

      // Mark invitation accepted
      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: {
          isAccepted: true,
          acceptedAt: new Date(),
        },
      });

      return user;
    });

    // 4. Generate JWT token for auto-login
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const { passwordHash, ...sanitizedUser } = newUser;

    return {
      user: sanitizedUser,
      token,
    };
  }
}

export const invitationService = new InvitationService();
