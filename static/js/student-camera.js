// ============================================
// STUDENT CAMERA FUNCTIONALITY
// Using WebcamJS for camera capture
// ============================================

let cameraActive = false;
let capturedImageData = null;

// Initialize camera functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const fileUpload = document.getElementById('fileUpload');
    const studentForm = document.getElementById('studentForm');
    const cancelBtn = document.getElementById('cancelBtn');

    // Configure Webcam.js with HD settings
    Webcam.set({
        width: 640,
        height: 640,
        image_format: 'jpeg',
        jpeg_quality: 90,
        force_flash: false,
        flip_horiz: false,
        fps: 30
    });

    // Camera button click handler
    if (cameraBtn) {
        cameraBtn.addEventListener('click', toggleCamera);
    }

    // Capture button click handler
    if (captureBtn) {
        captureBtn.addEventListener('click', captureSnapshot);
    }

    // Retake button click handler
    if (retakeBtn) {
        retakeBtn.addEventListener('click', retakePhoto);
    }

    // File upload handler
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload);
    }

    // Form submit handler
    if (studentForm) {
        studentForm.addEventListener('submit', handleFormSubmit);
    }

    // Cancel button handler
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelStudentForm);
    }

    // Check if we're editing a student
    const editStudentId = sessionStorage.getItem('editStudentId');
    if (editStudentId) {
        loadStudentForEdit(editStudentId);
        sessionStorage.removeItem('editStudentId');
    }
});

// Toggle camera on/off
function toggleCamera() {
    if (!cameraActive) {
        startCamera();
    } else {
        stopCamera();
    }
}

// Start the camera
function startCamera() {
    const cameraContainer = document.getElementById('camera-container');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const cameraBtnText = document.getElementById('cameraBtnText');
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');

    // Attach webcam
    Webcam.attach('#camera-container');

    // Hide placeholder
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'none';
    }

    // Show capture button
    if (captureBtn) {
        captureBtn.classList.remove('hidden');
    }

    // Update camera button
    if (cameraBtnText) {
        cameraBtnText.textContent = 'Stop Camera';
    }
    if (cameraBtn) {
        cameraBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        cameraBtn.classList.add('bg-red-500', 'hover:bg-red-600');
    }

    cameraActive = true;
    console.log('Camera started');
}

// Stop the camera
function stopCamera() {
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const cameraBtnText = document.getElementById('cameraBtnText');
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');

    // Reset webcam
    Webcam.reset();

    // Show placeholder
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'flex';
    }

    // Hide capture button
    if (captureBtn) {
        captureBtn.classList.add('hidden');
    }

    // Update camera button
    if (cameraBtnText) {
        cameraBtnText.textContent = 'Start Camera';
    }
    if (cameraBtn) {
        cameraBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        cameraBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }

    cameraActive = false;
    console.log('Camera stopped');
}

// Capture snapshot from camera
function captureSnapshot() {
    if (!cameraActive) {
        alert('Please start the camera first');
        return;
    }

    // Take snapshot
    Webcam.snap(function (data_uri) {
        // Stop camera
        stopCamera();

        // Compress and store image
        compressAndStoreImage(data_uri);

        // Hide camera button and capture button
        const cameraBtn = document.getElementById('cameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        if (cameraBtn) {
            cameraBtn.classList.add('hidden');
        }
        if (captureBtn) {
            captureBtn.classList.add('hidden');
        }

        // Show retake button
        const retakeBtn = document.getElementById('retakeBtn');
        if (retakeBtn) {
            retakeBtn.classList.remove('hidden');
        }
    });
}

