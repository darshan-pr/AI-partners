import { mutation, query } from "./_generated/server";
import {v}from "convex/values";

// Simple password hashing utility (for production, use bcrypt or similar)
const hashPassword = async (password) => {
  // Use Web Crypto API for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password, hashedPassword) => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
};

const formatDuration = (milliseconds) => {
  if (!milliseconds) return "0 seconds";
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}, ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}, ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
};

export const register = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Check specifically for email first
      const existingEmail = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (existingEmail) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      // Check for username
      const existingUsername = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("username"), args.username))
        .first();

      if (existingUsername) {
        throw new Error("USERNAME_ALREADY_EXISTS");
      }

      // Check for phone number
      const existingPhone = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("phoneNumber"), args.phoneNumber))
        .first();

      if (existingPhone) {
        throw new Error("PHONE_ALREADY_EXISTS");
      }

      // Hash password if provided
      const hashedPassword = args.password ? await hashPassword(args.password) : undefined;

      // Create user in register table
      const registerId = await ctx.db.insert("register", {
        username: args.username,
        email: args.email,
        phoneNumber: args.phoneNumber,
        password: hashedPassword,
        isVerified: false,
        createdAt: Date.now(),
      });

      return { 
        success: true, 
        message: args.password 
          ? "Account created successfully" 
          : "User registered successfully. Please verify your email.",
        user: {
          id: registerId,
          username: args.username,
          email: args.email,
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const checkUserExists = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("register")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    return {
      exists: !!user,
      isVerified: user?.isVerified || false,
      username: user?.username || null,
    };
  },
});

export const checkUsernameExists = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("register")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first();
    
    return { exists: !!user };
  },
});

export const checkEmailExists = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("register")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    return { exists: !!user };
  },
});

export const checkPhoneExists = query({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("register")
      .filter((q) => q.eq(q.field("phoneNumber"), args.phoneNumber))
      .first();
    
    return { exists: !!user };
  },
});

export const verifyOTP = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find verification record
      const verification = await ctx.db
        .query("verification")
        .filter((q) => 
          q.and(
            q.eq(q.field("email"), args.email),
            q.eq(q.field("otp"), args.otp),
            q.eq(q.field("isUsed"), false)
          )
        )
        .first();

      if (!verification) {
        throw new Error("INVALID_OTP");
      }

      // Check if OTP is expired
      if (Date.now() > verification.expiresAt) {
        throw new Error("OTP_EXPIRED");
      }

      // Mark OTP as used
      await ctx.db.patch(verification._id, {
        isUsed: true,
      });

      // Find the user
      const user = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (!user) {
        throw new Error("USER_NOT_FOUND_FOR_OTP");
      }

      // Mark user as verified
      await ctx.db.patch(user._id, {
        isVerified: true,
      });

      // Create or update login record
      const existingLogin = await ctx.db
        .query("login")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (existingLogin) {
        await ctx.db.patch(existingLogin._id, {
          status: true,
          lastLoggedIn: Date.now(),
          otp: args.otp,
        });
      } else {
        await ctx.db.insert("login", {
          email: args.email,
          otp: args.otp,
          status: true,
          lastLoggedIn: Date.now(),
        });
      }

      return { 
        success: true, 
        message: "OTP verified successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const logout = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const loginUser = await ctx.db
        .query("login")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (!loginUser) {
        return {
          success: false,
          message: "User not found"
        };
      }

      const currentTime = Date.now();
      
      try {
        const duration = loginUser.lastLoggedIn ? 
          formatDuration(currentTime - loginUser.lastLoggedIn) : 
          "0 seconds";

        await ctx.db.patch(loginUser._id, {
          status: false,
          lastLoggedOut: currentTime,
          lastLoginDuration: duration
        });

        return {
          success: true,
          message: "Logged out successfully",
          duration: duration
        };
      } catch (error) {
        return {
          success: false,
          message: "Error during logout process"
        };
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const getCurrentUser = query({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.email) return null;

    const user = await ctx.db
      .query("register")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    const loginUser = await ctx.db
      .query("login")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (user && loginUser) {
      return {
        ...user,
        status: loginUser.status,
        lastLoggedIn: loginUser.lastLoggedIn,
      };
    }

    return null;
  },
});

