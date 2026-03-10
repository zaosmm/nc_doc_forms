export interface ApiResponse<T = any> {
    data: T;
    headers?: {
        'content-disposition'?: string;
        'content-type'?: string;
        [key: string]: string | undefined;
    };
    status?: number;
    statusText?: string;
}