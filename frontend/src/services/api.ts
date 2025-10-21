import type { 
  ApiMatchesResponse, 
  ApiStatusResponse, 
  ApiHealthResponse 
} from '../types';

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getMatches(): Promise<ApiMatchesResponse> {
    return this.request<ApiMatchesResponse>('/api/matches');
  }

  async deleteMatch(matchId: string): Promise<{ status: string; message: string }> {
    return this.request(`/api/matches/${matchId}`, {
      method: 'DELETE',
    });
  }

  async abandonMatch(): Promise<{ status: string; match_id: string; message: string }> {
    return this.request('/api/abandon_match', {
      method: 'POST',
    });
  }

  async getStatus(): Promise<ApiStatusResponse> {
    return this.request<ApiStatusResponse>('/api/status');
  }

  async getHealth(): Promise<ApiHealthResponse> {
    return this.request<ApiHealthResponse>('/api/health');
  }
}

export const apiService = new ApiService();

