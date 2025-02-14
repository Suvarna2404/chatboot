import React, { useState } from 'react';

const RatingContainer = ({ isRatingStep, handleRatingSubmit, ratingSubmitted }) => {
    const [selectedRating, setSelectedRating] = useState(null);

    const handleStarClick = (rating) => {
        if (isRatingStep && !ratingSubmitted) {  // ✅ Allow clicking only when rating is active
            setSelectedRating(rating);
            handleRatingSubmit(rating);
        }
    };

    return (
        isRatingStep && (
            <div className={`rating-container ${ratingSubmitted ? 'disabled' : ''}`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <i
                        key={star}
                        className={`fas fa-star ${selectedRating >= star ? 'selected' : ''} ${ratingSubmitted ? 'disabled' : ''}`}
                        onClick={() => !ratingSubmitted && handleStarClick(star)}

                    ></i>
                ))}
            </div>
        )
    );
};

export default RatingContainer;
