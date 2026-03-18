import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Vacation.css";
import { format } from 'date-fns';
import { businessTripAPI } from "../services/Api";
import toast from 'react-hot-toast';

interface CalendarEvent {
    calendar: string;
    summary: string;
    location: string;
    description: string;
    start: string;
    end: string;
    datestamp: string;
}

const BusinessTrip: React.FC = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
    const [isSelf, setIsSelf] = useState<boolean>(false);
    const [showEvents, setShowEvents] = useState<boolean>(false);

    const [formData, setFormData] = useState({
        employee: "",
        location: "",
        organization: "",
        summary: "",
        transport: "ж/д",
        auto_number: "",
        startDate: "",
        endDate: "",
        reqDate: format(new Date(), 'yyyy-MM-dd')
    });

    // Загрузка событий по требованию
    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            const response = await businessTripAPI.getEvents() as CalendarEvent[];
            setEvents(response);
            setShowEvents(true);
            if (response.length === 0) {
                toast.loading('Нет предстоящих событий в календаре');
            }
        } catch (error) {
            console.error('Ошибка загрузки событий:', error);
            toast.error('Не удалось загрузить события из календаря');
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEventSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedSummary = e.target.value;
        if (!selectedSummary) return;

        const selectedEvent = events.find(event => event.summary === selectedSummary);
        if (selectedEvent) {
            setFormData(prev => ({
                ...prev,
                summary: selectedEvent.description || selectedEvent.summary,
                location: selectedEvent.location,
                startDate: selectedEvent.start.split(' ')[0],
                endDate: selectedEvent.end.split(' ')[0]
            }));

            // Показываем сообщение о успешной загрузке
            toast.success('Данные события загружены');
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await businessTripAPI.sendData({
                date_from: formData.startDate,
                date_to: formData.endDate,
                date_req: formData.reqDate,
                employee: isSelf ? 'SELF' : formData.employee,
                location: formData.location,
                organization: formData.organization,
                summary: formData.summary,
                transport: formData.transport,
                auto_number: formData.transport === 'авто' ? formData.auto_number : '',
            });
            toast.success('Заявление составлено!');

            // Получаем имя файла из заголовка Content-Disposition
            const contentDisposition = response.headers?.['content-disposition'];
            let filename = 'zayavlenie.docx'; // имя по умолчанию

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    // Убираем кавычки, если они есть
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            // Создаем URL для blob
            const url = window.URL.createObjectURL(response.data);

            // Создаем временную ссылку для скачивания
            const link = document.createElement('a');
            link.href = url;
            link.download = filename; // имя файла

            // Добавляем ссылку в DOM, кликаем и удаляем
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Очищаем созданный URL
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка:', error);
            toast.error('Ошибка при отправке заявления');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate("/");
    };

    const handleHideEvents = () => {
        setShowEvents(false);
        setEvents([]);
    };

    const showAutoNumber = formData.transport === 'авто';

    return (
        <div className="vacation-page">
            <div className="vacation-container">
                <h1>Командировка</h1>

                <form className="vacation-form">
                    {/* Блок загрузки событий из календаря */}
                    <div className="form-group">
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={fetchEvents}
                                className="btn btn-info"
                                disabled={loadingEvents}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loadingEvents ? 'wait' : 'pointer'
                                }}
                            >
                                {loadingEvents ? 'Загрузка...' : 'Загрузить события из календаря'}
                            </button>

                            {showEvents && events.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleHideEvents}
                                    className="btn btn-secondary"
                                    style={{ padding: '8px 16px' }}
                                >
                                    Скрыть список
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Выбор события из календаря (показывается только после загрузки) */}
                    {showEvents && events.length > 0 && (
                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label htmlFor="eventSelect">Выбрать из календаря</label>
                            <select
                                id="eventSelect"
                                onChange={handleEventSelect}
                                className="date-input"
                                defaultValue=""
                            >
                                <option value="">-- Выберите событие --</option>
                                {events.map((event, index) => (
                                    <option key={index} value={event.summary}>
                                        {event.summary} ({event.start.split(' ')[0]} - {event.end.split(' ')[0]})
                                    </option>
                                ))}
                            </select>
                            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                Выберите событие для автоматического заполнения полей
                            </small>
                        </div>
                    )}

                    {/* Поле сотрудника с галочкой "На себя" */}
                    <div className="form-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label htmlFor="employee">Направить сотрудника (в род. падеже)</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input
                                    type="checkbox"
                                    checked={isSelf}
                                    onChange={(e) => setIsSelf(e.target.checked)}
                                />
                                Составляю на себя
                            </label>
                        </div>
                        {!isSelf && (
                            <input
                                type="text"
                                id="employee"
                                name="employee"
                                value={formData.employee}
                                onChange={handleChange}
                                placeholder="ФИО сотрудника"
                                className="date-input"
                                required={!isSelf}
                            />
                        )}
                    </div>

                    {/* Город */}
                    <div className="form-group">
                        <label htmlFor="location">Город</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Город назначения"
                            className="date-input"
                            required
                        />
                    </div>

                    {/* Организация */}
                    <div className="form-group">
                        <label htmlFor="organization">Организация</label>
                        <input
                            type="text"
                            id="organization"
                            name="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            placeholder="Организация"
                            className="date-input"
                            required
                        />
                    </div>

                    {/* Описание */}
                    <div className="form-group">
                        <label htmlFor="summary">Описание</label>
                        <input
                            type="text"
                            id="summary"
                            name="summary"
                            value={formData.summary}
                            onChange={handleChange}
                            placeholder="Цель командировки"
                            className="date-input"
                            required
                        />
                    </div>

                    {/* Транспорт */}
                    <div className="form-group">
                        <label htmlFor="transport">Транспорт</label>
                        <select
                            id="transport"
                            name="transport"
                            value={formData.transport}
                            onChange={handleChange}
                            className="date-input"
                            required
                        >
                            <option value="ж/д">Ж/Д</option>
                            <option value="авиа">Авиа</option>
                            <option value="авто">Авто</option>
                        </select>
                    </div>

                    {/* Номер автомобиля */}
                    {showAutoNumber && (
                        <div className="form-group">
                            <label htmlFor="auto_number">Номер автомобиля</label>
                            <input
                                type="text"
                                id="auto_number"
                                name="auto_number"
                                value={formData.auto_number}
                                onChange={handleChange}
                                placeholder="А123ВС 777"
                                className="date-input"
                                required
                            />
                        </div>
                    )}

                    {/* Даты командировки */}
                    <div className="form-group">
                        <label htmlFor="startDate">Дата начала</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="date-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="endDate">Дата окончания</label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="date-input"
                            required
                        />
                    </div>

                    {/* Дата составления */}
                    <div className="form-group">
                        <label htmlFor="reqDate">Дата составления</label>
                        <input
                            type="date"
                            id="reqDate"
                            name="reqDate"
                            value={formData.reqDate}
                            onChange={handleChange}
                            required
                            className="date-input"
                        />
                    </div>

                    {/* Кнопки управления */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Отправка...' : 'Отправить заявление'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusinessTrip;