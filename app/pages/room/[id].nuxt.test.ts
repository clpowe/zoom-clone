import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import RoomPage from "./[id].vue";

registerEndpoint("/api/rooms/room-123", () => {
  return new Response(null, {
    status: 404,
    statusText: "Room not found",
  });
});

describe("room page loading", () => {
  it("displays the room-loading error", async () => {
    const wrapper = await mountSuspended(RoomPage, {
      route: "/room/room-123",
    });

    expect(wrapper.text()).toContain("Room not found.");
  });
});
