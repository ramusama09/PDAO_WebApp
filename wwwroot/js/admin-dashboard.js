let filterInputs;
document.addEventListener('DOMContentLoaded', function () {
    const database = firebase.database();
    const usersRef = database.ref('users');
    let allUsers = {};

    // Add sort functionality to name column
    const nameHeader = document.querySelector('#usersTable th:first-child');
    nameHeader.classList.add('sortable');
    let sortDirection = 'asc';

    nameHeader.addEventListener('click', function () {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        this.classList.toggle('asc', sortDirection === 'asc');
        this.classList.toggle('desc', sortDirection === 'desc');
        renderUsers(filterUsers());
    });

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', function () {
        renderUsers(filterUsers());
    }); 

    // Filter functionality
    filterInputs = document.querySelectorAll('.filter-container input');
    filterInputs.forEach(input => {
        input.addEventListener('change', function () {
            renderUsers(filterUsers());
            updateFilterButtonState();
        });
    });

    // Initial filter state
    updateFilterButtonState();

    // Update filter button state function
    function updateFilterButtonState() {
        const filterContainer = document.querySelector('.filter-container');
        const hasActiveFilters =
            document.querySelector('input[name="idFilter"]:checked')?.value !== 'all' ||
            document.getElementById('expiredId')?.checked;

        if (filterContainer) {
            filterContainer.classList.toggle('filter-active', hasActiveFilters);
        }
    }

    function filterUsers() {
        const searchTerm = searchInput.value.toLowerCase();
        const idFilter = document.querySelector('input[name="idFilter"]:checked').value;
        const showExpired = document.getElementById('expiredId').checked;

        return Object.entries(allUsers).filter(([userId, user]) => {
            // Search filtering
            const searchMatch =
                (user.firstName?.toLowerCase().includes(searchTerm) ||
                    user.lastName?.toLowerCase().includes(searchTerm) ||
                    user.middleName?.toLowerCase().includes(searchTerm) ||
                    user.addressLine1?.toLowerCase().includes(searchTerm) ||
                    user.addressLine2?.toLowerCase().includes(searchTerm) ||
                    user.email?.toLowerCase().includes(searchTerm) ||
                    user.contactNumber?.toLowerCase().includes(searchTerm) ||
                    user.disabilityType?.toLowerCase().includes(searchTerm));

            // ID status filtering
            const hasId = user.idCards && Object.keys(user.idCards).length > 0;
            const idStatusMatch =
                idFilter === 'all' ? true :
                    idFilter === 'withId' ? hasId :
                        idFilter === 'withoutId' ? !hasId : true;

            // Expiration filtering
            const isExpired = user.idCards?.expirationDate &&
                new Date(user.idCards.expirationDate) < new Date();
            const expirationMatch = !showExpired || isExpired;

            return searchMatch && idStatusMatch &&
                (showExpired ? expirationMatch : true);
        });
    }

    function renderUsers(filteredUsers) {
        const tableBody = document.querySelector('#usersTable tbody');
        tableBody.innerHTML = '';

        // Sort users if needed
        filteredUsers.sort(([, a], [, b]) => {
            const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
            const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
            return sortDirection === 'asc' ?
                nameA.localeCompare(nameB) :
                nameB.localeCompare(nameA);
        });

        filteredUsers.forEach(([userId, user]) => {
            const middleInitial = user.middleName ? user.middleName.charAt(0) + '.' : '';
            const fullName = `${user.firstName} ${middleInitial} ${user.lastName} ${user.suffix || ''}`;

            const row = document.createElement('tr');

            // Name column
            const nameCell = document.createElement('td');
            nameCell.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="status-indicator status-active"></div>
                <strong>${fullName}</strong>
            </div>
            <div class="text-muted small">Age: ${calculateAge(user.birthDate) || 'N/A'}</div>
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
                <button class="btn-action btn-print" onclick="printUserID('${userId}')">
                    <i class="bi bi-printer"></i> Print ID Card
                </button>
            </div>
        `;

            row.appendChild(actionCell);
            tableBody.appendChild(row);
        });

        // Add "No results found" message if no users match the filters
        if (filteredUsers.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
            <td colspan="4" class="text-center py-4 text-muted">
                <i class="bi bi-search me-2"></i>No matching records found
            </td>
        `;
            tableBody.appendChild(emptyRow);
        }
    }

    usersRef.on('value', (snapshot) => {
        allUsers = snapshot.val() || {};
        renderUsers(Object.entries(allUsers));
    });
});

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

        // Set image sources for ID previews
        const frontIDImage = document.getElementById('frontIDImage');
        const backIDImage = document.getElementById('backIDImage');

        // Set front ID image with fallback
        if (idCards.frontID) {
            frontIDImage.src = idCards.frontID;
            frontIDImage.style.display = 'block';
            if (idCards.frontID) {
                frontIDImage.onclick = function () {
                    showZoomedImage(this.src, 'Front ID Card');
                };
                frontIDImage.style.cursor = 'pointer';
            }
        } else {
            frontIDImage.src = '/img/no-id-placeholder.jpg'; // Add a placeholder image
            frontIDImage.style.display = 'block';
        }

        // Set back ID image with fallback
        if (idCards.backID) {
            backIDImage.src = idCards.backID;
            backIDImage.style.display = 'block';
            if (idCards.backID) {
                backIDImage.onclick = function () {
                    showZoomedImage(this.src, 'Back ID Card');
                };
                backIDImage.style.cursor = 'pointer';
            }
        } else {
            backIDImage.src = '/img/no-id-placeholder.jpg'; // Add a placeholder image
            backIDImage.style.display = 'block';
        }



        // Handle image loading errors
        frontIDImage.onerror = function () {
            this.src = '/img/no-id-placeholder.jpg';
        };
        backIDImage.onerror = function () {
            this.src = '/img/no-id-placeholder.jpg';
        };

        // Populate other form fields as before
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
        setFormValue('pwdIdNo', idCards.pwdIdNo);
        setFormValue('dateIssued', idCards.dateIssued);
        setFormValue('expirationDate', idCards.expirationDate);

        modal.show();
    }).catch(error => {
        console.error('Error fetching user data:', error);
        alert('Failed to load user data. Please try again.');
    });
}

