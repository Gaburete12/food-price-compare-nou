# High Performance Image Bounding Box and Crop script using compiled inline C#
$sourceDef = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class ImageProcessor {
    public static int[] FindBounds(string filePath, int threshold) {
        using (Bitmap bmp = new Bitmap(filePath)) {
            int width = bmp.Width;
            int height = bmp.Height;
            int minX = width;
            int maxX = 0;
            int minY = height;
            int maxY = 0;

            // Lock the bitmap's bits.  
            BitmapData bmpData = bmp.LockBits(
                new Rectangle(0, 0, width, height),
                ImageLockMode.ReadOnly,
                PixelFormat.Format32bppArgb
            );

            // Get the address of the first line.
            IntPtr ptr = bmpData.Scan0;

            // Declare an array to hold the bytes of the bitmap.
            int bytes = Math.Abs(bmpData.Stride) * height;
            byte[] rgbValues = new byte[bytes];

            // Copy the RGB values into the array.
            Marshal.Copy(ptr, rgbValues, 0, bytes);

            // Unlock the bits.
            bmp.UnlockBits(bmpData);

            int stride = bmpData.Stride;
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int idx = y * stride + x * 4;
                    byte b = rgbValues[idx];
                    byte g = rgbValues[idx + 1];
                    byte r = rgbValues[idx + 2];
                    
                    // If the pixel is not white
                    if (r < threshold || g < threshold || b < threshold) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (maxX < minX || maxY < minY) {
                return new int[] { 0, 0, 0, 0 };
            }
            return new int[] { minX, maxX, minY, maxY };
        }
    }
}
"@

# Compile the C# class inline
Add-Type -TypeDefinition $sourceDef -ReferencedAssemblies "System.Drawing"

$sourceDir = "folder imagini produse mc donald's"
$files = Get-ChildItem -Path $sourceDir -Filter *.png

Write-Host "--- Start HIGH-PERFORMANCE cropping of all $($files.Count) images ---" -ForegroundColor Cyan

$count = 0
$whiteThreshold = 250
$padding = 40

foreach ($file in $files) {
    $count++
    $filePath = $file.FullName
    Write-Host "[$count/$($files.Count)] Processing: $($file.Name)..." -NoNewline
    
    try {
        # Call the high-speed C# method to get bounds instantly
        $bounds = [ImageProcessor]::FindBounds($filePath, $whiteThreshold)
        $minX = $bounds[0]
        $maxX = $bounds[1]
        $minY = $bounds[2]
        $maxY = $bounds[3]
        
        if ($minX -eq 0 -and $maxX -eq 0 -and $minY -eq 0 -and $maxY -eq 0) {
            Write-Host " [Skipped - no content]" -ForegroundColor Yellow
            continue
        }
        
        $img = [System.Drawing.Image]::FromFile($filePath)
        $w = $maxX - $minX + 1
        $h = $maxY - $minY + 1
        
        $maxDim = [Math]::Max($w, $h)
        $squareSize = $maxDim + $padding
        
        # Create new square canvas
        $newBmp = New-Object System.Drawing.Bitmap($squareSize, $squareSize)
        $g = [System.Drawing.Graphics]::FromImage($newBmp)
        
        # Fill background with solid white
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $g.FillRectangle($brush, 0, 0, $squareSize, $squareSize)
        
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        
        $destX = [int](($squareSize - $w) / 2)
        $destY = [int](($squareSize - $h) / 2)
        $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $w, $h)
        $srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)
        
        $g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        
        # Dispose the original image to release file lock
        $img.Dispose()
        
        # Save temporary
        $tempPath = "$filePath.tmp"
        $newBmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Clean up drawing resources
        $g.Dispose()
        $brush.Dispose()
        $newBmp.Dispose()
        
        # Overwrite original
        Remove-Item $filePath -Force
        Rename-Item $tempPath $file.Name -Force
        
        Write-Host " [Done: $($w)x$($h) -> $($squareSize)x$($squareSize)]" -ForegroundColor Green
    } catch {
        Write-Host " [Error: $_]" -ForegroundColor Red
    }
}

Write-Host "--- All images successfully cropped at blazing speed! ---" -ForegroundColor Green
