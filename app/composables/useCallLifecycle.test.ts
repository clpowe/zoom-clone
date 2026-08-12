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

  it("shows reconnecting when an active call loses its connection", () => {
    const lifecycle = createCallLifecycle();
    lifecycle.markJoined();

    const connectionAwareLifecycle = lifecycle as typeof lifecycle & {
      markReconnecting?: () => boolean;
      connectionMessage?: { value: string };
    };

    expect(connectionAwareLifecycle.markReconnecting).toBeTypeOf("function");

    connectionAwareLifecycle.markReconnecting?.();

    expect(connectionAwareLifecycle.connectionMessage?.value).toBe("Reconnecting...");
  });

  it("ignores reconnecting updates before the call has joined", () => {
    const lifecycle = createCallLifecycle();

    expect(lifecycle.markReconnecting()).toBe(false);
    expect(lifecycle.connectionMessage.value).toBe("");
  });

  it("reports when the connection has been restored", () => {
    const lifecycle = createCallLifecycle();
    lifecycle.markJoined();
    lifecycle.markReconnecting();

    const connectionAwareLifecycle = lifecycle as typeof lifecycle & {
      markConnected?: () => boolean;
    };

    expect(connectionAwareLifecycle.markConnected).toBeTypeOf("function");

    connectionAwareLifecycle.markConnected?.();

    expect(lifecycle.connectionMessage.value).toBe("Connected");
  });

  it("shows an actionable error when the connection is lost", () => {
    const lifecycle = createCallLifecycle();
    lifecycle.markJoined();

    const connectionAwareLifecycle = lifecycle as typeof lifecycle & {
      markDisconnected?: () => boolean;
    };

    expect(connectionAwareLifecycle.markDisconnected).toBeTypeOf("function");

    connectionAwareLifecycle.markDisconnected?.();

    expect(lifecycle.connectionMessage.value).toBe(
      "Connection lost. Check your internet connection and try again.",
    );
  });

  it("maps a RealtimeKit reconnecting update to the connection message", () => {
    const lifecycle = createCallLifecycle();
    lifecycle.markJoined();

    const connectionAwareLifecycle = lifecycle as typeof lifecycle & {
      updateConnection?: (
        state: "connected" | "reconnecting" | "disconnected" | "failed",
      ) => boolean;
    };

    expect(connectionAwareLifecycle.updateConnection).toBeTypeOf("function");

    connectionAwareLifecycle.updateConnection?.("reconnecting");

    expect(lifecycle.connectionMessage.value).toBe("Reconnecting...");
  });

  it("maps a RealtimeKit connected update to the connection message", () => {
    const lifecycle = createCallLifecycle();
    lifecycle.markJoined();
    lifecycle.updateConnection("reconnecting");

    expect(lifecycle.updateConnection("connected")).toBe(true);
    expect(lifecycle.connectionMessage.value).toBe("Connected");
  });

  it("maps a RealtimeKit disconnected update to an actionable error", () => {
    const lifecycle = createCallLifecycle();
    lifecycle.markJoined();

    expect(lifecycle.updateConnection("disconnected")).toBe(true);
    expect(lifecycle.connectionMessage.value).toBe(
      "Connection lost. Check your internet connection and try again.",
    );
  });
  it("maps a RealtimeKit failed update to an actionable error", () => {
    const lifecycle = createCallLifecycle();
    lifecycle.markJoined();

    expect(lifecycle.updateConnection("failed")).toBe(true);
    expect(lifecycle.connectionMessage.value).toBe(
      "Connection lost. Check your internet connection and try again.",
    );
  });

  it("listens for RealtimeKit socket connection updates", () => {
    type SocketUpdate = {
      state: "connected" | "reconnecting" | "disconnected" | "failed";
      reconnected: boolean;
      reconnectionAttempt: number;
    };

    let socketListener: ((update: SocketUpdate) => void) | undefined;

    const connectionSource = {
      on(_event: "socketConnectionUpdate", listener: (update: SocketUpdate) => void) {
        socketListener = listener;
      },
      off(_event: "socketConnectionUpdate", _listener: (update: SocketUpdate) => void) {},
    };

    const lifecycle = createCallLifecycle();
    lifecycle.markJoined();

    const connectionAwareLifecycle = lifecycle as typeof lifecycle & {
      attachConnectionEvents?: (source: typeof connectionSource) => () => void;
    };

    expect(connectionAwareLifecycle.attachConnectionEvents).toBeTypeOf("function");

    connectionAwareLifecycle.attachConnectionEvents?.(connectionSource);

    socketListener?.({
      state: "reconnecting",
      reconnected: false,
      reconnectionAttempt: 1,
    });

    expect(lifecycle.connectionMessage.value).toBe("Reconnecting...");
  });

  it("stops listening after connection events are detached", () => {
    type SocketUpdate = {
      state: "connected" | "reconnecting" | "disconnected" | "failed";
      reconnected: boolean;
      reconnectionAttempt: number;
    };

    const listeners = new Set<(update: SocketUpdate) => void>();

    const connectionSource = {
      on(_event: "socketConnectionUpdate", listener: (update: SocketUpdate) => void) {
        listeners.add(listener);
      },
      off(_event: "socketConnectionUpdate", listener: (update: SocketUpdate) => void) {
        listeners.delete(listener);
      },
      emit(update: SocketUpdate) {
        for (const listener of listeners) {
          listener(update);
        }
      },
    };

    const lifecycle = createCallLifecycle();
    lifecycle.markJoined();

    const detach = lifecycle.attachConnectionEvents(connectionSource) as unknown;

    expect(detach).toBeTypeOf("function");

    if (typeof detach !== "function") {
      return;
    }

    detach();

    connectionSource.emit({
      state: "reconnecting",
      reconnected: false,
      reconnectionAttempt: 1,
    });

    expect(lifecycle.connectionMessage.value).toBe("");
  });
});
