import { describe, expect, it } from "vitest"
import { closetCategoryOf } from "@/components/pet/pet-closet"
import type { PetInventoryItem } from "@/lib/api"

function inventoryItem(
  overrides: Partial<PetInventoryItem>,
): PetInventoryItem {
  return {
    name: "Item",
    emoji: "✨",
    type: "hat",
    quantity: 1,
    equipped: false,
    ...overrides,
  }
}

describe("PetCloset category grouping", () => {
  it("groups mascot species and legacy skins together", () => {
    expect(closetCategoryOf(inventoryItem({ type: "species" }))).toBe(
      "species",
    )
    expect(closetCategoryOf(inventoryItem({ type: "skin" }))).toBe("species")
  })

  it("groups backgrounds and effects by type or attachment slot", () => {
    expect(closetCategoryOf(inventoryItem({ type: "background" }))).toBe(
      "background",
    )
    expect(
      closetCategoryOf(inventoryItem({ attachmentSlot: "background" })),
    ).toBe("background")

    expect(closetCategoryOf(inventoryItem({ type: "effect" }))).toBe("effect")
    expect(closetCategoryOf(inventoryItem({ attachmentSlot: "effect" }))).toBe(
      "effect",
    )
  })

  it("puts wearable cosmetic items in the visual category", () => {
    expect(closetCategoryOf(inventoryItem({ type: "hat" }))).toBe("style")
    expect(closetCategoryOf(inventoryItem({ type: "glasses" }))).toBe("style")
    expect(closetCategoryOf(inventoryItem({ type: "outfit" }))).toBe("style")
  })
})
