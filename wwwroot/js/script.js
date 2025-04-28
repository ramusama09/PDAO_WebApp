document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const signatureCanvas = document.getElementById('signatureCanvas');
    const clearSignatureBtn = document.getElementById('clearSignature');
    const startCameraBtn = document.getElementById('startCamera');
    const captureImageBtn = document.getElementById('captureImage');
    const cameraFeed = document.getElementById('cameraFeed');
    const captureCanvas = document.getElementById('captureCanvas');
    const capturedImage = document.getElementById('capturedImage');
    const previewButton = document.getElementById('previewButton');
    const printButton = document.getElementById('printButton');
    const frontIdPreview = document.getElementById('frontIdPreview');
    const backIdPreview = document.getElementById('backIdPreview');
    const printArea = document.getElementById('printArea');
    
    let stream = null;
    let isDrawing = false;
    let signatureDataURL = null;
    let photoDataURL = null;
    
    // Initialize signature canvas
    const signatureCtx = signatureCanvas.getContext('2d');
    signatureCtx.lineWidth = 2;
    signatureCtx.lineCap = 'round';
    signatureCtx.strokeStyle = 'black';

    // Set initial background color for canvas
    signatureCtx.fillStyle = '#fff';
    signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    // Initialize default signature
    signatureDataURL = signatureCanvas.toDataURL('image/png');

    // Set default photo
    capturedImage.src = '/img/default_face.jpg';
    photoDataURL = '/img/default_face.jpg';

    // Signature canvas event listeners
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);
    signatureCanvas.addEventListener('touchstart', startDrawingTouch);
    signatureCanvas.addEventListener('touchmove', drawTouch);
    signatureCanvas.addEventListener('touchend', stopDrawing);
    
    clearSignatureBtn.addEventListener('click', clearSignature);
    
    // Camera functionality
    startCameraBtn.addEventListener('click', startCamera);
    captureImageBtn.addEventListener('click', captureImage);
    
    // Preview and print buttons
    previewButton.addEventListener('click', previewID);
    document.getElementById('printFrontButton').addEventListener('click', function() {
        printIDs('front');
    });
    document.getElementById('printBackButton').addEventListener('click', function() {
        printIDs('back');
    });
    
    // Signature functions
    function startDrawing(e) {
        isDrawing = true;
        signatureCtx.beginPath();
        signatureCtx.moveTo(e.offsetX, e.offsetY);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        signatureCtx.lineTo(e.offsetX, e.offsetY);
        signatureCtx.stroke();
    }
    
    function startDrawingTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = signatureCanvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        
        isDrawing = true;
        signatureCtx.beginPath();
        signatureCtx.moveTo(offsetX, offsetY);
    }
    
    function drawTouch(e) {
        e.preventDefault();
        if (!isDrawing) return;
        
        const touch = e.touches[0];
        const rect = signatureCanvas.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        
        signatureCtx.lineTo(offsetX, offsetY);
        signatureCtx.stroke();
    }
    
    function stopDrawing() {
        if (isDrawing) {
            signatureCtx.closePath();
            isDrawing = false;
            optimizeSignature();
        }
    }
    
    function clearSignature() {
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureCtx.fillStyle = '#fff';
        signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureDataURL = signatureCanvas.toDataURL('image/png');
    }
    
    // Optimize signature by trimming whitespace and ensuring min height
    function optimizeSignature() {
        const imageData = signatureCtx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
        const data = imageData.data;
        const width = signatureCanvas.width;
        const height = signatureCanvas.height;
        
        // Find the bounds of the signature (non-white pixels)
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let hasSignature = false;
        
        // Scan for non-white pixels
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                // Check if pixel is not white (alpha > 0 and not full white)
                if (data[i+3] > 0 && !(data[i] === 255 && data[i+1] === 255 && data[i+2] === 255)) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                    hasSignature = true;
                }
            }
        }
        
        // If no signature found or just dots, return the full canvas
        if (!hasSignature || (maxX - minX < 5 && maxY - minY < 5)) {
            signatureDataURL = signatureCanvas.toDataURL('image/png');
            return;
        }
        
        // Add padding around the signature
        const padding = 5;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(width, maxX + padding);
        maxY = Math.min(height, maxY + padding);
        
        // Calculate dimensions
        let sigWidth = maxX - minX;
        let sigHeight = maxY - minY;
        
        // Create a temporary canvas for the trimmed signature
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Ensure minimum height of 35px while maintaining aspect ratio
        let newWidth = sigWidth;
        let newHeight = sigHeight;
        
        if (sigHeight < 35) {
            const scale = 35 / sigHeight;
            newWidth = sigWidth * scale;
            newHeight = 35;
        }
        
        // Cap maximum height at 35px if larger
        if (sigHeight > 35) {
            const scale = 35 / sigHeight;
            newWidth = sigWidth * scale;
            newHeight = 35;
        }
        
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        
        // Set white background
        tempCtx.fillStyle = '#fff';
        tempCtx.fillRect(0, 0, newWidth, newHeight);
        
        // Draw the trimmed signature
        tempCtx.drawImage(
            signatureCanvas,
            minX, minY, sigWidth, sigHeight,
            0, 0, newWidth, newHeight
        );
        
        // Update the signature data URL
        signatureDataURL = tempCanvas.toDataURL('image/png');
    }
    
    // Camera functions
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 300 },
                    height: { ideal: 225 }
                }
            });
            cameraFeed.srcObject = stream;
            startCameraBtn.disabled = true;
            captureImageBtn.disabled = false;
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Error accessing camera. Please make sure you have granted permission to use the camera.');
        }
    }
    
    function captureImage() {
        if (!stream) return;
        
        const captureCtx = captureCanvas.getContext('2d');
        captureCtx.drawImage(cameraFeed, 0, 0, captureCanvas.width, captureCanvas.height);
        photoDataURL = captureCanvas.toDataURL('image/png');
        capturedImage.src = photoDataURL;
        
        // Stop the camera stream
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        cameraFeed.srcObject = null;
        startCameraBtn.disabled = false;
    }
    
    // Function to adjust text sizes based on content length
    function getAdjustedFontSize(text, baseSize, maxLength, minSize) {
        if (!text) return baseSize;
        
        const length = text.length;
        if (length <= maxLength) return baseSize;
        
        // Calculate a reduced font size based on content length
        const reduction = Math.min(1, maxLength / length);
        const newSize = Math.max(minSize, Math.floor(baseSize * reduction));
        
        return newSize;
    }
    
    // Check if text would exceed a single line and adjust font size accordingly
    function adjustFontForSingleLine(element, text, initialSize, minSize) {
        if (!element || !text) return initialSize + 'px';
        
        // Direct approach to measuring and adjusting text
        const containerWidth = element.clientWidth || 150; // Fallback width if element isn't sized yet
        
        // Start with the initial size and reduce until it fits
        let fontSize = initialSize;
        let doesFit = false;
        
        while (!doesFit && fontSize > minSize) {
            // Create a temporary measuring element with current font size
            const tempSpan = document.createElement('span');
            tempSpan.style.fontSize = fontSize + 'px';
            tempSpan.style.fontFamily = getComputedStyle(element).fontFamily || 'Arial, sans-serif';
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.position = 'absolute';
            tempSpan.style.left = '-9999px';
            tempSpan.style.whiteSpace = 'nowrap';
            tempSpan.textContent = text;
            document.body.appendChild(tempSpan);
            
            // Check if the text fits
            const textWidth = tempSpan.offsetWidth;
            document.body.removeChild(tempSpan);
            
            // If text fits or we've reached minimum size, we're done
            if (textWidth <= containerWidth || fontSize <= minSize) {
                doesFit = true;
            } else {
                // Reduce font size and try again
                fontSize -= 1;
            }
        }
        
        return fontSize + 'px';
    }
    
    // Direct text length based font sizing with specific thresholds
    function getDirectFontSize(text, defaultSize, startReduction = 20) {
        if (!text) return defaultSize + 'px';
        
        const length = text.length;
        
        // Apply specific font sizes based on text length thresholds
        // If startReduction parameter is provided, only start reducing at that character count
        if (length <= startReduction) return defaultSize + 'px';
        if (length <= startReduction + 10) return (defaultSize - 2) + 'px';
        if (length <= startReduction + 20) return (defaultSize - 4) + 'px';
        if (length <= startReduction + 40) return (defaultSize - 6) + 'px';
        if (length <= startReduction + 60) return (defaultSize - 8) + 'px';
        
        // For extremely long text
        return (defaultSize - 10) + 'px';
    }
    
    // Preview ID function
    function previewID() {
        const formData = getFormData();
        
        // Generate QR code data string
        const qrData = `PWD ID: ${formData.pwdIdNo}\nName: ${formData.name}\nDisability: ${formData.disabilityType}`;

        // Create a temporary container for the QR code
        const qrCodeContainer = document.createElement('div');
        QRCode.toCanvas(qrData, { width: 150 }, (error, canvas) => {
            if (error) {
                console.error('QR Code generation failed:', error);
                // Fallback to default image
                qrCodeContainer.innerHTML = `<img src="/img/qr_sample.png" alt="QR Code">`;
            } else {
                qrCodeContainer.innerHTML = '';
                qrCodeContainer.appendChild(canvas);
            }
        });

        // Front ID preview with placeholder font sizes initially
        frontIdPreview.innerHTML = `
            <div class="card pwd-card">
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
                    <div class="row p-0 m-0">
                        <div class="col-3"></div>
                        <div class="col-6 text-center p-0 m-0">
                            <strong>PWD ID NO: </strong><span class="underlined-text text-space">${formData.pwdIdNo || '0000-0000-0000-0000'}</span>
                        </div>
                        <div class="col-3"></div>
                    </div>
                </div>

                <div class="content">
                    <div class="row p-0 m-0">
                        <div class="col-md-3 p-0 m-0">
                            <div class="photo-box">
                                <img src="${formData.photo || '/img/default_face.jpg'}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="row my-2">
                                <div class="col-10 offset-1 border-bottom border-dark name-container" style="height: 30px; overflow: hidden;">
                                    <p class="p-0 m-0 text-center helvetica name-text" style="font-size: ${getDirectFontSize(formData.name, 18)}; line-height: 1.2;">${formData.name || 'Juan Dela Cruz'}</p>
                                </div>
                                <div class="col-10 offset-1">
                                    <p class="p-0 m-0 text-center fw-bold" style="position: relative; z-index: 10;">Name</p>
                                </div>
                            </div>
                            <div class="row my-2">
                                <div class="col-10 offset-1 border-bottom border-dark disability-container" style="height: 30px; overflow: hidden;">
                                    <p class="p-0 m-0 text-center helvetica disability-text" style="font-size: ${getDirectFontSize(formData.disabilityType, 18)}; line-height: 1.2;">${formData.disabilityType || 'Insert Disability'}</p>
                                </div>
                                <div class="col-10 offset-1">
                                    <p class="p-0 m-0 text-center fw-bold" style="position: relative; z-index: 10;">Type of Disability</p>
                                </div>
                            </div>
                            <div class="row my-2">
                                <div class="col-10 offset-1 position-relative">
                                    <div class="border-bottom border-dark" style="height: 40px; display: flex; justify-content: center; align-items: center;">
                                        <img src="${formData.signature || signatureCanvas.toDataURL()}" alt="Signature" style="max-height: 35px; max-width: 100%; display: block; margin: 0 auto; background-color: transparent; mix-blend-mode: darken;">
                                    </div>
                                    <div class="col-12 p-0">
                                        <p class="p-0 m-0 text-center fw-bold" style="visibility: visible !important; display: block !important; position: relative; z-index: 10;">Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 m-0 p-0">
                            <div class="photo-box-no-border p-1" style="position: relative; z-index: 5;">
                                <div id="dynamicQrCode"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col">
                            <strong>Expires on: </strong><span class="underlined-text">${formData.expiresOn || 'Month DD, 20XX'}</span>
                        </div>
                    </div>
                </div>
                <div class="footer">
                    VALID ANYWHERE IN THE PHILIPPINES
                </div>
            </div>
        `;
        
        // Append the generated QR code to the preview
        document.getElementById('dynamicQrCode').appendChild(qrCodeContainer);
        
        // Create back ID preview using the structure from ID_Back.html
        backIdPreview.innerHTML = `
            <div class="card emergency-card">
                <div class="col-12">
                    <h2>THIS IS NON-TRANSFERABLE</h2>
                    <img src="/img/PQ_Logo.jpg" alt="City Seal Watermark" class="watermark">
                </div>
                <div class="row p-0 m-0">
                    <div class="col-3">
                        <label>Address:</label>
                    </div>
                    <div class="col-9 border-bottom border-dark address-container" style="min-height: 25px;">
                        <p class="input-form-value p-0 m-0 address-text" style="font-size: ${getDirectFontSize(formData.address, 16, 40)}; line-height: 1.2;">${formData.address || 'Apt/House Number, Bldg Name, Str Name.'}</p>
                    </div>
                    <div class="col-9 border-bottom border-dark mt-2 offset-3 address2-container" style="min-height: 25px;">
                        <p class="input-form-value p-0 m-0 address2-text" style="font-size: ${getDirectFontSize(formData.address2, 16, 40)}; line-height: 1.2;">${formData.address2 || 'Brgy, City, Country, Zip Code'}</p>
                    </div>
                </div>
                <div class="row mt-3 p-0 m-0">
                    <div class="col-3">
                        <label>Date of Birth:</label>
                    </div>
                    <div class="col-4 border-bottom border-dark">
                        <p class="input-form-value p-0 m-0">${formData.dateOfBirth || 'Month Day, Year'}</p>
                    </div>
                    <div class="col-3">
                        <label>SEX: </label>
                    </div>
                    <div class="col-2 border-bottom border-dark">
                        <p class="input-form-value p-0 m-0">${formData.sex || 'Male'}</p>
                    </div>
                </div>
                
                <div class="row mt-3 p-0 m-0">
                    <div class="col-3">
                        <label>Date Issued:</label>
                    </div>
                    <div class="col-4 border-bottom border-dark">
                        <p class="input-form-value p-0 m-0">${formData.dateIssued || 'Month Day, Year'}</p>
                    </div>
                    <div class="col-3">
                        <label>Blood Type:</label>
                    </div>
                    <div class="col-2 border-bottom border-dark">
                        <p class="input-form-value p-0 m-0">${formData.bloodType || 'O+'}</p>
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
                    <div class="col-8 border-bottom border-dark d-flex align-items-center guardian-container" style="min-height: 25px;">
                        <p class="input-form-value p-0 m-0 guardian-text" style="font-size: ${getDirectFontSize(formData.guardian, 16, 40)}; line-height: 1.2;">${formData.guardian || 'Juan Dela Cruz Sr.'}</p>
                    </div>
                </div>
                
                <div class="row p-0 m-0">
                    <div class="col-4">
                        <label>Contact Number:</label>
                    </div>
                    <div class="col-8 border-bottom border-dark">
                        <p class="input-form-value p-0 m-0">${formData.contactNumber || '0912-345-6789'}</p>
                    </div>
                </div>
                
                <div class="footer-content">
                    <h3 class="helvetica shadowed">HON. ERIC L. OLIVAREZ</h3>
                    <p class="fw-bold">City Mayor</p>
                </div>
            </div>
        `;
        
        // Now adjust font sizes after elements are in the DOM
        // Get the containers and text elements
        const nameContainer = frontIdPreview.querySelector('.name-container');
        const nameText = frontIdPreview.querySelector('.name-text');
        const disabilityContainer = frontIdPreview.querySelector('.disability-container');
        const disabilityText = frontIdPreview.querySelector('.disability-text');
        const addressContainer = backIdPreview.querySelector('.address-container');
        const addressText = backIdPreview.querySelector('.address-text');
        const address2Container = backIdPreview.querySelector('.address2-container');
        const address2Text = backIdPreview.querySelector('.address2-text');
        const guardianContainer = backIdPreview.querySelector('.guardian-container');
        const guardianText = backIdPreview.querySelector('.guardian-text');
        
        // Apply font size adjustments
        if (nameText && nameContainer) {
            nameText.style.fontSize = adjustFontForSingleLine(nameContainer, formData.name, 18, 10);
        }
        
        if (disabilityText && disabilityContainer) {
            disabilityText.style.fontSize = adjustFontForSingleLine(disabilityContainer, formData.disabilityType, 18, 10);
        }
        
        if (addressText && addressContainer) {
            addressText.style.fontSize = adjustFontForSingleLine(addressContainer, formData.address, 16, 10);
        }
        
        if (address2Text && address2Container) {
            address2Text.style.fontSize = adjustFontForSingleLine(address2Container, formData.address2, 16, 10);
        }
        
        if (guardianText && guardianContainer) {
            guardianText.style.fontSize = adjustFontForSingleLine(guardianContainer, formData.guardian, 16, 10);
        }
    }
    
    // Print IDs function
    function printIDs(printType = 'both') {
        const printLoading = document.getElementById('printLoading');
        printLoading.style.display = 'flex';
        printArea.innerHTML = '';

        const formData = getFormData();
        const printContainer = document.createElement('div');
        printContainer.className = 'print-container';

        // Generate QR code data string
        const qrData = `PWD ID: ${formData.pwdIdNo}\nName: ${formData.name}\nDisability: ${formData.disabilityType}`;

        // Create a temporary container for the QR code
        const qrCodeContainer = document.createElement('div');
        QRCode.toCanvas(qrData, { width: 150 }, (error, canvas) => {
            if (error) {
                console.error('QR Code generation failed:', error);
                // Fallback to default image
                qrCodeContainer.innerHTML = `<img src="/img/qr_sample.png" alt="QR Code">`;
            } else {
                qrCodeContainer.innerHTML = '';
                qrCodeContainer.appendChild(canvas);
            }
        });

        // Front ID Card Container
        if (printType === 'front' || printType === 'both') {
            const frontCardContainer = document.createElement('div');
            frontCardContainer.className = 'print-card front-card';
            frontCardContainer.style.width = '3.375in';
            frontCardContainer.style.height = '2.125in';
            frontCardContainer.style.overflow = 'hidden';
            frontCardContainer.style.position = 'relative';
            frontCardContainer.style.pageBreakAfter = 'always';
            frontCardContainer.innerHTML = `
                <div class="card-container" style="transform: scale(0.34); transform-origin: top left; position: absolute; top: 0; left: 0; width: 800px;">
                    <div class="card pwd-card">
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
                            <div class="row p-0 m-0">
                                <div class="col-3"></div>
                                <div class="col-6 text-center p-0 m-0">
                                    <strong>PWD ID NO: </strong><span class="underlined-text text-space">${formData.pwdIdNo || '0000-0000-0000-0000'}</span>
                                </div>
                                <div class="col-3"></div>
                            </div>
                        </div>

                        <div class="content">
                            <div class="row p-0 m-0">
                                <div class="col-md-3 p-0 m-0">
                                    <div class="photo-box">
                                        <img src="${formData.photo || '/img/default_face.jpg'}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="row my-2">
                                        <div class="col-10 offset-1 border-bottom border-dark" style="height: 30px; overflow: hidden;">
                                            <p class="p-0 m-0 text-center helvetica" style="font-size: ${getDirectFontSize(formData.name, 18)}; line-height: 1.2;">${formData.name || 'Juan Dela Cruz'}</p>
                                        </div>
                                        <div class="col-10 offset-1">
                                            <p class="p-0 m-0 text-center fw-bold" style="position: relative; z-index: 10;">Name</p>
                                        </div>
                                    </div>
                                    <div class="row my-2">
                                        <div class="col-10 offset-1 border-bottom border-dark" style="height: 30px; overflow: hidden;">
                                            <p class="p-0 m-0 text-center helvetica" style="font-size: ${getDirectFontSize(formData.disabilityType, 18)}; line-height: 1.2;">${formData.disabilityType || 'Insert Disability'}</p>
                                        </div>
                                        <div class="col-10 offset-1">
                                            <p class="p-0 m-0 text-center fw-bold" style="position: relative; z-index: 10;">Type of Disability</p>
                                        </div>
                                    </div>
                                    <div class="row my-2">
                                        <div class="col-10 offset-1 position-relative">
                                            <div class="border-bottom border-dark" style="height: 40px; display: flex; justify-content: center; align-items: center;">
                                                <img src="${formData.signature || signatureCanvas.toDataURL()}" alt="Signature" style="max-height: 35px; max-width: 100%; display: block; margin: 0 auto; background-color: transparent; mix-blend-mode: darken;">
                                            </div>
                                            <div class="col-12 p-0">
                                                <p class="p-0 m-0 text-center fw-bold" style="visibility: visible !important; display: block !important; position: relative; z-index: 10;">Signature</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3 m-0 p-0">
                                    <div class="photo-box-no-border p-1" style="position: relative; z-index: 5;">
                                        <div id="printQrCode"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col">
                                    <strong>Expires on: </strong><span class="underlined-text">${formData.expiresOn || 'Month DD, 20XX'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="footer">
                            VALID ANYWHERE IN THE PHILIPPINES
                        </div>
                    </div>
                </div>
            `;
            printContainer.appendChild(frontCardContainer);

            // Append the QR code after the HTML is injected
            const printQrCodeElement = frontCardContainer.querySelector('#printQrCode');
            if (printQrCodeElement) {
                printQrCodeElement.appendChild(qrCodeContainer);
            } else {
                console.error('Could not find #printQrCode element');
            }
        }

        // Back ID Card Container
        if (printType === 'back' || printType === 'both') {
            const backCardContainer = document.createElement('div');
            backCardContainer.className = 'print-card back-card';
            backCardContainer.style.width = '3.375in';
            backCardContainer.style.height = '2.125in';
            backCardContainer.style.overflow = 'hidden';
            backCardContainer.style.position = 'relative';
            backCardContainer.innerHTML = `
                <div class="card-container" style="transform: scale(0.34); transform-origin: top left; position: absolute; top: 0; left: 0; width: 800px;">
                    <div class="card emergency-card">
                        <div class="col-12">
                            <h2>THIS IS NON-TRANSFERABLE</h2>
                            <img src="/img/PQ_Logo.jpg" alt="City Seal Watermark" class="watermark">
                        </div>
                        <div class="row p-0 m-0">
                            <div class="col-3">
                                <label>Address:</label>
                            </div>
                            <div class="col-9 border-bottom border-dark" style="min-height: 25px;">
                                <p class="input-form-value p-0 m-0" style="font-size: ${getDirectFontSize(formData.address, 16, 40)}; line-height: 1.2;">${formData.address || 'Apt/House Number, Bldg Name, Str Name.'}</p>
                            </div>
                        </div>
                        <div class="row p-0 m-0">
                            <div class="col-3">
                            </div>
                            <div class="col-9 border-bottom border-dark mt-2" style="min-height: 25px;">
                                <p class="input-form-value p-0 m-0" style="font-size: ${getDirectFontSize(formData.address2, 16, 40)}; line-height: 1.2;">${formData.address2 || 'Brgy, City, Country, Zip Code'}</p>
                            </div>
                        </div>
                        <div class="row mt-3 p-0 m-0">
                            <div class="col-3">
                                <label>Date of Birth:</label>
                            </div>
                            <div class="col-4 border-bottom border-dark">
                                <p class="input-form-value p-0 m-0">${formData.dateOfBirth || 'Month Day, Year'}</p>
                            </div>
                            <div class="col-3">
                                <label>SEX: </label>
                            </div>
                            <div class="col-2 border-bottom border-dark">
                                <p class="input-form-value p-0 m-0">${formData.sex || 'Male'}</p>
                            </div>
                        </div>
                        
                        <div class="row mt-3 p-0 m-0">
                            <div class="col-3">
                                <label>Date Issued:</label>
                            </div>
                            <div class="col-4 border-bottom border-dark">
                                <p class="input-form-value p-0 m-0">${formData.dateIssued || 'Month Day, Year'}</p>
                            </div>
                            <div class="col-3">
                                <label>Blood Type:</label>
                            </div>
                            <div class="col-2 border-bottom border-dark">
                                <p class="input-form-value p-0 m-0">${formData.bloodType || 'O+'}</p>
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
                            <div class="col-8 border-bottom border-dark d-flex align-items-center" style="min-height: 25px;">
                                <p class="input-form-value p-0 m-0" style="font-size: ${getDirectFontSize(formData.guardian, 16, 40)}; line-height: 1.2;">${formData.guardian || 'Juan Dela Cruz Sr.'}</p>
                            </div>
                        </div>
                        
                        <div class="row p-0 m-0">
                            <div class="col-4">
                                <label>Contact Number:</label>
                            </div>
                            <div class="col-8 border-bottom border-dark">
                                <p class="input-form-value p-0 m-0">${formData.contactNumber || '0912-345-6789'}</p>
                            </div>
                        </div>
                        
                        <div class="footer-content">
                            <h3 class="helvetica shadowed">HON. ERIC L. OLIVAREZ</h3>
                            <p class="fw-bold">City Mayor</p>
                        </div>
                    </div>
                </div>
            `;
            printContainer.appendChild(backCardContainer);
        }

        printArea.appendChild(printContainer);

        // Print-specific stylesheet
        const printStyleSheet = document.createElement('style');
        printStyleSheet.id = 'id-card-print-styles';
        printStyleSheet.textContent = `
            @media print {
                /* Basic print settings */
                @page {
                    size: auto;
                    margin: 0.2in;
                }
                body {
                    margin: 0.2in;
                    padding: 0;
                }
                /* Ensure Bootstrap layout is preserved in print */
                .row {
                    display: flex !important;
                    flex-wrap: nowrap !important;
                }
                .col-md-3 {
                    width: 25% !important;
                    max-width: 25% !important;
                    flex: 0 0 25% !important;
                }
                .col-md-6 {
                    width: 50% !important;
                    max-width: 50% !important;
                    flex: 0 0 50% !important;
                }
                /* Override any print media queries that might break layout */
                .d-flex {
                    display: flex !important;
                }
                .justify-content-center {
                    justify-content: center !important;
                }
                .align-items-center {
                    align-items: center !important;
                }
                /* Make sure all labels are visible and properly positioned */
                .col-10 p, .col-12 p {
                    visibility: visible !important;
                    display: block !important;
                    position: relative !important;
                    z-index: 100 !important;
                }
                .offset-1 {
                    margin-left: 8.33% !important;
                }
                /* Ensure proper structure of rows */
                .my-2 {
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                }
                /* Fix position and display issues with labels */
                .pwd-card .col-md-6 .row {
                    margin-bottom: 10px !important;
                    flex-direction: column !important;
                    display: flex !important;
                    position: relative !important;
                }
                .pwd-card .col-md-6 {
                    display: flex !important;
                    flex-direction: column !important;
                    position: relative !important;
                    z-index: 10 !important;
                }
                .photo-box-no-border {
                    position: relative !important;
                    z-index: 5 !important;
                }
                /* Ensure proper spacing between elements */
                .pwd-card .col-md-6 {
                    display: flex !important;
                    flex-direction: column !important;
                    position: relative !important;
                    z-index: 10 !important;
                }
                /* Position QR code appropriately */
                .photo-box-no-border {
                    position: relative !important;
                    z-index: 5 !important;
                }
                /* Fix any scaling issues */
                .print-card {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    margin: 0.1in;
                }
                .front-card {
                    page-break-after: always !important;
                    break-after: always !important;
                    margin-bottom: 0.3in;
                }
                .card-container {
                    overflow: visible !important;
                }
                
                /* Add responsive font sizing to make text fit */
                .input-form-value {
                    word-wrap: break-word !important;
                    white-space: normal !important;
                }
            }
        `;
        document.head.appendChild(printStyleSheet);

        // Handle cleanup after printing
        window.addEventListener('afterprint', function() {
            const printStyles = document.getElementById('id-card-print-styles');
            if (printStyles) {
                printStyles.remove();
            }
        }, {once: true});

        // Hide loading and trigger print after a delay
        setTimeout(() => {
            printLoading.style.display = 'none';
            window.print();
        }, 500);
    }
    
    // Helper functions
    function getFormData() {
        return {
            pwdIdNo: document.getElementById('pwdIdNo').value,
            name: document.getElementById('name').value,
            disabilityType: document.getElementById('disabilityType').value,
            expiresOn: formatDate(document.getElementById('expiresOn').value),
            signature: signatureDataURL,
            photo: photoDataURL,
            address: document.getElementById('address').value,
            address2: document.getElementById('address2') ? document.getElementById('address2').value : '',
            dateOfBirth: formatDate(document.getElementById('dateOfBirth').value),
            sex: document.getElementById('sex').value,
            dateIssued: formatDate(document.getElementById('dateIssued').value),
            bloodType: document.getElementById('bloodType').value,
            guardian: document.getElementById('guardian').value,
            contactNumber: document.getElementById('contactNumber').value
        };
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
}); 