export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  sqft: number;
  beds: number;
  baths: number;
  image_url: string;
  is_premium: number;
  cap_rate: number;
  roi: number;
}

export interface User {
  id: number;
  email: string;
  role: string;
  is_premium: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
