import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Test function to verify organization-based file sharing works
export const testOrgFileSharing = mutation({
  args: {
    testOrgName: v.string(),
    testOrgMail: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log("🧪 Starting Organization File Sharing Test...");
      
      // Step 1: Create test organization with first user
      console.log("📝 Step 1: Creating organization with first user...");
      const result1 = await ctx.runMutation("org:createOrUpdateOrg", {
        org_name: args.testOrgName,
        org_mail: "admin@" + args.testOrgMail,
        org_user: "student1@" + args.testOrgMail,
        semester: "3",
        branch: "Computer Science"
      });
      console.log("✅ First user created:", result1);

      // Step 2: Add second user to same organization
      console.log("📝 Step 2: Adding second user to same organization...");
      const result2 = await ctx.runMutation("org:createOrUpdateOrg", {
        org_name: args.testOrgName,
        org_mail: "admin@" + args.testOrgMail,
        org_user: "student2@" + args.testOrgMail,
        semester: "3",
        branch: "Computer Science"
      });
      console.log("✅ Second user added:", result2);

      // Step 3: Check files visible to first user
      console.log("📝 Step 3: Checking files visible to first user...");
      const files1 = await ctx.runQuery("knowledgeNest:getKnowledgeNestFiles", {
        username: "student1@" + args.testOrgMail,
      });
      console.log("📁 Files visible to student1:", files1?.files?.length || 0);

      // Step 4: Check files visible to second user (should be same)
      console.log("📝 Step 4: Checking files visible to second user...");
      const files2 = await ctx.runQuery("knowledgeNest:getKnowledgeNestFiles", {
        username: "student2@" + args.testOrgMail,
      });
      console.log("📁 Files visible to student2:", files2?.files?.length || 0);

      // Step 5: Verify both users see the same files
      const sameFiles = files1?.files?.length === files2?.files?.length;
      console.log("🎯 Both users see same files:", sameFiles);

      // Step 6: Check organization count (should be 1)
      const orgs = await ctx.db.query("organizations").collect();
      const testOrg = orgs.find(org => org.org_name === args.testOrgName);
      console.log("🏢 Test organization found:", !!testOrg);
      
      const userOrgs = await ctx.db.query("user_organizations").collect();
      const testUserOrgs = userOrgs.filter(uo => uo.organization_id === testOrg?._id);
      console.log("👥 Users in test organization:", testUserOrgs.length);

      return {
        success: true,
        message: "Organization file sharing test completed successfully!",
        results: {
          organizationCreated: !!testOrg,
          usersInOrg: testUserOrgs.length,
          filesVisibleToUser1: files1?.files?.length || 0,
          filesVisibleToUser2: files2?.files?.length || 0,
          bothUsersSeeFiles: sameFiles,
          testPassed: sameFiles && testUserOrgs.length === 2
        }
      };

    } catch (error) {
      console.error("❌ Test failed:", error);
      return {
        success: false,
        message: "Test failed: " + error.message,
        error: error.toString()
      };
    }
  },
});

// Clean up test data
export const cleanupTestData = mutation({
  args: {
    testOrgName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find and delete test organization
      const orgs = await ctx.db.query("organizations").collect();
      const testOrg = orgs.find(org => org.org_name === args.testOrgName);
      
      if (testOrg) {
        // Delete user_organizations records
        const userOrgs = await ctx.db.query("user_organizations").collect();
        const testUserOrgs = userOrgs.filter(uo => uo.organization_id === testOrg._id);
        for (const userOrg of testUserOrgs) {
          await ctx.db.delete(userOrg._id);
        }
        
        // Delete knowledge_nest files
        const files = await ctx.db.query("knowledge_nest").collect();
        const testFiles = files.filter(f => f.organization_id === testOrg._id);
        for (const file of testFiles) {
          await ctx.db.delete(file._id);
        }
        
        // Delete organization
        await ctx.db.delete(testOrg._id);
        
        return { success: true, message: "Test data cleaned up successfully" };
      }
      
      return { success: true, message: "No test data found to clean up" };
    } catch (error) {
      return { success: false, message: "Cleanup failed: " + error.message };
    }
  },
});
