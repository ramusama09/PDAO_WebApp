document.addEventListener('DOMContentLoaded', function() {
    // Initialize dates
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('dateIssued').value = today;
    
    // Default expiration date (3 years from today)
    var expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 3);
    document.getElementById('expirationDate').value = expDate.toISOString().split('T')[0];
    
    // Create variables to store canvas data URLs
    var frontCardDataURL = null;
    var backCardDataURL = null;
    
    // Preview button click handler
    document.getElementById('previewBtn').addEventListener('click', function() {
        // Update preview with form values
        updatePreview();
        
        // Show the modal
        var previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        previewModal.show();
    });
    
    // Generate and download button click handler
    document.getElementById('generateAndDownloadBtn').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!document.getElementById('idCardForm').checkValidity()) {
            // Trigger form validation
            document.getElementById('idCardForm').reportValidity();
            return;
        }
        
        // Update preview with form values
        updatePreview();
        
        // Generate file name
        var lastName = document.getElementById('lastName').value || 'Lastname';
        var firstName = document.getElementById('firstName').value || 'Firstname';
        var fileNamePrefix = lastName + firstName;
        
        // Show the modal first (we need the elements to be visible for html2canvas)
        var previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        previewModal.show();
        
        // Wait for modal to be fully visible
        setTimeout(function() {
            // Capture front ID
            var frontTab = document.getElementById('front-tab');
            var backTab = document.getElementById('back-tab');
            
            // Make sure front tab is active
            frontTab.click();
            
            // Wait for tab to be visible
            setTimeout(function() {
                // Capture front ID card
                captureSide('front-tab-pane', fileNamePrefix + '_Front_ID.png', function(dataURL) {
                    // Save front card data URL
                    frontCardDataURL = dataURL;
                    
                    // Now switch to back tab
                    backTab.click();
                    
                    // Wait for back tab to be visible
                    setTimeout(function() {
                        // Capture back ID card
                        captureSide('back-tab-pane', fileNamePrefix + '_Back_ID.png', function(dataURL) {
                            // Save back card data URL
                            backCardDataURL = dataURL;
                            
                            // Submit the form after downloads
                            document.getElementById('idCardForm').submit();
                        });
                    }, 300);
                });
            }, 300);
        }, 500);
    });
    
    function captureSide(elementId, fileName, callback) {
        var element = document.getElementById(elementId);
        var cardElement = element.querySelector('.card');
        
        html2canvas(cardElement, {
            scale: 3, // Increase quality
            backgroundColor: null,
            logging: false,
            useCORS: true,
            width: 800, // Higher resolution for better quality
            height: 800 * (2.125/3.375) // Maintain ID card aspect ratio of 3.375:2.125
        }).then(function(canvas) {
            // Convert to data URL and download
            var dataURL = canvas.toDataURL('image/png');
            var link = document.createElement('a');
            link.download = fileName;
            link.href = dataURL;
            link.click();
            
            if (callback) {
                callback(dataURL);
            }
        });
    }
    
    // Print button click handler
    document.getElementById('printIdBtn').addEventListener('click', function() {
        // Capture both sides of the ID
        console.log("Print button clicked, capturing ID cards");
        
        // Show the modal first (we need the elements to be visible for html2canvas)
        var previewModal = document.getElementById('previewModal');
        if (!previewModal.classList.contains('show')) {
            var bsModal = new bootstrap.Modal(previewModal);
            bsModal.show();
        }
        
        // Make sure front tab is active
        var frontTab = document.getElementById('front-tab');
        frontTab.click();
        
        // Wait for tab to be visible
        setTimeout(function() {
            // Capture front ID
            var frontElement = document.querySelector('#front-tab-pane .card');
            html2canvas(frontElement, {
                scale: 3,
                backgroundColor: null,
                useCORS: true,
                width: 800, // Higher resolution for better quality
                height: 800 * (2.125/3.375) // Maintain ID card aspect ratio of 3.375:2.125
            }).then(function(frontCanvas) {
                var frontDataURL = frontCanvas.toDataURL('image/png');
                
                // Now capture back ID
                var backTab = document.getElementById('back-tab');
                backTab.click();
                
                // Wait for back tab to be visible
                setTimeout(function() {
                    var backElement = document.querySelector('#back-tab-pane .card');
                    html2canvas(backElement, {
                        scale: 3,
                        backgroundColor: null,
                        useCORS: true,
                        width: 800, // Higher resolution for better quality
                        height: 800 * (2.125/3.375) // Maintain ID card aspect ratio of 3.375:2.125
                    }).then(function(backCanvas) {
                        var backDataURL = backCanvas.toDataURL('image/png');
                        
                        // Create printable HTML
                        var printWindow = window.open('', 'PRINT', 'height=800,width=1200');
                        
                        printWindow.document.write('<html><head><title>PWD ID Card</title>');
                        printWindow.document.write('<style>');
                        printWindow.document.write('@media print {');
                        printWindow.document.write('  @page { size: portrait; margin: 0.5cm; }');
                        printWindow.document.write('  body { margin: 0; padding: 0; }');
                        printWindow.document.write('  .print-container { display: flex; flex-direction: row; justify-content: center; padding-top: 1cm; flex-wrap: wrap; }');
                        printWindow.document.write('  .print-card { width: 3.375in; height: 2.125in; object-fit: contain; }');
                        printWindow.document.write('}');
                        printWindow.document.write('body { margin: 0; padding: 0; background-color: white; }');
                        printWindow.document.write('.print-container { display: flex; flex-direction: row; justify-content: center; padding-top: 1cm; flex-wrap: wrap; }');
                        printWindow.document.write('.print-card { width: 3.375in; height: 2.125in; object-fit: contain; }');
                        printWindow.document.write('</style>');
                        printWindow.document.write('</head><body>');
                        printWindow.document.write('<div class="print-container">');
                        printWindow.document.write('<img src="' + frontDataURL + '" class="print-card">');
                        printWindow.document.write('<img src="' + backDataURL + '" class="print-card">');
                        printWindow.document.write('</div>');
                        printWindow.document.write('</body></html>');
                        
                        printWindow.document.close();
                        printWindow.focus();
                        
                        // Use a slight delay to ensure the content is loaded
                        setTimeout(function() {
                            printWindow.print();
                            printWindow.close();
                        }, 500);
                    });
                }, 300);
            });
        }, 300);
    });
    
    // Photo upload preview
    document.getElementById('photoFile').addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            var reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('preview-photo').src = event.target.result;
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Signature upload preview
    document.getElementById('signatureFile').addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            var reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('preview-signature').innerHTML = '';
                var img = document.createElement('img');
                img.src = event.target.result;
                img.style.maxHeight = '30px';
                document.getElementById('preview-signature').appendChild(img);
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Function to update preview with form values
    function updatePreview() {
        // Reset the canvas data URLs when updating the preview
        frontCardDataURL = null;
        backCardDataURL = null;
        
        // Front ID
        document.getElementById('preview-pwdid').textContent = document.getElementById('pwdIdNo').value || '0000-0000-0000-0000';
        
        // Full name
        var firstName = document.getElementById('firstName').value || '';
        var middleName = document.getElementById('middleName').value || '';
        var lastName = document.getElementById('lastName').value || '';
        var suffix = document.getElementById('suffix').value || '';
        
        // Format name
        var middleInitial = middleName ? middleName.charAt(0) + '. ' : '';
        var fullName = firstName + ' ' + middleInitial + lastName + (suffix ? ', ' + suffix : '');
        document.getElementById('preview-fullname').textContent = fullName || 'Juan Dela Cruz';
        
        // Disability
        var disability = document.getElementById('disabilityType');
        document.getElementById('preview-disability').textContent = 
            disability.options[disability.selectedIndex].value || 'Insert Disability';
        
        // Expiry
        var expiryDate = document.getElementById('expirationDate').value;
        if (expiryDate) {
            var date = new Date(expiryDate);
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('preview-expiry').textContent = date.toLocaleDateString('en-US', options);
        }
        
        // Back ID
        document.getElementById('preview-address1').textContent = 
            document.getElementById('addressLine1').value || 'Apt/House Number, Bldg Name, Str Name.';
        document.getElementById('preview-address2').textContent = 
            document.getElementById('addressLine2').value || 'Brgy, City, Country, Zip Code';
        
        // Date of birth
        var dobDate = document.getElementById('birthDate').value;
        if (dobDate) {
            var date = new Date(dobDate);
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('preview-dob').textContent = date.toLocaleDateString('en-US', options);
        }
        
        // Date issued
        var issuedDate = document.getElementById('dateIssued').value;
        if (issuedDate) {
            var date = new Date(issuedDate);
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('preview-dateissued').textContent = date.toLocaleDateString('en-US', options);
        }
        
        // Sex
        var sex = document.getElementById('sex');
        document.getElementById('preview-sex').textContent = 
            sex.options[sex.selectedIndex].value || 'Male';
        
        // Blood type
        var bloodType = document.getElementById('bloodType');
        document.getElementById('preview-bloodtype').textContent = 
            bloodType.options[bloodType.selectedIndex].value || 'X+-';
        
        // Emergency contact
        document.getElementById('preview-emergency-name').textContent = 
            document.getElementById('emergencyContactName').value || 'Juan Dela Cruz Sr.';
        document.getElementById('preview-emergency-contact').textContent = 
            document.getElementById('emergencyContactNo').value || '0912-345-6789';
    }
}); 