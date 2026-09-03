const mockStorage = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    mockStorage.set(key, value);
  }),
  removeItem: jest.fn(async (key: string) => {
    mockStorage.delete(key);
  }),
}));

jest.mock("../lib/memberSync", () => {
  const actual = jest.requireActual("../lib/memberSync");
  return {
    ...actual,
    queueMemberSync: jest.fn(async () => undefined),
  };
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { cacheCommitment, loadCachedCommitment } from "../lib/commitmentCache";
import { queueMemberSync } from "../lib/memberSync";

describe("commitment cache privacy", () => {
  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
  });

  it("rejects sensitive commitment text before device storage or sync", async () => {
    await cacheCommitment(42, "Call patient Maria about COPD on 09/03/2026");

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(queueMemberSync).not.toHaveBeenCalled();
    expect(await loadCachedCommitment(42)).toBeNull();
  });

  it("stores and queues a safe professional commitment", async () => {
    await cacheCommitment(42, "Rehearse the opening before tomorrow's team meeting");

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(queueMemberSync).toHaveBeenCalledTimes(1);
    expect(await loadCachedCommitment(42)).toBe("Rehearse the opening before tomorrow's team meeting");
  });
});