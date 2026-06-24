# Read first 1000 characters after dabo-doner-constanta in raw JSON
$content = Get-Content "data/restaurant-menus.json" -Raw
$index = $content.IndexOf('"dabo-doner-constanta"')
if ($index -ge 0) {
    Write-Output "Snippet starting from dabo-doner-constanta key:"
    Write-Output $content.Substring($index, 500)
} else {
    Write-Output "Key not found!"
}
