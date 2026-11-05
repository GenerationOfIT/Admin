import { z } from "zod";
import { cardSchema, required, slugSchema, text } from "@/lib/schema";

export const newServiceSchema = z.object({
  title: required(120),
  slug: slugSchema,
  card_description: required(300),
});
export type NewServiceInput = z.infer<typeof newServiceSchema>;

const cards = z.array(cardSchema).max(50);

export const serviceSchema = newServiceSchema.extend({
  introduction: text(2000),
  scope_title: required(120),
  use_cases_title: required(120),
  deliverables_title: required(120),
  seo_title: text(120),
  seo_description: text(320),
  is_published: z.boolean(),
  scope: cards,
  use_cases: cards,
  deliverables: cards,
});
export type ServiceInput = z.infer<typeof serviceSchema>;

/** The three card lists on a service page, and where each is stored. */
export const cardLists = [
  {
    key: "scope",
    table: "service_scope_items",
    titleKey: "scope_title",
    label: "Scope",
  },
  {
    key: "use_cases",
    table: "service_use_cases",
    titleKey: "use_cases_title",
    label: "Use cases",
  },
  {
    key: "deliverables",
    table: "service_deliverables",
    titleKey: "deliverables_title",
    label: "Deliverables",
  },
] as const;
