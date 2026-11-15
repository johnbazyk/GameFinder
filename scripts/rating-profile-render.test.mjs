import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
test("profile renders canonical values and scope evidence without a fabricated incomplete polygon", async () => {
  const server = await createServer({
    configFile: false,
    plugins: [react()],
    resolve: { alias: { "@": new URL("../src", import.meta.url).pathname } },
    server: { middlewareMode: true },
    logLevel: "silent",
  });
  try {
    const { RatingProfile } = await server.ssrLoadModule("/src/components/rating-profile.tsx");
    const { GAMES } = await server.ssrLoadModule("/src/lib/catalog.ts");
    const game = GAMES.find((g) => g.bggId === "3931");
    const ctx = {
      players: 2,
      ageBand: "8-10",
      maxTimeMin: null,
      timeOver60: false,
      vibes: ["family"],
      exactTraits: null,
      ratingMode: "beta",
    };
    const html = renderToStaticMarkup(
      React.createElement(RatingProfile, { game, initialContext: ctx }),
    );
    assert.match(html, /Strategy: 4 \/ 5 · Provisional/);
    assert.match(html, /Family: 3.5 \/ 5 · Provisional/);
    assert.match(html, /scale 1 to 5/);
    assert.match(html, /Hasbro classic drop-only/);
    const missing = renderToStaticMarkup(
      React.createElement(RatingProfile, { game, initialContext: { ...ctx, players: 4 } }),
    );
    assert.match(missing, /Not assessed/);
    assert.match(missing, /Incomplete profile/);
    assert.doesNotMatch(missing, /<polygon/);
  } finally {
    await server.close();
  }
});
