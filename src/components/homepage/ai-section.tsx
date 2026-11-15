import { Sparkles } from "lucide-react";

import { AiTags } from "@/components/homepage/ai-tags";
import { Checklist } from "@/components/homepage/checklist";
import {
  AI_CHECKLIST,
  AI_CODE_FILE,
  AI_CODE_LINES,
  AI_TAGS,
  type CodeTokenKind,
  HOME_CONTAINER,
} from "@/components/homepage/content";
import { FadeIn } from "@/components/homepage/fade-in";
import { Badge } from "@/components/ui/badge";

const TOKEN_CLASS: Record<CodeTokenKind, string | undefined> = {
  k: "text-purple-400",
  f: "text-blue-400",
  t: "text-teal-400",
  n: "text-amber-400",
  p: undefined,
};

export function AiSection() {
  return (
    <section className="border-y border-border bg-card/40 py-16 md:py-24">
      <div className={`${HOME_CONTAINER} grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14`}>
        <FadeIn>
          <Badge className="border-type-prompt/40 bg-type-prompt/15 text-violet-200">
            <Sparkles />
            Pro Feature
          </Badge>
          <h2 className="mt-4 mb-3 text-3xl font-bold tracking-tight md:text-4xl">
            Let AI do the organizing
          </h2>
          <p className="mb-6 text-muted-foreground">
            DevStash reads what you save and keeps it tidy, so you can focus on building.
          </p>
          <Checklist items={AI_CHECKLIST} />
        </FadeIn>

        <FadeIn className="min-w-0">
          <figure
            aria-label="Code editor mockup"
            className="overflow-hidden rounded-xl border border-border bg-editor shadow-[0_30px_60px_-30px] shadow-black/80"
          >
            <div className="flex items-center gap-3.5 border-b border-border bg-editor-header px-3.5 py-2.5">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="size-2.75 rounded-full bg-red-500" />
                <span className="size-2.75 rounded-full bg-yellow-500" />
                <span className="size-2.75 rounded-full bg-green-500" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">{AI_CODE_FILE}</span>
            </div>
            <pre className="overflow-x-auto p-4.5 font-mono text-[13px] leading-[1.7] text-zinc-300">
              <code>
                {AI_CODE_LINES.map((line, i) => (
                  <span key={i} className="block min-h-[1.7em]">
                    {line.map(([kind, text], j) => (
                      <span key={j} className={TOKEN_CLASS[kind]}>
                        {text}
                      </span>
                    ))}
                  </span>
                ))}
              </code>
            </pre>
            <figcaption className="border-t border-border px-4.5 pt-3.5 pb-4.5">
              <span className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-type-prompt">
                <Sparkles className="size-3.5" />
                AI Generated Tags
              </span>
              <AiTags tags={AI_TAGS} />
            </figcaption>
          </figure>
        </FadeIn>
      </div>
    </section>
  );
}
