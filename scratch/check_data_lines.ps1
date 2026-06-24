$lines = Get-Content "client/src/lib/data.ts"
Write-Output "Lines 140 to 200 in data.ts:"
for ($i = 140; $i -le 200; $i++) {
    Write-Output "$i : $($lines[$i-1])"
}
