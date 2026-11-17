export class UnauthorizedError extends Error {
  constructor(message = "Not signed in") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do this") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message = "Invalid input") {
    super(message);
    this.name = "ValidationError";
  }
}

export class LimitError extends Error {
  constructor(message = "Limit reached") {
    super(message);
    this.name = "LimitError";
  }
}

export class ConflictError extends Error {
  constructor(message = "Already exists") {
    super(message);
    this.name = "ConflictError";
  }
}

export class NotApprovedError extends Error {
  constructor(message = "Account is not approved yet") {
    super(message);
    this.name = "NotApprovedError";
  }
}
