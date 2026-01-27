// API utility functions for the Todo app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

console.log('🔍 API URL being used:', API_BASE_URL);

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string,string> = {
      'Content-Type': 'application/json',
    
    };
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Add authorization header if required and token exists
    if (requireAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (requireAuth) {
        // If auth is required but no token, redirect to login
        window.location.href = '/login';
        return { error: 'Not authenticated', status: 401 };
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const status = response.status;
      let data;

      try {
        data = await response.json();
      } catch (e) {
        // If response is not JSON (e.g., for DELETE operations), return empty object
        if (status === 204) {
          return { data: undefined, status };
        }
        // For other non-JSON responses, return the text
        data = { message: await response.text() };
      }

      if (!response.ok) {
        return { error: data.error || 'Request failed', status };
      }

      return { data, status };
    } catch (error) {
      console.error('API request error:', error);
      return { error: 'Network error occurred', status: 0 };
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  }

  async signup(email: string, password: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  }

  // Task methods
  async getTasks(userId: string) {
    return this.request(`/users/${userId}/tasks`);
  }

  async createTask(userId: string, taskData: any) {
    return this.request(`/users/${userId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async getTask(userId: string, taskId: string) {
    return this.request(`/users/${userId}/tasks/${taskId}`);
  }

  async updateTask(userId: string, taskId: string, taskData: any) {
    return this.request(`/users/${userId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(userId: string, taskId: string) {
    return this.request(`/users/${userId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async updateTaskCompletion(userId: string, taskId: string, completed: boolean) {
    return this.request(`/users/${userId}/tasks/${taskId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

export type { ApiResponse };