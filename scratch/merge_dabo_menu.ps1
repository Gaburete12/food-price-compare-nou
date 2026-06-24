# merge_dabo_menu.ps1
$menusCachePath = "data/restaurant-menus.json"
$mappedMenuPath = "scratch/dabo_mapped_menu.json"

if (-not (Test-Path $menusCachePath)) {
    Write-Error "Menus cache not found at $menusCachePath"
    exit 1
}

if (-not (Test-Path $mappedMenuPath)) {
    Write-Error "Mapped menu not found at $mappedMenuPath"
    exit 1
}

# Load the current cache
$cache = Get-Content -Path $menusCachePath -Raw | ConvertFrom-Json
# Load the new Dabo menu items
$daboItems = Get-Content -Path $mappedMenuPath -Raw | ConvertFrom-Json

Write-Host "Existing cache menus keys before merge:"
$cache.menus.PSObject.Properties.Name | ForEach-Object { Write-Host " - $_" }

# Add or update the "dabo-doner-constanta" key in menus
# Note: $cache.menus is a PSCustomObject, so we can set its property dynamically
if ($null -eq $cache.menus) {
    $cache.menus = @{}
}

$daboArray = [System.Object[]]$daboItems
$cache.menus | Add-Member -MemberType NoteProperty -Name "dabo-doner-constanta" -Value $daboArray -Force

# Update updatedAt and source
$cache.updatedAt = [System.DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$cache.source = "wolt-scrape"

Write-Host "`nCache menus keys after merge:"
$cache.menus.PSObject.Properties.Name | ForEach-Object { Write-Host " - $_" }

# Convert back to JSON with high depth to prevent truncation (since menus contain arrays of items, which contain arrays of prices)
$mergedJson = $cache | ConvertTo-Json -Depth 10

# Write back to file with UTF-8
$mergedJson | Out-File -FilePath $menusCachePath -Encoding utf8
Write-Host "`nSuccessfully merged and saved cache to $menusCachePath!"
