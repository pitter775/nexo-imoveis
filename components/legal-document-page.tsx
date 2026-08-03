import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { SiteFooter } from '@/components/site-footer';
import type { LegalDocument } from '@/lib/legal-content';

type LegalDocumentPageProps = {
  document: LegalDocument;
  backHref?: string;
};

export function LegalDocumentPage({ document, backHref = '/' }: LegalDocumentPageProps) {
  return (
    <div className="min-h-screen bg-[#f6f7f8] text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 px-4 py-5 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <BrandLogo href="/" />
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <div className="mb-8 border-b border-slate-200 pb-8">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-primary/80">
              <FileText className="size-4" />
              Documento legal
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {document.title}
            </h1>
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Última atualização: {document.updatedAt}
            </p>
          </div>

          <div className="space-y-5 text-base leading-8 text-slate-600">
            {document.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 space-y-9">
            {document.sections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-8 text-slate-600">
                    {paragraph}
                  </p>
                ))}
                {section.items?.length ? (
                  <ul className="space-y-2 pl-5 text-base leading-8 text-slate-600">
                    {section.items.map((item) => (
                      <li key={item} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
