const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const toggleRegisterBtn = document.getElementById('toggle-register');
const toggleLoginBtn = document.getElementById('toggle-login');
const messageElement = document.getElementById('message');
const registerMessageElement = document.getElementById('register-message');

toggleRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
});

toggleLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (email === '' || password === '') {
        showMessage(messageElement, 'Email and password are required.', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Login response:', data);
            localStorage.setItem('token', data.token);
            console.log('Token saved to localStorage:', data.token);
            console.log('Verified token in localStorage:', localStorage.getItem('token'));
            showMessage(messageElement, 'Login successful! Redirecting...', 'success');
            
            // Determine dashboard based on role
            const userRole = data.role || 'patient';
            const redirectPath = userRole === 'doctor' 
                ? '../doctor-dashboard/doctor-dashboard.html' 
                : '../patient-dashboard/dashboard.html';
            
            setTimeout(() => {
                window.location.href = redirectPath;
            }, 500);
        } else {
            showMessage(messageElement, data.message || 'Login failed.', 'error');
        }
    } catch (error) {
        console.error('Login Error:', error);
        showMessage(messageElement, 'An error occurred. Please try again.', 'error');
    }
});

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    if (email === '' || password === '' || role === '') {
        showMessage(registerMessageElement, 'All fields are required.', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage(registerMessageElement, 'Password must be at least 6 characters long.', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(registerMessageElement, 'Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                registerSection.classList.add('hidden');
                loginSection.classList.remove('hidden');
                registerForm.reset();
                messageElement.textContent = '';
            }, 1500);
        } else {
            showMessage(registerMessageElement, data.message || 'Registration failed.', 'error');
        }
    } catch (error) {
        console.error('Registration Error:', error);
        showMessage(registerMessageElement, 'An error occurred. Please try again.', 'error');
    }
});

function showMessage(element, text, type) {
    element.textContent = text;
    element.classList.remove('success', 'error');
    element.classList.add(type);
}
