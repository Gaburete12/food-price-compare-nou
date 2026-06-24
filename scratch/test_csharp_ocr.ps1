try {
    $csharpCode = @"
using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Media.Ocr;
using Windows.Graphics.Imaging;
using Windows.Storage.Streams;

public class OcrHelper {
    public static string GetOcrText(string imagePath) {
        return GetOcrTextAsync(imagePath).GetAwaiter().GetResult();
    }
    
    private static async Task<string> GetOcrTextAsync(string imagePath) {
        byte[] bytes = File.ReadAllBytes(imagePath);
        var stream = new InMemoryRandomAccessStream();
        using (var writer = new DataWriter(stream)) {
            writer.WriteBytes(bytes);
            await writer.StoreAsync();
            await writer.FlushAsync();
        }
        stream.Seek(0);
        
        var decoder = await BitmapDecoder.CreateAsync(stream);
        var softwareBitmap = await decoder.GetSoftwareBitmapAsync();
        
        var engine = OcrEngine.TryCreateFromUserProfileLanguages();
        if (engine == null) {
            engine = OcrEngine.TryCreateFromLanguage(new Windows.Globalization.Language("en-US"));
        }
        
        var result = await engine.RecognizeAsync(softwareBitmap);
        return result.Text;
    }
}
"@

    Write-Output "Compiling C# OcrHelper..."
    Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies (
        "System.Runtime.WindowsRuntime",
        "C:\Windows\System32\WinMetadata\Windows.Foundation.winmd",
        "C:\Windows\System32\WinMetadata\Windows.Media.winmd",
        "C:\Windows\System32\WinMetadata\Windows.Graphics.winmd",
        "C:\Windows\System32\WinMetadata\Windows.Storage.winmd"
    )
    
    Write-Output "C# OcrHelper compiled successfully!"
    
    $imgPath = "C:\Users\andre\.antigravity\Meniu Burger King Constanta\1.png"
    Write-Output "Performing OCR on $imgPath..."
    $text = [OcrHelper]::GetOcrText($imgPath)
    
    Write-Output "--- OCR RESULT ---"
    Write-Output $text
    Write-Output "------------------"
} catch {
    Write-Error "Error: $_"
}
