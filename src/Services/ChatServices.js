import axios from 'axios';


const API_BASE_URL = 'http://127.0.0.1:5000'; // Ensure your Flask backend is running here
const axiosConfig = {
    headers: {
        "Content-Type": "application/json",
    },
};

// ✅ Initialize conversation recording
export const initRecordingConversation = async (userId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/init_recording_conversation`, { user_id: userId }, axiosConfig);
        console.log("✅ Recording initialized:", response);
        return response; // Returning full response
    } catch (error) {
        console.error("❌ Error initializing recording:", error.response ? error.response.data : error.message);
        throw error;
    }
};

// ✅ Start chatbot conversation
export const startChat = async (userId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/start_chat`, { user_id: userId }, axiosConfig);
        console.log("✅ Chat started:", response);
        return response; // Returning full response
    } catch (error) {
        console.error("❌ Error starting chat:", error.response ? error.response.data : error.message);
        throw error;
    }
};

// ✅ Handle user's selected option in chat
export const handleChat = async (userId, optionSelected) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/handle_chat`, { user_id: userId, option_selected: optionSelected }, axiosConfig);
        console.log("✅ Chat handled:", response);
        return response; // Returning full response
    } catch (error) {
        console.error("❌ Error handling chat:", error.response ? error.response.data : error.message);
        throw error;
    }
};



export const submitUserDetails = async (userId, userDetails) => {
    console.log("📢 Submitting user details for userId:", userId);

    // ✅ Ensure userDetails is a string in the correct format
    const formattedDetails = `${userDetails.name}, ${userDetails.contact}, ${userDetails.email}`;

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("message", formattedDetails);  // ✅ Backend expects details as a string
    formData.append("location", userDetails.location);
    formData.append("feedback", userDetails.feedback);
    formData.append("serviceType", userDetails.serviceType);

    try {
        const response = await axios.post(`${API_BASE_URL}/submit_details`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        console.log("✅ User details submitted:", response);
        return response;
    } catch (error) {
        console.error("❌ Error submitting user details:", error.response ? error.response.data : error.message);
        throw error;
    }
};


export const submitUserRating = async (userId, rating) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/submit_ratings`, {
            user_id: userId,
            message: rating.toString()  // Convert to string before sending
        }, axiosConfig);


        return response;
    } catch (error) {
        console.error('❌ Error submitting rating:', error.response ? error.response.data : error.message);
        throw error;
    }
};


// ✅ Terminate chatbot session
export const terminateChat = async (userId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/terminate`, { user_id: userId }, axiosConfig);
        console.log("✅ Chat terminated:", response);
        return response; // Returning full response
    } catch (error) {
        console.error("❌ Error terminating chat:", error.message);
        throw error;
    }
};


// ✅ Terminate response handling

export const terminateResponse = async (userId, userResponse) => {
    try {
        console.log("📢 Sending terminate response:", { user_id: userId, response: userResponse });

        const response = await axios.post(`${API_BASE_URL}/terminate_response`, {
            user_id: userId,
            response: userResponse
        }, axiosConfig);

        console.log("✅ Terminate response handled successfully:", response);
        return response;
    } catch (error) {
        console.error("❌ Error handling terminate response:", error.message);
        throw error;
    }
};





// ✅ Submit query
export const submitQuery = async (formData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/submit_query`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log("✅ Query submitted:", response);
        return response;
    } catch (error) {
        console.error("❌ Error submitting query:", error.response ? error.response.data : error.message);
        throw error;
    }
};

// ✅ Submit feedback
export const submitFeedback = async (userId, feedback) => {
    try {
        console.log("📢 Submitting feedback:", feedback);
        const response = await axios.post(
            `${API_BASE_URL}/submit_feedback`,
            { user_id: userId, feedback_details: feedback }, axiosConfig

        );
        console.log("✅ Feedback submitted:", response);
        return response;
    } catch (error) {
        console.error("❌ Error submitting feedback:", error.response ? error.response.data : error.message);
        throw error;
    }
};

