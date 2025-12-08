// Student Camera and Image Handling JavaScript - FINAL FIX
// FIXED: Camera and captured photos now cover ENTIRE container

// Global variables
let isCameraOn = false;
let capturedImageData = null;

// DOM Elements
const cameraBtn = document.getElementById('cameraBtn');
const cameraBtnText = document.getElementById('cameraBtnText');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const fileUpload = document.getElementById('fileUpload');
const profileIcon = document.getElementById('profileIcon');
const profilePlaceholder = document.getElementById('profilePlaceholder');
const profileBadge = document.getElementById('profileBadge');
const imageDataInput = document.getElementById('imageData');
const studentForm = document.getElementById('studentForm');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const cameraContainer = document.getElementById('camera-container');

// Create a dedicated preview image element in camera container
let cameraPreviewImage = null;

// ============================================
// IMAGE COMPRESSION FUNCTION
// ============================================
function compressImage(dataUrl, maxWidth = 640, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width = Math.round((width * maxWidth) / height);
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            console.log('Image compressed:', {
                original: dataUrl.length,
                compressed: compressedDataUrl.length,
                reduction: Math.round((1 - compressedDataUrl.length / dataUrl.length) * 100) + '%'
            });
            resolve(compressedDataUrl);
        };
        img.src = dataUrl;
    });
}

// ============================================
// QR CODE GENERATION FUNCTION
// ============================================
function generateQRCode(studentId) {
    const qrContainer = document.getElementById('qrCodeContainer');
    if (!qrContainer || !studentId) return;

    qrContainer.innerHTML = '';

    try {
        new QRCode(qrContainer, {
            text: studentId,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        console.log('QR Code generated for ID:', studentId);

        const qrSection = document.getElementById('qrCodeSection');
        if (qrSection) {
            qrSection.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
}

// Listen for student ID changes to generate QR code
const studentIdInput = document.getElementById('studentId');
if (studentIdInput) {
    studentIdInput.addEventListener('input', function (e) {
        const id = e.target.value.trim();
        if (id) {
            generateQRCode(id);
        } else {
            const qrSection = document.getElementById('qrCodeSection');
            if (qrSection) {
                qrSection.classList.add('hidden');
            }
        }
    });
}

// Configure WebcamJS - FIXED: Full container dimensions
function configureWebcam() {
    const containerWidth = cameraContainer.offsetWidth;
    const containerHeight = cameraContainer.offsetHeight;

    console.log('Container dimensions:', containerWidth, 'x', containerHeight);

    Webcam.set({
        width: containerWidth,
        height: containerHeight,
        dest_width: containerWidth,
        dest_height: containerHeight,
        image_format: 'jpeg',
        jpeg_quality: 75,
        force_flash: false,
        flip_horiz: true,
        fps: 30,
        constraints: {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 1280 },
                facingMode: 'user'
            }
        }
    });

    console.log('Webcam configured for full container');
}

// WebcamJS event handlers
Webcam.on('error', function (err) {
    console.error('Webcam error:', err);
    alert('Could not access camera. Please make sure you have granted camera permissions.');
    resetCameraUI();
});

Webcam.on('live', function () {
    console.log('Camera is live');
    isCameraOn = true;

    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'none';
    }

    cameraBtnText.textContent = 'Stop Camera';
    cameraBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    cameraBtn.classList.add('bg-red-500', 'hover:bg-red-600');

    if (captureBtn) {
        captureBtn.classList.remove('hidden');
    }
});

// Initialize camera functionality
function initCamera() {
    console.log('Initializing camera...');

    if (cameraBtn) {
        cameraBtn.addEventListener('click', toggleCamera);
    }

    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
    }

    if (retakeBtn) {
        retakeBtn.addEventListener('click', retakePhoto);
    }

    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload);
    }

    window.addEventListener('resize', function () {
        if (isCameraOn) {
            console.log('Window resized, restarting camera...');
            stopCamera();
            setTimeout(startCamera, 100);
        }
    });

    checkForEditMode();
}

