$cache = Get-Content -Path "data/restaurant-menus.json" -Raw | ConvertFrom-Json
$daboItems = Get-Content -Path "scratch/dabo_mapped_menu.json" -Raw | ConvertFrom-Json

# Let's remove the existing property
if ($cache.menus.PSObject.Properties["dabo-doner-constanta"]) {
    $cache.menus.PSObject.Properties.Remove("dabo-doner-constanta")
}

# Cast explicitly to [Object[]]
$daboArray = [System.Object[]]$daboItems

# Add property
$cache.menus | Add-Member -MemberType NoteProperty -Name "dabo-doner-constanta" -Value $daboArray -Force

# Let's serialize and check
$json = $cache | ConvertTo-Json -Depth 10
$index = $json.IndexOf('"dabo-doner-constanta"')
Write-Output "Snippet with explicit array cast:"
Write-Output $json.Substring($index, 300)
