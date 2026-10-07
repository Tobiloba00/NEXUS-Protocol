import { Page, PageHeader } from "@/components/layout/Page";
import { LEGAL_CONTACT_EMAIL, TERMS_VERSION } from "@/lib/legal/terms";

export type LegalSection = { heading: string; body: string[] };

/** Shared layout for the Terms, Privacy and Disclaimer pages. */
export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <Page narrow>
      <PageHeader title={title} subtitle={`Version ${TERMS_VERSION}`} />
      <p className="-mt-3 text-[16px] leading-relaxed text-ink-300">{intro}</p>
      <div className="flex flex-col gap-8">
        {sections.map((s, i) => (
          <section key={s.heading}>
            <h2 className="t-headline mb-2.5">
              {i + 1}. {s.heading}
            </h2>
            <div className="flex flex-col gap-3">
              {s.body.map((p) => (
                <p key={p} className="text-[15px] leading-relaxed text-ink-300">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
      {LEGAL_CONTACT_EMAIL && (
        <p className="text-[14px] text-ink-400">
          Questions? Contact{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium text-accent">
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      )}
    </Page>
  );
}
