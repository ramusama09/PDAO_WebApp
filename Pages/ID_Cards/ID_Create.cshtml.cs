using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace PDAO_WebApp.Pages.ID_Cards
{
    public class ID_CreateModel : PageModel
    {
        private readonly IWebHostEnvironment _environment;

        public ID_CreateModel(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        [TempData]
        public string StatusMessage { get; set; }

        [BindProperty]
        public CardInfoModel CardInfo { get; set; }

        public IFormFile PhotoFile { get; set; }
        public IFormFile SignatureFile { get; set; }

        public void OnGet()
        {
            // The page is primarily handled by client-side JavaScript
            // This method is kept for potential future server-side operations
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            try
            {
                // Process photo file if provided
                if (PhotoFile != null)
                {
                    var photoFileName = $"pwd_photo_{CardInfo.PwdIdNo}_{DateTime.Now.Ticks}{Path.GetExtension(PhotoFile.FileName)}";
                    var photoFilePath = Path.Combine(_environment.WebRootPath, "uploads", photoFileName);
                    
                    // Ensure directory exists
                    Directory.CreateDirectory(Path.Combine(_environment.WebRootPath, "uploads"));
                    
                    using (var fileStream = new FileStream(photoFilePath, FileMode.Create))
                    {
                        await PhotoFile.CopyToAsync(fileStream);
                    }
                    
                    CardInfo.PhotoFile = $"/uploads/{photoFileName}";
                }
                
                // Process signature file if provided
                if (SignatureFile != null)
                {
                    var signatureFileName = $"pwd_signature_{CardInfo.PwdIdNo}_{DateTime.Now.Ticks}{Path.GetExtension(SignatureFile.FileName)}";
                    var signatureFilePath = Path.Combine(_environment.WebRootPath, "uploads", signatureFileName);
                    
                    // Ensure directory exists
                    Directory.CreateDirectory(Path.Combine(_environment.WebRootPath, "uploads"));
                    
                    using (var fileStream = new FileStream(signatureFilePath, FileMode.Create))
                    {
                        await SignatureFile.CopyToAsync(fileStream);
                    }
                    
                    CardInfo.SignatureFile = $"/uploads/{signatureFileName}";
                }

                // Here you would process the ID card generation
                // Save data to database, etc.

                StatusMessage = "ID Card has been successfully generated!";
                
                // In the future, could redirect to a "Success" page or a download page for the ID
                return Page();
            }
            catch (Exception ex)
            {
                StatusMessage = $"Error: {ex.Message}";
                return Page();
            }
        }

        public class CardInfoModel
        {
            [Required]
            [Display(Name = "PWD ID No.")]
            public string PwdIdNo { get; set; }

            [Required]
            [Display(Name = "First Name")]
            public string FirstName { get; set; }

            [Display(Name = "Middle Name")]
            public string MiddleName { get; set; }

            [Required]
            [Display(Name = "Last Name")]
            public string LastName { get; set; }

            [Display(Name = "Suffix")]
            public string Suffix { get; set; }

            [Required]
            [Display(Name = "Type of Disability")]
            public string DisabilityType { get; set; }

            [Required]
            [Display(Name = "Expiration Date")]
            [DataType(DataType.Date)]
            public DateTime ExpirationDate { get; set; }

            [Required]
            [Display(Name = "Address Line 1")]
            public string AddressLine1 { get; set; }

            [Required]
            [Display(Name = "Address Line 2")]
            public string AddressLine2 { get; set; }

            [Required]
            [Display(Name = "Date of Birth")]
            [DataType(DataType.Date)]
            public DateTime DateOfBirth { get; set; }

            [Required]
            [Display(Name = "Date Issued")]
            [DataType(DataType.Date)]
            public DateTime DateIssued { get; set; }

            [Required]
            [Display(Name = "Sex")]
            public string Sex { get; set; }

            [Required]
            [Display(Name = "Blood Type")]
            public string BloodType { get; set; }

            [Required]
            [Display(Name = "Emergency Contact Name")]
            public string EmergencyContactName { get; set; }

            [Required]
            [Display(Name = "Emergency Contact No.")]
            public string EmergencyContactNo { get; set; }

            [Display(Name = "Signature File")]
            public string SignatureFile { get; set; }

            [Display(Name = "Photo File")]
            public string PhotoFile { get; set; }

            public string FullName
            {
                get
                {
                    string middleInitial = !string.IsNullOrEmpty(MiddleName) ? $"{MiddleName[0]}. " : "";
                    string suffixText = !string.IsNullOrEmpty(Suffix) ? $", {Suffix}" : "";
                    return $"{FirstName} {middleInitial}{LastName}{suffixText}";
                }
            }
        }
    }
} 