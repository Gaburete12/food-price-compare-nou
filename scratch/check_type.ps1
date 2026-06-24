$content = Get-Content "data/restaurant-menus.json" -Raw
$data = ConvertFrom-Json $content
$dabo = $data.menus.'dabo-doner-constanta'
Write-Output "Type of dabo: $($dabo.GetType().FullName)"
Write-Output "Is array: $($dabo -is [Array])"
Write-Output "Length: $($dabo.Length)"
Write-Output "First item type: $($dabo[0].GetType().FullName)"
Write-Output "First item id: $($dabo[0].id)"
Write-Output "First item name: $($dabo[0].name)"
