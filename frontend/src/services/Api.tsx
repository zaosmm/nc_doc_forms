import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import config from "../config";

// Данные для заявления на отпуск.
import {VacationRequest} from "../types/Vacation";

// Данные для заявления на отпуск без сохранения ЗП.
import {VacationWPRequest} from "../types/VacationWP";
import {BusinessTripRequest} from "../types/BusinessTrip";

class ApiClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.apiUrl;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    // Generic request methods
    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    public async getFile<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        const response = await this.client.get<T>(url, config);
        return response;
    }

    public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    public async postFileResponse<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        const response = await this.client.post<T>(url, data, config);
        return response;
    }

    public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }
}


const api = new ApiClient();

export const vacationAPI = {
    sendData: (data: VacationRequest) => {
        return api.postFileResponse('/vacation', data, {
            responseType: 'blob'
        });
    },
    getTemplate: () => {
        return api.getFile('/vacation/template', {
            responseType: 'blob'
        });
    },
};

export const vacationWpAPI = {
    sendData: (data: VacationWPRequest) => {
        return api.postFileResponse('/vacation-wp', data, {
            responseType: 'blob'
        });
    },
};


export const businessTripAPI = {
    sendData: (data: BusinessTripRequest) => {
        return api.postFileResponse('/business-trip', data, {
            responseType: 'blob'
        });
    },
    getEvents: () => {
        return api.get('/calendar/events/future');
    },
};

export default api;