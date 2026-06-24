$content = Get-Content "data/restaurant-menus.json" -Raw
$index = $content.IndexOf('"kfc-ct-1"')
if ($index -ge 0) {
    Write-Output "Snippet starting from kfc-ct-1 key:"
    Write-Output $content.Substring($index, 300)
} else {
    Write-Output "Key kfc-ct-1 not found!"
}
