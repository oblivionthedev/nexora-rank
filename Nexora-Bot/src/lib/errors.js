export class UserError extends Error {
  constructor(message, code = "user_error") {
    super(message);
    this.name = "UserError";
    this.code = code;
  }
}

export function databaseError(error, fallback = "Nexora could not complete that request.") {
  if (!error) return null;
  const wrapped = new Error(fallback, { cause: error });
  wrapped.code = error.code;
  return wrapped;
}
