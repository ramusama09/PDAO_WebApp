async function generateIDCards(userData, pwdIdNo) {
    try {
        // Generate front and back ID card HTML with user data
        const frontHTML = await generateFrontIDHTML(userData); // Now awaiting the Promise
        const backHTML = await generateBackIDHTML(userData);

        // Convert HTML to images using html2canvas
        const frontImage = await htmlToImage(frontHTML);
        const backImage = await htmlToImage(backHTML);

        // Upload images to Firebase Storage and get URLs
        const frontURL = await uploadIDCardImage(frontImage, pwdIdNo, 'front');
        const backURL = await uploadIDCardImage(backImage, pwdIdNo, 'back');

        // Return the URLs for database storage
        return { frontID: frontURL, backID: backURL };
    } catch (error) {
        console.error('Error generating ID cards:', error);
        throw error;
    }
}
function generateFrontIDHTML(userData) {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '500px';

    // Use photoID directly from userData if it exists, otherwise use default
    const photoID = userData.idCards?.photoID || '/img/default_face.jpg';

    // Create QR code container
    const qrContainer = document.createElement('div');
    qrContainer.id = 'qrcode-container';
    qrContainer.style.display = 'none'; // Hide initially
    document.body.appendChild(qrContainer);

    // Get QR code data - Add this before creating the QR code
    const userUID = sessionStorage.getItem('currentUserUID') || '';

    // Generate QR code
    const qr = new QRCode(qrContainer, {
        text: userUID, // Use the UID from sessionStorage
        width: 128,
        height: 128,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Get QR code as data URL after a short delay to ensure it's generated
    return new Promise((resolve) => {
        setTimeout(() => {
            const qrDataUrl = qrContainer.querySelector('canvas').toDataURL('image/png');
            document.body.removeChild(qrContainer);

            container.innerHTML = `
                <div class="card pwd-card" style="border: 1px solid black;">
                    <div class="header">
                        <div class="row p-0 m-0" style="height: 100px;">
                            <div class="col-3 p-0 m-0 d-flex justify-content-center align-items-center">
                                <img src="/img/PH_Flag.webp" alt="Philippine Flag" class="flag" style="max-height: 60px;">
                            </div>
                            <div class="col-6 text-center p-0 m-0 d-flex flex-column justify-content-center">
                                <h5 class="mb-0 fw-bold">REPUBLIC OF THE PHILIPPINES</h5>
                                <h4 class="mb-0 helvetica shadowed">CITY OF PARAÑAQUE</h4>
                                <small>Persons with Disability Affairs Office</small>
                            </div>
                            <div class="col-1 p-0 m-0 d-flex justify-content-center align-items-center">
                                <img src="/img/PQ_Logo.jpg" alt="City Seal" class="logo" style="max-height: 60px;">
                            </div>
                            <div class="col-1 p-0 m-0 d-flex justify-content-center align-items-center">
                                <img src="/img/BP_Logo.jpg" alt="Bagong Pilipinas Logo" class="logo" style="max-height: 60px;">
                            </div>
                            <div class="col-1 p-0 m-0 d-flex justify-content-center align-items-center">
                                <img src="/img/PDAO_Logo.png" alt="PWD Logo" class="logo" style="max-height: 60px;">
                            </div>
                        </div>
                        <div class="row mt-2 p-0 m-0">
                            <div class="col-3"></div>
                            <div class="col-6 text-center p-0 m-0">
                                <strong>PWD ID NO: </strong><span class="underlined-text text-space">${userData.idCards.pwdIdNo}</span>
                            </div>
                            <div class="col-3"></div>
                        </div>
                    </div>

                    <div class="content">
                        <div class="row p-0 m-0">
                            <div class="col-md-3 p-0 m-0">
                                 <div class="photo-box">
                                     <img src="${photoID}" 
                                         alt="ID Photo" 
                                         crossorigin="anonymous" 
                                         onerror="this.src='/img/default_face.jpg'">
                                 </div>
                            </div>
                            <div class="col-md-6">
                                <div class="row my-2">
                                    <div class="col-10 offset-1 border-bottom border-dark">
                                        <p class="p-0 m-0 text-center helvetica fs-5">${userData.firstName} ${userData.middleName} ${userData.lastName} ${userData.suffix || ''}</p>
                                    </div>
                                    <div class="col-10 offset-1">
                                        <p class="p-0 m-0 text-center fw-bold">Name</p>
                                    </div>
                                </div>
                                <div class="row my-2">
                                    <div class="col-10 offset-1 border-bottom border-dark">
                                        <p class="p-0 m-0 text-center helvetica fs-5">${userData.disabilityType}</p>
                                    </div>
                                    <div class="col-10 offset-1">
                                        <p class="p-0 m-0 text-center fw-bold">Type of Disability</p>
                                    </div>
                                </div>
                                <div class="row my-2">
                                    <div class="col-10 offset-1 border-bottom border-dark">
                                        <p class="p-0 m-0 text-center helvetica fs-5 invisible">Insert Signature</p>
                                    </div>
                                    <div class="col-10 offset-1">
                                        <p class="p-0 m-0 text-center fw-bold">Signature</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 m-0 p-0">
                                <div class="photo-box-no-border p-1">
                                    <img src="${qrDataUrl}" alt="QR Code">
                                </div>
                            </div>
                        </div>
            
                        <div class="row mt-4">
                            <div class="col">
                                <strong>Expires on: </strong><span class="underlined-text">${formatDate(userData.idCards.expirationDate)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        VALID ANYWHERE IN THE PHILIPPINES
                    </div>
                </div>
            `;
            resolve(container);
        }, 100);
    });
}
function generateBackIDHTML(userData) {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '500px';

    container.innerHTML = `
        <div class="card emergency-card" style="border: 1px solid black;">
            <div class="col-12">
                <h2>THIS IS NON-TRANSFERABLE</h2>
                <img src="/img/PQ_Logo.jpg" alt="City Seal Watermark" class="watermark">
            </div>
            <div class="row p-0 m-0">
                <div class="col-3">
                    <label>Address:</label>
                </div>
                <div class="col-9 border-bottom border-dark">
                    <p class="input-form-value p-0 m-0">${userData.addressLine1}</p>
                </div>
                <div class="col-9 border-bottom border-dark mt-2 offset-3">
                    <p class="input-form-value p-0 m-0">${userData.addressLine2}</p>
                </div>
            </div>
            <div class="row mt-3 p-0 m-0">
                <div class="col-3">
                    <label>Date of Birth:</label>
                </div>
                <div class="col-4 border-bottom border-dark">
                    <p class="input-form-value p-0 m-0">${formatDate(userData.birthDate)}</p>
                </div>
                <div class="col-3">
                    <label>SEX: </label>
                </div>
                <div class="col-2 border-bottom border-dark">
                    <p class="input-form-value p-0 m-0">${userData.sex}</p>
                </div>
            </div>
            
            <div class="row mt-3 p-0 m-0">
                <div class="col-3">
                    <label>Date Issued:</label>
                </div>
                <div class="col-4 border-bottom border-dark">
                    <p class="input-form-value p-0 m-0">${formatDate(userData.idCards.dateIssued)}</p>
                </div>
                <div class="col-3">
                    <label>Blood Type:</label>
                </div>
                <div class="col-2 border-bottom border-dark">
                    <p class="input-form-value p-0 m-0">${userData.bloodType}</p>
                </div>
            </div>
            
            <div class="row my-4 p-0 m-0">
                <div class="col-12">
                    <label class="uppercase fw-bold">In case of emergency, please notify:</label>
                </div>
            </div>
            
            <div class="row align-items-center p-0 m-0">
                <div class="col-4">
                    <label>Parent / Guardian:</label>
                </div>
                <div class="col-8 border-bottom border-dark d-flex align-items-center">
                    <p class="input-form-value p-0 m-0">${userData.emergencyContactName}</p>
                </div>
            </div>
            
            <div class="row p-0 m-0">
                <div class="col-4">
                    <label>Contact Number:</label>
                </div>
                <div class="col-8 border-bottom border-dark">
                    <p class="input-form-value p-0 m-0">${userData.emergencyContactNumber}</p>
                </div>
            </div>
            
            <div class="footer-content">
                <h3 class="helvetica shadowed">HON. ERIC L. OLIVAREZ</h3>
                <p class="fw-bold">City Mayor</p>
            </div>
        </div>
    `;

    return container;
}
async function htmlToImage(container) {
    try {
        document.body.appendChild(container);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/id_card_styles.css';
        document.head.appendChild(link);

        // Find Firebase Storage image (photo)
        const photoImg = container.querySelector('.photo-box img');
        if (photoImg && photoImg.src.startsWith('https://firebasestorage.googleapis.com')) {
            try {
                // Create a new image with CORS settings
                const tempImg = new Image();
                tempImg.crossOrigin = 'anonymous';

                // Convert Firebase image to data URL temporarily for html2canvas
                await new Promise((resolve, reject) => {
                    tempImg.onload = async () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = tempImg.width;
                        canvas.height = tempImg.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(tempImg, 0, 0);
                        try {
                            photoImg.src = canvas.toDataURL('image/png');
                            resolve();
                        } catch (e) {
                            console.error('Canvas to data URL error:', e);
                            photoImg.src = '/img/default_face.jpg';
                            resolve();
                        }
                    };
                    tempImg.onerror = () => {
                        console.warn('Failed to load image, using default');
                        photoImg.src = '/img/default_face.jpg';
                        resolve();
                    };

                    // Get the Firebase auth token
                    firebase.auth().currentUser.getIdToken(true)
                        .then(token => {
                            // Add the token to the image URL
                            const imageUrl = new URL(photoImg.src);
                            imageUrl.searchParams.append('token', token);
                            tempImg.src = imageUrl.toString();
                        })
                        .catch(error => {
                            console.error('Error getting auth token:', error);
                            photoImg.src = '/img/default_face.jpg';
                            resolve();
                        });
                });
            } catch (error) {
                console.error('Error processing photo:', error);
                photoImg.src = '/img/default_face.jpg';
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 15000,
            onclone: function (clonedDoc) {
                const images = clonedDoc.getElementsByTagName('img');
                for (let img of images) {
                    if (img.src.startsWith('https://firebasestorage.googleapis.com')) {
                        img.crossOrigin = 'anonymous';
                    }
                }
            }
        });

        document.body.removeChild(container);
        document.head.removeChild(link);

        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });
    } catch (error) {
        console.error('Error in htmlToImage:', error);
        throw error;
    }
}
async function uploadIDCardImage(imageBlob, pwdIdNo, side) {
    const storage = firebase.storage();
    const storageRef = storage.ref();
    const filename = `${pwdIdNo}.png`;
    const filepath = `ID-Card-${side}/${filename}`;
    
    // Create reference to the file path
    const fileRef = storageRef.child(filepath);
    
    // Upload the image
    await fileRef.put(imageBlob);
    
    // Get and return the download URL
    return await fileRef.getDownloadURL();
}
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}