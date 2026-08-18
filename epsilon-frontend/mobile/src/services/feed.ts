import api from "@/services/api";
import type { Paginated } from "@/services/teacherDirectory";
import type { UserRole } from "@/types/user";

export interface PostAuthor {
  id: number;
  full_name: string;
  avatar: string | null;
  primary_role: UserRole;
  role_label: string;
  is_followed_by_me: boolean;
  followers_count: number;
}

export interface Post {
  id: number;
  author: PostAuthor;
  title: string;
  body: string;
  hashtags: string[];
  images: { id: number; image: string; order: number }[];
  video: string | null;
  video_duration_seconds: number | null;
  visibility: "public" | "members";
  like_count: number;
  comment_count: number;
  is_liked_by_me: boolean;
  created_at: string;
}

export interface PostComment {
  id: number;
  post: number;
  author: PostAuthor;
  body: string;
  like_count: number;
  is_liked_by_me: boolean;
  created_at: string;
}

export const fetchPosts = (filters?: { authorId?: number; hashtag?: string; q?: string }) =>
  api
    .get<Paginated<Post>>("/feed/posts/", {
      params: { author: filters?.authorId, hashtag: filters?.hashtag, q: filters?.q },
    })
    .then((r) => r.data.results);

/** Publication précise, indépendamment de toute liste déjà en cache — le
 * fil général ("posts") ne contient que les publications les plus
 * récentes : ouvrir une publication trouvée ailleurs (profil d'un auteur,
 * recherche...) et la chercher dans ce cache-là échouait silencieusement
 * dès qu'elle n'y figurait pas, laissant l'écran de détail chargé
 * indéfiniment. */
export const fetchPost = (postId: number) => api.get<Post>(`/feed/posts/${postId}/`).then((r) => r.data);

/** Publication avec photos (0 à 6) OU une vidéo (60s max, exclusif des
 * photos) — multipart, cohérent avec le seul autre upload de fichier de
 * l'app (documents personnels élève). */
export const createPost = (
  body: string,
  images: { uri: string; name: string; mimeType?: string | null }[] = [],
  visibility: "public" | "members" = "public",
  title?: string,
  video?: { uri: string; name: string; mimeType?: string | null; durationSeconds: number },
) => {
  const formData = new FormData();
  if (title) formData.append("title", title);
  formData.append("body", body);
  formData.append("visibility", visibility);
  images.forEach((img) => {
    formData.append("images", {
      uri: img.uri,
      name: img.name,
      type: img.mimeType ?? "image/jpeg",
    } as unknown as Blob);
  });
  if (video) {
    formData.append("video", {
      uri: video.uri,
      name: video.name,
      type: video.mimeType ?? "video/mp4",
    } as unknown as Blob);
    formData.append("video_duration_seconds", String(Math.round(video.durationSeconds)));
  }
  return api
    .post<Post>("/feed/posts/", formData, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
};

export const deletePost = (postId: number) => api.delete(`/feed/posts/${postId}/`);

export const updatePost = (postId: number, body: string) =>
  api.patch<Post>(`/feed/posts/${postId}/`, { body }).then((r) => r.data);

export const togglePostLike = (postId: number) =>
  api.post<{ liked: boolean; like_count: number }>(`/feed/posts/${postId}/like/`).then((r) => r.data);

export const toggleFollow = (userId: number) =>
  api
    .post<{ following: boolean; followers_count: number }>(`/feed/users/${userId}/follow/`)
    .then((r) => r.data);

export const fetchMyFollowing = () => api.get<PostAuthor[]>("/feed/my-following/").then((r) => r.data);

export const fetchPostComments = (postId: number) =>
  api.get<PostComment[]>(`/feed/posts/${postId}/comments/`).then((r) => r.data);

export const createPostComment = (postId: number, body: string) =>
  api.post<PostComment>(`/feed/posts/${postId}/comments/`, { body }).then((r) => r.data);

export const deletePostComment = (postId: number, commentId: number) =>
  api.delete(`/feed/posts/${postId}/comments/${commentId}/`);

export const toggleCommentLike = (postId: number, commentId: number) =>
  api
    .post<{ liked: boolean; like_count: number }>(`/feed/posts/${postId}/comments/${commentId}/like/`)
    .then((r) => r.data);

export interface PublicProfile {
  id: number;
  full_name: string;
  avatar: string | null;
  primary_role: UserRole;
  role_label: string;
  subtitle: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
}

/** Fiche de profil minimale valable pour n'importe quel rôle — c'est ce
 * qu'on ouvre en tapant sur l'auteur d'une publication du fil, quel que
 * soit son rôle (les annuaires dédiés enseignant/établissement/entreprise
 * ne couvrent pas parent, élève, formateur, administrateur...). */
export const fetchPublicProfile = (userId: number) =>
  api.get<PublicProfile>(`/auth/profile/${userId}/`).then((r) => r.data);

export interface PeopleSearchResult {
  type: "teacher" | "establishment" | "company";
  id: number;
  name: string;
  avatar: string | null;
  subtitle: string;
}

export const searchPeople = (q: string) =>
  api.get<PeopleSearchResult[]>("/auth/search/people/", { params: { q } }).then((r) => r.data);
