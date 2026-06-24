$content = Get-Content "client/src/lib/data.ts" -Raw
# Find restaurant entries
if ($content -match 'id:\s*"([^"]+dabo[^"]*)"') {
    Write-Output "Found dabo id in regex 1: $($Matches[1])"
}
# Let's find all occurrences of 'dabo' in data.ts
$matchesAll = [regex]::Matches($content, 'id:\s*"([^"]+)"')
foreach ($m in $matchesAll) {
    if ($m.Groups[1].Value -like "*dabo*") {
        Write-Output "Found ID: $($m.Groups[1].Value)"
    }
}
