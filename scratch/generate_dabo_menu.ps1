# generate_dabo_menu.ps1
$rawStatePath = "scratch/wolt_raw_state.json"
$rawState = Get-Content -Path $rawStatePath -Raw | ConvertFrom-Json

# Locate Query 5
$query = $rawState.queries[5]
$data = $query.state.data

$categories = $data.categories
$items = $data.items

Write-Host "Categories count: $($categories.Count)"
Write-Host "Items count: $($items.Count)"

# Let's index the items by ID for quick lookup
$itemsMap = @{}
foreach ($item in $items) {
    $itemsMap[$item.id] = $item
}

# Romanian diacritics transliteration for slugs
function Get-Slug($name) {
    $slug = $name.ToLower()
    
    # Replace diacritics
    $slug = $slug -replace 'ă', 'a' -replace 'â', 'a' -replace 'î', 'i' -replace 'ș', 's' -replace 'ț', 't'
    $slug = $slug -replace 'ş', 's' -replace 'ţ', 't' # S-cedilla and T-cedilla
    
    # Replace special characters and spaces
    $slug = $slug -replace '[^a-z0-9\s-]', ''
    $slug = $slug -replace '\s+', '-'
    $slug = $slug -replace '-+', '-'
    $slug = $slug.Trim('-')
    
    return $slug
}

$glovoDeepLink = "https://glovoapp.com/ro/ro/constanta/stores/dabo-doner-cta"
$boltDeepLink = "https://food.bolt.eu/ro-ro/462-constanta/p/200293-dabo-doner-mircea-constanta/"
$woltDeepLink = "https://wolt.com/en/rou/constanta/restaurant/dabo-doner-mircea-constana-00a224"

$menuItems = @()

foreach ($cat in $categories) {
    $categoryName = $cat.name
    Write-Host "Processing category: $categoryName"
    
    foreach ($itemId in $cat.item_ids) {
        if ($itemsMap.ContainsKey($itemId)) {
            $item = $itemsMap[$itemId]
            
            $name = $item.name
            
            # Clean description
            $description = $item.description
            if ($description -eq "Descriere" -or $description -eq $null) {
                $description = ""
            }
            
            # Convert price to RON
            $priceRon = $item.price / 100.0
            
            # Extract image
            $imageUrl = ""
            if ($null -ne $item.images -and $item.images.Count -gt 0) {
                $imageUrl = $item.images[0].url
            }
            
            $slug = Get-Slug $name
            $menuItemId = "dabo-$slug"
            
            $prices = @(
                @{
                    platform = "glovo"
                    available = $true
                    price = $priceRon
                    deepLink = $glovoDeepLink
                },
                @{
                    platform = "bolt"
                    available = $true
                    price = $priceRon
                    deepLink = $boltDeepLink
                },
                @{
                    platform = "wolt"
                    available = $true
                    price = $priceRon
                    deepLink = $woltDeepLink
                }
            )
            
            $menuItem = @{
                id = $menuItemId
                name = $name
                description = $description
                category = $categoryName
                imageUrl = $imageUrl
                prices = $prices
            }
            
            $menuItems += $menuItem
        }
    }
}

Write-Host "Generated $($menuItems.Count) menu items for Dabo Doner."

# Convert to JSON with depth and encoding
$outputJson = $menuItems | ConvertTo-Json -Depth 6
$outputJson | Out-File -FilePath "scratch/dabo_mapped_menu.json" -Encoding utf8
Write-Host "Saved mapped menu to scratch/dabo_mapped_menu.json"
