from pydantic import BaseModel


class Data(BaseModel):
    date_from: str | None = None
    date_to: str | None = None
    date_req: str | None = None
    location_from: str | None = None
    location_to: str | None = None
    time_hour_from: str | None = None
    time_min_from: str | None = None
    time_hour_to: str | None = None
    time_min_to: str | None = None
    total_days: int | None = None
    is_private: str | None = None
    is_another: str | None = None
    car_title: str | None = None
    car_number: str | None = None
    car_owner: str | None = None
