import atexit 
from flask import Flask, request, jsonify, session
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from flask_session import Session
from flask_cors import CORS
import speech_recognition as sr
import csv
from datetime import datetime, timezone
import os
import time
import pytz
import smtplib
import logging
import re
from io import BytesIO
from flask import send_file


app = Flask(__name__)

# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Correct CORS # ✅ FIX: Allow requests from frontend (localhost:3000) and credentials (cookies, headers)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root@localhost/re_chatbot_db'
#app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://AI_Customer_Service_BM:Arnav%404566@65.20.68.82/AI_Customer_Service_BM'
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SESSION_TYPE'] = 'filesystem'
db = SQLAlchemy(app)
Session(app)

conversation_flow = []

def read_csv(file_name):
    global conversation_flow
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, file_name)
    
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            conversation_flow.append({
                "level": int(row["Level"]),
                "message": row["Message"],
                "options": [option.strip() for option in row["Options"].split(",")]
            })
    return conversation_flow

def get_message(level):
    for item in conversation_flow:
        if item["level"] == level:
            return item["message"]
    return None

def get_options(level):
    for item in conversation_flow:
        if item["level"] == level:
            return item["options"]
    return None

read_csv("re.csv")

recognizer = sr.Recognizer()

class ChatbotData(db.Model):
    __tablename__ = 're_chatbot_data'
    user_id = db.Column(db.String(7), primary_key=True)
    user_name = db.Column(db.String(50), nullable=False, index=True)
    contact = db.Column(db.String(10), index=True)
    email = db.Column(db.String(50), index=True)
    satisfaction_level = db.Column(db.Float)
    total_levels = db.Column(db.Integer)
    session_level = db.Column(db.Integer)
    is_terminated = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())
    userquery = db.Column(db.Text, nullable=True)
    callback_requested = db.Column(db.Boolean, default=False, index=True)
    user_conv_journey_id = db.Column(db.String(7), db.ForeignKey('user_conv_journey.user_conv_journey_id', ondelete='CASCADE'), nullable=True)
    audio_data = db.Column(db.LargeBinary, nullable=True)
    location = db.Column(db.String(150), nullable=True, index=True)  # New column
    feedback_details = db.Column(db.Text, nullable=True)  
    tickets = relationship("TicketsData", cascade="all, delete", backref="chatbot_data")


class UserConvJourney(db.Model):
    __tablename__ = 'user_conv_journey'
    user_conv_journey_id = db.Column(db.String(7), primary_key=True)
    user_conversation = db.Column(db.Text)
    conv_started = db.Column(db.Time)
    conv_ended = db.Column(db.Time)  
    chatbot_data = relationship("ChatbotData", cascade="all, delete", backref="user_conv_journey")


class TicketsData(db.Model):
    __tablename__ = 'tickets_data'
    ticket_id = db.Column(db.String(7), primary_key=True)
    ticket_title = db.Column(db.String(255), nullable=True)
    ticket_created = db.Column(db.DateTime, default=db.func.current_timestamp())
    user_id = db.Column(db.String(7), db.ForeignKey('re_chatbot_data.user_id', ondelete='CASCADE'), nullable=False)
    user_name = db.Column(db.String(50), nullable=True)
    contact = db.Column(db.String(10), nullable=True)
    email = db.Column(db.String(50), nullable=True)
    callback_requested = db.Column(db.Boolean, nullable=True)
    callback_request_resolution_status = db.Column(db.Integer, nullable=True)
    userquery = db.Column(db.Text, nullable=True)
    userquery_resolution_status = db.Column(db.Boolean, nullable=True)
    user_conv_journey_id = db.Column(db.String(7), db.ForeignKey('user_conv_journey.user_conv_journey_id', ondelete='CASCADE'), nullable=True)
    is_ticket_resolved = db.Column(db.Boolean, nullable=True)
    ticket_resolved = db.Column(db.DateTime, nullable=True)
    ticket_starred = db.Column(db.Boolean, nullable=True)
    location = db.Column(db.String(50), nullable=True, index=True)  # New column
    feedback_details = db.Column(db.Text, nullable=True)

    
# Ensure the database tables are created within the application context
with app.app_context():
    db.create_all() 

def append_to_conversation(user_id, message_type, message):
    conv_journey = UserConvJourney.query.filter_by(user_conv_journey_id=user_id).first()
    formatted_message = f"{message_type}: {message}"
    if conv_journey:
        conv_journey.user_conversation += f"\n{formatted_message}"
    else:
        conv_journey = UserConvJourney(user_conv_journey_id=user_id, user_conversation=formatted_message)
    db.session.add(conv_journey)
    db.session.commit()

