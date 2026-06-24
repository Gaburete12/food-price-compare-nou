Add-Type -AssemblyName System.Drawing
$imgPath = "folder imagini produse mc donald's\BIG MAC BURGER VITA, CASTRAVETI MURATI, SOS 204G.png"
$outputPath = "scratch\BIG_MAC_TEST_CROPPED.png"

$img = [System.Drawing.Image]::FromFile($imgPath)
$bmp = New-Object System.Drawing.Bitmap($img)
$width = $img.Width
$height = $img.Height

$minX = $width
$maxX = 0
$minY = $height
$maxY = 0
$whiteThreshold = 250

# Find content bounds
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

if ($maxX -lt $minX -or $maxY -lt $minY) {
    Write-Host "No non-white content found!"
    $img.Dispose()
    exit
}

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1

# Calculate square size with padding
$padding = 40
$maxDim = [Math]::Max($w, $h)
$squareSize = $maxDim + $padding

# Create new square canvas
$newBmp = New-Object System.Drawing.Bitmap($squareSize, $squareSize)
$g = [System.Drawing.Graphics]::FromImage($newBmp)

# Fill with white background
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.FillRectangle($brush, 0, 0, $squareSize, $squareSize)

# Enable high-quality resizing
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Destination rectangle (centered)
$destX = [int](($squareSize - $w) / 2)
$destY = [int](($squareSize - $h) / 2)
$destRect = New-Object System.Drawing.Rectangle($destX, $destY, $w, $h)

# Source rectangle from original image
$srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)

# Draw image
$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Save output
$newBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Clean up
$g.Dispose()
$brush.Dispose()
$newBmp.Dispose()
$bmp.Dispose()
$img.Dispose()

Write-Host "Successfully cropped test image!"
Write-Host "Original dimensions: $width x $height"
Write-Host "New square dimensions: $squareSize x $squareSize"
Write-Host "Cropped image saved to: $outputPath"
