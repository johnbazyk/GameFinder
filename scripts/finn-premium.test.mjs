import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import vm from "node:vm";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const source = read("src/lib/premium-entitlement.server.ts");
function helper(plan, env = {}) {
  const exports = {};
  const sql = async (_parts, userId) => {
    assert.equal(userId, "verified-user");
    return plan == null ? [] : [{ plan }];
  };
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports,
      process: { env },
      require: (id) =>
        id.includes("subscription-ledger")
          ? { readManagedEntitlement: async () => null }
          : { getSql: async () => sql },
    },
  );
  return exports;
}
test("Finn entitlement accepts only the verified Premium profile", async () => {
  await helper("premium").requireFinnPremium("verified-user");
  for (const plan of ["free", "expired", null])
    await assert.rejects(
      helper(plan).requireFinnPremium("verified-user"),
      /requires GameFinder Premium/,
    );
});
test("Finn denies anonymous and shared development identity without querying a plan", async () => {
  for (const id of ["", "dev-user"])
    await assert.rejects(
      helper("premium").requireFinnPremium(id, async () => {
        assert.fail("lookup must not run");
      }),
      /requires GameFinder Premium/,
    );
});
test("Finn fails closed when entitlement lookup fails", async () => {
  await assert.rejects(
    helper("premium").requireFinnPremium("verified-user", async () => {
      throw new Error("database unavailable");
    }),
    /database unavailable/,
  );
});
test("all five Finn server functions authenticate and check entitlement before provider work", () => {
  const ast = ts.createSourceFile(
    "coach.ts",
    read("src/lib/coach.ts"),
    ts.ScriptTarget.Latest,
    true,
  );
  const names = ["isFinnVoiceConfigured", "askFinn", "askFinnLesson", "speakFinn", "hearFinn"];
  for (const name of names) {
    const declaration = ast.statements
      .flatMap((s) => (ts.isVariableStatement(s) ? [...s.declarationList.declarations] : []))
      .find((d) => d.name.getText(ast) === name);
    assert.ok(declaration, name);
    const code = declaration.getText(ast);
    assert.match(code, /\.middleware\(\[authMiddleware\]\)/);
    const handler = code.slice(code.indexOf(".handler("));
    assert.match(handler, /await requireFinnPremium\(context\.userId\)/);
    assert.ok(handler.indexOf("await requireFinnPremium") < handler.indexOf("apiKey()"), name);
  }
});
test("Finn coaching panel and full teaching route both use the Premium gate", () => {
  for (const path of ["src/components/finn-coach.tsx", "src/routes/game.$id.teach.tsx"])
    assert.match(read(path), /<PremiumGate feature="finn">/);
});

const isolated = {
  NODE_ENV: "development",
  GAMEFINDER_LOCAL_TEST_PLAN: "1",
  VITE_AUTH_ENABLED: "false",
};
test("isolated lab switches actual, free, premium and back without billing writes", async () => {
  const h = helper(null, isolated);
  assert.equal(h.getTestPlan("dev-user").enabled, true);
  assert.equal(await h.hasPremiumPlan("dev-user"), false);
  h.setTestPlan("dev-user", "premium");
  assert.equal(await h.hasPremiumPlan("dev-user"), true);
  await h.requireFinnPremium("dev-user");
  h.setTestPlan("dev-user", "free");
  assert.equal(await h.hasPremiumPlan("dev-user"), false);
  await assert.rejects(h.requireFinnPremium("dev-user"), /requires GameFinder Premium/);
  h.setTestPlan("dev-user", "actual");
  assert.equal(await h.hasPremiumPlan("dev-user"), false);
});
test("simulation fails closed for production, real databases, missing opt-in and authenticated accounts", async () => {
  for (const env of [
    { ...isolated, NODE_ENV: "production" },
    { ...isolated, DATABASE_URL: "postgres://test" },
    { ...isolated, GAMEFINDER_LOCAL_TEST_PLAN: "0" },
    { ...isolated, VITE_AUTH_ENABLED: "true" },
    {},
  ]) {
    const h = helper(null, env);
    assert.equal(h.getTestPlan("dev-user").enabled, false);
    assert.throws(() => h.setTestPlan("dev-user", "premium"), /unavailable/);
    assert.equal(await h.hasPremiumPlan("dev-user"), false);
  }
  const h = helper("free", isolated);
  assert.throws(() => h.setTestPlan("verified-user", "premium"), /unavailable/);
  assert.throws(() => h.setTestPlan("dev-user", "invalid"), /unavailable/);
  assert.equal(await h.hasPremiumPlan("verified-user"), false);
});
