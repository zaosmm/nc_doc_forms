from pydantic import BaseModel


class Data(BaseModel):
    date_from: str | None = None
    date_to: str | None = None
    date_req: str | None = None
    order_type_is_vacation: bool | None = None
    order_type_is_change: bool | None = None
