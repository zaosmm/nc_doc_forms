import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import "../css/Vacation.css";
import {format} from 'date-fns';
import {differenceInDays} from 'date-fns';
import {moneyReceiveAPI, calendarAPI} from "../services/Api";
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

interface MoneyReceiveRequest {
    date_req: string;
    total_days: number;
    location: string;
    money_type: string;
    purpose: string;
    total_amount: number;
}

const MoneyReceive: React.FC = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
    const [showEvents, setShowEvents] = useState<boolean>(false);
    const [isBusinessTrip, setIsBusinessTrip] = useState<boolean>(false);
    const [amountDisplay, setAmountDisplay] = useState<string>('');

    const [formData, setFormData] = useState({
        date_req: format(new Date(), 'yyyy-MM-dd'),
        total_days: 0,
        location: "",
        money_type: "наличные",
        purpose: "",
        total_amount: 0
    });

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
        const {name, value} = e.target;

        // Обработка числовых полей
        if (name === 'total_amount') {
            // Ограничиваем до 2 знаков после запятой
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                setFormData(prev => ({
                    ...prev,
                    [name]: Math.round(numValue * 100) / 100
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: 0
                }));
            }
        } else if (name === 'total_days') {
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
                setFormData(prev => ({
                    ...prev,
                    [name]: numValue
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleEventSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedSummary = e.target.value;
        if (!selectedSummary) return;

        const selectedEvent = events.find(event => event.summary === selectedSummary);
        if (selectedEvent) {
            // Вычисляем количество дней командировки
            const startDate = new Date(selectedEvent.start.split(' ')[0]);
            const endDate = new Date(selectedEvent.end.split(' ')[0]);
            const days = differenceInDays(endDate, startDate) + 1; // +1 чтобы включить оба дня

            setFormData(prev => ({
                ...prev,
                location: selectedEvent.location,
                total_days: days
            }));

            // Показываем сообщение о успешной загрузке
            toast.success('Данные командировки загружены');
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const requestData: MoneyReceiveRequest = {
                date_req: formData.date_req,
                total_days: formData.total_days,
                location: formData.location,
                money_type: formData.money_type,
                purpose: formData.purpose,
                total_amount: formData.total_amount
            };

            const response = await moneyReceiveAPI.sendData(requestData);
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

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Заменяем запятую на точку
        let normalizedValue = value.replace(',', '.');

        // Разрешаем пустую строку
        if (normalizedValue === '') {
            setAmountDisplay('');
            setFormData(prev => ({
                ...prev,
                total_amount: 0
            }));
            return;
        }

        // Проверяем формат: цифры и опционально точка с 0-2 цифрами
        const regex = /^\d*\.?\d{0,2}$/;

        if (regex.test(normalizedValue)) {
            setAmountDisplay(normalizedValue);

            // Для сохранения в state парсим только если нет точки в конце
            let numValue = 0;
            if (normalizedValue.endsWith('.')) {
                numValue = parseFloat(normalizedValue.slice(0, -1));
            } else {
                numValue = parseFloat(normalizedValue);
            }

            if (!isNaN(numValue)) {
                setFormData(prev => ({
                    ...prev,
                    total_amount: numValue
                }));
            }
        }
    };

    return (
        <div className="vacation-page">
            <div className="vacation-container">
                <h1>Заявка на получение денежных средств</h1>

                <form className="vacation-form">

                    {/* Тип получения денег */}
                    <div className="form-group">
                        <label htmlFor="money_type">Способ получения</label>
                        <select
                            id="money_type"
                            name="money_type"
                            value={formData.money_type}
                            onChange={handleChange}
                            className="date-input"
                            required
                        >
                            <option value="наличные">Наличные</option>
                            <option value="на р/счет">На расчетный счет</option>
                        </select>
                    </div>

                    {/* Сумма */}
                    <div className="form-group">
                        <label htmlFor="total_amount">Сумма (руб.)</label>
                        <input
                            type="text"
                            id="total_amount"
                            name="total_amount"
                            value={amountDisplay}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            className="date-input"
                            required
                        />
                        <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
                            Введите сумму с двумя знаками после запятой (например: 1500.50)
                        </small>
                    </div>

                    {/* Цель получения */}
                    <div className="form-group">
                        <label htmlFor="purpose">Цель получения</label>
                        <input
                            type="text"
                            id="purpose"
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            placeholder="Укажите цель получения денежных средств"
                            className="date-input"
                            required
                        />
                    </div>
                    {/* Чекбокс "На командировку" */}
                    <div className="form-group">
                        <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <input
                                type="checkbox"
                                checked={isBusinessTrip}
                                onChange={(e) => {
                                    setIsBusinessTrip(e.target.checked);
                                    if (!e.target.checked) {
                                        setShowEvents(false);
                                        setFormData(prev => ({
                                            ...prev,
                                            location: "",
                                            total_days: 0
                                        }));
                                    }
                                }}
                            />
                            На командировку
                        </label>
                    </div>

                    {/* Блок командировки (показывается только если выбран чекбокс) */}
                    {isBusinessTrip && (
                        <>
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
                                        {loadingEvents ? 'Загрузка...' : 'Загрузить командировки из календаря'}
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
                                    <label htmlFor="eventSelect">Выбрать командировку из календаря</label>
                                    <select
                                        id="eventSelect"
                                        onChange={handleEventSelect}
                                        className="date-input"
                                        defaultValue=""
                                    >
                                        <option value="">-- Выберите командировку --</option>
                                        {events.map((event, index) => {
                                            const startDate = event.start.split(' ')[0];
                                            const endDate = event.end.split(' ')[0];
                                            const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
                                            return (
                                                <option key={index} value={event.summary}>
                                                    {event.summary} ({startDate} - {endDate}, {days} дн.)
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
                                        Выберите командировку для автоматического заполнения полей
                                    </small>
                                </div>
                            )}

                            {/* Город командировки */}
                            <div className="form-group">
                                <label htmlFor="location">Город командировки</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Город назначения"
                                    className="date-input"
                                    required={isBusinessTrip}
                                />
                            </div>
                        </>
                    )}

                    {/* Количество дней */}
                    <div className="form-group">
                        <label htmlFor="total_days">На срок (дней)</label>
                        <input
                            type="number"
                            id="total_days"
                            name="total_days"
                            value={formData.total_days}
                            onChange={handleChange}
                            min="1"
                            className="date-input"
                            required={isBusinessTrip}
                        />
                    </div>

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

export default MoneyReceive;