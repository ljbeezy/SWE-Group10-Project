HealthMe - Full-Stack Telehealth Platform

HealthMe is a comprehensive web application that simulates a modern telehealth service. It connects patients with doctors, allowing them to schedule appointments, log symptoms, chat securely, and conduct real-time video consultations.

This project is built with a Node.js/Express/MongoDB backend and a Vanilla JavaScript frontend, organized into two main single-page applications (SPAs) for patients and doctors.

Key Features

    Role-Based Authentication: Separate registration and login flows for "Patient" and "Doctor" roles, secured with JWT.

    Patient Dashboard: A central hub for patients to manage all their health activities.

    Doctor Dashboard: A professional interface for doctors to manage their patient load, appointments, and messages.

    Symptom Logging & History: Patients can log daily symptoms, and this history is viewable by both the patient and their doctor.

    Appointment Scheduling: Patients can browse a list of doctors and schedule appointments. Doctors can view their upcoming schedules.

    Secure Two-Way Messaging: A full-featured, real-time chat system for patients and doctors to communicate securely.

    Find a Doctor: A patient-facing directory to browse available doctors and initiate the booking process.

    AI Symptom Analysis: An integrated tool (using OpenAI) for both patients and doctors to get an AI-powered analysis of a set of symptoms.

    AI ChatBot: A conversational AI assistant for patients to ask general health questions, complete with conversation history.

    Video Consultations: Real-time video/voice chat integration (using the Twilio Video SDK) for virtual appointments.

Tech Stack

Backend

    Runtime: Node.js

    Framework: Express.js

    Database: MongoDB (with Mongoose)

    Authentication: JSON Web Tokens (JWT) & bcrypt

    Services:

        OpenAI API (for AI Analysis & ChatBot)

        Twilio Video API (for Video Chat)

Frontend

    Core: HTML5, CSS3, Vanilla JavaScript (ES6+)

    Structure: Organized as two Single-Page Applications (SPAs) for each user role.

Project Setup

1. Backend Setup (healthme-backend)

    Navigate to the backend folder:
    Bash

cd healthme-backend

Install all required dependencies:
Bash

npm install

Create a .env file in the healthme-backend root. This is required for the app to run.
Code snippet

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key_for_jwt

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_API_KEY_SID=your_twilio_api_key_sid
TWILIO_API_KEY_SECRET=your_twilio_api_key_secret

Start the backend server:
Bash

    node index.js

    The server should now be running on http://localhost:3000.

2. Frontend Setup (healthme-frontend)

    The frontend is built with static files and requires no build step.

    You must serve the files from a local server. The easiest way is to use the Live Server extension in VS Code.

    Right-click the healthme-frontend/index.html file and select "Open with Live Server".

    The application will open, and you can register a new patient and doctor to test.

API Endpoints

Auth

    POST /api/auth/register: Register a new user (patient or doctor).

    POST /api/auth/login: Log in a user and receive a JWT.

    GET /api/auth/user: Get the logged-in user's details.

Patient

    POST /api/patient/symptoms: Log new symptoms.

    GET /api/patient/symptoms: Get symptom history for the logged-in patient.

    POST /api/patient/appointments: Schedule a new appointment.

    GET /api/patient/appointments: Get appointment history for the logged-in patient.

    POST /api/patient/messages: Send a new message to a doctor.

    GET /api/patient/messages: Get message history for the logged-in patient.

    GET /api/patient/doctors: Get a list of all doctors.

Doctor

    GET /api/doctor/patients: Get a list of all registered patients.

    GET /api/doctor/patients/:patientId/symptoms: Get symptom history for a specific patient.

    GET /api/doctor/appointments: Get all appointments for the logged-in doctor.

    GET /api/doctor/messages: Get all messages for the logged-in doctor.

    POST /api/doctor/reply: Send a reply to a patient.

    GET /api/doctor/doctors: Get a list of all doctors.

AI

    POST /api/ai/analyze: Send a string of symptoms for AI analysis.

    POST /api/ai/chat: Send a prompt and conversation history to the AI ChatBot.

Video

    POST /api/video/token: Get a Twilio video access token for a specific room.
