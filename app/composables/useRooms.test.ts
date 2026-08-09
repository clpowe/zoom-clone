import { afterEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { loadRooms } from "./useRooms";
import * as roomOperations from "./useRooms";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadRooms", () => {
  it("loads rooms from the API response", async () => {
    const rooms = await loadRooms({
      fetchRooms: async () => ({
        data: [
          {
            id: "room-2",
            title: "Second Room",
            cloudflareMeetingId: "cf-meeting-2",
            createdAt: "2026-07-09T12:00:00.000Z",
          },
          {
            id: "room-1",
            title: "First Room",
            cloudflareMeetingId: "cf-meeting-1",
            createdAt: "2026-07-09T11:00:00.000Z",
          },
        ],
      }),
    });

    expect(rooms).toEqual([
      {
        id: "room-2",
        title: "Second Room",
        cloudflareMeetingId: "cf-meeting-2",
        createdAt: "2026-07-09T12:00:00.000Z",
      },
      {
        id: "room-1",
        title: "First Room",
        cloudflareMeetingId: "cf-meeting-1",
        createdAt: "2026-07-09T11:00:00.000Z",
      },
    ]);
  });

  describe("deleteRoomAndRefresh", () => {
    it("refreshes the rooms after deletion succeeds", async () => {
      const calls: string[] = [];

      const deleteRoomAndRefresh = (
        roomOperations as typeof roomOperations & {
          deleteRoomAndRefresh?: (input: {
            roomId: string;
            deleteRoom: (roomId: string) => Promise<void>;
            refreshRooms: () => Promise<void>;
          }) => Promise<void>;
        }
      ).deleteRoomAndRefresh;

      expect(deleteRoomAndRefresh).toBeTypeOf("function");

      await deleteRoomAndRefresh!({
        roomId: "room-123",
        deleteRoom: async (roomId) => {
          calls.push(`delete:${roomId}`);
        },
        refreshRooms: async () => {
          calls.push("refresh");
        },
      });

      expect(calls).toEqual(["delete:room-123", "refresh"]);
    });
  });

  describe("requestRoomDeletion", () => {
    it("requests deletion from the room API", async () => {
      let requestedEndpoint: string | undefined;
      let requestedOptions: { method: string } | undefined;

      const requestRoomDeletion = (
        roomOperations as typeof roomOperations & {
          requestRoomDeletion?: (input: {
            roomId: string;
            fetchRoom: (endpoint: string, options: { method: "DELETE" }) => Promise<unknown>;
          }) => Promise<void>;
        }
      ).requestRoomDeletion;

      expect(requestRoomDeletion).toBeTypeOf("function");

      await requestRoomDeletion!({
        roomId: "room/123",
        fetchRoom: async (endpoint, options) => {
          requestedEndpoint = endpoint;
          requestedOptions = options;
        },
      });

      expect(requestedEndpoint).toBe("/api/rooms/room%2F123");
      expect(requestedOptions).toEqual({
        method: "DELETE",
      });
    });
  });

  it("returns a useful error when deletion fails", async () => {
    await expect(
      roomOperations.deleteRoomAndRefresh({
        roomId: "room-123",
        deleteRoom: async () => {
          throw new Error("Cloudflare deletion failed");
        },
        refreshRooms: async () => {},
      }),
    ).resolves.toEqual({
      errorMessage: "Could not delete room.",
    });
  });
});

describe("useRooms deletion", () => {
  it("deletes through the API and refreshes the rooms", async () => {
    const requests: Array<{
      endpoint: string;
      method: string | undefined;
    }> = [];

    vi.stubGlobal("ref", ref);
    vi.stubGlobal("computed", computed);
    vi.stubGlobal("onMounted", () => {});
    vi.stubGlobal("$fetch", async (endpoint: string, options?: { method?: string }) => {
      requests.push({
        endpoint,
        method: options?.method,
      });

      if (options?.method === "DELETE") {
        return undefined;
      }

      return { data: [] };
    });

    const roomsState = roomOperations.useRooms() as ReturnType<typeof roomOperations.useRooms> & {
      deleteRoom?: (roomId: string) => Promise<void>;
    };

    expect(roomsState.deleteRoom).toBeTypeOf("function");

    await roomsState.deleteRoom!("room-123");

    expect(requests).toEqual([
      {
        endpoint: "/api/rooms/room-123",
        method: "DELETE",
      },
      {
        endpoint: "/api/rooms",
        method: undefined,
      },
    ]);
  });
});

describe("useRooms initial loading", () => {
  it("loads recent rooms when mounted", async () => {
    let mountedCallback: (() => Promise<void>) | undefined;
    const requestedEndpoints: string[] = [];

    vi.stubGlobal("ref", ref);
    vi.stubGlobal("computed", computed);
    vi.stubGlobal("onMounted", (callback: () => Promise<void>) => {
      mountedCallback = callback;
    });
    vi.stubGlobal("$fetch", async (endpoint: string) => {
      requestedEndpoints.push(endpoint);

      return {
        data: [
          {
            id: "room-123",
            title: "Team Standup",
            cloudflareMeetingId: "cf-meeting-123",
            createdAt: "2026-07-13T12:00:00.000Z",
          },
        ],
      };
    });

    const roomsState = roomOperations.useRooms();

    expect(mountedCallback).toBeTypeOf("function");

    await mountedCallback!();

    expect(requestedEndpoints).toEqual(["/api/rooms"]);
    expect(roomsState.rooms.value).toEqual([
      {
        id: "room-123",
        title: "Team Standup",
        cloudflareMeetingId: "cf-meeting-123",
        createdAt: "2026-07-13T12:00:00.000Z",
      },
    ]);
  });
});
