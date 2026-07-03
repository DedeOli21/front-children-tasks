// As fontes padrão do jsPDF (Helvetica/Times/Courier) só suportam a
// codificação WinAnsi (Latin-1) — acentos do português passam bem, mas
// emoji (⭐💜🎁🛡️...) viram bytes aleatórios ("Ø<ß9", "+P") no PDF.
// Esta função remove emoji/pictogramas antes de qualquer texto ir para o
// jsPDF, mantendo o restante da frase intacto.
export function sanitizeForPdf(text: string | null | undefined): string {
  if (!text) return ""
  return text
    // Emoji em plano suplementar (a grande maioria: 🎁💧🌰🫧✨🥀🍰🎬 etc.)
    .replace(/[\u{10000}-\u{10FFFF}]/gu, "")
    // Setas (U+2190–U+21FF)
    .replace(/[←-⇿]/g, "")
    // Símbolos diversos → dingbats (U+2300–U+27BF): ✨ ⚠ ☀ ❄ etc.
    .replace(/[⌀-➿]/g, "")
    // Símbolos e setas diversos (U+2B00–U+2BFF): ⭐ ⬆ etc.
    .replace(/[⬀-⯿]/g, "")
    // Seletor de variação (U+FE0F) e zero-width joiner (U+200D) de emoji compostos
    .replace(/[️‍]/g, "")
    // Espaços duplicados que sobraram no lugar do emoji removido
    .replace(/[ \t]+/g, " ")
    .trim()
}
