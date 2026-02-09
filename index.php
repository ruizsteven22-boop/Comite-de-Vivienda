<?php
/**
 * Tierra Esperanza - WordPress Theme Entry Point
 * Corregido para evitar "Unexpected token <" asegurando limpieza absoluta en la salida.
 */

// 1. Si es una petición de la API REST o AJAX de WordPress, NO procesamos el index.html
if ((defined('REST_REQUEST') && REST_REQUEST) || (defined('DOING_AJAX') && DOING_AJAX)) {
    return; 
}

// 2. Detección de recursos estáticos (JS, CSS, JSON)
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$extension = pathinfo($request_uri, PATHINFO_EXTENSION);

// Si la extensión sugiere un recurso que debería existir físicamente
if (in_array($extension, ['js', 'css', 'json', 'png', 'jpg', 'svg', 'tsx'])) {
    if (file_exists(__DIR__ . $request_uri)) {
        return false; // El servidor sirve el archivo real
    }
}

// 3. Servir el frontend de la aplicación
$template_uri = get_template_directory_uri();
$html_path = __DIR__ . '/index.html';

if (file_exists($html_path)) {
    $html = file_get_contents($html_path);
    
    // Ajuste de rutas para entorno WordPress
    $html = str_replace('./index.tsx', $template_uri . '/index.tsx', $html);
    $html = str_replace('href="style.css"', 'href="' . $template_uri . '/style.css"', $html);
    
    // Asegurar que no hay salida previa
    if (ob_get_length()) ob_clean();
    
    echo $html;
} else {
    header("Content-Type: text/plain");
    echo "Error: index.html no encontrado. Por favor verifique la instalación del tema.";
}
exit; // Detener ejecución para evitar que WordPress añada HTML extra al final
?>