/**
 * API Client Module
 * 
 * Centralized API communication layer for the frontend.
 * Handles authentication, error handling, and all backend requests.
 * 
 * Following Clean Code principles:
 * - Single source of truth for API calls
 * - Consistent error handling
 * - Type-safe interfaces
 */

// --- Configuration ---
let authToken: string | null = null;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- Helper Functions ---

/**
 * Set the authentication token for all subsequent API requests.
 * @param token - JWT token or null to clear authentication
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Generate headers for fetch requests.
 * Includes Authorization header if user is authenticated.
 * @param isFormData - If true, omits Content-Type header for FormData
 */
function getHeaders(isFormData: boolean = false): HeadersInit {
  const headers: HeadersInit = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    try {
      // Intenta parsear el JSON del error de FastAPI
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.detail || `Error ${response.status}`);
    } catch (e) {
      // Si no es JSON, usa el texto plano
      throw new Error(errorText || `Error ${response.status}`);
    }
  }
  // Si la respuesta es blob (para PDFs)
  if (response.headers.get("content-type")?.includes("application/pdf")) {
    return response.blob() as Promise<T>;
  }
  return response.json() as Promise<T>;
}

// --- Types ---

export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  token_usage: number;
  has_api_key: boolean;
  ai_provider?: string;
  ai_model?: string;
}

export interface UserUpdate {
  gemini_api_key?: string;  // Legacy name, maps to AI API key
  ai_provider?: string;     // gemini, openai, anthropic
  ai_model?: string;        // Specific model override
  full_name?: string;
}

export interface UserAdminUpdate {
  role?: string;
  gemini_api_key?: string;
  ai_provider?: string;
  ai_model?: string;
  full_name?: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;  // Seconds until access token expires
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  source?: string | null;
  correctedQuery?: string | null;
}

export interface FeedbackRequest {
  query: string;
  answer: string;
  feedback_type: 'positive' | 'negative';
  comment?: string;
}

export interface SearchResponse {
  highlighted_source: string | null;
  corrected_query: string | null;
}

export interface SearchRequest {
  query: string;
  top_k?: number;
  chat_history?: ChatMessage[];
  source_files?: string[];
}

export interface DocumentMetadata {
  id: number;
  source_file: string;
  total_chunks: number;
}

export interface FileProcessResponse {
  message: string;
  filename: string;
}

export interface CopilotRequest {
  text: string;
  instruction: string;
  source_files?: string[];
}

// --- Provider Types ---
export interface AIModel {
  id: string;
  name: string;
}

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  default_model: string;
  api_key_url: string;
  api_key_placeholder: string;
  setup_steps: string[];
}

export interface ProvidersResponse {
  providers: AIProvider[];
}

// --- Provider Endpoints ---

export const getProviders = (): Promise<ProvidersResponse> => {
  return fetch(`${API_BASE_URL}/providers/`, {
    method: 'GET',
    headers: getHeaders(),
  }).then(response => handleResponse<ProvidersResponse>(response));
};

// --- Auth Endpoints ---

export const login = (email: string, password: string): Promise<AuthToken> => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  return fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  }).then(response => handleResponse<AuthToken>(response));
};

export const register = (email: string, password: string, fullName?: string): Promise<User> => {
  return fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, full_name: fullName }),
  }).then(response => handleResponse<User>(response));
};

/**
 * Refresh access token using a valid refresh token.
 * Implements token rotation - returns new access AND refresh tokens.
 */
export const refreshToken = (refreshTokenValue: string): Promise<AuthToken> => {
  return fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshTokenValue }),
  }).then(response => handleResponse<AuthToken>(response));
};

/**
 * Logout and invalidate tokens.
 * If refresh_token provided, only that token family is revoked.
 * Otherwise, all user sessions are terminated.
 */
export const logout = (refreshTokenValue?: string): Promise<{ message: string }> => {
  return fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ refresh_token: refreshTokenValue || null }),
  }).then(response => handleResponse<{ message: string }>(response));
};

export const getMe = (): Promise<User> => {
  return fetch(`${API_BASE_URL}/auth/users/me`, {
    method: 'GET',
    headers: getHeaders(),
  }).then(response => handleResponse<User>(response));
};

export const updateUser = (data: UserUpdate): Promise<User> => {
  return fetch(`${API_BASE_URL}/auth/users/me`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  }).then(response => handleResponse<User>(response));
};

export const updateProfile = updateUser;

// --- Admin Endpoints ---

