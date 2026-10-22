/** format("Step {n}", { n: 2 }) -> "Step 2" */
export function format(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}
