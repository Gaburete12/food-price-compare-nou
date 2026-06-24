# Find the dabo-doner-constanta object in client/src/lib/data.ts and see if it has a static menu
$content = Get-Content "client/src/lib/data.ts" -Raw
# Let's run a quick node or powershell JSON parsing if possible, or search for "dabo-doner-constanta"
$index = $content.IndexOf("dabo-doner-constanta")
if ($index -ge 0) {
    Write-Output "Found dabo-doner-constanta in data.ts at character $index"
    $snippet = $content.Substring($index, [Math]::Min(1000, $content.Length - $index))
    Write-Output "Snippet:"
    Write-Output $snippet
} else {
    Write-Output "Could not find dabo-doner-constanta in data.ts"
}
