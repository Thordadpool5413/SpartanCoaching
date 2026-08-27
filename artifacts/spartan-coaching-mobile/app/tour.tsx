import { Feather } from "@expo/vector-icons";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import * as Haptics from "expo-haptics";
import { router, type Href } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";
import { goBackOrReplace } from "@/lib/navigation";
import { completeGuidedTour, dismissGuidedTour, getGuidedTourState, saveGuidedTourStep } from "@/lib/guidedTour";

type TourStep = {
  kicker: string;
  title: string;
  body: string;
  icon: React.ComponentProps<typeof Feather>["name"];
};

const STEPS: TourStep[] = [
  {
    kicker: "1 · START HERE",
    title: "Know how the whole system fits together.",
    body: "Home recommends the next useful move. Explore is the field-tool directory. Library holds reading, listening, and approved resources. Coach gives private Elite practice. My Work keeps commitments, plans, downloads, and approved outputs organized.",
    icon: "compass",
  },
  {
    kicker: "2 · THE SITUATION",
    title: "Start with a real field moment.",
    body: "This walkthrough uses fictional information. You are preparing for a follow up conversation with Dr. Rivera, an oncology referral source who has been polite but has not referred a patient.",
    icon: "map-pin",
  },
  {
    kicker: "3 · PREPARE",
    title: "Turn context into a game plan.",
    body: "Planning tools narrow the objective, likely resistance, talking points, and next move before you walk into the conversation.",
    icon: "message-square",
  },
  {
    kicker: "4 · PRACTICE",
    title: "Now the room pushes back.",
    body: "Dr. Rivera says: “We already have a preferred hospice. I do not want to confuse families.” Choose the response you would test first.",
    icon: "shield",
  },
  {
    kicker: "5 · COACH FEEDBACK",
    title: "Feedback should change the next attempt.",
    body: "Elite Coach identifies what worked, what created risk, and what to try differently before you rehearse again by text or voice.",
    icon: "mic",
  },
  {
    kicker: "6 · FOLLOW THROUGH",
    title: "The work ends with one commitment.",
    body: "Commitments and saved plans appear in My Work so preparation does not disappear after the conversation. Private Coach content stays private unless you explicitly share a summary or commitment.",
    icon: "check-circle",
  },
  {
    kicker: "7 · FIND EVERY TOOL",
    title: "Explore is the complete tool directory.",
    body: `All ${FIELD_KIT_TOOLS.length} tools are organized by the job you need to accomplish. Every tool explains when to use it, how it works, what you enter, and what you leave with.`,
    icon: "grid",
  },
  {
    kicker: "8 · LIBRARY AND OFFLINE",
    title: "Read, listen, use, and keep what matters.",
    body: "The Library contains native field notes, audio, Method experiences, and approved resources. Downloads, selected plans, commitments, and approved nonclinical outputs remain available offline.",
    icon: "book-open",
  },
  {
    kicker: "9 · IPHONE AND WEBSITE",
    title: "Your work follows the same account.",
    body: "Use Spartan Coaching on this iPhone or the website with the same account, history, commitments, preferences, membership, and saved work. The app stays native while the website remains available when you want a larger workspace.",
    icon: "monitor",
  },
  {
    kicker: "10 · CHOOSE YOUR ACCESS",
    title: "Standard is the field system. Elite adds private Coach.",
    body: "Use the Access map to compare capabilities, offline behavior, and privacy boundaries before choosing Standard or Elite. Membership is where you select or manage that choice.",
    icon: "layers",
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

  useEffect(() => {
    let active = true;
    void getGuidedTourState().then((state) => {
      if (!active || state?.status !== "started") return;
      setStep(Math.max(0, Math.min(STEPS.length - 1, state.step)));
    });
    return () => { active = false; };
  }, []);

  const next = () => {
    void Haptics.selectionAsync();
    if (isLast) {
      void completeGuidedTour();
      router.replace(isAuthenticated ? "/(tabs)" : "/membership" as Href);
      return;
    }
    setStep((value) => {
      const nextStep = value + 1;
      void saveGuidedTourStep(nextStep);
      return nextStep;
    });
  };

  const close = () => {
    void dismissGuidedTour(step);
    goBackOrReplace("/(tabs)");
  };

  return (
    <View style={styles.screen} testID="screen-guided-tour">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.tourBrand}><HelmetMark size={48} /><Text style={styles.tourBrandText}>SPARTAN COACHING</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close guided tour" onPress={close} style={styles.closeButton}>
          <Feather name="x" size={21} color={colors.heroForeground} />
        </Pressable>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID={`tour-step-${step + 1}`}
      >
        <View
          style={styles.progressRow}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1, text: `Step ${step + 1} of ${STEPS.length}` }}
          accessibilityLabel="Guided tour progress"
        >
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
          <Pressable accessibilityRole="button" onPress={() => setStep((value) => { const previous = value - 1; void saveGuidedTourStep(previous); return previous; })} style={styles.backButton}><Text style={styles.backText}>Back</Text></Pressable>
        ) : <View style={styles.backButton} />}
        <Pressable accessibilityRole="button" onPress={next} style={styles.nextButton} testID="tour-next-button">
          <Text style={styles.nextText}>{isLast ? (isAuthenticated ? "Return Home" : "Compare memberships") : step === 3 && !practiceChoice ? "See Coach feedback" : "Continue"}</Text>
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
        <Text style={styles.cardKicker}>YOUR FIELD GUIDE</Text>
        <Text style={styles.cardTitle}>Five destinations. One connected system.</Text>
        <InfoLine icon="home" title="Home" body="See one recommended next move and reopen unfinished work." />
        <InfoLine icon="grid" title="Explore" body={`Find all ${FIELD_KIT_TOOLS.length} field tools by the job you need to do.`} />
        <InfoLine icon="book-open" title="Library" body="Read, listen, and use approved field resources." />
        <InfoLine icon="message-circle" title="Coach" body="Practice privately with text or voice when Elite is active." />
        <InfoLine icon="check-circle" title="My Work" body="Resume plans, commitments, downloads, and approved outputs." />
      </View>
    );
  }

  if (step === 1) {
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

  if (step === 2) {
    return (
      <View style={styles.planCard}>
        <Text style={styles.planKicker}>YOUR GAME PLAN</Text>
        <ResultBlock number="01" title="Open with curiosity" body="Ask what makes the existing relationship valuable before introducing a different point of view." />
        <ResultBlock number="02" title="Educate around one gap" body="Focus on family understanding and timely hospice conversations, not vendor comparison." />
        <ResultBlock number="03" title="Ask for a small next step" body="Request a short education follow up with the practice team instead of asking for a referral." />
      </View>
    );
  }

  if (step === 3) {
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

  if (step === 4) {
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

  if (step === 5) {
    return (
      <View style={styles.commitmentCard}>
        <View style={styles.commitmentIcon}><Feather name="check" size={23} color="#FFFFFF" /></View>
        <Text style={styles.cardKicker}>YOUR COMMITMENT</Text>
        <Text style={styles.cardTitle}>Ask one curiosity question before educating.</Text>
        <Text style={styles.commitmentBody}>This appears in My Work as unfinished work. Reopen it, complete it, or keep it private. Raw Coach conversation content is never visible to company administrators.</Text>
        <View style={styles.savedStatus}><Feather name="lock" size={15} color={colors.primary} /><Text style={styles.savedText}>Private by default · explicitly share only what you approve</Text></View>
      </View>
    );
  }

  if (step === 6) {
    return (
      <View style={styles.scenarioCard}>
        <Text style={styles.cardKicker}>COMPLETE TOOL DIRECTORY</Text>
        <Text style={styles.cardTitle}>{FIELD_KIT_TOOLS.length} native tools organized by purpose</Text>
        <InfoLine icon="edit-3" title="Prepare and Plan" body="Playbooks, research, outreach, weekly planning, and the Field Visit Planner." />
        <InfoLine icon="message-circle" title="Practice" body="Objection handling, role play, transcription, and field rehearsal." />
        <InfoLine icon="bar-chart-2" title="Measure" body="Activity, cost, return, and branch profitability calculators." />
        <InfoLine icon="info" title="Every tool teaches itself" body="Open How it works to see when to use it, the steps, and the expected outcome." />
      </View>
    );
  }

  if (step === 7) {
    return (
      <View style={styles.scenarioCard}>
        <Text style={styles.cardKicker}>LIBRARY AND MY WORK</Text>
        <Text style={styles.cardTitle}>Information becomes useful when you can find it again.</Text>
        <InfoLine icon="book-open" title="Read" body="Open complete field notes inside the native reader." />
        <InfoLine icon="headphones" title="Listen" body="Use audio briefings without leaving Spartan Coaching." />
        <InfoLine icon="folder" title="Use" body="Open approved resources, Method experiences, drills, and templates." />
        <InfoLine icon="download" title="Keep offline" body="Save approved content and reopen it from My Work when service is limited." />
      </View>
    );
  }

  if (step === 8) {
    return (
      <View style={styles.scenarioCard}>
        <Text style={styles.cardKicker}>ONE ACCOUNT</Text>
        <Text style={styles.cardTitle}>Continue on iPhone or the website.</Text>
        <InfoLine icon="smartphone" title="Use the app in the field" body="Native tools, Coach, Library, downloads, and My Work stay close to the moment." />
        <InfoLine icon="monitor" title="Use the website when useful" body="Sign in with the same Spartan account for a larger workspace and the same saved continuity." />
        <InfoLine icon="refresh-cw" title="Keep one history" body="Membership, commitments, preferences, and saved work remain connected." />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push("/access" as Href)}
      style={styles.accessCard}
    >
      <Text style={styles.cardKicker}>CAPABILITY MAP</Text>
      <Text style={styles.cardTitle}>Compare access before you choose.</Text>
      <Text style={styles.cardBody}>
        Access is the single place for Standard and Elite capabilities, offline behavior, privacy boundaries,
        company seats, and consulting separation.
      </Text>
      <Text style={styles.accessLink}>Open Access map →</Text>
    </Pressable>
  );
}

function InfoLine({ icon, title, body }: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; body: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.infoLine}><View style={styles.infoIcon}><Feather name={icon} size={17} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoBody}>{body}</Text></View></View>;
}

