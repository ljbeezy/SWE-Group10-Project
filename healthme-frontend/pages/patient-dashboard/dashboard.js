// --- Element Selectors ---
let doctorSelect;
let messageDoctorSelect;
let appointmentForm;
let messageForm;
let symptomForm;
let symptomHistoryElement;
let userEmailElement;
let logoutButton;
let navLinks;
let sections;

// -- Appointments --
let appointmentsHistoryContainer;

// -- Message Viewer --
let messageHistoryContainer;
let messageMessage;

// -- AI Analysis --
let aiFormPatient;
let aiSymptomsInputPatient;
let aiResultPatient;

// -- Find a Doctor --
let doctorListContainer;

// -- ChatBot --
let chatbotHistory;
let chatbotForm;
let chatbotInput;
let patientChatHistory = []; // Stores the conversation

// -- Video Chat --
let joinVideoBtn;
let leaveVideoBtn;
let videoRoomName;
let localVideo;
let remoteVideo;
let activeRoom;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Standard Elements
    doctorSelect = document.getElementById('doctor-select');
    messageDoctorSelect = document.getElementById('message-doctor-select');
    appointmentForm = document.getElementById('appointment-form');
    messageForm = document.getElementById('message-form');
    symptomForm = document.getElementById('symptom-form');
    symptomHistoryElement = document.getElementById('symptom-history-container');
    userEmailElement = document.getElementById('user-email');
    logoutButton = document.getElementById('logout-button');
    navLinks = document.querySelectorAll('.nav-link');
    sections = document.querySelectorAll('.section');
    

    // Message Viewer
    messageHistoryContainer = document.getElementById('message-history-container');
    messageMessage = document.getElementById('message-message');

    // AI Analysis
    aiFormPatient = document.getElementById('ai-form-patient');
    aiSymptomsInputPatient = document.getElementById('symptoms-input-patient');
    aiResultPatient = document.getElementById('ai-result-patient');

    // Appointments History
    appointmentsHistoryContainer = document.getElementById('appointments-history-container');

    // Find a Doctor
    doctorListContainer = document.getElementById('doctor-list-container');

    // ChatBot
    chatbotHistory = document.getElementById('chatbot-history');
    chatbotForm = document.getElementById('chatbot-form');
    chatbotInput = document.getElementById('chatbot-input');

    // Video Chat
    joinVideoBtn = document.getElementById('join-video-btn');
    leaveVideoBtn = document.getElementById('leave-video-btn');
    videoRoomName = document.getElementById('video-room-name');
    localVideo = document.getElementById('local-video');
    remoteVideo = document.getElementById('remote-video');
    
    // --- Start Application ---
    populateUserDetails();
    populateDoctors();
    setupNavigation();
    initializeNavigation();
    setupFormHandlers();
});

// --- Navigation ---
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            
            navLinks.forEach(l => {
                l.classList.remove('active');
            });
            
            link.classList.add('active');
            
            showSection(sectionId);
        });
    });
}

function showSection(sectionId) {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    
    // Fetch data for the section that is being shown
    if (sectionId === 'symptom-history') {
        fetchSymptomHistory();
    }
    if (sectionId === 'appointments') {
        fetchPatientAppointments();
    }
    if (sectionId === 'messages') {
        fetchPatientMessages();
    }
    if (sectionId === 'find-doctor') {
        fetchAndDisplayDoctors();
    }
    if (sectionId === 'chatbot') {
        // Clear history and prime with a welcome message
        patientChatHistory = [];
        chatbotHistory.innerHTML = ''; // Clear old messages
        // Use the new, simple chatbot helper
        appendChatMessage('Hello! I am HealthMe Bot. How can I help you today? Remember, I am not a real doctor.', 'bot');
    }
}

function initializeNavigation() {
    // Show the "Log Symptom" section by default
    const defaultSection = 'log-symptom';
    document.querySelector('.nav-link.active')?.classList.remove('active');
    document.querySelector(`[data-section="${defaultSection}"]`)?.classList.add('active');
    showSection(defaultSection);
}

function setupFormHandlers() {
    symptomForm?.addEventListener('submit', handleSymptomSubmit);
    appointmentForm?.addEventListener('submit', handleAppointmentSubmit);
    messageForm?.addEventListener('submit', handleMessageSubmit);
    logoutButton?.addEventListener('click', handleLogout);
    aiFormPatient?.addEventListener('submit', handleAiAnalysisSubmit);
    chatbotForm?.addEventListener('submit', handleChatbotSubmit);
    joinVideoBtn?.addEventListener('click', joinVideoRoom);
    leaveVideoBtn?.addEventListener('click', leaveVideoRoom);
}

