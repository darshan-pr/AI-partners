/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiReview from "../aiReview.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as knowledgeNest from "../knowledgeNest.js";
import type * as org from "../org.js";
import type * as org_backup from "../org_backup.js";
import type * as org_clean from "../org_clean.js";
import type * as quiz from "../quiz.js";
import type * as studyPlanner from "../studyPlanner.js";
import type * as test from "../test.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiReview: typeof aiReview;
  auth: typeof auth;
  chat: typeof chat;
  knowledgeNest: typeof knowledgeNest;
  org: typeof org;
  org_backup: typeof org_backup;
  org_clean: typeof org_clean;
  quiz: typeof quiz;
  studyPlanner: typeof studyPlanner;
  test: typeof test;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
