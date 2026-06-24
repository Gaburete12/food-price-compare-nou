# Powershell script to slugify image filenames, rename them, and generate mapping
$imagesDir = "client\public\mcdonalds"
$outputFile = "scratch\mapping_results.txt"

# 1. Define diacritics using unicode values to avoid parser encoding errors
$diacriticsMap = @{
    [char]0x0103 = "a" # ă
    [char]0x0102 = "a" # Ă
    [char]0x00E2 = "a" # â
    [char]0x00C2 = "a" # Â
    [char]0x00EE = "i" # î
    [char]0x00CE = "i" # Î
    [char]0x0219 = "s" # ș
    [char]0x0218 = "s" # Ș
    [char]0x015F = "s" # ş (cedilla)
    [char]0x015E = "s" # Ş (cedilla)
    [char]0x021B = "t" # ț
    [char]0x021A = "t" # Ț
    [char]0x0163 = "t" # ţ (cedilla)
    [char]0x0162 = "t" # Ţ (cedilla)
}

function Remove-Diacritics {
    param([string]$text)
    $text = $text.ToLower()
    foreach ($char in $diacriticsMap.Keys) {
        $repl = $diacriticsMap[$char]
        $text = $text.Replace($char, $repl)
    }
    # Remove TM and Registered symbols using code points
    $tmChar = [char]0x2122
    $regChar = [char]0x00AE
    $text = $text.Replace([string]$tmChar, "")
    $text = $text.Replace([string]$regChar, "")
    return $text
}

function Get-Slug {
    param([string]$name)
    
    # Remove .png extension first if present
    $name = $name -replace "\.png$", ""
    
    # Remove diacritics
    $name = Remove-Diacritics -text $name
    
    # Keep only letters, numbers, spaces, and hyphens
    $name = $name -replace "[^a-z0-9\s\-]", ""
    
    # Replace spaces with hyphens
    $name = $name -replace "\s+", "-"
    
    # Trim hyphens
    $name = $name.Trim("-")
    
    return "$name.png"
}

# 2. Function to clean product names for matching
function Clean-Name {
    param([string]$name)
    $name = Remove-Diacritics -text $name
    $name = $name -replace "[^a-z0-9\s\-]", " "
    $name = $name -replace "\s+", " "
    return $name.Trim()
}

Write-Host "Incepem redenumirea fisierelor si generarea maparii..." -ForegroundColor Cyan

$files = Get-ChildItem -Path $imagesDir -Filter *.png
$mappings = @{}
$slugsCreated = @()

foreach ($file in $files) {
    $originalName = $file.BaseName
    $slugName = Get-Slug -name $originalName
    
    $sourcePath = $file.FullName
    $destPath = Join-Path $file.DirectoryName $slugName
    
    if ($sourcePath -ne $destPath) {
        if (Test-Path $destPath) {
            Remove-Item $destPath -Force
        }
        Rename-Item -Path $sourcePath -NewName $slugName -Force
    }
    
    # Store mapping: clean name -> web path
    $cleanKey = Clean-Name -name $originalName
    $mappings[$cleanKey] = "/mcdonalds/$slugName"
    $slugsCreated += [PSCustomObject]@{
        Original = $originalName
        CleanKey = $cleanKey
        Slug = $slugName
        WebPath = "/mcdonalds/$slugName"
    }
}

Write-Host "Redenumit cu succes $($files.Count) de imagini." -ForegroundColor Green

# 3. Read McDonald's products from data/restaurant-menus.json
$menusPath = "data\restaurant-menus.json"
$menusJson = Get-Content $menusPath -Raw | ConvertFrom-Json
$mcItems = $menusJson.menus."mcdonalds-constanta"

Write-Host "Am gasit $($mcItems.Count) produse McDonald's in baza de date." -ForegroundColor Cyan

# 4. Perform matching
$matchedResults = @()
$unmatchedCount = 0

foreach ($item in $mcItems) {
    $itemClean = Clean-Name -name $item.name
    $itemWords = $itemClean -split "\s+"
    
    $bestMatchKey = $null
    $bestScore = 0
    
    foreach ($key in $mappings.Keys) {
        $keyWords = $key -split "\s+"
        
        # Calculate overlap
        $overlap = 0
        foreach ($word in $keyWords) {
            if ($word.Length -gt 1 -and $itemClean.Contains($word)) {
                $overlap++
            }
        }
        
        # Bonus for exact starts-with or ends-with or exact matches
        if ($itemClean -eq $key) {
            $overlap += 10
        }
        
        # Match "big mac" exactly
        if ($itemClean.Contains("big mac") -and $key.Contains("big mac")) {
            $overlap += 5
        }
        # Match "big tasty" exactly
        if ($itemClean.Contains("big tasty") -and $key.Contains("big tasty")) {
            $overlap += 5
        }
        # Match nuggets exactly
        if ($itemClean.Contains("nuggets") -and $key.Contains("nuggets")) {
            $overlap += 3
        }
        # Prevent matching menus to single items unless there's no menu image
        if ($itemClean.Contains("meniu") -and -not $key.Contains("meniu")) {
            $overlap = $overlap - 2 # penalize non-menu images for menu items
        }
        if (-not $itemClean.Contains("meniu") -and $key.Contains("meniu")) {
            $overlap = $overlap - 5 # strongly penalize menu images for single items
        }
        
        if ($overlap -gt $bestScore) {
            $bestScore = $overlap
            $bestMatchKey = $key
        }
    }
    
    if ($bestScore -gt 0) {
        $webPath = $mappings[$bestMatchKey]
        $matchedResults += [PSCustomObject]@{
            ProductName = $item.name
            CleanName = $itemClean
            MatchedImage = $bestMatchKey
            WebPath = $webPath
            Score = $bestScore
        }
    } else {
        $unmatchedCount++
        $matchedResults += [PSCustomObject]@{
            ProductName = $item.name
            CleanName = $itemClean
            MatchedImage = "NONE"
            WebPath = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80"
            Score = 0
        }
    }
}

# 5. Output TS Dictionary code block
$tsOutput = @()
$tsOutput += "export const MCDONALDS_IMAGE_MAP: Record<string, string> = {"

# Sort matchedResults for cleaner output
foreach ($match in ($matchedResults | Sort-Object ProductName)) {
    if ($match.MatchedImage -ne "NONE") {
        $escapedName = $match.ProductName -replace '"', '\"'
        $line = "  `"" + $escapedName + "`": `"" + $match.WebPath + "`","
        $tsOutput += $line
    }
}
$tsOutput += "};"

# Save report
$report = @()
$report += "=== RAPORT MAPARE IMAGINI ==="
$report += "Total imagini redenumite: $($files.Count)"
$report += "Total produse de mapat: $($mcItems.Count)"
$report += "Produse nemapate: $unmatchedCount"
$report += ""
$report += "=== MATCHING SPECIFIC ==="
foreach ($res in ($matchedResults | Sort-Object Score -Descending)) {
    $report += "Produs: $($res.ProductName) -> Imagine: $($res.MatchedImage) (Scor: $($res.Score)) [Path: $($res.WebPath)]"
}
$report += ""
$report += "=== COD TYPESCRIPT GENERAT ==="
$report += $tsOutput

$report | Out-File -FilePath $outputFile -Encoding utf8

Write-Host "Raportul de mapare si codul TS au fost salvate in $outputFile" -ForegroundColor Green
