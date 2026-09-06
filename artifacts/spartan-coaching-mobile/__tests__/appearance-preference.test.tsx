import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Pressable, Text } from "react-native";
import {
  AppearanceProvider,
  useAppearancePreference,
} from "../lib/AppearanceContext";

const STORAGE_KEY = "spartan.appearance.preference.v1";

function AppearanceConsumer() {
  const { preference, setPreference } = useAppearancePreference();

  return (
    <>
      <Text testID="appearance-preference">{preference}</Text>
      <Pressable
        testID="select-mamba"
        onPress={() => void setPreference("mamba")}
      >
        <Text>Mamba</Text>
      </Pressable>
      <Pressable
        testID="select-system"
        onPress={() => void setPreference("system")}
      >
        <Text>System</Text>
      </Pressable>
    </>
  );
}

function renderAppearanceConsumer() {
  return render(
    <AppearanceProvider>
      <AppearanceConsumer />
    </AppearanceProvider>,
  );
}

describe("appearance preference persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("stores Mamba and updates the consumer, then hydrates it after remount", async () => {
    const firstLaunch = renderAppearanceConsumer();

    fireEvent.press(firstLaunch.getByTestId("select-mamba"));

    await waitFor(() => {
      expect(firstLaunch.getByTestId("appearance-preference").props.children).toBe(
        "mamba",
      );
    });
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe("mamba");

    firstLaunch.unmount();
    const relaunched = renderAppearanceConsumer();

    await waitFor(() => {
      expect(relaunched.getByTestId("appearance-preference").props.children).toBe(
        "mamba",
      );
    });
  });

  it("removes the stored preference when System is selected", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "mamba");
    const view = renderAppearanceConsumer();

    await waitFor(() => {
      expect(view.getByTestId("appearance-preference").props.children).toBe(
        "mamba",
      );
    });

    fireEvent.press(view.getByTestId("select-system"));

    await waitFor(() => {
      expect(view.getByTestId("appearance-preference").props.children).toBe(
        "system",
      );
    });
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});