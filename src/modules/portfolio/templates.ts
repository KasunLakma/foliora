/** Look-and-feel choices. More are added here (and in src/templates) later. */
export const TEMPLATE_KEYS = ["cinematic"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
