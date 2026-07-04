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
  { emoji: "🌅", keywords: ["acordar", "manha", "manhã", "rotina da manha"] },
  { emoji: "🧘", keywords: ["calma", "respirar", "meditar", "terapia"] },
  { emoji: "🎬", keywords: ["filme", "cinema", "serie", "série"] },
  { emoji: "🎮", keywords: ["game", "videogame", "jogo", "jogar"] },
  { emoji: "🍦", keywords: ["sorvete", "doce", "chocolate", "sobremesa"] },
  { emoji: "🍕", keywords: ["pizza", "lanche especial", "hamburguer"] },
  { emoji: "🏞️", keywords: ["passeio", "parque", "viagem", "fim de semana"] },
  { emoji: "🎁", keywords: ["presente", "premio", "prêmio", "recompensa"] },
  { emoji: "🧩", keywords: ["quebra cabeca", "quebra-cabeca", "puzzle"] },
  { emoji: "📝", keywords: ["matematica", "matemática", "exercicio", "exercício", "missao", "missão"] },
  { emoji: "🎨", keywords: ["desenhar", "pintar", "arte", "colorir"] },
  { emoji: "⚽", keywords: ["bola", "futebol", "esporte"] },
  { emoji: "🎵", keywords: ["musica", "música", "cantar", "dancar", "dançar"] },
  { emoji: "😤", keywords: ["brigar", "brigou", "bateu", "bater", "raiva"] },
  { emoji: "🤥", keywords: ["mentir", "mentira"] },
  { emoji: "🗣️", keywords: ["gritou", "gritar", "responder", "xingou"] },
  { emoji: "🧊", keywords: ["birra", "teimosia", "teimoso"] },
  { emoji: "🎯", keywords: ["meta", "objetivo", "cofrinho", "economizar"] },
  { emoji: "✨", keywords: ["bonus", "bônus", "dobro", "evento", "especial"] },
  { emoji: "💧", keywords: ["regar", "regador", "agua da planta"] },
  { emoji: "🌰", keywords: ["comida da planta", "comida", "adubo", "nutrir"] },
  { emoji: "🌵", keywords: ["cacto", "especie", "espécie", "planta"] },
  { emoji: "🏡", keywords: ["casa", "cenario", "cenário", "jardim"] },
  { emoji: "🫧", keywords: ["bolha", "bolhas", "efeito"] },
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
