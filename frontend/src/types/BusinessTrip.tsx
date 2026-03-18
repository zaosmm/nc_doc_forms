// Набор данных для отправки на сервер.
export interface BusinessTripRequest {
    date_from: string;
    date_to: string;
    date_req: string;
    employee: string;
    location: string;
    organization: string;
    summary: string;
    transport: string;
    auto_number: string;
}