function ResultBlock({ number, title, body }: { number: string; title: string; body: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.resultBlock}><Text style={styles.resultNumber}>{number}</Text><View style={{ flex: 1 }}><Text style={styles.planInfoTitle}>{title}</Text><Text style={styles.planInfoBody}>{body}</Text></View></View>;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { minHeight: 126, backgroundColor: colors.heroBackground, paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    tourBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
    tourBrandText: { color: colors.heroForeground, fontSize: 14, letterSpacing: 0.8, ...font("heavy") },
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
    cardBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 8, ...font("regular") },
    infoLine: { flexDirection: "row", alignItems: "flex-start", gap: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 11 },
    infoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    infoTitle: { color: colors.foreground, fontSize: 13, ...font("bold") },
    infoBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 3, ...font("regular") },
    planCard: { backgroundColor: colors.heroBackground, borderRadius: 21, borderCurve: "continuous", padding: 18, marginTop: 24, gap: 0 },
    planKicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.6, ...font("bold") },
    resultBlock: { flexDirection: "row", gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.16)" },
    resultNumber: { color: colors.primary, fontSize: 12, ...font("heavy") },
    planInfoTitle: { color: colors.heroForeground, fontSize: 13, ...font("bold") },
    planInfoBody: { color: colors.heroMuted, fontSize: 11, lineHeight: 17, marginTop: 3, ...font("regular") },
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
    accessLink: { color: colors.primary, fontSize: 12, marginTop: 14, ...font("bold") },
    boundaryRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: colors.primaryMuted, borderRadius: 15, padding: 13, marginTop: 15 },
    boundaryText: { color: colors.mutedForeground, flex: 1, fontSize: 10, lineHeight: 16, ...font("medium") },
    footer: { minHeight: 84, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, flexDirection: "row", alignItems: "center", gap: 12 },
    backButton: { width: 66, minHeight: 52, alignItems: "center", justifyContent: "center" },
    backText: { color: colors.mutedForeground, fontSize: 15, ...font("semibold") },
    nextButton: { flex: 1, minHeight: 54, borderRadius: 17, borderCurve: "continuous", paddingHorizontal: 18, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    nextText: { color: "#FFFFFF", fontSize: 16, ...font("bold") },
  });
}
