import AsyncStorage from "@react-native-async-storage/async-storage";
import { consumeCoachHandoff, saveCoachHandoff } from "../lib/coachHandoff";

describe("Medicare Intelligence Coach handoff", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("moves the decision context into Coach exactly once", async () => {
    const handoff = {
      situation: "CMS evidence and account brief",
      intention: "Pressure-test the next action.",
    };

    await saveCoachHandoff(handoff);

    await expect(consumeCoachHandoff()).resolves.toEqual(handoff);
    await expect(consumeCoachHandoff()).resolves.toBeNull();
  });

  it("rejects malformed saved context", async () => {
    await AsyncStorage.setItem("coach-handoff", JSON.stringify({ situation: 42 }));

    await expect(consumeCoachHandoff()).resolves.toBeNull();
  });
});
