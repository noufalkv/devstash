import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/homepage/button-link";
import { ChaosPanel } from "@/components/homepage/chaos-panel";
import { HOME_CONTAINER } from "@/components/homepage/content";
import { DashboardPreview } from "@/components/homepage/dashboard-preview";
import { FadeIn } from "@/components/homepage/fade-in";

export function Hero() {
  return (
    <section className="bg-[radial-gradient(600px_300px_at_50%_0%,color-mix(in_srgb,var(--color-type-prompt)_18%,transparent),transparent)] pt-28 pb-16 md:pt-35 md:pb-24">
      <div className={HOME_CONTAINER}>
        <FadeIn immediate className="mx-auto mb-16 max-w-3xl text-center">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Stop Losing Your
            <br />
            <span className="bg-linear-to-r from-type-snippet via-type-prompt to-type-image bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="mx-auto mt-5 mb-8 max-w-2xl text-base text-muted-foreground md:text-lg">
            Your snippets live in VS Code, your prompts in chat histories, your commands in bash
            history and your links in a hundred browser tabs. DevStash brings them into one fast,
            searchable hub.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/register" size="lg" className="h-11 px-5 text-[15px]">
              Get Started Free
            </ButtonLink>
            <ButtonLink href="#features" variant="outline" size="lg" className="h-11 px-5 text-[15px]">
              See Features
            </ButtonLink>
          </div>
        </FadeIn>

        <FadeIn
          immediate
          className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
        >
          <ChaosPanel />
          <div
            aria-hidden="true"
            className="grid size-14 animate-arrow-pulse place-items-center justify-self-center rounded-full bg-linear-135 from-type-snippet to-type-prompt text-white max-md:rotate-90 motion-reduce:animate-none"
          >
            <ArrowRight className="size-7" />
          </div>
          <DashboardPreview />
        </FadeIn>
      </div>
    </section>
  );
}
