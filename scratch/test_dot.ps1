$cache = Get-Content -Path "data/restaurant-menus.json" -Raw | ConvertFrom-Json
$daboItems = Get-Content -Path "scratch/dabo_mapped_menu.json" -Raw | ConvertFrom-Json

# Let's remove the existing property
if ($cache.menus.PSObject.Properties["dabo-doner-constanta"]) {
    $cache.menus.PSObject.Properties.Remove("dabo-doner-constanta")
}

# Assign using dot notation
$cache.menus."dabo-doner-constanta" = $daboItems

# Let's check type in PowerShell
Write-Output "Type after dot notation assignment: $($cache.menus."dabo-doner-constanta".GetType().FullName)"

# Let's serialize and check
$json = $cache | ConvertTo-Json -Depth 10
$index = $json.IndexOf('"dabo-doner-constanta"')
Write-Output "`nSnippet with dot notation:"
Write-Output $json.Substring($index, 300)
