import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalHeader, LegalShell } from "@/components/legal-shell";
import { getLegalDocument, legalDocuments } from "@/lib/legal-documents";

export function generateStaticParams() { return legalDocuments.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const document = getLegalDocument((await params).slug);
  return document ? { title: document.shortTitle, description: document.summary } : {};
}

export default async function LegalDocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const document = getLegalDocument((await params).slug);
  if (!document) notFound();
  return <LegalShell active={document.slug}><LegalHeader eyebrow="Nexora Rank policy" title={document.title} summary={document.summary} /><article className="legal-document">{document.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}</article></LegalShell>;
}
