import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";

const SWATCHES = [
  { name: "Stage", className: "bg-background" },
  { name: "Surface", className: "bg-surface" },
  { name: "Surface 2", className: "bg-surface-2" },
  { name: "Ember", className: "bg-brand" },
  { name: "Success", className: "bg-success" },
  { name: "Warning", className: "bg-warning" },
  { name: "Danger", className: "bg-danger" },
];

export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="bg-stage min-h-dvh">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
        <Logo />

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-semibold tracking-[0.12em] uppercase">Colour</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
            {SWATCHES.map((s) => (
              <div key={s.name} className="flex flex-col gap-1.5 text-xs font-semibold">
                <span className={`h-14 rounded-2xl ring-1 ring-white/15 ${s.className}`} />
                {s.name}
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-semibold tracking-[0.12em] uppercase">Type</h2>
          <p className="font-display text-4xl leading-tight font-semibold tracking-[0.1em] uppercase">
            Your work, in the spotlight
          </p>
          <p className="font-display text-2xl">සිංහල අකුරු මෙහෙමයි පෙනෙන්නේ</p>
          <p className="text-muted-foreground">
            Body text in Manrope, titles in Cinzel, with Noto Sans and Serif Sinhala as the Sinhala fallbacks.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-semibold tracking-[0.12em] uppercase">Buttons</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="light">Light</Button>
            <Button variant="ghost">Ghost</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <a href="#" className={buttonStyles({ size: "sm" })}>
              Small link
            </a>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-semibold tracking-[0.12em] uppercase">Fields</h2>
          <Card className="flex flex-col gap-4">
            <Field label="Stage name" hint="Shown on your portfolio.">
              <Input placeholder="How you want to be known" />
            </Field>
            <Field label="Email" error="Enter a valid email address.">
              <Input defaultValue="not-an-email" />
            </Field>
            <Field label="Account type">
              <Select defaultValue="INDIVIDUAL">
                <option value="INDIVIDUAL">Individual</option>
                <option value="AGENCY">Agency</option>
              </Select>
            </Field>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-semibold tracking-[0.12em] uppercase">Badges and icons</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="success">Active</Badge>
            <Badge tone="warning">Waiting for approval</Badge>
            <Badge tone="danger">Suspended</Badge>
            <Badge tone="brand">Individual</Badge>
            <span className="ml-2 flex gap-3 text-brand">
              <Icon name="home" /> <Icon name="user" /> <Icon name="image" /> <Icon name="film" />{" "}
              <Icon name="mail" /> <Icon name="eye" />
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
