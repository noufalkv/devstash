"use client";

import { useId } from "react";

import { useEditorPreferences } from "@/components/settings/editor-preferences-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEME_LABELS,
  EDITOR_THEMES,
  type EditorPreferences,
} from "@/lib/editor-preferences";

interface Option {
  value: string;
  label: string;
}

const FONT_SIZE_OPTIONS: Option[] = EDITOR_FONT_SIZES.map((size) => ({
  value: String(size),
  label: `${size}px`,
}));
const TAB_SIZE_OPTIONS: Option[] = EDITOR_TAB_SIZES.map((size) => ({
  value: String(size),
  label: `${size} spaces`,
}));
const THEME_OPTIONS: Option[] = EDITOR_THEMES.map((theme) => ({
  value: theme,
  label: EDITOR_THEME_LABELS[theme],
}));

function SettingRow({
  labelId,
  title,
  description,
  children,
}: {
  labelId: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p id={labelId} className="text-sm font-medium">
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function OptionSelect({
  labelId,
  value,
  options,
  onChange,
}: {
  labelId: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null && next !== value) onChange(next);
      }}
    >
      <SelectTrigger aria-labelledby={labelId} className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function EditorPreferencesForm() {
  const { preferences, updatePreferences } = useEditorPreferences();
  const id = useId();
  const labelIds = {
    fontSize: `${id}-font-size`,
    tabSize: `${id}-tab-size`,
    theme: `${id}-theme`,
    wordWrap: `${id}-word-wrap`,
    minimap: `${id}-minimap`,
  } satisfies Record<keyof EditorPreferences, string>;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Editor</h2>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <SettingRow labelId={labelIds.fontSize} title="Font size" description="Text size in the code editor.">
            <OptionSelect
              labelId={labelIds.fontSize}
              value={String(preferences.fontSize)}
              options={FONT_SIZE_OPTIONS}
              onChange={(value) =>
                updatePreferences({ fontSize: Number(value) as EditorPreferences["fontSize"] })
              }
            />
          </SettingRow>
          <SettingRow labelId={labelIds.tabSize} title="Tab size" description="Spaces inserted for each tab.">
            <OptionSelect
              labelId={labelIds.tabSize}
              value={String(preferences.tabSize)}
              options={TAB_SIZE_OPTIONS}
              onChange={(value) =>
                updatePreferences({ tabSize: Number(value) as EditorPreferences["tabSize"] })
              }
            />
          </SettingRow>
          <SettingRow labelId={labelIds.theme} title="Theme" description="Color theme for the code editor.">
            <OptionSelect
              labelId={labelIds.theme}
              value={preferences.theme}
              options={THEME_OPTIONS}
              onChange={(value) => updatePreferences({ theme: value as EditorPreferences["theme"] })}
            />
          </SettingRow>
          <SettingRow
            labelId={labelIds.wordWrap}
            title="Word wrap"
            description="Wrap long lines instead of scrolling sideways."
          >
            <Switch
              aria-labelledby={labelIds.wordWrap}
              checked={preferences.wordWrap}
              onCheckedChange={(checked) => updatePreferences({ wordWrap: checked })}
            />
          </SettingRow>
          <SettingRow
            labelId={labelIds.minimap}
            title="Minimap"
            description="Show a code overview on the right side of the editor."
          >
            <Switch
              aria-labelledby={labelIds.minimap}
              checked={preferences.minimap}
              onCheckedChange={(checked) => updatePreferences({ minimap: checked })}
            />
          </SettingRow>
        </CardContent>
      </Card>
    </section>
  );
}
