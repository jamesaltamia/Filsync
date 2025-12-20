export type Customer = {
  id: number;
  student_id?: string;
  first_name: string;
  last_name: string;
  year_level?: string;
  course?: string;
  department?: string;
  phone?: string;
  type: 'student' | 'teacher';
  created_at: string;
  updated_at: string;
  full_name?: string;
};

