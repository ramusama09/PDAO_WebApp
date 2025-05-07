using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace PDAO_WebApp.Pages.ID_Cards
{
    public class ID_IndexModel : PageModel
    {
        [TempData]
        public string StatusMessage { get; set; }

        public void OnGet()
        {
            // The page is primarily handled by client-side JavaScript
            // This method is kept for potential future server-side operations
        }
    }
} 