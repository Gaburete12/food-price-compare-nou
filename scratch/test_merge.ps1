# Test merging with different techniques
$cache = Get-Content -Path "data/restaurant-menus.json" -Raw | ConvertFrom-Json
$daboItems = Get-Content -Path "scratch/dabo_mapped_menu.json" -Raw | ConvertFrom-Json

# Let's try adding with comma operator
$testCache = $cache
# We need to remove the existing property first
if ($testCache.menus.PSObject.Properties["dabo-doner-constanta"]) {
    $testCache.menus.PSObject.Properties.Remove("dabo-doner-constanta")
}

# Add with comma operator: ,$daboItems
$testCache.menus | Add-Member -MemberType NoteProperty -Name "dabo-doner-constanta" -Value (,$daboItems) -Force

# Let's serialize and check
$json = $testCache | ConvertTo-Json -Depth 10
$index = $json.IndexOf('"dabo-doner-constanta"')
Write-Output "Snippet with comma operator:"
Write-Output $json.Substring($index, 300)
