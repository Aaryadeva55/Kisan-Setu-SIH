export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: unknown | undefined;
    constructor(statusCode: number, code: string, message: string, details?: unknown | undefined);
}
export declare class ValidationError extends AppError {
    constructor(details: unknown, message?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(entity: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare class InternalServerError extends AppError {
    constructor(message?: string, details?: unknown);
}
//# sourceMappingURL=AppError.d.ts.map