export type QErrorCode =
  | "CONFIG_VALIDATION_FAILED"
  | "PERMISSION_DENIED"
  | "RUNTIME_BOOTSTRAP_FAILED"
  | "CONTRACT_VIOLATION"
  | "EXTERNAL_SERVICE_FAILURE";

export class QError extends Error {
  public readonly code: QErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: QErrorCode, message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, cause ? { cause } : undefined);
    this.name = "QError";
    this.code = code;
    this.details = details;
  }
}

export class ConfigValidationError extends QError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super("CONFIG_VALIDATION_FAILED", message, details, cause);
    this.name = "ConfigValidationError";
  }
}

export class PermissionDeniedError extends QError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super("PERMISSION_DENIED", message, details, cause);
    this.name = "PermissionDeniedError";
  }
}

export class RuntimeBootstrapError extends QError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super("RUNTIME_BOOTSTRAP_FAILED", message, details, cause);
    this.name = "RuntimeBootstrapError";
  }
}

export class ContractViolationError extends QError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super("CONTRACT_VIOLATION", message, details, cause);
    this.name = "ContractViolationError";
  }
}

export class ExternalServiceError extends QError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super("EXTERNAL_SERVICE_FAILURE", message, details, cause);
    this.name = "ExternalServiceError";
  }
}
