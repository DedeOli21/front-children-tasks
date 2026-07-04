import { describe, expect, it } from "vitest";
import { suggestTaskEmoji } from "@/lib/task-emoji";

describe("suggestTaskEmoji", () => {
  it("sugere emojis por palavras comuns de rotina infantil", () => {
    expect(suggestTaskEmoji("escovar os dentes")).toBe("🦷");
    expect(suggestTaskEmoji("arrumar a cama")).toBe("🛏️");
    expect(suggestTaskEmoji("lição da escola")).toBe("📚");
    expect(suggestTaskEmoji("tomar banho")).toBe("🚿");
    expect(suggestTaskEmoji("comer almoço")).toBe("🍽️");
  });

  it("ignora acentos e caixa", () => {
    expect(suggestTaskEmoji("BEBER ÁGUA")).toBe("💧");
  });
});
