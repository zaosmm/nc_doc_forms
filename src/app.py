from datetime import datetime
import io
import json
import typing
from contextlib import asynccontextmanager
from pathlib import Path

from docxtpl import DocxTemplate
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from marmel_grammar import MarmelGrammar
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


@APP.get("/api/vacation/template")
async def index(nc: typing.Annotated[AsyncNextcloudApp, Depends(anc_app)]):
    user = await nc.user

    user_info = await nc.users.get_user(user)

    templates_dir = f"/Шаблоны/Заявления"

    vacation_fn = f"{templates_dir}/заявление_на_отпуск.docx"
    content = await nc.files.download(vacation_fn)

    resp = io.BytesIO(content)
    resp.seek(0)

    return StreamingResponse(
        resp,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=\"tpl_zayavlenie_{datetime.now().strftime('%Y-%m-%d')}.docx\"",
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
    )


@APP.post("/api/vacation")
async def index(data: vacation.Data,
                nc: typing.Annotated[AsyncNextcloudApp, Depends(anc_app)]):
    user = await nc.user

    user_info = await nc.users.get_user(user)

    templates_dir = f"/Шаблоны/Заявления"
    vacation_fn = f"{templates_dir}/заявление_на_отпуск.docx"
    content = await nc.files.download(vacation_fn)

    print(json.dumps(user_info._raw_data, ensure_ascii=False))

    doc = DocxTemplate(io.BytesIO(content))

    user_data = user_info._raw_data
    user_displayname = user_data.get('displayname')
    user_organisation = user_data.get('organisation')
    user_role = user_data.get('role')

    _displayname = user_displayname.split(' ')
    user_name = ''
    user_surname = ''
    user_father_name = ''
    if len(_displayname) > 0:
        user_surname = _displayname[0]
    if len(_displayname) > 1:
        user_name = _displayname[1]
    if len(_displayname) > 2:
        user_father_name = _displayname[2]

    grammar = MarmelGrammar()
    user_name_gen = grammar.decline(user_name, "gen")
    user_surname_gen = grammar.decline(user_surname, "gen")
    user_father_name_gen = grammar.decline(user_father_name, "gen")

    data_payload = data.model_dump()
    date_from = datetime.strptime(data_payload.get('date_from'), "%Y-%m-%d")
    date_to = datetime.strptime(data_payload.get('date_to'), "%Y-%m-%d")
    date_req = datetime.strptime(data_payload.get('date_req'), "%Y-%m-%d")
    date_change = datetime.strptime(data_payload.get('date_change'), "%Y-%m-%d")
    year_period = data_payload.get('year_period')

    months_rus_gen = [
        'января',
        'февраля',
        'марта',
        'апреля',
        'мая',
        'июня',
        'июля',
        'августа',
        'сентября',
        'октября',
        'ноября',
        'декабря',
    ]

    date_from_info = {
        'day': date_from.day,
        'month': months_rus_gen[date_from.month - 1],
        'year': date_from.year,
    }

    date_req_info = {
        'day': date_req.day,
        'month': months_rus_gen[date_req.month - 1],
        'year': date_req.year,
    }

    date_to_info = {
        'day': date_to.day,
        'month': months_rus_gen[date_to.month - 1],
        'year': date_to.year,
    }

    date_change_info = {
        'day': date_change.day,
        'month': months_rus_gen[date_change.month - 1],
        'year': date_change.year,
    }

    context = {
        'status': 'ok',
        'user': {
            'name': user_name,
            'name_gen': user_name_gen,
            'surname': user_surname,
            'surname_gen': user_surname_gen,
            'father_name': user_father_name,
            'father_name_gen': user_father_name_gen,
            'role': user_role,
            'unit': user_organisation,
        },
        'date_from': date_from_info,
        'date_to': date_to_info,
        'date_req': date_req_info,
        'date_change': date_change_info,
        'year_period': year_period,
        'data': data.model_dump()
    }
    doc.render(context)

    output = io.BytesIO()
    doc.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=\"zayavlenie_{datetime.now().strftime('%Y-%m-%d')}\"",
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
    )
