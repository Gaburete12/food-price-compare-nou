try {
    Add-Type -AssemblyName System.Drawing
    
    # Load OCR results
    $jsonPath = "C:\Users\andre\.gemini\antigravity\scratch\food-price-compare12-main\scratch\ocr_results.json"
    if (-not (Test-Path $jsonPath)) {
        Write-Error "OCR results file not found at $jsonPath"
        return
    }
    
    # Remove BOM if present before parsing
    $jsonStr = Get-Content -Raw -Path $jsonPath
    if ($jsonStr[0] -eq 0xFEFF) {
        $jsonStr = $jsonStr.Substring(1)
    }
    $ocrData = ConvertFrom-Json $jsonStr
    
    # Ensure client public images directory exists
    $imgDir = "C:\Users\andre\.gemini\antigravity\scratch\food-price-compare12-main\client\public\burgerking"
    if (-not (Test-Path $imgDir)) {
        New-Item -ItemType Directory -Force -Path $imgDir | Out-Null
        Write-Output "Created directory: $imgDir"
    }
    
    $products = @()
    $seenNames = @{}
    
    $srcDir = "C:\Users\andre\.antigravity\Meniu Burger King Constanta"
    
    Write-Output "--- Starting Menu Extraction & Image Cropping ---"
    
    foreach ($item in $ocrData) {
        $fileName = $item.file
        $fileIndex = $item.index
        $width = $item.width
        $height = $item.height
        
        Write-Output "Processing screenshot $fileName (Index: $fileIndex)..."
        
        # Load the screenshot bitmap for cropping
        $screenBmpPath = Join-Path $srcDir $fileName
        if (-not (Test-Path $screenBmpPath)) {
            Write-Host "Warning: Screenshot not found at $screenBmpPath" -ForegroundColor Yellow
            continue
        }
        
        $bmp = [System.Drawing.Bitmap]::FromFile($screenBmpPath)
        
        # Parse lines
        $lines = @()
        foreach ($line in $item.lines) {
            $minX = 9999; $maxX = -9999; $minY = 9999; $maxY = -9999
            foreach ($w in $line.words) {
                if ($w.x -lt $minX) { $minX = $w.x }
                if (($w.x + $w.w) -gt $maxX) { $maxX = $w.x + $w.w }
                if ($w.y -lt $minY) { $minY = $w.y }
                if (($w.y + $w.h) -gt $maxY) { $maxY = $w.y + $w.h }
            }
            $centerY = ($minY + $maxY) / 2
            
            $lines += [PSCustomObject]@{
                text = $line.text
                minX = $minX
                maxX = $maxX
                minY = $minY
                maxY = $maxY
                centerY = $centerY
            }
        }
        
        # Sort lines by vertical center
        $lines = $lines | Sort-Object centerY
        
        # 1. Identify all price lines in the screenshot
        # Prices are on the right side of the main content column.
        # They contain numbers and optionally "RON", "lei"
        $priceLines = $lines | Where-Object {
            $_.minX -gt 600 -and $_.minX -lt 1100 -and 
            ($_.text -match '\d+,\d+' -or $_.text -match 'RON' -or $_.text -match 'lei')
        }
        
        # 2. Map prices to their respective products
        foreach ($pl in $priceLines) {
            $priceY = $pl.centerY
            
            # Detect layout column base:
            # Layout A (with category sidebar): Price is around X=1000, Name is around X=407
            # Layout B (collapsed sidebar): Price is around X=740, Name is around X=162
            $isLayoutA = $pl.minX -gt 850
            
            $nameMinX = if ($isLayoutA) { 300 } else { 80 }
            $nameMaxX = if ($isLayoutA) { 480 } else { 220 }
            $imgX = if ($isLayoutA) { 279 } else { 34 }
            
            # Find product name line close to the price Y
            $nameLine = $lines | Where-Object {
                $_.minX -ge $nameMinX -and $_.minX -le $nameMaxX -and 
                [Math]::Abs($_.centerY - $priceY) -lt 25
            } | Select-Object -First 1
            
            if (-not $nameLine) {
                continue
            }
            
            $rawName = $nameLine.text
            
            # Skip invalid lines that are shopping cart or layout helpers
            $cleanNameLower = $rawName.ToLower().Trim()
            $badNames = @("comanda ta", "informatii", "cos", "total", "adaugă", "taxe", "cele mai vandute", "promotii", "meniuri", "burgeri", "wraps", "salate", "garnituri", "deserturi", "băuturi", "bauturi", "sauce", "sosuri")
            $isBad = $false
            foreach ($bn in $badNames) {
                if ($cleanNameLower -contains $bn -or $bn -contains $cleanNameLower) {
                    $isBad = $true
                    break
                }
            }
            if ($isBad) { continue }
            
            # Find description lines: same column, Y between nameY + 10 and nameY + 130
            # Ensure description lines do not overlap with another price's Y
            $descLines = $lines | Where-Object {
                $_.minX -ge $nameMinX -and $_.minX -le $nameMaxX -and 
                $_.centerY -gt ($nameLine.centerY + 10) -and 
                $_.centerY -lt ($nameLine.centerY + 135)
            }
            
            $rawDesc = ($descLines | ForEach-Object { $_.text }) -join " "
            
            # Format price: extract the first matching decimal
            $priceVal = 0.0
            if ($pl.text -match '(\d+),(\d+)') {
                $priceVal = [double]("$($Matches[1]).$($Matches[2])")
            }
            
            # De-duplicate products by raw name
            if ($seenNames.ContainsKey($rawName)) {
                # Keep the first one, or if it had no description and this one does, update it
                $existing = $seenNames[$rawName]
                if ([string]::IsNullOrWhiteSpace($existing.rawDescription) -and -not [string]::IsNullOrWhiteSpace($rawDesc)) {
                    $existing.rawDescription = $rawDesc
                }
                continue
            }
            
            # Clean and normalize texts
            # Generate clean ID
            $normalizedName = $rawName.ToLower() -replace '[^a-z0-9]', '-' -replace '-+', '-' -replace '^-|-$', ''
            $productId = "bk-$normalizedName"
            
            # Crop the product image from the screenshot
            # Coordinates: X=$imgX, Y=centerY - 8 (centered on card). Size: 110x110
            $cropY = [int]($nameLine.centerY - 8)
            if ($cropY -lt 0) { $cropY = 0 }
            if (($cropY + 110) -gt $height) { $cropY = $height - 110 }
            
            $cropRect = [System.Drawing.Rectangle]::new($imgX, $cropY, 110, 110)
            
            $croppedImg = $null
            try {
                $croppedImg = $bmp.Clone($cropRect, $bmp.PixelFormat)
                $imgOutName = "$productId.png"
                $imgOutPath = Join-Path $imgDir $imgOutName
                $croppedImg.Save($imgOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
                $imageUrl = "/burgerking/$imgOutName"
            } catch {
                Write-Host "Warning: Failed to crop image for $($rawName) - $_" -ForegroundColor Yellow
                $imageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" # Fallback
            } finally {
                if ($null -ne $croppedImg) { $croppedImg.Dispose() }
            }
            
            $prodObj = [PSCustomObject]@{
                id = $productId
                rawName = $rawName
                rawDescription = $rawDesc
                price = $priceVal
                imageUrl = $imageUrl
                screenshot = $fileName
            }
            
            $products += $prodObj
            $seenNames[$rawName] = $prodObj
        }
        
        $bmp.Dispose()
    }
    
    # Save the parsed products to a temporary JSON file
    $outPath = "C:\Users\andre\.gemini\antigravity\scratch\food-price-compare12-main\scratch\extracted_products.json"
    $jsonOut = ConvertTo-Json $products -Depth 5
    Set-Content -Path $outPath -Value $jsonOut -Encoding Utf8
    
    Write-Output "--- Menu Extraction Completed! ---"
    Write-Output "Extracted $($products.Count) unique products!"
    Write-Output "Saved to $outPath"
} catch {
    Write-Error "Error: $_"
}
