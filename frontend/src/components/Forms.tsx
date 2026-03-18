import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Forms.css";

const Forms: React.FC = () => {
        const navigate = useNavigate();

    const forms = [
        { id: "vacation", title: "Заявление на отпуск", path: "/vacation" },
        { id: "vacation-wp", title: "Заявление на отпуск без сохранения зп", path: "/vacation-wp" },
        { id: "business-trip", title: "Служебная записка на командировку", path: "/business-trip" },
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
    };
        return (
        <div className="forms-page">
            <h1>Выберите тип документа</h1>
            <div className="forms-list">
                {forms.map((form) => (
                    <button
                        key={form.id}
                        className="form-button"
                        onClick={() => handleNavigation(form.path)}
                    >
                        {form.title}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Forms;