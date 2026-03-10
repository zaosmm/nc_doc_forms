import datetime
import io
import typing
from contextlib import asynccontextmanager
from pathlib import Path

from docxtpl import DocxTemplate
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from nc_py_api import NextcloudApp, AsyncNextcloudApp
from nc_py_api.ex_app import LogLvl, set_handlers, AppAPIAuthMiddleware, anc_app
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates
from src.domain import vacation

# Константы
APP_NAME = "nc_doc_forms"
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

ASSETS_DIR = Path(__file__).parent.parent / "static"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


# Функция, которая вызывается при включении/выключении приложения
def enabled_handler(enabled: bool, nc: NextcloudApp) -> str:
    if enabled:
        nc.log(LogLvl.WARNING, f"Приложение {APP_NAME} включено!")
    else:
        nc.log(LogLvl.WARNING, f"Приложение {APP_NAME} выключено.")
    return ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Регистрация обработчиков
    set_handlers(app, enabled_handler)

    yield


# Создание приложения FastAPI
APP = FastAPI(
    title="PDF Signer",
    version="1.0.0",
    lifespan=lifespan
)

APP.add_middleware(
    CORSMiddleware,
    allow_origins=["https://cloud.zaosmm.ru"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware, который пропускает heartbeat
class CustomAppAPIMiddleware(AppAPIAuthMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Пропускаем heartbeat без проверки
        if request.url.path == "/heartbeat":
            return await call_next(request)
        # Для всех остальных - стандартная проверка
        return await super().dispatch(request, call_next)


# Middleware для аутентификации
APP.add_middleware(CustomAppAPIMiddleware)

# Монтируем статические файлы
APP.mount("/static", StaticFiles(directory=str(ASSETS_DIR)), name="static")


@APP.get("/")
async def index(request: Request,
                nc: typing.Annotated[AsyncNextcloudApp, Depends(anc_app)],
                session_id: str | None = None):
    user = await nc.user

    return templates.TemplateResponse(
        request=request, name="index.html",
        context={}
    )


@APP.post("/api/vacation")
async def index(data: vacation.Data,
                nc: typing.Annotated[AsyncNextcloudApp, Depends(anc_app)]):
    user = await nc.user

    user_info = await nc.users.get_user(user)

    templates_dir = f"Шаблоны/Заявления"
    vacation_fn = f"{templates_dir}/заявление_на_отпуск.docx"
    content = await nc.files.download(vacation_fn)

    doc = DocxTemplate(io.BytesIO(content))
    context = {
        'status': 'ok',
        'user': user_info._raw_data,
        'data': data.model_dump()
    }
    doc.render(context)

    output = io.BytesIO()
    doc.save(output)
    output.seek(0)

    async def iterfile():
        yield output.read()

    return StreamingResponse(
        iterfile(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=\"zayavlenie_{datetime.datetime.now().strftime('%Y-%m-%d')}\"",
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
    )
