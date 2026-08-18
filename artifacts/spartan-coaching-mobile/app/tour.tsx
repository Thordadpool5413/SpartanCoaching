import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";

type TourStep = {
  kicker: string;
  title: string;
  body: string;
  icon: React.ComponentProps<typeof Feather>["name"];
};

const STEPS: TourStep[] = [
  {
    kicker: "1 · THE SITUATION",
    title: "Start with a real field moment.",
    body: "This entire walkthrough uses fictional information. You are preparing for a follow up conversation with Dr. Rivera, an oncology referral source who has been polite but has not referred a patient.",
    icon: "map-pin",
  },
  {
    kicker: "2 · PREPARE",
    title: "Turn context into a game plan.",
    body: "Spartan Coaching narrows the objective, likely resistance, talking points, and next move before you walk into the conversation.",
    icon: "message-square",
  },
  {
    kicker: "3 · PRACTICE",
    title: "Now the room pushes back.",
    body: "Dr. Rivera says: “We already have a preferred hospice. I do not want to confuse families.” Choose the response you would test first.",
    icon: "shield",
  },
  {
    kicker: "4 · COACH FEEDBACK",
    title: "Feedback should change the next attempt.",
    body: "Elite Coach does more than praise or score you. It identifies what worked, what created risk, and what to try differently before you rehearse again.",
    icon: "mic",
  },
  {
    kicker: "5 · FOLLOW THROUGH",
    title: "The work ends with one commitment.",
    body: "Your commitment returns to Home so the preparation does not disappear after the conversation. Private Coach content stays private unless you explicitly choose to share a summary or commitment.",
    icon: "check-circle",
  },
  {
    kicker: "6 · KNOW YOUR ACCESS",
    title: "Nothing should be hidden behind mystery labels.",
    body: "Standard contains the complete field system. Elite adds private Coach, voice rehearsal, optional memory, advanced AI, and deidentified clinical education tools. Consulting and company seats remain separate.",
    icon: "grid",
  },
];

const PRACTICE_CHOICES = [
  {
    id: "defend",
    label: "Defend hospice choice",
    text: "Families deserve options, so you should give us a chance too.",
    feedback: "This turns the conversation into a vendor contest and can make the physician defend the current relationship. The objective is education and confidence, not winning an argument.",
    tone: "risk" as const,
  },
  {
    id: "curious",
    label: "Ask before educating",
    text: "That makes sense. What has worked well about that relationship, and where do families still seem uncertain about hospice?",
    feedback: "Strong opening. It respects the existing relationship, creates useful context, and earns the right to educate around a specific gap instead of launching into a pitch.",
    tone: "strong" as const,
  },
  {
    id: "brochure",
    label: "Offer information",
    text: "Could I leave some information about our services for you to review?",
    feedback: "Safe, but passive. It avoids friction without learning anything. A better response keeps the physician engaged and turns the concern into a useful question.",
    tone: "neutral" as const,
  },
];

