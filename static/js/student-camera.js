// ============================================
// STUDENT CAMERA & QR FUNCTIONALITY - WITH DUPLICATE ID CHECK
// ============================================

// Global Variables
let cameraActive = false;
let capturedImageData = null;
let currentQRCode = null;
let currentStudentId = null;
let isEditMode = false;
let isIdValid = false; // Track if ID is available
let idCheckTimeout;

// Initialize functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // --- Element References ---
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const fileUpload = document.getElementById('fileUpload');
    const studentForm = document.getElementById('studentForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const studentIdInput = document.getElementById('studentId');

    // --- Webcam Configuration ---
    Webcam.set({
        width: 640,
        height: 640,
        image_format: 'jpeg',
        jpeg_quality: 90,
        force_flash: false,
        flip_horiz: false,
        fps: 30
    });

    // --- Event Listeners: Camera & Form ---
    if (cameraBtn) cameraBtn.addEventListener('click', toggleCamera);
    if (captureBtn) captureBtn.addEventListener('click', captureSnapshot);
    if (retakeBtn) retakeBtn.addEventListener('click', retakePhoto);
    if (fileUpload) fileUpload.addEventListener('change', handleFileUpload);
    if (studentForm) studentForm.addEventListener('submit', handleFormSubmit);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelStudentForm);

    // --- Event Listeners: Student ID Validation ---
    if (studentIdInput) {
        // Real-time duplicate check
        studentIdInput.addEventListener('input', function (e) {
            const studentId = e.target.value.trim();

            clearTimeout(idCheckTimeout);
            isIdValid = false;
            hideIdMessages();

            if (studentId.length >= 3 && !isEditMode) {
                showIdChecking();
                idCheckTimeout = setTimeout(() => {
                    checkDuplicateId(studentId);
                }, 500);
            }

            // Generate QR code
            if (studentId.length >= 3) {
                generateQRCode(studentId);
            }
        });

        // Check on blur
        studentIdInput.addEventListener('blur', function (e) {
            const studentId = e.target.value.trim();
            if (studentId && !isEditMode) {
                checkDuplicateId(studentId);
            }
        });
    }

    // --- Check for Edit Mode ---
    const editStudentId = sessionStorage.getItem('editStudentId');
    if (editStudentId) {
        loadStudentForEdit(editStudentId);
        sessionStorage.removeItem('editStudentId');
    }
});

// ============================================
// DUPLICATE ID CHECK
// ============================================

function checkDuplicateId(studentId) {
    if (isEditMode) {
        isIdValid = true;
        return;
    }

    fetch(`/api/check_student_id/${studentId}`)
        .then(response => response.json())
        .then(data => {
            hideIdChecking();

            if (data.available) {
                isIdValid = true;
                showIdSuccess('✓ ID is available');
            } else {
                isIdValid = false;
                showIdError('✗ This ID already exists! Please use a different ID.');
            }
        })
        .catch(error => {
            console.error('Error checking ID:', error);
            hideIdChecking();
            showIdError('Error checking ID availability');
            isIdValid = false;
        });
}

function showIdChecking() {
    const studentIdInput = document.getElementById('studentId');
    if (!studentIdInput) return;

    hideIdMessages();

    const checkingMsg = document.createElement('p');
    checkingMsg.id = 'idCheckingMessage';
    checkingMsg.className = 'mt-1 text-sm text-blue-600 flex items-center gap-2';
    checkingMsg.innerHTML = `
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Checking ID availability...</span>
    `;

    studentIdInput.classList.remove('border-red-500', 'border-green-500');
    studentIdInput.classList.add('border-blue-400');
    studentIdInput.parentNode.appendChild(checkingMsg);
}

function hideIdChecking() {
    const checkingMsg = document.getElementById('idCheckingMessage');
    if (checkingMsg) checkingMsg.remove();
}

function showIdSuccess(message) {
    const studentIdInput = document.getElementById('studentId');
    if (!studentIdInput) return;

    hideIdMessages();

    const successMsg = document.createElement('p');
    successMsg.id = 'idSuccessMessage';
    successMsg.className = 'mt-1 text-sm text-green-600 font-semibold';
    successMsg.textContent = message;

    studentIdInput.classList.remove('border-red-500', 'border-blue-400');
    studentIdInput.classList.add('border-green-500');
    studentIdInput.parentNode.appendChild(successMsg);
}

function showIdError(message) {
    const studentIdInput = document.getElementById('studentId');
    if (!studentIdInput) return;

    hideIdMessages();

    const errorMsg = document.createElement('p');
    errorMsg.id = 'idErrorMessage';
    errorMsg.className = 'mt-1 text-sm text-red-600 font-semibold';
    errorMsg.textContent = message;

    studentIdInput.classList.remove('border-green-500', 'border-blue-400');
    studentIdInput.classList.add('border-red-500');
    studentIdInput.parentNode.appendChild(errorMsg);
}

