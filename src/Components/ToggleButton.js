import React from 'react';
// import logo from '../assets/logo.png'; // Adjust the path based on your project structure
import logo from "../assets/logo.png";


const ToggleButton = ({ toggleChatbot }) => {
    return (
        <button className="toggle-chatbot-btn" onClick={toggleChatbot}>
            <img src={logo} alt="Chatbot Logo" className="logo" />

        </button>
    );
};

export default ToggleButton;