function toggleCamera() {
    if (isCameraOn) {
        stopCamera();
    } else {
        startCamera();
    }
}

function startCamera() {
    try {
        console.log('Starting camera...');
        hideCapturedPhoto();
        configureWebcam();
        Webcam.attach('#camera-container');
    } catch (error) {
        console.error('Error starting camera:', error);
        alert('Could not start camera. Please check your camera permissions.');
    }
}

function stopCamera() {
    try {
        console.log('Stopping camera...');
        Webcam.reset();
        resetCameraUI();
    } catch (error) {
        console.error('Error stopping camera:', error);
    }
}

function resetCameraUI() {
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'flex';
    }

    cameraBtnText.textContent = 'Start Camera';
    cameraBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
    cameraBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');

    if (captureBtn) {
        captureBtn.classList.add('hidden');
    }

    if (retakeBtn) {
        retakeBtn.classList.add('hidden');
    }

    isCameraOn = false;
}

function disableCameraButton() {
    if (cameraBtn) {
        cameraBtn.disabled = true;
        cameraBtn.classList.add('opacity-50', 'cursor-not-allowed');
        cameraBtn.classList.remove('hover:bg-blue-600');
    }
}

function enableCameraButton() {
    if (cameraBtn) {
        cameraBtn.disabled = false;
        cameraBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        cameraBtn.classList.add('hover:bg-blue-600');
    }
}

// ============================================
// CAPTURE AND DISPLAY PHOTO - FIXED FOR FULL COVERAGE
// ============================================
async function capturePhoto() {
    if (!isCameraOn) {
        alert('Camera is not active');
        return;
    }

    console.log('Capturing photo...');

    Webcam.snap(async function (data_uri) {
        console.log('Photo captured, compressing...');

        const compressedImage = await compressImage(data_uri, 640, 0.7);
        capturedImageData = compressedImage;

        displayCapturedPhoto(compressedImage);
        stopCamera();
        disableCameraButton();

        if (retakeBtn) {
            retakeBtn.classList.remove('hidden');
        }
    });
}

function retakePhoto() {
    console.log('Retaking photo...');
    capturedImageData = null;
    hideCapturedPhoto();

    if (retakeBtn) {
        retakeBtn.classList.add('hidden');
    }

    enableCameraButton();
    startCamera();
}

