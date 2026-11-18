import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stores, users, passwordResets } from "@repo/db";
import { eq, and, desc, gt } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, slug, otp, newPassword } = body;

    if (!slug || !email) {
      return NextResponse.json(
        { success: false, error: "Store slug and email are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Resolve Store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found." },
        { status: 404 }
      );
    }

    // 2. Resolve User for this specific store
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, cleanEmail), eq(users.storeId, store.id)),
    });

    // ========================================================
    // ACTION: REQUEST OTP
    // ========================================================
    if (action === "request-otp") {
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "No administrator account found with this email address for this store.",
          },
          { status: 404 }
        );
      }

      // Generate a secure 6-digit numeric OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash("sha256").update(generatedOtp).digest("hex");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

      // Invalidate any previous unused OTPs for this user
      const resetId = crypto.randomUUID();
      await db.insert(passwordResets).values({
        id: resetId,
        storeId: store.id,
        email: cleanEmail,
        otpHash: otpHash,
        expiresAt: expiresAt,
        isUsed: false,
      });

      // Send the OTP via Resend
      const emailResult = await sendPasswordResetOtpEmail({
        toEmail: cleanEmail,
        merchantName: user.name || "Store Administrator",
        storeName: store.name,
        otp: generatedOtp,
      });

      if (!emailResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: emailResult.error || "Failed to deliver OTP to your email. Please try again.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
      });
    }

    // ========================================================
    // ACTION: VERIFY OTP
    // ========================================================
    if (action === "verify-otp") {
      if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid 6-digit verification code." },
          { status: 400 }
        );
      }

      const inputOtpHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");

      const validResetRecord = await db.query.passwordResets.findFirst({
        where: and(
          eq(passwordResets.storeId, store.id),
          eq(passwordResets.email, cleanEmail),
          eq(passwordResets.isUsed, false),
          gt(passwordResets.expiresAt, new Date())
        ),
        orderBy: [desc(passwordResets.createdAt)],
      });

      if (!validResetRecord || validResetRecord.otpHash !== inputOtpHash) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired verification code." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Code verified successfully.",
      });
    }

    // ========================================================
    // ACTION: RESET PASSWORD
    // ========================================================
    if (action === "reset-password") {
      if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
        return NextResponse.json(
          { success: false, error: "Valid verification code is required." },
          { status: 400 }
        );
      }

      if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User account not found." },
          { status: 404 }
        );
      }

      const inputOtpHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");

      const validResetRecord = await db.query.passwordResets.findFirst({
        where: and(
          eq(passwordResets.storeId, store.id),
          eq(passwordResets.email, cleanEmail),
          eq(passwordResets.isUsed, false),
          gt(passwordResets.expiresAt, new Date())
        ),
        orderBy: [desc(passwordResets.createdAt)],
      });

      if (!validResetRecord || validResetRecord.otpHash !== inputOtpHash) {
        return NextResponse.json(
          { success: false, error: "Verification code has expired or is invalid. Please request a new one." },
          { status: 400 }
        );
      }

      // Hash the new password with bcrypt
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update the user password in database
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id));

      // Mark the reset record as used
      await db
        .update(passwordResets)
        .set({ isUsed: true })
        .where(eq(passwordResets.id, validResetRecord.id));

      return NextResponse.json({
        success: true,
        message: "Your password has been successfully updated. You can now sign in.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action requested." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
