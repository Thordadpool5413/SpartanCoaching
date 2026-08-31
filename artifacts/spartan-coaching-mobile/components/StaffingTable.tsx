import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { BranchResults, StaffingRole } from "@workspace/branch-engine/engine";
import { useColors } from "@/hooks/useColors";

export function fmtK(v: number): string {
  const sign = v < 0 ? "-" : "";
  const rounded = Math.abs(Math.round(v));
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + "$" + grouped;
}

export function StaffingTable({ results, staffingRoles, onUpdate, onReset, onAdd, onRemove }: { results: BranchResults; staffingRoles?: StaffingRole[]; onUpdate?: (index: number, field: "minFte" | "salary", value: string) => void; onReset?: () => void; onAdd?: () => void; onRemove?: (index: number) => void }) {
  const colors = useColors();
  const rows = results.tables.requiredStaffing;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="table-staffing"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>
        Required Staffing at ADC {results.inputs.targetADC}
      </Text>
      {onUpdate ? <><Text style={[styles.guidance, { color: colors.mutedForeground }]}>Edit FTE and salary. Every result on this screen recalculates immediately.</Text><View style={styles.actions}><Pressable accessibilityRole="button" onPress={onReset} style={[styles.action, { borderColor: colors.borderStrong }]}><Text style={[styles.actionText, { color: colors.foreground }]}>Reset baseline</Text></Pressable><Pressable accessibilityRole="button" onPress={onAdd} style={[styles.action, { borderColor: colors.borderStrong }]}><Feather name="plus" size={14} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Add role</Text></Pressable></View></> : null}
      {!onUpdate ? (
        <View
          style={[styles.headerRow, { borderBottomColor: colors.border }]}
        >
        <Text style={[styles.headerCell, styles.roleCol, { color: colors.mutedForeground }]}>
          Role
        </Text>
        <Text style={[styles.headerCell, styles.numCol, { color: colors.mutedForeground }]}>
          FTE
        </Text>
        <Text style={[styles.headerCell, styles.moneyCol, { color: colors.mutedForeground }]}>
          Salary
        </Text>
        <Text style={[styles.headerCell, styles.moneyCol, { color: colors.mutedForeground }]}>
          Annual Cost
        </Text>
        </View>
      ) : null}
      {rows.map((r, i) => (
        <View
          key={r.role}
          style={[onUpdate ? styles.editableRow : styles.row, { backgroundColor: i % 2 === 0 ? colors.muted : colors.background, borderColor: colors.border }]}
          testID={`row-staff-${i}`}
        >
          <Text
            style={[styles.cell, onUpdate ? styles.editableRole : styles.roleCol, styles.bold, { color: colors.foreground }]}
            testID={`text-staff-role-${i}`}
          >
            {r.role}
          </Text>
          {onUpdate ? <View style={styles.editFields}><View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>FTE</Text><TextInput accessibilityLabel={`${r.role} FTE`} keyboardType="decimal-pad" value={String(r.fte)} onChangeText={(value) => onUpdate(i, "minFte", value)} style={[styles.input, { color: colors.foreground, borderColor: colors.borderStrong }]} testID={`input-staff-fte-${i}`} /></View><View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Annual salary</Text><TextInput accessibilityLabel={`${r.role} annual salary`} keyboardType="number-pad" value={String(r.salary)} onChangeText={(value) => onUpdate(i, "salary", value)} style={[styles.input, { color: colors.foreground, borderColor: colors.borderStrong }]} testID={`input-staff-salary-${i}`} /></View></View> : <><Text style={[styles.cell, styles.numCol, styles.bold, { color: colors.foreground }]} testID={`text-staff-fte-${i}`}>{String(r.fte)}</Text><Text style={[styles.cell, styles.moneyCol, { color: colors.mutedForeground }]} testID={`text-staff-salary-${i}`}>{fmtK(r.salary)}</Text></>}
          <View style={onUpdate ? styles.editableCost : styles.costCell}>
            {onUpdate ? <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Annual cost</Text> : null}
            <Text style={[styles.cell, styles.bold, { color: colors.foreground }]} testID={`text-staff-cost-${i}`}>{fmtK(r.annualCost)}</Text>
            {staffingRoles?.[i]?.role.startsWith("Custom role") && onRemove ? <Pressable accessibilityLabel={`Remove ${r.role}`} onPress={() => onRemove(i)}><Feather name="trash-2" size={14} color={colors.primary} /></Pressable> : null}
          </View>
        </View>
      ))}
      <View style={[styles.row, styles.totalRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.cell, styles.roleCol, styles.bold, { color: colors.foreground }]}>
          Total FTE {rows.reduce((sum, row) => sum + row.fte, 0).toFixed(1)}
        </Text>
        <Text
          style={[styles.cell, styles.moneyCol, styles.bold, { color: colors.foreground }]}
          testID="text-total-payroll"
        >
          {results.display.totalPayroll}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  guidance: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  action: { minHeight: 38, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 11, fontWeight: "700" },
  input: { minHeight: 38, borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, fontSize: 11, textAlign: "right" },
  editableRow: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  editableRole: { fontSize: 14, marginBottom: 10 },
  editFields: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 5 },
  fieldLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  editableCost: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  costCell: { flex: 1.3, minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 6,
    marginBottom: 2,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 10,
    borderRadius: 0,
  },
  cell: {
    fontSize: 12,
  },
  bold: {
    fontWeight: "700",
  },
  roleCol: {
    flex: 2.2,
  },
  numCol: {
    flex: 0.7,
    textAlign: "right",
  },
  moneyCol: {
    flex: 1.3,
    textAlign: "right",
  },
});
