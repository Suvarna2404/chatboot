import React from 'react';


const ChatHeader = ({ handleTerminateChat }) => {
    return (
        <div className="chat-header">
            <span className="chat-title">Ask ATai</span>
            <button className="close-btn" onClick={handleTerminateChat}>
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};

export default ChatHeader;
