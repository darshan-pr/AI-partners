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

// Helper function to create demo files for a new organization
async function createDemoFiles(ctx, orgId, semester, branch) {
  const demoFiles = [
    {
      name: "Computer Science Fundamentals - Chapter 1.pdf",
      subject: "Computer Science",
      mimetype: "application/pdf",
      size: 2048000,
      description: "Introduction to programming concepts and data structures"
    },
    {
      name: "Mathematics for Engineers - Linear Algebra.pdf", 
      subject: "Mathematics",
      mimetype: "application/pdf",
      size: 1536000,
      description: "Basic linear algebra concepts for engineering students"
    },
    {
      name: "Physics Lab Manual - Semester " + semester + ".pdf",
      subject: "Physics",
      mimetype: "application/pdf", 
      size: 1024000,
      description: "Laboratory experiments and procedures for semester " + semester
    }
  ];

  for (const file of demoFiles) {
    await ctx.db.insert("knowledge_nest", {
      organization_id: orgId,
      semester: semester,
      branch: branch,
      subject: file.subject,
      filename: file.name,
      fileUrl: null, // Demo files don't have actual storage
      mimetype: file.mimetype,
      size: file.size,
      description: file.description,
      uploadedBy: "system",
      uploadedAt: Date.now(),
      isDemo: true, // Mark as demo file
    });
  }
}

export const createOrUpdateOrg = mutation({
  args: {
    org_name: v.string(),
    org_user: v.string(),
    org_mail: v.string(),
    semester: v.string(),
    branch: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Validate email domain
      if (!args.org_mail.endsWith("@reva.edu.in")) {
        return { success: false, message: "Only @reva.edu.in domain is allowed" };
      }

      // Validate semester (1-8)
      const semesterNum = parseInt(args.semester);
      if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
        return { success: false, message: "Semester must be between 1 and 8" };
      }

      // Check if organization already exists by name
      let organization = await ctx.db
        .query("organizations")
        .withIndex("by_org_name", (q) => q.eq("org_name", args.org_name))
        .first();

      // If organization doesn't exist, create it
      if (!organization) {
        const orgId = await ctx.db.insert("organizations", {
          org_name: args.org_name,
          org_mail: args.org_mail,
          org_verified: true,
          createdAt: Date.now(),
          verifiedAt: Date.now(),
        });
        organization = await ctx.db.get(orgId);

        // Create demo files for the new organization
        await createDemoFiles(ctx, orgId, args.semester, args.branch);
      }

      // Check if user is already linked to this organization
      const existingUserOrg = await ctx.db
        .query("user_organizations")
        .withIndex("by_username", (q) => q.eq("username", args.org_user))
        .first();

      if (existingUserOrg) {
        // Update existing record
        await ctx.db.patch(existingUserOrg._id, {
          organization_id: organization._id,
          semester: args.semester,
          branch: args.branch,
          isActive: true,
        });
        return { success: true, message: "Organization record updated", id: existingUserOrg._id };
      } else {
        // Create new user-organization mapping
        const userOrgId = await ctx.db.insert("user_organizations", {
          username: args.org_user,
          organization_id: organization._id,
          semester: args.semester,
          branch: args.branch,
          role: "member",
          joinedAt: Date.now(),
          isActive: true,
        });
        return { success: true, message: "Organization record created", id: userOrgId };
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
      // Get user's organization mapping
      const userOrg = await ctx.db
        .query("user_organizations")
        .withIndex("by_username", (q) => q.eq("username", args.org_user))
        .first();

      if (!userOrg || !userOrg.isActive) {
        return { success: false, message: "User organization record not found" };
      }

      // Get the organization details
      const organization = await ctx.db.get(userOrg.organization_id);
      
      if (!organization) {
        return { success: false, message: "Organization not found" };
      }

      // Combine user org details with organization details
      const orgData = {
        ...organization,
        semester: userOrg.semester,
        branch: userOrg.branch,
        role: userOrg.role,
        joinedAt: userOrg.joinedAt,
      };

      return { success: true, org: orgData };
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
      // Get user's organization mapping
      const userOrg = await ctx.db
        .query("user_organizations")
        .withIndex("by_username", (q) => q.eq("username", args.org_user))
        .first();

      if (!userOrg || !userOrg.isActive) {
        return false;
      }

      // Get the organization and check if it's verified
      const organization = await ctx.db.get(userOrg.organization_id);
      return organization ? organization.org_verified : false;
    } catch (error) {
      console.error("Error checking org verification:", error);
      return false;
    }
  },
});
