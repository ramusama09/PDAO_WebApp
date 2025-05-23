document.addEventListener('DOMContentLoaded', function() {
    const database = firebase.database();
    const usersRef = database.ref('users');

    usersRef.on('value', (snapshot) => {
        const usersData = snapshot.val();
        const tableBody = document.querySelector('#usersTable tbody');
        tableBody.innerHTML = '';

        for (const userId in usersData) {
            if (usersData.hasOwnProperty(userId)) {
                const user = usersData[userId];
                const middleInitial = user.middleName ? user.middleName.charAt(0) + '.' : '';
                const fullName = `${user.firstName} ${middleInitial} ${user.lastName} ${user.suffix}`;

                const row = document.createElement('tr');

                // Name column
                const nameCell = document.createElement('td');
                nameCell.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="status-indicator status-active"></div>
                        <strong>${fullName}</strong>
                    </div>
                    <div class="text-muted small">Age: ${user.age || 'N/A'}</div>
                `;
                row.appendChild(nameCell);

                // Contact Details column
                const contactCell = document.createElement('td');
                contactCell.innerHTML = `
                    <div><i class="fas fa-phone me-2 text-muted"></i> ${user.contactNumber || 'N/A'}</div>
                    <div><i class="fas fa-envelope me-2 text-muted"></i> ${user.email || 'N/A'}</div>
                `;
                row.appendChild(contactCell);

                // Disability column
                const disabilityCell = document.createElement('td');
                disabilityCell.classList.add('text-center');
                disabilityCell.innerHTML = `
                    <span class="badge bg-success bg-opacity-10 text-success">${user.disabilityType || 'N/A'}</span>
                `;
                row.appendChild(disabilityCell);

                // Action column
                const actionCell = document.createElement('td');
                actionCell.classList.add('text-center');
                    actionCell.innerHTML = `
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewUser('${userId}')">
                            <i class="bi bi-search"></i> View
                        </button>
                        <button class="btn-action btn-edit" onclick="updateID('${userId}')">
                            <i class="bi bi-info-lg"></i> Update Information
                        </button>
                        <button class="btn-action btn-print">
                            <i class="bi bi-printer"></i> Print ID Card
                        </button>
                    </div>
                `;

                row.appendChild(actionCell);

                tableBody.appendChild(row);
            }
        }
    }, (error) => {
        console.error("Error fetching users:", error);
    });
});

function viewUser(userId) {
    // Implement view functionality
    console.log("View user:", userId);
}

function printUser(userId) {
    // Implement print functionality
    console.log("Print user:", userId);
}

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

// Update your viewUser and editUser functions
function viewUser(userId) {
    const userRef = firebase.database().ref('users/' + userId);
    userRef.once('value').then((snapshot) => {
        const user = snapshot.val() || {};
        const idCards = user.idCards || {};
        const modal = new bootstrap.Modal(document.getElementById('viewModal'));

        // Helper function to safely set form values
        const setFormValue = (name, value) => {
            const element = document.querySelector(`#viewForm [name="${name}"]`);
            if (element) {
                element.value = value || '';
            }
        };

        // Populate view modal with basic user info
        setFormValue('firstName', user.firstName);
        setFormValue('lastName', user.lastName);
        setFormValue('middleName', user.middleName);
        setFormValue('suffix', user.suffix);
        setFormValue('sex', user.sex);
        setFormValue('birthDate', user.birthDate);
        setFormValue('age', calculateAge(user.birthDate));
        setFormValue('email', user.email);
        setFormValue('contactNumber', user.contactNumber);
        setFormValue('addressLine1', user.addressLine1);
        setFormValue('addressLine2', user.addressLine2);
        setFormValue('bloodType', user.bloodType);
        setFormValue('disabilityType', user.disabilityType);
        setFormValue('emergencyContactName', user.emergencyContactName);
        setFormValue('emergencyContactNumber', user.emergencyContactNumber);

        // Populate ID card information
        setFormValue('pwdIdNo', idCards.pwdIdNo);
        setFormValue('dateIssued', idCards.dateIssued);
        setFormValue('expirationDate', idCards.expirationDate);
        setFormValue('frontID', idCards.frontID);
        setFormValue('backID', idCards.backID);

        modal.show();
    }).catch(error => {
        console.error('Error fetching user data:', error);
        alert('Failed to load user data. Please try again.');
    });
}
function updateID(userId) {
    // Get the user data from Firebase
    const userRef = firebase.database().ref('users/' + userId);
    userRef.once('value').then((snapshot) => {
        const user = snapshot.val();
        if (!user) {
            alert('User data not found');
            return;
        }

        // Store the user ID for later use
        sessionStorage.setItem('currentGenerateIdUserId', userId);

        // Navigate to the Generate ID page
        window.location.href = '/Home/GenerateID';
    }).catch(error => {
        console.error('Error fetching user data:', error);
        alert('Failed to load user data. Please try again.');
    });
}