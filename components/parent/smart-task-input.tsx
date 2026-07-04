"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { suggestTaskEmoji } from "@/lib/task-emoji";
import { cn } from "@/lib/utils";

interface SmartTaskInputProps {
  title: string;
  emoji: string;
  onTitleChange: (title: string) => void;
  onEmojiChange: (emoji: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  suggestionClassName?: string;
}

export function SmartTaskInput({
  title,
  emoji,
  onTitleChange,
  onEmojiChange,
  placeholder = "Nome da tarefa",
  disabled,
  required,
  className,
  inputClassName,
  suggestionClassName,
}: SmartTaskInputProps) {
  const suggestion = suggestTaskEmoji(title);
  const showSuggestion = suggestion && suggestion !== emoji;

  return (
    <div className={cn("relative", className)}>
      <input
        type="text"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          "h-12 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 pr-24 text-sm font-bold text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-400 disabled:opacity-60",
          inputClassName,
        )}
      />
      <AnimatePresence>
        {showSuggestion && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onEmojiChange(suggestion)}
            className={cn(
              "absolute right-2 top-1/2 flex h-8 -translate-y-1/2 items-center gap-1 rounded-full bg-sky-100 px-2 text-sm font-black text-sky-700 shadow-sm transition-colors hover:bg-sky-200",
              suggestionClassName,
            )}
            aria-label={`Usar emoji ${suggestion}`}
            title={`Usar ${suggestion}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-lg leading-none">{suggestion}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
