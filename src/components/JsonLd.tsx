// Renders a schema.org JSON-LD block. Server-only by nature (no interactivity);
// Next's recommended pattern for structured data is an inline <script> tag.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here: the values come from our own
      // dictionaries/constants, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
