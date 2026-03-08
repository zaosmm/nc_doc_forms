import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import "../css/Vacation.css";
import {format} from 'date-fns';
import {vacationAPI} from "../services/Api";
import toast from 'react-hot-toast';

const DayOff: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        vacationType: "annual",
        startDate: "",
        endDate: "",
        reqDate: format(new Date(), 'yyyy-MM-dd')
    });

    const [loading, setLoading] = useState<boolean>(false);

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
                <h1>Отгул</h1>

                <form className="vacation-form">


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
                            disabled={true}
                        >
                            Отправить заявление
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DayOff;