# Script para eliminar el bloque duplicado del index.html
# El problema: líneas 98-292 son código incompleto (primera copia cortada)
# seguido de línea 293 que es <script type="text/babel"> (inicio de segunda copia completa)
# Solución: eliminar líneas 98-292 y quitar el tag duplicado de la línea 293

$filePath = "c:\Users\jonathan.noguera\Desktop\VirtualLife\public\index.html"
$content = [System.IO.File]::ReadAllText($filePath)

# Dividir por líneas preservando formato
$lines = $content -split "`r?`n"

Write-Host "Total de lineas antes: $($lines.Count)"

# Líneas a mantener: 0-96 (head y body open) + 292+ (el bloque completo empieza en índice 292 que es la línea 293)
# Pero línea 292 (índice) es '<script type="text/babel">' que es el duplicado
# Línea 97 (índice) debería ser '<script type="text/babel">' que es el original

# Mantener: líneas índice 0-96 (líneas 1-97 del archivo)
$parteBefore = $lines[0..96]

# El bloque duplicado comienza en índice 292 con '<script type="text/babel">'
# Necesitamos su contenido (sin el tag script duplicado) - desde índice 293 en adelante
$parteAfter = $lines[293..($lines.Count - 1)]

# Reconstruir con el tag script original + contenido del bloque completo
$newLines = @()
$newLines += $parteBefore
$newLines += "    <script type=""text/babel"">"
$newLines += $parteAfter

$newContent = $newLines -join "`r`n"

[System.IO.File]::WriteAllText($filePath, $newContent)

$finalLines = ([System.IO.File]::ReadAllText($filePath) -split "`r?`n").Count
Write-Host "Total de lineas despues: $finalLines"
Write-Host "Archivo corregido exitosamente!"