// FIXED: Display captured photo covering ENTIRE camera container
function displayCapturedPhoto(imageData) {
    console.log('Displaying captured photo - FULL CONTAINER COVERAGE');

    // Hide camera placeholder
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'none';
    }

    // Remove existing preview if any
    if (cameraPreviewImage && cameraPreviewImage.parentNode) {
        cameraPreviewImage.parentNode.removeChild(cameraPreviewImage);
    }

    // Create preview image that covers ENTIRE container
    cameraPreviewImage = document.createElement('img');
    cameraPreviewImage.id = 'cameraPreviewImage';
    cameraPreviewImage.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        object-position: center !important;
        z-index: 10 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
    `;
    cameraPreviewImage.src = imageData;
    cameraContainer.appendChild(cameraPreviewImage);

    // Also update profile icon (small circular preview)
    if (profileIcon) {
        profileIcon.src = imageData;
        profileIcon.classList.remove('hidden');
        profileIcon.style.objectFit = 'cover';
        profileIcon.style.width = '100%';
        profileIcon.style.height = '100%';
    }

    if (profilePlaceholder) {
        profilePlaceholder.classList.add('hidden');
    }

    if (profileBadge) {
        profileBadge.classList.remove('hidden');
    }

    if (imageDataInput) {
        imageDataInput.value = imageData;
        console.log('Image data stored in hidden input');
    }
}

// Hide captured photo from camera container
function hideCapturedPhoto() {
    // Remove the preview image from camera container
    if (cameraPreviewImage && cameraPreviewImage.parentNode) {
        cameraPreviewImage.parentNode.removeChild(cameraPreviewImage);
        cameraPreviewImage = null;
    }

    // Show camera placeholder again
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'flex';
    }

    // Hide profile icon
    if (profileIcon) {
        profileIcon.classList.add('hidden');
    }

    if (profilePlaceholder) {
        profilePlaceholder.classList.remove('hidden');
    }

    if (profileBadge) {
        profileBadge.classList.add('hidden');
    }

    if (imageDataInput) {
        imageDataInput.value = '';
    }

    capturedImageData = null;
}

// Handle file upload with compression
async function handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    console.log('File selected:', file.name);

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
    }

    if (isCameraOn) {
        stopCamera();
    }

    const reader = new FileReader();

    reader.onload = async function (e) {
        const imageData = e.target.result;

        console.log('Compressing uploaded image...');
        const compressedImage = await compressImage(imageData, 640, 0.7);
        capturedImageData = compressedImage;

        displayCapturedPhoto(compressedImage);
        disableCameraButton();

        if (retakeBtn) {
            retakeBtn.classList.remove('hidden');
        }
    };

    reader.onerror = function () {
        alert('Error reading file');
    };

    reader.readAsDataURL(file);
    event.target.value = '';
}

function checkForEditMode() {
    const editStudentId = sessionStorage.getItem('editStudentId');

    if (editStudentId && studentForm) {
        console.log('Edit mode detected for student:', editStudentId);
        loadStudentForEdit(editStudentId);
    }
}

async function loadStudentForEdit(studentId) {
    try {
        console.log('Loading student data for editing...');

        const response = await fetch(`/api/student/${studentId}`);
        const data = await response.json();

        if (data.success) {
            const student = data.student;
            console.log('Student data loaded:', student);

            document.getElementById('studentId').value = student.idno;
            document.getElementById('lastName').value = student.Lastname;
            document.getElementById('firstName').value = student.Firstname;
            document.getElementById('course').value = student.course;
            document.getElementById('level').value = student.level;

            document.getElementById('studentId').disabled = true;

            generateQRCode(student.idno);

            // Load image with proper path handling
            if (student.image) {
                let imagePath = student.image;

                // Ensure path starts with /static/
                if (!imagePath.startsWith('/static/') && !imagePath.startsWith('http')) {
                    if (imagePath.startsWith('images/')) {
                        imagePath = `/static/${imagePath}`;
                    } else {
                        imagePath = `/static/images/${imagePath}`;
                    }
                }

                console.log('Loading existing image:', imagePath);

                displayCapturedPhoto(imagePath);
                capturedImageData = imagePath;

                disableCameraButton();

                if (retakeBtn) {
                    retakeBtn.classList.remove('hidden');
                }
            }

            studentForm.action = '/save_student';

            let idInput = studentForm.querySelector('input[name="idno"]');
            if (!idInput) {
                idInput = document.createElement('input');
                idInput.type = 'hidden';
                idInput.name = 'idno';
                studentForm.appendChild(idInput);
            }
            idInput.value = student.idno;

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
    } catch (error) {
        console.error('Error loading student:', error);
        alert('Error loading student data');
    }
}

// Form submission handler
if (studentForm) {
    studentForm.addEventListener('submit', function (e) {
        console.log('Form submitting...');

        if (!capturedImageData) {
            alert('Please capture or upload a profile photo before submitting.');
            e.preventDefault();
            return;
        }

        if (capturedImageData) {
            imageDataInput.value = capturedImageData;
            console.log('Image data added to form');
        }
    });
}

window.addEventListener('beforeunload', function () {
    if (isCameraOn) {
        console.log('Cleaning up camera on page unload...');
        stopCamera();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCamera);
} else {
    initCamera();
}

console.log('Student camera script loaded - FIXED: Full container coverage');