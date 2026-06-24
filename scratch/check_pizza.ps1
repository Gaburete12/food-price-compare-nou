$content = Get-Content "data/restaurant-menus.json" -Raw
$data = ConvertFrom-Json $content
$dabo = $data.menus.'dabo-doner-constanta'
$pizzas = $dabo | Where-Object { $_.name -like "*Prosciutto*" }
Write-Output "Found $($pizzas.Count) Prosciutto items:"
foreach ($p in $pizzas) {
    Write-Output "Name: $($p.name) | Category: $($p.category)"
}
