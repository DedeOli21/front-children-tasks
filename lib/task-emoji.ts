export type EmojiSuggestion = {
  emoji: string;
  keywords: string[];
};

export const TASK_EMOJI_DICTIONARY: EmojiSuggestion[] = [
  {
    emoji: "🦷",
    keywords: ["dente", "dentes", "escovar", "escova", "fio dental"],
  },
  { emoji: "🛏️", keywords: ["cama", "arrumar cama", "arrumar", "quarto"] },
  {
    emoji: "📚",
    keywords: [
      "licao",
      "lição",
      "estudar",
      "estudo",
      "escola",
      "dever",
      "tarefa de casa",
    ],
  },
  { emoji: "🚿", keywords: ["banho", "banhar", "chuveiro"] },
  {
    emoji: "🍽️",
    keywords: [
      "comer",
      "almoco",
      "almoço",
      "jantar",
      "cafe",
      "café",
      "lanche",
      "prato",
    ],
  },
  { emoji: "🎒", keywords: ["mochila", "material", "uniforme"] },
  { emoji: "🧸", keywords: ["brinquedo", "brinquedos", "guardar brinquedos"] },
  { emoji: "👕", keywords: ["roupa", "roupas", "vestir", "pijama"] },
  { emoji: "💧", keywords: ["agua", "água", "beber agua", "garrafa"] },
  { emoji: "🍎", keywords: ["fruta", "frutas", "maca", "maçã", "banana"] },
  { emoji: "📖", keywords: ["ler", "leitura", "livro"] },
  { emoji: "🧼", keywords: ["lavar", "maos", "mãos", "sabonete"] },
  {
    emoji: "🧹",
    keywords: ["limpar", "varrer", "organizar", "bagunca", "bagunça"],
  },
  { emoji: "😴", keywords: ["dormir", "sono", "soneca"] },
  { emoji: "🧘", keywords: ["calma", "respirar", "meditar", "terapia"] },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function suggestTaskEmoji(title: string): string | null {
  const normalizedTitle = normalize(title);
  if (!normalizedTitle) return null;

  for (const suggestion of TASK_EMOJI_DICTIONARY) {
    if (
      suggestion.keywords.some((keyword) =>
        normalizedTitle.includes(normalize(keyword)),
      )
    ) {
      return suggestion.emoji;
    }
  }

  return null;
}