// --- User & Auth ---
async function populateUserDetails() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login/index.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            userEmailElement.textContent = userData.email;
        } else {
            localStorage.removeItem('token');
            window.location.href = '../login/index.html';
        }
    } catch (error) {
        window.location.href = '../login/index.html';
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '../login/index.html';
}

// --- Symptoms ---
async function fetchSymptomHistory() {
    const token = localStorage.getItem('token');
    symptomHistoryElement.innerHTML = '<p class="loading">Loading your history...</p>';
    try {
        const response = await fetch('http://localhost:3000/api/patient/symptoms', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            let errorMsg = `Server error: ${response.status}`;
            try {
                const errData = await response.json();
                errorMsg = errData.message || errorMsg;
            } catch (e) { /* Ignore JSON parse error */ }
            throw new Error(errorMsg);
        }

        const history = await response.json();
        symptomHistoryElement.innerHTML = '';
        if (history.length === 0) {
            symptomHistoryElement.innerHTML = '<p class="loading">No symptoms have been logged yet.</p>';
            return;
        }

        history.forEach(log => {
            const item = document.createElement('div');
            item.className = 'history-item';
            const date = new Date(log.date).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
            const symptomsString = log.symptoms.map(s => s.replace(/'/g, "\\'")).join(', ');

            item.innerHTML = `
                <div class="history-date">${date}</div>
                <div class="history-symptoms">
                    ${log.symptoms.map(symptom => `<span class="symptom-tag">${symptom.trim()}</span>`).join('')}
                </div>
                <button 
                    class="btn btn-secondary btn-small" 
                    style="margin-top: 10px;" 
                    onclick="analyzeLog('${symptomsString}')"
                >
                    Analyze these Symptoms
                </button>
            `;
            symptomHistoryElement.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error fetching symptom history:', error);
        symptomHistoryElement.innerHTML = `<p class="loading error">Could not load history. (${error.message})</p>`;
    }
}

function analyzeLog(symptoms) {
    showSection('ai-analysis');
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('[data-section="ai-analysis"]')?.classList.add('active');
    
    if (aiSymptomsInputPatient) {
        aiSymptomsInputPatient.value = symptoms;
    }
    if (aiResultPatient) {
        aiResultPatient.innerHTML = '';
        aiResultPatient.className = 'message';
    }
}

async function handleSymptomSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const symptomsInput = document.getElementById('symptoms-input').value;
    const messageDiv = document.getElementById('symptom-message');

    const symptoms = symptomsInput.split(',').map(s => s.trim()).filter(s => s);
    if (symptoms.length === 0) {
        showMessage(messageDiv, 'Please enter symptoms', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/patient/symptoms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ symptoms })
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(messageDiv, 'Symptoms logged successfully!', 'success');
            symptomForm.reset();
        } else {
            showMessage(messageDiv, data.message || 'Failed to log symptoms', 'error');
        }
    } catch (error) {
        showMessage(messageDiv, 'An error occurred. Please try again.', 'error');
    }
}

// --- Doctors & Appointments ---
async function populateDoctors() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/patient/doctors', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const doctors = await response.json();
            const selectElements = [doctorSelect, messageDoctorSelect];
            selectElements.forEach(select => {
                if (!select) return;
                select.innerHTML = '<option value="">Choose a doctor...</option>';
                doctors.forEach(doctor => {
                    const option = document.createElement('option');
                    option.value = doctor._id;
                    option.textContent = doctor.email;
                    select.appendChild(option);
                });
            });
        }
    } catch (error) {
        console.error('Error fetching doctors:', error);
    }
}

async function handleAppointmentSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const messageDiv = document.getElementById('appointment-message');

    const doctorId = doctorSelect.value;
    const date = document.getElementById('appointment-date').value;
    const reason = document.getElementById('appointment-reason').value;

    if (!doctorId || !date || !reason) {
        showMessage(messageDiv, 'Please fill out all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/patient/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ doctorId, date, reason })
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(messageDiv, 'Appointment scheduled successfully!', 'success');
            appointmentForm.reset();
            setTimeout(() => fetchPatientAppointments(), 800);
        } else {
            showMessage(messageDiv, data.message || 'Failed to schedule', 'error');
        }
    } catch (error) {
        showMessage(messageDiv, 'An error occurred. Please try again.', 'error');
    }
}