function hideIdMessages() {
    const studentIdInput = document.getElementById('studentId');
    if (studentIdInput) {
        studentIdInput.classList.remove('border-red-500', 'border-green-500', 'border-blue-400');
    }

    ['idCheckingMessage', 'idSuccessMessage', 'idErrorMessage'].forEach(id => {
        const msg = document.getElementById(id);
        if (msg) msg.remove();
    });
}

// ============================================
// CAMERA FUNCTIONS
// ============================================

function toggleCamera() {
    if (!cameraActive) {
        startCamera();
    } else {
        stopCamera();
    }
}

function startCamera() {
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const cameraBtnText = document.getElementById('cameraBtnText');
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');

    Webcam.attach('#camera-container');

    if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
    if (captureBtn) captureBtn.classList.remove('hidden');
    if (cameraBtnText) cameraBtnText.textContent = 'Stop Camera';

    if (cameraBtn) {
        cameraBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        cameraBtn.classList.add('bg-red-500', 'hover:bg-red-600');
    }

    cameraActive = true;
    console.log('Camera started');
}

function stopCamera() {
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const cameraBtnText = document.getElementById('cameraBtnText');
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');

    Webcam.reset();

    if (cameraPlaceholder) cameraPlaceholder.style.display = 'flex';
    if (captureBtn) captureBtn.classList.add('hidden');
    if (cameraBtnText) cameraBtnText.textContent = 'Start Camera';

    if (cameraBtn) {
        cameraBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        cameraBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }

    cameraActive = false;
    console.log('Camera stopped');
}

function captureSnapshot() {
    if (!cameraActive) {
        alert('Please start the camera first');
        return;
    }

    Webcam.snap(function (data_uri) {
        stopCamera();
        compressAndStoreImage(data_uri);

        const cameraBtn = document.getElementById('cameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');

        if (cameraBtn) cameraBtn.classList.add('hidden');
        if (captureBtn) captureBtn.classList.add('hidden');
        if (retakeBtn) retakeBtn.classList.remove('hidden');
    });
}

function retakePhoto() {
    capturedImageData = null;

    const photoPreviewSection = document.getElementById('photoPreviewSection');
    if (photoPreviewSection) photoPreviewSection.classList.add('hidden');

    const retakeBtn = document.getElementById('retakeBtn');
    const cameraBtn = document.getElementById('cameraBtn');
    if (retakeBtn) retakeBtn.classList.add('hidden');
    if (cameraBtn) cameraBtn.classList.remove('hidden');

    const profileIcon = document.getElementById('profileIcon');
    const profilePlaceholder = document.getElementById('profilePlaceholder');
    const profileBadge = document.getElementById('profileBadge');

    if (profileIcon) profileIcon.classList.add('hidden');
    if (profilePlaceholder) profilePlaceholder.classList.remove('hidden');
    if (profileBadge) profileBadge.classList.add('hidden');

    startCamera();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or GIF)');
        event.target.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        compressAndStoreImage(e.target.result);

        if (cameraActive) stopCamera();

        const cameraBtn = document.getElementById('cameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');

        if (cameraBtn) cameraBtn.classList.add('hidden');
        if (captureBtn) captureBtn.classList.add('hidden');
        if (retakeBtn) retakeBtn.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function compressAndStoreImage(dataUri) {
    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = 640;
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUri = canvas.toDataURL('image/jpeg', 0.8);
        capturedImageData = compressedDataUri;
        updateImagePreview(compressedDataUri);

        console.log('Image compressed and stored');
    };
    img.src = dataUri;
}

function updateImagePreview(dataUri) {
    const photoPreviewSection = document.getElementById('photoPreviewSection');
    const photoPreview = document.getElementById('photoPreview');
    const profileIcon = document.getElementById('profileIcon');
    const profilePlaceholder = document.getElementById('profilePlaceholder');
    const profileBadge = document.getElementById('profileBadge');

    if (photoPreviewSection && photoPreview) {
        photoPreview.src = dataUri;
        photoPreviewSection.classList.remove('hidden');
    }

    if (profileIcon) {
        profileIcon.src = dataUri;
        profileIcon.classList.remove('hidden');
    }
    if (profilePlaceholder) profilePlaceholder.classList.add('hidden');
    if (profileBadge) profileBadge.classList.remove('hidden');

    const studentId = document.getElementById('studentId')?.value;
    if (studentId) {
        generateQRCode(studentId);
    }
}

// ============================================
// QR CODE GENERATION
// ============================================

