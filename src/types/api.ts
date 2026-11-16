export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}
