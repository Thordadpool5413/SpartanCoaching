import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { useColors } from "@/hooks/useColors";
import { font } from "@/lib/typography";

type Section = "method" | "drills" | "quiz" | "manifesto";

const PILLARS = [
  { title: "Discipline", icon: "calendar" as const, body: "Prepare before the visit, make the specific ask, and complete the follow-through you promised." },
  { title: "Empathy", icon: "heart" as const, body: "Hear the concern beneath the words. Educate without pressure and respect the responsibility of the person across from you." },
  { title: "Strategy", icon: "compass" as const, body: "Know the account, the value you can add, the obstacle in the room, and the next move that advances care." },
];

const MANIFESTO = [
  "Hospice sales is patient advocacy carried through professional relationships.",
  "Preparation is respect—for the referral source, the care team, and the eligible patient who may be waiting.",
  "Trust is earned through clinical accuracy, useful education, disciplined follow-through, and no pressure.",
  "Every conversation should leave the other person clearer than you found them.",
  "The work is not finished until the next commitment is specific and owned.",
];

const DRILLS = [
  { title: "The 30-second opening", body: "State who you help, the problem you solve, and one reason the conversation matters now." },
  { title: "Hear the concern", body: "Repeat the objection in your own words before answering. Confirm that you understood it correctly." },
  { title: "Earn the next step", body: "Close with one specific, low-friction commitment: a date, a person, or a follow-up action." },
];

const QUIZ = [
  { question: "A referral source says, ‘We already have a hospice.’ What comes first?", options: ["Explain why your hospice is better", "Clarify what is working and what support is still missing", "Ask for a patient list"], answer: 1 },
  { question: "What makes a next step useful?", options: ["It sounds positive", "It is specific, owned, and time-bound", "It keeps the conversation open"], answer: 1 },
  { question: "What belongs in Spartan Coaching?", options: ["Deidentified sales context", "A patient name and date of birth", "A medical record number"], answer: 0 },
];

export default function MethodGuideScreen() {
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  const raw = Array.isArray(params.section) ? params.section[0] : params.section;
  const section = (["method", "drills", "quiz", "manifesto"].includes(raw || "") ? raw : "method") as Section;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]} showsVerticalScrollIndicator={false} testID={`method-guide-${section}`}>
      <Stack.Screen options={{ title: section === "method" ? "The Spartan Method" : section[0].toUpperCase() + section.slice(1) }} />
      <View style={styles.hero}>
        <HelmetMark size={58} />
        <View style={{ flex: 1 }}><Text style={styles.kicker}>SPARTAN METHOD</Text><Text style={styles.title}>{sectionTitle(section)}</Text></View>
      </View>
      <Text style={styles.intro}>{sectionIntro(section)}</Text>
      {section === "method" ? <Method styles={styles} /> : null}
      {section === "drills" ? <Drills styles={styles} colors={colors} /> : null}
      {section === "quiz" ? <Quiz styles={styles} colors={colors} /> : null}
      {section === "manifesto" ? <Manifesto styles={styles} /> : null}
      <View style={styles.boundary}><Feather name="shield" size={17} color={colors.primary} /><Text style={styles.boundaryText}>Never enter patient PHI. Clinical education is general guidance and requires appropriate medical director or compliance approval.</Text></View>
    </ScrollView>
  );
}

function sectionTitle(section: Section) {
  return { method: "Discipline. Empathy. Strategy.", drills: "Practice the moment.", quiz: "Check your judgment.", manifesto: "What we stand for." }[section];
}
function sectionIntro(section: Section) {
  return {
    method: "A practical operating system for showing up prepared, hearing what matters, and moving the right next step forward.",
    drills: "Short rehearsals built for the minutes before a meeting—not another course to finish someday.",
    quiz: "Choose the strongest field response. You will see the reasoning immediately.",
    manifesto: "The standard behind the tools, the Coach, and every conversation Spartan Coaching helps prepare.",
  }[section];
}

function Method({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.stack}>{PILLARS.map((pillar, index) => <View key={pillar.title} style={styles.card}><Text style={styles.number}>0{index + 1}</Text><View style={styles.cardCopy}><Text style={styles.cardTitle}>{pillar.title}</Text><Text style={styles.cardBody}>{pillar.body}</Text></View></View>)}</View>;
}