async function fetchPatientAppointments() {
    const token = localStorage.getItem('token');
    appointmentsHistoryContainer.innerHTML = '<p class="loading">Loading your appointments...</p>';
    
    try {
        const response = await fetch('http://localhost:3000/api/patient/appointments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Could not load appointments');
        
        const appointments = await response.json();
        appointmentsHistoryContainer.innerHTML = '';
        if (appointments.length === 0) {
            appointmentsHistoryContainer.innerHTML = '<p class="loading">No appointments scheduled yet.</p>';
            return;
        }
        
        appointments.forEach(appt => {
            const item = document.createElement('div');
            item.className = 'appointment-item';
            
            const apptDate = new Date(appt.date);
            const date = apptDate.toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
            
            item.innerHTML = `
                <div class="appointment-doctor"><strong>Doctor:</strong> ${appt.doctor.email}</div>
                <div class="appointment-date"><strong>Date:</strong> ${date}</div>
                <div class="appointment-reason"><strong>Reason:</strong> ${appt.reason}</div>
                <div class="appointment-status"><strong>Status:</strong> ${appt.status}</div>
            `;
            appointmentsHistoryContainer.appendChild(item);
        });
    } catch (error) {
        appointmentsHistoryContainer.innerHTML = `<p class="loading error">${error.message}</p>`;
    }
}

// --- Messaging ---
async function handleMessageSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const doctorId = messageDoctorSelect.value;
    const content = document.getElementById('message-content').value;

    if (!doctorId || !content.trim()) {
        showMessage(messageMessage, 'Please select a doctor and enter a message', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/patient/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ doctorId, content })
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(messageMessage, 'Message sent successfully!', 'success');
            messageForm.reset();
            fetchPatientMessages(); // Refresh message list
        } else {
            showMessage(messageMessage, data.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        showMessage(messageMessage, 'An error occurred. Please try again.', 'error');
    }
}

async function fetchPatientMessages() {
    const token = localStorage.getItem('token');
    messageHistoryContainer.innerHTML = '<p class="loading">Loading message history...</p>';

    try {
        const response = await fetch('http://localhost:3000/api/patient/messages', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch messages');

        const messages = await response.json();
        messageHistoryContainer.innerHTML = '';
        if (messages.length === 0) {
            messageHistoryContainer.innerHTML = '<p class="loading">No messages yet.</p>';
            return;
        }

        messages.forEach(msg => {
            const isPatient = msg.from.role === 'patient';
            // Call the new helper function for doctor messages
            appendDoctorMessage(
                msg.content,
                isPatient ? 'sent' : 'received', // Use 'sent' or 'received'
                isPatient ? 'You' : msg.from.email,
                new Date(msg.createdAt)
            );
        });
    } catch (error) {
        messageHistoryContainer.innerHTML = '<p class="loading error">Could not load message history.</p>';
    }
}

// --- AI Analysis ---
async function handleAiAnalysisSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const symptoms = aiSymptomsInputPatient.value;
    
    aiResultPatient.textContent = 'Analyzing...';
    aiResultPatient.className = 'message';

    try {
        const response = await fetch('http://localhost:3000/api/ai/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ symptoms })
        });
        const data = await response.json();
        if (response.ok) {
            aiResultPatient.innerHTML = data.analysis.replace(/\n/g, '<br>');
            aiResultPatient.className = 'message success';
        } else {
            aiResultPatient.textContent = data.message || 'Analysis failed.';
            aiResultPatient.className = 'message error';
        }
    } catch (error) {
        aiResultPatient.textContent = 'An error occurred. Please try again.';
        aiResultPatient.className = 'message error';
    }
}

