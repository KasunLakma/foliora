import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Icon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";

const SWATCHES = [
  { name: "Paper", className: "bg-background" },
  { name: "Surface", className: "bg-surface" },
  { name: "Velvet", className: "bg-velvet" },
  { name: "Crimson", className: "bg-brand" },
  { name: "Gilt", className: "bg-gilt" },
  { name: "Success", className: "bg-success" },
  { name: "Danger", className: "bg-danger" },
];

export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <Logo />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-semibold">Colour</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {SWATCHES.map((s) => (
            <div key={s.name} className="flex flex-col gap-1.5 text-xs font-semibold">
              <span className={`h-14 rounded-2xl ring-1 ring-border ${s.className}`} />
              {s.name}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-semibold">Type</h2>
        <p className="font-display text-5xl font-semibold tracking-tight">Your work, in the spotlight.</p>
        <p className="font-display text-2xl">සිංහල අකුරු මෙහෙමයි පෙනෙන්නේ</p>
        <p className="text-muted-foreground">Body text in Manrope with Noto Sans Sinhala as the Sinhala fallback.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <span className="bg-velvet flex flex-wrap gap-3 rounded-2xl p-3">
            <Button variant="gilt">Gilt</Button>
            <Button variant="light">Light</Button>
          </span>
          <a href="#" className={buttonStyles({ size: "sm" })}>
            Small link
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-semibold">Fields</h2>
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
        <h2 className="font-display text-2xl font-semibold">Badges and icons</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="success">Active</Badge>
          <Badge tone="warning">Waiting for approval</Badge>
          <Badge tone="danger">Suspended</Badge>
          <Badge tone="brand">New</Badge>
          <Badge tone="gilt">Pro</Badge>
          <span className="ml-2 flex gap-3 text-brand">
            <Icon name="home" /> <Icon name="user" /> <Icon name="image" /> <Icon name="film" /> <Icon name="mail" />
          </span>
        </div>
      </section>
    </div>
  );
}
