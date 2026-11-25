import { getSql } from "@/lib/db";

export type TestPlan = "actual" | "free" | "premium";
let testPlan: TestPlan = "actual";

// Explicit opt-in, isolated embedded database, and auth-off local test identity.
// Never enable this for a deployed or shared authenticated environment.
export function testPlanAllowed(userId: string, env = process.env) {
  return (
    userId === "dev-user" &&
    env.NODE_ENV === "development" &&
    env.GAMEFINDER_LOCAL_TEST_PLAN === "1" &&
    env.VITE_AUTH_ENABLED === "false" &&
    !env.DATABASE_URL?.trim()
  );
}
export function getTestPlan(userId: string) {
  return {
    enabled: testPlanAllowed(userId),
    mode: testPlanAllowed(userId) ? testPlan : ("actual" as const),
  };
}
export function setTestPlan(userId: string, mode: TestPlan) {
  if (!testPlanAllowed(userId) || !["actual", "free", "premium"].includes(mode))
    throw new Error("Subscription simulation unavailable");
  testPlan = mode;
  return getTestPlan(userId);
}
export async function hasPremiumPlan(userId: string) {
  if (userId === "dev-user") return testPlanAllowed(userId) && testPlan === "premium";
  const sql = await getSql();
  const rows = await sql<{ plan: string }>`
    select plan from profiles where user_id = ${userId} limit 1
  `;
  return rows[0]?.plan === "premium";
}

export async function requireFinnPremium(userId: string, lookup = hasPremiumPlan) {
  if (!userId || (userId === "dev-user" && !testPlanAllowed(userId)) || !(await lookup(userId))) {
    throw new Error("Learn with Finn requires GameFinder Premium.");
  }
}
