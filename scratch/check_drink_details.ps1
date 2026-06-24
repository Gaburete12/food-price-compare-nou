$dataPath = Join-Path $PSScriptRoot "..\data\restaurant-menus.json"
$content = Get-Content $dataPath -Raw
$data = ConvertFrom-Json $content
$items = $data.menus.'pizza-hut-ct-1'

$targets = @("carlsberg", "ursus", "tuborg", "water", "schweppes", "mirinda", "pepsi", "7up")
foreach ($item in $items) {
    $matched = $false
    foreach ($t in $targets) {
        if ($item.name.ToLower().Contains($t)) {
            $matched = $true
        }
    }
    if ($matched) {
        Write-Host "Name: `"$($item.name)`" | Original Cat: `"$($item.category)`""
    }
}
