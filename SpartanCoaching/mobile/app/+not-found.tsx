import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Card, PrimaryButton, ScreenScrollView } from "@/components/ui";
import { colors } from "@/lib/theme";

export default function NotFound() {
  const router = useRouter();

  return (
    <ScreenScrollView>
      <View style={{ paddingTop: 24 }}>
        <Card>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900" }}>Page not found</Text>
          <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 20 }}>
            The route you opened does not exist in the mobile app yet.
          </Text>
          <View style={{ marginTop: 16 }}>
            <PrimaryButton title="Go home" onPress={() => router.replace("/")} />
          </View>
        </Card>
      </View>
    </ScreenScrollView>
  );
}
