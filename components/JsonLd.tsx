/**
 * Emit a schema.org document as JSON-LD.
 *
 * A `<script>` element is `display: none` per the HTML spec, so this adds
 * nothing to the rendered page — the markup is for crawlers and answer engines
 * only.
 *
 * The payload is always serialised with `JSON.stringify` rather than written
 * as a string in JSX: hand-written JSON drifts out of sync with the data it
 * describes, and a single unescaped quote silently invalidates the whole block
 * with no visible symptom.
 *
 * `<` is escaped so a value containing `</script>` cannot close the element
 * early and inject markup. Everything here comes from repo config today, but
 * the escape costs nothing and removes the failure mode entirely.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
