import axios from 'axios';
import { BASE_URL } from './constants';

const API_TOKEN = process.env.REACT_APP_POKEWORLD_API_TOKEN ?? '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  if (API_TOKEN) {
    config.headers.set('X-PokeWorld-Token', API_TOKEN);
  }
  return config;
});

export function getAuthHeaders(): Record<string, string> | null {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}
