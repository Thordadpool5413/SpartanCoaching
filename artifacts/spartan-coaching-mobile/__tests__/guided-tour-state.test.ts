import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  beginGuidedTour,
  completeGuidedTour,
  dismissGuidedTour,
  getGuidedTourState,
  saveGuidedTourStep,
  shouldAutoPresentGuidedTour,
} from "../lib/guidedTour";

describe("guided tour continuity", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("automatically presents only before a tour decision exists", async () => {
    expect(await shouldAutoPresentGuidedTour()).toBe(true);
    await beginGuidedTour();
    expect(await shouldAutoPresentGuidedTour()).toBe(false);
  });

  it("remembers progress and completion", async () => {
    await beginGuidedTour();
    await saveGuidedTourStep(3);
    expect(await getGuidedTourState()).toMatchObject({ status: "started", step: 3 });
    await completeGuidedTour();
    expect(await getGuidedTourState()).toMatchObject({ status: "completed", step: 5 });
  });

  it("remembers a dismissal while keeping manual replay available", async () => {
    await dismissGuidedTour(2);
    expect(await getGuidedTourState()).toMatchObject({ status: "dismissed", step: 2 });
    expect(await shouldAutoPresentGuidedTour()).toBe(false);
  });
});
