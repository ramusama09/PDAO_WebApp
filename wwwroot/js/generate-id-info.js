async function generatePwdIdNo() {
    try {
        // Get reference to all users
        const usersRef = firebase.database().ref('users');
        const snapshot = await usersRef.once('value');
        const users = snapshot.val();

        // Find existing PWD ID numbers
        const existingIds = new Set();
        if (users) {
            Object.values(users).forEach(user => {
                if (user.idCards && user.idCards.pwdIdNo) {
                    existingIds.add(user.idCards.pwdIdNo);
                }
            });
        }

        // Start with base number
        let counter = 0;
        let pwdIdNo;

        // Keep incrementing until we find a unique number
        do {
            // Format the counter to 5 digits with leading zeros
            const suffix = counter.toString().padStart(5, '0');
            pwdIdNo = `137604000-${suffix}`;
            counter++;
        } while (existingIds.has(pwdIdNo));

        return pwdIdNo;
    } catch (error) {
        console.error('Error generating PWD ID:', error);
        throw new Error('Failed to generate PWD ID number');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Get form elements
    const form = document.getElementById('generateIdForm');
    const birthDateInput = document.getElementById('birthDate');
    const ageInput = document.getElementById('age');
    const photoPreview = document.getElementById('photoPreview');
    const uploadPhotoInput = document.getElementById('uploadPhoto');
    const capturePhotoBtn = document.getElementById('capturePhoto');
    const saveIdCardBtn = document.getElementById('saveIdCard');
    const cancelButton = document.getElementById('cancelButton');
    const dateIssuedInput = document.getElementById('dateIssued');
    const expirationDateInput = document.getElementById('expirationDate');
    const pwdIdNoInput = document.getElementById('pwdIdNo');
    // Initialize Bootstrap modals
    const saveConfirmModal = new bootstrap.Modal(document.getElementById('saveConfirmModal'));
    const cancelConfirmModal = new bootstrap.Modal(document.getElementById('cancelConfirmModal'));

    // Handle suffix "Others" options for all name fields
    ['', 'Mother', 'Father', 'Guardian'].forEach(prefix => {
        const suffixId = prefix ? `${prefix.toLowerCase()}Suffix` : 'suffix';
        const otherSuffixId = `otherSuffix${prefix}`;

        const suffixSelect = document.getElementById(suffixId);
        const otherSuffixInput = document.getElementById(otherSuffixId);

        if (suffixSelect && otherSuffixInput) {
            suffixSelect.addEventListener('change', function () {
                otherSuffixInput.style.display = this.value === 'Others' ? 'block' : 'none';
                otherSuffixInput.required = this.value === 'Others';
            });
        }
    });

    // Handle "Others" option for occupation
    const occupationSelect = document.getElementById('occupation');
    const otherOccupationInput = document.getElementById('otherOccupation');

    if (occupationSelect && otherOccupationInput) {
        occupationSelect.addEventListener('change', function () {
            otherOccupationInput.style.display = this.value === 'Others' ? 'block' : 'none';
            otherOccupationInput.required = this.value === 'Others';
        });
    }

    // Set today as default for date issued and calculate expiration
    const today = new Date().toISOString().split('T')[0];
    if (dateIssuedInput) {
        dateIssuedInput.value = today;
        dateIssuedInput.max = today;
        updateExpirationDate();
    }

    // Update expiration date when date issued changes
    dateIssuedInput.addEventListener('change', updateExpirationDate);

    dateIssuedInput.addEventListener('input', function () {
        if (!this.value) {
            this.value = new Date().toISOString().split('T')[0];
            updateExpirationDate();
        }
    });

    function updateExpirationDate() {
        const dateIssued = new Date(dateIssuedInput.value);
        dateIssued.setFullYear(dateIssued.getFullYear() + 3);
        expirationDateInput.value = dateIssued.toISOString().split('T')[0];
    }

    // Load user data if we have a user ID
    const userId = sessionStorage.getItem('currentGenerateIdUserId');
    if (userId) {
        const userRef = firebase.database().ref('users/' + userId);
        userRef.once('value').then(async (snapshot) => {
            const user = snapshot.val();
            if (user) {
                populateFormData(user);
                if (user.idCards && user.idCards.pwdIdNo) {
                    pwdIdNoInput.value = user.idCards.pwdIdNo;
                } else {
                    // Generate new PWD ID if user doesn't have one
                    try {
                        const newPwdIdNo = await generatePwdIdNo();
                        pwdIdNoInput.value = newPwdIdNo;
                    } catch (error) {
                        console.error('Error:', error);
                        showToast('Failed to generate PWD ID number', 'danger');
                    }
                }
            } else {
                // New user - generate PWD ID
                try {
                    const newPwdIdNo = await generatePwdIdNo();
                    pwdIdNoInput.value = newPwdIdNo;
                } catch (error) {
                    console.error('Error:', error);
                    showToast('Failed to generate PWD ID number', 'danger');
                }
            }
        }).catch(error => {
            console.error('Error loading user data:', error);
            showToast('Failed to load user data. Please try again.', 'danger');
        });
    } else {
        // No user ID - generate new PWD ID
        generatePwdIdNo().then(newPwdIdNo => {
            pwdIdNoInput.value = newPwdIdNo;
        }).catch(error => {
            console.error('Error:', error);
            showToast('Failed to generate PWD ID number', 'danger');
        });
    }

    // Populate form with user data
    function populateFormData(user) {
        // Helper function to safely set form values
        const setFormValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'SELECT') {
                    // Check if the value exists in the options
                    const optionExists = Array.from(element.options).some(option => option.value === value);

                    if (!optionExists && value) {
                        // If value doesn't exist in options, set to "Others" and show the corresponding text input
                        element.value = 'Others';
                        // Trigger the change event to show the "Other" input field
                        element.dispatchEvent(new Event('change'));

                        // Handle different types of "Other" inputs
                        if (id === 'occupation') {
                            const otherInput = document.getElementById('otherOccupation');
                            if (otherInput) {
                                otherInput.value = value;
                                otherInput.style.display = 'block';
                            }
                        } else if (id.includes('Suffix')) {
                            const prefix = id.replace('Suffix', '');
                            const otherInput = document.getElementById(`otherSuffix${prefix}`);
                            if (otherInput) {
                                otherInput.value = value;
                                otherInput.style.display = 'block';
                            }
                        }
                    } else {
                        element.value = value || '';
                    }
                } else {
                    element.value = value || '';
                }

                // Trigger change event for specific fields
                if (id === 'birthDate') {
                    element.dispatchEvent(new Event('change'));
                }
            }
        };

        // Basic Information
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
        setFormValue('civilStatus', user.civilStatus);

        // Health Information
        setFormValue('bloodType', user.bloodType);
        setFormValue('disabilityType', user.disabilityType);
        // In the populateFormData function, update the health information section
        if (user.healthInformation) {
            setFormValue('certifyingPhysician', user.healthInformation.physicianName);
            setFormValue('licenseNo', user.healthInformation.physicianLicenseNumber);

            // Show existing document names if available
            if (user.healthInformation.supportingDocuments) {
                ['document1', 'document2', 'document3'].forEach((doc, index) => {
                    const docInfo = user.healthInformation.supportingDocuments[doc];
                    if (docInfo) {
                        const fileInput = document.getElementById(`supportingDocuments${index + 1}`);
                        if (fileInput) {
                            // Create a label to show the existing file name
                            const existingFileLabel = document.createElement('div');
                            existingFileLabel.className = 'form-text text-muted';
                            existingFileLabel.textContent = `Current file: ${docInfo.fileName}`;
                            fileInput.parentNode.insertBefore(existingFileLabel, fileInput.nextSibling);
                        }
                    }
                });
            }
        }

        // Emergency Contact
        setFormValue('emergencyContactName', user.emergencyContactName);
        setFormValue('emergencyContactNumber', user.emergencyContactNumber);

        // Family Background
        if (user.familyBackground) {
            ['Father', 'Mother', 'Guardian'].forEach(relation => {
                if (user.familyBackground[relation]) {
                    setFormValue(`${relation.toLowerCase()}FirstName`, user.familyBackground[relation].firstName);
                    setFormValue(`${relation.toLowerCase()}MiddleName`, user.familyBackground[relation].middleName);
                    setFormValue(`${relation.toLowerCase()}LastName`, user.familyBackground[relation].lastName);
                    setFormValue(`${relation.toLowerCase()}Suffix`, user.familyBackground[relation].suffix);
                }
            });
        }

        // Education and Employment
        if (user.educationAndEmployment) {
            setFormValue('educationalAttainment', user.educationAndEmployment.educationalAttainment);
            setFormValue('employmentStatus', user.educationAndEmployment.employmentStatus);
            setFormValue('categoryOfEmployment', user.educationAndEmployment.employmentCategory);
            setFormValue('typeOfEmployment', user.educationAndEmployment.employmentType);
            setFormValue('occupation', user.educationAndEmployment.occupation);

            // Organization Information
            if (user.educationAndEmployment.organizationInformation) {
                setFormValue('organizationAffiliated', user.educationAndEmployment.organizationInformation.organizationAffiliated);
                setFormValue('contactPerson', user.educationAndEmployment.organizationInformation.organizationContactPerson);
                setFormValue('telContactNum', user.educationAndEmployment.organizationInformation.organizationContactNum);
                setFormValue('officeAddress', user.educationAndEmployment.organizationInformation.organizationAddress);
            }
        }

        // ID Reference Numbers
        if (user.idReferenceCards) {
            setFormValue('sssNo', user.idReferenceCards.SSS);
            setFormValue('gsisNo', user.idReferenceCards.GSIS);
            setFormValue('pagIbigNo', user.idReferenceCards['Pag-Ibig']);
            setFormValue('psnNo', user.idReferenceCards.PSN);
            setFormValue('philhealthNo', user.idReferenceCards.Philhealth);
        }

        // ID Cards Information
        if (user.idCards) {
            setFormValue('pwdIdNo', user.idCards.pwdIdNo);
            const dateIssued = user.idCards.dateIssued || new Date().toISOString().split('T')[0];
            setFormValue('dateIssued', dateIssued);
            if (user.idCards.expirationDate) {
                // If we have an existing expiration date, set it
                setFormValue('expirationDate', user.idCards.expirationDate);
            } else {
                // Only calculate new expiration date if we don't have one
                dateIssuedInput.dispatchEvent(new Event('change'));
            }

            if (user.idCards.photoID) {
                photoPreview.src = user.idCards.photoID;
                photoPreview.style.display = 'block';
            }
        }
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
    birthDateInput.addEventListener('change', function () {
        const today = new Date();
        const selectedDate = new Date(this.value);

        if (selectedDate > today) {
            this.value = today.toISOString().split('T')[0];
            showToast('Birth date cannot be in the future', 'danger');
        }

        ageInput.value = calculateAge(this.value);
    });

    // Handle photo upload
    uploadPhotoInput.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (file) {
            try {
                // Generate a unique filename using timestamp
                const timestamp = new Date().getTime();
                const filename = `photos/${userId}_${timestamp}.jpg`;

                // Create storage reference
                const storageRef = firebase.storage().ref();
                const photoRef = storageRef.child(filename);

                // Upload the file
                await photoRef.put(file);

                // Get the download URL
                const photoURL = await photoRef.getDownloadURL();

                // Update preview
                photoPreview.src = photoURL;
                photoPreview.style.display = 'block';

                // Store the Firebase Storage URL in the database
                const userRef = firebase.database().ref(`users/${userId}/idCards`);
                await userRef.update({
                    photoID: photoURL // Only store the Firebase Storage URL
                });
            } catch (error) {
                console.error('Error uploading photo:', error);
                alert('Failed to upload photo. Please try again.');
            }
        }
    });

    // Handle photo capture
    capturePhotoBtn.addEventListener('click', async function () {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const videoElement = document.createElement('video');
            const canvasElement = document.createElement('canvas');

            // Create and show camera modal
            const modalHtml = `
                <div class="camera-modal">
                    <div class="camera-container">
                        <video id="camera-preview" autoplay playsinline></video>
                        <button id="capture-button" class="btn btn-primary">Capture</button>
                        <button id="cancel-capture" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = document.querySelector('.camera-modal');
            const preview = document.getElementById('camera-preview');
            preview.srcObject = stream;

            // Handle capture
            document.getElementById('capture-button').onclick = async () => {
                // Draw video frame to canvas
                canvasElement.width = preview.videoWidth;
                canvasElement.height = preview.videoHeight;
                canvasElement.getContext('2d').drawImage(preview, 0, 0);

                // Convert to blob
                const blob = await new Promise(resolve =>
                    canvasElement.toBlob(resolve, 'image/jpeg')
                );

                // Upload to Firebase Storage
                const timestamp = new Date().getTime();
                const filename = `photos/${userId}_${timestamp}.jpg`;
                const photoRef = firebase.storage().ref().child(filename);

                await photoRef.put(blob);
                const photoURL = await photoRef.getDownloadURL();

                // Update preview and database
                photoPreview.src = photoURL;
                photoPreview.style.display = 'block';

                const userRef = firebase.database().ref(`users/${userId}/idCards`);
                await userRef.update({
                    photoID: photoURL // Only store the Firebase Storage URL
                });

                // Cleanup
                cleanupCamera();
            };

            // Handle cancel
            document.getElementById('cancel-capture').onclick = cleanupCamera;

            function cleanupCamera() {
                stream.getTracks().forEach(track => track.stop());
                modal.remove();
            }

        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Failed to access camera. Please check your permissions.');
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

    function prepareUserData(formData) {
        return {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            middleName: formData.get('middleName'),
            suffix: formData.get('suffix'),
            civilStatus: formData.get('civilStatus'),
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

            familyBackground: {
                Father: {
                    firstName: formData.get('fatherFirstName'),
                    middleName: formData.get('fatherMiddleName'),
                    lastName: formData.get('fatherLastName'),
                    suffix: formData.get('fatherSuffix')
                },
                Mother: {
                    firstName: formData.get('motherFirstName'),
                    middleName: formData.get('motherMiddleName'),
                    lastName: formData.get('motherLastName'),
                    suffix: formData.get('motherSuffix')
                },
                Guardian: {
                    firstName: formData.get('guardianFirstName'),
                    middleName: formData.get('guardianMiddleName'),
                    lastName: formData.get('guardianLastName'),
                    suffix: formData.get('guardianSuffix')
                }
            },

            educationAndEmployment: {
                educationalAttainment: formData.get('educationalAttainment'),
                employmentStatus: formData.get('employmentStatus'),
                employmentCategory: formData.get('categoryOfEmployment'),
                employmentType: formData.get('typeOfEmployment'),
                occupation: formData.get('occupation') === 'Others' ? formData.get('otherOccupation') : formData.get('occupation'),
                organizationInformation: {
                    organizationAffiliated: formData.get('organizationAffiliated'),
                    organizationContactPerson: formData.get('contactPerson'),
                    organizationContactNum: formData.get('telContactNum'),
                    organizationAddress: formData.get('officeAddress')
                }
            },

            healthInformation: {
                physicianName: formData.get('certifyingPhysician'),
                physicianLicenseNumber: formData.get('licenseNo')
            },

            idReferenceCards: {
                SSS: formData.get('sssNo'),
                GSIS: formData.get('gsisNo'),
                'Pag-Ibig': formData.get('pagIbigNo'),
                PSN: formData.get('psnNo'),
                Philhealth: formData.get('philhealthNo')
            },

            lastUpdated: new Date().toISOString(),

            idCards: {
                pwdIdNo: formData.get('pwdIdNo'),
                dateIssued: formData.get('dateIssued'),
                expirationDate: formData.get('expirationDate'),
                bloodType: formData.get('bloodType'),
                disabilityType: formData.get('disabilityType')
            }
        };
    }

    function isFileSizeValid(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            showToast(`File "${file.name}" exceeds 10MB limit`, 'danger');
            return false;
        }
        return true;
    }

    document.getElementById('confirmSave').addEventListener('click', async function () {
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            showToast('Please fill in all required fields correctly', 'danger');
            saveConfirmModal.hide();
            return;
        }

        const userId = sessionStorage.getItem('currentGenerateIdUserId');
        if (!userId) {
            showToast('No user ID found. Please try again.', 'danger');
            saveConfirmModal.hide();
            return;
        }

        try {
            saveConfirmModal.hide();
            document.body.appendChild(loadingOverlay);

            const formData = new FormData(form);
            const userData = prepareUserData(formData);
            const userRef = firebase.database().ref('users/' + userId);

            const supportingDocs = ['supportingDocuments1', 'supportingDocuments2', 'supportingDocuments3'];
            const docUrls = {};
            const docNames = {};

            for (const docId of supportingDocs) {
                const file = document.getElementById(docId).files[0];
                if (file) {
                    // Check file size
                    if (!isFileSizeValid(file)) {
                        throw new Error(`File "${file.name}" exceeds 10MB limit`);
                    }

                    // Use original filename for storage
                    const storageRef = firebase.storage().ref(`user-documents/${userId}/${file.name}`);
                    await storageRef.put(file);
                    docUrls[docId] = await storageRef.getDownloadURL();
                    docNames[docId] = file.name; // Store the original filename
                }
            }

            // Add supporting document URLs and filenames to user data
            userData.healthInformation.supportingDocuments = {
                document1: docUrls.supportingDocuments1 ? {
                    url: docUrls.supportingDocuments1,
                    fileName: docNames.supportingDocuments1
                } : null,
                document2: docUrls.supportingDocuments2 ? {
                    url: docUrls.supportingDocuments2,
                    fileName: docNames.supportingDocuments2
                } : null,
                document3: docUrls.supportingDocuments3 ? {
                    url: docUrls.supportingDocuments3,
                    fileName: docNames.supportingDocuments3
                } : null
            };

            // Handle photo upload if present
            if (uploadPhotoInput.files[0]) {
                const photoRef = firebase.storage().ref(`photos/${userId}_${Date.now()}.jpg`);
                const photoSnapshot = await photoRef.put(uploadPhotoInput.files[0]);
                userData.idCards.photoID = await photoSnapshot.ref.getDownloadURL();
            } else if (photoPreview.src && !photoPreview.src.includes('default_face.jpg')) {
                userData.idCards.photoID = photoPreview.src;
            }

            // Update user data
            await userRef.update(userData);

            // Generate ID cards
            const idCardURLs = await generateIDCards(userData, userData.idCards.pwdIdNo);
            await userRef.child('idCards').update({
                frontID: idCardURLs.frontID,
                backID: idCardURLs.backID
            });

            document.body.removeChild(loadingOverlay);
            showToast('ID Cards generated and saved successfully!', 'success');

            setTimeout(() => {
                window.location.href = '/Home/AdminIndex';
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            document.body.removeChild(loadingOverlay);
            showToast(error.message || 'Failed to save ID card information', 'danger');
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

    form.addEventListener('submit', function (event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
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

        /* Loading overlay styles */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }

        .loading-overlay .spinner-border {
            width: 3rem;
            height: 3rem;
        }

        .loading-text {
            margin-top: 1rem;
            font-size: 1.2rem;
            color: #0d6efd;
        }

    `;
    document.head.appendChild(style);
}); 

const loadingOverlay = document.createElement('div');
loadingOverlay.className = 'loading-overlay';
loadingOverlay.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div class="loading-text">Saving ID Card Information...</div>
    `;

// Add file size validation to the file inputs
supportingDocs.forEach(docId => {
    const input = document.getElementById(docId);
    if (input) {
        input.addEventListener('change', function (e) {
            const file = this.files[0];
            if (file && !isFileSizeValid(file)) {
                this.value = ''; // Clear the input if file is too large
            }
        });
    }
});