"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { listTags } from "@/app/actions/tags";

export function TagInput({
  value,
  onChange,
  placeholder = "Adicionar tag e pressionar Enter",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    listTags().then((tags) => {
      if (active) setAllTags(tags);
    });
    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    const selected = new Set(value.map((v) => v.toLowerCase()));
    return allTags
      .filter((t) => !selected.has(t.toLowerCase()))
      .filter((t) => (q ? t.toLowerCase().includes(q) : true))
      .slice(0, 6);
  }, [allTags, input, value]);

  function add(raw: string) {
    const name = raw.trim().replace(/\s+/g, " ").toLowerCase();
    if (!name) return;
    if (!value.some((v) => v.toLowerCase() === name)) {
      onChange([...value, name]);
    }
    setInput("");
  }

  function remove(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  return (
    <div className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/25 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <Tag className="size-3.5 text-ink-3" aria-hidden="true" />
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-medium text-forest dark:bg-surface-2 dark:text-ink-2"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remover tag ${tag}`}
              className="text-forest/60 hover:text-forest dark:text-ink-3 dark:hover:text-ink cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                remove(tag);
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(input);
            } else if (e.key === "Backspace" && !input && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-28 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-ink-3"
          aria-label="Tags"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-pop">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-2 cursor-pointer",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
            >
              <Tag className="size-3.5 text-ink-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
