// import React, { useEffect, useRef } from 'react';
// import './UserInputContainer.css';

// const UserInputContainer = ({
//     currentInputStep,
//     userName, setUserName,
//     userContact, setUserContact,
//     userEmail, setUserEmail,
//     userLocation, setUserLocation,
//     handleUserDetailsSubmit,
//     detailsSubmitted
// }) => {
//     const isDisabled = detailsSubmitted;
//     const inputRef = useRef(null); // ✅ Auto-focus support

//     useEffect(() => {
//         if (inputRef.current) {
//             inputRef.current.focus();
//         }
//     }, [currentInputStep]);

//     // ✅ Get placeholder dynamically
//     const getPlaceholder = () => {
//         switch (currentInputStep) {
//             case "name": return "Enter your name";
//             case "contact": return "Enter your contact number";
//             case "email": return "Enter your email address";
//             case "location": return "Enter your location";
//             default: return "";
//         }
//     };

//     // ✅ Get value dynamically
//     const getValue = () => {
//         switch (currentInputStep) {
//             case "name": return userName;
//             case "contact": return userContact;
//             case "email": return userEmail;
//             case "location": return userLocation;
//             default: return "";
//         }
//     };

//     // ✅ Handle input change dynamically
//     const handleChange = (e) => {
//         const value = e.target.value;
//         switch (currentInputStep) {
//             case "name": setUserName(value); break;
//             case "contact": setUserContact(value); break;
//             case "email": setUserEmail(value); break;
//             case "location": setUserLocation(value); break;
//             default: break;
//         }
//     };

//     // ✅ Allow "Enter" key to submit
//     const handleKeyPress = (e) => {
//         if (e.key === "Enter" && !isDisabled) {
//             handleUserDetailsSubmit();
//         }
//     };



//     return (
//         <div className="user-input-container">
//             {/* ✅ Only show input field when needed */}
//             {currentInputStep === "details" && (
//                 <form onSubmit={(e) => { e.preventDefault(); handleUserDetailsSubmit(); }}>
//                     <input type="text" placeholder="Enter your name" value={userName} onChange={(e) => setUserName(e.target.value)} required />
//                     <input type="tel" placeholder="Enter your contact number" value={userContact} onChange={(e) => setUserContact(e.target.value)} required />
//                     <input type="email" placeholder="Enter your email address" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
//                     <input type="text" placeholder="Enter your location" value={userLocation} onChange={(e) => setUserLocation(e.target.value)} required />
//                     <button type="submit">Submit</button>
//                 </form>
//             )}

//         </div>
//     );
// };

// export default UserInputContainer;


import React, { useEffect, useRef } from 'react';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa'; // Import Icons
import './UserInputContainer.css';

const UserInputContainer = ({
    currentInputStep,
    userName, setUserName,
    userContact, setUserContact,
    userEmail, setUserEmail,
    userLocation, setUserLocation,
    handleUserDetailsSubmit,
    detailsSubmitted
}) => {
    const isDisabled = detailsSubmitted;
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentInputStep]);

    return (
        <div className="chat-form-container">
            {currentInputStep === "details" && (
                <form className="chat-form" onSubmit={(e) => { e.preventDefault(); handleUserDetailsSubmit(); }}>

                    <label>Name*</label>
                    <div className="input-group">
                        <FaUser className="icon" />
                        <input
                            type="text"
                            placeholder="Enter your Name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                        />
                    </div>

                    <label>Mobile Number*</label>
                    <div className="input-group">
                        <FaPhone className="icon" />
                        <input
                            type="tel"
                            placeholder="Enter your Contact Number"
                            value={userContact}
                            onChange={(e) => setUserContact(e.target.value)}
                            required
                        />
                    </div>

                    <label>Email ID*</label>
                    <div className="input-group">
                        <FaEnvelope className="icon" />
                        <input
                            type="email"
                            placeholder="Enter your Email Address"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            required
                        />
                    </div>

                    <label>Location*</label>
                    <div className="input-group">
                        <FaMapMarkerAlt className="icon" />
                        <input
                            type="text"
                            placeholder="Enter your Location"
                            value={userLocation}
                            onChange={(e) => setUserLocation(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="chat-submit-btn" disabled={isDisabled}>
                        Click to Proceed
                    </button>
                </form>
            )}
        </div>
    );
};

export default UserInputContainer;