import io
import typing
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request, Depends
from fastapi.responses import StreamingResponse

from pytrovich.detector import PetrovichGenderDetector
from pytrovich.maker import PetrovichDeclinationMaker
from pytrovich.enums import NamePart, Case

from nc_py_api import NextcloudApp, AsyncNextcloudApp
from nc_py_api.ex_app import LogLvl, set_handlers, AppAPIAuthMiddleware, anc_app
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

from src.docs import generate_doc
from src.domain import vacation
from src.domain import vacation_wp

# Константы
APP_NAME = "nc_doc_forms"
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

ASSETS_DIR = Path(__file__).parent.parent / "static"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

NC_DOC_TEMPLATES_DIR = f"/Шаблоны/Заявления"


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
async def vacation_template(nc: typing.Annotated[AsyncNextcloudApp, Depends(anc_app)]):
    user = await nc.user

    user_info = await nc.users.get_user(user)

    vacation_fn = f"{NC_DOC_TEMPLATES_DIR}/заявление_на_отпуск.docx"
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
async def vacation(data: vacation.Data,
                   nc: typing.Annotated[AsyncNextcloudApp, Depends(anc_app)]):
    user = await nc.user

    user_info = await nc.users.get_user(user)

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

    detector = PetrovichGenderDetector()
    gender = detector.detect(firstname=user_name)

    maker = PetrovichDeclinationMaker()
    user_name_gen = maker.make(NamePart.FIRSTNAME, gender, Case.GENITIVE, user_name.lower()).capitalize()
    user_surname_gen = maker.make(NamePart.LASTNAME, gender, Case.GENITIVE, user_surname.lower()).capitalize()
    user_father_name_gen = maker.make(NamePart.MIDDLENAME, gender, Case.GENITIVE, user_father_name.lower()).capitalize()

    data_payload = data.model_dump()
    try:
        date_from = datetime.strptime(data_payload.get('date_from'), "%Y-%m-%d")
    except:
        date_from = None
    try:
        date_to = datetime.strptime(data_payload.get('date_to'), "%Y-%m-%d")
    except:
        date_to = None
    try:
        date_req = datetime.strptime(data_payload.get('date_req'), "%Y-%m-%d")
    except:
        date_req = None
    try:
        date_change = datetime.strptime(data_payload.get('date_change'), "%Y-%m-%d")
    except:
        date_change = None
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
        'day': date_from.day if date_from is not None else '',
        'month': months_rus_gen[date_from.month - 1] if date_from is not None else '',
        'year': date_from.year if date_from is not None else '',
    }

    date_req_info = {
        'day': date_req.day if date_req is not None else '',
        'month': months_rus_gen[date_req.month - 1] if date_req is not None else '',
        'year': date_req.year if date_req is not None else '',
    }

    date_to_info = {
        'day': date_to.day if date_to is not None else '',
        'month': months_rus_gen[date_to.month - 1] if date_to is not None else '',
        'year': date_to.year if date_to is not None else '',
    }

    date_change_info = {
        'day': date_change.day if date_change is not None else '',
        'month': months_rus_gen[date_change.month - 1] if date_change is not None else '',
        'year': date_change.year if date_change is not None else '',
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

    # Формируем путь к шаблону заявления.
    vacation_fn = f"{NC_DOC_TEMPLATES_DIR}/заявление_на_отпуск.docx"
    content = await nc.files.download(vacation_fn)
    output = generate_doc(content, context, meta_author=user_displayname, meta_title='Заявление на отпуск', meta_subject='Заявление на отпуск с переносом даты', meta_keywords='заявление,отпуск')

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=\"zayavlenie_{datetime.now().strftime('%Y-%m-%d')}\"",
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
    )


@APP.post("/api/vacation-wp")
async def vacation_wp(data: vacation_wp.Data,
                      nc: typing.Annotated[AsyncNextcloudApp, Depends(anc_app)]):
    user = await nc.user

    # Получаем данные авторизованного пользователя.
    user_info = await nc.users.get_user(user)

    # Получаем данные для шаблона о пользователе.
    user_data = user_info._raw_data
    user_displayname = user_data.get('displayname')
    user_organisation = user_data.get('organisation')
    user_role = user_data.get('role')

    # Проверка и предобработка данных.
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

    # Родительный падеж.
    detector = PetrovichGenderDetector()
    gender = detector.detect(firstname=user_name)
    maker = PetrovichDeclinationMaker()
    user_name_gen = maker.make(NamePart.FIRSTNAME, gender, Case.GENITIVE, user_name.lower()).capitalize()
    user_surname_gen = maker.make(NamePart.LASTNAME, gender, Case.GENITIVE, user_surname.lower()).capitalize()
    user_father_name_gen = maker.make(NamePart.MIDDLENAME, gender, Case.GENITIVE, user_father_name.lower()).capitalize()

    # Обработка данных, полученных от клиента - даты.
    data_payload = data.model_dump()

    # Набор названий месяцев на русском в родительном падеже.
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

    # Дата "С".
    try:
        date_from = datetime.strptime(data_payload.get('date_from'), "%Y-%m-%d")
    except:
        date_from = None

    date_from_info = {
        'day': date_from.day if date_from is not None else '',
        'month': months_rus_gen[date_from.month - 1] if date_from is not None else '',
        'year': date_from.year if date_from is not None else '',
    }

    # Дата "По".
    try:
        date_to = datetime.strptime(data_payload.get('date_to'), "%Y-%m-%d")
    except:
        date_to = None

    date_to_info = {
        'day': date_to.day if date_to is not None else '',
        'month': months_rus_gen[date_to.month - 1] if date_to is not None else '',
        'year': date_to.year if date_to is not None else '',
    }

    # Дата составления.
    try:
        date_req = datetime.strptime(data_payload.get('date_req'), "%Y-%m-%d")
    except:
        date_req = None

    date_req_info = {
        'day': date_req.day if date_req is not None else '',
        'month': months_rus_gen[date_req.month - 1] if date_req is not None else '',
        'year': date_req.year if date_req is not None else '',
    }

    # Набор данных, которые отправим в шаблон документа. Их нужно прописывать в шаблоне.
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
        'date_req': date_req_info
    }

    # Формируем путь к шаблону заявления.
    # Шаблон должен быть расположен в общем каталоге файлов "Шаблоны/Заявления/заявление_на_отпуск_бс.docx"
    vacation_fn = f"{NC_DOC_TEMPLATES_DIR}/заявление_на_отпуск_бс.docx"
    content = await nc.files.download(vacation_fn)
    output = generate_doc(content, context, meta_author=user_displayname, meta_title='Заявление на отпуск', meta_subject='Заявление на отпуск без сохранения заработной платы', meta_keywords='заявление,отпуск')

    # Отправляем ответ клиенту.
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=\"zayavlenie_{datetime.now().strftime('%Y-%m-%d')}\"",
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
    )
