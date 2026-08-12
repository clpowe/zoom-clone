import { computed, ref } from "vue";

type CallLifecycleState = "lobby" | "in-call" | "left-call";
type CallLifecycleEvent = "joined" | "left" | "rejoin";

type RealtimeKitStateUpdate = {
  meeting?: string;
  roomLeftState?: string;
};

type SocketConnectionUpdate = {
  state: "connected" | "reconnecting" | "disconnected" | "failed";
  reconnected: boolean;
  reconnectionAttempt: number;
};

type ConnectionEventSource = {
  on: (event: "socketConnectionUpdate", listener: (update: SocketConnectionUpdate) => void) => void;
  off: (
    event: "socketConnectionUpdate",
    listener: (update: SocketConnectionUpdate) => void,
  ) => void;
};

const transitions: Record<
  CallLifecycleState,
  Partial<Record<CallLifecycleEvent, CallLifecycleState>>
> = {
  lobby: {
    joined: "in-call",
  },
  "in-call": {
    left: "left-call",
  },
  "left-call": {
    rejoin: "lobby",
  },
};

export function isRealtimeKitEndedState(state: RealtimeKitStateUpdate) {
  return state.meeting === "ended" || Boolean(state.roomLeftState);
}

export function createCallLifecycle() {
  const state = ref<CallLifecycleState>("lobby");
  const connectionMessage = ref("");

  const isLobby = computed(() => state.value === "lobby");
  const isInCall = computed(() => state.value === "in-call");
  const hasLeft = computed(() => state.value === "left-call");

  function transition(event: CallLifecycleEvent) {
    const nextState = transitions[state.value][event];

    if (!nextState) {
      return false;
    }

    state.value = nextState;
    return true;
  }

  function markReconnecting() {
    if (!isInCall.value) {
      return false;
    }

    connectionMessage.value = "Reconnecting...";
    return true;
  }

  function markConnected() {
    connectionMessage.value = "Connected";
    return true;
  }

  function markDisconnected() {
    connectionMessage.value = "Connection lost. Check your internet connection and try again.";

    return true;
  }

  function updateConnection(
    connectionState: "connected" | "reconnecting" | "disconnected" | "failed",
  ) {
    if (connectionState === "reconnecting") {
      return markReconnecting();
    }

    if (connectionState === "connected") {
      return markConnected();
    }

    if (connectionState === "disconnected" || connectionState === "failed") {
      return markDisconnected();
    }
    return false;
  }

  function attachConnectionEvents(source: ConnectionEventSource) {
    const handleConnectionUpdate = (update: SocketConnectionUpdate) => {
      updateConnection(update.state);
    };

    source.on("socketConnectionUpdate", handleConnectionUpdate);

    return () => {
      source.off("socketConnectionUpdate", handleConnectionUpdate);
    };
  }

  return {
    state,
    connectionMessage,
    isLobby,
    isInCall,
    hasLeft,
    markJoined: () => transition("joined"),
    markLeft: () => transition("left"),
    prepareRejoin: () => transition("rejoin"),
    markReconnecting,
    markConnected,
    markDisconnected,
    updateConnection,
    attachConnectionEvents,
  };
}

export function useCallLifecycle() {
  return createCallLifecycle();
}
