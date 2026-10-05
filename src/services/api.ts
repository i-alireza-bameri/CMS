import { User, Workspace, Project, ContentItem, AuthResponse, GraphQLResponse } from '../types';

const TOKEN_KEY = 'omnispace_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { email: string; password: string; fullName?: string }) =>
      request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>('/api/auth/me'),
  },

  // Workspaces
  workspaces: {
    list: () => request<Workspace[]>('/api/workspaces'),
    get: (id: number) => request<Workspace>(`/api/workspaces/${id}`),
    create: (data: { title: string; description?: string; isPublic?: boolean }) =>
      request<Workspace>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<{ title: string; description: string; isPublic: boolean }>) =>
      request<Workspace>(`/api/workspaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/api/workspaces/${id}`, {
        method: 'DELETE',
      }),
  },

  // Projects
  projects: {
    list: (workspaceId?: number) => {
      const query = workspaceId ? `?workspaceId=${workspaceId}` : '';
      return request<Project[]>(`/api/projects${query}`);
    },
    get: (id: number) => request<Project>(`/api/projects/${id}`),
    create: (data: { workspaceId: number; title: string; description?: string; isPublished?: boolean }) =>
      request<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<{ title: string; description: string; isPublished: boolean }>) =>
      request<Project>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/api/projects/${id}`, {
        method: 'DELETE',
      }),
  },

  // Contents
  contents: {
    list: (projectId?: number) => {
      const query = projectId ? `?projectId=${projectId}` : '';
      return request<ContentItem[]>(`/api/contents${query}`);
    },
    get: (id: number) => request<ContentItem>(`/api/contents/${id}`),
    create: (data: Partial<ContentItem> & { projectId: number; title: string }) =>
      request<ContentItem>('/api/contents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<ContentItem>) =>
      request<ContentItem>(`/api/contents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/api/contents/${id}`, {
        method: 'DELETE',
      }),
    togglePublish: (id: number, isPublished: boolean) =>
      request<ContentItem>(`/api/contents/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ isPublished }),
      }),
  },

  // Files
  files: {
    upload: async (file: File, projectId: number, title?: string, isPublished?: boolean) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId.toString());
      if (title) formData.append('title', title);
      if (isPublished !== undefined) formData.append('isPublished', String(isPublished));

      return request<{ message: string; content: ContentItem }>('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
    },
    getDownloadUrl: (id: number) => `/api/files/download/${id}`,
  },

  // Public Endpoints
  public: {
    getContentBySlug: (slug: string) => request<ContentItem>(`/api/public/content/${slug}`),
    getShowcase: () => request<Project[]>('/api/public/showcase'),
  },

  // Strawberry GraphQL Endpoint
  graphql: async <T = any>(query: string, variables?: Record<string, any>): Promise<GraphQLResponse<T>> => {
    return request<GraphQLResponse<T>>('/graphql', {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    });
  },
};
