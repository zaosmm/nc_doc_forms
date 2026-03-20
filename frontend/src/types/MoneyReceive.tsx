// Набор данных для отправки на сервер.
export interface MoneyReceiveRequest {
    date_req: string;
    total_days: number;
    location: string;
    money_type: string;
    purpose: string;
    total_amount: number;
}