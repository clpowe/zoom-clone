import { computed, ref } from "vue";

export type RoomJoinState =
  | "idle"
  | "creating-participant"
  | "loading-client"
  | "joining"
  | "joined"
  | "failed";

type RoomJoinEvent =
  | "submit"
  | "participant-created"
  | "client-loaded"
  | "joined"
  | "failed"
  | "reset";

const transitions: Record<RoomJoinState, Partial<Record<RoomJoinEvent, RoomJoinState>>> = {
  idle: {
    submit: "creating-participant",
  },
  "creating-participant": {
    "participant-created": "loading-client",
    failed: "failed",
    reset: "idle",
  },
  "loading-client": {
    "client-loaded": "joining",
    failed: "failed",
    reset: "idle",
  },
  joining: {
    joined: "joined",
    failed: "failed",
    reset: "idle",
  },
  joined: {
    reset: "idle",
  },
  failed: {
    submit: "creating-participant",
    reset: "idle",
  },
};

const buttonLabels: Record<RoomJoinState, string> = {
  idle: "Join Meeting",
  "creating-participant": "Creating participant...",
  "loading-client": "Loading video...",
  joining: "Joining meeting...",
  joined: "Joined",
  failed: "Try again",
};

export function createRoomJoin() {
  const state = ref<RoomJoinState>("idle");
  const name = ref("");
  const errorMessage = ref("");

  const trimmedName = computed(() => name.value.trim());
  const canSubmit = computed(
    () => trimmedName.value.length > 0 && (state.value === "idle" || state.value === "failed"),
  );
  const isJoining = computed(
    () =>
      state.value === "creating-participant" ||
      state.value === "loading-client" ||
      state.value === "joining",
  );
  const shouldRenderMeeting = computed(() => state.value === "joining" || state.value === "joined");
  const buttonLabel = computed(() => buttonLabels[state.value]);

  function transition(event: RoomJoinEvent) {
    const nextState = transitions[state.value][event];

    if (!nextState) {
      return false;
    }

    state.value = nextState;
    return true;
  }

  function beginJoin() {
    if (!canSubmit.value) {
      return false;
    }

    errorMessage.value = "";
    return transition("submit");
  }

  function fail(error?: unknown) {
    const didTransition = transition("failed");

    if (!didTransition) {
      return false;
    }

    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? error.statusCode
        : undefined;

    if (statusCode === 404) {
      errorMessage.value = "This room is no longer available.";
    } else if (error instanceof TypeError) {
      errorMessage.value = "Could not connect. Check your internet connection and try again.";
    } else {
      errorMessage.value = "Could not join meeting. Please try again.";
    }
    return true;
  }

  function reset() {
    const didTransition = transition("reset");

    if (didTransition) {
      errorMessage.value = "";
    }

    return didTransition;
  }

  return {
    state,
    name,
    trimmedName,
    canSubmit,
    isJoining,
    shouldRenderMeeting,
    buttonLabel,
    errorMessage,
    beginJoin,
    markParticipantCreated: () => transition("participant-created"),
    markClientLoaded: () => transition("client-loaded"),
    markJoined: () => transition("joined"),
    fail,
    reset,
  };
}

export function useRoomJoin() {
  return createRoomJoin();
}
