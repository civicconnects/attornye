import { defineCollection, z } from 'astro:content';

const practices = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(), // For SEO meta
    icon: z.string().optional(),
    statutes: z.array(z.string()).optional(), // e.g. ["KRS 189A.010"]
    order: z.number().default(99),
  }),
});

const definitions = defineCollection({
  type: 'content',
  schema: z.object({
    term: z.string(),
    snippet: z.string(), // Short definition for AI
    jurisdiction: z.enum(['Kentucky', 'Federal', 'General']).default('Kentucky'),
    related_practices: z.array(z.string()).optional(), // slugs of practices
    related_statutes: z.array(z.string()).optional(),
  }),
});

const attorney = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    credentials: z.array(z.string()),
    admissions: z.array(z.string()),
    socials: z.object({
      linkedin: z.string().url().optional(),
      avvo: z.string().url().optional(),
    }).optional(),
  }),
});

export const collections = {
  practices,
  definitions,
  attorney,
};
