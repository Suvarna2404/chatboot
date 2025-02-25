import React, { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import OptionsContainer from './OptionsContainer';
import UserInputContainer from './UserInputContainer';
import RatingContainer from './RatingContainer';
import ToggleButton from './ToggleButton';
import { initRecordingConversation, startChat, handleChat, submitUserDetails, submitUserRating, terminateChat, terminateResponse, submitQuery, submitFeedback } from '../Services/ChatServices';
import './Chat.css';
const ChatContainer = () => {
    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState([]);
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
    const [terminationConfirmed, setTerminationConfirmed] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [isFeedbackEnabled, setIsFeedbackEnabled] = useState(false);
    const [queryText, setQueryText] = useState("");
    const [queryDisabled, setQueryDisabled] = useState(false);
    const [pendingQuery, setPendingQuery] = useState(null); // Store pending query
    const [serviceType, setServiceType] = useState("");
    const [typingMessage, setTypingMessage] = useState(null);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [detailsRequested, setDetailsRequested] = useState(false);
    const icons = {
        user: 'fa fa-user',
        bot: 'fa fa-robot',
    };
    useEffect(() => {
        const chatBox = document.querySelector(".chat-box");
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }, [messages]); // Runs every time a new message is added

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
            resetFormFields();
        }
    };
    const resetFormFields = () => {
        setUserName("");
        setUserContact("");
        setUserEmail("");
        setUserLocation("");
        setDetailsSubmitted(false);
        setCurrentInputStep(null);
        setIsRatingStep(false);
        setRatingSubmitted(false);
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
                    console.log("conversationjourny", chatbotId);
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

    const restartChat = async () => {
        console.log("Restarting Chatbot...");

        // Reset chatbot state completely
        setMessages([]);
        setOptions([]);
        setDetailsRequested(false);
        setIsRatingStep(false);
        setRatingSubmitted(false);
        setDetailsSubmitted(false);
        setTerminationConfirmed(false);
        setIsFeedbackEnabled(false);
        setCurrentInputStep(null);

        // Generate a new chatbot session
        const newId = generateId();
        setChatbotId(newId);
        localStorage.setItem("chatbotId", newId);

        try {
            await initRecordingConversation(newId);
            const startResponse = await startChat(newId);
            displayTypingMessage(startResponse.data.message);
            setOptions(startResponse.data.options || []);
        } catch (error) {
            console.error("Error restarting chatbot:", error);
        }
    };



    const handleTerminateChat = async () => {
        console.log("📢 Requesting termination confirmation...");

        try {
            if (!chatbotId) {
                console.error("chatbotId is not defined.");
                displayTypingMessage("Chat session not found. Please try again later.");
                return;
            }

            const response = await terminateChat(chatbotId);
            console.log("Response from backend:", response);

            if (response?.data?.message) {
                const terminationMessage = response.data.message;
                console.log("Termination Message:", terminationMessage);

                if (!terminationConfirmed) {
                    displayTypingMessage(terminationMessage);
                    setTerminationConfirmed(true);

                    let options = [];
                    if (terminationMessage.includes("(Y/N)")) {
                        options = ["Yes", "No"];
                    } else {
                        console.error("Unexpected termination message format.");
                    }

                    setOptions(options);
                }
            } else {
                displayTypingMessage("Sorry, an error occurred while requesting termination. Please try again later.");
            }
        } catch (error) {
            console.error("❌ Error terminating chat:", error);
            displayTypingMessage("An error occurred while terminating the chat.");
        }
    };
    const handleTerminateResponse = async (userResponse) => {
        try {
            console.log("User selected termination response:", userResponse);

            if (!chatbotId) {
                throw new Error("No active session to terminate.");
            }
            const apiResponse = await terminateResponse(chatbotId, userResponse);
            console.log("Terminate response from backend:", apiResponse);
            if (apiResponse?.data?.message) {
                const responseMessage = apiResponse.data.message;
                console.log("Termination Response:", responseMessage);
                if (responseMessage.includes("Please wait while we reconnect you...")) {
                    displayTypingMessage(responseMessage);
                    setTerminationConfirmed(false); // Reset the termination confirmation state
                    console.log("Reconnection process detected, resetting state.");
                    return;
                }
                if (userResponse === 'N') {
                    displayTypingMessage(responseMessage);
                    setTimeout(() => {
                        setIsOpen(false);
                        setConversation([]);
                        setTerminationConfirmed(false); // Reset the termination confirmation state
                        console.log(" Chatbot has been disabled.");
                    }, 3000);
                } else {
                    displayTypingMessage("Termination process canceled. Please continue with your chat.");
                    setTerminationConfirmed(false); // Reset state as termination is canceled
                }
            } else {
                displayTypingMessage("Unexpected response. Please try again.");
            }
        } catch (error) {
            console.error("❌ Error sending terminate response:", error.message);
            displayTypingMessage("An unexpected error occurred. Please try again later.");
        }
    };
    const displayTypingMessage = (message, optionToShow = [], shouldType = true) => {
        if (!message || message.length === 0) {
            console.warn("displayTypingMessage received an empty or undefined message.");
            return;
        }

        setOptions([]); // ✅ Hide options while chatbot is typing

        if (shouldType) {
            setTypingMessage(message);
            let index = 0;
            const totalLength = message.length;

            setMessages(prev => [...prev, { text: "", sender: 'bot', icon: 'fa fa-robot' }]);

            const interval = setInterval(() => {
                if (index < totalLength) {
                    setMessages(prev => {
                        if (prev.length === 0) return prev;
                        const lastMessage = prev[prev.length - 1];
                        const newText = message.substring(0, index + 1);
                        return [...prev.slice(0, -1), { ...lastMessage, text: newText }];
                    });
                    index++;
                } else {
                    clearInterval(interval);
                    setTypingMessage(null); // ✅ Mark typing as finished

                    // ✅ Show options **ONLY AFTER** chatbot has finished typing
                    if (optionToShow.length > 0) {
                        setTimeout(() => setOptions(optionToShow), 500); // ✅ Delay options slightly (0.5s)
                    }

                    // ✅ If chatbot asks for user details, show form instead of options
                    if (message.includes("Kindly provide your details to help us provide you the best service.")) {
                        setDetailsRequested(true);
                    }
                }
            }, 50); // ✅ Adjust typing speed if needed
        } else {
            setMessages(prev => [...prev, { text: message, sender: 'bot', icon: 'fa fa-robot' }]);

            // ✅ Show options **ONLY AFTER** chatbot has finished typing
            if (optionToShow.length > 0) {
                setTimeout(() => setOptions(optionToShow), 500); // ✅ Delay options slightly (0.5s)
            }

            if (message.includes("Kindly provide your details to help us provide you the best service.")) {
                setDetailsRequested(true);
            }
        }
    };
    // useEffect(() => {
    //     if (isOpen && chatbotId) {
    //         const initializeChat = async () => {
    //             try {
    //                 if (!chatbotId) {
    //                     const newChatbotId = generateId();
    //                     setChatbotId(newChatbotId);
    //                     localStorage.setItem("chatbotId", newChatbotId);
    //                 }
    //                 await initRecordingConversation(chatbotId);
    //                 console.log("conversationjourny", chatbotId);
    //                 const startResponse = await startChat(chatbotId);

    //                 displayTypingMessage(startResponse.data.message);
    //                 setOptions(startResponse.data.options || []);
    //             } catch (error) {
    //                 console.error('Error initializing chatbot:', error);
    //             }
    //         };
    //         initializeChat();
    //     } else {
    //         setMessages([]);
    //         setOptions([]);
    //     }
    // }, [isOpen, chatbotId]);

    // const handleOptionClick = async (option) => {
    //     if (option === 'Yes') {
    //         // Store existing user details
    //         const existingDetails = {
    //             name: userName,
    //             contact: userContact,
    //             email: userEmail,
    //             location: userLocation,
    //             ratingGiven: detailsSubmitted // Checks if rating was already submitted
    //         };

    //         // Reset chatbot state but keep user details & rating
    //         setMessages([]); 
    //         setOptions([]); 
    //         setCurrentInputStep(null);
    //         setIsFeedbackEnabled(false);
    //         setDetailsRequested(false);

    //         // Generate new chatbot session
    //         const newId = generateId();

    //         setChatbotId(newId);
    //         localStorage.setItem("chatbotId", newId);

    //         try {
    //             await initRecordingConversation(newId);
    //             console.log("conversationjourny",chatbotId);
    //             const startResponse = await startChat(newId);

    //             setTimeout(() => {
    //                 displayTypingMessage(startResponse.data.message);
    //                 setOptions(startResponse.data.options || []);
    //             }, 1000);
    //         } catch (error) {
    //             console.error("Error restarting chatbot:", error);
    //         }

    //         // Restore user details & prevent form/rating request again
    //         setUserName(existingDetails.name);
    //         setUserContact(existingDetails.contact);
    //         setUserEmail(existingDetails.email);
    //         setUserLocation(existingDetails.location);
    //         setDetailsSubmitted(existingDetails.ratingGiven); 

    //         return;
    //     }

    //     if (option === 'No') {
    //         await handleTerminateResponse('N');
    //         setOptions([]); 
    //         return;
    //     }

    //     setMessages(prev => [...prev, { text: option, sender: 'user', icon: icons.user }]);
    //     setOptions([]);

    //     try {
    //         const response = await handleChat(chatbotId, option);
    //         displayTypingMessage(response.data.message, response.data.options || []);

    //         if (response.data.options && response.data.options.length > 0) {
    //             setTimeout(() => setOptions(response.data.options), 2000);
    //         }

    //         // Pre-Sale: Ask for user details (Only if not already submitted)
    //         if (!detailsSubmitted && response.data.message.includes("Kindly provide your details to help us provide you the best service.", [], false)) {
    //             setTimeout(() => {
    //                 setDetailsRequested(true);
    //                 setCurrentInputStep("details");
    //             }, 2000);
    //         }

    //         // Post-Sale: Handle amenities functionality responses
    //         if (option === "All amenities are functional" || option === "Most amenities are functional") {
    //             setTimeout(() => {
    //                 if (!detailsSubmitted) { // Skip if already provided
    //                     setCurrentInputStep("name");
    //                     displayTypingMessage("Please enter your Name:");
    //                     setDetailsSubmitted(false);
    //                 }
    //             }, 1200);
    //         } else if (option === "Few amenities are functional" || option === "None of the amenities are functional") {
    //             setTimeout(() => {
    //                 setMessages(prev => [...prev, {
    //                     text: "Sorry to hear that! We would like to help you out. Please tell us more:",
    //                     sender: 'bot',
    //                     icon: icons.bot,
    //                     showFeedbackInput: true,
    //                 }]);
    //                 setIsFeedbackEnabled(true);
    //             }, 2000);
    //         }
    //     } catch (error) {
    //         displayTypingMessage("Error processing your request.");
    //     }
    // };  



    const handleOptionClick = async (option) => {
        if (option === 'Yes') {
            restartChat();  // ✅ Now calling restartChat() properly
            return;
        }

        if (option === 'No') {
            await handleTerminateResponse('N');
            setOptions([]);
            return;
        }

        setMessages(prev => [...prev, { text: option, sender: 'user', icon: icons.user }]);
        setOptions([]);

        try {
            const response = await handleChat(chatbotId, option);
            displayTypingMessage(response.data.message, response.data.options || []);

            if (response.data.options && response.data.options.length > 0) {
                setTimeout(() => setOptions(response.data.options), 2000);
            }

            // ✅ Fix: Prevent chatbot from stopping at "Kindly provide your details"
            if (response.data.message.includes("Kindly provide your details to help us provide you the best service.")) {
                if (!detailsSubmitted) {
                    setTimeout(() => {
                        setDetailsRequested(true);
                        setCurrentInputStep("details");
                    }, 2000);
                } else {
                    setTimeout(() => {
                        displayTypingMessage("Details already provided! Continuing the conversation...");
                        setDetailsRequested(false); // ✅ Prevents chatbot from stopping
                        setTimeout(() => {
                            setOptions(response.data.options || []);
                        }, 1000);
                    }, 2000);
                }
            }

            // Post-Sale: Handle amenities functionality responses
            if (option === "All amenities are functional" || option === "Most amenities are functional") {
                setTimeout(() => {
                    if (!detailsSubmitted) { // Skip if already provided
                        setCurrentInputStep("name");
                        displayTypingMessage("Please enter your Name:");
                        setDetailsSubmitted(false);
                    }
                }, 1200);
            } else if (option === "Few amenities are functional" || option === "None of the amenities are functional") {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        text: "Sorry to hear that! We would like to help you out. Please tell us more:",
                        sender: 'bot',
                        icon: icons.bot,
                        showFeedbackInput: true,
                    }]);
                    setIsFeedbackEnabled(true);
                }, 2000);
            }
        } catch (error) {
            displayTypingMessage("Error processing your request.");
        }
    };



    // const handleUserDetailsSubmit = async () => {
    //     if (detailsSubmitted) return;  // Don't ask again if already submitted

    //     let nextStep = null;

    //     if (currentInputStep === "name") {
    //         if (!/^[A-Za-z\s]+$/.test(userName.trim())) {
    //             displayTypingMessage(" Invalid Name! Please enter a valid name.");
    //             return;
    //         }
    //         setMessages(prev => [...prev, { text: userName, sender: 'user', icon: icons.user }]);
    //         nextStep = "contact";
    //         displayTypingMessage("Please enter your Contact Number:");

    //     } else if (currentInputStep === "contact") {
    //         if (!/^[6-9]\d{9}$/.test(userContact.trim())) {
    //             displayTypingMessage(" Invalid Contact Number! Please enter a valid 10-digit number.");
    //             return;
    //         }
    //         setMessages(prev => [...prev, { text: userContact, sender: 'user', icon: icons.user }]);
    //         nextStep = "email";
    //         displayTypingMessage("Please enter your Email Address:");

    //     } else if (currentInputStep === "email") {
    //         const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|test\.com)$/;

    //         // Block disposable/spam emails
    //         const blockedDomains = ["mailinator.com", "tempmail.com", "10minutemail.com", "example.com"];
    //         const emailDomain = userEmail.trim().split("@")[1]; // Extract domain

    //         if (!emailRegex.test(userEmail.trim())) {
    //             displayTypingMessage("Invalid Email! Only Gmail, Yahoo & Test.com are allowed.");
    //             return;
    //         } else if (blockedDomains.includes(emailDomain)) {
    //             displayTypingMessage(" Disposable or spam emails are not allowed.");
    //             return;
    //         }

    //         // Ensure location is entered for Pre-Sale
    //         if (serviceType === "Pre-Sale" && !userLocation.trim()) {
    //             displayTypingMessage(" Please enter your location before proceeding.");
    //             return;
    //         }

    //         setMessages(prev => [...prev, { text: userEmail, sender: 'user', icon: icons.user }]);

    //         if (serviceType === "Pre-Sale") {
    //             nextStep = "location";
    //             displayTypingMessage("Please enter your Location:");
    //         } else {
    //             await submitDetails();
    //         }
    //     } else if (currentInputStep === "location") {
    //         setMessages(prev => [...prev, { text: userLocation, sender: 'user', icon: icons.user }]);
    //         await submitDetails();
    //     }




    //     setTimeout(() => {
    //         displayTypingMessage("Thank you! Your details have been submitted successfully. 😊");
    //     }, 2000);

    //     // ✅ Ensure the chatbot continues with the next steps
    //     if (!nextStep) {
    //         console.log("Form submitted successfully!");
    //         setDetailsSubmitted(true);  // Mark details as submitted

    //         // ✅ Continue with the chatbot flow: Ask for rating
    //         setTimeout(() => {
    //             setIsRatingStep(true);
    //             displayTypingMessage("Please rate your experience (0-5 stars):");
    //         }, 2000);

    //         // ✅ If a query was pending, submit it after rating
    //         if (pendingQuery) {
    //             setTimeout(async () => {
    //                 displayTypingMessage("Now submitting your query...");
    //                 await handleSubmitQuery(pendingQuery.text);
    //                 setPendingQuery(null); // Clear pending query
    //             }, 3000);
    //         }
    //     }

    //     setCurrentInputStep(nextStep);
    // };


    const handleUserDetailsSubmit = async () => {
        if (detailsSubmitted) return; // Prevent duplicate submissions

        let nextStep = null;

        if (currentInputStep === "name") {
            if (!/^[A-Za-z\s]+$/.test(userName.trim())) {
                displayTypingMessage("Invalid Name! Please enter a valid name.");
                return;
            }
            setMessages(prev => [...prev, { text: userName, sender: 'user', icon: icons.user }]);
            nextStep = "contact";
            displayTypingMessage("Please enter your Contact Number:");

        } else if (currentInputStep === "contact") {
            if (!/^[6-9]\d{9}$/.test(userContact.trim())) {
                displayTypingMessage("Invalid Contact Number! Please enter a valid 10-digit number.");
                return;
            }
            setMessages(prev => [...prev, { text: userContact, sender: 'user', icon: icons.user }]);
            nextStep = "email";
            displayTypingMessage("Please enter your Email Address:");

        } else if (currentInputStep === "email") {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|test\.com)$/;
            const blockedDomains = ["mailinator.com", "tempmail.com", "10minutemail.com", "example.com"];
            const emailDomain = userEmail.trim().split("@")[1];

            if (!emailRegex.test(userEmail.trim())) {
                displayTypingMessage("Invalid Email! Only Gmail, Yahoo & Test.com are allowed.");
                return;
            } else if (blockedDomains.includes(emailDomain)) {
                displayTypingMessage("Disposable or spam emails are not allowed.");
                return;
            }

            if (serviceType === "Pre-Sale" && !userLocation.trim()) {
                displayTypingMessage("Please enter your location before proceeding.");
                return;
            }

            setMessages(prev => [...prev, { text: userEmail, sender: 'user', icon: icons.user }]);

            if (serviceType === "Pre-Sale") {
                nextStep = "location";
                displayTypingMessage("Please enter your Location:");
            } else {
                await submitDetails();
            }
        } else if (currentInputStep === "location") {
            setMessages(prev => [...prev, { text: userLocation, sender: 'user', icon: icons.user }]);
            await submitDetails();
        }

        // ✅ Ensure chatbot prints user details only once
        if (!nextStep) {
            console.log("✅ Form submitted successfully!");
            setDetailsSubmitted(true); // Mark details as submitted

            // ✅ Print user details only once

            displayTypingMessage(
                `Name : ${userName}\n` +
                `Contact : ${userContact}\n` +
                `Email : ${userEmail}\n` +
                `Location : ${userLocation || "N/A"}`, [], false);

            // ✅ Show Thank You Message **after** user details
            setTimeout(() => {
                displayTypingMessage("✅ Thank you! Your details have been submitted successfully. 😊");
            }, 2000);

            // ✅ Ask for rating **AFTER** Thank You Message
            setTimeout(() => {
                setIsRatingStep(true);
                displayTypingMessage("⭐ Please rate your experience (0-5 stars):");
            }, 5000);

            // ✅ If a query was pending, submit it after rating
            if (pendingQuery) {
                setTimeout(async () => {
                    displayTypingMessage("Now submitting your query...");
                    await handleSubmitQuery(pendingQuery.text);
                    setPendingQuery(null);
                }, 7000);
            }
        }

        setCurrentInputStep(nextStep);
    };

    const submitDetails = async () => {
        try {
            const userDetails = {
                name: userName.trim(),
                contact: userContact.trim(),
                email: userEmail.trim(),
                location: serviceType === "Pre-Sale" ? userLocation.trim() : "",
                serviceType: serviceType || "N/A"
            };
            console.log(" Submitting user details:", userDetails);
            const response = await submitUserDetails(chatbotId, userDetails);

            console.log("📩 API Response:", response);

            if (!response || !response.data) {
                console.error("❌ No response data received from API");
                displayTypingMessage("Something went wrong. Please try again.");
                return;
            }

            if (response.data.message) {
                console.log("✅ Printing Thank You message from API", response.data.message);
                displayTypingMessage(response.data.message);
            } else {
                // ✅ Fallback message if backend doesn't return a custom message
                console.log("✅ Printing fallback Thank You message");
                displayTypingMessage("Thank you! Your details have been submitted successfully. 😊");
            }
            setDetailsSubmitted(true); // Keep the form filled, do not reset the fields.
            setIsRatingStep(true);
            setTimeout(() => {
                displayTypingMessage("Please rate your experience (0-5 stars):");
            }, 2000);

            if (pendingQuery) {
                displayTypingMessage(" Now submitting your query...");
                await handleSubmitQuery(pendingQuery.text, pendingQuery.audio);
                setPendingQuery(null); // Clear pending query
            }
        } catch (error) {
            displayTypingMessage("❌ Error submitting details. Please try again.");
        }
    }


    const handleRatingSubmit = async (rating) => {
        if (ratingSubmitted) return;

        console.log("📢 Submitting rating:", rating);

        if (!rating) {
            displayTypingMessage(" Please select a rating before submitting.");
            return;
        }

        setMessages(prev => [...prev, { text: `⭐ ${rating} Stars`, sender: 'user', icon: icons.user }]);

        try {
            const response = await submitUserRating(chatbotId, rating);

            if (response && response.message) {
                displayTypingMessage(response.message);
            }

            // Disable rating after submission
            setIsRatingStep(false);
            setRatingSubmitted(true);

            // Show final thank-you message after rating
            setTimeout(() => {
                displayTypingMessage("Thank you for your feedback! 😊 Have a great day!");
                setTimeout(() => {
                    displayTypingMessage("Would you like to start again?", ["Yes", "No"]);
                }, 2000);
            }, 2000);

        } catch (error) {
            console.error("❌ Error submitting rating:", error);
            displayTypingMessage("Error submitting rating. Please try again.");
        }
    };
    const handleSubmitQuery = async () => {
        if (!queryText || !queryText.trim() === "") {
            displayTypingMessage(" Please enter a valid query before submitting.");
            return;
        }

        //  Ensure user details are provided before query submission
        if (!userName || !userContact || !userEmail) {
            setPendingQuery({ text: queryText }); // Store query
            displayTypingMessage("Please provide your details before submitting a query.");
            setCurrentInputStep("name");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("user_id", chatbotId);
            formData.append("user_query", queryText);
            // if (audioFile) {
            //     formData.append("audio_data", audioFile);
            // }

            setMessages(prev => [...prev, { text: queryText, sender: "user", icon: icons.user }]); //  Show user query
            setQueryText(""); //  Clear input field immediately
            setQueryDisabled(true); //  Disable input field while submitting

            const response = await submitQuery(formData);

            if (response && response.data && response.data.message) {
                displayTypingMessage(response.data.message);
            } else {
                displayTypingMessage(" Query submitted successfully!");
            }

        } catch (error) {
            console.error("❌ Error submitting query:", error);
            displayTypingMessage("❌ Error submitting query. Please try again.");
        }
        // finally {
        //     setQueryDisabled(false); //  Re-enable input after submission
        // }
    };
    const handleSubmitFeedback = async () => {
        if (!feedback.trim()) {
            displayTypingMessage("Please enter some feedback before submitting.");
            return;
        }
        setMessages(prev => [...prev, { text: feedback, sender: 'user', icon: icons.user }]);
        try {
            console.log(" Submitting feedback:", feedback);
            const response = await submitFeedback(chatbotId, feedback);
            const msg = response && response.message
                ? response.message
                : "Feedback details have been saved successfully😊. Provide us your details so we can reach out to you:";
            displayTypingMessage(msg);

            setFeedback("");
            setFeedbackSubmitted(true);
            setIsFeedbackEnabled(false);
            setTimeout(() => {
                setDetailsRequested(true);
                setCurrentInputStep("name");
                displayTypingMessage("Please enter your Name:");
            }, 2000);
        } catch (error) {
            console.error("❌ Error submitting feedback:", error);
            displayTypingMessage("❌ Error submitting feedback. Please try again.");
        }
    };



    return (
        <div className={`chat-container ${isOpen ? 'open' : 'closed'}`}>
            <ToggleButton toggleChatbot={toggleChatbot} />
            {isOpen && (
                <>
                    <ChatHeader handleTerminateChat={handleTerminateChat} />
                    <div className="chat-box">
                        {messages.filter(message => message.text.trim() !== "").map((message, index) => (
                            <React.Fragment key={index}>
                                <div className={`chat-message ${message.sender}`}>
                                    <span className={`icon ${icons[message.sender]}`}></span>
                                    <span className="text">{message.text}</span>
                                </div>
                                {message.showFeedbackInput && isFeedbackEnabled && (
                                    <div className="feedback-container">
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Provide your feedback here..."
                                            disabled={feedbackSubmitted}
                                        />
                                        <button
                                            className="submit-feedback-btn"
                                            onClick={handleSubmitFeedback}
                                            disabled={feedbackSubmitted}
                                        >
                                            Submit Feedback
                                        </button>
                                    </div>
                                )}
                            </React.Fragment>
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
                            disabled={queryDisabled} //Disable when submitting
                        />

                        <i className="fas fa-paper-plane send-icon" onClick={() => handleSubmitQuery(queryText)}></i>
                    </div>

                </>
            )}
            {/* <button className="toggle-chatbot-btn" onClick={toggleChatbot}>
                {isOpen ? 'Open' : 'Open'}
            </button> */}
        </div>
    );
};

export default ChatContainer;