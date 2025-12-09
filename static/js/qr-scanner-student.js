// ============================================
// QR CODE SCANNER FOR STUDENT ATTENDANCE
// FIXED VERSION - Uses public endpoint
// ============================================

let html5QrCode = null;
let isScanning = false;
let originalFormContent = null;

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', function () {
    const startBtn = document.getElementById('startBtn');

    // Save original form content
    const formContainer = document.querySelector('.lg\\:col-span-1 .bg-white');
    if (formContainer) {
        originalFormContent = formContainer.innerHTML;
    }

    if (startBtn) {
        startBtn.addEventListener('click', toggleScanner);
    }
});

// Toggle scanner on/off
async function toggleScanner() {
    if (isScanning) {
        stopScanner();
    } else {
        startScanner();
    }
}

// Start the QR code scanner
function startScanner() {
    const startBtn = document.getElementById('startBtn');
    const placeholderOverlay = document.getElementById('scannerPlaceholder');

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;

        if (placeholderOverlay) {
            placeholderOverlay.classList.add('hidden');
        }

        startBtn.textContent = 'Stop Scan';
        startBtn.classList.remove('bg-teal-500', 'hover:bg-teal-600');
        startBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        console.log("QR Code scanner started successfully");
    }).catch(err => {
        console.error("Unable to start scanner:", err);
        alert("Failed to start camera. Please ensure camera permissions are granted.");
    });
}

// Stop the QR code scanner
function stopScanner() {
    const startBtn = document.getElementById('startBtn');
    const placeholderOverlay = document.getElementById('scannerPlaceholder');

    if (html5QrCode && isScanning) {
        html5QrCode.stop().then(() => {
            isScanning = false;

            if (placeholderOverlay) {
                placeholderOverlay.classList.remove('hidden');
            }

            startBtn.textContent = 'Start Scan';
            startBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            startBtn.classList.add('bg-teal-500', 'hover:bg-teal-600');
            console.log("QR Code scanner stopped successfully");
        }).catch(err => {
            console.error("Error stopping scanner:", err);
        });
    }
}

// Handle successful QR code scan
function onScanSuccess(decodedText, decodedResult) {
    console.log(`QR Code detected: ${decodedText}`);

    // Stop scanning temporarily to process result
    stopScanner();

    // Fetch student information using public endpoint
    fetchStudentInfo(decodedText);
}

// Handle scan errors
function onScanError(errorMessage) {
    if (!errorMessage.includes("NotFoundException")) {
        console.warn("QR Scan error:", errorMessage);
    }
}

// Fetch student information from server - FIXED to use public endpoint
function fetchStudentInfo(studentId) {
    console.log('Fetching student info for:', studentId);

    // Use public endpoint that doesn't require authentication
    fetch(`/api/student_public/${studentId}`)
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Student data received:', data);
            if (data.success) {
                displayStudentInForm(data.student);
                markAttendance(studentId);
            } else {
                console.error('Student not found:', data.message);
                showStudentNotFound();
            }
        })
        .catch(error => {
            console.error('Error fetching student info:', error);
            showStudentNotFound();
        });
}

// Display student information in form container
function displayStudentInForm(student) {
    const formContainer = document.querySelector('.lg\\:col-span-1 .bg-white');

    if (!formContainer) {
        console.error('Form container not found');
        return;
    }

    // Build profile picture HTML
    let imagePath = student.image;
    if (imagePath && !imagePath.startsWith('/static/') && !imagePath.startsWith('http')) {
        if (imagePath.startsWith('images/')) {
            imagePath = `/static/${imagePath}`;
        } else {
            imagePath = `/static/images/${imagePath}`;
        }
    }

    const profilePicture = imagePath
        ? `<img src="${imagePath}" class="w-full h-full object-cover" alt="Profile" onerror="this.style.display='none'; this.parentElement.innerHTML='<svg class=\\'w-20 h-20 text-gray-400\\' fill=\\'currentColor\\' viewBox=\\'0 0 20 20\\'><path fill-rule=\\'evenodd\\' d=\\'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z\\' clip-rule=\\'evenodd\\' /></svg>';">`
        : `<svg class="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
             <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
           </svg>`;

    // Create student profile display
    const studentProfileHTML = `
        <div class="animate-slideIn">
            <h2 class="text-xl font-bold text-gray-800 mb-6 uppercase text-center">Student Scanned</h2>
            
            <!-- Profile Picture -->
            <div class="flex justify-center mb-6">
                <div class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-green-500 shadow-lg">
                    ${profilePicture}
                </div>
            </div>

            <!-- Student Information -->
            <div class="space-y-4 bg-gray-50 rounded-lg p-6">
                <div class="border-b border-gray-200 pb-3">
                    <p class="text-xs text-gray-500 uppercase font-semibold mb-1">ID Number</p>
                    <p class="text-lg font-bold text-blue-600">${student.idno}</p>
                </div>
                
                <div class="border-b border-gray-200 pb-3">
                    <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Full Name</p>
                    <p class="text-lg font-semibold text-gray-800">${student.Firstname} ${student.Lastname}</p>
                </div>
                
                <div class="border-b border-gray-200 pb-3">
                    <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Course</p>
                    <p class="text-lg text-gray-700">${student.course}</p>
                </div>
                
                <div>
                    <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Year Level</p>
                    <p class="text-lg text-gray-700">${student.level}</p>
                </div>
            </div>

            <!-- Success Message -->
            <div class="mt-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                        <p class="font-semibold">Attendance Logged</p>
                        <p class="text-sm">${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Replace form content with student profile
    formContainer.innerHTML = studentProfileHTML;

    // Restore original form after 3 seconds
    setTimeout(() => {
        restoreOriginalForm();
        // Restart scanner
        setTimeout(() => {
            startScanner();
        }, 300);
    }, 3000);
}

// Show student not found message
function showStudentNotFound() {
    const formContainer = document.querySelector('.lg\\:col-span-1 .bg-white');

    if (!formContainer) return;

    const notFoundHTML = `
        <div class="animate-slideIn">
            <h2 class="text-xl font-bold text-gray-800 mb-6 uppercase text-center">Scan Result</h2>
            
            <!-- Error Icon -->
            <div class="flex justify-center mb-6">
                <div class="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-500">
                    <svg class="w-20 h-20 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>

            <!-- Error Message -->
            <div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded">
                <p class="text-xl font-bold mb-2">Student Not Found</p>
                <p class="text-sm">The scanned QR code does not match any student record in the database.</p>
            </div>

            <div class="mt-6 text-center text-sm text-gray-500">
                <p>Returning to scanner in 3 seconds...</p>
            </div>
        </div>
    `;

    formContainer.innerHTML = notFoundHTML;

    // Restore original form after 3 seconds
    setTimeout(() => {
        restoreOriginalForm();
        setTimeout(() => {
            startScanner();
        }, 300);
    }, 3000);
}

// Restore original form content
function restoreOriginalForm() {
    const formContainer = document.querySelector('.lg\\:col-span-1 .bg-white');

    if (formContainer && originalFormContent) {
        formContainer.innerHTML = originalFormContent;
    }
}

// Mark attendance for student
function markAttendance(studentId) {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });

    console.log('Marking attendance:', { studentId, currentDate, currentTime });

    fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            student_idno: studentId,
            date: currentDate,
            time_in: currentTime,
            status: 'PRESENT'
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Attendance marked successfully');
                // Update attendance table if on attendance page
                if (typeof updateAttendanceTable === 'function') {
                    updateAttendanceTable();
                }
            } else {
                console.error('Failed to mark attendance:', data.message);
            }
        })
        .catch(error => {
            console.error('Error marking attendance:', error);
        });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-slideIn {
        animation: slideIn 0.4s ease-out;
    }
`;
document.head.appendChild(style);