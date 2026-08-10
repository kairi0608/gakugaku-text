export class AiConfigurationError extends Error {
  readonly status = 503;
}

export class AiGenerationError extends Error {
  readonly status = 502;
}
