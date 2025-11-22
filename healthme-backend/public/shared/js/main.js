
(function(){
  const API_PREFIX = '/api';
  
  window.setToken = (t) => localStorage.setItem('hm_token', t);
  window.getToken = () => localStorage.getItem('hm_token');
  window.clearToken = () => localStorage.removeItem('hm_token');

  window.loadCurrentUser = async () => {
    const token = window.getToken();
    if(!token) return null;
    try{
      const res = await fetch(API_PREFIX + '/auth/user', { headers: { 'Authorization': 'Bearer ' + token } });
      if(!res.ok) { window.clearToken(); return null; }
      return res.json();
    }catch(e){ return null; }
  };

  
  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if(loginForm){
      loginForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const msg = document.getElementById('loginMsg');
        msg.textContent = '';
        try{
          const res = await fetch(API_PREFIX + '/auth/login', {
            method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if(!res.ok){ msg.textContent = data.message || 'Login failed'; return; }
          if(data.token) window.setToken(data.token);
          
          const user = await (await fetch(API_PREFIX + '/auth/user', { headers: { 'Authorization': 'Bearer ' + window.getToken() } })).json();
          if(user.role === 'doctor') window.location = 'dashboards/admin-dashboard.html';
          else window.location = 'patient-dashboard/dashboard.html';
        }catch(e){ msg.textContent = 'Network error'; }
      });
    }

    const regForm = document.getElementById('registerForm');
    if(regForm){
      regForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('emailR').value.trim();
        const password = document.getElementById('passwordR').value;
        const role = document.getElementById('role').value;
        const msg = document.getElementById('regMsg');
        msg.textContent = '';
        try{
          const res = await fetch(API_PREFIX + '/auth/register', {
            method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password, role })
          });
          const data = await res.json();
          if(!res.ok){ msg.textContent = data.message || 'Registration failed'; return; }
          msg.style.color = 'green'; msg.textContent = 'Registered — redirecting to login...';
          setTimeout(()=> location.href = 'index.html', 900);
        }catch(e){ msg.textContent = 'Network error'; }
      });
    }

   
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) logoutBtn.addEventListener('click', () => { window.clearToken(); location.href = '/index.html'; });

    
    const logSymptomBtn = document.getElementById('logSymptomBtn');
    if(logSymptomBtn) logSymptomBtn.addEventListener('click', async () => {
      const note = prompt('Describe your symptom (short):');
      if(!note) return;
      await fetch('/api/patient/symptoms', { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+window.getToken() }, body: JSON.stringify({ symptom: note, note }) });
      alert('Symptom logged (may need refresh)');
    });
  });
})();
