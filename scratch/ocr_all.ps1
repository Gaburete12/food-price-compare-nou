try {
    [void][System.Reflection.Assembly]::Load("System.Runtime.WindowsRuntime, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089")
    [void][Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime]
    [void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
    [void][Windows.Storage.Streams.FileRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
    [void][Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
    [void][Windows.Media.Ocr.OcrResult, Windows.Media.Ocr, ContentType=WindowsRuntime]

    function Await-WinRT ($asyncOp, $resultType) {
        $asTaskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
            $_.Name -eq 'AsTask' -and 
            $_.GetGenericArguments().Length -eq 1 -and
            $_.GetParameters()[0].ParameterType.Name.StartsWith("IAsyncOperation")
        } | Select-Object -First 1
        $genericAsTask = $asTaskMethod.MakeGenericMethod($resultType)
        $task = $genericAsTask.Invoke($null, @($asyncOp))
        return $task.Result
    }

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new("en-US"))
    }
    
    Write-Output "OCR Engine Language: $($engine.RecognizerLanguage.LanguageTag)"

    $srcDir = "C:\Users\andre\.antigravity\Meniu Burger King Constanta"
    $files = Get-ChildItem -Path $srcDir -Filter "*.png" | Sort-Object { [int]($_.BaseName) }
    
    $allResults = [System.Collections.Generic.List[Object]]::new()
    
    foreach ($file in $files) {
        Write-Output "Processing $($file.Name)..."
        
        $openOp = [Windows.Storage.Streams.FileRandomAccessStream]::OpenAsync($file.FullName, [Windows.Storage.FileAccessMode]::Read)
        $stream = Await-WinRT $openOp ([Windows.Storage.Streams.IRandomAccessStream])
        
        $decodeOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
        $decoder = Await-WinRT $decodeOp ([Windows.Graphics.Imaging.BitmapDecoder])
        
        $bitmapOp = $decoder.GetSoftwareBitmapAsync()
        $softwareBitmap = Await-WinRT $bitmapOp ([Windows.Graphics.Imaging.SoftwareBitmap])
        
        $ocrOp = $engine.RecognizeAsync($softwareBitmap)
        $ocrResult = Await-WinRT $ocrOp ([Windows.Media.Ocr.OcrResult])
        
        $lines = @()
        foreach ($line in $ocrResult.Lines) {
            $words = @()
            foreach ($word in $line.Words) {
                $words += @{
                    text = $word.Text
                    x = $word.BoundingRect.X
                    y = $word.BoundingRect.Y
                    w = $word.BoundingRect.Width
                    h = $word.BoundingRect.Height
                }
            }
            
            $lines += @{
                text = $line.Text
                words = $words
            }
        }
        
        $allResults.Add(@{
            file = $file.Name
            index = [int]$file.BaseName
            width = $decoder.PixelWidth
            height = $decoder.PixelHeight
            lines = $lines
        })
        
        $stream.Dispose()
    }
    
    $json = ConvertTo-Json $allResults -Depth 10
    $outPath = "C:\Users\andre\.gemini\antigravity\scratch\food-price-compare12-main\scratch\ocr_results.json"
    Set-Content -Path $outPath -Value $json -Encoding Utf8
    Write-Output "Successfully saved OCR results for all $($files.Count) screenshots to $outPath!"
    
} catch {
    Write-Error "Error: $_"
}
