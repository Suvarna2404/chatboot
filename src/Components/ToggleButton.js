import React from 'react';

const ToggleButton = ({ toggleChatbot }) => {
    return (
        <button className="toggle-chatbot-btn" onClick={toggleChatbot}>💬</button>
    );
};

export default ToggleButton;
