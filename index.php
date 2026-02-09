<?php
/**
 * Tierra Esperanza - WordPress Theme Entry Point
 * Evita el error "La respuesta no es una respuesta JSON válida"
 */

// 1. Si es una petición de la API REST o AJAX de WordPress, dejamos que WP la maneje normalmente
if (defined('REST_REQUEST') && REST_REQUEST || (defined('DOING_AJAX') && DOING_AJAX)) {
    return; 
}

// 2. Si es una petición a un archivo físico existente, dejamos que el servidor lo sirva
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (file_exists(__DIR__ . $request_uri) && !is_dir(__DIR__ . $request_uri)) {
    return false;
}

// 3. Servir el frontend de la aplicación solo para la vista pública
$template_uri = get_template_directory_uri();
$html_path = __DIR__ . '/index.html';

if (file_exists($html_path)) {
    $html = file_get_contents($html_path);
    
    // Inyectamos la URL base real de WordPress para los assets
    $html = str_replace('./index.tsx', $template_uri . '/index.tsx', $html);
    $html = str_replace('href="style.css"', 'href="' . $template_uri . '/style.css"', $html);
    
    echo $html;
} else {
    wp_die('Error: index.html no encontrado en la raíz del tema.');
}
?>