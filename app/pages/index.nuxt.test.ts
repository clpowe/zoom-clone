import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import IndexPage from "./index.vue";

const deleteRoomRequest = vi.fn();
let deleteRoomShouldFail = false;

beforeEach(() => {
  deleteRoomRequest.mockClear();
  deleteRoomShouldFail = false;
});

registerEndpoint("/api/rooms", () => ({
  data: [
    {
      id: "room-123",
      title: "Team Standup",
      cloudflareMeetingId: "cf-meeting-123",
      createdAt: "2026-07-13T12:00:00.000Z",
    },
  ],
}));

registerEndpoint("/api/rooms/room-123", {
  method: "DELETE",
  handler: () => {
    deleteRoomRequest();

    if (deleteRoomShouldFail) {
      return new Response(null, {
        status: 500,
        statusText: "Deletion failed",
      });
    }

    return {
      data: null,
    };
  },
});

describe("home page recent rooms", () => {
  it("deletes a recent room through its Delete command", async () => {
    const wrapper = await mountSuspended(IndexPage);
    await flushPromises();
    const roomItem = wrapper.get(".room-item");
    const deleteButton = roomItem.findAll("button").find((button) => button.text() == "Delete");

    expect(deleteButton).toBeDefined();

    await deleteButton!.trigger("click");
    await flushPromises();

    expect(deleteRoomRequest).toHaveBeenCalledOnce();
  });

  it("keeps the room visible when deletion fails", async () => {
    deleteRoomShouldFail = true;
    const wrapper = await mountSuspended(IndexPage);
    await flushPromises();

    const deleteButton = wrapper
      .get(".room-item")
      .findAll("button")
      .find((button) => button.text() === "Delete");

    await deleteButton!.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Could not delete room.");
    expect(wrapper.find(".room-item").exists()).toBe(true);
    expect(wrapper.text()).toContain("Team Standup");
  });
});
