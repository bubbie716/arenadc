import type { LegalSection } from "@/lib/legal/types";

function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
      {items.map((item) => (
        <li key={item.slice(0, 48)}>{item}</li>
      ))}
    </ul>
  );
}

function LegalCodeBlocks({ blocks }: { blocks: string[][] }) {
  return (
    <>
      {blocks.map((lines) => (
        <pre
          key={lines.join("").slice(0, 40)}
          className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-elevated px-3 py-2 font-mono text-xs leading-relaxed text-foreground"
        >
          {lines.join("\n")}
        </pre>
      ))}
    </>
  );
}

function LegalBlock({
  paragraphs,
  listItems,
  codeBlocks,
}: {
  paragraphs?: string[];
  listItems?: string[];
  codeBlocks?: string[][];
}) {
  return (
    <>
      {paragraphs?.map((p) => (
        <p key={p.slice(0, 48)} className="mt-3 text-sm leading-relaxed text-muted">
          {p}
        </p>
      ))}
      {codeBlocks && codeBlocks.length > 0 && <LegalCodeBlocks blocks={codeBlocks} />}
      {listItems && listItems.length > 0 && <LegalList items={listItems} />}
    </>
  );
}

export interface LegalDocumentBodyProps {
  documentTitle?: string;
  effectiveDate?: string;
  lastUpdated?: string;
  preamble?: string[];
  sections: LegalSection[];
}

export function LegalDocumentBody({
  documentTitle,
  effectiveDate,
  lastUpdated,
  preamble,
  sections,
}: LegalDocumentBodyProps) {
  return (
    <>
      {documentTitle ? (
        <h2 className="text-base font-semibold text-foreground">{documentTitle}</h2>
      ) : null}
      {(effectiveDate || lastUpdated) && (
        <p className={`text-sm text-muted ${documentTitle ? "mt-2" : ""}`}>
          {effectiveDate && (
            <>
              <span className="font-medium text-foreground">Effective Date:</span> {effectiveDate}
            </>
          )}
          {effectiveDate && lastUpdated && " · "}
          {lastUpdated && (
            <>
              <span className="font-medium text-foreground">Last Updated:</span> {lastUpdated}
            </>
          )}
        </p>
      )}

      <article className="mt-6 max-w-none space-y-10">
        {preamble && (
          <div className="space-y-3 border-b border-border pb-8 text-sm leading-relaxed text-muted">
            {preamble.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>
        )}

        {sections.map((section, sectionIndex) => (
          <section key={section.title || `section-${sectionIndex}`}>
            <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
            <LegalBlock
              paragraphs={section.paragraphs}
              listItems={section.listItems}
              codeBlocks={section.codeBlocks}
            />
            {section.subsections?.map((sub, subIndex) => (
              <div
                key={
                  sub.title ||
                  sub.paragraphs?.[0]?.slice(0, 32) ||
                  `${sectionIndex}-sub-${subIndex}`
                }
                className="mt-5 border-l-2 border-border pl-4"
              >
                {sub.title ? (
                  <h4 className="text-base font-semibold text-foreground">{sub.title}</h4>
                ) : null}
                <LegalBlock
                  paragraphs={sub.paragraphs}
                  listItems={sub.listItems}
                  codeBlocks={sub.codeBlocks}
                />
              </div>
            ))}
          </section>
        ))}
      </article>
    </>
  );
}
