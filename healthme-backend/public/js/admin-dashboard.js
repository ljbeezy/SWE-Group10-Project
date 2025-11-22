let userEmailElement;
let logoutButton;
let patientsContainer;
let searchPatientsInput;
let patientInfoContainer;
let patientSymptomsContainer;
let navLinks;
let sections;

let allPatients = [];
let selectedPatientId = null;

let videoRoom;
let videoParticipants = new Map();
let localVideoTrack;
let localAudioTrack;
let joinVideoBtn;
let leaveVideoBtn;
let videoRoomNameInput;
let localVideoElement;
let remoteVideoElement;
let aiFormDoctor;
let aiResultDoctor;
let symptomsInputDoctor;

let appointmentsBookedContainer;
let appointmentsCancelledContainer;
let messageHistoryContainer;
let messageForm;
let messageContent;
let messagePatientSelect;
let messageMessageDiv;

document.addEventListener('DOMContentLoaded', () => {
    userEmailElement = document.getElementById('user-email');
    logoutButton = document.getElementById('logout-button');
    patientsContainer = document.getElementById('patients-container');
    searchPatientsInput = document.getElementById('search-patients');
    patientInfoContainer = document.getElementById('patient-info-container');
    patientSymptomsContainer = document.getElementById('patient-symptoms');
    navLinks = document.querySelectorAll('.nav-link');
    sections = document.querySelectorAll('.section');
    
    joinVideoBtn = document.getElementById('join-video-btn');
    leaveVideoBtn = document.getElementById('leave-video-btn');
    videoRoomNameInput = document.getElementById('video-room-name');
    localVideoElement = document.getElementById('local-video');
    remoteVideoElement = document.getElementById('remote-video');
    aiFormDoctor = document.getElementById('ai-form-doctor');
    aiResultDoctor = document.getElementById('ai-result-doctor');
    symptomsInputDoctor = document.getElementById('symptoms-input-doctor');
    
    appointmentsBookedContainer = document.getElementById('appointments-booked-container');
    appointmentsCancelledContainer = document.getElementById('appointments-cancelled-container');
    messageHistoryContainer = document.getElementById('message-history-container');
    messageForm = document.getElementById('message-form');
    messageContent = document.getElementById('message-content');
    messagePatientSelect = document.getElementById('message-patient-select');
    messageMessageDiv = document.getElementById('message-message');
    
    populateUserDetails();
    fetchAllPatients();
    populatePatients();
    setupNavigation();
    initializeNavigation();
    setupSearchFilter();
    setupLogout();
    setupVideoChat();
    setupAiAnalysis();
    setupMessaging();
    fetchDoctorAppointments();
});

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
}

function initializeNavigation() {
    let activeSection = null;
    sections.forEach(section => {
        if (section.classList.contains('active')) {
            activeSection = section.id;
        }
    });
    
    if (activeSection) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === activeSection) {
                link.classList.add('active');
            }
        });
    }
}