function Drills({ styles, colors }: { styles: ReturnType<typeof makeStyles>; colors: ReturnType<typeof useColors> }) {
  const [completed, setCompleted] = useState<number[]>([]);
  return <View style={styles.stack}>{DRILLS.map((drill, index) => { const done = completed.includes(index); return <Pressable key={drill.title} onPress={() => { void Haptics.selectionAsync(); setCompleted((items) => done ? items.filter((item) => item !== index) : [...items, index]); }} style={styles.card} accessibilityState={{ checked: done }}><View style={[styles.check, done && { backgroundColor: colors.success, borderColor: colors.success }]}><Feather name={done ? "check" : "play"} size={16} color={done ? "#FFFFFF" : colors.primary} /></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>{drill.title}</Text><Text style={styles.cardBody}>{drill.body}</Text><Text style={styles.cardAction}>{done ? "Completed" : "Tap when practiced"}</Text></View></Pressable>; })}</View>;
}

function Quiz({ styles, colors }: { styles: ReturnType<typeof makeStyles>; colors: ReturnType<typeof useColors> }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return <View style={styles.stack}>{QUIZ.map((item, questionIndex) => <View key={item.question} style={styles.quizCard}><Text style={styles.quizNumber}>QUESTION {questionIndex + 1} OF {QUIZ.length}</Text><Text style={styles.cardTitle}>{item.question}</Text><View style={{ gap: 8, marginTop: 12 }}>{item.options.map((option, optionIndex) => { const selected = answers[questionIndex] === optionIndex; const answered = answers[questionIndex] !== undefined; const correct = optionIndex === item.answer; const borderColor = selected ? (correct ? colors.success : colors.destructive) : colors.borderStrong; return <Pressable key={option} onPress={() => { void Haptics.selectionAsync(); setAnswers((current) => ({ ...current, [questionIndex]: optionIndex })); }} style={[styles.option, { borderColor }, selected && { backgroundColor: correct ? "rgba(47,118,84,0.12)" : colors.primaryMuted }]}><Text style={styles.optionText}>{option}</Text>{selected ? <Feather name={correct ? "check-circle" : "x-circle"} size={18} color={correct ? colors.success : colors.destructive} /> : null}</Pressable>; })}</View>{answers[questionIndex] !== undefined ? <Text style={styles.feedback}>{answers[questionIndex] === item.answer ? "Correct. That is the Spartan standard." : `Not quite. Strongest answer: ${item.options[item.answer]}`}</Text> : null}</View>)}</View>;
}

function Manifesto({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.manifesto}>{MANIFESTO.map((line, index) => <View key={line} style={styles.manifestoRow}><Text style={styles.manifestoNumber}>{String(index + 1).padStart(2, "0")}</Text><Text style={styles.manifestoText}>{line}</Text></View>)}</View>;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16 },
    hero: { flexDirection: "row", alignItems: "center", gap: 15, backgroundColor: colors.heroBackground, borderRadius: 24, padding: 18 },
    kicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.8, ...font("bold") },
    title: { color: colors.heroForeground, fontSize: 23, lineHeight: 28, letterSpacing: -0.45, marginTop: 4, ...font("heavy") },
    intro: { color: colors.mutedForeground, fontSize: 15, lineHeight: 23, ...font("regular") },
    stack: { gap: 12 },
    card: { flexDirection: "row", alignItems: "flex-start", gap: 13, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.borderStrong, padding: 17 },
    number: { color: colors.primary, fontSize: 12, letterSpacing: 1.2, ...font("bold") },
    cardCopy: { flex: 1 },
    cardTitle: { color: colors.foreground, fontSize: 18, lineHeight: 23, ...font("heavy") },
    cardBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 20, marginTop: 5, ...font("regular") },
    cardAction: { color: colors.primary, fontSize: 11, marginTop: 10, ...font("bold") },
    check: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    quizCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.borderStrong, padding: 17 },
    quizNumber: { color: colors.primary, fontSize: 9, letterSpacing: 1.5, marginBottom: 8, ...font("bold") },
    option: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, backgroundColor: colors.background },
    optionText: { color: colors.foreground, flex: 1, fontSize: 13, lineHeight: 18, ...font("medium") },
    feedback: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 10, ...font("semibold") },
    manifesto: { borderTopWidth: 1, borderTopColor: colors.primary },
    manifestoRow: { flexDirection: "row", gap: 14, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    manifestoNumber: { color: colors.primary, fontSize: 10, letterSpacing: 1.2, ...font("bold") },
    manifestoText: { color: colors.foreground, flex: 1, fontSize: 17, lineHeight: 25, ...font("semibold") },
    boundary: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.primaryMuted, borderRadius: 16, padding: 14 },
    boundaryText: { color: colors.mutedForeground, flex: 1, fontSize: 11, lineHeight: 17, ...font("regular") },
  });
}
