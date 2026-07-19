import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getVideoUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}/spartan-video/` : "/spartan-video/";
}

export default function BrandVideoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const videoUrl = getVideoUrl();

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(videoUrl);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share(
      Platform.OS === "ios"
        ? { url: videoUrl, message: "Watch the Spartan Coaching brand video" }
        : { message: `Watch the Spartan Coaching brand video: ${videoUrl}` }
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Brand Video" }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Feather name="share-2" size={13} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              Outreach Asset
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Spartan Brand Video
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Send this cinematic logo reveal to prospects as a credibility asset. Copy the link and share it — no login required to view.
          </Text>
        </View>

        {/* Video preview */}
        <View style={[styles.videoWrap, { borderColor: colors.border }]}>
          {Platform.OS === "web" ? (
            <iframe
              src={videoUrl}
              title="Spartan Coaching Brand Video"
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="autoplay; fullscreen"
            />
          ) : (
            <WebView
              source={{ uri: videoUrl }}
              style={{ flex: 1, backgroundColor: "#000" }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleCopyLink}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: copied ? colors.accent : colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={17}
              color={copied ? colors.primary : colors.primaryForeground}
            />
            <Text
              style={[
                styles.primaryBtnText,
                { color: copied ? colors.primary : colors.primaryForeground, fontFamily: "Inter_700Bold" },
              ]}
            >
              {copied ? "Link Copied!" : "Copy Share Link"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather name="share" size={17} color={colors.foreground} />
            <Text style={[styles.secondaryBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Share…
            </Text>
          </Pressable>
        </View>

        {/* Link display */}
        <View style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="link" size={14} color={colors.mutedForeground} />
          <Text
            style={[styles.linkText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
            numberOfLines={1}
          >
            {videoUrl}
          </Text>
        </View>

        {/* How to use */}
        <View style={[styles.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.howTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            How to use this in outreach
          </Text>
          {[
            "Tap Copy Share Link to copy the video URL.",
            "Paste it into a text, email, or LinkedIn message — no account needed to watch.",
            "Prospects see a clean, full-screen brand video — just the Spartan identity.",
          ].map((step, i) => (
            <View key={i} style={styles.howRow}>
              <View style={[styles.howNum, { backgroundColor: colors.accent }]}>
                <Text style={[styles.howNumText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.howText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  headerBlock: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  badgeText: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 26, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 21 },
  videoWrap: {
    marginHorizontal: 20,
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 16 },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: { fontSize: 15 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  secondaryBtnText: { fontSize: 15 },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkText: { fontSize: 13, flex: 1 },
  howCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  howTitle: { fontSize: 16, marginBottom: 14 },
  howRow: { flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "flex-start" },
  howNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  howNumText: { fontSize: 12 },
  howText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
