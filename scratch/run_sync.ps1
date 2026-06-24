$url = "https://food-price-compare-nou-production.up.railway.app/api/admin/delivery-fees/sync"
$headers = @{
    "x-sync-token" = "demo-token"
    "Content-Type" = "application/json"
}

Write-Host "Triggering remote live sync on Railway server..."
try {
    $res = Invoke-RestMethod -Uri $url -Headers $headers -Method Post -TimeoutSec 180
    Write-Host "Sync Completed Successfully!" -ForegroundColor Green
    $res | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error during remote sync:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
