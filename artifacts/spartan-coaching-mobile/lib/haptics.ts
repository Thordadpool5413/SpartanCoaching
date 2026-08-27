import * as Haptics from "expo-haptics";

export const haptics = {
  tap: (reduceMotion?: boolean) => {
    if (reduceMotion) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  action: (reduceMotion?: boolean) => {
    if (reduceMotion) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  success: (reduceMotion?: boolean) => {
    if (reduceMotion) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  error: (reduceMotion?: boolean) => {
    if (reduceMotion) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  selection: (reduceMotion?: boolean) => {
    if (reduceMotion) return;
    void Haptics.selectionAsync();
  },
};
