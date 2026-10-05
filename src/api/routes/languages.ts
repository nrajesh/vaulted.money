import { z } from "zod";
import { builtInLanguageOptions, supportedLanguages } from "@/i18n/resources";
import {
  getCustomLanguages,
  removeCustomLanguage,
  upsertCustomLanguage,
} from "@/i18n/customLanguages";
import {
  getEnabledLanguages,
  saveEnabledLanguages,
} from "@/i18n/languagePreferences";
import {
  badRequest,
  conflict,
  json,
  noContent,
  notFound,
  parse,
} from "../http";
import type { RouteDef } from "../router";

const codeSchema = z.string().trim().toLowerCase().min(1).max(20);
const customSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1),
  translations: z.record(z.string(), z.unknown()),
});

const isBuiltIn = (code: string) =>
  (supportedLanguages as readonly string[]).includes(code);

const overview = () => ({
  current: getEnabledLanguages()[0],
  available: [
    ...builtInLanguageOptions.map(({ code, name, nativeName }) => ({
      code,
      name,
      nativeName,
      builtIn: true,
    })),
    ...getCustomLanguages().map(({ code, name }) => ({
      code,
      name,
      builtIn: false,
    })),
  ],
});

export const languageRoutes: RouteDef[] = [
  {
    method: "GET",
    path: "/languages",
    summary: "List available languages and the active one",
    handler: () => json(overview()),
  },
  {
    method: "PUT",
    path: "/languages/current",
    summary: "Switch the app language",
    handler: ({ body }) => {
      const { code } = parse(z.object({ code: codeSchema }), body);
      if (!overview().available.some((l) => l.code === code)) {
        throw notFound(`Language "${code}"`);
      }
      saveEnabledLanguages([code]);
      return json(overview());
    },
  },
  {
    method: "POST",
    path: "/languages/custom",
    summary: "Add or replace a custom language with its translations",
    handler: ({ body }) => {
      const input = parse(customSchema, body);
      if (isBuiltIn(input.code)) {
        throw conflict(
          `"${input.code}" is a built-in language and cannot be replaced`,
        );
      }
      upsertCustomLanguage(input);
      return json(overview(), 201);
    },
  },
  {
    method: "DELETE",
    path: "/languages/custom/:code",
    summary: "Remove a custom language",
    handler: ({ params }) => {
      if (isBuiltIn(params.code.toLowerCase())) {
        throw badRequest("Built-in languages cannot be removed");
      }
      if (!removeCustomLanguage(params.code)) {
        throw notFound(`Custom language "${params.code}"`);
      }
      return noContent();
    },
  },
];
