import { describe, expect, it } from "vitest";
import { createCallLifecycle } from "./useCallLifecycle";
import { isRealtimeKitEndedState } from "./useCallLifecycle";

describe("createCallLifecycle", () => {
  it("starts in the lobby", () => {
    const lifecycle = createCallLifecycle();

    expect(lifecycle.state.value).toBe("lobby");
    expect(lifecycle.isLobby.value).toBe(true);
    expect(lifecycle.isInCall.value).toBe(false);
    expect(lifecycle.hasLeft.value).toBe(false);
  });

  it("moves into the call after joining", () => {
    const lifecycle = createCallLifecycle();

    expect(lifecycle.markJoined()).toBe(true);

    expect(lifecycle.state.value).toBe("in-call");
    expect(lifecycle.isInCall.value).toBe(true);
  });

  it("shows the post-call screen after leaving an active call", () => {
    const lifecycle = createCallLifecycle();

    lifecycle.markJoined();

    expect(lifecycle.markLeft()).toBe(true);

    expect(lifecycle.state.value).toBe("left-call");
    expect(lifecycle.hasLeft.value).toBe(true);
  });

  it("returns to the lobby when rejoining from the post-call screen", () => {
    const lifecycle = createCallLifecycle();

    lifecycle.markJoined();
    lifecycle.markLeft();

    expect(lifecycle.prepareRejoin()).toBe(true);

    expect(lifecycle.state.value).toBe("lobby");
    expect(lifecycle.isLobby.value).toBe(true);
  });

  it("does not leave when already in the lobby", () => {
    const lifecycle = createCallLifecycle();

    expect(lifecycle.markLeft()).toBe(false);
    expect(lifecycle.state.value).toBe("lobby");
  });

  it("does not rejoin unless the call has been left", () => {
    const lifecycle = createCallLifecycle();

    expect(lifecycle.prepareRejoin()).toBe(false);
    expect(lifecycle.state.value).toBe("lobby");

    lifecycle.markJoined();

    expect(lifecycle.prepareRejoin()).toBe(false);
    expect(lifecycle.state.value).toBe("in-call");
  });

  it("detects when RealtimeKit reports the room was left", () => {
    expect(isRealtimeKitEndedState({ meeting: "ended" })).toBe(true);
    expect(isRealtimeKitEndedState({ roomLeftState: "left" })).toBe(true);
    expect(isRealtimeKitEndedState({ meeting: "joined" })).toBe(false);
  });
});
