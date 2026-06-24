Add-Type -AssemblyName System.Drawing
$imgPath = "folder imagini produse mc donald's\BIG MAC BURGER VITA, CASTRAVETI MURATI, SOS 204G.png"
$img = [System.Drawing.Image]::FromFile($imgPath)
Write-Host "Dimensions: $($img.Width) x $($img.Height)"
$bmp = New-Object System.Drawing.Bitmap($img)
$midY = [int]($img.Height / 2)

Write-Host "Sample pixels along horizontal center (Y=$midY):"
for ($x = 0; $x -lt $img.Width; $x += 20) {
    $pixel = $bmp.GetPixel($x, $midY)
    Write-Host "X=$($x) -> R=$($pixel.R), G=$($pixel.G), B=$($pixel.B)"
}
$img.Dispose()
