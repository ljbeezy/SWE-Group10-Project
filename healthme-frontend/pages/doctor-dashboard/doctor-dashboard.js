// --- Element Selectors ---
let userEmailElement;
let logoutButton;
let patientsContainer;
let searchPatientsInput;
let patientInfoContainer;
let patientSymptomsContainer;
let appointmentsContainer;
let navLinks;
let sections;

// -- Messaging --
let messagesContainer;
let replyForm;
let replyPatientId;
let replyPatientEmail;
let replyContent;
let replyMessage;

// -- AI Analysis --
let aiFormDoctor;
let aiSymptomsInputDoctor;
let aiResultDoctor;

// -- Video Chat --
let joinVideoBtnDoctor;
let leaveVideoBtnDoctor;
let videoRoomNameDoctor;
let localVideoDoctor;
let remoteVideoDoctor;

// -- State --
let allPatients = [];
let selectedPatientId = null;
let activeRoom = null; // For video chat

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Standard Elements
    userEmailElement = document.getElementById('user-email');
    logoutButton = document.getElementById('logout-button');
    patientsContainer = document.getElementById('patients-container');
    searchPatientsInput = document.getElementById('search-patients');
    patientInfoContainer = document.getElementById('patient-info-container');
    patientSymptomsContainer = document.getElementById('patient-symptoms-container'); 
    appointmentsContainer = document.getElementById('appointments-container');
    navLinks = document.querySelectorAll('.nav-link');
    sections = document.querySelectorAll('.section');

    // Messaging Elements
    messagesContainer = document.getElementById('messages-container');
    replyForm = document.getElementById('reply-form');
    replyPatientId = document.getElementById('reply-patient-id');
    replyPatientEmail = document.getElementById('reply-patient-email');
    replyContent = document.getElementById('reply-content');
    replyMessage = document.getElementById('reply-message');

    // AI Analysis Elements
    aiFormDoctor = document.getElementById('ai-form-doctor');
    aiSymptomsInputDoctor = document.getElementById('symptoms-input-doctor');
    aiResultDoctor = document.getElementById('ai-result-doctor');
    
    // Video Chat Elements
    joinVideoBtnDoctor = document.getElementById('join-video-btn-doctor');
    leaveVideoBtnDoctor = document.getElementById('leave-video-btn-doctor');
    videoRoomNameDoctor = document.getElementById('video-room-name-doctor');
    localVideoDoctor = document.getElementById('local-video-doctor');
    remoteVideoDoctor = document.getElementById('remote-video-doctor');

    // --- Start Application ---
    populateUserDetails();
    fetchAllPatients();
    setupNavigation();
    initializeNavigation();
    setupSearchFilter();
    setupLogout();

    // --- HOOK UP EVENT LISTENERS (This was missing) ---
    replyForm?.addEventListener('submit', handleReplySubmit);
    aiFormDoctor?.addEventListener('submit', handleAiAnalysisSubmitDoctor);
    joinVideoBtnDoctor?.addEventListener('click', joinVideoRoom);
    leaveVideoBtnDoctor?.addEventListener('click', leaveVideoRoom);
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

            // Fetch data for the specific section
            if (sectionId === 'appointments') {
                fetchDoctorAppointments();
            }
            if (sectionId === 'messages') {
                fetchDoctorMessages();
            }
        });
    });
}

function showSection(sectionId) {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
}

function initializeNavigation() {
    const defaultSection = 'patients-list';
    document.querySelector('.nav-link.active')?.classList.remove('active');
    document.querySelector(`[data-section="${defaultSection}"]`)?.classList.add('active');
    showSection(defaultSection);
}

// --- User & Patients ---
function setupSearchFilter() {
    if (searchPatientsInput) {
        searchPatientsInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.patient-card');
            
            cards.forEach(card => {
                const email = card.dataset.email.toLowerCase();
                if (email.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

function setupLogout() {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '../login/index.html';
    });
}

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
            if (userData.role !== 'doctor') {
                alert('Access denied.');
                localStorage.removeItem('token');
                window.location.href = '../login/index.html';
            }
        } else {
            localStorage.removeItem('token');
            window.location.href = '../login/index.html';
        }
    } catch (error) {
        window.location.href = '../login/index.html';
    }
}

async function fetchAllPatients() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/doctor/patients', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const users = await response.json();
            allPatients = users.filter(user => user.role === 'patient');
            displayPatients(allPatients);
        } else {
            patientsContainer.innerHTML = '<p class="loading error">Failed to load patients</p>';
        }
    } catch (error) {
        patientsContainer.innerHTML = '<p class="loading error">Could not load patients.</p>';
    }
}

