"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          padding: "24px 40px",
          borderBottom: "3px solid #e94560",
        }}
      >
        <h1 style={{ color: "#fff", margin: 0, fontSize: "1.6rem", fontWeight: 700, letterSpacing: "0.5px" }}>
          Cashtoroid — API Reference
        </h1>
        <p style={{ color: "#a0aec0", margin: "6px 0 0", fontSize: "0.9rem" }}>
          OpenAPI 3.0.3 · Interactive documentation
        </p>
      </div>
      <div style={{ padding: "0 20px 40px" }}>
        <SwaggerUI
          url="/api/docs"
          docExpansion="list"
          defaultModelsExpandDepth={2}
          displayRequestDuration
          tryItOutEnabled
          persistAuthorization
          filter
        />
      </div>
    </div>
  );
}
