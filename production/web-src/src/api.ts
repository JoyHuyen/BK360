import type { Campaign, Location, User } from './types';

// Base API — đặt VITE_API_BASE=/BK360/api khi build dưới subpath. Mặc định '/api'.
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

let accessToken: string | null = null;
export const setToken = (t: string | null) => {
  accessToken = t;
};
export const getToken = () => accessToken;

async function req<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || res.statusText);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export const api = {
  // public
  config: () => req('/config'),
  locations: () => req<Location[]>('/locations'),
  campaigns: () => req<Campaign[]>('/campaigns'),

  // auth
  login: (email: string, password: string) =>
    req<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  refresh: () =>
    req<{ user: User; accessToken: string }>('/auth/refresh', { method: 'POST' }),
  logout: () => req('/auth/logout', { method: 'POST' }),

  // admin
  adminLocations: () => req<Location[]>('/admin/locations'),
  createLocation: (d: any) =>
    req('/admin/locations', { method: 'POST', body: JSON.stringify(d) }),
  updateLocation: (id: string, d: any) =>
    req(`/admin/locations/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  setVisibility: (id: string, isHidden: boolean) =>
    req(`/admin/locations/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isHidden }),
    }),
  deleteLocation: (id: string) => req(`/admin/locations/${id}`, { method: 'DELETE' }),

  adminCampaigns: () => req<Campaign[]>('/admin/campaigns'),
  createCampaign: (d: any) =>
    req('/admin/campaigns', { method: 'POST', body: JSON.stringify(d) }),
  updateCampaign: (id: string, d: any) =>
    req(`/admin/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  toggleCampaign: (id: string, enabled: boolean) =>
    req(`/admin/campaigns/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),
  deleteCampaign: (id: string) => req(`/admin/campaigns/${id}`, { method: 'DELETE' }),

  // media (multipart upload)
  uploadMedia: (file: File, kind: string, locationId?: string, lang?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    if (locationId) fd.append('locationId', locationId);
    if (lang) fd.append('lang', lang);
    return fetch(API_BASE + '/admin/media', {
      method: 'POST',
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: fd,
    }).then(async (r) => {
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(b.message || r.statusText);
      }
      return r.json();
    });
  },
  deleteMedia: (id: string) => req(`/admin/media/${id}`, { method: 'DELETE' }),

  // users (chỉ SUPERADMIN)
  adminUsers: () => req<User[]>('/admin/users'),
  createUser: (d: { email: string; password: string; name?: string; role?: string }) =>
    req('/admin/users', { method: 'POST', body: JSON.stringify(d) }),
  updateUser: (id: string, d: { name?: string; role?: string; password?: string }) =>
    req(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteUser: (id: string) => req(`/admin/users/${id}`, { method: 'DELETE' }),

  audit: (limit = 100) => req<any[]>(`/admin/audit?limit=${limit}`),
};
