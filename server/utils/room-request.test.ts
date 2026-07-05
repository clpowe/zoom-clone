import { describe, expect, it } from "vitest";
import { parseCreateRoomBody } from "./room-request";

describe("parseCreateRoomBody", () => {
  it("accepts a valid room title", () => {
    expect(parseCreateRoomBody({ title: "Team Standup" })).toEqual({
      title: "Team Standup",
    });
  });

  it("trims room titles", () => {
    expect(parseCreateRoomBody({ title: "  Family Call  " })).toEqual({
      title: "Family Call",
    });
  });

  it("rejects an empty room title", () => {
    expect(() => parseCreateRoomBody({ title: "   " })).toThrow();
  });

  it("rejects a missing room title", () => {
    expect(() => parseCreateRoomBody({})).toThrow();
  });
});