// Retake photo
function retakePhoto() {
    // Clear captured image
    capturedImageData = null;

    // Hide photo preview
    const photoPreviewSection = document.getElementById('photoPreviewSection');
    if (photoPreviewSection) {
        photoPreviewSection.classList.add('hidden');
    }

    // Hide retake button
    const retakeBtn = document.getElementById('retakeBtn');
    if (retakeBtn) {
        retakeBtn.classList.add('hidden');
    }

    // Show camera button again
    const cameraBtn = document.getElementById('cameraBtn');
    if (cameraBtn) {
        cameraBtn.classList.remove('hidden');
    }

    // Reset profile icon
    const profileIcon = document.getElementById('profileIcon');
    const profilePlaceholder = document.getElementById('profilePlaceholder');
    const profileBadge = document.getElementById('profileBadge');

    if (profileIcon) profileIcon.classList.add('hidden');
    if (profilePlaceholder) profilePlaceholder.classList.remove('hidden');
    if (profileBadge) profileBadge.classList.add('hidden');

    // Hide QR Code section
    const qrCodeSection = document.getElementById('qrCodeSection');
    if (qrCodeSection) {
        qrCodeSection.classList.add('hidden');
    }

    // Restart camera automatically
    startCamera();
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or GIF)');
        event.target.value = '';
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        event.target.value = '';
        return;
    }

    // Read and process file
    const reader = new FileReader();
    reader.onload = function (e) {
        compressAndStoreImage(e.target.result);

        // Hide camera button and capture button
        const cameraBtn = document.getElementById('cameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        if (cameraBtn) {
            cameraBtn.classList.add('hidden');
        }
        if (captureBtn) {
            captureBtn.classList.add('hidden');
        }

        // Stop camera if active
        if (cameraActive) {
            stopCamera();
        }

        // Show retake button
        const retakeBtn = document.getElementById('retakeBtn');
        if (retakeBtn) {
            retakeBtn.classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
}

// Compress and store image
function compressAndStoreImage(dataUri) {
    const img = new Image();
    img.onload = function () {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set max dimensions (640x640 for square)
        const maxSize = 640;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
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

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG (quality 0.8)
        const compressedDataUri = canvas.toDataURL('image/jpeg', 0.8);

        // Store compressed image
        capturedImageData = compressedDataUri;

        // Update preview
        updateImagePreview(compressedDataUri);

        console.log('Image compressed and stored');
    };
    img.src = dataUri;
}

// Update image preview
function updateImagePreview(dataUri) {
    // Update photo preview section
    const photoPreviewSection = document.getElementById('photoPreviewSection');
    const photoPreview = document.getElementById('photoPreview');

    if (photoPreviewSection && photoPreview) {
        photoPreview.src = dataUri;
        photoPreviewSection.classList.remove('hidden');
    }

    // Update profile icon
    const profileIcon = document.getElementById('profileIcon');
    const profilePlaceholder = document.getElementById('profilePlaceholder');
    const profileBadge = document.getElementById('profileBadge');

    if (profileIcon) {
        profileIcon.src = dataUri;
        profileIcon.classList.remove('hidden');
    }
    if (profilePlaceholder) {
        profilePlaceholder.classList.add('hidden');
    }
    if (profileBadge) {
        profileBadge.classList.remove('hidden');
    }

    // Generate QR Code if student ID is entered
    const studentId = document.getElementById('studentId')?.value;
    if (studentId) {
        generateQRCode(studentId);
    }
}

// Generate QR Code
function generateQRCode(studentId) {
    const qrCodeSection = document.getElementById('qrCodeSection');
    const qrCodeContainer = document.getElementById('qrCodeContainer');

    if (!qrCodeContainer) return;

    // Clear previous QR code
    qrCodeContainer.innerHTML = '';

    // Show QR section
    if (qrCodeSection) {
        qrCodeSection.classList.remove('hidden');
    }

    // Generate new QR code
    new QRCode(qrCodeContainer, {
        text: studentId,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    console.log('QR Code generated for:', studentId);
}

// Download QR Code function
function downloadQRCode() {
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const studentId = document.getElementById('studentId')?.value || 'student';

    if (!qrCodeContainer) return;

    const canvas = qrCodeContainer.querySelector('canvas');
    if (!canvas) {
        alert('No QR code to download');
        return;
    }

    // Convert canvas to blob and download
    canvas.toBlob(function (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrcode-${studentId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// Handle form submit
function handleFormSubmit(event) {
    // Validate that we have a captured image
    if (!capturedImageData) {
        event.preventDefault();
        alert('Please capture or upload a profile photo');
        return false;
    }

    // Add image data to hidden field
    const imageDataField = document.getElementById('imageData');
    if (imageDataField) {
        imageDataField.value = capturedImageData;
    }

    return true;
}

// Load student for editing
function loadStudentForEdit(studentId) {
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

                // Disable ID field
                document.getElementById('studentId').disabled = true;

                // Load existing image
                if (student.image) {
                    let imagePath = student.image;
                    if (!imagePath.startsWith('/static/') && !imagePath.startsWith('http')) {
                        if (imagePath.startsWith('images/')) {
                            imagePath = `/static/${imagePath}`;
                        } else {
                            imagePath = `/static/images/${imagePath}`;
                        }
                    }

                    // Set as captured image data
                    capturedImageData = imagePath;

                    // Update preview
                    updateImagePreview(imagePath);

                    // Hide camera button and show retake button
                    const cameraBtn = document.getElementById('cameraBtn');
                    const captureBtn = document.getElementById('captureBtn');
                    const retakeBtn = document.getElementById('retakeBtn');

                    if (cameraBtn) cameraBtn.classList.add('hidden');
                    if (captureBtn) captureBtn.classList.add('hidden');
                    if (retakeBtn) retakeBtn.classList.remove('hidden');
                }

                // Generate QR code
                generateQRCode(student.idno);

                // Change form action
                const form = document.getElementById('studentForm');
                if (form) {
                    form.action = '/save_student';
                }

                // Update submit button
                const submitBtn = document.getElementById('submitBtn');
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
            }
        })
        .catch(error => {
            console.error('Error loading student:', error);
            alert('Error loading student data');
        });
}

// Listen for student ID changes to generate QR code
document.addEventListener('DOMContentLoaded', function () {
    const studentIdField = document.getElementById('studentId');
    if (studentIdField) {
        studentIdField.addEventListener('blur', function () {
            const studentId = this.value.trim();
            if (studentId && capturedImageData) {
                generateQRCode(studentId);
            }
        });
    }
});

// Make downloadQRCode available globally
window.downloadQRCode = downloadQRCode;