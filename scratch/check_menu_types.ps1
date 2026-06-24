# Check which items in dabo-doner-constanta fail isMenuItem
$content = Get-Content "data/restaurant-menus.json" -Raw
$data = ConvertFrom-Json $content
$dabo = $data.menus.'dabo-doner-constanta'

Write-Output "Total items in local dabo menu: $($dabo.Count)"

$failed = 0
for ($i = 0; $i -lt $dabo.Count; $i++) {
    $item = $dabo[$i]
    $reasons = @()
    
    if ($null -eq $item.id -or $item.id.GetType().Name -ne "String") { $reasons += "id is not string" }
    if ($null -eq $item.name -or $item.name.GetType().Name -ne "String") { $reasons += "name is not string" }
    if ($null -eq $item.description -or $item.description.GetType().Name -ne "String") { $reasons += "description is not string" }
    if ($null -eq $item.category -or $item.category.GetType().Name -ne "String") { $reasons += "category is not string" }
    if ($null -eq $item.imageUrl -or $item.imageUrl.GetType().Name -ne "String") { $reasons += "imageUrl is not string" }
    
    if ($null -eq $item.prices) {
        $reasons += "prices is null"
    } else {
        # Check prices array
        foreach ($p in $item.prices) {
            if ($null -eq $p.platform -or $p.platform.GetType().Name -ne "String") { $reasons += "price platform is not string" }
            if ($null -eq $p.available -or $p.available.GetType().Name -ne "Boolean") { $reasons += "price available is not boolean" }
            # In powershell, price could be double or int
            if ($null -eq $p.price -or ($p.price.GetType().Name -ne "Double" -and $p.price.GetType().Name -ne "Int32")) { 
                $reasons += "price value is not number (type: $($p.price.GetType().Name))" 
            }
            if ($null -eq $p.deepLink -or $p.deepLink.GetType().Name -ne "String") { $reasons += "price deepLink is not string" }
        }
    }
    
    if ($reasons.Count -gt 0) {
        $failed++
        Write-Output "Item $i ($($item.name)) FAILED isMenuItem check:"
        foreach ($r in $reasons) {
            Write-Output "  - $r"
        }
    }
}

Write-Output "Total failed: $failed"
