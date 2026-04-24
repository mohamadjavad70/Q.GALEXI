import { beforeEach, describe, expect, it } from "vitest";
import { QRuntime } from "@/runtime/QRuntime";
import { RuntimeBootstrapError } from "@/errors";

describe("QRuntime", () => {
  beforeEach(() => {
    QRuntime.resetForTests();
  });

  it("boots as singleton", () => {
    const r1 = QRuntime.boot({ VITE_QMETARAM_API_URL: "http://localhost:8765", VITE_API_URL: "http://localhost:3001" });
    const r2 = QRuntime.boot();

    expect(r1).toBe(r2);
    expect(r1.health().status).toBe("ok");
  });

  it("fails with invalid config and throws typed runtime error", () => {
    expect(() => QRuntime.boot({ VITE_QMETARAM_API_URL: "not-a-url", VITE_API_URL: "bad" })).toThrow(
      RuntimeBootstrapError
    );
  });
});
