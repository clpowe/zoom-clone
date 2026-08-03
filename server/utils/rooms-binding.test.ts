import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { unstable_readConfig } from "wrangler";

describe("rooms D1 binding", () => {
  it("binds the rooms database to the Worker", () => {
    const configPath = fileURLToPath(new URL("../../wrangler.jsonc", import.meta.url));
    const config = unstable_readConfig({ config: configPath }, { hideWarnings: true });

    const binding = config.d1_databases.find(
      (candidate: { binding: string }) => candidate.binding === "zoom_clone_rooms",
    );

    expect(binding).toMatchObject({
      binding: "zoom_clone_rooms",
      database_name: "still-mouse-6292-rooms",
    });
    expect(binding?.database_id).toMatch(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
  });
});