// Add this new function for handling image zoom
function showZoomedImage(imageSrc, title) {
    const zoomModal = new bootstrap.Modal(document.getElementById('imageZoomModal'));
    const zoomedImage = document.getElementById('zoomedImage');
    const modalTitle = document.getElementById('imageZoomModalLabel');

    zoomedImage.src = imageSrc;
    modalTitle.textContent = title;

    // Handle image loading error in zoom modal
    zoomedImage.onerror = function () {
        this.src = '/img/no-id-placeholder.jpg';
    };

    zoomModal.show();
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

        // Store both the user ID and uid for later use
        sessionStorage.setItem('currentGenerateIdUserId', userId);
        sessionStorage.setItem('currentUserUID', userId); // Using userId as the UID since Firebase Database ID is unique

        // Navigate to the Generate ID page
        window.location.href = '/Home/GenerateID';
    }).catch(error => {
        console.error('Error fetching user data:', error);
        alert('Failed to load user data. Please try again.');
    });
}


function createPrintWindow(frontID, backID) {
    const printWindow = window.open('', '', 'width=800,height=600');
    const inchToPx = 96; // Standard DPI
    const cardWidth = 3.375 * inchToPx;
    const cardHeight = 2.125 * inchToPx;

    // Flag to track if onafterprint has fired
    let printFinished = false;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print ID Card</title>
            <style>
                @media print {
                    @page {
                        size: auto;
                        margin: 0;
                    }
                    body {
                        margin: 0.5in;
                    }
                }
                .card-container {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                }
                .card {
                    width: ${cardWidth}px;
                    height: ${cardHeight}px;
                }
                .card img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
            </style>
        </head>
        <body>
            <div class="card-container">
                <div class="card">
                    <img src="${frontID}" alt="Front ID">
                </div>
                <div class="card">
                    <img src="${backID}" alt="Back ID">
                </div>
            </div>
            <script>
                window.onload = function() {
                    // Set a timeout to check if print dialog was closed/cancelled
                    const printTimeout = setTimeout(() => {
                        if (!window.printFinished) { // Check the flag from the parent window
                            console.log('Print dialog likely cancelled or closed.');
                            window.close();
                        }
                    }, 1000); // Give it 1 second

                    window.print();

                    window.onafterprint = function() {
                        clearTimeout(printTimeout); // Clear the timeout if print happens
                        window.printFinished = true; // Set the flag
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();

    // Attach the printFinished flag to the printWindow object so the script inside can access it
    printWindow.printFinished = printFinished;
}

// Add the printUserID function
function printUserID(userId) {
    const userRef = firebase.database().ref('users/' + userId);
    userRef.once('value').then((snapshot) => {
        const user = snapshot.val();
        if (!user || !user.idCards) {
            alert('ID card information not found for this user.');
            return;
        }

        const { frontID, backID } = user.idCards;
        if (!frontID || !backID) {
            alert('ID card images are not available.');
            return;
        }

        createPrintWindow(frontID, backID);
    }).catch(error => {
        console.error('Error fetching user data:', error);
        alert('Failed to load ID card data. Please try again.');
    });
}