import { ButtonLink } from "@/components/homepage/button-link";
import { HOME_CONTAINER } from "@/components/homepage/content";
import { FadeIn } from "@/components/homepage/fade-in";

export function CtaSection() {
  return (
    <section className="py-16 md:py-24">
      <div className={HOME_CONTAINER}>
        <FadeIn className="rounded-[20px] border border-border bg-card bg-[radial-gradient(500px_200px_at_50%_0%,color-mix(in_srgb,var(--color-type-snippet)_22%,transparent),transparent)] px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to Organize Your Knowledge?</h2>
          <p className="mt-3 mb-7 text-muted-foreground">
            Join developers who stopped losing snippets, prompts and commands.
          </p>
          <ButtonLink href="/register" size="lg" className="h-11 px-5 text-[15px]">
            Get Started Free
          </ButtonLink>
        </FadeIn>
      </div>
    </section>
  );
}
