$resp = Invoke-RestMethod -Uri "https://food-price-compare-nou-production.up.railway.app/api/restaurants" -Headers @{ "Cache-Control" = "no-cache" }
$dabo = $resp.restaurants | Where-Object { $_.id -eq "dabo-doner-constanta" }
Write-Output "Total items in API menu: $($dabo.menu.Count)"
for ($i = 0; $i -lt $dabo.menu.Count; $i++) {
    $item = $dabo.menu[$i]
    Write-Output "  Item $i : $($item.name) | Price: $($item.prices[0].price) | Image: $($item.imageUrl)"
}