@app.route('/init_recording_conversation', methods=['POST'])
def init_recording_conversation():
    data = request.get_json()
    user_id = data.get('user_id')

    # Check if user_conv_journey_id already exists in UserConvJourney
    if not UserConvJourney.query.filter_by(user_conv_journey_id=user_id).first():
        conv_journey = UserConvJourney(user_conv_journey_id=user_id, user_conversation="", conv_started=datetime.now(timezone.utc).time())
        db.session.add(conv_journey)
        db.session.commit()
        
        # Add record to re_chatbot_data
        chatbot_data = ChatbotData(
            user_id=user_id,
            user_name="Unknown",
            user_conv_journey_id=user_id
        )
        db.session.add(chatbot_data)
        db.session.commit()
        
        return jsonify({"message": "Conversation journey initialized"}), 200
    else:
        return jsonify({"message": "Conversation journey already exists."}), 400


@app.route('/start_chat', methods=['POST'])
def start_chat():
    user_id = request.json.get('user_id')
    user_data = ChatbotData.query.filter_by(user_id=user_id).first()

    if user_data:  # Returning user can be used in case site reloads at frontend
        print(f"User {user_id} existing session at level {user_data.session_level}")
        
        # Ensure total_levels is initialized
        if user_data.total_levels is None:
            user_data.total_levels = 10  # Set a default value or fetch as needed
            db.session.commit()

        # Ensure session_level is initialized
        if user_data.session_level is None:
            user_data.session_level = 1
            db.session.commit()

        # Check if session_level is less than total_levels
        if user_data.session_level < user_data.total_levels:
            message = get_message(user_data.session_level)  # Ensure the level argument is passed
            options = get_options(user_data.session_level)  # Ensure the level argument is passed
            append_to_conversation(user_id, f"Chatbot: {message}", options)
            
            return jsonify({
                "message": message,
                "options": options
            })
        else:
            session['level'] = 1
            session['details'] = {}
            message = get_message(1)  # Ensure the level argument is passed
            options = get_options(1)  # Ensure the level argument is passed
            append_to_conversation(user_id, f"Chatbot: {message}", options)
            
            return jsonify({
                "message": message,
                "options": options
            })
    else:
        print(f"Creating new session for user {user_id}")
        user_data = ChatbotData(user_id=user_id, user_name='Unknown', session_level=1, total_levels=10)  # Initialize session_level and total_levels
        db.session.add(user_data)
        db.session.commit()

        session['level'] = 1
        session['details'] = {}
        message = get_message(1)  # Ensure the level argument is passed
        options = get_options(1)  # Ensure the level argument is passed
        append_to_conversation(user_id, f"Chatbot: {message}", options)
        
        return jsonify({
            "message": message,
            "options": options
        })
    
@app.route('/handle_chat', methods=['POST'])
def handle_chat():
    data = request.json
    user_id = data.get('user_id')
    option_selected = data.get('option_selected')

    user_data = ChatbotData.query.filter_by(user_id=user_id).first()

    if user_data:
        print(f"User {user_id} selected option: {option_selected}")

        # Get valid options for the current session level
        valid_options = get_options(user_data.session_level)

        # if valid_options and option_selected in valid_options:
        if valid_options and option_selected:

            if user_data.session_level == 1:
                if option_selected == "Pre-Sale":
                    user_data.session_level = 2
                elif option_selected == "Post-Sale":
                    user_data.session_level = 9
            elif user_data.session_level == 2:
                user_data.session_level = 3
            elif user_data.session_level == 3:
                user_data.session_level = 4
            elif user_data.session_level == 4:
                user_data.session_level = 5
            elif user_data.session_level == 5:
                user_data.session_level = 6
            elif user_data.session_level == 6:
                user_data.session_level = 7
            elif user_data.session_level == 7:
                user_data.session_level = 8
            elif user_data.session_level == 8:
                message = "Kindly provide your details to help us provide you the best service."
                append_to_conversation(user_id, f"Chatbot: ", message)
                return jsonify({
                    "message": message
                })
            elif user_data.session_level == 9:
                user_data.session_level = 10
            elif user_data.session_level == 10:
                user_data.session_level = 11
            elif user_data.session_level == 11:
                user_data.session_level = 12
            elif user_data.session_level == 12:
                user_data.session_level = 13
            elif user_data.session_level == 13:
                user_data.session_level = 14
            elif user_data.session_level == 14:
                if option_selected in ["All amenities are functional", "Most amenities are functional"]:
                    message = "Kindly provide your details to help us provide you the best service."
                elif option_selected in ["Few amenities are functional", "None of the amenities are functional"]:
                    message = "Sorry to hear that! We would like to help you out. Please tell us more: "
                append_to_conversation(user_id, f"User: ", option_selected)
                append_to_conversation(user_id, f"Chatbot: ", message)
                return jsonify({
                    "message": message
                })
            else:
                return jsonify({"message": "Invalid session level"}), 400

            db.session.commit()
            append_to_conversation(user_id, f"User: ", option_selected)

            # Get the message and options for the next level
            message = get_message(user_data.session_level)
            options = get_options(user_data.session_level)

            # Append the chatbot response to the conversation history
            append_to_conversation(user_id, f"Chatbot: {message}", options)
            append_to_conversation(user_id, f"User: ", option_selected)

            return jsonify({
                "message": message,
                "options": options
            })
        else:
            return jsonify({"message": "Invalid option selected"}), 400

    else:
        return jsonify({"message": "User not found"}), 404

