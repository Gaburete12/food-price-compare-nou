Add-Type -AssemblyName System.Drawing
$imgPath = "folder imagini produse mc donald's\BIG MAC BURGER VITA, CASTRAVETI MURATI, SOS 204G.png"
$img = [System.Drawing.Image]::FromFile($imgPath)
$bmp = New-Object System.Drawing.Bitmap($img)
$width = $img.Width
$height = $img.Height

$minX = $width
$maxX = 0
$minY = $height
$maxY = 0

$whiteThreshold = 250

# Scan all pixels to find the bounding box of non-white content
for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        # Check if the pixel is NOT white
        if ($pixel.R -lt $whiteThreshold -or $pixel.G -lt $whiteThreshold -or $pixel.B -lt $whiteThreshold) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$img.Dispose()

Write-Host "Image dimensions: $width x $height"
if ($maxX -ge $minX -and $maxY -ge $minY) {
    Write-Host "Content bounding box:"
    Write-Host "Left (minX): $minX"
    Write-Host "Right (maxX): $maxX"
    Write-Host "Top (minY): $minY"
    Write-Host "Bottom (maxY): $maxY"
    $contentWidth = $maxX - $minX + 1
    $contentHeight = $maxY - $minY + 1
    Write-Host "Content size: $contentWidth x $contentHeight"
} else {
    Write-Host "No non-white content found!"
}
