
const doctorSelect = document.getElementById('doctor-select');
const messageDoctorSelect = document.getElementById('message-doctor-select');
const appointmentForm = document.getElementById('appointment-form');
const messageForm = document.getElementById('message-form');
const symptomForm = document.getElementById('symptom-form');
const symptomHistoryElement = document.getElementById('symptom-history-container');
const userEmailElement = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');


document.addEventListener('DOMContentLoaded', () => {
    populateUserDetails();
    fetchSymptomHistory();
    populateDoctors();
    setupNavigation();
    initializeNavigation();
    setupFormHandlers();
});

function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
            
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function showSection(sectionId) {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    
    if (sectionId === 'symptom-history') {
        fetchSymptomHistory();
    }
}

function initializeNavigation() {
    let activeSection = null;
    sections.forEach(section => {
        if (section.classList.contains('active')) {
            activeSection = section;
        }
    });
    
    if (!activeSection) return;
    
    const activeSectionId = activeSection.id;
    let matchingNavLink = null;
    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === activeSectionId) {
            matchingNavLink = link;
        }
    });
    
    if (!matchingNavLink) return;
    
    navLinks.forEach(link => link.classList.remove('active'));
    matchingNavLink.classList.add('active');
}


function setupFormHandlers() {
    symptomForm?.addEventListener('submit', handleSymptomSubmit);
    appointmentForm?.addEventListener('submit', handleAppointmentSubmit);
    messageForm?.addEventListener('submit', handleMessageSubmit);
    logoutButton?.addEventListener('click', handleLogout);
}


async function populateUserDetails() {
    const token = localStorage.getItem('hm_token');

    if (!token) {
        window.location.href = '../index.html';
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
            const errorData = await response.json();
            console.error('Auth failed:', response.status, errorData);
            localStorage.removeItem('token');
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        window.location.href = '../index.html';
    }
}


async function fetchSymptomHistory() {
    const token = localStorage.getItem('hm_token');
    try {
        const response = await fetch('http://localhost:3000/api/patient/symptoms', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const history = await response.json();
            symptomHistoryElement.innerHTML = '';

            if (history.length === 0) {
                symptomHistoryElement.innerHTML = '<p class="loading">No symptoms have been logged yet.</p>';
                return;
            }

            history.forEach(log => {
                const item = document.createElement('div');
                item.className = 'history-item';
                const date = new Date(log.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const time = new Date(log.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                item.innerHTML = `
                    <div class="history-date">${date} at ${time}</div>
                    <div class="history-symptoms">
                        ${log.symptoms.map(symptom => `<span class="symptom-tag">${symptom.trim()}</span>`).join('')}
                    </div>
                `;
                symptomHistoryElement.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Error fetching symptom history:', error);
        symptomHistoryElement.innerHTML = '<p class="loading error">Could not load history.</p>';
    }
}


async function populateDoctors() {
    const token = localStorage.getItem('hm_token');
    
    try {
        const response = await fetch('http://localhost:3000/api/patient/doctors', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const doctors = await response.json(); 
            
            const selectElements = [doctorSelect, messageDoctorSelect];
            
            selectElements.forEach(select => {
                if (select) select.innerHTML = '<option value="">Choose a doctor...</option>';
            });

            if (doctors && doctors.length > 0) {
                selectElements.forEach(select => {
                    if (select) {
                        doctors.forEach(doctor => {
                            const option = document.createElement('option');
                            option.value = doctor._id;
                            option.textContent = doctor.email;
                            select.appendChild(option);
                        });
                    }
                });
            } else {
                console.warn('No doctors found on the platform.');
                selectElements.forEach(select => {
                    if (select) select.innerHTML += '<option value="">No doctors available</option>';
                });
            }
        } else {
            throw new Error('Failed to fetch doctors');
        }
    } catch (error) {
        console.error('Error fetching doctors:', error);
        const selectElements = [doctorSelect, messageDoctorSelect];
        selectElements.forEach(select => {
            if (select) select.innerHTML += '<option value="">Unable to load doctors</option>';
        });
    }
}


async function handleSymptomSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('hm_token');
    const symptomsInput = document.getElementById('symptoms-input').value;
    const messageDiv = document.getElementById('symptom-message');

    if (!symptomsInput.trim()) {
        showMessage(messageDiv, 'Please enter symptoms', 'error');
        return;
    }

    const symptoms = symptomsInput.split(',').map(s => s.trim()).filter(s => s);

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
            setTimeout(() => fetchSymptomHistory(), 500);
        } else {
            showMessage(messageDiv, data.message || 'Failed to log symptoms', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(messageDiv, 'An error occurred. Please try again.', 'error');
    }
}


async function handleAppointmentSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('hm_token');
    const messageDiv = document.getElementById('appointment-message');

    const doctorId = doctorSelect.value;
    const date = document.getElementById('appointment-date').value;
    const reason = document.getElementById('appointment-reason').value;

    if (!doctorId) {
        showMessage(messageDiv, 'Please select a doctor', 'error');
        return;
    }
    
    if (!date) {
        showMessage(messageDiv, 'Please select a date', 'error');
        return;
    }
    
    if (!reason.trim()) {
        showMessage(messageDiv, 'Please provide a reason for the appointment', 'error');
        return;
    }
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showMessage(messageDiv, 'Please select a future date', 'error');
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
        } else {
            showMessage(messageDiv, data.message || 'Failed to schedule appointment', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(messageDiv, 'An error occurred. Please try again.', 'error');
    }
}


async function handleMessageSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('hm_token');
    const messageDiv = document.getElementById('message-message');

    const doctorId = messageDoctorSelect.value;
    const content = document.getElementById('message-content').value;

    if (!doctorId || !content.trim()) {
        showMessage(messageDiv, 'Please select a doctor and enter a message', 'error');
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
            showMessage(messageDiv, 'Message sent successfully!', 'success');
            messageForm.reset();
        } else {
            showMessage(messageDiv, data.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('[MESSAGE SUBMIT] Error:', error);
        showMessage(messageDiv, 'An error occurred. Please try again.', 'error');
    }
}


function handleLogout() {
    localStorage.removeItem('hm_token');
    window.location.href = '../index.html';
}


function showMessage(element, text, type) {
    element.textContent = text;
    element.className = 'message ' + type;
    
    
    if (type === 'success') {
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 5000);
    }
}