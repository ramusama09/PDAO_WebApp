document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const form = document.getElementById('generateIdForm');
    const birthDateInput = document.getElementById('birthDate');
    const ageInput = document.getElementById('age');
    const photoPreview = document.getElementById('photoPreview');
    const uploadPhotoInput = document.getElementById('uploadPhoto');
    const capturePhotoBtn = document.getElementById('capturePhoto');
    const saveIdCardBtn = document.getElementById('saveIdCard');
    const cancelButton = document.getElementById('cancelButton');

    // Initialize Bootstrap modals
    const saveConfirmModal = new bootstrap.Modal(document.getElementById('saveConfirmModal'));
    const cancelConfirmModal = new bootstrap.Modal(document.getElementById('cancelConfirmModal'));

    // Load user data if we have a user ID
    const userId = sessionStorage.getItem('currentGenerateIdUserId');
    if (userId) {
        const userRef = firebase.database().ref('users/' + userId);
        userRef.once('value').then((snapshot) => {
            const user = snapshot.val();
            if (user?.idCards?.photoID) {
                photoPreview.src = user.idCards.photoID;
                photoPreview.style.display = 'block';
            }
            if (user) {
                // Helper function to safely set form values
                const setFormValue = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.value = value || '';
                        // Trigger change event for birthdate to calculate age
                        if (id === 'birthDate') {
                            element.dispatchEvent(new Event('change'));
                        }
                    }
                };

                // Set basic user info
                setFormValue('firstName', user.firstName);
                setFormValue('lastName', user.lastName);
                setFormValue('middleName', user.middleName);
                setFormValue('suffix', user.suffix);
                setFormValue('sex', user.sex);
                setFormValue('birthDate', user.birthDate);
                setFormValue('email', user.email);
                setFormValue('contactNumber', user.contactNumber);
                setFormValue('addressLine1', user.addressLine1);
                setFormValue('addressLine2', user.addressLine2);
                setFormValue('bloodType', user.bloodType);
                setFormValue('disabilityType', user.disabilityType);
                setFormValue('emergencyContactName', user.emergencyContactName);
                setFormValue('emergencyContactNumber', user.emergencyContactNumber);

                // Set ID card information if available
                if (user.idCards) {
                    setFormValue('pwdIdNo', user.idCards.pwdIdNo);
                    setFormValue('dateIssued', user.idCards.dateIssued);
                    setFormValue('expirationDate', user.idCards.expirationDate);

                    // Load ID photo if available
                    if (user.idCards.idPhoto) {
                        photoPreview.src = user.idCards.idPhoto;
                        photoPreview.style.display = 'block';
                    }
                }
            }
        }).catch(error => {
            console.error('Error loading user data:', error);
            alert('Failed to load user data. Please try again.');
        });
    }

    // Calculate age from birthdate
    function calculateAge(birthDate) {
        if (!birthDate) return '';
        const today = new Date();
        const birthDateObj = new Date(birthDate);
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = today.getMonth() - birthDateObj.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }
        return age;
    }

    // Update age when birthdate changes
    birthDateInput.addEventListener('change', function() {
        ageInput.value = calculateAge(this.value);
    });

    // Handle photo upload
    uploadPhotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle photo capture
    capturePhotoBtn.addEventListener('click', async function() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            
            // Create a modal for the camera
            const modal = document.createElement('div');
            modal.className = 'camera-modal';
            modal.innerHTML = `
                <div class="camera-container">
                    <video id="camera-preview" autoplay></video>
                    <button id="capture-btn" class="btn btn-primary">
                        <i class="bi bi-camera me-2"></i>Capture
                    </button>
                    <button id="close-camera" class="btn btn-secondary">
                        <i class="bi bi-x me-2"></i>Close
                    </button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const videoElement = modal.querySelector('video');
            videoElement.srcObject = stream;
            
            // Handle capture button click
            modal.querySelector('#capture-btn').onclick = () => {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                canvas.getContext('2d').drawImage(videoElement, 0, 0);
                
                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    // Get PWD ID number for the filename
                    const pwdIdNo = document.getElementById('pwdIdNo').value || 'temp';
                    const file = new File([blob], `${pwdIdNo}_photo.jpg`, { type: 'image/jpeg' });
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    uploadPhotoInput.files = dataTransfer.files;
                    
                    // Update preview
                    photoPreview.src = canvas.toDataURL('image/jpeg');
                    photoPreview.style.display = 'block';
                    
                    // Clean up
                    stream.getTracks().forEach(track => track.stop());
                    modal.remove();
                }, 'image/jpeg');
            };
            
            // Handle close button click
            modal.querySelector('#close-camera').onclick = () => {
                stream.getTracks().forEach(track => track.stop());
                modal.remove();
            };
            
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please make sure you have granted camera permissions.');
        }
    });

    // Handle save button
    saveIdCardBtn.addEventListener('click', function() {
        saveConfirmModal.show();
    });

    // Function to show toast message
    function showToast(message, type = 'success', autoHide = true) {
        // Remove any existing toasts if it's not a processing message
        if (type !== 'info' || message !== 'Processing your request...') {
            const existingToasts = document.querySelectorAll('.toast');
            existingToasts.forEach(toast => toast.remove());
        }

        const toastDiv = document.createElement('div');
        toastDiv.className = `toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 start-0 m-3`;
        toastDiv.setAttribute('role', 'alert');
        toastDiv.setAttribute('aria-live', 'assertive');
        toastDiv.setAttribute('aria-atomic', 'true');

        const flexDiv = document.createElement('div');
        flexDiv.className = 'd-flex';

        const toastBody = document.createElement('div');
        toastBody.className = 'toast-body';
        const icon = type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle';
        toastBody.innerHTML = `<i class="bi bi-${icon} me-2"></i>${message}`;

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close btn-close-white me-2 m-auto';
        closeButton.setAttribute('data-bs-dismiss', 'toast');
        closeButton.setAttribute('aria-label', 'Close');

        flexDiv.appendChild(toastBody);
        flexDiv.appendChild(closeButton);
        toastDiv.appendChild(flexDiv);
        document.body.appendChild(toastDiv);

        const toast = new bootstrap.Toast(toastDiv, {
            delay: autoHide ? 3000 : Infinity // Only auto-hide if autoHide is true
        });
        toast.show();

        // Remove the element after the toast is hidden
        toastDiv.addEventListener('hidden.bs.toast', function () {
            document.body.removeChild(toastDiv);
        });
    }

    document.getElementById('confirmSave').addEventListener('click', async function () {
        const userId = sessionStorage.getItem('currentGenerateIdUserId');
        if (!userId) {
            showToast('No user ID found. Please try again.', 'danger');
            saveConfirmModal.hide();
            return;
        }

        try {
            // Hide confirmation modal first
            saveConfirmModal.hide();

            // Show processing toast
            showToast('Processing your request...', 'info', false);

            // Get form data and prepare user data object
            const formData = new FormData(form);
            const pwdIdNo = formData.get('pwdIdNo');

            const userData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                middleName: formData.get('middleName'),
                suffix: formData.get('suffix'),
                sex: formData.get('sex'),
                birthDate: formData.get('birthDate'),
                age: formData.get('age'),
                email: formData.get('email'),
                contactNumber: formData.get('contactNumber'),
                addressLine1: formData.get('addressLine1'),
                addressLine2: formData.get('addressLine2'),
                bloodType: formData.get('bloodType'),
                disabilityType: formData.get('disabilityType'),
                emergencyContactName: formData.get('emergencyContactName'),
                emergencyContactNumber: formData.get('emergencyContactNumber'),
                lastUpdated: new Date().toISOString(),
                idCards: {
                    pwdIdNo: pwdIdNo,
                    dateIssued: formData.get('dateIssued'),
                    expirationDate: formData.get('expirationDate'),
                    bloodType: formData.get('bloodType'),
                    disabilityType: formData.get('disabilityType')
                }
            };

            // Get reference to user data
            const userRef = firebase.database().ref('users/' + userId);

            // Handle photo upload if present
            const photoFile = uploadPhotoInput.files[0];
            if (photoFile) {
                // Create data URL for immediate use
                const reader = new FileReader();
                const dataUrl = await new Promise(resolve => {
                    reader.onload = e => resolve(e.target.result);
                    reader.readAsDataURL(photoFile);
                });

                // Upload to Firebase Storage
                const storage = firebase.storage();
                if (!storage) {
                    throw new Error('Firebase Storage is not initialized');
                }

                const storageRef = storage.ref();
                const photoRef = storageRef.child(`user_images/${pwdIdNo}_image`);
                const photoSnapshot = await photoRef.put(photoFile);
                const firebaseUrl = await photoSnapshot.ref.getDownloadURL();

                // Store URLs and update preview
                userData.idCards.photoID = dataUrl;
                userData.idCards.photoURL = firebaseUrl;
                photoPreview.src = dataUrl;
                photoPreview.style.display = 'block';
            }

            // Update user data in Firebase
            await userRef.update(userData);

            // Generate ID cards
            const idCardURLs = await generateIDCards(userData, pwdIdNo);

            // Update ID card URLs
            await userRef.child('idCards').update({
                frontID: idCardURLs.frontID,
                backID: idCardURLs.backID
            });

            // Show success message
            showToast('ID Cards generated and saved successfully!', 'success', true);


            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/Home/AdminIndex';
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            showToast(error.message || 'Failed to save ID card information. Please try again.', 'danger', true);
        }
    });

    // Handle cancel button
    cancelButton.addEventListener('click', function() {
        cancelConfirmModal.show();
    });

    document.getElementById('confirmCancel').addEventListener('click', function() {
        sessionStorage.removeItem('currentGenerateIdUserId');
        window.history.back();
    });

    // Add CSS for the camera modal
    const style = document.createElement('style');
    style.textContent = `
        .camera-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1050;
        }
        
        .camera-container {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
            max-width: 90%;
            width: 640px;
        }
        
        #camera-preview {
            width: 100%;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        
        .camera-container button {
            margin: 0 0.5rem;
        }

        .toast {
            z-index: 1060;
        }
    `;
    document.head.appendChild(style);
}); 