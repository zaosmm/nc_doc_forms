from pydantic import BaseModel


class Data(BaseModel):
    money_type: str | None = None
    date_req: str | None = None
    total_amount: float | None = None
    purpose: str | None = None
    location: str | None = None
    total_days: int | None = None

