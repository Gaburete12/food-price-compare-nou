Add-Type -AssemblyName System.Drawing

$sourceDir = "folder imagini produse mc donald's"
$files = Get-ChildItem -Path $sourceDir -Filter *.png

Write-Host "--- Start automatic cropping of all $($files.Count) images ---" -ForegroundColor Cyan

$count = 0
$whiteThreshold = 250
$padding = 40

foreach ($file in $files) {
    $count++
    $filePath = $file.FullName
    Write-Host "[$count/$($files.Count)] Cropping: $($file.Name)..." -NoNewline
    
    try {
        $img = [System.Drawing.Image]::FromFile($filePath)
        $bmp = New-Object System.Drawing.Bitmap($img)
        $width = $img.Width
        $height = $img.Height
        
        $minX = $width
        $maxX = 0
        $minY = $height
        $maxY = 0
        
        # Scan pixels for bounding box
        for ($y = 0; $y -lt $height; $y++) {
            for ($x = 0; $x -lt $width; $x++) {
                $pixel = $bmp.GetPixel($x, $y)
                if ($pixel.R -lt $whiteThreshold -or $pixel.G -lt $whiteThreshold -or $pixel.B -lt $whiteThreshold) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($y -gt $maxY) { $maxY = $y }
                }
            }
        }
        
        # If no non-white content is found, skip cropping
        if ($maxX -lt $minX -or $maxY -lt $minY) {
            Write-Host " [Skipped - no content found]" -ForegroundColor Yellow
            $bmp.Dispose()
            $img.Dispose()
            continue
        }
        
        $w = $maxX - $minX + 1
        $h = $maxY - $minY + 1
        
        $maxDim = [Math]::Max($w, $h)
        $squareSize = $maxDim + $padding
        
        # Create new square canvas
        $newBmp = New-Object System.Drawing.Bitmap($squareSize, $squareSize)
        $g = [System.Drawing.Graphics]::FromImage($newBmp)
        
        # Fill with solid white background
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $g.FillRectangle($brush, 0, 0, $squareSize, $squareSize)
        
        # Set high quality parameters
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        
        # Center the cropped content
        $destX = [int](($squareSize - $w) / 2)
        $destY = [int](($squareSize - $h) / 2)
        $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $w, $h)
        $srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)
        
        $g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        
        # We must dispose of $bmp and $img before saving to the same file path to release the lock!
        $bmp.Dispose()
        $img.Dispose()
        
        # Save to a temporary file first, then overwrite
        $tempPath = "$filePath.tmp"
        $newBmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $g.Dispose()
        $brush.Dispose()
        $newBmp.Dispose()
        
        # Overwrite original
        Remove-Item $filePath -Force
        Rename-Item $tempPath $file.Name -Force
        
        Write-Host " [Done: $($width)x$($height) -> $($squareSize)x$($squareSize)]" -ForegroundColor Green
    } catch {
        Write-Host " [Error: $_]" -ForegroundColor Red
        # Make sure resources are disposed in case of error
        if ($bmp) { $bmp.Dispose() }
        if ($img) { $img.Dispose() }
        if ($newBmp) { $newBmp.Dispose() }
        if ($g) { $g.Dispose() }
        if ($brush) { $brush.Dispose() }
    }
}

Write-Host "--- All images successfully cropped! ---" -ForegroundColor Green
