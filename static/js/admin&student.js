// ============================================
// ADMIN.HTML - USER MANAGEMENT FUNCTIONS
// ============================================

// Function to edit user - populates form with user data
function editUser(userId, email) {
    // Populate form fields with user data
    document.querySelector('input[name="email"]').value = email;
    document.querySelector('input[name="password"]').value = '';

    // Change form action to update
    const form = document.querySelector('form[action="/add_user"]') || document.querySelector('form[action="/update_user"]');
    if (form) {
        form.action = '/update_user';

        // Add hidden input for user ID if it doesn't exist
        let idInput = form.querySelector('input[name="id"]');
        if (!idInput) {
            idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.name = 'id';
            form.appendChild(idInput);
        }
        idInput.value = userId;

        // Change button text to UPDATE
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'UPDATE';
        submitBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Function to reset user form
function resetUserForm() {
    const form = document.querySelector('form[action="/add_user"], form[action="/update_user"]');
    if (form) {
        form.reset();
        form.action = '/add_user';

        // Remove hidden ID input if exists
        const idInput = form.querySelector('input[name="id"]');
        if (idInput) {
            idInput.remove();
        }

        // Reset button text
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'SAVE';
        submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        submitBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    }
}

// Function to delete user with confirmation
function deleteUser(userId, email) {
    if (confirm(`Are you sure you want to delete user: ${email}?`)) {
        window.location.href = `/delete_user/${userId}`;
    }
}

// Function to view user details (read-only)
function viewUser(userId, email) {
    // Create modal for viewing user details
    const modal = createModal('User Details', `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">User ID</label>
                <p class="text-gray-800">${userId}</p>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <p class="text-gray-800">${email}</p>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <p class="text-gray-800">••••••••</p>
            </div>
        </div>
    `);

    document.body.appendChild(modal);
}

// ============================================
// STUDENT_MNGT.HTML - STUDENT MANAGEMENT FUNCTIONS
// ============================================

// Global variable to store currently viewed student ID
let currentViewedStudentId = null;

// Function to view student in the form (Student_mngt.html specific)
function viewStudentInForm(studentId) {
    fetch(`/api/student/${studentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const student = data.student;

                // Store the current student ID
                currentViewedStudentId = studentId;

                // Populate form fields
                document.getElementById('idNo').value = student.idno;
                document.getElementById('lastName').value = student.Lastname;
                document.getElementById('firstName').value = student.Firstname;
                document.getElementById('course').value = student.course;
                document.getElementById('level').value = getYearLevel(student.level);

                // Update image preview
                const imageDisplay = document.getElementById('imageDisplay');
                const imagePlaceholder = document.getElementById('imagePlaceholder');

                if (student.image) {
                    imageDisplay.src = student.image;
                    imageDisplay.classList.remove('hidden');
                    imagePlaceholder.classList.add('hidden');
                } else {
                    imageDisplay.classList.add('hidden');
                    imagePlaceholder.classList.remove('hidden');
                }

                // Show edit and clear buttons
                showFormActionButtons();

                // Scroll to form
                const form = document.getElementById('studentViewForm');
                if (form) {
                    form.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } else {
                alert('Error: Student not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading student data');
        });
}

// Function to show edit and clear buttons
function showFormActionButtons() {
    const buttonContainer = document.getElementById('formActionButtons');
    if (buttonContainer) {
        buttonContainer.classList.remove('hidden');
    }
}

// Function to hide edit and clear buttons
function hideFormActionButtons() {
    const buttonContainer = document.getElementById('formActionButtons');
    if (buttonContainer) {
        buttonContainer.classList.add('hidden');
    }
}

// Function to redirect to STUDENT page for editing
function editStudentRedirect(studentId) {
    // Use the current viewed student ID if not provided
    const idToEdit = studentId || currentViewedStudentId;

    if (!idToEdit) {
        alert('Please select a student to edit');
        return;
    }

    // Store student ID in sessionStorage for editing
    sessionStorage.setItem('editStudentId', idToEdit);
    // Redirect to student form page
    window.location.href = '/student';
}

// Function to clear the student view form
function clearStudentViewForm() {
    const form = document.getElementById('studentViewForm');
    if (form) {
        form.reset();

        // Reset image
        const imageDisplay = document.getElementById('imageDisplay');
        const imagePlaceholder = document.getElementById('imagePlaceholder');
        if (imageDisplay && imagePlaceholder) {
            imageDisplay.classList.add('hidden');
            imagePlaceholder.classList.remove('hidden');
        }

        // Clear current student ID
        currentViewedStudentId = null;

        // Hide action buttons
        hideFormActionButtons();
    }
}

// Function to view student details (read-only modal) - Alternative view
function viewStudent(studentId) {
    // Fetch student data
    fetch(`/api/student/${studentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const student = data.student;

                // Create modal with student details
                const modal = createModal('Student Details', `
                    <div class="space-y-4">
                        <div class="flex justify-center mb-4">
                            <div class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
                                ${student.image ?
                        `<img src="${student.image}" alt="Student" class="w-full h-full object-cover">` :
                        `<svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                    </svg>`
                    }
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">ID Number</label>
                                <p class="text-gray-800">${student.idno}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Course</label>
                                <p class="text-gray-800">${student.course}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                                <p class="text-gray-800">${student.Lastname}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                                <p class="text-gray-800">${student.Firstname}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Year Level</label>
                                <p class="text-gray-800">${getYearLevel(student.level)}</p>
                            </div>
                        </div>
                    </div>
                `);

                document.body.appendChild(modal);
            } else {
                alert('Error: Student not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading student data');
        });
}

// Function to delete student with confirmation
function deleteStudent(studentId, studentName) {
    if (confirm(`Are you sure you want to delete student: ${studentName}?`)) {
        window.location.href = `/delete_student/${studentId}`;
    }
}

// ============================================
// STUDENT.HTML - STUDENT FORM FUNCTIONS
// ============================================

// Function to add new student - resets form for new entry
function addNewStudent() {
    const form = document.getElementById('studentForm');
    if (form) {
        form.reset();
        form.action = '/add_student';

        // Remove hidden ID input if exists
        const idInput = form.querySelector('input[name="student_id"]');
        if (idInput) {
            idInput.remove();
        }

        // Enable ID field for new student
        const idNoField = document.getElementById('studentId');
        if (idNoField) {
            idNoField.disabled = false;
        }

        // Reset button text and style
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.textContent = 'SAVE';
            submitBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
            submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }

        // Reset image preview
        const profileIcon = document.getElementById('profileIcon');
        const profilePlaceholder = document.getElementById('profilePlaceholder');
        if (profileIcon && profilePlaceholder) {
            profileIcon.classList.add('hidden');
            profilePlaceholder.classList.remove('hidden');
        }

        // Clear sessionStorage
        sessionStorage.removeItem('editStudentId');
    }
}

// Function to edit student - populates form with student data (for Student.html)
function editStudent(studentId) {
    // Show loading state
    const form = document.getElementById('studentForm');
    const submitBtn = document.getElementById('submitBtn');

    if (!form || !submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';

    // Fetch student data from API
    fetch(`/api/student/${studentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const student = data.student;

                // Populate form fields
                document.getElementById('studentId').value = student.idno;
                document.getElementById('lastName').value = student.Lastname;
                document.getElementById('firstName').value = student.Firstname;
                document.getElementById('course').value = student.course;
                document.getElementById('level').value = student.level;

                // Disable ID field when editing (ID shouldn't change)
                document.getElementById('studentId').disabled = true;

                // Update profile icon if image exists
                if (student.image) {
                    const profileIcon = document.getElementById('profileIcon');
                    const profilePlaceholder = document.getElementById('profilePlaceholder');
                    if (profileIcon && profilePlaceholder) {
                        profileIcon.src = student.image;
                        profileIcon.classList.remove('hidden');
                        profilePlaceholder.classList.add('hidden');
                    }
                }

                // Change form action to update
                form.action = '/save_student';

                // Add hidden input for student ID
                let idInput = form.querySelector('input[name="idno"]');
                if (!idInput) {
                    idInput = document.createElement('input');
                    idInput.type = 'hidden';
                    idInput.name = 'idno';
                    form.appendChild(idInput);
                }
                idInput.value = student.idno;

                // Change button text and style
                submitBtn.textContent = 'UPDATE';
                submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                submitBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');

                // Scroll to form
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                alert('Error: Student not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading student data');
        })
        .finally(() => {
            submitBtn.disabled = false;
            if (submitBtn.textContent === 'Loading...') {
                submitBtn.textContent = 'SAVE';
            }
        });
}

// Function to cancel student form
function cancelStudentForm() {
    const form = document.getElementById('studentForm');
    if (form) {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            // Clear sessionStorage
            sessionStorage.removeItem('editStudentId');
            // Redirect to student management page
            window.location.href = '/student-management';
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Helper function to get year level text
function getYearLevel(level) {
    const levels = {
        '1': '1st Year',
        '2': '2nd Year',
        '3': '3rd Year',
        '4': '4th Year',
        '1st Year': '1st Year',
        '2nd Year': '2nd Year',
        '3rd Year': '3rd Year',
        '4th Year': '4th Year'
    };
    return levels[level] || level;
}

// Helper function to create modal
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="px-6 py-4">
                ${content}
            </div>
            <div class="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                <button onclick="this.closest('.fixed').remove()" 
                    class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition">
                    Close
                </button>
            </div>
        </div>
    `;

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    return modal;
}

// Form validation for student form
function validateStudentForm() {
    const idNo = document.getElementById('studentId')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const firstName = document.getElementById('firstName')?.value.trim();
    const course = document.getElementById('course')?.value;
    const level = document.getElementById('level')?.value;

    if (!idNo) {
        alert('Please enter ID Number');
        document.getElementById('studentId')?.focus();
        return false;
    }

    if (!lastName) {
        alert('Please enter Last Name');
        document.getElementById('lastName')?.focus();
        return false;
    }

    if (!firstName) {
        alert('Please enter First Name');
        document.getElementById('firstName')?.focus();
        return false;
    }

    if (!course) {
        alert('Please select a Course');
        document.getElementById('course')?.focus();
        return false;
    }

    if (!level) {
        alert('Please select a Level');
        document.getElementById('level')?.focus();
        return false;
    }

    return true;
}

// Form validation for user form
function validateUserForm() {
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');

    if (!emailInput || !passwordInput) return true;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
        alert('Please enter email address');
        emailInput.focus();
        return false;
    }

    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        emailInput.focus();
        return false;
    }

    if (!password) {
        alert('Please enter password');
        passwordInput.focus();
        return false;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        passwordInput.focus();
        return false;
    }

    return true;
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if we need to load student for editing (from sessionStorage)
    const editStudentId = sessionStorage.getItem('editStudentId');
    if (editStudentId && document.getElementById('studentForm')) {
        // We're on the student form page and need to edit a student
        editStudent(editStudentId);
        // Clear the sessionStorage after loading
        sessionStorage.removeItem('editStudentId');
    }

    // Student form validation
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', function (e) {
            if (!validateStudentForm()) {
                e.preventDefault();
            }
        });

        // Cancel button handler
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelStudentForm);
        }
    }

    // User form validation
    const userForms = document.querySelectorAll('form[action="/add_user"], form[action="/update_user"]');
    userForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            if (!validateUserForm()) {
                e.preventDefault();
            }
        });
    });

    // Add Student button handler (if exists on page)
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', addNewStudent);
    }

    // Edit button handler for Student_mngt.html
    const editFormBtn = document.getElementById('editFormBtn');
    if (editFormBtn) {
        editFormBtn.addEventListener('click', function () {
            editStudentRedirect();
        });
    }

    // Clear form button handler for Student_mngt.html
    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearStudentViewForm);
    }
});