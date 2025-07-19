import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new chat session
export const createSession = mutation({
  args: {
    username: v.string(),
    title: v.optional(v.string())
  },
  handler: async (ctx, { username, title }) => {
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    
    const id = await ctx.db.insert("chat_sessions", {
      sessionId,
      username,
      title: title || "New Chat",
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      lastMessage: ""
    });
    
    return sessionId;
  },
});

// Get user's chat sessions
export const getUserSessions = query({
  args: {
    username: v.string()
  },
  handler: async (ctx, { username }) => {
    const sessions = await ctx.db
      .query("chat_sessions")
      .withIndex("by_username", (q) => q.eq("username", username))
      .order("desc")
      .collect();
    
    return sessions;
  },
});

// Get session by ID
export const getSession = query({
  args: {
    sessionId: v.string(),
    username: v.string()
  },
  handler: async (ctx, { sessionId, username }) => {
    const session = await ctx.db
      .query("chat_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("username"), username))
      .first();
    
    return session;
  },
});

// Update session title
export const updateSessionTitle = mutation({
  args: {
    sessionId: v.string(),
    username: v.string(),
    title: v.string()
  },
  handler: async (ctx, { sessionId, username, title }) => {
    const session = await ctx.db
      .query("chat_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("username"), username))
      .first();
    
    if (!session) {
      throw new Error("Session not found");
    }
    
    await ctx.db.patch(session._id, {
      title,
      updatedAt: Date.now()
    });
  },
});

// Delete a session
export const deleteSession = mutation({
  args: {
    sessionId: v.string(),
    username: v.string()
  },
  handler: async (ctx, { sessionId, username }) => {
    // Delete session
    const session = await ctx.db
      .query("chat_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("username"), username))
      .first();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
    
    // Delete all messages in the session for this user
    const messages = await ctx.db
      .query("chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("username"), username))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    return { success: true, deletedMessages: messages.length };
  },
});

// Add message to session
export const addMessage = mutation({
  args: {
    sessionId: v.string(),
    username: v.string(),
    role: v.string(),
    content: v.string(),
    messageType: v.optional(v.string()),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, { sessionId, username, role, content, messageType, metadata }) => {
    const timestamp = Date.now();
    
    // Add message
    const messageId = await ctx.db.insert("chat_messages", {
      sessionId,
      username,
      role,
      content,
      timestamp,
      messageType: messageType || "text",
      metadata
    });
    
    // Update session
    const session = await ctx.db
      .query("chat_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("username"), username))
      .first();
    
    if (session) {
      const messageCount = (session.messageCount || 0) + 1;
      const lastMessage = content.length > 50 ? content.substring(0, 50) + "..." : content;
      
      await ctx.db.patch(session._id, {
        updatedAt: timestamp,
        messageCount,
        lastMessage
      });
    }
    
    return messageId;
  },
});

// Get messages for a session
export const getSessionMessages = query({
  args: {
    sessionId: v.string(),
    username: v.string()
  },
  handler: async (ctx, { sessionId, username }) => {
    const messages = await ctx.db
      .query("chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("username"), username))
      .order("asc")
      .collect();
    
    return messages;
  },
});

// Search sessions by title
export const searchSessions = query({
  args: {
    username: v.string(),
    searchTerm: v.string()
  },
  handler: async (ctx, { username, searchTerm }) => {
    const sessions = await ctx.db
      .query("chat_sessions")
      .withIndex("by_username", (q) => q.eq("username", username))
      .filter((q) => 
        q.or(
          q.eq(q.field("title").toLowerCase(), searchTerm.toLowerCase()),
          q.eq(q.field("lastMessage").toLowerCase(), searchTerm.toLowerCase())
        )
      )
      .order("desc")
      .collect();
    
    return sessions.filter(session => 
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.lastMessage && session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  },
});

// Delete messages after a specific message (for edit functionality)
export const deleteMessagesAfter = mutation({
  args: {
    sessionId: v.string(),
    username: v.string(),
    messageId: v.id("chat_messages")
  },
  handler: async (ctx, { sessionId, username, messageId }) => {
    // Get the target message to find its timestamp
    const targetMessage = await ctx.db.get(messageId);
    if (!targetMessage) {
      throw new Error("Message not found");
    }

    // Verify the message belongs to the user and session
    if (targetMessage.username !== username || targetMessage.sessionId !== sessionId) {
      throw new Error("Message access denied");
    }

    // Get all messages after the target message in this session
    const messagesToDelete = await ctx.db
      .query("chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => 
        q.and(
          q.eq(q.field("username"), username),
          q.gt(q.field("timestamp"), targetMessage.timestamp)
        )
      )
      .collect();

    // Delete each message
    for (const message of messagesToDelete) {
      await ctx.db.delete(message._id);
    }

    // Update session's last message and message count
    const remainingMessages = await ctx.db
      .query("chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("username"), username))
      .order("desc")
      .take(1);

    const lastMessage = remainingMessages[0];
    const messageCount = await ctx.db
      .query("chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("username"), username))
      .collect()
      .then(messages => messages.length);

    // Update session
    const session = await ctx.db
      .query("chat_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .filter((q) => q.eq(q.field("username"), username))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        lastMessage: lastMessage ? lastMessage.content : "",
        messageCount,
        updatedAt: Date.now()
      });
    }

    return { deleted: messagesToDelete.length };
  },
});

// Update a specific message content (for edit functionality)
export const updateMessage = mutation({
  args: {
    messageId: v.id("chat_messages"),
    username: v.string(),
    newContent: v.string()
  },
  handler: async (ctx, { messageId, username, newContent }) => {
    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify the message belongs to the user
    if (message.username !== username) {
      throw new Error("Message access denied");
    }

    // Only allow editing user messages
    if (message.role !== 'user') {
      throw new Error("Can only edit user messages");
    }

    // Update the message content
    await ctx.db.patch(messageId, {
      content: newContent.trim()
    });

    return { success: true };
  },
});
