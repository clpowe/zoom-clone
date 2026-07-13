import { describe, expect, it } from "vitest";
import { createRoomJoin } from "./useRoomJoin";

describe("createRoomJoin", () => {
  it("starts idle and requires a name", () => {
    const join = createRoomJoin();

    expect(join.state.value).toBe("idle");
    expect(join.canSubmit.value).toBe(false);

    join.name.value = "  Chris  ";

    expect(join.trimmedName.value).toBe("Chris");
    expect(join.canSubmit.value).toBe(true);
  });

  it("moves through a successful join", () => {
    const join = createRoomJoin();
    join.name.value = "Chris";

    expect(join.beginJoin()).toBe(true);
    expect(join.state.value).toBe("creating-participant");
    expect(join.buttonLabel.value).toBe("Creating participant...");

    expect(join.markParticipantCreated()).toBe(true);
    expect(join.state.value).toBe("loading-client");
    expect(join.buttonLabel.value).toBe("Loading video...");

    expect(join.markClientLoaded()).toBe(true);
    expect(join.state.value).toBe("joining");
    expect(join.shouldRenderMeeting.value).toBe(true);

    expect(join.markJoined()).toBe(true);
    expect(join.state.value).toBe("joined");
    expect(join.isJoining.value).toBe(false);
  });

  it("moves an in-progress join to failed and clears the error on retry", () => {
    const join = createRoomJoin();
    join.name.value = "Chris";
    join.beginJoin();

    expect(join.fail()).toBe(true);
    expect(join.state.value).toBe("failed");
    expect(join.errorMessage.value).toBe("Could not join meeting. Please try again.");
    expect(join.canSubmit.value).toBe(true);

    expect(join.beginJoin()).toBe(true);
    expect(join.state.value).toBe("creating-participant");
    expect(join.errorMessage.value).toBe("");
  });

  it("refuses transitions out of order", () => {
    const join = createRoomJoin();

    expect(join.markParticipantCreated()).toBe(false);
    expect(join.markClientLoaded()).toBe(false);
    expect(join.markJoined()).toBe(false);
    expect(join.state.value).toBe("idle");
  });

  it("resets after a completed join so the room can be rejoined", () => {
    const join = createRoomJoin();
    join.name.value = "Chris";

    join.beginJoin();
    join.markParticipantCreated();
    join.markClientLoaded();
    join.markJoined();

    expect(join.reset()).toBe(true);
    expect(join.state.value).toBe("idle");
    expect(join.canSubmit.value).toBe(true);
  });
});