function displayPatients(patients) {
    patientsContainer.innerHTML = '';
    if (patients.length === 0) {
        patientsContainer.innerHTML = '<p class="loading">No patients found</p>';
        return;
    }
    patients.forEach(patient => {
        const card = document.createElement('div');
        card.className = 'patient-card';
        card.dataset.email = patient.email;
        card.dataset.patientId = patient._id;
        card.innerHTML = `
            <div class="patient-email">${patient.email}</div>
            <div class="patient-status">Patient ID: ${patient._id.substring(0, 8)}...</div>
        `;
        card.addEventListener('click', () => selectPatient(patient));
        patientsContainer.appendChild(card);
    });
}

async function selectPatient(patient) {
    selectedPatientId = patient._id;
    const patientInfoHTML = `
        <div class="patient-info-header">
            <div class="patient-name">${patient.email}</div>
            <div class="patient-email-display">Patient ID: ${patient._id}</div>
        </div>
        <div class="info-grid">
            <div class="info-item"><div class="info-label">Role</div><div class="info-value">Patient</div></div>
            <div class="info-item"><div class="info-label">Registered</div><div class="info-value">${new Date(patient.createdAt || new Date()).toLocaleDateString()}</div></div>
        </div>
    `;
    patientInfoContainer.innerHTML = patientInfoHTML;
    await fetchPatientSymptoms(patient._id);
    showSection('patient-details');
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('[data-section="patient-details"]').classList.add('active');
}

async function fetchPatientSymptoms(patientId) {
    const token = localStorage.getItem('token');
    const historyList = document.getElementById('patient-symptoms');
    historyList.innerHTML = '<p class="loading">Loading symptoms...</p>';
    try {
        const response = await fetch(`http://localhost:3000/api/doctor/patients/${patientId}/symptoms`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const symptoms = await response.json();
            displayPatientSymptoms(symptoms);
        } else {
            historyList.innerHTML = '<p class="loading">Failed to load symptoms</p>';
        }
    } catch (error) {
        historyList.innerHTML = '<p class="loading error">Could not load symptoms</p>';
    }
}

function displayPatientSymptoms(symptoms) {
    const historyList = document.getElementById('patient-symptoms');
    historyList.innerHTML = '';
    if (!symptoms || symptoms.length === 0) {
        historyList.innerHTML = '<p class="loading">No symptom history available</p>';
        return;
    }
    symptoms.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'symptom-entry';
        const date = new Date(log.date).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
        entry.innerHTML = `
            <div class="symptom-date">${date}</div>
            <div class="symptom-items">
                ${(log.symptoms || []).map(symptom => `<span class="symptom-tag">${symptom.trim()}</span>`).join('')}
            </div>
        `;
        historyList.appendChild(entry);
    });
}

// --- Appointments ---
async function fetchDoctorAppointments() {
    const token = localStorage.getItem('token');
    appointmentsContainer.innerHTML = '<p class="loading">Loading appointments...</p>';
    try {
        const response = await fetch('http://localhost:3000/api/doctor/appointments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Could not load appointments');

        const appointments = await response.json();
        appointmentsContainer.innerHTML = '';
        if (appointments.length === 0) {
            appointmentsContainer.innerHTML = '<p class="loading">No appointments scheduled.</p>';
            return;
        }

        const today = new Date().setHours(0, 0, 0, 0);

        appointments.forEach(appt => {
            const item = document.createElement('div');
            item.className = 'appointment-item';
            
            const apptDate = new Date(appt.date);
            const date = apptDate.toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });

            // Check if appointment is today
            const isToday = apptDate.setHours(0, 0, 0, 0) === today;
            let videoButton = '';

            if (isToday && appt.status === 'Scheduled') {
                videoButton = `<button class="btn btn-primary btn-small" style="margin-top: 10px;" 
                                       onclick="startVideoForAppointment('${appt._id}')">
                                   Start Video Call
                               </button>`;
            }

            item.innerHTML = `
                <div class="appointment-patient"><strong>Patient:</strong> ${appt.patient.email}</div>
                <div class="appointment-date"><strong>Date:</strong> ${date}</div>
                <div class="appointment-reason"><strong>Reason:</strong> ${appt.reason}</div>
                <div class="appointment-status"><strong>Status:</strong> ${appt.status}</div>
                ${videoButton}
            `;
            appointmentsContainer.appendChild(item);
        });
    } catch (error) {
        appointmentsContainer.innerHTML = `<p class="loading error">${error.message}</p>`;
    }
}

