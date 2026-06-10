export interface Notice {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  title: string;
  content: string;
  displayType: 'banner' | 'popup';
  startAt: string;
  endAt: string;
}

export interface NoticePage {
  content: Notice[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface NoticeFormData {
  createdBy?: number;
  title: string;
  content: string;
  displayType: 'banner' | 'popup';
  startAt: string;
  endAt: string;
}
