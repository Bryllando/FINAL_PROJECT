// ============================================
// STUDENT CAMERA & QR FUNCTIONALITY
// ============================================

// Global Variables
let cameraActive = false;
let capturedImageData = null;
let currentQRCode = null;
let currentStudentId = null;

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

    // --- Event Listeners: QR Code Generation ---
    if (studentIdInput) {
        // Generate on typing (after 3 chars)
        studentIdInput.addEventListener('input', function (e) {
            const studentId = e.target.value.trim();
            if (studentId.length >= 3) {
                generateQRCode(studentId);
            }
        });

        // Generate on leave field
        studentIdInput.addEventListener('blur', function (e) {
            const studentId = e.target.value.trim();
            if (studentId) {
                generateQRCode(studentId);
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
// CAMERA FUNCTIONS
// ============================================

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
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const cameraBtnText = document.getElementById('cameraBtnText');
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');

    // Attach webcam
    Webcam.attach('#camera-container');

    // UI Updates
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

// Stop the camera
function stopCamera() {
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const cameraBtnText = document.getElementById('cameraBtnText');
    const cameraBtn = document.getElementById('cameraBtn');
    const captureBtn = document.getElementById('captureBtn');

    // Reset webcam
    Webcam.reset();

    // UI Updates
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

// Capture snapshot from camera
function captureSnapshot() {
    if (!cameraActive) {
        alert('Please start the camera first');
        return;
    }

    Webcam.snap(function (data_uri) {
        stopCamera();
        compressAndStoreImage(data_uri);

        // UI Updates
        const cameraBtn = document.getElementById('cameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');

        if (cameraBtn) cameraBtn.classList.add('hidden');
        if (captureBtn) captureBtn.classList.add('hidden');
        if (retakeBtn) retakeBtn.classList.remove('hidden');
    });
}

// Retake photo
function retakePhoto() {
    capturedImageData = null;

    // Hide photo preview
    const photoPreviewSection = document.getElementById('photoPreviewSection');
    if (photoPreviewSection) photoPreviewSection.classList.add('hidden');

    // Hide retake button, show camera button
    const retakeBtn = document.getElementById('retakeBtn');
    const cameraBtn = document.getElementById('cameraBtn');
    if (retakeBtn) retakeBtn.classList.add('hidden');
    if (cameraBtn) cameraBtn.classList.remove('hidden');

    // Reset profile icon/placeholder
    const profileIcon = document.getElementById('profileIcon');
    const profilePlaceholder = document.getElementById('profilePlaceholder');
    const profileBadge = document.getElementById('profileBadge');

    if (profileIcon) profileIcon.classList.add('hidden');
    if (profilePlaceholder) profilePlaceholder.classList.remove('hidden');
    if (profileBadge) profileBadge.classList.add('hidden');

    // Restart camera
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

        if (cameraActive) stopCamera();

        // UI Updates
        const cameraBtn = document.getElementById('cameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');

        if (cameraBtn) cameraBtn.classList.add('hidden');
        if (captureBtn) captureBtn.classList.add('hidden');
        if (retakeBtn) retakeBtn.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// Compress and store image
function compressAndStoreImage(dataUri) {
    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = 640;
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
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

// Update image preview
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

    // Trigger QR generation if ID exists
    const studentId = document.getElementById('studentId')?.value;
    if (studentId) {
        generateQRCode(studentId);
    }
}

// ============================================
// QR CODE GENERATION AND DOWNLOAD
// ============================================

/**
 * Generate QR Code for student ID
 */
function generateQRCode(studentId) {
    if (!studentId) {
        console.warn('No student ID provided for QR generation');
        return;
    }

    console.log('🔲 Generating QR Code for:', studentId);
    currentStudentId = studentId;

    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const qrCodeSection = document.getElementById('qrCodeSection');

    if (!qrCodeContainer) {
        console.error('QR Code container not found');
        return;
    }

    // Clear previous QR code
    qrCodeContainer.innerHTML = '';

    // Show QR code section
    if (qrCodeSection) {
        qrCodeSection.classList.remove('hidden');
    }

    // Generate new QR code
    currentQRCode = new QRCode(qrCodeContainer, {
        text: studentId,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    console.log('✅ QR Code generated successfully');
}

/**
 * Download QR Code as PNG with white background
 */
function downloadQRCode() {
    if (!currentStudentId) {
        alert('Please generate a QR code first by filling in the student ID');
        return;
    }

    const qrCodeContainer = document.getElementById('qrCodeContainer');
    if (!qrCodeContainer) {
        alert('QR Code container not found');
        return;
    }

    const canvas = qrCodeContainer.querySelector('canvas');
    const img = qrCodeContainer.querySelector('img');

    if (canvas) {
        downloadFromCanvas(canvas);
    } else if (img) {
        downloadFromImage(img);
    } else {
        alert('QR Code not found. Please generate a QR code first.');
    }
}

/**
 * Download from canvas (adds white border/padding)
 * UPDATED: Creates a larger canvas to include a white margin
 */
function downloadFromCanvas(originalCanvas) {
    try {
        const padding = 25; // 25px white border
        const canvas = document.createElement('canvas');

        // Make new canvas larger than original to accommodate padding
        canvas.width = originalCanvas.width + (padding * 2);
        canvas.height = originalCanvas.height + (padding * 2);
        const ctx = canvas.getContext('2d');

        // Fill entire canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the QR code in the center (offset by padding)
        ctx.drawImage(originalCanvas, padding, padding);

        const dataURL = canvas.toDataURL('image/png');
        downloadImage(dataURL, `QR_${currentStudentId}.png`);
    } catch (error) {
        console.error('Error downloading QR code:', error);
        alert('Error downloading QR code.');
    }
}

/**
 * Download from image (adds white border/padding)
 * UPDATED: Creates a larger canvas to include a white margin
 */
function downloadFromImage(img) {
    try {
        const padding = 25; // 25px white border
        const canvas = document.createElement('canvas');

        const imgWidth = img.width || 256;
        const imgHeight = img.height || 256;

        // Make new canvas larger than original to accommodate padding
        canvas.width = imgWidth + (padding * 2);
        canvas.height = imgHeight + (padding * 2);
        const ctx = canvas.getContext('2d');

        // Fill entire canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Image in the center (offset by padding)
        ctx.drawImage(img, padding, padding);

        const dataURL = canvas.toDataURL('image/png');
        downloadImage(dataURL, `QR_${currentStudentId}.png`);
    } catch (error) {
        console.error('Error downloading QR code:', error);
        alert('Error downloading QR code.');
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

function downloadQRCodeAsSVG() {
    if (!currentStudentId) {
        alert('Please generate a QR code first');
        return;
    }

    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const svg = qrCodeContainer?.querySelector('svg');

    if (!svg) {
        alert('SVG QR Code not found');
        return;
    }

    try {
        const clonedSVG = svg.cloneNode(true);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', '#ffffff');
        clonedSVG.insertBefore(rect, clonedSVG.firstChild);

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSVG);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_${currentStudentId}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading SVG:', error);
    }
}

// ============================================
// FORM SUBMISSION & EDITING
// ============================================

function handleFormSubmit(event) {
    if (!capturedImageData) {
        event.preventDefault();
        alert('Please capture or upload a profile photo');
        return false;
    }

    const imageDataField = document.getElementById('imageData');
    if (imageDataField) {
        imageDataField.value = capturedImageData;
    }
    return true;
}

function loadStudentForEdit(studentId) {
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
                document.getElementById('studentId').disabled = true;

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

                // Update form visual state
                const form = document.getElementById('studentForm');
                const submitBtn = document.getElementById('submitBtn');

                if (form) form.action = '/save_student';

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

// ============================================
// EXPORTS
// ============================================

window.generateQRCode = generateQRCode;
window.downloadQRCode = downloadQRCode;
window.downloadQRCodeAsSVG = downloadQRCodeAsSVG;

console.log('✅ Student Camera & QR Scripts loaded');