// ============================================
// admin&student.js - Fixed and Consolidated (NO DUPLICATES)
// ============================================

// Shared helpers
function getYearLevel(level) {
    const levels = {
        '1': '1st Year',
        '2': '2nd Year',
        '3': '3rd Year',
        '4': '4th Year'
    };
    return levels[String(level)] || level || '';
}

function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                <button data-close class="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div class="p-6">${content}</div>
            <div class="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
                <button data-close class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg">Close</button>
            </div>
        </div>
    `;

    // Close on outside click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.remove();
    });

    // Delegate close buttons
    modal.addEventListener('click', function (e) {
        if (e.target && e.target.matches('[data-close]')) modal.remove();
    });

    return modal;
}

// Small utility to safely query elements
function $qs(selector, parent = document) {
    return parent.querySelector(selector);
}

// Toggle password visibility in table
function togglePassword(button) {
    const passwordSpan = button.previousElementSibling;
    const actualPassword = passwordSpan.getAttribute('data-password');

    if (passwordSpan.textContent === '••••••••') {
        passwordSpan.textContent = actualPassword;
        button.setAttribute('title', 'Hide Password');
    } else {
        passwordSpan.textContent = '••••••••';
        button.setAttribute('title', 'Show Password');
    }
}

// ============================================
// ADMIN: USER MANAGEMENT - SINGLE VERSION
// ============================================

// Edit user function - loads data into form
function editUser(userId, email, password) {
    const form = document.getElementById('userForm');
    const emailField = document.getElementById('userEmail');
    const passwordField = document.getElementById('userPassword');
    const userIdField = document.getElementById('userId');
    const submitBtn = document.getElementById('submitBtn');

    if (!form || !emailField || !passwordField || !userIdField || !submitBtn) return;

    // Populate form fields
    emailField.value = email || '';
    passwordField.value = ''; // Don't show password, leave blank
    userIdField.value = userId || '';

    // Change form action to update
    form.action = '/update_user';

    // Change button to UPDATE
    submitBtn.textContent = 'UPDATE';
    submitBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
    submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');

    // Make password not required for updates
    passwordField.required = false;
    passwordField.placeholder = 'Leave blank to keep current password';

    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Reset form to add mode
function resetUserForm() {
    const form = document.getElementById('userForm');
    const userIdField = document.getElementById('userId');
    const passwordField = document.getElementById('userPassword');
    const submitBtn = document.getElementById('submitBtn');

    if (!form) return;

    // Reset form
    form.reset();
    form.action = '/add_user';

    // Clear hidden ID
    if (userIdField) userIdField.value = '';

    // Make password required again
    if (passwordField) {
        passwordField.required = true;
        passwordField.placeholder = '';
    }

    // Change button back to SAVE
    if (submitBtn) {
        submitBtn.textContent = 'SAVE';
        submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        submitBtn.classList.add('bg-green-500', 'hover:bg-green-600');
    }
}

// Delete user with confirmation
function deleteUser(userId, email) {
    if (confirm(`Are you sure you want to delete user: ${email}?`)) {
        window.location.href = `/delete_user/${userId}`;
    }
}

// View user details in modal
function viewUser(userId, email) {
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
// STUDENT MANAGEMENT (student_mngt.html)
// ============================================
let currentViewedStudentId = null;

function normalizeImagePath(imagePath) {
    if (!imagePath) return null;
    if (imagePath.startsWith('/static/') || imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('images/')) return `/static/${imagePath}`;
    return `/static/images/${imagePath}`;
}

function showFormActionButtons() {
    const buttonContainer = document.getElementById('formActionButtons');
    if (buttonContainer) buttonContainer.classList.remove('hidden');
}

function hideFormActionButtons() {
    const buttonContainer = document.getElementById('formActionButtons');
    if (buttonContainer) buttonContainer.classList.add('hidden');
}

function clearStudentViewForm() {
    currentViewedStudentId = null;

    const idNoEl = document.getElementById('idNo');
    const lastNameEl = document.getElementById('lastName');
    const firstNameEl = document.getElementById('firstName');
    const courseEl = document.getElementById('course');
    const levelEl = document.getElementById('level');

    if (idNoEl) idNoEl.value = '';
    if (lastNameEl) lastNameEl.value = '';
    if (firstNameEl) firstNameEl.value = '';
    if (courseEl) courseEl.value = '';
    if (levelEl) levelEl.value = '';

    const imageDisplay = document.getElementById('imageDisplay');
    const imagePlaceholder = document.getElementById('imagePlaceholder');

    if (imageDisplay && imagePlaceholder) {
        imageDisplay.classList.add('hidden');
        imagePlaceholder.classList.remove('hidden');
    }

    hideFormActionButtons();
}

function viewStudentInForm(studentId) {
    if (!studentId) return alert('No student selected');

    fetch(`/api/student/${studentId}`)
        .then(response => response.json())
        .then(data => {
            if (!data || !data.success) return alert('Error: Student not found');

            const student = data.student;
            currentViewedStudentId = studentId;

            const idNoEl = document.getElementById('idNo');
            const lastNameEl = document.getElementById('lastName');
            const firstNameEl = document.getElementById('firstName');
            const courseEl = document.getElementById('course');
            const levelEl = document.getElementById('level');

            if (idNoEl) idNoEl.value = student.idno || '';
            if (lastNameEl) lastNameEl.value = student.Lastname || '';
            if (firstNameEl) firstNameEl.value = student.Firstname || '';
            if (courseEl) courseEl.value = student.course || '';
            if (levelEl) levelEl.value = getYearLevel(student.level || '');

            const imageDisplay = document.getElementById('imageDisplay');
            const imagePlaceholder = document.getElementById('imagePlaceholder');

            const imagePath = normalizeImagePath(student.image);
            if (imagePath && imageDisplay && imagePlaceholder) {
                imageDisplay.src = imagePath;
                imageDisplay.classList.remove('hidden');
                imagePlaceholder.classList.add('hidden');
            } else if (imageDisplay && imagePlaceholder) {
                imageDisplay.classList.add('hidden');
                imagePlaceholder.classList.remove('hidden');
            }

            showFormActionButtons();

            const form = document.getElementById('studentViewForm');
            if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(err => {
            console.error(err);
            alert('Error loading student data');
        });
}

function viewStudent(studentId) {
    if (!studentId) return alert('No student selected');

    fetch(`/api/student/${studentId}`)
        .then(response => response.json())
        .then(data => {
            if (!data || !data.success) return alert('Error: Student not found');

            const student = data.student;
            const imagePath = normalizeImagePath(student.image);

            const modalContent = `
                <div class="space-y-4">
                    <div class="flex justify-center mb-4">
                        <div class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
                            ${imagePath ? `<img src="${imagePath}" alt="Student" class="w-full h-full object-cover">` : `
                                <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                </svg>
                            `}
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">ID Number</label>
                            <p class="text-gray-800">${student.idno || ''}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Course</label>
                            <p class="text-gray-800">${student.course || ''}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                            <p class="text-gray-800">${student.Lastname || ''}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                            <p class="text-gray-800">${student.Firstname || ''}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Year Level</label>
                            <p class="text-gray-800">${getYearLevel(student.level)}</p>
                        </div>
                    </div>
                </div>
            `;

            const modal = createModal('Student Details', modalContent);
            document.body.appendChild(modal);
        })
        .catch(err => {
            console.error(err);
            alert('Error loading student data');
        });
}

function deleteStudent(studentId, studentName) {
    if (confirm(`Are you sure you want to delete student: ${studentName}?`)) {
        window.location.href = `/delete_student/${studentId}`;
    }
}

// ============================================
// STUDENT FORM (student.html)
// ============================================
function addNewStudent() {
    const form = document.getElementById('studentForm');
    if (!form) return;

    form.reset();
    form.action = '/add_student';

    const idInput = form.querySelector('input[name="student_id"]');
    if (idInput) idInput.remove();

    const idNoField = document.getElementById('studentId');
    if (idNoField) {
        idNoField.disabled = false;
        idNoField.classList.remove('bg-gray-100', 'cursor-not-allowed');
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            SAVE STUDENT
        `;
        submitBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
        submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
        submitBtn.disabled = false;
    }

    const profileIcon = document.getElementById('profileIcon');
    const profilePlaceholder = document.getElementById('profilePlaceholder');
    if (profileIcon && profilePlaceholder) {
        profileIcon.classList.add('hidden');
        profilePlaceholder.classList.remove('hidden');
    }

    sessionStorage.removeItem('editStudentId');
}

