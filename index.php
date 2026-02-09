<?php
/**
 * Tierra Esperanza - WordPress Theme Entry Point
 * Evita el error "Unexpected token <" asegurando que las peticiones a archivos
 * físicos sean ignoradas por el motor de plantillas de WP.
 */

// Si la petición es para un archivo que existe físicamente, dejamos que el servidor lo sirva
if (file_exists(__DIR__ . $_SERVER['REQUEST_URI']) && !is_dir(__DIR__ . $_SERVER['REQUEST_URI'])) {
    return false;
}

// De lo contrario, servimos el archivo index.html principal
// Inyectamos la URL base del tema para que el JS sepa dónde buscar sus módulos
$template_uri = get_template_directory_uri();
$html = file_get_contents(__DIR__ . '/index.html');

// Reemplazamos las rutas relativas por la ruta absoluta del tema de WordPress
$html = str_replace('./index.tsx', $template_uri . '/index.tsx', $html);

echo $html;
?>