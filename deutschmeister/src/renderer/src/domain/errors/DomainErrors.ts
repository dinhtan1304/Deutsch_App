/**
 * Domain Errors
 * Custom error classes for domain-specific errors
 */

/**
 * Base class for all domain errors
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends DomainError {
  public readonly field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

/**
 * Error thrown when an entity is not found
 */
export class NotFoundError extends DomainError {
  public readonly entityName: string;
  public readonly entityId?: string;
  
  constructor(entityName: string, entityId?: string) {
    super(
      entityId 
        ? `${entityName} with ID '${entityId}' not found`
        : `${entityName} not found`
    );
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

/**
 * Error thrown when trying to create a duplicate entity
 */
export class DuplicateError extends DomainError {
  public readonly entityName: string;
  
  constructor(entityName: string, message?: string) {
    super(message || `${entityName} already exists`);
    this.entityName = entityName;
  }
}

/**
 * Error thrown when a business rule is violated
 */
export class BusinessRuleError extends DomainError {
  public readonly rule: string;
  
  constructor(rule: string, message: string) {
    super(message);
    this.rule = rule;
  }
}

/**
 * Error thrown when a persistence operation fails
 */
export class PersistenceError extends DomainError {
  public readonly operation: 'create' | 'update' | 'delete' | 'read';
  public readonly cause?: Error;
  
  constructor(operation: 'create' | 'update' | 'delete' | 'read', message: string, cause?: Error) {
    super(message);
    this.operation = operation;
    this.cause = cause;
  }
}