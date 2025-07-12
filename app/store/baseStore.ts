export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseStore<T extends BaseEntity> {
  items: T[];
  loading: boolean;
  error: string | null;
  
  // Core actions
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility actions
  clearItems: () => void;
  getItemById: (id: string) => T | undefined;
}