function generateQRCode(studentId) {
    if (!studentId) return;

    console.log('🔲 Generating QR Code for:', studentId);
    currentStudentId = studentId;

    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const qrCodeSection = document.getElementById('qrCodeSection');

    if (!qrCodeContainer) return;

    qrCodeContainer.innerHTML = '';

    if (qrCodeSection) {
        qrCodeSection.classList.remove('hidden');
    }

    currentQRCode = new QRCode(qrCodeContainer, {
        text: studentId,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function downloadQRCode() {
    if (!currentStudentId) {
        alert('Please generate a QR code first');
        return;
    }

    const qrCodeContainer = document.getElementById('qrCodeContainer');
    if (!qrCodeContainer) return;

    const canvas = qrCodeContainer.querySelector('canvas');
    const img = qrCodeContainer.querySelector('img');

    if (canvas) {
        downloadFromCanvas(canvas);
    } else if (img) {
        downloadFromImage(img);
    } else {
        alert('QR Code not found');
    }
}

function downloadFromCanvas(originalCanvas) {
    try {
        const padding = 25;
        const canvas = document.createElement('canvas');

        canvas.width = originalCanvas.width + (padding * 2);
        canvas.height = originalCanvas.height + (padding * 2);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalCanvas, padding, padding);

        const dataURL = canvas.toDataURL('image/png');
        downloadImage(dataURL, `QR_${currentStudentId}.png`);
    } catch (error) {
        console.error('Error downloading QR code:', error);
    }
}

function downloadFromImage(img) {
    try {
        const padding = 25;
        const canvas = document.createElement('canvas');

        const imgWidth = img.width || 256;
        const imgHeight = img.height || 256;

        canvas.width = imgWidth + (padding * 2);
        canvas.height = imgHeight + (padding * 2);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);

        const dataURL = canvas.toDataURL('image/png');
        downloadImage(dataURL, `QR_${currentStudentId}.png`);
    } catch (error) {
        console.error('Error downloading QR code:', error);
    }
}

function downloadImage(dataURL, filename) {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// FORM SUBMISSION & EDITING
// ============================================

function handleFormSubmit(event) {
    // Check for duplicate ID (only in add mode)
    if (!isEditMode && !isIdValid) {
        event.preventDefault();
        alert('Please use a valid, unique Student ID');
        return false;
    }

    // Check for photo (optional in edit mode)
    if (!capturedImageData && !isEditMode) {
        event.preventDefault();
        alert('Please capture or upload a profile photo');
        return false;
    }

    const imageDataField = document.getElementById('imageData');
    if (imageDataField && capturedImageData) {
        imageDataField.value = capturedImageData;
    }

    const form = document.getElementById('studentForm');
    const studentIdInput = document.getElementById('studentId');

    if (isEditMode && studentIdInput && studentIdInput.disabled) {
        let hiddenIdInput = form.querySelector('input[name="idno"][type="hidden"]');
        if (!hiddenIdInput) {
            hiddenIdInput = document.createElement('input');
            hiddenIdInput.type = 'hidden';
            hiddenIdInput.name = 'idno';
            form.appendChild(hiddenIdInput);
        }
        hiddenIdInput.value = studentIdInput.value;
    }

    return true;
}

function loadStudentForEdit(studentId) {
    isEditMode = true;
    isIdValid = true; // Skip validation in edit mode

    fetch(`/api/student/${studentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const student = data.student;

                document.getElementById('studentId').value = student.idno;
                document.getElementById('lastName').value = student.Lastname;
                document.getElementById('firstName').value = student.Firstname;
                document.getElementById('course').value = student.course;
                document.getElementById('level').value = student.level;

                const studentIdField = document.getElementById('studentId');
                studentIdField.disabled = true;
                studentIdField.classList.add('bg-gray-100', 'cursor-not-allowed');

                if (student.image) {
                    let imagePath = student.image;
                    if (!imagePath.startsWith('/static/') && !imagePath.startsWith('http')) {
                        imagePath = imagePath.startsWith('images/')
                            ? `/static/${imagePath}`
                            : `/static/images/${imagePath}`;
                    }
                    capturedImageData = imagePath;
                    updateImagePreview(imagePath);

                    const cameraBtn = document.getElementById('cameraBtn');
                    const captureBtn = document.getElementById('captureBtn');
                    const retakeBtn = document.getElementById('retakeBtn');

                    if (cameraBtn) cameraBtn.classList.add('hidden');
                    if (captureBtn) captureBtn.classList.add('hidden');
                    if (retakeBtn) retakeBtn.classList.remove('hidden');
                }

                generateQRCode(student.idno);

                const form = document.getElementById('studentForm');
                const submitBtn = document.getElementById('submitBtn');

                if (form) {
                    form.action = '/save_student';

                    let hiddenIdInput = form.querySelector('input[name="idno"][type="hidden"]');
                    if (!hiddenIdInput) {
                        hiddenIdInput = document.createElement('input');
                        hiddenIdInput.type = 'hidden';
                        hiddenIdInput.name = 'idno';
                        form.appendChild(hiddenIdInput);
                    }
                    hiddenIdInput.value = student.idno;
                }

                if (submitBtn) {
                    submitBtn.innerHTML = `
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        UPDATE STUDENT
                    `;
                    submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                    submitBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
                }

                console.log('✅ Student loaded for editing:', student.idno);
            }
        })
        .catch(error => {
            console.error('Error loading student:', error);
            alert('Error loading student data');
        });
}

// ============================================
// EXPORTS
// ============================================

window.generateQRCode = generateQRCode;
window.downloadQRCode = downloadQRCode;
window.loadStudentForEdit = loadStudentForEdit;
window.checkDuplicateId = checkDuplicateId;

console.log('✅ Student Camera & QR Scripts loaded with Duplicate ID Check');