export const storeOTP = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Delete any existing unused OTPs for this email
      const existingOTPs = await ctx.db
        .query("verification")
        .filter((q) => 
          q.and(
            q.eq(q.field("email"), args.email),
            q.eq(q.field("isUsed"), false)
          )
        )
        .collect();

      for (const otp of existingOTPs) {
        await ctx.db.delete(otp._id);
      }

      // Store new OTP (expires in 10 minutes)
      const expiresAt = Date.now() + (10 * 60 * 1000);
      
      await ctx.db.insert("verification", {
        email: args.email,
        otp: args.otp,
        createdAt: Date.now(),
        expiresAt: expiresAt,
        isUsed: false,
      });

      return { success: true, message: "OTP stored successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const registerWithPassword = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Check specifically for email first
      const existingEmail = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (existingEmail) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      // Check for username
      const existingUsername = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("username"), args.username))
        .first();

      if (existingUsername) {
        throw new Error("USERNAME_ALREADY_EXISTS");
      }

      // Check for phone number
      const existingPhone = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("phoneNumber"), args.phoneNumber))
        .first();

      if (existingPhone) {
        throw new Error("PHONE_ALREADY_EXISTS");
      }

      // Hash the password
      const hashedPassword = await hashPassword(args.password);

      // Create user in register table
      const registerId = await ctx.db.insert("register", {
        username: args.username,
        email: args.email,
        phoneNumber: args.phoneNumber,
        password: hashedPassword,
        isVerified: false,
        createdAt: Date.now(),
      });

      return { 
        success: true, 
        message: "Account created successfully",
        user: {
          id: registerId,
          username: args.username,
          email: args.email,
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const login = mutation({
  args: {
    identifier: v.string(), // can be username, email, or phone
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find user by identifier (username, email, or phone)
      const user = await ctx.db
        .query("register")
        .filter((q) => 
          q.or(
            q.eq(q.field("username"), args.identifier),
            q.eq(q.field("email"), args.identifier),
            q.eq(q.field("phoneNumber"), args.identifier)
          )
        )
        .first();

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (!user.password) {
        throw new Error("PASSWORD_NOT_SET");
      }

      // Verify password
      if (!(await verifyPassword(args.password, user.password))) {
        throw new Error("INVALID_PASSWORD");
      }

      // Create or update login record
      const existingLogin = await ctx.db
        .query("login")
        .filter((q) => q.eq(q.field("email"), user.email))
        .first();

      if (existingLogin) {
        await ctx.db.patch(existingLogin._id, {
          status: true,
          lastLoggedIn: Date.now(),
        });
      } else {
        await ctx.db.insert("login", {
          email: user.email,
          otp: "", // Empty for password login
          status: true,
          lastLoggedIn: Date.now(),
        });
      }

      return { 
        success: true, 
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const verifyEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find the user
      const user = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      // Mark user as verified
      await ctx.db.patch(user._id, {
        isVerified: true,
      });

      return { 
        success: true, 
        message: "Email verified successfully",
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
});

export const updateProfile = mutation({
  args: {
    currentEmail: v.string(),
    username: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find the user by current email
      const user = await ctx.db
        .query("register")
        .filter((q) => q.eq(q.field("email"), args.currentEmail))
        .first();

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Check if new username is already taken (if different from current)
      if (args.username !== user.username) {
        const existingUsername = await ctx.db
          .query("register")
          .filter((q) => q.eq(q.field("username"), args.username))
          .first();

        if (existingUsername) {
          return {
            success: false,
            message: "Username is already taken",
          };
        }
      }

      // Check if new email is already taken (if different from current)
      if (args.email !== user.email) {
        const existingEmail = await ctx.db
          .query("register")
          .filter((q) => q.eq(q.field("email"), args.email))
          .first();

        if (existingEmail) {
          return {
            success: false,
            message: "Email is already registered",
          };
        }
      }

      // Check if new phone number is already taken (if different from current)
      if (args.phoneNumber !== user.phoneNumber) {
        const existingPhone = await ctx.db
          .query("register")
          .filter((q) => q.eq(q.field("phoneNumber"), args.phoneNumber))
          .first();

        if (existingPhone) {
          return {
            success: false,
            message: "Phone number is already registered",
          };
        }
      }

      // Update the user profile
      await ctx.db.patch(user._id, {
        username: args.username,
        email: args.email,
        phoneNumber: args.phoneNumber,
        updatedAt: Date.now(),
      });

      return {
        success: true,
        message: "Profile updated successfully",
      };

    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        message: "Failed to update profile. Please try again.",
      };
    }
  },
});