import io

from docx import Document
from docxtpl import DocxTemplate

import io
from docx import Document
from docxtpl import DocxTemplate


def generate_doc(tpl_content, ctx, meta_author='ЗАО СММ', meta_title='Документ', meta_subject='Документ',
                 meta_keywords='документ'):
    # Создаем объект документа.
    doc = DocxTemplate(io.BytesIO(tpl_content))

    # Рендер документа из шаблона и данных.
    doc.render(ctx)

    # Подготовка для передачи документа в ответе клиенту.
    output_docx = io.BytesIO()
    doc.save(output_docx)
    output_docx.seek(0)

    # Читаем документ для установки метаданных
    docx_doc = Document(output_docx)

    # Метаданные документа.
    docx_doc.core_properties.author = meta_author
    docx_doc.core_properties.title = meta_title
    docx_doc.core_properties.subject = meta_subject
    docx_doc.core_properties.keywords = meta_keywords

    # Сохраняем в новый BytesIO
    output = io.BytesIO()
    docx_doc.save(output)
    output.seek(0)

    return output
