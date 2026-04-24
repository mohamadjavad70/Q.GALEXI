export type PermissionAction =
  | "chat.send"
  | "memory.write"
  | "memory.read"
  | "voice.listen"
  | "network.external";

export interface PermissionContext {
  actorId: string;
  trustedSession?: boolean;
  requiresApproval?: boolean;
}

export interface PermissionDecision {
  allowed: boolean;
  reason?: string;
}

export interface IPermissionLayer {
  checkPermission(action: PermissionAction, context: PermissionContext): PermissionDecision;
}
