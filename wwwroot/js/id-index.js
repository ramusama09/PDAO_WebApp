document.addEventListener('DOMContentLoaded', function() {
    // Show loading modal
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    // Check authentication state
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '/Identity/Account/Login';
            return;
        }

        try {
            // Get user's ID card data
            const idCardRef = database.ref(`users/${user.uid}/idCards`);
            const snapshot = await idCardRef.once('value');
            const idCardData = snapshot.val();

            // Update UI based on ID card status
            const idCardDisplay = document.getElementById('idCardDisplay');
            const idCardStatus = document.getElementById('idCardStatus');
            const idCardInfo = document.getElementById('idCardInfo');
            const idCardActions = document.getElementById('idCardActions');
            const createIdBtn = document.getElementById('createIdBtn');
            const printIdBtn = document.getElementById('printIdBtn');

            idCardDisplay.classList.remove('d-none');
            idCardActions.classList.remove('d-none');

            if (idCardData) {
                // User has an ID card
                idCardStatus.innerHTML = `
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <h4 class="mt-3">ID Card Active</h4>
                    <p>Your PWD ID Card is valid and active.</p>
                `;

                // Update ID card info
                idCardInfo.innerHTML = `
                    <div class="info-item">
                        <div class="info-label">ID Number</div>
                        <div class="info-value">${idCardData.pwdIdNo || 'Not set'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date Issued</div>
                        <div class="info-value">${formatDate(idCardData.dateIssued)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Expiration Date</div>
                        <div class="info-value">${formatDate(idCardData.expirationDate)}</div>
                    </div>
                `;

                // Update create button to update
                createIdBtn.textContent = 'Update ID Card';
                createIdBtn.href = '/ID_Cards/ID_Create?update=true';

                // Show front and back images
                const frontCardPreview = document.getElementById('frontCardPreview');
                const backCardPreview = document.getElementById('backCardPreview');

                if (idCardData.frontID) {
                    frontCardPreview.innerHTML = `<img src="${idCardData.frontID}" alt="Front ID Card" class="img-fluid">`;
                }

                if (idCardData.backID) {
                    backCardPreview.innerHTML = `<img src="${idCardData.backID}" alt="Back ID Card" class="img-fluid">`;
                }

                // Setup print functionality
                setupPrint(idCardData.frontID, idCardData.backID);
            } else {
                // User doesn't have an ID card
                idCardStatus.innerHTML = `
                    <i class="bi bi-exclamation-circle-fill text-warning"></i>
                    <h4 class="mt-3">No ID Card Found</h4>
                    <p>You haven't created your PWD ID Card yet.</p>
                    <div class="mt-3">
                        <a href="/ID_Cards/ID_Create" class="btn btn-primary">Create ID Card</a>
                    </div>
                `;

                // Hide print button if no ID card
                printIdBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching ID card data:', error);
            idCardStatus.innerHTML = `
                <i class="bi bi-x-circle-fill text-danger"></i>
                <h4 class="mt-3">Error</h4>
                <p>Failed to load ID card information. Please try again later.</p>
            `;
        } finally {
            // Hide loading modal
            loadingModal.hide();
        }
    });
});

function setupPrint(frontImage, backImage) {
    const printIdBtn = document.getElementById('printIdBtn');
    const printContainer = document.getElementById('printContainer');
    const printFrontImg = document.getElementById('printFrontImg');
    const printBackImg = document.getElementById('printBackImg');

    printIdBtn.addEventListener('click', () => {
        printFrontImg.src = frontImage;
        printBackImg.src = backImage;
        printContainer.style.display = 'block';
        window.print();
        printContainer.style.display = 'none';
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
} 