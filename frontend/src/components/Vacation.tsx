import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import "../css/Vacation.css";
import {format} from 'date-fns';
import {vacationAPI} from "../services/Api";
import toast from 'react-hot-toast';

const Vacation: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        orderTypeIsVacation: false,
        orderTypeIsChange: false,
        startDate: "",
        changeDate: "",
        endDate: "",
        yearPeriod: format(new Date(), 'yyyy'),
        reqDate: format(new Date(), 'yyyy-MM-dd')
    });

    const [loading, setLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        if (name === 'orderTypeIsChange') {
            let newVal = !formData.orderTypeIsChange
            setFormData(prev => ({
                ...prev,
                [name]: newVal
            }));
        } else if (name === 'orderTypeIsVacation') {
            let newVal = !formData.orderTypeIsVacation
            setFormData(prev => ({
                ...prev,
                [name]: newVal
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await vacationAPI.sendData({
                date_from: formData.startDate,
                date_to: formData.endDate,
                date_req: formData.reqDate,
                order_type_is_vacation: formData.orderTypeIsVacation,
                order_type_is_change: formData.orderTypeIsChange,
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
            const contentType = response.headers?.['content-type'] ||
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            // Создаем blob из полученных данных
            const blob = new Blob([response.data], {type: contentType});

            // Создаем URL для blob
            const url = window.URL.createObjectURL(blob);

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
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate("/");
    };

    return (
        <div className="vacation-page">
            <div className="vacation-container">
                <h1>Заявление на отпуск</h1>

                <form className="vacation-form">
                    {/* Тип отпуска */}
                    <div className="form-group">
                        <label htmlFor="vacationType">Тип заявления *</label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="orderTypeIsVacation"  // Теперь разные name
                                checked={formData.orderTypeIsVacation}
                                onChange={handleChange}  // Используем специальный обработчик
                            />
                            <span className="checkbox-custom"></span>
                            Ежегодный оплачиваемый отпуск
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="orderTypeIsChange"  // Исправлено name
                                checked={formData.orderTypeIsChange}
                                onChange={handleChange}  // Тот же обработчик
                            />
                            <span className="checkbox-custom"></span>
                            Перенос отпуска
                        </label>
                    </div>

                    {/* Перенос отпуска */}
                    {formData.orderTypeIsChange && (
                        <div className="change-group">
                            <div className="form-group">
                                <label htmlFor="changeDate">Перенести на дату *</label>
                                <input
                                    type="date"
                                    id="changeDate"
                                    name="changeDate"
                                    value={formData.changeDate}
                                    onChange={handleChange}
                                    required
                                    className="date-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="yearPeriod">Период отпуска *</label>
                                <input
                                    type="number"
                                    id="yearPeriod"
                                    name="yearPeriod"
                                    value={formData.yearPeriod}
                                    onChange={handleChange}
                                    required
                                    min={format(new Date(), 'yyyy')}
                                    className="date-input"
                                />
                            </div>
                        </div>
                    )}

                    {/* Период отпуска */}
                    {formData.orderTypeIsVacation && (
                        <div className="period-group">
                            <div className="form-group">
                                <label htmlFor="startDate">Начало отпуска *</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    required
                                    onChange={handleChange}
                                    className="date-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="endDate">Окончание отпуска *</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                    min={formData.startDate}
                                    className="date-input"
                                />
                            </div>
                        </div>
                    )}

                    {/* Информация о длительности */}
                    {formData.startDate && formData.endDate && (
                        <div className="duration-info">
                            <p>
                                Длительность отпуска: {
                                Math.ceil(
                                    (new Date(formData.endDate).getTime() -
                                        new Date(formData.startDate).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                ) + 1
                            } дней
                            </p>
                        </div>
                    )}


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
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={!formData.orderTypeIsVacation && !formData.orderTypeIsChange}
                        >
                            Отправить заявление
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Vacation;