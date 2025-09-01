document.addEventListener('DOMContentLoaded', function() {
    const projectsGrid = document.getElementById('projectsGrid');
    const loading = document.getElementById('loading');
    const noProjects = document.getElementById('noProjects');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    let allProjects = [];
    let filteredProjects = [];

    // Load projects on page load
    loadProjects();

    // Search functionality
    searchInput.addEventListener('input', function() {
        searchProjects();
    });

    // Sort functionality
    sortSelect.addEventListener('change', function() {
        sortProjects();
    });

    async function loadProjects() {
        showLoading();
        
        try {
            const response = await fetch('/projects', {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (response.ok) {
                allProjects = await response.json();
                filteredProjects = [...allProjects];
                displayProjects();
            } else {
                throw new Error('Failed to load projects');
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            showError('Failed to load projects. Please try again.');
        }
    }

    function displayProjects() {
        hideLoading();
        
        if (filteredProjects.length === 0) {
            showNoProjects();
            return;
        }

        projectsGrid.innerHTML = '';
        
        filteredProjects.forEach(project => {
            const projectCard = createProjectCard(project);
            projectsGrid.appendChild(projectCard);
        });
    }

    function createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const createdDate = new Date(project.created_at?.toDate?.() || project.created_at || Date.now());
        const formattedDate = createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusBadge = getStatusBadge(project.status || 'completed');
        
        card.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${project.filename || 'Untitled Project'}</h3>
                <p class="project-date">${formattedDate}</p>
            </div>
            <div class="project-info">
                <p>
                    <span class="info-icon">📄</span>
                    ${project.filename || 'Document'}
                </p>
                <p>
                    <span class="info-icon">🆔</span>
                    ${project.id}
                </p>
                <p>
                    <span class="info-icon">📊</span>
                    ${statusBadge}
                </p>
            </div>
            <div class="project-actions">
                <button class="project-btn btn-primary" onclick="openProject('${project.id}')">
                    <span>📝</span> Edit
                </button>
                <button class="project-btn btn-secondary" onclick="downloadPDF('${project.id}')">
                    <span>📥</span> Download PDF
                </button>
                <button class="project-btn btn-secondary" onclick="duplicateProject('${project.id}')">
                    <span>📋</span> Duplicate
                </button>
                <button class="project-btn btn-danger" onclick="deleteProject('${project.id}')">
                    <span>🗑️</span> Delete
                </button>
            </div>
        `;
        
        return card;
    }

    function getStatusBadge(status) {
        const statusMap = {
            'completed': '<span style="color: #28a745;">✅ Completed</span>',
            'processing': '<span style="color: #ffc107;">⏳ Processing</span>',
            'error': '<span style="color: #dc3545;">❌ Error</span>',
            'pending': '<span style="color: #6c757d;">⏸️ Pending</span>'
        };
        return statusMap[status] || statusMap['completed'];
    }

    function searchProjects() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredProjects = [...allProjects];
        } else {
            filteredProjects = allProjects.filter(project => 
                (project.filename && project.filename.toLowerCase().includes(searchTerm)) ||
                (project.id && project.id.toLowerCase().includes(searchTerm))
            );
        }
        
        sortProjects();
    }

    function sortProjects() {
        const sortValue = sortSelect.value;
        
        filteredProjects.sort((a, b) => {
            const dateA = new Date(a.created_at?.toDate?.() || a.created_at || 0);
            const dateB = new Date(b.created_at?.toDate?.() || b.created_at || 0);
            const nameA = (a.filename || '').toLowerCase();
            const nameB = (b.filename || '').toLowerCase();
            
            switch (sortValue) {
                case 'date-desc':
                    return dateB - dateA;
                case 'date-asc':
                    return dateA - dateB;
                case 'name-asc':
                    return nameA.localeCompare(nameB);
                case 'name-desc':
                    return nameB.localeCompare(nameA);
                default:
                    return dateB - dateA;
            }
        });
        
        displayProjects();
    }

    function showLoading() {
        loading.style.display = 'block';
        projectsGrid.style.display = 'none';
        noProjects.style.display = 'none';
    }

    function hideLoading() {
        loading.style.display = 'none';
        projectsGrid.style.display = 'grid';
        noProjects.style.display = 'none';
    }

    function showNoProjects() {
        loading.style.display = 'none';
        projectsGrid.style.display = 'none';
        noProjects.style.display = 'block';
    }

    function showError(message) {
        hideLoading();
        projectsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p style="color: #dc3545; font-size: 16px;">${message}</p>
                <button onclick="loadProjects()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>
            </div>
        `;
    }

    function getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
    }
});

// Global functions for project actions
async function openProject(projectId) {
    try {
        window.location.href = `/ide?project=${projectId}`;
    } catch (error) {
        console.error('Error opening project:', error);
        alert('Failed to open project');
    }
}

async function downloadPDF(projectId) {
    try {
        const response = await fetch(`/download-pdf/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project-${projectId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            throw new Error('Failed to download PDF');
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF');
    }
}

async function duplicateProject(projectId) {
    try {
        const response = await fetch(`/duplicate-project/${projectId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            alert('Project duplicated successfully!');
            // Reload projects to show the new duplicate
            location.reload();
        } else {
            throw new Error('Failed to duplicate project');
        }
    } catch (error) {
        console.error('Error duplicating project:', error);
        alert('Failed to duplicate project');
    }
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/delete-project/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (response.ok) {
            alert('Project deleted successfully!');
            // Reload projects to update the list
            location.reload();
        } else {
            throw new Error('Failed to delete project');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userId');
    window.location.href = '/login';
}

function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}