function setupSearchFilter() {
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

function setupLogout() {
    logoutButton.addEventListener('click', () => {
        window.clearToken();
        window.location.href = '../index.html';
    });
}

async function populateUserDetails() {
    const user = await window.loadCurrentUser();

    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    userEmailElement.textContent = user.email;
    
    if (user.role !== 'doctor') {
        alert('Access denied. This dashboard is for doctors only.');
        window.clearToken();
        window.location.href = '../index.html';
    }
}

async function fetchAllPatients() {
    const token = window.getToken();
    
    try {
        const response = await fetch('/api/doctor/patients', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const users = await response.json();
            allPatients = Array.isArray(users) ? users.filter(user => user.role === 'patient') : [];
            displayPatients(allPatients);
        } else {
            patientsContainer.innerHTML = '<p class="loading error">Failed to load patients</p>';
        }
    } catch (error) {
        console.error('Error fetching patients:', error);
        patientsContainer.innerHTML = '<p class="loading error">Could not load patients. Please try again.</p>';
    }
}

async function populatePatients() {
    const token = window.getToken();
    try {
        const response = await fetch('/api/doctor/patients', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const patients = await response.json();
            const patientList = Array.isArray(patients) ? patients.filter(user => user.role === 'patient') : [];
            
            if (!messagePatientSelect) return;
            messagePatientSelect.innerHTML = '<option value="">Choose a patient...</option>';
            patientList.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.email;
                option.textContent = patient.email;
                messagePatientSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error fetching patients for dropdown:', error);
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

        const lastVisit = patient.lastAppointment 
            ? new Date(patient.lastAppointment).toLocaleDateString()
            : 'No appointments yet';

        card.innerHTML = `
            <div class="patient-email">${patient.email}</div>
            <div class="patient-status">Patient ID: ${patient._id.substring(0, 8)}...</div>
            <div class="patient-last-visit">Last visit: ${lastVisit}</div>
        `;

        card.addEventListener('click', () => selectPatient(patient));
        patientsContainer.appendChild(card);
    });
}

async function selectPatient(patient) {
    selectedPatientId = patient._id;
    
    // Update patient info
    const patientInfoHTML = `
        <div class="patient-info-header">
            <div class="patient-name">${patient.email}</div>
            <div class="patient-email-display">Patient ID: ${patient._id}</div>
        </div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Account Status</div>
                <div class="info-value">Active</div>
            </div>
            <div class="info-item">
                <div class="info-label">Role</div>
                <div class="info-value">Patient</div>
            </div>
            <div class="info-item">
                <div class="info-label">Registered</div>
                <div class="info-value">${new Date(patient.createdAt || new Date()).toLocaleDateString()}</div>
            </div>
        </div>
    `;
    
    patientInfoContainer.innerHTML = patientInfoHTML;
    
    await fetchPatientSymptoms(patient._id);
    
    showSection('patient-details');
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('[data-section="patient-details"]').classList.add('active');
}

async function fetchPatientSymptoms(patientId) {
    const token = window.getToken();
    
    try {
        const response = await fetch(`/api/doctor/patients/${patientId}/symptoms`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const symptoms = await response.json();
            displayPatientSymptoms(symptoms);
        } else {
            patientSymptomsContainer.innerHTML = '<p class="loading">Failed to load symptoms</p>';
        }
    } catch (error) {
        console.error('Error fetching patient symptoms:', error);
        patientSymptomsContainer.innerHTML = '<p class="loading error">Could not load symptoms</p>';
    }
}

function displayPatientSymptoms(symptoms) {
    patientSymptomsContainer.innerHTML = '';

    if (!symptoms || symptoms.length === 0) {
        patientSymptomsContainer.innerHTML = '<p class="loading">No symptom history available</p>';
        return;
    }

    symptoms.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'symptom-entry';

        const date = new Date(log.date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        entry.innerHTML = `
            <div class="symptom-date">${date}</div>
            <div class="symptom-items">
                ${(log.symptoms || []).map(symptom => `<span class="symptom-tag">${symptom.trim()}</span>`).join('')}
            </div>
        `;

        patientSymptomsContainer.appendChild(entry);
    });
}

function setupVideoChat() {
    joinVideoBtn.addEventListener('click', async () => {
        const roomName = videoRoomNameInput.value.trim();
        if (!roomName) {
            alert('Please enter an Appointment ID');
            return;
        }
        await joinVideoRoom(roomName);
    });
    leaveVideoBtn.addEventListener('click', leaveVideoRoom);
}

function setupAiAnalysis() {
    aiFormDoctor.addEventListener('submit', handleAiAnalysisSubmitDoctor);
}

async function joinVideoRoom(roomName) {
    console.log('joinVideoRoom called with roomName:', roomName);
    if (!roomName) {
        alert('Please enter an Appointment ID');
        return;
    }

    try {
        const token = window.getToken();
        const response = await fetch('/api/video/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roomName })
        });

        if (!response.ok) {
            throw new Error('Failed to get video token');
        }

        const { token: videoToken } = await response.json();

        const tracks = await Twilio.Video.createLocalTracks({
            audio: true,
            video: { width: 640 }
        });

        localVideoTrack = tracks.find(t => t.kind === 'video');
        localAudioTrack = tracks.find(t => t.kind === 'audio');

        if (localVideoTrack) {
            localVideoElement.appendChild(localVideoTrack.attach());
        }

        videoRoom = await Twilio.Video.connect(videoToken, {
            name: roomName,
            tracks: [localVideoTrack, localAudioTrack]
        });

        videoRoom.on('participantConnected', participantConnected);
        videoRoom.on('participantDisconnected', participantDisconnected);

        joinVideoBtn.disabled = true;
        videoRoomNameInput.disabled = true;
    } catch (error) {
        console.error('Error joining video room:', error);
        alert('Failed to join video call. Please try again.');
    }
}

async function leaveVideoRoom() {
    if (videoRoom) {
        videoRoom.localParticipant.tracks.forEach(trackSubscription => {
            trackSubscription.track.stop();
        });

        videoRoom.disconnect();
        videoRoom = null;
    }

    document.querySelectorAll('.video-participant video').forEach(video => video.remove());

    joinVideoBtn.disabled = false;
    videoRoomNameInput.disabled = false;
    videoRoomNameInput.value = '';
}

function participantConnected(participant) {
    videoParticipants.set(participant.sid, participant);

    participant.on('trackSubscribed', trackSubscribed);
    participant.on('trackUnsubscribed', trackUnsubscribed);

    participant.tracks.forEach(trackSubscription => {
        trackSubscribed(trackSubscription.track);
    });
}

