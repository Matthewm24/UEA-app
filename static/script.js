document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Click to upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.name.endsWith('.docx')) {
            alert('Please select a DOCX file');
            return;
        }

        uploadFile(file);
    }

    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        // Show progress
        progressContainer.style.display = 'block';
        uploadArea.style.display = 'none';

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            
            // Simulate progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    
                    // Redirect to IDE after completion
                    setTimeout(() => {
                        window.location.href = `/ide?project=${result.project_id}`;
                    }, 500);
                }
                
                progressFill.style.width = progress + '%';
                progressPercent.textContent = Math.round(progress) + '% complete';
            }, 200);

        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
            
            // Reset UI
            progressContainer.style.display = 'none';
            uploadArea.style.display = 'block';
        }
    }

    function getAuthToken() {
        return localStorage.getItem('authToken') || '';
    }
});

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userId');
    window.location.href = '/login';
}

// Feedback submission
function submitFeedback() {
    const feedbackInput = document.getElementById('feedbackInput');
    const feedback = feedbackInput.value.trim();
    
    if (feedback) {
        // Send feedback to server
        fetch('/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ feedback: feedback })
        }).then(() => {
            feedbackInput.value = '';
            alert('Thank you for your feedback!');
        }).catch(error => {
            console.error('Feedback submission error:', error);
        });
    }
}
