import type { 
  ApiResponse, 
  UserProfile, 
  LoginRequest, 
  RegisterRequest,
  LinkWalletRequest,
  MatrixView,
  DashboardStats,
  ContributionData,
  RewardData,
  TonStatusResponse
} from '@shared/types'

const API_BASE = '/api'

class ApiClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    })

    const data: any = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    return data as ApiResponse<T>
  }

  // Auth endpoints
  async register(data: RegisterRequest) {
    const response = await this.request<{ user: UserProfile; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    if (response.data?.token) {
      this.setToken(response.data.token)
    }
    
    return response
  }

  async login(data: LoginRequest) {
    const response = await this.request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    if (response.data?.token) {
      this.setToken(response.data.token)
    }
    
    return response
  }

  async logout() {
    const response = await this.request('/auth/logout', { method: 'POST' })
    this.setToken(null)
    return response
  }

  async getMe() {
    return this.request<UserProfile>('/auth/me')
  }

  // Matrix endpoints
  async getMatrix() {
    return this.request<MatrixView>('/matrix')
  }

  async getMatrixForUser(userId: number) {
    return this.request<MatrixView>(`/matrix/${userId}`)
  }

  // TON endpoints
  async linkWallet(data: LinkWalletRequest) {
    return this.request('/ton/link-wallet', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getTonStatus() {
    return this.request<TonStatusResponse>('/ton/status')
  }

  async getContractAddress() {
    return this.request<{ address: string; network: string; explorer: string }>('/ton/contract-address')
  }

  // Stats endpoints
  async getDashboardStats() {
    return this.request<DashboardStats>('/stats/dashboard')
  }

  async getContributions() {
    return this.request<ContributionData[]>('/stats/contributions')
  }

  async getRewards() {
    return this.request<RewardData[]>('/stats/rewards')
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/stats/admin')
  }
}

export const api = new ApiClient()
