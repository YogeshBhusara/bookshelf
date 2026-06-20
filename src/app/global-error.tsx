"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#000",
          color: "#ededed",
          fontFamily: "Inter, Arial, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "#9ca3af" }}>
            {error.message}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.1)",
              padding: "8px 16px",
              fontSize: 14,
              color: "#fff",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
