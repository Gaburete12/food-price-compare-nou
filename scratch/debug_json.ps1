$d = Get-Content "scratch/dabo_mapped_menu.json" -Raw | ConvertFrom-Json
Write-Output "Type of d: $($d.GetType().FullName)"
Write-Output "Is array: $($d -is [Array])"
Write-Output "Count of elements: $($d.Count)"
Write-Output "First element type: $($d[0].GetType().FullName)"
Write-Output "First element properties:"
$d[0] | Get-Member -MemberType NoteProperty | ForEach-Object { Write-Output "  $($_.Name)" }
