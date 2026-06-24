$content = Get-Content "data/restaurant-menus.json" -Raw
$data = ConvertFrom-Json $content
$dabo = $data.menus.'dabo-doner-constanta'
Write-Output "Dabo local items count: $($dabo.Count)"
Write-Output "First 5 items:"
Write-Output "First item as JSON:"
$dabo[0] | ConvertTo-Json -Depth 5
