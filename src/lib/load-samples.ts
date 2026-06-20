/** Fetch all dummy PDFs listed in public/samples/manifest.json. */
export async function fetchSamplePdfFiles(): Promise<File[]> {
  const manifestRes = await fetch("/samples/manifest.json");
  if (!manifestRes.ok) {
    throw new Error("Sample library not found. Run npm run samples first.");
  }

  const manifest = (await manifestRes.json()) as { files: string[] };
  const files: File[] = [];

  for (const name of manifest.files) {
    const res = await fetch(`/samples/${name}`);
    if (!res.ok) {
      throw new Error(`Could not load sample PDF: ${name}`);
    }
    const buffer = await res.arrayBuffer();
    files.push(new File([buffer], name, { type: "application/pdf" }));
  }

  return files;
}
