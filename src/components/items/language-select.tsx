"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CODE_LANGUAGE_OPTIONS } from "@/lib/code-language";

interface LanguageSelectProps {
  id?: string;
  /** Monaco language id from `CODE_LANGUAGE_OPTIONS` */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Dropdown of the supported code languages; the selection drives the code editor's highlighting. */
export function LanguageSelect({ id, value, onChange, disabled }: LanguageSelectProps) {
  return (
    <Select
      items={CODE_LANGUAGE_OPTIONS}
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger id={id} className="w-full sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CODE_LANGUAGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
