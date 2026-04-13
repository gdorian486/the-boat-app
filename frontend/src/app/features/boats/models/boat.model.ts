export type UUID = string & { readonly __brand: 'UUID' };

export interface Boat {
  id: UUID;
  name: string;
  description: string | null;
  createdBy: UUID;
  createdAt: Date;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
