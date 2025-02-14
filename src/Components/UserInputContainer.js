import React, { useEffect, useRef } from 'react';

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
    const inputRef = useRef(null); // ✅ Auto-focus support

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentInputStep]);

    // ✅ Get placeholder dynamically
    const getPlaceholder = () => {
        switch (currentInputStep) {
            case "name": return "Enter your name";
            case "contact": return "Enter your contact number";
            case "email": return "Enter your email address";
            case "location": return "Enter your location";
            default: return "";
        }
    };

    // ✅ Get value dynamically
    const getValue = () => {
        switch (currentInputStep) {
            case "name": return userName;
            case "contact": return userContact;
            case "email": return userEmail;
            case "location": return userLocation;
            default: return "";
        }
    };

    // ✅ Handle input change dynamically
    const handleChange = (e) => {
        const value = e.target.value;
        switch (currentInputStep) {
            case "name": setUserName(value); break;
            case "contact": setUserContact(value); break;
            case "email": setUserEmail(value); break;
            case "location": setUserLocation(value); break;
            default: break;
        }
    };

    // ✅ Allow "Enter" key to submit
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !isDisabled) {
            handleUserDetailsSubmit();
        }
    };

    return (
        <div className="user-input-container">
            {/* ✅ Only show input field when needed */}
            {["name", "contact", "email", "location"].includes(currentInputStep) && (
                <>
                    <input
                        ref={inputRef}
                        type={currentInputStep === "email" ? "email" : "text"}
                        value={getValue()}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}  // ✅ Allow "Enter" key to submit
                        placeholder={getPlaceholder()}
                        disabled={isDisabled}
                        aria-label={getPlaceholder()} // ✅ Accessibility improvement
                    />
                    <button onClick={handleUserDetailsSubmit} disabled={isDisabled}>
                        Submit
                    </button>
                </>
            )}
        </div>
    );
};

export default UserInputContainer;






// import React from 'react';

// const UserInputContainer = ({
//     currentInputStep,
//     userName, setUserName,
//     userContact, setUserContact,
//     userEmail, setUserEmail,
//     userLocation, setUserLocation,
//     handleUserDetailsSubmit,
//     detailsSubmitted,
//     serviceType
// }) => {
//     const isDisabled = detailsSubmitted;

//     const getPlaceholder = () => {
//         switch (currentInputStep) {
//             case "name": return "Enter your name";
//             case "contact": return "Enter your contact number";
//             case "email": return "Enter your email address";
//             case "location": return "Enter your location";
//             default: return "";
//         }
//     };

//     return (
//         <div className="user-input-container">
//             <input
//                 type={currentInputStep === "email" ? "email" : "text"}
//                 value={currentInputStep === "name" ? userName :
//                     currentInputStep === "contact" ? userContact :
//                         currentInputStep === "email" ? userEmail :
//                             currentInputStep === "location" ? userLocation : ""}
//                 onChange={(e) => {
//                     if (currentInputStep === "name") setUserName(e.target.value);
//                     if (currentInputStep === "contact") setUserContact(e.target.value);
//                     if (currentInputStep === "email") setUserEmail(e.target.value);
//                     if (currentInputStep === "location") setUserLocation(e.target.value);
//                 }}
//                 placeholder={getPlaceholder()}
//                 disabled={isDisabled}
//             />
//             <button onClick={handleUserDetailsSubmit} disabled={isDisabled}>Submit</button>
//         </div>
//     );
// };

// export default UserInputContainer;
