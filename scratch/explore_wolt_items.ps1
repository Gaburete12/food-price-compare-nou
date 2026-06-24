# explore_wolt_items.ps1
$json = Get-Content -Path "scratch/wolt_raw_state.json" -Raw | ConvertFrom-Json

# Query 5 has the items and categories
$query = $json.queries[5]
$data = $query.state.data

Write-Host "Number of categories: $($data.categories.Count)"
Write-Host "Number of items: $($data.items.Count)"

# Let's inspect the first category
Write-Host "`nSample Category 0:"
$data.categories[0] | ConvertTo-Json -Depth 3

# Let's inspect the first item
Write-Host "`nSample Item 0:"
$data.items[0] | ConvertTo-Json -Depth 4
