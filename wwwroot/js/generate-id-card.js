async function generateIDCards(userData, pwdIdNo) {
    try {
        // Generate front and back ID card HTML with user data
        const frontHTML = await generateFrontIDHTML(userData);
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

// Also modify generateFrontIDHTML to handle the photo differently
function generateFrontIDHTML(userData) {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '500px';

    // Get the photo URL from userData or use default
    let photoURL = '/img/default_face.jpg';

    if (userData.idCards?.photoID) {
        // If we have a data URL from the original upload, use that
        if (userData.idCards.photoID.startsWith('data:')) {
            photoURL = userData.idCards.photoID;
        } else {
            // If it's a Firebase URL, we'll handle it in htmlToImage
            photoURL = userData.idCards.photoID;
        }
    }

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
                            <img src="${photoURL}" alt="ID Photo" crossorigin="anonymous" onerror="this.src='/img/default_face.jpg'">
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
                                <p class="p-0 m-0 text-center helvetica fs-5">Insert Signature</p>
                            </div>
                            <div class="col-10 offset-1">
                                <p class="p-0 m-0 text-center fw-bold">Signature</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 m-0 p-0">
                        <div class="photo-box-no-border p-1">
                            <img src="/img/qr_sample.png" alt="QR Code">
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

    return container;
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
        // Add container to document temporarily
        document.body.appendChild(container);

        // Apply necessary styles
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/id_card_styles.css';
        document.head.appendChild(link);

        // Find all Firebase Storage images
        const firebaseImages = container.querySelectorAll('img[src^="https://firebasestorage.googleapis.com"]');

        // Convert Firebase images to data URLs
        await Promise.all(Array.from(firebaseImages).map(async img => {
            try {
                // Create a new image element
                const tempImg = new Image();

                // Set crossOrigin to anonymous
                tempImg.crossOrigin = 'anonymous';

                // Create a canvas element
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Wait for the image to load
                await new Promise((resolve, reject) => {
                    tempImg.onload = resolve;
                    tempImg.onerror = () => {
                        console.warn('Failed to load image, using default');
                        img.src = '/img/default_face.jpg';
                        resolve();
                    };
                    tempImg.src = img.src;
                });

                if (tempImg.src !== '/img/default_face.jpg') {
                    // Set canvas dimensions
                    canvas.width = tempImg.width;
                    canvas.height = tempImg.height;

                    // Draw image to canvas
                    ctx.drawImage(tempImg, 0, 0);

                    // Convert to data URL
                    try {
                        const dataUrl = canvas.toDataURL('image/png');
                        img.src = dataUrl;
                    } catch (e) {
                        console.warn('Failed to convert to data URL, using default');
                        img.src = '/img/default_face.jpg';
                    }
                }
            } catch (error) {
                console.error('Error processing image:', error);
                img.src = '/img/default_face.jpg';
            }
        }));

        // Wait for images and styles to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Convert to canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: function (clonedDoc) {
                // Ensure all images in cloned document are loaded
                const images = clonedDoc.getElementsByTagName('img');
                for (let img of images) {
                    if (img.src.startsWith('https://firebasestorage.googleapis.com')) {
                        img.src = img.src;
                    }
                }
            }
        });

        // Clean up
        document.body.removeChild(container);
        document.head.removeChild(link);

        // Convert canvas to blob
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