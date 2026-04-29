import { snippetSchema } from "@/validiation/snippet-form-validiation";
import * as z from "zod";

export type SnippetFormValues = z.infer<typeof snippetSchema>;

// Snippet version types
export interface SnippetVersion {
  id: string;
  snippet_id: string;
  content: {
    title: string;
    description: string;
    code: string;
    language: string;
    tags: string[];
  };
  editor_id: string | null;
  version_number: number;
  created_at: string;
}

// Version history response
export interface VersionHistory {
  versions: SnippetVersion[];
  total: number;
  page: number;
  pageSize: number;
}
