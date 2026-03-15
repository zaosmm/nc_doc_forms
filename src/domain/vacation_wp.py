from pydantic import BaseModel


class Data(BaseModel):
    date_from: str | None = None  # Дата начала отпуска.
    date_to: str | None = None  # Дата окончания отпуска.
    date_req: str | None = None  # Дата составления документа.
