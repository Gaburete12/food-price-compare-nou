$resp = Invoke-RestMethod -Uri "https://food-price-compare-nou-production.up.railway.app/api/restaurants"
$dabo = $resp.restaurants | Where-Object { $_.id -eq "dabo-doner-constanta" }

if ($null -ne $dabo) {
    Write-Host "Dabo Doner Found!"
    Write-Host "Menu Items Count: $($dabo.menu.Count)"
    if ($dabo.menu.Count -gt 0) {
        Write-Host "First item name: $($dabo.menu[0].name)"
        Write-Host "First item image: $($dabo.menu[0].imageUrl)"
    } else {
        Write-Host "No products in Dabo menu (using static or empty fallback)."
    }
} else {
    Write-Host "Dabo Doner restaurant not found in API response!"
}

Write-Host "deliveryFeesUpdatedAt: $($resp.deliveryFeesUpdatedAt)"
Write-Host "menusUpdatedAt: $($resp.menusUpdatedAt)"
