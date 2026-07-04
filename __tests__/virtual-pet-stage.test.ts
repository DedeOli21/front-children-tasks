import { describe, expect, it } from "vitest"
import {
  resolvePetEffect,
  resolvePetImage,
  resolvePetSpecies,
} from "@/components/pet/virtual-pet-stage"

describe("VirtualPetStage image resolver", () => {
  it("uses dog assets by default", () => {
    expect(resolvePetSpecies(null)).toBe("dog")
    expect(
      resolvePetImage({
        streak: 3,
        isPremium: false,
        isCelebrating: false,
        isSick: false,
        species: null,
      }),
    ).toBe("/assets/idle_happy.jpg")
  })

  it("uses cat assets when the equipped species is a cat", () => {
    expect(resolvePetSpecies("cat_orange")).toBe("cat")
    expect(
      resolvePetImage({
        streak: 5,
        isPremium: true,
        isCelebrating: false,
        isSick: false,
        species: "gato_laranja",
      }),
    ).toBe("/assets/cat_equipped_premium.jpg")
  })

  it("prioritizes sick and celebration states", () => {
    expect(
      resolvePetImage({
        streak: 10,
        isPremium: true,
        isCelebrating: true,
        isSick: true,
        species: "dog",
      }),
    ).toBe("/assets/dog_sick.jpg")

    expect(
      resolvePetImage({
        streak: 10,
        isPremium: true,
        isCelebrating: true,
        isSick: false,
        species: "cat",
      }),
    ).toBe("/assets/cat_celebration.jpg")
  })

  it("resolves equipped visual effects from attachment keys", () => {
    expect(resolvePetEffect("water_magic")?.image).toBe(
      "/assets/water_drop.jpg",
    )
    expect(resolvePetEffect("food_bone")?.image).toBe("/assets/food_bone.jpg")
    expect(resolvePetEffect("freeze_potion")?.image).toBe(
      "/assets/potion_freeze.jpg",
    )
    expect(resolvePetEffect("unknown_effect")).toBeNull()
  })
})
