$dataPath = Join-Path $PSScriptRoot "..\data\restaurant-menus.json"
if (-not (Test-Path $dataPath)) {
    Write-Host "Data file does not exist at $dataPath"
    Exit
}

$content = Get-Content $dataPath -Raw
$data = ConvertFrom-Json $content
Write-Host "Available menus:"
$data.menus | Get-Member -MemberType NoteProperty | ForEach-Object { Write-Host " - $($_.Name)" }

$daboKeys = @()
$data.menus | Get-Member -MemberType NoteProperty | ForEach-Object {
    if ($_.Name -like "*dabo*") {
        $daboKeys += $_.Name
    }
}

Write-Host "Dabo keys found: $daboKeys"

foreach ($key in $daboKeys) {
    $items = $data.menus.$key
    Write-Host "`n--- Items for $key ($($items.Count) items) ---"
    
    $pizzas = $items | Where-Object { 
        $_.name.ToLower().Contains("pizza") -or 
        ($_.category -ne $null -and $_.category.ToLower().Contains("pizza"))
    }
    
    Write-Host "Found $($pizzas.Count) pizza items:"
    foreach ($p in $pizzas) {
        Write-Host "Name: `"$($p.name)`" | Original Category: `"$($p.category)`" | Saved ImageUrl: `"$($p.imageUrl)`""
    }
}
