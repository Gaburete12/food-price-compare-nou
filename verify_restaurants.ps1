$content = Get-Content -Path 'C:\Users\andre\.gemini\antigravity\brain\c8afe6ee-37d6-4e6c-abee-f45e1e88b96c\.system_generated\steps\2478\content.md' -Raw
$jsonStart = $content.IndexOf('{')
if ($jsonStart -ge 0) {
    $jsonString = $content.Substring($jsonStart)
    $data = ConvertFrom-Json $jsonString
    
    foreach ($r in $data.restaurants) {
        if ($r.id -eq 'mcdonalds-constanta') {
            Write-Host "McDonald's Menu Items:" -ForegroundColor Cyan
            foreach ($item in $r.menu) {
                Write-Host "  - Item: $($item.name) [Category: $($item.category)]"
            }
        }
    }
}
