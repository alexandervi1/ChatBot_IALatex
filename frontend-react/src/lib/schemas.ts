/**
 * Zod Schemas for API Response Validation
 * 
 * Provides runtime validation of API responses to catch backend changes
 * or malformed data before it causes runtime errors in components.
 * 
 * Usage:
 *   import { UserSchema, parseUser } from '@/lib/schemas';
 *   const user = parseUser(apiResponse); // Throws if invalid
 */

import { z } from 'zod';

// --- User Schemas ---

export const UserSchema = z.object({
    id: z.number(),
    email: z.string().email(),
    full_name: z.string().nullable().optional(),
    role: z.string(),
    token_usage: z.number().default(0),
    has_api_key: z.boolean(),
    ai_provider: z.string().nullable().optional(),
    ai_model: z.string().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

// --- Auth Schemas ---

export const AuthTokenSchema = z.object({
    access_token: z.string().min(1),
    refresh_token: z.string().min(1),
    token_type: z.string().default('bearer'),
    expires_in: z.number().positive(),
});

export type AuthToken = z.infer<typeof AuthTokenSchema>;

// --- Document Schemas ---

export const DocumentMetadataSchema = z.object({
    id: z.number(),
    source_file: z.string(),
    total_chunks: z.number().nonnegative(),
});

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

export const DocumentMetadataArraySchema = z.array(DocumentMetadataSchema);

// --- Chat Schemas ---

export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'ai']),
    content: z.string(),
    source: z.string().nullable().optional(),
    correctedQuery: z.string().nullable().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SearchResponseSchema = z.object({
    highlighted_source: z.string().nullable(),
    corrected_query: z.string().nullable(),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

// --- Provider Schemas ---

export const AIModelSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const AIProviderSchema = z.object({
    id: z.string(),
    name: z.string(),
    models: z.array(AIModelSchema),
    default_model: z.string(),
    api_key_url: z.string().url(),
    api_key_placeholder: z.string(),
    setup_steps: z.array(z.string()),
});

export const ProvidersResponseSchema = z.object({
    providers: z.array(AIProviderSchema),
});

export type AIProvider = z.infer<typeof AIProviderSchema>;
export type ProvidersResponse = z.infer<typeof ProvidersResponseSchema>;

// --- Analytics Schemas ---

export const AnalyticsDataSchema = z.object({
    total_users: z.number(),
    total_documents: z.number(),
    total_feedback: z.number(),
    users_with_api_key: z.number(),
    top_users: z.array(z.object({
        id: z.number(),
        email: z.string(),
        full_name: z.string().nullable(),
        document_count: z.number(),
    })),
    role_distribution: z.array(z.object({
        role: z.string(),
        count: z.number(),
    })),
});

export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;

// --- Validation Helpers ---

/**
 * Safe parse that returns undefined instead of throwing on validation failure.
 * Logs errors for debugging.
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T | undefined {
    const result = schema.safeParse(data);
    if (!result.success) {
        console.warn(`[Zod Validation Failed]${context ? ` ${context}:` : ''}`, result.error.issues);
        return undefined;
    }
    return result.data;
}

/**
 * Parse with fallback - returns fallback value if validation fails.
 */
export function parseWithFallback<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    fallback: T,
    context?: string
): T {
    return safeParse(schema, data, context) ?? fallback;
}

/**
 * Strict parse - throws ZodError if validation fails.
 * Use when invalid data should be treated as an error.
 */
export function strictParse<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}

// --- Convenience Parsers ---

export const parseUser = (data: unknown) => UserSchema.parse(data);
export const parseAuthToken = (data: unknown) => AuthTokenSchema.parse(data);
export const parseDocuments = (data: unknown) => DocumentMetadataArraySchema.parse(data);
export const parseProviders = (data: unknown) => ProvidersResponseSchema.parse(data);

// Safe versions (don't throw)
export const safeParseUser = (data: unknown) => safeParse(UserSchema, data, 'User');
export const safeParseAuthToken = (data: unknown) => safeParse(AuthTokenSchema, data, 'AuthToken');
export const safeParseDocuments = (data: unknown) => safeParse(DocumentMetadataArraySchema, data, 'Documents');
