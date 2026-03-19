import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Vacation.css";
import { format, differenceInDays, parseISO } from 'date-fns';
import { calendarAPI, useCarAPI } from "../services/Api";
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

interface FormData {
    location_from: string;
    location_to: string;
    date_from: string;
    date_to: string;
    date_req: string;
    total_days: number;
    time_hour_from: string;
    time_min_from: string;
    time_hour_to: string;
    time_min_to: string;
    is_private: boolean;
    is_another: boolean;
    car_title: string;
    car_owner: string;
    car_number: string;
}

const BusinessTrip: React.FC = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
    const [showEvents, setShowEvents] = useState<boolean>(false);

    const [formData, setFormData] = useState<FormData>({
        location_from: "Санкт-Петербург",
        location_to: "",
        date_from: "",
        date_to: "",
        date_req: format(new Date(), 'yyyy-MM-dd'),
        total_days: 0,
        time_hour_from: "09",
        time_min_from: "00",
        time_hour_to: "18",
        time_min_to: "00",
        is_private: true,
        is_another: false,
        car_title: "",
        car_owner: "",
        car_number: "",
    });

    // Вычисление total_days
    const calculateTotalDays = (): number => {
        if (formData.date_from && formData.date_to) {
            const start = parseISO(formData.date_from);
            const end = parseISO(formData.date_to);
            return differenceInDays(end, start) + 1;
        }
        return 1;
    };

    // Загрузка событий по требованию
    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            const response = await calendarAPI.getEvents() as CalendarEvent[];
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

    const handleRadioChange = (type: 'private' | 'another') => {
        if (type === 'private') {
            setFormData(prev => ({
                ...prev,
                is_private: true,
                is_another: false
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                is_private: false,
                is_another: true
            }));
        }
    };

    const handleEventSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedSummary = e.target.value;
        if (!selectedSummary) return;

        const selectedEvent = events.find(event => event.summary === selectedSummary);
        if (selectedEvent) {
            setFormData(prev => ({
                ...prev,
                summary: selectedEvent.description || selectedEvent.summary,
                location_to: selectedEvent.location,
                date_from: selectedEvent.start.split(' ')[0],
                date_to: selectedEvent.end.split(' ')[0]
            }));

            toast.success('Данные события загружены');
        }
    };

    const handleSwapLocations = () => {
        setFormData(prev => ({
            ...prev,
            location_from: prev.location_to,
            location_to: prev.location_from
        }));
        toast.success('Города поменяны местами');
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const totalDays = calculateTotalDays();

            const response = await useCarAPI.sendData({
                date_from: formData.date_from,
                date_to: formData.date_to,
                date_req: formData.date_req,
                location_from: formData.location_from,
                location_to: formData.location_to,
                time_hour_from: formData.time_hour_from,
                time_min_from: formData.time_min_from,
                time_hour_to: formData.time_hour_to,
                time_min_to: formData.time_min_to,
                total_days: totalDays,
                is_private: formData.is_private ? "Х" : "",
                is_another: formData.is_another ? "Х" : "",
                car_title: formData.is_private ? formData.car_title : "",
                car_number: formData.is_private ? formData.car_number : "",
                car_owner: formData.is_another ? formData.car_owner : ""
            });

            toast.success('Заявление составлено!');

            const contentDisposition = response.headers?.['content-disposition'];
            let filename = 'zayavlenie.docx';

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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

    return (
        <div className="vacation-page">
            <div className="vacation-container">
                <h1>Командировка</h1>

                <form className="vacation-form">
                    {/* Блок загрузки событий из календаря */}
                    <div className="form-group">
                        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
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
                                    style={{padding: '8px 16px'}}
                                >
                                    Скрыть список
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Выбор события из календаря */}
                    {showEvents && events.length > 0 && (
                        <div className="form-group" style={{marginTop: '10px'}}>
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
                        </div>
                    )}

                    {/* Города с кнопкой обмена */}
                    <div style={{display: 'flex', gap: '10px', alignItems: 'flex-end'}}>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="location_from">Откуда</label>
                            <input
                                type="text"
                                id="location_from"
                                name="location_from"
                                value={formData.location_from}
                                onChange={handleChange}
                                placeholder="Город отправления"
                                className="date-input"
                                required
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleSwapLocations}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginBottom: '5px'
                            }}
                            title="Поменять местами"
                        >
                            ⇄
                        </button>

                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="location_to">Куда</label>
                            <input
                                type="text"
                                id="location_to"
                                name="location_to"
                                value={formData.location_to}
                                onChange={handleChange}
                                placeholder="Город назначения"
                                className="date-input"
                                required
                            />
                        </div>
                    </div>

                    {/* Дата Время отправления */}
                    <div style={{display: 'flex', gap: '10px'}}>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="date_from">Дата отправления</label>
                            <input
                                type="date"
                                id="date_from"
                                name="date_from"
                                value={formData.date_from}
                                onChange={handleChange}
                                className="date-input"
                                required
                            />
                        </div>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="time_hour_from">Час отправления</label>
                            <input
                                type="number"
                                id="time_hour_from"
                                name="time_hour_from"
                                value={formData.time_hour_from}
                                onChange={handleChange}
                                min="0"
                                max="23"
                                className="date-input"
                                required
                            />
                        </div>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="time_min_from">Минуты отправления</label>
                            <input
                                type="number"
                                id="time_min_from"
                                name="time_min_from"
                                value={formData.time_min_from}
                                onChange={handleChange}
                                min="0"
                                max="59"
                                className="date-input"
                                required
                            />
                        </div>
                    </div>


                    {/* Время прибытия */}
                    <div style={{display: 'flex', gap: '10px'}}>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="date_to">Дата прибытия</label>
                            <input
                                type="date"
                                id="date_to"
                                name="date_to"
                                value={formData.date_to}
                                onChange={handleChange}
                                className="date-input"
                                required
                            />
                            {formData.date_from && formData.date_to && (
                                <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
                                    Количество дней: {calculateTotalDays()}
                                </small>
                            )}
                        </div>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="time_hour_to">Час прибытия</label>
                            <input
                                type="number"
                                id="time_hour_to"
                                name="time_hour_to"
                                value={formData.time_hour_to}
                                onChange={handleChange}
                                min="0"
                                max="23"
                                className="date-input"
                                required
                            />
                        </div>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="time_min_to">Минуты прибытия</label>
                            <input
                                type="number"
                                id="time_min_to"
                                name="time_min_to"
                                value={formData.time_min_to}
                                onChange={handleChange}
                                min="0"
                                max="59"
                                className="date-input"
                                required
                            />
                        </div>
                    </div>

                    {/* Радиокнопки для личного/чужого транспорта */}
                    <div className="form-group">
                        <label>Тип транспорта</label>
                        <div style={{display: 'flex', gap: '20px', marginTop: '5px'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <input
                                    type="radio"
                                    checked={formData.is_private}
                                    onChange={() => handleRadioChange('private')}
                                />
                                Личный транспорт
                            </label>
                            <label style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                            <input
                                    type="radio"
                                    checked={formData.is_another}
                                    onChange={() => handleRadioChange('another')}
                                />
                                Чужой транспорт
                            </label>
                        </div>
                    </div>

                    {/* Поля для личного транспорта */}
                    {formData.is_private && (
                        <>
                            <div className="form-group">
                                <label htmlFor="car_title">Марка и модель автомобиля</label>
                                <input
                                    type="text"
                                    id="car_title"
                                    name="car_title"
                                    value={formData.car_title}
                                    onChange={handleChange}
                                    placeholder="Toyota Camry"
                                    className="date-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="car_number">Гос. номер</label>
                                <input
                                    type="text"
                                    id="car_number"
                                    name="car_number"
                                    value={formData.car_number}
                                    onChange={handleChange}
                                    placeholder="Гос. номер"
                                    className="date-input"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Поле для чужого транспорта */}
                    {formData.is_another && (
                        <div className="form-group">
                            <label htmlFor="car_owner">Владелец</label>
                            <input
                                type="text"
                                id="car_owner"
                                name="car_owner"
                                value={formData.car_owner}
                                onChange={handleChange}
                                placeholder="ФИО владельца"
                                className="date-input"
                                required
                            />
                        </div>
                    )}

                    {/* Дата составления */}
                    <div className="form-group">
                        <label htmlFor="date_req">Дата составления</label>
                        <input
                            type="date"
                            id="date_req"
                            name="date_req"
                            value={formData.date_req}
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