// --- Messaging ---
async function fetchDoctorMessages() {
    const token = localStorage.getItem('token');
    messagesContainer.innerHTML = '<p class="loading">Loading messages...</p>';
    try {
        const response = await fetch('http://localhost:3000/api/doctor/messages', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch messages');

        const messages = await response.json();
        messagesContainer.innerHTML = '';
        if (messages.length === 0) {
            messagesContainer.innerHTML = '<p class="loading">No messages found.</p>';
            return;
        }

        messages.forEach(msg => {
            const item = document.createElement('div');
            const isDoctor = msg.from.role === 'doctor';
            item.className = isDoctor ? 'message-item sent' : 'message-item received';
            const date = new Date(msg.createdAt).toLocaleString('en-US', {
                dateStyle: 'short', timeStyle: 'short'
            });
            item.innerHTML = `
                <div class="message-sender">${isDoctor ? 'You' : msg.from.email}</div>
                <div class="message-content">${msg.content}</div>
                <div class="message-date">${date}</div>
            `;
            if (!isDoctor) {
                const replyButton = document.createElement('button');
                replyButton.textContent = 'Reply';
                replyButton.className = 'btn btn-secondary btn-small';
                replyButton.onclick = () => {
                    replyPatientId.value = msg.from._id;
                    replyPatientEmail.textContent = msg.from.email;
                    replyContent.focus();
                };
                item.appendChild(replyButton);
            }
            messagesContainer.appendChild(item);
        });
    } catch (error) {
        messagesContainer.innerHTML = '<p class="loading error">Could not load messages.</p>';
    }
}

async function handleReplySubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const patientId = replyPatientId.value;
    const content = replyContent.value;

    if (!patientId) {
        showMessage(replyMessage, 'Please select a message to reply to.', 'error');
        return;
    }
    if (!content.trim()) {
        showMessage(replyMessage, 'Please enter a reply.', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/doctor/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ patientId, content })
        });
        const data = await response.json();
        if (response.ok) {
            showMessage(replyMessage, 'Reply sent!', 'success');
            replyForm.reset();
            replyPatientId.value = '';
            replyPatientEmail.textContent = '(Select a message to reply)';
            fetchDoctorMessages(); // Refresh message list
        } else {
            showMessage(replyMessage, data.message || 'Failed to send reply', 'error');
        }
    } catch (error) {
        showMessage(replyMessage, 'An error occurred. Please try again.', 'error');
    }
}

// --- AI Analysis ---
async function handleAiAnalysisSubmitDoctor(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const symptoms = aiSymptomsInputDoctor.value;
    
    aiResultDoctor.textContent = 'Analyzing...';
    aiResultDoctor.className = 'message';

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
            aiResultDoctor.innerHTML = data.analysis.replace(/\n/g, '<br>');
            aiResultDoctor.className = 'message success';
        } else {
            aiResultDoctor.textContent = data.message || 'Analysis failed.';
            aiResultDoctor.className = 'message error';
        }
    } catch (error) {
        aiResultDoctor.textContent = 'An error occurred. Please try again.';
        aiResultDoctor.className = 'message error';
    }
}

// --- Video Chat ---
async function joinVideoRoom() {
    const token = localStorage.getItem('token');
    const roomName = videoRoomNameDoctor.value;
    if (!roomName) {
        alert('Please enter a room name (Appointment ID)');
        return;
    }

    try {
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

        const room = await Twilio.Video.connect(data.token, {
            name: roomName
        });
        activeRoom = room;

        const localTrack = await Twilio.Video.createLocalVideoTrack();
        localVideoDoctor.innerHTML = ''; // Clear label
        localVideoDoctor.appendChild(localTrack.attach());

        room.participants.forEach(participant => {
            participant.on('trackSubscribed', track => {
                remoteVideoDoctor.innerHTML = ''; // Clear label
                remoteVideoDoctor.appendChild(track.attach());
            });
        });

        room.on('participantConnected', participant => {
            participant.on('trackSubscribed', track => {
                remoteVideoDoctor.innerHTML = ''; // Clear label
                remoteVideoDoctor.appendChild(track.attach());
            });
        });
        
        room.on('participantDisconnected', participant => {
            participant.tracks.forEach(publication => {
                const attachedElements = publication.track.detach();
                attachedElements.forEach(element => element.remove());
            });
            remoteVideoDoctor.innerHTML = '<div class="video-label">Patient\'s Video</div>';
        });

        room.on('disconnected', () => {
            localTrack.stop();
            localVideoDoctor.innerHTML = '<div class="video-label">Your Video</div>';
            remoteVideoDoctor.innerHTML = '<div class="video-label">Patient\'s Video</div>';
            activeRoom = null;
        });

    } catch (error) {
        alert(`Could not join video call: ${error.message}`);
    }
}

function leaveVideoRoom() {
    if (activeRoom) {
        activeRoom.disconnect();
    }
}

function startVideoForAppointment(appointmentId) {
    showSection('video-chat');
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('[data-section="video-chat"]').classList.add('active');

    videoRoomNameDoctor.value = appointmentId;

    joinVideoRoom();
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
        console.warn('showMessage: element is null');
    }
}