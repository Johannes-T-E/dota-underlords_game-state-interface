import type { 
  ApiMatchesResponse, 
  ApiStatusResponse, 
  ApiHealthResponse,
  CombatResult,
  Change,
  Build,
  ShopHistoryEntry
} from '@/types';

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

  async getMatchChanges(
    matchId: string,
    accountId?: number,
    limit?: number,
    roundNumber?: number,
    roundPhase?: string
  ): Promise<{ status: string; match_id: string; changes: Change[]; count: number }> {
    const params = new URLSearchParams();
    if (accountId !== undefined) params.append('account_id', accountId.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    if (roundNumber !== undefined) params.append('round_number', roundNumber.toString());
    if (roundPhase !== undefined) params.append('round_phase', roundPhase);
    
    const queryString = params.toString();
    const endpoint = `/api/matches/${matchId}/changes${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async fetchCombatHistory(matchId: string): Promise<Record<number, CombatResult[]>> {
    const response = await this.request<{
      status: string;
      match_id: string;
      combat_results: Record<string, CombatResult[]>;
    }>(`/api/matches/${matchId}/combats`);
    
    // Convert string keys back to numbers
    const result: Record<number, CombatResult[]> = {};
    for (const [accountIdStr, combats] of Object.entries(response.combat_results)) {
      result[Number(accountIdStr)] = combats;
    }
    return result;
  }

  async fetchShopHistory(matchId: string): Promise<ShopHistoryEntry[]> {
    const response = await this.request<{
      status: string;
      match_id: string;
      shop_history: { generation_id: number; shop_units: unknown[]; purchased_slot_indices?: number[] }[];
    }>(`/api/matches/${matchId}/shop_history`);
    return response.shop_history.map((e) => ({
      generationId: e.generation_id,
      shopUnits: e.shop_units as ShopHistoryEntry['shopUnits'],
      purchasedSlotIndices: e.purchased_slot_indices,
    }));
  }

  // Build endpoints
  async getBuilds(): Promise<Build[]> {
    const response = await this.request<{
      status: string;
      builds: Build[];
    }>('/api/builds');
    return response.builds;
  }

  async getBuild(buildId: string): Promise<Build> {
    const response = await this.request<{
      status: string;
      build: Build;
    }>(`/api/builds/${buildId}`);
    return response.build;
  }

  async saveBuild(build: Build): Promise<void> {
    const isNew = !build.id || !await this.buildExists(build.id);
    const endpoint = isNew ? '/api/builds' : `/api/builds/${build.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    await this.request<{
      status: string;
      message: string;
    }>(endpoint, {
      method,
      body: JSON.stringify(build),
    });
  }

  async deleteBuild(buildId: string): Promise<void> {
    await this.request<{
      status: string;
      message: string;
    }>(`/api/builds/${buildId}`, {
      method: 'DELETE',
    });
  }

  private async buildExists(buildId: string): Promise<boolean> {
    try {
      await this.getBuild(buildId);
      return true;
    } catch (error: any) {
      // If 404, build doesn't exist
      if (error?.message?.includes('404')) {
        return false;
      }
      // For other errors, assume it doesn't exist
      return false;
    }
  }
}

export const apiService = new ApiService();

