import {
  buildEmailDraftPayload,
  buildNextCallPayload,
  canDraftEmailFromAction,
  canScheduleNextFromAction,
} from "../lib/commandCenterNextActions";

describe("command center next actions (pass 5)", () => {
  it("gates schedule-next to accepted next_call actions", () => {
    expect(
      canScheduleNextFromAction({
        id: "a1",
        type: "next_call",
        status: "accepted",
      }),
    ).toBe(true);
    expect(
      canScheduleNextFromAction({
        id: "a2",
        type: "next_call",
        status: "draft",
      }),
    ).toBe(false);
    expect(
      canScheduleNextFromAction({
        id: "a3",
        type: "email",
        status: "accepted",
      }),
    ).toBe(false);
  });

  it("gates email draft to accepted email actions", () => {
    expect(
      canDraftEmailFromAction({ id: "e1", type: "email", status: "accepted" }),
    ).toBe(true);
    expect(
      canDraftEmailFromAction({ id: "e2", type: "email", status: "draft" }),
    ).toBe(false);
  });

  it("builds next-call payload with cycle version + nextActionId", () => {
    const body = buildNextCallPayload({
      action: {
        id: "act-9",
        cycleId: "cycle-1",
        cycleVersion: 4,
        type: "next_call",
        status: "accepted",
      },
      purpose: "Follow up with DON",
      startsAtIso: "2026-08-20T15:00:00.000Z",
      durationMinutes: 45,
      timezone: "America/Chicago",
    });
    expect(body.expectedVersion).toBe(4);
    expect(body.nextActionId).toBe("act-9");
    expect(body.purpose).toBe("Follow up with DON");
    expect(body.schedule.durationMinutes).toBe(45);
    expect(body.schedule.timezone).toBe("America/Chicago");
    expect(body.schedule.startsAt).toBe("2026-08-20T15:00:00.000Z");
  });

  it("builds email draft payload with action version", () => {
    expect(buildEmailDraftPayload({ id: "x", version: 7 })).toEqual({
      expectedVersion: 7,
    });
    expect(buildEmailDraftPayload({ id: "y" }).expectedVersion).toBe(1);
  });
});
