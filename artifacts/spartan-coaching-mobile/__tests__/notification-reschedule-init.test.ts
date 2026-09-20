const mockDefineTask = jest.fn();

jest.mock("expo-task-manager", () => ({
  defineTask: mockDefineTask,
  isTaskRegisteredAsync: jest.fn(async () => false),
}));

jest.mock("expo-background-fetch", () => ({
  BackgroundFetchResult: {
    NoData: "no-data",
    NewData: "new-data",
    Failed: "failed",
  },
  BackgroundFetchStatus: {
    Restricted: "restricted",
    Denied: "denied",
    Available: "available",
  },
  getStatusAsync: jest.fn(async () => "available"),
  registerTaskAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-notifications", () => ({
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  scheduleNotificationAsync: jest.fn(async () => "scheduled-id"),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

describe("Android notification reschedule initialization", () => {
  beforeEach(() => {
    jest.resetModules();
    mockDefineTask.mockClear();
  });

  it("defines the headless task during module initialization", () => {
    jest.isolateModules(() => {
      require("../lib/notificationReschedule.android");
    });

    expect(mockDefineTask).toHaveBeenCalledWith(
      "SPARTAN_RESCHEDULE_NOTIFICATIONS",
      expect.any(Function),
    );
  });
});