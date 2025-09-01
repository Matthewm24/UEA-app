document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        window.location.href = '/';
        return;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox.checked;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Store token
                if (remember) {
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('userId', result.user_id);
                } else {
                    sessionStorage.setItem('authToken', result.token);
                    sessionStorage.setItem('userId', result.user_id);
                }

                // Redirect to main page
                window.location.href = '/';
            } else {
                const error = await response.json();
                alert(error.detail || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });

    // Add loading state to form
    loginForm.addEventListener('submit', function() {
        const submitBtn = loginForm.querySelector('.login-btn');
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;
    });
});

// Utility function to get auth token
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

// Utility function to get user ID
function getUserId() {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userId');
    window.location.href = '/login';
}
