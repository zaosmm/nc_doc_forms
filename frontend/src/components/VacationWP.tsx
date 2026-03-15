import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import "../css/Vacation.css";
import {format} from 'date-fns';
import {vacationWpAPI} from "../services/Api";
import toast from 'react-hot-toast';

const VacationWP: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        startDate: "",
        changeDate: "",
        endDate: "",
        reqDate: format(new Date(), 'yyyy-MM-dd')
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
    };

    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await vacationWpAPI.sendData({
                date_from: formData.startDate,
                date_to: formData.endDate,
                date_req: formData.reqDate,
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
                <h1>Заявление на отпуск без сохранения зарплаты</h1>

                <form className="vacation-form">


                    {/* Период отпуска */}

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
                            disabled={!formData.startDate || !formData.endDate}
                        >
                            Отправить заявление
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VacationWP;