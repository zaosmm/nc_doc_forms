from pydantic import BaseModel


class Data(BaseModel):
    date_from: str | None = None
    date_to: str | None = None
    date_req: str | None = None
    vacation_type: str | None = None
