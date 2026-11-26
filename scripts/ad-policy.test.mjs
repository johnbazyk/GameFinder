import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(new URL("../src/lib/ad-policy.ts", import.meta.url), "utf8");
const { shouldShowAd } = await import(
  "data:text/javascript;base64," +
    Buffer.from(
      ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText,
    ).toString("base64")
);
test("only positively verified Free accounts can display advertisements", () => {
  for (const plan of ["unknown", "free", "premium"])
    for (const ready of [false, true])
      for (const premium of [false, true])
        for (const ads of [false, true]) {
          assert.equal(
            shouldShowAd({ plan, ready, premium, ads }),
            plan === "free" && ready && !premium && ads,
          );
        }
});
