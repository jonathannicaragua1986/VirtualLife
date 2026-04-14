# Script para contar llaves en el bloque script babel
$content = [System.IO.File]::ReadAllText("c:\Users\jonathan.noguera\Desktop\VirtualLife\public\index.html")

# Extraer el contenido del script babel
$pattern = '(?s)<script type="text/babel">(.*?)</script>'
$match = [regex]::Match($content, $pattern)

if ($match.Success) {
    $js = $match.Groups[1].Value
    
    $openBraces = ([char[]]$js | Where-Object { $_ -eq '{' }).Count
    $closeBraces = ([char[]]$js | Where-Object { $_ -eq '}' }).Count
    $openParens = ([char[]]$js | Where-Object { $_ -eq '(' }).Count
    $closeParens = ([char[]]$js | Where-Object { $_ -eq ')' }).Count
    
    Write-Host "Open braces {: $openBraces"
    Write-Host "Close braces }: $closeBraces"
    Write-Host "Diff braces: $($openBraces - $closeBraces)"
    Write-Host "Open parens (: $openParens"
    Write-Host "Close parens ): $closeParens"
    Write-Host "Diff parens: $($openParens - $closeParens)"
} else {
    Write-Host "No se encontro el bloque script babel"
}
