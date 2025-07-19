import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add file to knowledge nest
export const addFile = mutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      const { userId, fileName, fileType, fileSize, fileUrl, description, tags } = args;

      const fileRecord = await ctx.db.insert("knowledge_nest", {
        user_id: userId,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_url: fileUrl,
        description: description || "",
        tags: tags || [],
        uploaded_at: Date.now(),
        is_active: true,
      });

      return {
        success: true,
        message: "File uploaded successfully",
        fileId: fileRecord,
      };
    } catch (error) {
      throw new Error(`Failed to add file: ${error.message}`);
    }
  },
});

// Get all files for a user
export const getUserFiles = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { userId } = args;

      const files = await ctx.db
        .query("knowledge_nest")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), userId),
            q.eq(q.field("is_active"), true)
          )
        )
        .order("desc")
        .collect();

      return files;
    } catch (error) {
      console.error("Error fetching user files:", error);
      return [];
    }
  },
});

// Delete file
export const deleteFile = mutation({
  args: {
    fileId: v.id("knowledge_nest"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { fileId, userId } = args;

      // Verify ownership
      const file = await ctx.db.get(fileId);
      if (!file || file.user_id !== userId) {
        throw new Error("File not found or access denied");
      }

      // Soft delete
      await ctx.db.patch(fileId, {
        is_active: false,
        deleted_at: Date.now(),
      });

      return {
        success: true,
        message: "File deleted successfully",
      };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },
});

// Search files by name or tags
export const searchFiles = query({
  args: {
    userId: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { userId, searchTerm } = args;

      const files = await ctx.db
        .query("knowledge_nest")
        .filter((q) => 
          q.and(
            q.eq(q.field("user_id"), userId),
            q.eq(q.field("is_active"), true)
          )
        )
        .collect();

      // Filter files by search term
      const filteredFiles = files.filter(file => 
        file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.tags && file.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );

      return filteredFiles;
    } catch (error) {
      console.error("Error searching files:", error);
      return [];
    }
  },
});

// Update file metadata
export const updateFileMetadata = mutation({
  args: {
    fileId: v.id("knowledge_nest"),
    userId: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      const { fileId, userId, description, tags } = args;

      // Verify ownership
      const file = await ctx.db.get(fileId);
      if (!file || file.user_id !== userId) {
        throw new Error("File not found or access denied");
      }

      const updateData = {};
      if (description !== undefined) {
        updateData.description = description;
      }
      if (tags !== undefined) {
        updateData.tags = tags;
      }

      await ctx.db.patch(fileId, updateData);

      return {
        success: true,
        message: "File metadata updated successfully",
      };
    } catch (error) {
      throw new Error(`Failed to update file metadata: ${error.message}`);
    }
  },
});
