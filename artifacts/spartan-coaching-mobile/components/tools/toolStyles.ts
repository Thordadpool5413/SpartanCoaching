import { StyleSheet } from "react-native";

export const toolStyles = StyleSheet.create({
  label: { fontSize: 15, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 50,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 110,
  },
  errorText: { fontSize: 14, marginTop: 8 },
  resultCard: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  resultText: { fontSize: 15, lineHeight: 23 },
  emailTypePicker: { flexDirection: "row", gap: 8 },
  emailTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  emailTypeBtnText: { fontSize: 13 },
  offlineBanner: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
});
