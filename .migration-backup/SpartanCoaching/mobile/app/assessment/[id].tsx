import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { sharePdfDocument } from "@/components/export-document";
import { Card, EmptyState, Field, Pill, PrimaryButton, PressableCard, ScreenScrollView, SectionHeader, SecondaryButton } from "@/components/ui";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { recordActivity, STORAGE_KEYS, useStoredJson } from "@/lib/storage";
import { colors, spacing } from "@/lib/theme";

type AssessmentQuestion = {
  id: number;
  type: "quiz" | "scenario" | string;
  text: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  displayOrder?: number;
};

type AssessmentInfo = {
  id: number;
  name: string;
  description?: string | null;
};

type AssessmentDraft = {
  candidateName: string;
  candidateEmail: string;
  answers: Record<string, string>;
};

type AssessmentResult = {
  submission: any;
  overallScore: number;
  quizScore: number | null;
  aiScore: number | null;
  feedback: string;
};

const blankDraft: AssessmentDraft = {
  candidateName: "",
  candidateEmail: "",
  answers: {},
};

export default function AssessmentScreen() {
  const params = useLocalSearchParams<{ id?: string; token?: string; clientSlug?: string }>();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id ?? "default";
  const inviteToken = Array.isArray(params.token) ? params.token[0] : params.token;
  const clientSlug = Array.isArray(params.clientSlug) ? params.clientSlug[0] : params.clientSlug;
  const [resolvedAssessmentId, setResolvedAssessmentId] = useState<number | null>(null);
  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [drafts, setDrafts] = useStoredJson<Record<string, AssessmentDraft>>(STORAGE_KEYS.assessmentDrafts, {});

  const draftKey = routeId === "default" ? "default" : String(routeId);
  const draft = drafts[draftKey] ?? blankDraft;

  useEffect(() => {
    let mounted = true;

    async function loadAssessment() {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        let actualId = routeId;
        if (routeId === "default") {
          const response = await api.getDefaultAssessment();
          actualId = String(response.assessmentId);
        }

        const parsedId = Number(actualId);
        if (!Number.isFinite(parsedId)) {
          throw new Error("That assessment ID is not valid.");
        }

        const response = await api.getAssessmentPublic(parsedId);
        if (!mounted) return;
        setResolvedAssessmentId(parsedId);
        setAssessment(response.assessment as AssessmentInfo);
        setQuestions((response.questions as AssessmentQuestion[]).slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      } catch (loadError) {
        if (!mounted) return;
        setError(apiErrorMessage(loadError, "Unable to load the assessment right now."));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAssessment();

    return () => {
      mounted = false;
    };
  }, [routeId]);

  const answeredCount = useMemo(
    () => questions.filter((question) => (draft.answers[String(question.id)] ?? "").trim().length > 0).length,
    [draft.answers, questions]
  );

  function updateDraft(patch: Partial<AssessmentDraft>) {
    setDrafts({
      ...drafts,
      [draftKey]: {
        ...draft,
        ...patch,
      },
    });
  }

  function updateAnswer(questionId: number, answer: string) {
    updateDraft({
      answers: {
        ...draft.answers,
        [String(questionId)]: answer,
      },
    });
  }

  const canSubmit =
    Boolean(resolvedAssessmentId) &&
    draft.candidateName.trim().length >= 2 &&
    draft.candidateEmail.trim().includes("@") &&
    questions.length > 0 &&
    answeredCount === questions.length;

  async function handleSubmit() {
    if (!resolvedAssessmentId || !canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.submitAssessment(resolvedAssessmentId, {
        candidateName: draft.candidateName.trim(),
        candidateEmail: draft.candidateEmail.trim(),
        answers: draft.answers,
        inviteToken,
        clientSlug,
      });

      const payload: AssessmentResult = {
        submission: response.submission,
        overallScore: response.overallScore,
        quizScore: response.quizScore,
        aiScore: response.aiScore,
        feedback: response.feedback,
      };

      setResult(payload);
      recordActivity({
        title: "Submitted assessment",
        subtitle: assessment?.name ?? "Assessment",
        kind: "assessment",
      });
    } catch (submitError) {
      setError(apiErrorMessage(submitError, "Unable to submit the assessment."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare() {
    if (!assessment || !result) return;
    await sharePdfDocument({
      title: assessment.name,
      subtitle: assessment.description ?? "Assessment results",
      sections: [
        {
          heading: "Scores",
          body: [
            `Overall score: ${result.overallScore}`,
            `Quiz score: ${result.quizScore ?? "n/a"}`,
            `AI score: ${result.aiScore ?? "n/a"}`,
          ],
        },
        {
          heading: "Feedback",
          body: result.feedback,
        },
        {
          heading: "Submission",
          body: [
            `Candidate: ${draft.candidateName}`,
            `Email: ${draft.candidateEmail}`,
            `Submitted: ${formatDate(new Date())}`,
          ],
        },
      ],
    });
    recordActivity({
      title: "Shared assessment result",
      subtitle: assessment.name,
      kind: "assessment",
    });
  }

  if (loading) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <Card>
            <Text style={{ color: colors.muted }}>Loading assessment...</Text>
          </Card>
        </View>
      </ScreenScrollView>
    );
  }

  if (error && !assessment) {
    return (
      <ScreenScrollView>
        <View style={{ paddingTop: 16 }}>
          <EmptyState title="Assessment unavailable" body={error} />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: 120 }}>
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Pill tone="good">Assessment</Pill>
        <Text style={{ color: colors.text, fontSize: 30, lineHeight: 34, fontWeight: "900" }}>
          {assessment?.name ?? "Assessment"}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          {assessment?.description ?? "Review the questions, submit your answers, and keep the draft locally if you need to come back later."}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Pill tone="neutral">{questions.length} questions</Pill>
          <Pill tone="neutral">{answeredCount}/{questions.length} answered</Pill>
          <Pill tone="neutral">Draft saved locally</Pill>
        </View>
      </View>

      <Card>
        <SectionHeader title="Candidate details" subtitle="The backend requires a name and email before submission." />
        <View style={{ gap: spacing.md }}>
          <Field
            label="Candidate name"
            value={draft.candidateName}
            onChangeText={(candidateName) => updateDraft({ candidateName })}
            placeholder="Your name"
          />
          <Field
            label="Candidate email"
            value={draft.candidateEmail}
            onChangeText={(candidateEmail) => updateDraft({ candidateEmail })}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </Card>

      <View style={{ gap: spacing.md }}>
        {questions.map((question, index) => {
          const answer = draft.answers[String(question.id)] ?? "";
          const isQuiz = Array.isArray(question.options) && question.options.length > 0;
          return (
            <Card key={question.id}>
              <SectionHeader
                title={`Question ${index + 1}`}
                subtitle={question.type === "quiz" ? "Multiple choice" : "Scenario response"}
                action={<Pill tone="neutral">{question.type}</Pill>}
              />
              <View style={{ gap: spacing.sm }}>
                <Text selectable style={{ color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: "700" }}>
                  {question.text}
                </Text>
                {isQuiz ? (
                  <View style={{ gap: spacing.sm }}>
                    {question.options!.map((option) => (
                      <PressableCard
                        key={option}
                        onPress={() => updateAnswer(question.id, option)}
                        style={{
                          borderColor: answer === option ? colors.accent : colors.border,
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{option}</Text>
                      </PressableCard>
                    ))}
                  </View>
                ) : (
                  <Field
                    multiline
                    value={answer}
                    onChangeText={(nextAnswer) => updateAnswer(question.id, nextAnswer)}
                    placeholder="Write your response here..."
                    helper={question.correctAnswer ? "Scoring is handled in the backend after submission." : undefined}
                  />
                )}
              </View>
            </Card>
          );
        })}
      </View>

      {error ? <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18 }}>{error}</Text> : null}

      <Card>
        <SectionHeader title="Submit" subtitle="All questions must be answered before the backend accepts the assessment." />
        <View style={{ gap: spacing.sm }}>
          <PrimaryButton
            title={submitting ? "Submitting..." : "Submit assessment"}
            loading={submitting}
            disabled={!canSubmit}
            onPress={handleSubmit}
          />
          <SecondaryButton
            title="Reset draft"
            onPress={() => updateDraft(blankDraft)}
          />
        </View>
      </Card>

      {result ? (
        <Card>
          <SectionHeader title="Result" subtitle="The backend returned a scored submission." />
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <Pill tone="good">Overall {result.overallScore}</Pill>
              <Pill tone="neutral">Quiz {result.quizScore ?? "n/a"}</Pill>
              <Pill tone="warning">AI {result.aiScore ?? "n/a"}</Pill>
            </View>
            <Text selectable style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
              {result.feedback}
            </Text>
            <SecondaryButton title="Share result PDF" onPress={handleShare} />
          </View>
        </Card>
      ) : null}
    </ScreenScrollView>
  );
}
