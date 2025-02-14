import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import OptionsContainer from './OptionsContainer';
import UserInputContainer from './UserInputContainer';
import RatingContainer from './RatingContainer';
import ToggleButton from './ToggleButton';
import {
    initRecordingConversation,
    startChat,
    handleChat,
    submitUserDetails,
    submitUserRating,
    terminateChat,
    terminateResponse,
    submitQuery,
    submitFeedback
} from '../Services/ChatServices';
import './Chat.css';

const ChatContainer = () => {
    const [messages, setMessages] = useState([]);
    const [options, setOptions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [chatbotId, setChatbotId] = useState(() => localStorage.getItem("chatbotId") || "");

    const [userName, setUserName] = useState("");
    const [userContact, setUserContact] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userLocation, setUserLocation] = useState("");
    const [currentInputStep, setCurrentInputStep] = useState(null);
    const [isRatingStep, setIsRatingStep] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [detailsSubmitted, setDetailsSubmitted] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [queryText, setQueryText] = useState("");
    const [serviceType, setServiceType] = useState("");
    const [typingMessage, setTypingMessage] = useState(null);
    // const messagesEndRef = useRef(null);
    // // Function to scroll to the bottom
    // const scrollToBottom = () => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // };

    // useEffect(() => {
    //     scrollToBottom(); // Scroll when messages update
    // }, [messages]); // Depend on messages array


    const icons = {
        user: 'fa fa-user',
        bot: 'fa fa-robot',
    };

    const generateId = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let uniqueID = "#";
        for (let i = 0; i < 6; i++) {
            uniqueID += characters[Math.floor(Math.random() * characters.length)];
        }
        return uniqueID;
    };

    const toggleChatbot = async () => {
        if (!isOpen) {
            const newId = generateId();
            setChatbotId(newId);
            localStorage.setItem("chatbotId", newId);
            setIsOpen(true);
        }
    };

    const terminateChatbot = async () => {
        console.log("📢 Requesting termination confirmation...");

        try {
            const terminateApiResponse = await terminateChat(chatbotId);
            displayTypingMessage(terminateApiResponse.data.message);
            setOptions(['Yes', 'No']);// Ask before closing

        } catch (error) {
            displayTypingMessage('An error occurred while terminating the chat.');
            console.error("❌ Error terminating chat:", error);
        }
    };

    const handleTerminateResponse = async (response) => {
        console.log("📢 User selected:", response);
        console.log("🔎 Checking chatbot ID before sending request:", chatbotId);  // Debugging

        try {
            const terminateResponseApiResponse = await terminateResponse(chatbotId, response);

            if (terminateResponseApiResponse.data.message) {
                displayTypingMessage(terminateResponseApiResponse.data.message);
            } else {
                console.warn("⚠️ No valid response received from backend.");
                displayTypingMessage("Unexpected error. Please try again.");
            }

            if (response === 'No') {
                setTimeout(() => {
                    setIsOpen(false);
                    console.log("✅ Chatbot closed automatically.");
                }, 3000);
            }

        } catch (error) {
            console.error('❌ Error handling terminate response:', error);
        }
    };


    // const displayTypingMessage = (message) => {
    //     setTypingMessage(message);

    //     let index = 0;

    //     // ✅ Start with an empty message (to avoid missing words)
    //     setMessages(prev => [...prev, { text: "", sender: 'bot', icon: 'fa fa-robot' }]);

    //     const interval = setInterval(() => {
    //         if (index < message.length) {
    //             setMessages(prev => {
    //                 if (prev.length === 0) return prev; // Avoid errors if messages are empty

    //                 const lastMessage = prev[prev.length - 1];
    //                 const newText = message.substring(0, index + 1); // Get the correct substring

    //                 return [...prev.slice(0, -1), { ...lastMessage, text: newText }];
    //             });

    //             index++;
    //         } else {
    //             clearInterval(interval);
    //             setTypingMessage(null);
    //         }
    //     }, 50); // Adjust typing speed
    // };

    const displayTypingMessage = (message, optionToShow = []) => {
        if (!message || message.length === 0) {
            console.warn("⚠️ displayTypingMessage received an empty or undefined message.");
            return;
        }

        setTypingMessage(message);
        let index = 0;

        setMessages(prev => [...prev, { text: "", sender: 'bot', icon: 'fa fa-robot' }]);

        const interval = setInterval(() => {
            if (index < message.length) {
                setMessages(prev => {
                    if (prev.length === 0) return prev;
                    const lastMessage = prev[prev.length - 1];
                    const newText = message.substring(0, index + 1);
                    return [...prev.slice(0, -1), { ...lastMessage, text: newText }];
                });
                index++;
            } else {
                clearInterval(interval);
                setTypingMessage(null);

                // ✅ Show options after the message fully prints
                if (optionToShow.length > 0) {
                    setTimeout(() => setOptions(optionToShow), 150); // Small delay to ensure smooth UI
                }
            }
        }, 100);
    };


    useEffect(() => {
        if (isOpen && chatbotId) {
            const initializeChat = async () => {
                try {
                    if (!chatbotId) {
                        const newChatbotId = generateId();
                        setChatbotId(newChatbotId);
                        localStorage.setItem("chatbotId", newChatbotId);
                    }
                    await initRecordingConversation(chatbotId);
                    const startResponse = await startChat(chatbotId);
                    displayTypingMessage(startResponse.data.message);
                    setOptions(startResponse.data.options || []);
                } catch (error) {
                    console.error('Error initializing chatbot:', error);
                }
            };
            initializeChat();
        } else {
            setMessages([]);
            setOptions([]);
        }
    }, [isOpen, chatbotId]);

    // const handleOptionClick = async (option) => {
    //     if (option === 'Yes' || option === 'No') {
    //         handleTerminateResponse(option);
    //         return;
    //     }

    //     setServiceType(option);
    //     setMessages(prev => [...prev, { text: option, sender: 'user', icon: icons.user }]);
    //     setOptions([]);
    //     try {
    //         const response = await handleChat(chatbotId, option);
    //         displayTypingMessage(response.data.message);
    //         setOptions(response.data.options || []);

    //         if (response.data.message.includes("Kindly provide your details")) {
    //             setCurrentInputStep("name");
    //             displayTypingMessage("Please enter your Name:");
    //         }
    //     } catch (error) {
    //         displayTypingMessage("Error proccessing your request.");
    //     }
    // };

    const handleOptionClick = async (option) => {
        // ✅ Handle chatbot termination (Yes/No response)
        if (option === 'Yes' || option === 'No') {
            handleTerminateResponse(option);
            return;
        }

        // ✅ Show the user's response in the chat
        setMessages(prev => [...prev, { text: option, sender: 'user', icon: icons.user }]);
        setOptions([]); // Clear options after selection

        try {
            const response = await handleChat(chatbotId, option);
            displayTypingMessage(response.data.message, response.data.options || []);

            if (response.data.options && response.data.options.length > 0) {
                setTimeout(() => setOptions(response.data.options), 1000);
                // setOptions(response.data.options);
            }

            // ✅ Pre-Sale: Ask for user details
            if (response.data.message.includes("Kindly provide your details")) {
                setTimeout(() => {
                    setCurrentInputStep("name");
                    displayTypingMessage("Please enter your Name:");
                }, 1200);
            }

            // ✅ Post-Sale: Handle amenities functionality responses
            if (option === "All amenities are functional" || option === "Most amenities are functional") {
                // Skip feedback, go directly to user details
                setTimeout(() => {
                    setCurrentInputStep("name");
                    displayTypingMessage("Please enter your Name:");
                }, 1200);

            } else if (option === "Few amenities are functional" || option === "None of the amenities are functional") {
                // Ask for feedback first
                setTimeout(() => {
                    setMessages(prev => [...prev, { text: "Please provide your feedback on the amenities.", sender: 'bot', icon: icons.bot }]);
                    setCurrentInputStep("feedback");
                }, 1200);
            }

        } catch (error) {
            displayTypingMessage("Error processing your request.");
        }
    };



    // const handleUserDetailsSubmit = async () => {
    //     let nextStep = null;//Track the next input step

    //     if (currentInputStep === "name") {
    //         setMessages(prev => [...prev, { text: userName, sender: 'user', icon: icons.user }]);
    //         nextStep = "contact";
    //         // setCurrentInputStep("contact");
    //         displayTypingMessage("Please enter your Contact Number:");

    //     } else if (currentInputStep === "contact") {
    //         setMessages(prev => [...prev, { text: userContact, sender: 'user', icon: icons.user }]);
    //         nextStep = "email";
    //         // setCurrentInputStep("email");
    //         displayTypingMessage("Please enter your Email Address:");

    //     } else if (currentInputStep === "email") {
    //         setMessages(prev => [...prev, { text: userEmail, sender: 'user', icon: icons.user }]);
    //         // ✅ Only ask for location if the user selected "Pre-Sale"
    //         if (serviceType === "Pre-Sale") {
    //             nextStep = "location";
    //             // setCurrentInputStep("location");
    //             displayTypingMessage("Please enter your Location:");
    //         } else {
    //             await submitDetails();
    //         }

    //     } else if (currentInputStep === "location") {
    //         setMessages(prev => [...prev, { text: userLocation, sender: 'user', icon: icons.user }]);
    //         await submitDetails();
    //     }
    //     setCurrentInputStep(nextStep);
    // };

    // const submitDetails = async () => {
    //     try {
    //         const details = `${userName}, ${userContact}, ${userEmail}, ${serviceType === "Pre-Sale" ? userLocation : ""}`;
    //         const response = await submitUserDetails(chatbotId, details);
    //         displayTypingMessage(response.data.message);
    //         setDetailsSubmitted(true);
    //         setIsRatingStep(true);
    //         displayTypingMessage("Thank you! Your details have been submitted. 😊");
    //         displayTypingMessage("Please rate your experience (0-5 stars):");
    //     } catch (error) {
    //         displayTypingMessage("Error submitting details.");
    //     }
    // };

    const handleUserDetailsSubmit = async () => {
        let nextStep = null; // Track the next input step

        // if (currentInputStep === "feedback") {
        //     // ✅ Show user feedback in chat
        //     setMessages(prev => [...prev, { text: feedback, sender: 'user', icon: icons.user }]);

        //     // ✅ Move to user details after feedback
        //     nextStep = "name";
        //     displayTypingMessage("Please enter your Name:");
        // }

        if (currentInputStep === "name") {
            const nameRegex = /^[A-Za-z\s]+$/; // ✅ Only letters & spaces allowed
            if (!nameRegex.test(userName.trim())) {
                displayTypingMessage("⚠️ Invalid Name! Please enter a valid name (letters only).");
                return;
            }
            setMessages(prev => [...prev, { text: userName, sender: 'user', icon: icons.user }]);
            nextStep = "contact";
            displayTypingMessage("Please enter your Contact Number:");

        } else if (currentInputStep === "contact") {
            const phoneRegex = /^[6-9]\d{9}$/; // ✅ Valid Indian 10-digit number (starts with 6-9)
            if (!phoneRegex.test(userContact.trim())) {
                displayTypingMessage("⚠️ Invalid Contact Number! Please enter a valid 10-digit number.");
                return;
            }
            setMessages(prev => [...prev, { text: userContact, sender: 'user', icon: icons.user }]);
            nextStep = "email";
            displayTypingMessage("Please enter your Email Address:");

        } else if (currentInputStep === "email") {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|test\.com)$/; // ✅ Only Gmail & Test.com allowed
            if (!emailRegex.test(userEmail.trim())) {
                displayTypingMessage("⚠️ Invalid Email! Only Gmail & Test.com are allowed.");
                return;
            }
            setMessages(prev => [...prev, { text: userEmail, sender: 'user', icon: icons.user }]);

            if (serviceType === "Pre-Sale") {
                // ✅ Pre-Sale: Ask for location
                nextStep = "location";
                displayTypingMessage("Please enter your Location:");
            } else {
                await submitDetails();
            }

        } else if (currentInputStep === "location") {
            setMessages(prev => [...prev, { text: userLocation, sender: 'user', icon: icons.user }]);
            await submitDetails();
        }

        setCurrentInputStep(nextStep);
    };

    const submitDetails = async () => {
        try {
            const userDetails = {
                name: userName.trim(),
                contact: userContact.trim(),
                email: userEmail.trim(),
                location: serviceType === "Pre-Sale" ? userLocation.trim() : "N/A",
                feedback: feedback.trim() || "N/A",
                serviceType: serviceType || "N/A" // Ensure serviceType is always provided
            };

            console.log("📢 Submitting user details:", userDetails);

            const response = await submitUserDetails(chatbotId, userDetails);
            // if (response && response.data)
            displayTypingMessage(response.data.message);
            // ✅ If the backend also sends the rating request message
            // if (response.data.ratingMessage) {
            //     displayTypingMessage(response.data.ratingMessage);
            setDetailsSubmitted(true);
            setIsRatingStep(true);


            displayTypingMessage("Please rate your experience (0-5 stars):");
            // setIsRatingStep(true);



            // // Move to rating step
            // setIsRatingStep(true);
            // displayTypingMessage("Thank you! Your details have been submitted. 😊");
            // displayTypingMessage("Please rate your experience (0-5 stars):");

        } catch (error) {
            console.error("❌ Error submitting details:", error);
            displayTypingMessage("Error submitting details. Please try again.");
        }
    };


    // const submitDetails = async () => {
    //     try {
    //         // ✅ Prepare user details (Include location for Pre-Sale)
    //         const userDetails = {
    //             name: userName,
    //             contact: userContact,
    //             email: userEmail,
    //             location: serviceType === "Pre-Sale" ? userLocation : "N/A",
    //             feedback: serviceType === "Post-Sale" ? feedback : "",
    //             serviceType
    //         };

    //         console.log("📢 Submitting user details:", { userDetails });

    //         const response = await submitUserDetails(chatbotId, userDetails);

    //         displayTypingMessage(response.data.message);
    //         setDetailsSubmitted(true);
    //         if (serviceType === "Post-Sale") {
    //             // ✅ If feedback was given, submit feedback before rating
    //             displayTypingMessage("Thank you for your feedback! 😊");
    //         }

    //         // ✅ Move to rating step
    //         setIsRatingStep(true);
    //         displayTypingMessage("Thank you! Your details have been submitted. 😊");
    //         displayTypingMessage("Please rate your experience (0-5 stars):");

    //     } catch (error) {
    //         displayTypingMessage("Error submitting details.");
    //     }
    // };


    const handleRatingSubmit = async (rating) => {
        console.log("📢 Submitting rating:", rating); // ✅ Debugging

        if (!rating) {
            displayTypingMessage("⚠️ Please select a rating before submitting.");
            return;
        }

        setMessages(prev => [...prev, { text: `⭐ ${rating} Stars`, sender: 'user', icon: icons.user }]);

        try {
            const response = await submitUserRating(chatbotId, rating);

            if (response && response.message) {
                displayTypingMessage(response.message);
            } else {
                displayTypingMessage("✅ Rating submitted successfully!");
            }

            // ✅ Disable rating after submission
            setIsRatingStep(false);
            setRatingSubmitted(true);

        } catch (error) {
            console.error("❌ Error submitting rating:", error);
            displayTypingMessage("Error submitting rating. Please try again.");
        }
    };


    const handleSubmitQuery = async (queryText, audioFile) => {
        if (!userName || !userContact || !userEmail) {
            displayTypingMessage("Please provide your details before submitting a query.");
            setCurrentInputStep("name");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("user_id", chatbotId);
            formData.append("user_query", queryText);
            formData.append("audio_data", audioFile);

            const response = await submitQuery(formData);
            displayTypingMessage(response.data.message);
            setQueryText("");
        } catch (error) {
            displayTypingMessage("Error submitting query.");
        }
    };



    const handleSubmitFeedback = async () => {
        if (!feedback.trim()) {
            displayTypingMessage("⚠️ Please enter some feedback before submitting.");
            return;
        }

        try {
            console.log("📢 Submitting feedback:", feedback);

            const response = await submitFeedback(chatbotId, feedback);

            // ✅ Show backend message, or fallback to default
            if (response.message) {
                displayTypingMessage(response.message);
            } else {
                displayTypingMessage("Thank you for your feedback! 😊");
            }

            // ✅ Clear feedback field after submission
            setFeedback("");

        } catch (error) {
            console.error("❌ Error submitting feedback:", error);
            displayTypingMessage("❌ Error submitting feedback. Please try again.");
        }
    };


    return (
        <div className={`chat-container ${isOpen ? 'open' : 'closed'}`}>
            {isOpen && (
                <>
                    <ChatHeader terminateChatbot={terminateChatbot} />

                    <div className="chat-box">
                        {messages.map((message, index) => (
                            <div key={index} className={`chat-message ${message.sender}`}>
                                <span className={`icon ${icons[message.sender]}`}></span>
                                <span className="text">{message.text}</span>
                            </div>
                        ))}
                    </div>
                    <OptionsContainer options={options} handleOptionClick={handleOptionClick} />
                    <UserInputContainer
                        currentInputStep={currentInputStep}
                        userName={userName}
                        setUserName={setUserName}
                        userContact={userContact}
                        setUserContact={setUserContact}
                        userEmail={userEmail}
                        setUserEmail={setUserEmail}
                        userLocation={userLocation}
                        setUserLocation={setUserLocation}
                        handleUserDetailsSubmit={handleUserDetailsSubmit}
                        detailsSubmitted={detailsSubmitted}
                    />
                    <RatingContainer
                        isRatingStep={isRatingStep}
                        handleRatingSubmit={handleRatingSubmit}
                        ratingSubmitted={ratingSubmitted}
                    />
                    <div className="query-container">
                        <input
                            type="text"
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            placeholder="Type your query..."
                        />
                        <i className="fas fa-microphone mic-icon"></i>
                        <i className="fas fa-paper-plane send-icon" onClick={() => handleSubmitQuery(queryText)}></i>
                    </div>
                    <div className="feedback-container">
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Provide your feedback here..."
                        />
                        <button className="submit-feedback-btn" onClick={handleSubmitFeedback}>
                            Submit Feedback
                        </button>
                    </div>
                </>
            )}
            <button className="toggle-chatbot-btn" onClick={toggleChatbot}>
                {isOpen ? 'Close' : 'Open'}
            </button>
        </div>
    );
};

export default ChatContainer;