@app.route('/submit_details', methods=['POST'])
def submit_details():
    data = request.form
    user_id = data.get('user_id')
    user_response = data.get('message', None)
    user_query = data.get('user_query', None)  # taking user_query optionally
    location = data.get('location', None)  # taking location optionally
    audio_data = request.files.get('audio_data')  # Get audio data from form files
    content_type = request.headers.get('Content-Type')

    user_data = ChatbotData.query.filter_by(user_id=user_id).first()

    if not user_data:
        print(f"User {user_id} not found")
        return jsonify({"message": "User not found. Please start a new session."}), 404

    if user_response:
        try:
            details = user_response.split(',')
            if len(details) < 3:
                raise IndexError("Invalid format")
            user_data.user_name = details[0].strip()
            user_data.contact = details[1].strip() if len(details) > 1 else ''
            user_data.email = details[2].strip() if len(details) > 2 else ''
            user_data.session_level = 6

            if location:
                user_data.location = location.strip()

            db.session.commit()
            append_to_conversation(user_id, "User", f"Details provided: {user_response}")
            print(f"User {user_id} provided details")

            # Check if user_query is provided and save it
            if user_query:
                user_data.userquery = user_query.strip()
                db.session.commit()
                append_to_conversation(user_id, "User", f"Query: {user_query}")
                api_response = "Your details have been saved and your query has been registered. Please provide us a rating: "
                append_to_conversation(user_id, "Chatbot", api_response)
                print(f"User {user_id} query saved: {user_query}")  # Debugging
                return jsonify({
                    "message": api_response
                })

            api_response = "Please provide us a rating: "
            append_to_conversation(user_id, "Chatbot", api_response)
            return jsonify({
                "message": api_response
            })
        except IndexError:
            error_message = "Please provide your details in the format: name, contact, email"
            append_to_conversation(user_id, "Chatbot", error_message)
            return jsonify({
                "message": error_message
            }), 406

    # Process audio data if provided
    if content_type and 'multipart/form-data' in content_type and audio_data:
        try:
            user_query = audio_to_text(audio_data.read())  # Assuming this function can handle binary data
            print(f"Extracted text: {user_query}")
            append_to_conversation(user_id, "User", f"Query: {user_query}")
            if user_query:
                user_data.userquery = user_query.strip()
                db.session.commit()
                api_response = "Your details have been saved and your query has been registered. Please provide us a rating: "
                append_to_conversation(user_id, "Chatbot", api_response)
                print(f"User {user_id} query saved: {user_query}")  # Debugging
                return jsonify({
                    "message": api_response
                })
        except Exception as e:
            error_message = f"Error processing audio data: {str(e)}"
            append_to_conversation(user_id, "Chatbot", error_message)
            return jsonify({
                "message": error_message
            }), 500

    return jsonify({"message": "No response provided"}), 400

@app.route('/submit_ratings', methods=['POST'])
def submit_ratings():
    data = request.get_json()
    user_id = data.get('user_id')
    user_response = data.get('message', None)

    user_data = ChatbotData.query.filter_by(user_id=user_id).first()

    if not user_data:
        print(f"User {user_id} not found")
        return jsonify({"message": "User not found. Please start a new session."}), 404

    if user_response:
        try:
            satisfaction_level = float(user_response.strip())
            user_data.satisfaction_level = satisfaction_level
            db.session.commit()
            print(f"User {user_id} provided satisfaction level")
            append_to_conversation(user_id, "User", user_response)
            append_to_conversation(user_id, "Chatbot", "Thank you for your feedback!")
            return jsonify({
                "message": "Thank you for your feedback!"
            })
            
        except ValueError:
            return jsonify({
                "message": "Satisfaction level should be between 0-5 stars"
            })

    return jsonify({"message": "No response provided"}), 400

