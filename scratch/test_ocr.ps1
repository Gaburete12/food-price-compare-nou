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

    $imgPath = "C:\Users\andre\.antigravity\Meniu Burger King Constanta\1.png"
    $file = Get-Item $imgPath
    
    $openOp = [Windows.Storage.Streams.FileRandomAccessStream]::OpenAsync($file.FullName, [Windows.Storage.FileAccessMode]::Read)
    $stream = Await-WinRT $openOp ([Windows.Storage.Streams.IRandomAccessStream])
    $decodeOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $decoder = Await-WinRT $decodeOp ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmapOp = $decoder.GetSoftwareBitmapAsync()
    $softwareBitmap = Await-WinRT $bitmapOp ([Windows.Graphics.Imaging.SoftwareBitmap])
    $ocrOp = $engine.RecognizeAsync($softwareBitmap)
    $ocrResult = Await-WinRT $ocrOp ([Windows.Media.Ocr.OcrResult])

    Write-Output "Image width: $($decoder.PixelWidth) height: $($decoder.PixelHeight)"
    Write-Output "--- LINES WITH BOUNDS ---"
    foreach ($line in $ocrResult.Lines) {
        # Calculate bounds using the bounding box of the first and last words or the line itself
        # In WinRT, each line has a property or we can calculate from words.
        # Line has a BoundingRect if we use a recent Windows version, or we can check each word.
        # Let's see if Line.BoundingRect exists
        $rect = $line.BoundingRect
        if ($null -ne $rect) {
            Write-Output "Line: '$($line.Text)' | Bounds: X=$($rect.X), Y=$($rect.Y), W=$($rect.Width), H=$($rect.Height)"
        } else {
            # Estimate from words
            $firstWord = $line.Words[0]
            $lastWord = $line.Words[-1]
            Write-Output "Line: '$($line.Text)' | First word bounds: X=$($firstWord.BoundingRect.X), Y=$($firstWord.BoundingRect.Y)"
        }
    }
} catch {
    Write-Error "Error: $_"
}
