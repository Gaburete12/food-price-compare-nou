$content = Get-Content "data/restaurant-menus.json" -Raw
$data = ConvertFrom-Json $content
$dabo = $data.menus.'dabo-doner-constanta'
$item = $dabo[0]

Write-Output "Item 0 Properties:"
$item | Get-Member -MemberType NoteProperty | ForEach-Object {
    $p = $_.Name
    $val = $item.$p
    $type = if ($null -eq $val) { "Null" } else { $val.GetType().Name }
    Write-Output "  $p : $type = $val"
}
