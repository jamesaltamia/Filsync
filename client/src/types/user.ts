export type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

