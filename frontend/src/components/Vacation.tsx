import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import "../css/Vacation.css";
import {format} from 'date-fns';
import {vacationAPI} from "../services/Api";
import toast from 'react-hot-toast';

const Vacation: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        vacationType: "annual",
        startDate: "",
        endDate: "",
        reqDate: format(new Date(), 'yyyy-MM-dd')
    });

    const [loading, setLoading] = useState<boolean>(false);

    const vacationTypes = [
        {id: "annual", label: "Ежегодный оплачиваемый отпуск"},
        {id: "unpaid", label: "За свой счет (без сохранения заработной платы)"}
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await vacationAPI.sendData({
                date_from: formData.startDate,
                date_to: formData.endDate,
                date_req: formData.reqDate,
                vacation_type: formData.vacationType,
            });
            toast.success('Заявление составлено!');
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

                <form onSubmit={handleSubmit} className="vacation-form">
                    {/* Тип отпуска */}
                    <div className="form-group">
                        <label htmlFor="vacationType">Тип отпуска *</label>
                        <div className="radio-group">
                            {vacationTypes.map(type => (
                                <label key={type.id} className="radio-label">
                                    <input
                                        type="radio"
                                        name="vacationType"
                                        value={type.id}
                                        checked={formData.vacationType === type.id}
                                        onChange={handleChange}
                                    />
                                    <span className="radio-custom"></span>
                                    {type.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Период отпуска */}
                    <div className="period-group">
                        <div className="form-group">
                            <label htmlFor="startDate">Начало отпуска *</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
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
                            type="submit"
                            className="btn btn-primary"
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

export default Vacation;