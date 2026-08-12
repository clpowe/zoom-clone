import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoomPage from "./[id].vue";

type SocketUpdate = {
  state: "connected" | "reconnecting" | "disconnected" | "failed";
  reconnected: boolean;
  reconnectionAttempt: number;
};

const realtimeKit = vi.hoisted(() => {
  const listeners = new Set<(update: SocketUpdate) => void>();

  return {
    meeting: {
      meta: {
        on(event: string, listener: (update: SocketUpdate) => void) {
          if (event === "socketConnectionUpdate") {
            listeners.add(listener);
          }
        },
        off(event: string, listener: (update: SocketUpdate) => void) {
          if (event === "socketConnectionUpdate") {
            listeners.delete(listener);
          }
        },
      },
      join: vi.fn(async () => {}),
    },

    emitConnection(update: SocketUpdate) {
      for (const listener of listeners) {
        listener(update);
      }
    },

    reset() {
      listeners.clear();
    },
  };
});

vi.mock("@cloudflare/realtimekit", () => ({
  default: {
    init: vi.fn(async () => realtimeKit.meeting),
  },
}));

vi.mock("@cloudflare/realtimekit-ui/loader", () => ({
  defineCustomElements: vi.fn(),
}));

beforeEach(() => {
  realtimeKit.reset();
});

registerEndpoint("/api/rooms/room-123", () => {
  return new Response(null, {
    status: 404,
    statusText: "Room not found",
  });
});

registerEndpoint("/api/rooms/connected-room", () => ({
  data: {
    id: "connected-room",
    title: "Team Standup",
    cloudflareMeetingId: "cf-meeting-123",
    createdAt: "2026-08-10T10:00:00.000Z",
  },
}));

registerEndpoint("/api/meetings/connected-room/participants", {
  method: "POST",
  handler: () => ({
    data: {
      token: "participant-token",
    },
  }),
});

registerEndpoint("/api/rooms/unavailable-room", () => ({
  data: {
    id: "unavailable-room",
    title: "Expired Standup",
    cloudflareMeetingId: "cf-meeting-missing",
    createdAt: "2026-08-10T10:00:00.000Z",
  },
}));

registerEndpoint("/api/meetings/unavailable-room/participants", {
  method: "POST",
  handler: () =>
    new Response(null, {
      status: 404,
      statusText: "Room not found",
    }),
});

describe("room page loading", () => {
  it("displays the room-loading error", async () => {
    const wrapper = await mountSuspended(RoomPage, {
      route: "/room/room-123",
    });

    expect(wrapper.text()).toContain("Room not found.");
  });

  it("shows RealtimeKit connection updates during a call", async () => {
    const wrapper = await mountSuspended(RoomPage, {
      route: "/room/connected-room",
    });

    await wrapper.get('input[placeholder="Your name"]').setValue("Chris");

    const joinButton = wrapper.findAll("button").find((button) => button.text() === "Join Meeting");

    expect(joinButton).toBeDefined();

    await joinButton!.trigger("click");
    await flushPromises();

    realtimeKit.emitConnection({
      state: "reconnecting",
      reconnected: false,
      reconnectionAttempt: 1,
    });

    await flushPromises();

    expect(wrapper.text()).toContain("Reconnecting...");
  });

  it("explains when a room becomes unavailable while joining", async () => {
    const wrapper = await mountSuspended(RoomPage, {
      route: "/room/unavailable-room",
    });

    await wrapper.get('input[placeholder="Your name"]').setValue("Chris");

    const joinButton = wrapper.findAll("button").find((button) => button.text() === "Join Meeting");

    expect(joinButton).toBeDefined();

    await joinButton!.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("This room is no longer available.");
  });
});