@app.route('/terminate', methods=['POST'])
def terminate_chat():
    user_id = request.json.get('user_id')  # Assuming user_id is sent in the request
    user_data = ChatbotData.query.filter_by(user_id=user_id).first()

    if user_data:
        print(f"User {user_id} requested to terminate the chat at level {user_data.session_level}")  # Debug: Print termination request
        append_to_conversation(user_id, "User", "I want to end this conversation")
        api_response = "Why are you leaving so soon? Tell our representatives how we can be of help. (Y/N)"
        append_to_conversation(user_id, "Chatbot", api_response )
        return jsonify({
            "message": api_response
        })
    else:
        return jsonify({"message": "User not found"}), 404


def send_email(receiver_email, subject, message):
    email = 'suyashbaoney58@gmail.com'  # 2FA Enabled
    sender_email = email

    # Create the email content
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject

    # Attach the message with UTF-8 encoding
    msg.attach(MIMEText(message, 'plain', 'utf-8'))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, "mqjo bidm utvz cxss")
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        print(f"Email has been sent to {receiver_email}")
    except Exception as e:
        print(f"Failed to send email to {receiver_email}. Error: {str(e)}")


def clean_conversation(conversation):
    # Replace \n with actual new lines
    conversation = conversation.replace('\\n', '\n')
    
    # Remove quotes (both single and double)
    conversation = conversation.replace("'", "").replace('"', "")
    
    # Remove adjacent colons
    conversation = re.sub(r': :', ':', conversation)

    # Remove square brackets
    conversation = conversation.replace('[', '').replace(']', '')

    # Introduce a new line after every message, and add empty line between Chatbot and User input
    cleaned_lines = []
    for line in conversation.split('\n'):
        if line.startswith("Chatbot:") or line.startswith("User:"):
            cleaned_lines.append(line)
            cleaned_lines.append("")  # Add an empty line for spacing
        else:
            # If it's part of options, add it to the previous line with a new line
            if cleaned_lines:
                cleaned_lines[-1] += '\n' + line.strip()
    
    # Join the cleaned lines with new lines
    conversation = '\n'.join(cleaned_lines)
    
    return conversation


@app.route('/terminate_response', methods=['POST'])

def terminate_response():
    user_id = request.json.get('user_id')  # Assuming user_id is sent in the request
    response = request.json.get('response')  # Assuming response is sent in the request
    user_data = ChatbotData.query.filter_by(user_id=user_id).first()
    conv_journey = UserConvJourney.query.filter_by(user_conv_journey_id=user_id).first()
   
    if user_data and conv_journey:
        if response.upper() == "Y":
            append_to_conversation(user_id, "User", response)
            append_to_conversation(user_id, "Chatbot", "Please wait while we reconnect you...")
            message = "Please wait while we reconnect you..."
            response_json = {
                "message": message
            }
        elif response.upper() == "N":
            append_to_conversation(user_id, "User", response)
            message = "Thank you for using our service. Have a great day!"
            response_json = {
                "message": message
            }

            if user_data.userquery or user_data.feedback_details:   #Add condition for feedback 
                # Create a ticket if there is a userquery
                new_ticket = TicketsData(
                    ticket_id=user_id,
                    user_id=user_id,
                    user_name=user_data.user_name,
                    contact=user_data.contact,
                    email=user_data.email,
                    userquery=user_data.userquery,
                    feedback_details=user_data.feedback_details, 
                    user_conv_journey_id=user_id,
                    is_ticket_resolved=False,
                    ticket_starred=False
                )
                
                db.session.add(new_ticket)
                db.session.commit()
                
                user_data.is_terminated = True  # Terminate the conversation
                db.session.commit()  # Commit the termination
                append_to_conversation(user_id, "Chatbot", message)
                response_json["ticket_id"] = user_id  # Return user_id as ticket_id
            else:
                # No ticket created
                user_data.is_terminated = True
                db.session.commit()  # Ensure the change is committed
                append_to_conversation(user_id, "Chatbot", message)
        
        # Send the email regardless of the response or ticket creation
        receiver_email = 'suyashbaoney09041998@gmail.com'
        subject = f'User {user_data.user_name} conversation with ATai Chatbot'
        email_message = clean_conversation(conv_journey.user_conversation)
        send_email(receiver_email, subject, email_message)

        return jsonify(response_json),200

    return jsonify({
        "message": "Invalid response or no session to continue."
    }), 400

