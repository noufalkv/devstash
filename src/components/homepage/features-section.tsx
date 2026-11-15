import { FEATURES, HOME_CONTAINER, TYPE_ACCENT } from "@/components/homepage/content";
import { FadeIn } from "@/components/homepage/fade-in";
import { SectionHeading } from "@/components/homepage/section-heading";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className={HOME_CONTAINER}>
        <SectionHeading
          title="Everything in one place"
          subtitle="Every kind of developer knowledge gets a home, a color and instant search."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, description, icon: Icon, type }) => (
            <FadeIn key={title}>
              <Card
                className={cn(
                  "h-full gap-0 p-7 ring-border transition duration-200 hover:-translate-y-0.75 hover:shadow-[0_12px_30px_-12px] hover:shadow-(--c)/35 hover:ring-(--c)/45 motion-reduce:hover:translate-y-0",
                  TYPE_ACCENT[type],
                )}
              >
                <div className="mb-4.5 grid size-11 place-items-center rounded-lg bg-(--c)/15 text-(--c)">
                  <Icon className="size-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-[15px] text-muted-foreground">{description}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
