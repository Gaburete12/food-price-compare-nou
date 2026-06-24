$dataPath = Join-Path $PSScriptRoot "..\data\restaurant-menus.json"
if (-not (Test-Path $dataPath)) {
    Write-Host "Data file does not exist at $dataPath"
    Exit
}

$content = Get-Content $dataPath -Raw
$data = ConvertFrom-Json $content
$dabo = $data.menus.'dabo-doner-constanta'
Write-Host "Total Dabo items: $($dabo.Count)"

Write-Host "`nAll unique Dabo categories:"
$dabo | Group-Object category | ForEach-Object { Write-Host "- $($_.Name) ($($_.Count) items)" }

Write-Host "`nAll Dabo item names:"
$dabo | ForEach-Object { Write-Host " - $($_.name) (Original Category: $($_.category))" }