export const getUsers = (): Promise<User[]> => {
  return fetch(`${API_BASE_URL}/admin/users`, {
    method: 'GET',
    headers: getHeaders(),
  }).then(response => handleResponse<User[]>(response));
};

export const updateUserAdmin = (userId: number, data: UserAdminUpdate): Promise<User> => {
  return fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  }).then(response => handleResponse<User>(response));
};

export const deleteUser = (userId: number): Promise<any> => {
  return fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(response => handleResponse<any>(response));
};

export const resetUserPassword = (userId: number, password: string): Promise<any> => {
  return fetch(`${API_BASE_URL}/admin/users/${userId}/password`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ password }),
  }).then(response => handleResponse<any>(response));
};

//  --- Advanced Admin Endpoints ---
export interface AnalyticsData {
  total_users: number;
  total_documents: number;
  total_feedback: number;
  users_with_api_key: number;
  top_users: Array<{
    id: number;
    email: string;
    full_name: string | null;
    document_count: number;
  }>;
  role_distribution: Array<{
    role: string;
    count: number;
  }>;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  details: any;
  ip_address: string | null;
  timestamp: string;
}

export interface DocumentInfo {
  owner_id: number;
  source_file: string;
  chunk_count: number;
}

export const getAnalytics = (): Promise<AnalyticsData> => {
  return fetch(`${API_BASE_URL}/admin/analytics`, {
    method: 'GET',
    headers: getHeaders(),
  }).then(response => handleResponse<AnalyticsData>(response));
};

export const getActivityLogs = (params?: {
  skip?: number;
  limit?: number;
  action?: string;
  user_id?: number;
}): Promise<{ total: number; logs: ActivityLog[] }> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params?.action) queryParams.append('action', params.action);
  if (params?.user_id !== undefined) queryParams.append('user_id', params.user_id.toString());

  return fetch(`${API_BASE_URL}/admin/logs?${queryParams}`, {
    method: 'GET',
    headers: getHeaders(),
  }).then(response => handleResponse<{ total: number; logs: ActivityLog[] }>(response));
};

export const getAllDocuments = (params?: {
  skip?: number;
  limit?: number;
  owner_id?: number;
}): Promise<{ total: number; documents: DocumentInfo[] }> => {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params?.owner_id !== undefined) queryParams.append('owner_id', params.owner_id.toString());

  return fetch(`${API_BASE_URL}/admin/documents?${queryParams}`, {
    method: 'GET',
    headers: getHeaders(),
  }).then(response => handleResponse<{ total: number; documents: DocumentInfo[] }>(response));
};

export const deleteDocumentBySource = (ownerId: number, sourceFile: string): Promise<any> => {
  return fetch(`${API_BASE_URL}/admin/documents/source/${ownerId}/${encodeURIComponent(sourceFile)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(response => handleResponse<any>(response));
};

// --- Document Endpoints ---

export async function processFile(file: File): Promise<FileProcessResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/documents/process-file`, {
    method: 'POST',
    headers: getHeaders(true), // FormData es especial
    body: formData,
  });
  return handleResponse<FileProcessResponse>(response);
}

export async function listDocuments(): Promise<DocumentMetadata[]> {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse<DocumentMetadata[]>(response);
}

export async function deleteDocument(sourceFile: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(sourceFile)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse<any>(response);
}

// --- Task & Other Endpoints ---



export async function submitFeedback(feedback: FeedbackRequest): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/chat/feedback`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(feedback),
  });
  return handleResponse<any>(response);
}

export async function compilePdf(request: CopilotRequest): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/chat/compile-pdf`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse<Blob>(response);
}

// --- Streaming Endpoints ---

export async function* streamSearch(request: SearchRequest): AsyncGenerator<string> {
  // Realiza una peticion de busqueda y procesa la respuesta en streaming
  // Permite mostrar la respuesta palabra por palabra
  const response = await fetch(`${API_BASE_URL}/chat/search`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en la búsqueda: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No se pudo obtener el lector de la respuesta.');
  }

  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* streamCopilot(request: CopilotRequest): AsyncGenerator<string> {
  const response = await fetch(`${API_BASE_URL}/chat/copilot`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en el copiloto: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No se pudo obtener el lector de la respuesta.');
  }

  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export async function getSuggestedQuestions(sourceFiles: string[]): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/documents/suggest-questions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ source_files: sourceFiles }),
  });
  return handleResponse<{ questions: string[] }>(response).then(data => data.questions);
}