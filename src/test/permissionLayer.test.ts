import { describe, expect, it } from "vitest";
import { PermissionLayer } from "@/security/PermissionLayer";

describe("PermissionLayer", () => {
  const permission = new PermissionLayer();

  it("allows regular chat action", () => {
    const result = permission.checkPermission("chat.send", { actorId: "u1" });
    expect(result.allowed).toBe(true);
  });

  it("denies external action without approval", () => {
    const result = permission.checkPermission("network.external", {
      actorId: "u1",
      trustedSession: true,
      requiresApproval: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("requires explicit approval");
  });

  it("denies external action for untrusted session", () => {
    const result = permission.checkPermission("network.external", {
      actorId: "u1",
      trustedSession: false,
      requiresApproval: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("trusted session");
  });
});
