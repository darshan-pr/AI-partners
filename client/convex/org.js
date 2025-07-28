import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Store OTP for organization verification
export const storeOrgOTP = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Validate email domain
      if (!args.email.endsWith("@reva.edu.in")) {
        return { success: false, message: "Only @reva.edu.in domain is allowed" };
      }

      // Delete any existing OTP for this email
      const existingOTPs = await ctx.db
        .query("verification")
        .filter((q) => q.eq(q.field("email"), args.email))
        .collect();

      for (const otp of existingOTPs) {
        await ctx.db.delete(otp._id);
      }

      // Create new OTP record
      const otpId = await ctx.db.insert("verification", {
        email: args.email,
        otp: args.otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        isUsed: false,
      });

      return { success: true, message: "OTP stored successfully", id: otpId };
    } catch (error) {
      console.error("Error storing OTP:", error);
      return { success: false, message: "Failed to store OTP" };
    }
  },
});

// Verify organization email OTP (separate from user auth OTP)
export const verifyOrgOTP = mutation({
  args: {
    org_mail: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Validate email domain first
      if (!args.org_mail.endsWith("@reva.edu.in")) {
        return { success: false, message: "Only @reva.edu.in domain is allowed" };
      }

      // Check OTP in verification table
      const verification = await ctx.db
        .query("verification")
        .filter((q) => 
          q.and(
            q.eq(q.field("email"), args.org_mail),
            q.eq(q.field("otp"), args.otp),
            q.eq(q.field("isUsed"), false)
          )
        )
        .first();

      if (!verification) {
        // Check if there's any OTP for this email (used or unused)
        const anyOtp = await ctx.db
          .query("verification")
          .filter((q) => q.eq(q.field("email"), args.org_mail))
          .order("desc")
          .first();

        if (!anyOtp) {
          return { success: false, message: "No OTP found for this email. Please request a new one." };
        } else if (anyOtp.isUsed) {
          return { success: false, message: "This OTP has already been used. Please request a new one." };
        } else {
          return { success: false, message: "Invalid OTP. Please check and try again." };
        }
      }

      // Check if OTP is expired
      if (verification.expiresAt < Date.now()) {
        return { success: false, message: "OTP has expired. Please request a new one." };
      }

      // Mark OTP as used
      await ctx.db.patch(verification._id, {
        isUsed: true,
      });

      return { success: true, message: "Organization email verified successfully" };
    } catch (error) {
      console.error("Error verifying org email:", error);
      return { success: false, message: "Failed to verify OTP. Please try again." };
    }
  },
});

// Create or update organization record
export const createOrUpdateOrg = mutation({
  args: {
    org_name: v.string(),
    org_user: v.string(),
    org_mail: v.string(),
    class_sec: v.string(),
    semester: v.string(), // Add semester parameter
    branch: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Validate email domain
      if (!args.org_mail.endsWith("@reva.edu.in")) {
        return { success: false, message: "Only @reva.edu.in domain is allowed" };
      }

      // Check if org already exists for this user
      const existingOrg = await ctx.db
        .query("org")
        .withIndex("by_org_user", (q) => q.eq("org_user", args.org_user))
        .first();

      if (existingOrg) {
        // Update existing record
        await ctx.db.patch(existingOrg._id, {
          org_name: args.org_name,
          org_mail: args.org_mail,
          class_sec: args.class_sec,
          semester: args.semester,
          branch: args.branch,
          org_verified: true,
          verifiedAt: Date.now(),
        });
        return { success: true, message: "Organization record updated", id: existingOrg._id };
      } else {
        // Create new record
        const newOrgId = await ctx.db.insert("org", {
          org_name: args.org_name,
          org_user: args.org_user,
          org_mail: args.org_mail,
          org_verified: true,
          class_sec: args.class_sec,
          semester: args.semester,
          branch: args.branch,
          createdAt: Date.now(),
          verifiedAt: Date.now(),
        });
        return { success: true, message: "Organization record created", id: newOrgId };
      }
    } catch (error) {
      console.error("Error creating/updating org:", error);
      return { success: false, message: "Failed to create/update organization record" };
    }
  },
});

// Get organization record by username
export const getOrgByUser = query({
  args: { org_user: v.string() },
  handler: async (ctx, args) => {
    try {
      const orgRecord = await ctx.db
        .query("org")
        .withIndex("by_org_user", (q) => q.eq("org_user", args.org_user))
        .first();

      if (orgRecord) {
        return { success: true, org: orgRecord };
      } else {
        return { success: false, message: "Organization record not found" };
      }
    } catch (error) {
      console.error("Error fetching org record:", error);
      return { success: false, message: "Failed to fetch organization record" };
    }
  },
});

// Check if user has verified organization
export const isOrgVerified = query({
  args: { org_user: v.string() },
  handler: async (ctx, args) => {
    try {
      const orgRecord = await ctx.db
        .query("org")
        .withIndex("by_org_user", (q) => q.eq("org_user", args.org_user))
        .first();

      return orgRecord ? orgRecord.org_verified : false;
    } catch (error) {
      console.error("Error checking org verification:", error);
      return false;
    }
  },
});
