import React from 'react';

const ChatHeader = ({ terminateChatbot }) => {
    return (
        <div className="chat-header">
            <span className="chat-title">Real Estate Chatbot</span>
            <button className="close-btn" onClick={terminateChatbot}>Close</button>
        </div>
    );
};

export default ChatHeader;
