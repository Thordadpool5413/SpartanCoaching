/**
 * iOS/web no-op counterpart to notificationReschedule.android.ts.
 *
 * React Native resolves the Android module only for Android bundles, allowing
 * Android to define its headless task globally without evaluating TaskManager
 * in an iOS release.
 */
export async function registerNotificationRescheduleTask(): Promise<void> {}