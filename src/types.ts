export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'Basic' | 'Premium' | 'Elite';
  healthScore: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  image: string;
  availability: string;
  location: string;
}

export interface FinancialAdvisor {
  id: string;
  name: string;
  expertise: string;
  rating: number;
  image: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