function participantDisconnected(participant) {
    videoParticipants.delete(participant.sid);
    
    participant.removeAllListeners();
}

function trackSubscribed(track) {
    if (track.kind === 'video') {
        remoteVideoElement.appendChild(track.attach());
    } else if (track.kind === 'audio') {
        remoteVideoElement.appendChild(track.attach());
    }
}

function trackUnsubscribed(track) {
    track.detach().forEach(element => element.remove());
}

async function handleAiAnalysisSubmitDoctor(e) {
    e.preventDefault();

    const symptoms = symptomsInputDoctor.value.trim();

    if (!symptoms) {
        aiResultDoctor.innerHTML = '';
        return;
    }

    aiResultDoctor.innerHTML = '<p class="loading">Analyzing symptoms...</p>';

    try {
        const token = window.getToken();
        const response = await fetch('/api/ai/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ symptoms })
        });

        if (!response.ok) {
            throw new Error('Analysis failed');
        }

        const { analysis } = await response.json();

        aiResultDoctor.innerHTML = `<div class="message success" style="display: block; background-color: transparent; border: none; color: var(--text-primary);"><strong>AI Analysis:</strong><br>${analysis}</div>`;
    } catch (error) {
        console.error('Error analyzing symptoms:', error);
        aiResultDoctor.innerHTML = '<div class="message error" style="display: block;">Error analyzing symptoms. Please try again.</div>';
    }
}

function setupMessaging() {
    messageForm.addEventListener('submit', handleMessageSubmit);
    messagePatientSelect.addEventListener('change', handleMessagePatientSelect);
    messageHistoryContainer.innerHTML = '<p class="loading">Select a patient to view messages</p>';
}

