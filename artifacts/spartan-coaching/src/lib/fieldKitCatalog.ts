/**
 * Re-export shared Field Kit catalog (web + mobile single source of truth).
 */
export {
  type FieldKitCategory,
  type ChecklistId,
  type FieldKitTool,
  type MobileDelivery,
  FIELD_KIT_WHAT,
  FIELD_KIT_WHY,
  FIELD_KIT_HOW,
  FIELD_KIT_TOOLS,
  FIELD_KIT_CATEGORIES,
  getToolByPath,
  getToolById,
  toolsByCategory,
  mobileParityDebt,
} from "@workspace/field-kit-catalog";
