"use client";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TestOrgVerification() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const orgDetails = useQuery(api.orgVerification.getUserOrgDetails, 
    user?.id ? { userId: user.id } : "skip"
  );

  const orgVerification = useQuery(api.orgVerification.checkUserOrgVerifiedById, 
    user?.id ? { userId: user.id } : "skip"
  );

  const userDetails = useQuery(api.orgVerification.getUserByUsername,
    user?.username ? { username: user.username } : "skip"
  );

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Organization Verification Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">User from localStorage:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">User Details from DB:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {userDetails === undefined ? "Loading..." : JSON.stringify(userDetails, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Organization Details (NAVBAR APPROACH):</h2>
          <p className="text-sm mb-2">
            <strong>Verification Status:</strong> {orgDetails ? "✅ VERIFIED" : "❌ NOT VERIFIED"}
          </p>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {orgDetails === undefined ? "Loading..." : JSON.stringify(orgDetails, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Organization Verification (New Crystal Clear Approach):</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {orgVerification === undefined ? "Loading..." : JSON.stringify(orgVerification, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