async function cancelDoctorAppointment(appointmentId) {
    const token = window.getToken();

    try {
        const response = await fetch(`/api/doctor/appointments/${appointmentId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Appointment cancelled successfully');
            fetchDoctorAppointments();
        } else {
            try {
                const data = await response.json();
                alert(data.message || 'Failed to cancel appointment');
            } catch (e) {
                alert(`Failed to cancel appointment (Status: ${response.status})`);
            }
        }
    } catch (error) {
        console.error('Cancel appointment error:', error);
        alert(`Error: ${error.message}`);
    }
}

async function fetchDoctorAppointments() {
    const token = window.getToken();
    
    try {
        const response = await fetch('/api/doctor/appointments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const appointments = await response.json();
            displayDoctorAppointments(appointments);
        } else {
            appointmentsHistoryContainer.innerHTML = '<p class="loading error">Failed to load appointments</p>';
        }
    } catch (error) {
        console.error('Error fetching appointments:', error);
        appointmentsHistoryContainer.innerHTML = '<p class="loading error">Could not load appointments</p>';
    }
}

function displayDoctorAppointments(appointments) {
    appointmentsBookedContainer.innerHTML = '';
    appointmentsCancelledContainer.innerHTML = '';

    if (!appointments || appointments.length === 0) {
        appointmentsBookedContainer.innerHTML = '<p class="loading">No appointments scheduled</p>';
        appointmentsCancelledContainer.innerHTML = '<p class="loading">No cancelled appointments</p>';
        return;
    }

    const bookedAppointments = appointments.filter(appt => appt.status === 'Scheduled');
    const cancelledAppointments = appointments.filter(appt => appt.status === 'Cancelled');

    if (bookedAppointments.length === 0) {
        appointmentsBookedContainer.innerHTML = '<p class="loading">No booked appointments</p>';
    } else {
        bookedAppointments.forEach(appointment => {
            const appointmentDiv = document.createElement('div');
            appointmentDiv.className = 'appointment-item';

            const date = new Date(appointment.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            appointmentDiv.innerHTML = `
                <div class="appointment-header">
                    <strong>${appointment.patientEmail || 'Patient'}</strong>
                    <span class="appointment-date">${date}</span>
                </div>
                <div class="appointment-reason">${appointment.reason}</div>
                <div class="appointment-id">ID: ${appointment._id}</div>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn btn-primary join-call-btn" data-appointment-id="${appointment._id}">Join Call</button>
                    <button class="btn btn-secondary cancel-doctor-appointment-btn" data-appointment-id="${appointment._id}">Cancel Appointment</button>
                </div>
            `;

            appointmentsBookedContainer.appendChild(appointmentDiv);

            const joinBtn = appointmentDiv.querySelector('.join-call-btn');
            joinBtn.addEventListener('click', async () => {
                console.log('Join Call clicked for appointment:', appointment._id);
                navLinks.forEach(l => l.classList.remove('active'));
                document.querySelector('[data-section="video-chat"]').classList.add('active');
                showSection('video-chat');
                await joinVideoRoom(appointment._id);
            });

            const cancelBtn = appointmentDiv.querySelector('.cancel-doctor-appointment-btn');
            cancelBtn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to cancel this appointment?')) {
                    return;
                }
                await cancelDoctorAppointment(appointment._id);
            });
        });
    }

    if (cancelledAppointments.length === 0) {
        appointmentsCancelledContainer.innerHTML = '<p class="loading">No cancelled appointments</p>';
    } else {
        cancelledAppointments.forEach(appointment => {
            const appointmentDiv = document.createElement('div');
            appointmentDiv.className = 'appointment-item';

            const date = new Date(appointment.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            appointmentDiv.innerHTML = `
                <div class="appointment-header">
                    <strong>${appointment.patientEmail || 'Patient'}</strong>
                    <span class="appointment-date">${date}</span>
                </div>
                <div class="appointment-reason">${appointment.reason}</div>
                <div class="appointment-status"><strong>Status:</strong> Cancelled</div>
                <div class="appointment-id">ID: ${appointment._id}</div>
            `;

            appointmentsCancelledContainer.appendChild(appointmentDiv);
        });
    }
}

async function handleMessagePatientSelect(e) {
    const patientEmail = e.target.value;
    if (!patientEmail) {
        messageHistoryContainer.innerHTML = '<p class="loading">Select a patient to view messages</p>';
        return;
    }
    await fetchDoctorMessages(patientEmail);
}

async function fetchDoctorMessages(patientEmail) {
    const token = window.getToken();
    
    try {
        const response = await fetch('/api/doctor/messages', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const messages = await response.json();
            
            if (patientEmail) {
                const filteredMessages = messages.filter(msg => 
                    (msg.from && msg.from.email === patientEmail) || 
                    (msg.to && msg.to.email === patientEmail)
                );
                displayDoctorMessages(filteredMessages);
            } else {
                displayDoctorMessages(messages);
            }
        } else {
            messageHistoryContainer.innerHTML = '<p class="loading error">Failed to load messages</p>';
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        messageHistoryContainer.innerHTML = '<p class="loading error">Could not load messages</p>';
    }
}

function displayDoctorMessages(messages) {
    messageHistoryContainer.innerHTML = '';

    if (!messages || messages.length === 0) {
        messageHistoryContainer.innerHTML = '<p class="loading">No messages with this patient yet</p>';
        return;
    }

    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        const isFromDoctor = message.from && message.from.role === 'doctor';
        messageDiv.className = `message-item ${isFromDoctor ? 'sent' : 'received'}`;

        const date = new Date(message.createdAt).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const senderLabel = isFromDoctor ? 'You' : (message.from && message.from.email ? message.from.email : 'Patient');

        messageDiv.innerHTML = `
            <div class="message-sender">${senderLabel}</div>
            <div class="message-content">${message.content}</div>
            <div class="message-date">${date}</div>
        `;

        messageHistoryContainer.appendChild(messageDiv);
    });
}

function populatePatientSelectDropdown(messages) {
    const patients = new Set();
    messages.forEach(msg => {
        if (msg.from && msg.from.role === 'patient' && msg.from.email) {
            patients.add(msg.from.email);
        }
        if (msg.to && msg.to.role === 'patient' && msg.to.email) {
            patients.add(msg.to.email);
        }
    });

    allPatients.forEach(patient => {
        patients.add(patient.email);
    });

    messagePatientSelect.innerHTML = '<option value="">Choose a patient...</option>';
    patients.forEach(email => {
        const option = document.createElement('option');
        option.value = email;
        option.textContent = email;
        messagePatientSelect.appendChild(option);
    });
}

async function handleMessageSubmit(e) {
    e.preventDefault();

    const patientEmail = messagePatientSelect.value.trim();
    const content = messageContent.value.trim();

    if (!patientEmail || !content) {
        messageMessageDiv.innerHTML = '';
        return;
    }

    const patient = allPatients.find(p => p.email === patientEmail);
    if (!patient) {
        messageMessageDiv.className = 'message error';
        messageMessageDiv.textContent = 'Patient not found';
        return;
    }

    messageMessageDiv.innerHTML = '';

    try {
        const token = window.getToken();
        const response = await fetch('/api/doctor/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ patientId: patient._id, content })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        messageMessageDiv.className = 'message success';
        messageMessageDiv.textContent = 'Message sent successfully!';
        messageContent.value = '';
        
        const currentPatientEmail = messagePatientSelect.value;
        if (currentPatientEmail) {
            await fetchDoctorMessages(currentPatientEmail);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        messageMessageDiv.className = 'message error';
        messageMessageDiv.textContent = 'Failed to send message. Please try again.';
    }
}