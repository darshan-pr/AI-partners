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
      // Store OTP with 5-minute expiration
      const expiration = Date.now() + 5 * 60 * 1000; // 5 minutes
      
      await ctx.db.insert("org_otps", {
        email: args.email,
        otp: args.otp,
        expiration,
        verified: false,
      });

      return { success: true, message: "OTP stored successfully" };
    } catch (error) {
      console.error("Error storing OTP:", error);
      return { success: false, message: "Failed to store OTP" };
    }
  },
});

// Verify OTP for organization
export const verifyOrgOTP = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find the most recent OTP for this email
      const otpRecord = await ctx.db
        .query("org_otps")
        .filter((q) => q.eq(q.field("email"), args.email))
        .order("desc")
        .first();

      if (!otpRecord) {
        return { success: false, message: "No OTP found for this email" };
      }

      if (otpRecord.otp !== args.otp) {
        return { success: false, message: "Invalid OTP" };
      }

      if (Date.now() > otpRecord.expiration) {
        return { success: false, message: "OTP has expired" };
      }

      if (otpRecord.verified) {
        return { success: false, message: "OTP has already been used" };
      }

      // Mark OTP as verified
      await ctx.db.patch(otpRecord._id, { verified: true });

      return { success: true, message: "OTP verified successfully" };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return { success: false, message: "Failed to verify OTP" };
    }
  },
});

// Check OTP verification status
export const checkOTPVerification = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const verifiedOTP = await ctx.db
        .query("org_otps")
        .filter((q) => 
          q.and(
            q.eq(q.field("email"), args.email),
            q.eq(q.field("verified"), true)
          )
        )
        .order("desc")
        .first();

      return { 
        success: true, 
        verified: !!verifiedOTP,
        message: verifiedOTP ? "Email verified" : "Email not verified"
      };
    } catch (error) {
      console.error("Error checking OTP verification:", error);
      return { success: false, message: "Failed to check verification status" };
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
      uploaded_username: "system",
      subject: file.subject,
      filename: file.name,
      file_id: "file_demo_" + Math.random().toString(36).substr(2, 9),
      file_size: file.size,
      file_type: file.mimetype,
      upload_date: Date.now(),
      description: file.description,
      is_active: true,
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
      return !!(organization && organization.org_verified);
    } catch (error) {
      console.error("Error checking org verification:", error);
      return false;
    }
  },
});
