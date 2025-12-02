// API Service for connecting React app to FastAPI backend
// Accept both VITE_API_BASE_URL (preferred) and legacy VITE_API_URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Patient {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  medical_record_number: string;
  allergies?: string;
  medical_history?: string;
}

interface Note {
  id: number;
  patient_id: number;
  author_id: number;
  note_type: string;
  title: string;
  content: string;
  status: string;
  summary?: string;
  risk_level?: string;
  recommendations?: string;
  created_at: string;
  updated_at: string;
}

export interface NoteSummary {
  id: number;
  title: string;
  note_type: string;
  content?: string;
  summary?: string;
  risk_level?: string;
  recommendations?: string;
  created_at: string;
  author_name: string;
  patient_name: string;
}

interface Appointment {
  id?: number;
  title: string;
  patient_name: string;
  appointment_type: string;
  status: string;
  location: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

interface RiskReport {
  patient_id: number;
  risk_level: string;
  risk_factors: string[];
  recommendations: string[];
  last_assessment: string;
}

class APIService {
  private token: string | null = null;

  getBaseUrl(): string {
    return API_BASE_URL;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          throw new Error('Unauthorized - please login again');
        }
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : errorData.message
          ? errorData.message
          : `HTTP Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    return response;
  }

  async signup(email: string, password: string, fullName: string, role: string): Promise<User> {
    return this.request<User>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        role,
      }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    full_name: string;
    role: string;
  }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Patients
  async getPatients(): Promise<Patient[]> {
    return this.request<Patient[]>('/patients/');
  }

  async getPatient(id: number): Promise<Patient> {
    return this.request<Patient>(`/patients/${id}`);
  }

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    return this.request<Patient>('/patients/', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  }

  async updatePatient(id: number, patient: Partial<Patient>): Promise<Patient> {
    return this.request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient),
    });
  }

  // Notes
  async getNotes(): Promise<NoteSummary[]> {
    return this.request<NoteSummary[]>('/notes/');
  }

  async getNote(id: number): Promise<Note> {
    return this.request<Note>(`/notes/${id}`);
  }

  async createNote(note: Partial<Note>): Promise<Note> {
    return this.request<Note>('/notes/', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  async updateNote(id: number, note: Partial<Note>): Promise<Note> {
    return this.request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    });
  }

  // AI Services
  async summarizeNote(noteId: number): Promise<{ summary: string; risk_level: string; recommendations: string }> {
    return this.request(`/ai/summarize/${noteId}/sync`, {
      method: 'POST',
    });
  }

  async getPatientSummary(patientId: number): Promise<{ summary: string }> {
    return this.request<{ summary: string }>(`/ai/patient-summary/${patientId}`, {
      method: 'POST',
    });
  }

  async getPatientRiskReport(patientId: number): Promise<RiskReport> {
    return this.request<RiskReport>(`/ai/risk-report/${patientId}`);
  }

  async getHighRiskPatients(): Promise<Patient[]> {
    return this.request<Patient[]>('/ai/high-risk-patients');
  }

  async checkAIStatus(): Promise<{ status: string; ai_available: boolean }> {
    return this.request('/ai/ai-status');
  }

  // Appointments
  async getAppointments(params?: { start?: string; end?: string }): Promise<Appointment[]> {
    const queryString = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    return this.request<Appointment[]>(`/appointments/${queryString}`);
  }

  async createAppointment(appointmentData: {
    title: string;
    patient_name: string;
    appointment_type: string;
    status: string;
    location: string;
    start_time: string;
    end_time: string;
    notes?: string;
  }): Promise<Appointment> {
    return this.request<Appointment>('/appointments/', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    });
  }
}

export const api = new APIService();
export type { LoginResponse, User, Patient, Note, Appointment, RiskReport };
