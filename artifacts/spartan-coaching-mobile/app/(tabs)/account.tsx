import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchBillingStatus,
  fetchOnboardingMobile,
  getWebSiteUrl,
  openBillingPortal,
  startIndividualCheckout,
  updateOnboardingMobile,
  type BillingStatus,
} from "@/lib/api";
import {
  formatTrialRemaining,
  isChecklistDone,
  visibleChecklist,
} from "@/lib/onboarding";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";

// Key gated tools to surface in value cards (no PHI, no public tools)
const VALUE_TOOLS = FIELD_KIT_TOOLS.filter((t) => !t.public).slice(0, 7);

const ROLES = [
  { id: "rep", label: "Rep / liaison" },
  { id: "director", label: "Director" },
  { id: "vp", label: "VP / exec" },
  { id: "owner", label: "Owner" },
  { id: "other", label: "Other" },
];

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading, isAuthenticated, canUseFieldKit, logout, refresh } = useAuth();

  const [jobRole, setJobRole] = useState("");
  const [territoryNote, setTerritoryNote] = useState("");
  const [topObjections, setTopObjections] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean | string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [portalPending, setPortalPending] = useState(false);

  // Tracks when billing data was last successfully fetched, used to skip
  // unnecessary refreshes when the app briefly goes to the background.
  const billingLastFetchedRef = useRef<number>(0);
  const BILLING_STALE_MS = 30_000;

  // Set to true whenever the user opens a Stripe URL (checkout or portal) so
  // the foreground-return handler knows to skip the staleness check.
  const stripeOpenedRef = useRef<boolean>(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 90;

  const load = useCallback(async () => {
    if (!canUseFieldKit) return;
    try {
      const data = await fetchOnboardingMobile();
      setJobRole(data.member.jobRole || "");
      setTerritoryNote(data.member.territoryNote || "");
      setTopObjections(data.member.topObjections || "");
      setChecklist(data.member.checklistProgress || {});
    } catch {
      // ignore
    }
  }, [canUseFieldKit]);

  const loadBilling = useCallback(async () => {
    if (!isAuthenticated) return;
    setBillingLoading(true);
    try {
      const data = await fetchBillingStatus();
      setBilling(data);
      billingLastFetchedRef.current = Date.now();
    } finally {
      setBillingLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load();
      loadBilling();
      void refresh();
    }, [load, loadBilling, refresh]),
  );

  // Re-check billing when the app comes back to the foreground (e.g. returning
  // from Stripe Checkout or the billing portal in the browser).
  // Skip the fetch if billing data was loaded less than 30 s ago to avoid a
  // loading-spinner flash when the user just briefly switches apps —
  // UNLESS the user was sent to a Stripe URL, in which case always reload
  // so the card reflects the completed checkout immediately.
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current !== "active" && nextState === "active") {
        const fromStripe = stripeOpenedRef.current;
        if (fromStripe) {
          stripeOpenedRef.current = false;
          loadBilling();
        } else {
          const age = Date.now() - billingLastFetchedRef.current;
          if (age >= BILLING_STALE_MS) {
            loadBilling();
          }
        }
        void refresh();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [loadBilling, refresh]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingTop: topPad + 24,
          paddingBottom: bottomPad,
          paddingHorizontal: 20,
        }}
      >
        <Text style={[styles.kicker, { color: colors.primary }]}>Client access</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Your Portal</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Sign in to use the Hospice Sales Pro on the go — objections, playbooks, role-play, and more.
          Individuals: create an account on the web, then subscribe for $14.99/week (cancel anytime). Preview tools free first.
        </Text>

        <View style={[styles.card, { borderColor: colors.primary, backgroundColor: colors.cardElevated ?? colors.card, borderWidth: 1.5 }]}>
          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>
            What you unlock
          </Text>
          {[
            { title: "Objection Handler", desc: "Field-ready responses to 'not ready yet' and every objection you hear this week" },
            { title: "Playbook Generator", desc: "Custom talking points and a clear next-step ask for any account visit" },
            { title: "Role-Play Practice", desc: "Simulate physician and family conversations before you're in the room" },
            { title: "Weekly Plan Builder", desc: "Monday–Friday territory plan with win conditions for every account" },
            { title: "Cold Call Script Generator", desc: "Openers and next-step asks for a full block of new outreach calls" },
          ].map((t) => (
            <View key={t.title} style={[styles.bulletRow, { marginBottom: 8, alignItems: "flex-start" }]}>
              <Feather name="check-circle" size={15} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13 }}>{t.title}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 1 }}>{t.desc}</Text>
              </View>
            </View>
          ))}
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
            + Activity Calculator, ROI Calculator, Email Templates, Grounded Research — 13 tools total · $14.99/week · cancel anytime
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/login")}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Client login</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(`${getWebSiteUrl()}/hospice-sales-pro`)}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: colors.primary, textAlign: "center", fontWeight: "700" }}>
            View membership pricing →
          </Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(`${getWebSiteUrl()}/register`)}
          style={{ marginTop: 12 }}
          testID="button-create-account"
        >
          <Text style={{ color: colors.primary, textAlign: "center", fontWeight: "700" }}>
            New? Create an account →
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/contact")} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.mutedForeground, textAlign: "center", fontWeight: "600" }}>
            Request team access or book a call
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  const org = user.organization;
  const fk = user.fieldKit;
  const billingOrg = billing?.organization;
  const isPersonal = org?.type === "personal";
  const isCompany = org?.type === "company";
  const isPlatform = org?.type === "platform" || user.member.role === "platform_admin";
  const isComp =
    billingOrg?.billingPlan === "comp" || org?.billingPlan === "comp";
  const hasPaidSub =
    Boolean(billingOrg?.hasStripeSubscription || org?.hasStripeSubscription) &&
    (billingOrg?.billingStatus === "active" ||
      billingOrg?.billingStatus === "trialing" ||
      org?.billingStatus === "active" ||
      org?.billingStatus === "trialing" ||
      (org?.status === "active" &&
        (billingOrg?.hasStripeSubscription || org?.hasStripeSubscription)));
  const cancelAtPeriodEnd = Boolean(
    billingOrg?.cancelAtPeriodEnd ?? org?.cancelAtPeriodEnd,
  );
  const periodEnd = billingOrg?.currentPeriodEnd || org?.currentPeriodEnd;

  const canCheckout =
    isPersonal &&
    !isPlatform &&
    !isComp &&
    !hasPaidSub &&
    (org?.status === "trial" ||
      org?.status === "expired" ||
      org?.status === "suspended" ||
      org?.status === "active");

  const canPortal =
    Boolean(billing?.canOpenPortal) ||
    Boolean(billingOrg?.hasStripeCustomer || org?.hasStripeCustomer);

  const statusLabel =
    org?.status === "trial"
      ? "Evaluation"
      : org?.status === "active"
        ? cancelAtPeriodEnd
          ? "Active · canceling"
          : hasPaidSub
            ? "Active · $14.99/wk"
            : isComp
              ? "Active · complimentary"
              : "Active client"
        : org?.status === "expired"
          ? "Evaluation ended"
          : org?.status === "suspended"
            ? "Suspended"
            : org?.status || "—";

  const trialLine = formatTrialRemaining(fk?.hoursRemaining);
  const items = visibleChecklist(jobRole);
  const doneCount = items.filter((i) => isChecklistDone(checklist, i.id)).length;

  const membershipBlurb = isPersonal
    ? hasPaidSub
      ? cancelAtPeriodEnd
        ? "Subscription ends at the current period. You keep access until then. You can reverse cancel in Manage billing."
        : "Weekly Hospice Sales Pro is active. Cancel anytime — access continues through the paid period."
      : isComp
        ? "Complimentary access. Contact Nick if you need changes."
        : "Individual plan: $14.99 per week. Subscribe securely (Stripe). Cancel anytime from Manage billing."
    : isCompany
      ? "Team seats are billed under your provider contract (weekly per seat)."
      : "Membership status for this account.";

  const onSubscribe = async () => {
    setCheckoutPending(true);
    try {
      const { url } = await startIndividualCheckout();
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("Cannot open checkout URL");
      stripeOpenedRef.current = true;
      await Linking.openURL(url);
    } catch (e: any) {
      const raw = e?.message || "Checkout unavailable";
      Alert.alert(
        "Checkout unavailable",
        raw.includes("STRIPE") || raw.includes("not configured")
          ? "Billing is not fully configured on the server yet. Contact Nick or try Account on the website."
          : raw.replace(/^\d+:\s*/, "").slice(0, 280),
      );
    } finally {
      setCheckoutPending(false);
    }
  };

  const onManageBilling = async () => {
    setPortalPending(true);
    try {
      const { url } = await openBillingPortal();
      stripeOpenedRef.current = true;
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert(
        "Billing portal unavailable",
        (e?.message || "Try again from the website Account page.").replace(/^\d+:\s*/, "").slice(0, 280),
      );
    } finally {
      setPortalPending(false);
    }
  };

  const openWebAccount = () => {
    void Linking.openURL(`${getWebSiteUrl()}/account`);
  };

  const openWebMembership = () => {
    void Linking.openURL(`${getWebSiteUrl()}/hospice-sales-pro`);
  };

  const saveProfile = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await updateOnboardingMobile({
        jobRole: jobRole || null,
        territoryNote: territoryNote.trim() || null,
        topObjections: topObjections.trim() || null,
      });
      await refresh();
      setMsg("Saved");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad + 24,
        paddingBottom: bottomPad,
        paddingHorizontal: 20,
      }}
    >
      <Text style={[styles.kicker, { color: colors.primary }]}>ACCOUNT</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {user.member.name.split(" ")[0]}
      </Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{user.member.email}</Text>

      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 16 }]}>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Status</Text>
        <Text style={[styles.cardValue, { color: colors.foreground }]}>{statusLabel}</Text>
        {trialLine && org?.status === "trial" ? (
          <Text style={{ color: colors.warning ?? "#fbbf24", marginTop: 6, fontWeight: "600" }}>{trialLine}</Text>
        ) : null}
        <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 14 }]}>
          Organization
        </Text>
        <Text style={[styles.cardValue, { color: colors.foreground }]}>{org?.name || "—"}</Text>
        <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 14 }]}>
          Membership
        </Text>
        <Text
          style={[styles.cardValue, { color: canUseFieldKit ? colors.success : colors.primary }]}
        >
          {canUseFieldKit ? "Unlocked" : "Locked"}
        </Text>
        {canUseFieldKit && (
          <>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 14 }]}>
              Checklist
            </Text>
            <Text style={[styles.cardValue, { color: colors.foreground }]}>
              {doneCount}/{items.length} complete
              {doneCount > 0 ? " · Activated" : " · Not activated yet"}
            </Text>
          </>
        )}
      </View>

      {/* Day Zero — locked personal path (register → subscribe) */}
      {!canUseFieldKit && canCheckout && (
        <View
          style={[
            styles.card,
            {
              borderColor: colors.primary,
              backgroundColor: colors.card,
              marginTop: 12,
              borderWidth: 1.5,
            },
          ]}
          testID="card-day-zero"
        >
          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 }}>
            FINISH SETUP
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "900", marginTop: 6 }}>
            {org?.status === "expired" ? "Subscribe to unlock" : "One step left"}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 6 }}>
            Account ready. Subscribe for $14.99/week to run tools live. Cancel anytime.
          </Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            {[
              "1 · Account — done",
              "2 · Subscribe — unlock all tools",
              "3 · Day Zero — Command Center + one objection",
            ].map((line) => (
              <View key={line} style={[styles.bulletRow, { alignItems: "center" }]}>
                <Feather name="check-circle" size={14} color={colors.primary} />
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600", flex: 1 }}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={onSubscribe}
            disabled={checkoutPending}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary, marginTop: 14, opacity: checkoutPending ? 0.7 : 1 },
            ]}
            testID="button-day-zero-subscribe"
          >
            {checkoutPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                {org?.status === "expired" ? "Resubscribe · Hospice Sales Pro · $14.99/wk" : "Subscribe · $14.99/wk"}
              </Text>
            )}
          </Pressable>
          <Pressable onPress={openWebMembership} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary, textAlign: "center", fontWeight: "700" }}>
              Preview tools on web →
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── Membership & billing ───────────────────────────────────── */}
      <View
        style={[
          styles.card,
          { borderColor: colors.primary, backgroundColor: colors.card, marginTop: 12 },
        ]}
        testID="card-membership-billing"
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Feather name="credit-card" size={18} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 16 }}>
            {canCheckout && !canUseFieldKit ? "Subscribe to unlock" : "Membership & billing"}
          </Text>
        </View>

        {isPersonal && !isPlatform && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 28 }}>
              $14.99
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.mutedForeground }}>
                {" "}
                / week
              </Text>
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
              Individual Membership · auto-renew · cancel anytime
            </Text>
          </View>
        )}

        <Text style={{ color: colors.mutedForeground, lineHeight: 20, fontSize: 14 }}>
          {membershipBlurb}
        </Text>

        {periodEnd && hasPaidSub ? (
          <Text style={{ color: colors.foreground, fontSize: 13, marginTop: 8, fontWeight: "600" }}>
            {cancelAtPeriodEnd
              ? `Access until ${new Date(periodEnd).toLocaleDateString()}`
              : `Renews ${new Date(periodEnd).toLocaleDateString()}`}
          </Text>
        ) : null}

        {billingLoading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Loading billing…</Text>
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 10 }}>
            {canCheckout && (
              <Pressable
                onPress={onSubscribe}
                disabled={checkoutPending}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    marginTop: 0,
                    opacity: checkoutPending ? 0.7 : 1,
                  },
                ]}
                testID="button-subscribe"
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  {checkoutPending ? "Opening checkout…" : "Subscribe · $14.99/week"}
                </Text>
              </Pressable>
            )}
            {canPortal && (
              <Pressable
                onPress={onManageBilling}
                disabled={portalPending}
                style={[
                  styles.outlineBtn,
                  {
                    borderColor: colors.border,
                    opacity: portalPending ? 0.7 : 1,
                  },
                ]}
                testID="button-manage-billing"
              >
                <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                  {portalPending ? "Opening…" : "Manage billing / cancel"}
                </Text>
              </Pressable>
            )}
            {isCompany && (
              <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
                Seat changes and contract billing go through your org admin or Nick. Not self-serve on
                mobile.
              </Text>
            )}
            {isPlatform && (
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                Platform admin accounts are not billed.
              </Text>
            )}
            {isPersonal &&
              !isPlatform &&
              !canCheckout &&
              !canPortal &&
              billing &&
              !billing.configured && (
                <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
                  Self-serve billing is not fully configured on the server yet (Stripe secrets). You can
                  still use Account on the website once secrets are set.
                </Text>
              )}
            <Pressable onPress={openWebAccount} style={{ paddingVertical: 4 }}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                Open website Account →
              </Text>
            </Pressable>
            <Pressable onPress={openWebMembership} style={{ paddingVertical: 2 }}>
              <Text style={{ color: colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
                View membership plans →
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {!canUseFieldKit && (
        <View
          style={[
            styles.card,
            { borderColor: colors.border, backgroundColor: colors.card, marginTop: 12 },
          ]}
          testID="card-membership-locked"
        >
          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 }}>
            {org?.status === "expired" ? "Evaluation ended" : "Membership locked"}
          </Text>
          <Text style={{ color: colors.foreground, fontWeight: "900", fontSize: 15, lineHeight: 21, marginBottom: 10 }}>
            {org?.status === "expired"
              ? "You had access — here's what you were using"
              : "Here's what unlocks at $14.99/week"}
          </Text>

          {[
            { title: "Objection Handler", desc: "Turn a stalled 'not ready' into an education moment that moves referrals" },
            { title: "Weekly Plan Builder", desc: "Priority accounts get time; low-value busyness loses it" },
            { title: "Role-Play Practice", desc: "Muscle memory shows up when the clinic is short-staffed" },
            { title: "Playbook Generator", desc: "Stop winging visits — leave with a specific commitment" },
          ].map((t) => (
            <View key={t.title} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <Feather name="lock" size={13} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>{t.title}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 1 }}>{t.desc}</Text>
              </View>
            </View>
          ))}

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
              {isPersonal
                ? "At $14.99/week, one better conversation pays for the month. Subscribe above, or contact Spartan for team contracts."
                : "Book a short debrief to activate seats under contract."}
            </Text>
            {!canCheckout && (
              <Pressable onPress={() => router.push("/(tabs)/contact")} style={{ marginTop: 10 }}>
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Contact Spartan →</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {canUseFieldKit && (
        <View
          style={[
            styles.card,
            { borderColor: colors.border, backgroundColor: colors.card, marginTop: 12 },
          ]}
          testID="card-your-membership"
        >
          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 }}>
            Your Portal
          </Text>
          <Text style={{ color: colors.foreground, fontWeight: "800", fontSize: 15, marginBottom: 10 }}>
            7 AI tools — all unlocked
          </Text>
          {[
            { icon: "shield" as const, label: "Objections", desc: "Field-ready responses to this week's objections" },
            { icon: "book-open" as const, label: "Playbooks", desc: "Talking points and a clear ask for any visit" },
            { icon: "mail" as const, label: "Email", desc: "Follow-ups and thank-yous that stay professional" },
            { icon: "users" as const, label: "Role-Play", desc: "Simulate hard conversations before you're in the room" },
            { icon: "search" as const, label: "Research", desc: "Territory questions with credible sources" },
            { icon: "calendar" as const, label: "Weekly Plan", desc: "Monday–Friday territory plan with win conditions" },
            { icon: "phone" as const, label: "Cold Call", desc: "Openers and next-step asks for new outreach" },
          ].map((t) => (
            <View key={t.label} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <Feather name={t.icon} size={14} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>{t.label}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 17, marginTop: 1 }}>{t.desc}</Text>
              </View>
            </View>
          ))}
          <Pressable
            onPress={() => router.push("/(tabs)/tools")}
            style={{ marginTop: 6, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 13 }}>Open Portal →</Text>
          </Pressable>
        </View>
      )}

      {canUseFieldKit && (
        <View
          style={[
            styles.card,
            { borderColor: colors.border, backgroundColor: colors.card, marginTop: 12 },
          ]}
        >
          <Text style={{ color: colors.foreground, fontWeight: "800", marginBottom: 10 }}>
            Field profile
          </Text>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Role</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 12 }}>
            {ROLES.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => setJobRole(r.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: jobRole === r.id ? colors.primary : colors.border,
                  backgroundColor: jobRole === r.id ? "rgba(232,41,30,0.12)" : "transparent",
                }}
              >
                <Text
                  style={{
                    color: jobRole === r.id ? colors.primary : colors.foreground,
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Territory notes</Text>
          <TextInput
            value={territoryNote}
            onChangeText={setTerritoryNote}
            placeholder="Market, facilities, focus…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.input,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />

          <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
            Top objections
          </Text>
          <TextInput
            value={topObjections}
            onChangeText={setTopObjections}
            placeholder="not ready, already have provider…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.input,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />

          <Pressable
            onPress={saveProfile}
            disabled={saving}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1, marginTop: 14 },
            ]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
              {saving ? "Saving…" : "Save profile"}
            </Text>
          </Pressable>
          {msg ? (
            <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 13 }}>{msg}</Text>
          ) : null}
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 10 }}>
            No PHI. Coaching context only.
          </Text>
        </View>
      )}

      <Pressable
        onPress={async () => {
          await logout();
          router.replace("/(tabs)");
        }}
        style={[styles.outlineBtn, { borderColor: colors.border, marginTop: 24 }]}
      >
        <Text style={{ color: colors.foreground, fontWeight: "700" }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.8, marginBottom: 10, textTransform: "uppercase" },
  title: { fontSize: 30, fontWeight: "800", marginBottom: 10, letterSpacing: -0.5 },
  body: { fontSize: 15, lineHeight: 23, marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 10,
  },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#e8291e",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryBtnText: { fontWeight: "800", fontSize: 16, letterSpacing: 0.2 },
  outlineBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  cardLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  cardValue: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    minHeight: 76,
    textAlignVertical: "top",
    fontSize: 15,
  },
});
