export type ContentType =
  | 'markdown'
  | 'code'
  | 'text'
  | 'image'
  | 'pdf'
  | 'video'
  | 'excel'
  | 'word'
  | 'file';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Workspace {
  id: number;
  title: string;
  slug: string;
  description: string;
  isPublic: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  projects?: Project[];
}

export interface Project {
  id: number;
  workspaceId: number;
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  contents?: ContentItem[];
  workspaceTitle?: string;
  contentsCount?: number;
}

export interface ContentItem {
  id: number;
  projectId: number;
  title: string;
  slug: string;
  contentType: ContentType;
  textContent?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  projectTitle?: string;
  workspaceTitle?: string;
  authorName?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}
