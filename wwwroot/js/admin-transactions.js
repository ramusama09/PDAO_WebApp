let allUsers = {};
let currentTransactions = [];
let currentUserId = '';
let currentTransactionSortOrder = 'latest';
let currentSortDirection = 'asc';
let lastSortedColumn = null;

document.addEventListener('DOMContentLoaded', function () {
    const database = firebase.database();
    const usersRef = database.ref('users');

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', function () {
        renderUsers(filterUsers());
    });

    function filterUsers() {
        const searchTerm = searchInput.value.toLowerCase();
        return Object.entries(allUsers).filter(([userId, user]) => {
            return (user.firstName?.toLowerCase().includes(searchTerm) ||
                user.lastName?.toLowerCase().includes(searchTerm) ||
                user.middleName?.toLowerCase().includes(searchTerm) ||
                user.email?.toLowerCase().includes(searchTerm) ||
                user.contactNumber?.toLowerCase().includes(searchTerm) ||
                user.disabilityType?.toLowerCase().includes(searchTerm));
        });
    }

    // Add sorting functionality
    document.querySelector('th.sortable').addEventListener('click', function () {
        // Toggle sort direction
        currentSortDirection = this.classList.contains('asc') ? 'desc' : 'asc';

        // Remove sorting classes from all headers
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('asc', 'desc');
        });

        // Add current sort direction class
        this.classList.add(currentSortDirection);

        // Sort and render users
        renderUsers(sortUsers(filterUsers()));
    });

    function sortUsers(users) {
        return users.sort(([_aId, a], [_bId, b]) => {
            const aName = `${a.firstName || ''} ${a.middleName || ''} ${a.lastName || ''}`.trim().toLowerCase();
            const bName = `${b.firstName || ''} ${b.middleName || ''} ${b.lastName || ''}`.trim().toLowerCase();

            if (currentSortDirection === 'asc') {
                return aName.localeCompare(bName);
            } else {
                return bName.localeCompare(aName);
            }
        });
    }
    function renderUsers(filteredUsers) {
        // Sort users if a sort direction is set
        if (currentSortDirection) {
            filteredUsers = sortUsers(filteredUsers);
        }

        const tableBody = document.querySelector('#usersTable tbody');
        tableBody.innerHTML = '';

        filteredUsers.forEach(([userId, user]) => {
            const middleInitial = user.middleName ? user.middleName.charAt(0) + '.' : '';
            const fullName = `${user.firstName} ${middleInitial} ${user.lastName} ${user.suffix || ''}`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="status-indicator status-active"></div>
                        <strong>${fullName}</strong>
                    </div>
                </td>
                <td>
                    <div><i class="fas fa-phone me-2 text-muted"></i> ${user.contactNumber || 'N/A'}</div>
                    <div><i class="fas fa-envelope me-2 text-muted"></i> ${user.email || 'N/A'}</div>
                </td>
                <td class="text-center">
                    <span class="badge bg-success bg-opacity-10 text-success">
                        ${user.disabilityType || 'N/A'}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn-action" onclick="viewTransactions('${userId}')">
                        <i class="bi bi-clock-history"></i>
                        View Transactions
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

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

    // Load initial user data
    usersRef.on('value', (snapshot) => {
        allUsers = snapshot.val() || {};
        renderUsers(Object.entries(allUsers));
    });
});

function viewTransactions(userId) {
    const database = firebase.database();
    const transactionsRef = database.ref(`transactions/${userId}`);
    const user = allUsers[userId];
    currentUserId = userId;
    // Update modal title with user name
    const middleInitial = user.middleName ? user.middleName.charAt(0) + '.' : '';
    const fullName = `${user.firstName} ${middleInitial} ${user.lastName} ${user.suffix || ''}`;
    document.getElementById('customerName').textContent = fullName;

    transactionsRef.once('value', (snapshot) => {
        const transactions = snapshot.val() || {};
        currentTransactions = Object.entries(transactions).map(([timestamp, data]) => ({
            timestamp,
            date: formatDateTime(timestamp),
            ...data
        }));

        document.getElementById('transactionCount').textContent = currentTransactions.length;
        renderTransactions(currentTransactions);

        const modal = new bootstrap.Modal(document.getElementById('viewTransactionsModal'));
        modal.show();
    });
}

function formatDateTime(timestamp) {
    const year = timestamp.slice(0, 4);
    const month = parseInt(timestamp.slice(4, 6));
    const day = parseInt(timestamp.slice(6, 8));
    let hour = parseInt(timestamp.slice(8, 10));
    const minute = timestamp.slice(10, 12);

    // Convert month number to name
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = months[month - 1];

    // Convert to 12-hour format and determine AM/PM
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; // Convert hour '0' to '12'
    const formattedHour = hour.toString().padStart(2, '0');

    return `${monthName} ${day}, ${year} - ${formattedHour}:${minute} ${period}`;
}

// Add event listeners for sorting and searching
document.getElementById('transactionSort').addEventListener('change', function (e) {
    currentTransactionSortOrder = e.target.value;
    renderTransactions(filterTransactions());
});

document.getElementById('transactionSearch').addEventListener('input', function (e) {
    renderTransactions(filterTransactions());
});

// Filter transactions based on search
function filterTransactions() {
    const searchTerm = document.getElementById('transactionSearch').value.toLowerCase();
    return currentTransactions.filter(transaction =>
        transaction.storeName?.toLowerCase().includes(searchTerm) ||
        transaction.referenceNum?.toLowerCase().includes(searchTerm) ||
        transaction.description?.toLowerCase().includes(searchTerm) ||
        transaction.address?.toLowerCase().includes(searchTerm)
    );
}

// Render transactions with sorting
function renderTransactions(transactions) {
    // Sort transactions based on selected order
    const sortedTransactions = [...transactions].sort((a, b) => {
        switch (currentTransactionSortOrder) {
            case 'latest':
                return b.timestamp.localeCompare(a.timestamp);
            case 'oldest':
                return a.timestamp.localeCompare(b.timestamp);
            case 'store':
                return (a.storeName || '').localeCompare(b.storeName || '');
            case 'reference':
                return (a.referenceNum || '').localeCompare(b.referenceNum || '');
            default:
                return 0;
        }
    });

    const tableBody = document.getElementById('transactionsTableBody');
    tableBody.innerHTML = '';

    if (sortedTransactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    <i class="bi bi-inbox me-2"></i>No transactions found
                </td>
            </tr>
        `;
        return;
    }

    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="status-indicator status-active"></div>
                    <span class="reference-number"> ${transaction.referenceNum || 'N/A'}</span>
                </div>
            </td>
            <td>
                <div class="transaction-date">
                    <i class="fas fa-calendar me-2 text-info"></i>
                    ${transaction.date}
                </div>
            </td>
            <td>
                <div class="store-name">
                    <i class="fas fa-store me-2 text-warning"></i>
                    ${transaction.storeName || 'N/A'}
                </div>
            </td>
            <td>
                <div class="transaction-description" title="${transaction.description || 'N/A'}">
                    <i class="fas fa-info-circle me-2 text-primary"></i>
                    ${transaction.description || 'N/A'}
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="fas fa-map-marker-alt me-2 text-danger"></i>
                    ${transaction.address || 'N/A'}
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function formatTransactionDateTime(timestamp) {
    const year = timestamp.slice(0, 4);
    const month = parseInt(timestamp.slice(4, 6)) - 1;
    const day = parseInt(timestamp.slice(6, 8));
    let hour = parseInt(timestamp.slice(8, 10));
    const minute = timestamp.slice(10, 12);

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[month];

    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    const formattedHour = hour.toString().padStart(2, '0');

    return `${monthName} ${day}, ${year} - ${formattedHour}:${minute} ${period}`;
}


function exportToExcel(data, fileName) {
    // Create worksheet data
    const wsData = [
        ['Full Name', 'Reference Number', 'Date & Time', 'Store Name', 'Description', 'Address']
    ];

    // Add data rows
    data.forEach(row => {
        const middleInitial = row.user.middleName ? row.user.middleName.charAt(0) + '.' : '';
        const fullName = `${row.user.firstName || ''} ${middleInitial} ${row.user.lastName || ''} ${row.user.suffix || ''}`.trim();

        wsData.push([
            fullName,
            row.transaction.referenceNum || '',
            row.formattedDateTime,
            row.transaction.storeName || '',
            row.transaction.description || '',
            row.transaction.address || ''
        ]);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = [
        { wch: 30 },  // Full Name
        { wch: 20 },  // Reference Number
        { wch: 25 },  // Date & Time
        { wch: 20 },  // Store Name
        { wch: 30 },  // Description
        { wch: 35 }   // Address
    ];
    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, fileName.replace('.csv', '.xlsx'));
}

// Update the export button event listeners to use .xlsx extension
document.getElementById('exportAll').addEventListener('click', function () {
    const database = firebase.database();
    const transactionsRef = database.ref('transactions');

    transactionsRef.once('value', (snapshot) => {
        const allTransactions = [];
        const transactions = snapshot.val() || {};

        Object.entries(transactions).forEach(([userId, userTransactions]) => {
            const user = allUsers[userId];
            if (user && userTransactions) {
                Object.entries(userTransactions).forEach(([timestamp, transaction]) => {
                    allTransactions.push({
                        user: user,
                        transaction: transaction,
                        formattedDateTime: formatTransactionDateTime(timestamp)
                    });
                });
            }
        });

        exportToExcel(allTransactions, 'all_transactions.xlsx');
    });
});

document.getElementById('exportSpecificUser').addEventListener('click', function () {
    const specificTransactions = [];

    currentTransactions.forEach(transaction => {
        const user = allUsers[currentUserId];
        specificTransactions.push({
            user: user,
            transaction: {
                referenceNum: transaction.referenceNum,
                storeName: transaction.storeName,
                description: transaction.description,
                address: transaction.address
            },
            formattedDateTime: transaction.date
        });
    });

    const userName = document.getElementById('customerName').textContent.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    exportToExcel(specificTransactions, `transactions_${userName}.xlsx`);
});