def audio_to_text(audio_file):
    try:
        with sr.AudioFile(audio_file) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return text
    except sr.UnknownValueError:
        return "Could not understand the audio."
    except sr.RequestError:
        return "Could not request results from the speech recognition service."


@app.route('/submit_query', methods=['POST'])
def submit_query():
    data = request.form
    user_id = data.get('user_id')
    user_query = data.get('user_query', None)
    audio_data = request.files.get('audio_data', None)  # Get audio data from form files
    content_type = request.headers.get('Content-Type')
    
    try:
        if content_type and 'multipart/form-data' in content_type:
            if audio_data:
                logging.debug("Processing audio data")
                # Convert audio to text directly from the binary data
                user_query = audio_to_text(audio_data.read())  # Assuming this function can handle binary data
                logging.debug(f"Converted audio to text: {user_query}")

        if not user_id:
            logging.error("user_id must be provided")
            return jsonify({"message": "user_id must be provided"}), 400

        logging.debug(f"Appending to conversation: {user_query}")
        append_to_conversation(user_id, "User", f"I have a query: {user_query}")

        chatbot_data = db.session.query(ChatbotData).filter_by(user_id=user_id).first()
        logging.debug(f"chatbot_data fetched: {chatbot_data}")

        if chatbot_data:
            if chatbot_data.is_terminated:
                logging.error("Chat has been terminated")
                return jsonify({"message": "Chat has been terminated. You cannot submit a query"}), 403
            
            if chatbot_data.user_name and chatbot_data.contact and chatbot_data.email:
                chatbot_data.userquery = user_query
                if audio_data:
                    chatbot_data.audio_data = audio_data.read()  # Save audio data in the database
                db.session.commit()
                api_response = "Your query has been received and registered. We'll get back to you soon."
                logging.debug(f"Appending to conversation: {api_response}")
                append_to_conversation(user_id, "Chatbot", api_response)
                return jsonify({"message": api_response}), 200
            else:
                api_response = "Kindly provide your details to help us provide you the best service."
                logging.debug(f"Appending to conversation: {api_response}")
                append_to_conversation(user_id, "Chatbot", api_response)
                return jsonify({"message": api_response}), 200
        else:
            logging.error("User ID not found")
            return jsonify({"message": "User ID not found"}), 404
    
    except Exception as e:
        logging.error(f"Internal server error: {e}")
        db.session.rollback()
        return jsonify({"message": "Internal server error"}), 500

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    user_id = data.get('user_id')
    feedback_details = data.get('feedback_details')

    user_data = ChatbotData.query.filter_by(user_id=user_id).first()

    if not user_data:
        return jsonify({"message": "User not found. Please start a new session."}), 404

    user_data.feedback_details = feedback_details

    # Update the feedback details in the related tickets if any
    tickets = TicketsData.query.filter_by(user_id=user_id).all()
    for ticket in tickets:
        ticket.feedback_details = feedback_details

    db.session.commit()

    return jsonify({"message": "Feedback details have been saved successfully. Provide us your details so we can reach out to you: "}), 200
    #goto /submit_details (send without location)

#For agent/admin dashboard
@app.route('/get_user_conversation', methods=['GET'])
def get_user_conversation():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"message": "User ID is required"}), 400

    conv_journey = UserConvJourney.query.filter_by(user_conv_journey_id=user_id).first()

    if not conv_journey:
        return jsonify({"message": "User conversation not found"}), 404
    
    return jsonify({
        "user_id": user_id,
        "user_conversation": conv_journey.user_conversation
    })


@app.route('/create_ticket', methods=['POST'])
def create_ticket():
    data = request.get_json()
    ticket_id = data.get('ticket_id')
    user_id = data.get('user_id')
    callback_requested = data.get('callback_requested')
    userquery = data.get('userquery')

    user_data = ChatbotData.query.filter_by(user_id=user_id).first()
    conv_journey = UserConvJourney.query.filter_by(user_conv_journey_id=user_id).first()

    if not user_data or not conv_journey:
        return jsonify({"message": "User data or conversation journey not found"}), 404

    new_ticket = TicketsData(
        ticket_id=ticket_id,
        user_id=user_id,
        user_name=user_data.user_name,
        contact=user_data.contact,
        email=user_data.email,
        callback_requested=callback_requested,
        userquery=userquery,
        user_conv_journey_id=user_id,
        is_ticket_resolved=False,
        ticket_starred=False
    )
    
    db.session.add(new_ticket)
    db.session.commit()

    return jsonify({"message": "Ticket created successfully"}), 201


if __name__ == "__main__":
    app.run(debug=True)