// --- Find a Doctor ---
async function fetchAndDisplayDoctors() {
    const token = localStorage.getItem('token');
    doctorListContainer.innerHTML = '<p class="loading">Loading doctors...</p>';

    try {
        const response = await fetch('http://localhost:3000/api/patient/doctors', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch doctors');

        const doctors = await response.json();
        doctorListContainer.innerHTML = '';
        if (doctors.length === 0) {
            doctorListContainer.innerHTML = '<p class="loading">No doctors are available.</p>';
            return;
        }

        doctors.forEach(doctor => {
            const card = document.createElement('div');
            card.className = 'doctor-card';
            card.innerHTML = `
                <div class="doctor-email">${doctor.email}</div>
                <div class="doctor-specialty">Specialty: General Medicine</div>
                <button class="btn btn-primary btn-small">Book Appointment</button>
            `;
            // Add click event to the button
            card.querySelector('button').addEventListener('click', () => {
                selectDoctorForAppointment(doctor._id, doctor.email);
            });
            doctorListContainer.appendChild(card);
        });

    } catch (error) {
        doctorListContainer.innerHTML = '<p class="loading error">Could not load doctors.</p>';
    }
}

function selectDoctorForAppointment(doctorId, doctorEmail) {
    showSection('appointments');
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('[data-section="appointments"]').classList.add('active');
    
    // Set the value in the dropdown
    if (doctorSelect) {
        doctorSelect.value = doctorId;
    }
}

// --- ChatBot ---
async function handleChatbotSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const prompt = chatbotInput.value.trim();
    if (!prompt) return;

    appendChatMessage(prompt, 'user'); 
    patientChatHistory.push({ role: 'user', content: prompt });
    chatbotInput.value = '';
    chatbotInput.disabled = true; // Disable input while bot is thinking

    try {
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt, history: patientChatHistory })
        });
        if (!response.ok) throw new Error('AI chat failed');

        const data = await response.json();
        
        // Use the new, simple chatbot helper
        appendChatMessage(data.reply, 'bot'); 
        patientChatHistory.push({ role: 'assistant', content: data.reply });

    } catch (error) {
        console.error('Error:', error);
        // Use the new, simple chatbot helper
        appendChatMessage('Sorry, I am having trouble connecting.', 'bot error'); 
    }
    
    chatbotInput.disabled = false; // Re-enable input
    chatbotInput.focus();
}

// --- Utility Functions ---
function showMessage(element, text, type) {
    if (element) {
        element.textContent = text;
        element.className = 'message ' + type;
        
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 5000);
    } else {
        console.warn('Could not find message element to show message:', text);
    }
}

function appendDoctorMessage(message, role, senderEmail, date) {
    if (!messageHistoryContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = `message-item ${role}`; // 'sent' or 'received'
    
    messageElement.innerHTML = `
        <div class="message-sender">${senderEmail}</div>
        <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
        <div class="message-date">${date.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</div>
    `;
    
    messageHistoryContainer.appendChild(messageElement);
    messageHistoryContainer.scrollTop = messageHistoryContainer.scrollHeight;
}

function appendChatMessage(message, role) {
    if (!chatbotHistory) return;

    const messageElement = document.createElement('div');
    // 'user', 'bot', or 'bot error'
    messageElement.className = `chatbot-message ${role}`; 
    messageElement.innerHTML = message.replace(/\n/g, '<br>');
    
    chatbotHistory.appendChild(messageElement);
    chatbotHistory.scrollTop = chatbotHistory.scrollHeight;
}

async function joinVideoRoom() {
    const token = localStorage.getItem('token');
    const roomName = videoRoomName.value;
    if (!roomName) {
        alert('Please enter a room name (Appointment ID)');
        return;
    }

    try {
        // 1. Fetch our unique token from our backend
        const response = await fetch('http://localhost:3000/api/video/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roomName })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        // 2. Connect to Twilio using the token
        const room = await Twilio.Video.connect(data.token);
        activeRoom = room;

        // 3. Show our own video
        const localTrack = await Twilio.Video.createLocalVideoTrack();
        localVideo.appendChild(localTrack.attach());

        room.participants.forEach(participant => {
            participant.on('trackSubscribed', track => {
                remoteVideo.appendChild(track.attach());
            });
        });

        room.on('participantConnected', participant => {
            participant.on('trackSubscribed', track => {
                remoteVideo.appendChild(track.attach());
            });
        });
        
        room.on('participantDisconnected', participant => {
            participant.tracks.forEach(publication => {
                publication.track.detach().forEach(element => element.remove());
            });
            remoteVideo.innerHTML = '';
        });

    } catch (error) {
        console.error('Error joining video room:', error);
        alert(`Could not join video call: ${error.message}`);
    }
}

function leaveVideoRoom() {
    if (activeRoom) {
        activeRoom.disconnect();
        activeRoom = null;
    }
    // Clear video feeds
    localVideo.innerHTML = '';
    remoteVideo.innerHTML = '';
}