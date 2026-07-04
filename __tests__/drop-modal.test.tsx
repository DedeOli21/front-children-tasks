import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { DropModal, inferDropItemType } from "@/components/pet/drop-modal"

describe("DropModal", () => {
  it("infers presentation type from the dropped item metadata", () => {
    expect(inferDropItemType({ key: "drop_water_magic" })).toBe("water")
    expect(inferDropItemType({ name: "Agua Magica" })).toBe("water")
    expect(inferDropItemType({ key: "drop_freeze_potion" })).toBe("freeze")
    expect(inferDropItemType({ attachmentKey: "food_bone" })).toBe("food")
    expect(inferDropItemType({ name: "Gatinho Laranja" })).toBe("cosmetic")
  })

  it("shows the equip action for equipable drops", () => {
    const onEquip = vi.fn()
    const onClose = vi.fn()

    render(
      <DropModal
        open
        itemType="cosmetic"
        itemName="Gatinho Laranja"
        previewEmoji="🐱"
        canEquip
        onEquip={onEquip}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /equipar agora/i }))

    expect(onEquip).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })
})
