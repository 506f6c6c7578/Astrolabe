import { type NavigationLink, site } from "@/data/site";
import type { IsoDate } from "@/lib/date/zoned";

export type RichText = string | readonly (string | NavigationLink)[];

export interface LegalList {
    items: readonly string[];
}

export type LegalBlock = RichText | LegalList;

interface LegalSection {
    title: string;
    blocks: readonly LegalBlock[];
}

export interface LegalDocument {
    link: NavigationLink;
    description: string;
    updatedAt: IsoDate;
    sections: readonly LegalSection[];
}

export const contactFormLink: NavigationLink = { label: "formulaire de contact", href: site.author.contactUrl };