function editStudent(studentId) {
    const form = document.getElementById('studentForm');
    const submitBtn = document.getElementById('submitBtn');
    if (!form || !submitBtn) return;

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Loading...';

    fetch(`/api/student/${studentId}`)
        .then(response => response.json())
        .then(data => {
            if (!data || !data.success) return alert('Error: Student not found');

            const student = data.student;

            const studentIdField = document.getElementById('studentId');
            const lastNameField = document.getElementById('lastName');
            const firstNameField = document.getElementById('firstName');
            const courseField = document.getElementById('course');
            const levelField = document.getElementById('level');

            if (studentIdField) studentIdField.value = student.idno || '';
            if (lastNameField) lastNameField.value = student.Lastname || '';
            if (firstNameField) firstNameField.value = student.Firstname || '';
            if (courseField) courseField.value = student.course || '';
            if (levelField) levelField.value = student.level || '';

            if (studentIdField) {
                studentIdField.disabled = true;
                studentIdField.classList.add('bg-gray-100', 'cursor-not-allowed');
            }

            // Handle profile image
            if (student.image) {
                const imagePath = normalizeImagePath(student.image);
                const profileIcon = document.getElementById('profileIcon');
                const profilePlaceholder = document.getElementById('profilePlaceholder');
                if (profileIcon && profilePlaceholder) {
                    profileIcon.src = imagePath;
                    profileIcon.classList.remove('hidden');
                    profilePlaceholder.classList.add('hidden');
                }
            }

            form.action = '/save_student';

            let idInput = form.querySelector('input[name="idno"][type="hidden"]');
            if (!idInput) {
                idInput = document.createElement('input');
                idInput.type = 'hidden';
                idInput.name = 'idno';
                form.appendChild(idInput);
            }
            idInput.value = student.idno || '';

            submitBtn.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                UPDATE STUDENT
            `;
            submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            submitBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');

            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(err => {
            console.error(err);
            alert('Error loading student data');
        })
        .finally(() => {
            submitBtn.disabled = false;
            if (submitBtn.innerHTML === 'Loading...') submitBtn.innerHTML = originalText || 'SAVE STUDENT';
        });
}

function cancelStudentForm() {
    const form = document.getElementById('studentForm');
    if (!form) return;

    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
        sessionStorage.removeItem('editStudentId');
        window.location.href = '/student-management';
    }
}

// ============================================
// EXPORT ALL FUNCTIONS TO WINDOW
// ============================================
window.getYearLevel = getYearLevel;
window.createModal = createModal;
window.togglePassword = togglePassword;
window.editUser = editUser;
window.resetUserForm = resetUserForm;
window.deleteUser = deleteUser;
window.viewUser = viewUser;
window.clearStudentViewForm = clearStudentViewForm;
window.viewStudentInForm = viewStudentInForm;
window.viewStudent = viewStudent;
window.deleteStudent = deleteStudent;
window.addNewStudent = addNewStudent;
window.editStudent = editStudent;
window.cancelStudentForm = cancelStudentForm;
window.editStudentRedirect = function (studentId) {
    const idToEdit = studentId || currentViewedStudentId;
    if (!idToEdit) return alert('Please select a student to edit');
    sessionStorage.setItem('editStudentId', idToEdit);
    window.location.href = '/student';
};

console.log('✅ Admin & Student management script loaded');