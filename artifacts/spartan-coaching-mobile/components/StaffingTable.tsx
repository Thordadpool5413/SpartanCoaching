import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { BranchResults } from "@workspace/branch-engine/engine";
import { useColors } from "@/hooks/useColors";

export function fmtK(v: number): string {
  const sign = v < 0 ? "-" : "";
  const rounded = Math.abs(Math.round(v));
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + "$" + grouped;
}

export function StaffingTable({ results }: { results: BranchResults }) {
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
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
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
      {rows.map((r, i) => (
        <View
          key={r.role}
          style={[styles.row, i % 2 === 0 && { backgroundColor: colors.muted }]}
          testID={`row-staff-${i}`}
        >
          <Text
            style={[styles.cell, styles.roleCol, { color: colors.foreground }]}
            testID={`text-staff-role-${i}`}
          >
            {r.role}
          </Text>
          <Text
            style={[styles.cell, styles.numCol, styles.bold, { color: colors.foreground }]}
            testID={`text-staff-fte-${i}`}
          >
            {String(r.fte)}
          </Text>
          <Text
            style={[styles.cell, styles.moneyCol, { color: colors.mutedForeground }]}
            testID={`text-staff-salary-${i}`}
          >
            {fmtK(r.salary)}
          </Text>
          <Text
            style={[styles.cell, styles.moneyCol, styles.bold, { color: colors.foreground }]}
            testID={`text-staff-cost-${i}`}
          >
            {fmtK(r.annualCost)}
          </Text>
        </View>
      ))}
      <View style={[styles.row, styles.totalRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.cell, styles.roleCol, styles.bold, { color: colors.foreground }]}>
          Total Payroll
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
