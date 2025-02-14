import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const OptionsContainer = ({ options = [], handleOptionClick }) => {
    const firstButtonRef = useRef(null);

    useEffect(() => {
        if (options.length > 0 && firstButtonRef.current) {
            firstButtonRef.current.focus();
        }
    }, [options]); // ✅ Trigger focus when options change

    // ✅ Prevent unnecessary rendering
    if (options.length === 0) return null;

    return (
        <div className="options-container">
            <div className="options">
                {options.map((option, index) => (
                    <button
                        key={index}
                        ref={index === 0 ? firstButtonRef : null} // ✅ Auto-focus first button
                        onClick={() => handleOptionClick(option)}
                        className="option-button"
                        aria-label={`Select option ${option}`}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                handleOptionClick(option);
                            }
                        }}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ✅ Add PropTypes for validation
OptionsContainer.propTypes = {
    options: PropTypes.arrayOf(PropTypes.string),
    handleOptionClick: PropTypes.func.isRequired
};

export default OptionsContainer;










// import React from 'react';

// const OptionsContainer = ({ options, handleOptionClick }) => {
//     return (
//         <div className="options-container">
//             {options.length > 0 && (
//                 <div className="options">
//                     {options.map((option, index) => (
//                         <button key={index} onClick={() => handleOptionClick(option)}>{option}</button>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default OptionsContainer;


// import React from 'react';
// import PropTypes from 'prop-types';

// const OptionsContainer = ({ options = [], handleOptionClick }) => {
//     return (
//         <div className="options-container">
//             {options.length > 0 && (
//                 <div className="options">
//                     {options.map((option, index) => (
//                         <button
//                             key={index}
//                             onClick={() => handleOptionClick(option)}
//                             className="option-button"
//                             aria-label={`Select option ${option}`}
//                         >
//                             {option}
//                         </button>
//                     ))}
//                 </div>

//             )}
//         </div>
//     );
// };

// // ✅ Add PropTypes for validation
// OptionsContainer.propTypes = {
//     options: PropTypes.arrayOf(PropTypes.string),
//     handleOptionClick: PropTypes.func.isRequired,
// };

// export default OptionsContainer;
