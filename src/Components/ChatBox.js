import React from 'react';

const ChatBox = ({ messages }) => {
    return (
        <div className="chat-box">
            {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}`}>{msg.text}</div>
            ))}
        </div>
    );
};

export default ChatBox;
