import { computed, ref } from "vue";

type CallLifecycleState = "lobby" | "in-call" | "left-call";
type CallLifecycleEvent = "joined" | "left" | "rejoin";

type RealtimeKitStateUpdate = {
  meeting?: string;
  roomLeftState?: string;
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

  return {
    state,
    isLobby,
    isInCall,
    hasLeft,
    markJoined: () => transition("joined"),
    markLeft: () => transition("left"),
    prepareRejoin: () => transition("rejoin"),
  };
}

export function useCallLifecycle() {
  return createCallLifecycle();
}
