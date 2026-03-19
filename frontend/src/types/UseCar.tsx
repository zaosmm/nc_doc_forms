// Набор данных для отправки на сервер.
import {inflate} from "node:zlib";

export interface UseCarRequest {
    location_from: string;
    location_to: string;
    date_from: string;
    date_to: string;
    date_req: string;
    total_days: number;
    time_hour_from: string;
    time_min_from: string;
    time_hour_to: string;
    time_min_to: string;
    is_private: string;
    is_another: string;
    car_title: string;
    car_owner: string;
    car_number: string;
}