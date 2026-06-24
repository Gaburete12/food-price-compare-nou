$url = "https://food-price-compare-nou-production.up.railway.app/api/restaurants"
Write-Host "Polling API to check if Dabo menu updates..."
for ($i = 1; $i -le 24; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri $url -Headers @{ "Cache-Control" = "no-cache" }
        $dabo = $resp.restaurants | Where-Object { $_.id -eq "dabo-doner-constanta" }
        Write-Host "Attempt $i :"
        Write-Host "  menusUpdatedAt: $($resp.menusUpdatedAt)"
        Write-Host "  Menu Items Count: $($dabo.menu.Count)"
        if ($dabo.menu.Count -gt 0) {
            Write-Host "  First item: $($dabo.menu[0].name)"
            Write-Host "  First item image: $($dabo.menu[0].imageUrl)"
            Write-Host "  First item price on wolt: $($dabo.menu[0].prices | Where-Object { $_.platform -eq 'wolt' } | Select-Object -ExpandProperty price)"
            
            if ($dabo.menu[0].imageUrl -like "*wolt*") {
                Write-Host "SUCCESS! The Dabo menu is now live with real Wolt images!" -ForegroundColor Green
                break
            }
        }
    } catch {
        Write-Host "  Request failed: $_"
    }
    Start-Sleep -Seconds 10
}
