import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Utility function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Utility function to generate org_id
const generateOrgId = () => {
  return 'ORG_' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Store OTP for organization verification
export const storeOrgOTP = mutation({
  args: {
    orgEmail: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { orgEmail, otp } = args;

      const now = Date.now();
      const expiresAt = now + (10 * 60 * 1000); // 10 minutes

      // Remove any existing OTP for this email
      const existingOTP = await ctx.db
        .query("org_verification")
        .filter((q) => q.eq(q.field("org_email"), orgEmail))
        .collect();

      for (const otpRecord of existingOTP) {
        await ctx.db.delete(otpRecord._id);
      }

      // Store new OTP
      await ctx.db.insert("org_verification", {
        org_email: orgEmail,
        otp,
        createdAt: now,
        expiresAt,
        isUsed: false,
      });

      return {
        success: true,
        message: "OTP stored successfully",
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

// Check if email domain is valid (e.g., @reva.edu.in)
const isValidOrgDomain = (email) => {
  const allowedDomains = ['reva.edu.in']; // Add more domains as needed
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
};

export const verifyOrgOTP = mutation({
  args: {
    orgEmail: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { orgEmail, otp } = args;

      // Find the OTP record
      const otpRecord = await ctx.db
        .query("org_verification")
        .filter((q) => 
          q.and(
            q.eq(q.field("org_email"), orgEmail),
            q.eq(q.field("otp"), otp),
            q.eq(q.field("isUsed"), false)
          )
        )
        .first();

      if (!otpRecord) {
        throw new Error("Invalid OTP");
      }

      // Check if OTP is expired
      if (Date.now() > otpRecord.expiresAt) {
        throw new Error("OTP has expired");
      }

      // Mark OTP as used
      await ctx.db.patch(otpRecord._id, {
        isUsed: true,
      });

      return {
        success: true,
        message: "OTP verified successfully",
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const saveOrgDetails = mutation({
  args: {
    userId: v.string(),
    orgEmail: v.string(),
    classSec: v.string(),
    branch: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { userId, orgEmail, classSec, branch } = args;

      // Verify that the OTP was verified for this email
      const verifiedOTP = await ctx.db
        .query("org_verification")
        .filter((q) => 
          q.and(
            q.eq(q.field("org_email"), orgEmail),
            q.eq(q.field("isUsed"), true)
          )
        )
        .first();

      if (!verifiedOTP) {
        throw new Error("Email verification required");
      }

      // Extract organization name from email domain
      const orgName = orgEmail.split('@')[1].split('.')[0].toUpperCase();

      // Generate unique org_id
      const orgId = generateOrgId();

      // Save organization details
      const orgRecord = await ctx.db.insert("org", {
        org_id: orgId,
        org_name: orgName,
        user_id: userId,
        user_org_mailid: orgEmail,
        class_sec: classSec,
        branch: branch,
        isVerified: true,
        createdAt: Date.now(),
      });

      // Update user's organization verification status in register table
      await ctx.db.patch(userId, {
        isOrgVerified: true,
        orgId: orgId,
      });

      return {
        success: true,
        message: "Organization details saved successfully",
        orgData: {
          org_id: orgId,
          org_name: orgName,
          class_sec: classSec,
          branch: branch,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const getUserOrgDetails = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { userId } = args;

      const orgDetails = await ctx.db
        .query("org")
        .filter((q) => q.eq(q.field("user_id"), userId))
        .first();

      return orgDetails || null;
    } catch (error) {
      console.error("Error fetching org details:", error);
      return null;
    }
  },
});

export const updateOrgDetails = mutation({
  args: {
    userId: v.string(),
    classSec: v.optional(v.string()),
    branch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const { userId, classSec, branch } = args;

      // Find existing organization record
      const existingOrg = await ctx.db
        .query("org")
        .filter((q) => q.eq(q.field("user_id"), userId))
        .first();

      if (!existingOrg) {
        throw new Error("Organization record not found");
      }

      // Update only the editable fields
      const updateData = {};
      if (classSec !== undefined && classSec !== null) {
        updateData.class_sec = classSec;
      }
      if (branch !== undefined && branch !== null) {
        updateData.branch = branch;
      }

      await ctx.db.patch(existingOrg._id, updateData);

      return {
        success: true,
        message: "Organization details updated successfully",
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const checkOrgEmailExists = query({
  args: {
    orgEmail: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { orgEmail } = args;

      const existingOrg = await ctx.db
        .query("org")
        .filter((q) => q.eq(q.field("user_org_mailid"), orgEmail))
        .first();

      return !!existingOrg;
    } catch (error) {
      console.error("Error checking org email:", error);
      return false;
    }
  },
});

// Check if user is organization verified by username
export const checkUserOrgVerification = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { username } = args;

      // First get user details from register table
      const user = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("username"), username))
        .first();

      if (!user) {
        return {
          isVerified: false,
          message: "User not found",
          debug: { username, userFound: false }
        };
      }

      // Check if user has organization verification
      const orgRecord = await ctx.db
        .query("org")
        .filter((q) => q.eq(q.field("user_id"), user._id))
        .first();

      if (!orgRecord) {
        return {
          isVerified: false,
          message: "Organization verification required",
          debug: { 
            username, 
            userFound: true, 
            userId: user._id,
            orgRecordFound: false 
          }
        };
      }

      return {
        isVerified: orgRecord.isVerified || false,
        orgData: orgRecord,
        userEmail: user.email,
        message: orgRecord.isVerified ? "Organization verified" : "Organization verification pending",
        debug: {
          username,
          userFound: true,
          userId: user._id,
          orgRecordFound: true,
          isVerified: orgRecord.isVerified
        }
      };
    } catch (error) {
      console.error("Error checking user org verification:", error);
      return {
        isVerified: false,
        message: "Error checking verification status",
        debug: { error: error.message }
      };
    }
  },
});

// Get user details by username (for email lookup)
export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { username } = args;

      const user = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("username"), username))
        .first();

      return user || null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  },
});

// Simple check if user is organization verified by user ID
export const checkUserOrgVerifiedById = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { userId } = args;

      const user = await ctx.db.get(userId);
      
      if (!user) {
        return {
          isVerified: false,
          message: "User not found"
        };
      }

      return {
        isVerified: user.isOrgVerified || false,
        orgId: user.orgId || null,
        message: user.isOrgVerified ? "Organization verified" : "Organization verification required"
      };
    } catch (error) {
      console.error("Error checking organization verification:", error);
      return {
        isVerified: false,
        message: "Error checking verification status"
      };
    }
  },
});
