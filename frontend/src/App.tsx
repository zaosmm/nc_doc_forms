import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Forms from './components/Forms'
import Vacation from './components/Vacation'
import {Toaster} from 'react-hot-toast';
import './App.css';

const App: React.FC = () => {
    return (
        <Router basename="/exapps/nc_doc_forms">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                }}
            />

            <Routes>
                <Route path="/" element={<Forms/>}/>
                <Route path="/vacation" element={<Vacation/>}/>
            </Routes>
        </Router>);
}

export default App;
