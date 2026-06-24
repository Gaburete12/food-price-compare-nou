$resp = Invoke-RestMethod -Uri "https://food-price-compare-nou-production.up.railway.app/api/restaurants" -Headers @{ "Cache-Control" = "no-cache" }
$dabo = $resp.restaurants | Where-Object { $_.id -eq "dabo-doner-constanta" }
Write-Output "Dabo restaurant found. Menu count: $($dabo.menu.Count)"
Write-Output "First item from API:"
$dabo.menu[0] | ConvertTo-Json -Depth 5