export default function GuidedTourScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(0);
  const [practiceChoice, setPracticeChoice] = useState<string | null>(null);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const selectedPractice = PRACTICE_CHOICES.find((choice) => choice.id === practiceChoice) || PRACTICE_CHOICES[1];

  const next = () => {
    void Haptics.selectionAsync();
    if (isLast) {
      router.replace(isAuthenticated ? "/(tabs)" : "/membership" as Href);
      return;
    }
    setStep((value) => value + 1);
  };

  return (
    <View style={styles.screen} testID="screen-guided-tour">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BrandStamp width={116} height={68} />
        <Pressable accessibilityRole="button" accessibilityLabel="Close guided tour" onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={21} color={colors.heroForeground} />
        </Pressable>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID={`tour-step-${step + 1}`}
      >
        <View style={styles.progressRow} accessibilityLabel={`Tour step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((item, index) => <View key={item.kicker} style={[styles.progressSegment, index <= step && styles.progressSegmentActive]} />)}
        </View>

        <View style={styles.stepIcon}><Feather name={current.icon} size={27} color={colors.primary} /></View>
        <Text style={styles.kicker}>{current.kicker}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        <TourExperience step={step} practiceChoice={practiceChoice} onPracticeChoice={setPracticeChoice} selectedPractice={selectedPractice} />

        <View style={styles.boundaryRow}>
          <Feather name="shield" size={17} color={colors.primary} />
          <Text style={styles.boundaryText}>Fictional training scenario only. Never enter patient PHI into Spartan Coaching.</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {step > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setStep((value) => value - 1)} style={styles.backButton}><Text style={styles.backText}>Back</Text></Pressable>
        ) : <View style={styles.backButton} />}
        <Pressable accessibilityRole="button" onPress={next} style={styles.nextButton} testID="tour-next-button">
          <Text style={styles.nextText}>{isLast ? (isAuthenticated ? "Return Home" : "Compare memberships") : step === 2 && !practiceChoice ? "See Coach feedback" : "Continue"}</Text>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function TourExperience({ step, practiceChoice, onPracticeChoice, selectedPractice }: { step: number; practiceChoice: string | null; onPracticeChoice: (id: string) => void; selectedPractice: (typeof PRACTICE_CHOICES)[number] }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (step === 0) {
    return (
      <View style={styles.scenarioCard}>
        <Text style={styles.cardKicker}>FICTIONAL ACCOUNT</Text>
        <Text style={styles.cardTitle}>Dr. Elena Rivera · Oncology</Text>
        <InfoLine icon="target" title="Objective" body="Earn a 15 minute hospice education follow up for the practice team." />
        <InfoLine icon="activity" title="Signal" body="Warm conversations, no referral behavior yet." />
        <InfoLine icon="alert-circle" title="Likely resistance" body="Existing preferred hospice relationship." />
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={styles.planCard}>
        <Text style={styles.cardKicker}>YOUR GAME PLAN</Text>
        <ResultBlock number="01" title="Open with curiosity" body="Ask what makes the existing relationship valuable before introducing a different point of view." />
        <ResultBlock number="02" title="Educate around one gap" body="Focus on family understanding and timely hospice conversations, not vendor comparison." />
        <ResultBlock number="03" title="Ask for a small next step" body="Request a short education follow up with the practice team instead of asking for a referral." />
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={styles.practiceStack}>
        {PRACTICE_CHOICES.map((choice) => {
          const selected = practiceChoice === choice.id;
          return (
            <Pressable
              key={choice.id}
              onPress={() => { onPracticeChoice(choice.id); void Haptics.selectionAsync(); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={[styles.practiceChoice, selected && styles.practiceChoiceSelected]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
              <View style={{ flex: 1 }}><Text style={styles.choiceLabel}>{choice.label}</Text><Text style={styles.choiceText}>“{choice.text}”</Text></View>
            </Pressable>
          );
        })}
        {!practiceChoice ? <Text style={styles.choiceHint}>Pick the response you would actually try. There is no account required for this tour.</Text> : null}
      </View>
    );
  }

  if (step === 3) {
    return (
      <View style={styles.coachCard}>
        <View style={styles.coachHeader}><View style={styles.coachMark}><Feather name="message-circle" size={19} color="#FFFFFF" /></View><View><Text style={styles.cardKicker}>SPARTAN COACH</Text><Text style={styles.coachSub}>Feedback on your selected approach</Text></View></View>
        <Text style={styles.feedbackQuote}>“{selectedPractice.text}”</Text>
        <View style={[styles.feedbackBadge, selectedPractice.tone === "strong" ? styles.feedbackStrong : selectedPractice.tone === "risk" ? styles.feedbackRisk : styles.feedbackNeutral]}><Text style={styles.feedbackBadgeText}>{selectedPractice.tone === "strong" ? "STRONG FOUNDATION" : selectedPractice.tone === "risk" ? "REWORK THIS" : "SAFE BUT PASSIVE"}</Text></View>
        <Text style={styles.feedbackBody}>{selectedPractice.feedback}</Text>
        <View style={styles.retryBox}><Text style={styles.retryLabel}>TRY THIS NEXT</Text><Text style={styles.retryText}>“That makes sense. What has made that relationship work well, and where do families still seem uncertain about hospice?”</Text></View>
      </View>
    );
  }

  if (step === 4) {
    return (
      <View style={styles.commitmentCard}>
        <View style={styles.commitmentIcon}><Feather name="check" size={23} color="#FFFFFF" /></View>
        <Text style={styles.cardKicker}>YOUR COMMITMENT</Text>
        <Text style={styles.cardTitle}>Ask one curiosity question before educating.</Text>
        <Text style={styles.commitmentBody}>This returns to Home as unfinished work. You can reopen it, complete it, or keep it private. Raw Coach conversation content is not visible to company administrators.</Text>
        <View style={styles.savedStatus}><Feather name="lock" size={15} color={colors.primary} /><Text style={styles.savedText}>Private by default · explicitly share only what you approve</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.accessCard}>
      <AccessLine title="Standard" price="$14.99 weekly" body="Home, planning, role play, field tools, playbooks, research, outreach, calculators, Library, and saved work." />
      <View style={styles.accessDivider} />
      <AccessLine title="Elite" price="$19.99 weekly" body="Everything in Standard plus private Coach, voice rehearsal, optional memory, advanced AI, and deidentified clinical education tools." elite />
      <View style={styles.accessDivider} />
      <Text style={styles.accessNote}>Company memberships use contracted seats. Human consulting is separately scoped. Neither is an individual Apple subscription.</Text>
    </View>
  );
}

function InfoLine({ icon, title, body }: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; body: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.infoLine}><View style={styles.infoIcon}><Feather name={icon} size={17} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoBody}>{body}</Text></View></View>;
}

function ResultBlock({ number, title, body }: { number: string; title: string; body: string }) {
  const styles = useMemo(() => makeStyles(useColors()), []);
  return <View style={styles.resultBlock}><Text style={styles.resultNumber}>{number}</Text><View style={{ flex: 1 }}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoBody}>{body}</Text></View></View>;
}

function AccessLine({ title, price, body, elite = false }: { title: string; price: string; body: string; elite?: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.accessLine}><View style={{ flex: 1 }}><View style={styles.accessTitleRow}><Text style={styles.accessTitle}>{title}</Text>{elite ? <Text style={styles.eliteBadge}>COMPLETE</Text> : null}</View><Text style={styles.accessBody}>{body}</Text></View><Text style={styles.accessPrice}>{price}</Text></View>;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { minHeight: 126, backgroundColor: colors.heroBackground, paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.28)" },
    content: { paddingHorizontal: 22, paddingTop: 25, paddingBottom: 34 },
    progressRow: { flexDirection: "row", gap: 6, marginBottom: 26 },
    progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.muted },
    progressSegmentActive: { backgroundColor: colors.primary },
    stepIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2, ...font("bold") },
    title: { color: colors.foreground, fontSize: 32, lineHeight: 37, letterSpacing: -0.9, marginTop: 9, ...font("heavy") },
    body: { color: colors.mutedForeground, fontSize: 15, lineHeight: 23, marginTop: 12, ...font("regular") },
    scenarioCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 20, borderCurve: "continuous", padding: 17, marginTop: 24, gap: 12 },
    cardKicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.6, ...font("bold") },
    cardTitle: { color: colors.foreground, fontSize: 20, lineHeight: 25, ...font("heavy") },
    infoLine: { flexDirection: "row", alignItems: "flex-start", gap: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 11 },
    infoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    infoTitle: { color: colors.foreground, fontSize: 13, ...font("bold") },
    infoBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 3, ...font("regular") },
    planCard: { backgroundColor: colors.heroBackground, borderRadius: 21, borderCurve: "continuous", padding: 18, marginTop: 24, gap: 0 },
    resultBlock: { flexDirection: "row", gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.16)" },
    resultNumber: { color: colors.primary, fontSize: 12, ...font("heavy") },
    practiceStack: { gap: 9, marginTop: 24 },
    practiceChoice: { flexDirection: "row", alignItems: "flex-start", gap: 11, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 17, borderCurve: "continuous", padding: 14 },
    practiceChoiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center", marginTop: 1 },
    radioSelected: { borderColor: colors.primary },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
    choiceLabel: { color: colors.foreground, fontSize: 12, ...font("bold") },
    choiceText: { color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 4, ...font("regular") },
    choiceHint: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, textAlign: "center", ...font("regular") },
    coachCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary, borderRadius: 21, borderCurve: "continuous", padding: 17, marginTop: 24, gap: 12 },
    coachHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    coachMark: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    coachSub: { color: colors.mutedForeground, fontSize: 10, marginTop: 2, ...font("regular") },
    feedbackQuote: { color: colors.foreground, fontSize: 15, lineHeight: 22, fontStyle: "italic", ...font("medium") },
    feedbackBadge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
    feedbackStrong: { backgroundColor: "rgba(47,118,84,0.14)" },
    feedbackRisk: { backgroundColor: "rgba(180,35,24,0.12)" },
    feedbackNeutral: { backgroundColor: colors.muted },
    feedbackBadgeText: { color: colors.foreground, fontSize: 8, letterSpacing: 1, ...font("bold") },
    feedbackBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 19, ...font("regular") },
    retryBox: { backgroundColor: colors.primaryMuted, borderRadius: 14, padding: 13 },
    retryLabel: { color: colors.primary, fontSize: 8, letterSpacing: 1.2, ...font("bold") },
    retryText: { color: colors.foreground, fontSize: 11, lineHeight: 17, marginTop: 5, ...font("medium") },
    commitmentCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 21, borderCurve: "continuous", padding: 18, marginTop: 24, gap: 10 },
    commitmentIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
    commitmentBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 19, ...font("regular") },
    savedStatus: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.primaryMuted, borderRadius: 12, padding: 10 },
    savedText: { flex: 1, color: colors.mutedForeground, fontSize: 9, lineHeight: 14, ...font("medium") },
    accessCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 21, borderCurve: "continuous", padding: 17, marginTop: 24 },
    accessLine: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 13 },
    accessTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    accessTitle: { color: colors.foreground, fontSize: 17, ...font("heavy") },
    eliteBadge: { color: colors.primary, backgroundColor: colors.primaryMuted, borderRadius: 999, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3, fontSize: 7, letterSpacing: 0.8, ...font("bold") },
    accessBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 16, marginTop: 4, ...font("regular") },
    accessPrice: { color: colors.primary, fontSize: 12, fontVariant: ["tabular-nums"], ...font("bold") },
    accessDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
    accessNote: { color: colors.mutedForeground, fontSize: 10, lineHeight: 16, paddingTop: 12, ...font("regular") },
    boundaryRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: colors.primaryMuted, borderRadius: 15, padding: 13, marginTop: 15 },
    boundaryText: { color: colors.mutedForeground, flex: 1, fontSize: 10, lineHeight: 16, ...font("medium") },
    footer: { minHeight: 84, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, flexDirection: "row", alignItems: "center", gap: 12 },
    backButton: { width: 66, minHeight: 52, alignItems: "center", justifyContent: "center" },
    backText: { color: colors.mutedForeground, fontSize: 15, ...font("semibold") },
    nextButton: { flex: 1, minHeight: 54, borderRadius: 17, borderCurve: "continuous", paddingHorizontal: 18, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    nextText: { color: "#FFFFFF", fontSize: 16, ...font("bold") },
  });
}
