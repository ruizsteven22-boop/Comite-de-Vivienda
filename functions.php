<?php
/**
 * 🌳 Tierra Esperanza - WordPress Theme Functions
 * NOTA: NO agregue espacios ni líneas antes de '<?php'
 */

// 1. PREVENCIÓN DE CORRUPCIÓN DE JSON
// Capturamos cualquier salida accidental (warnings, espacios) que rompa el JSON de WordPress
add_action('rest_api_init', function() {
    ob_start();
});

// 2. LIMPIEZA DE BÚFER ANTES DE ENVIAR JSON
add_filter('rest_pre_serve_request', function($served, $result, $request, $server) {
    // Si hay algo en el búfer que no debería estar ahí, lo limpiamos
    // pero guardamos el JSON que WordPress quiere enviar.
    if (ob_get_length()) {
        ob_clean(); 
    }
    return $served;
}, 10, 4);

// 3. DESACTIVAR ERRORES EN RESPUESTAS REST
if (defined('REST_REQUEST') && REST_REQUEST) {
    @ini_set('display_errors', 0);
    @ini_set('log_errors', 1);
}

// 4. VALIDACIÓN DE RUT CHILENO
function validarRut($rut) {
    $rut = preg_replace('/[^k0-9]/i', '', $rut);
    if (strlen($rut) < 2) return false;
    $dv  = substr($rut, -1);
    $numero = substr($rut, 0, strlen($rut) - 1);
    $i = 2; $suma = 0;
    foreach(array_reverse(str_split($numero)) as $v) {
        if($i == 8) $i = 2;
        $suma += $v * $i;
        $i++;
    }
    $dvr = 11 - ($suma % 11);
    if($dvr == 11) $dvr = 0;
    if($dvr == 10) $dvr = 'K';
    return (strtoupper($dv) == strtoupper($dvr));
}

// 5. SOPORTE DE TEMA
add_action('after_setup_theme', function() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
});

// 6. EVITAR REDIRECCIONES QUE ROMPAN EL SPA
add_filter('redirect_canonical', function($redirect_url) {
    if (is_404()) return false;
    return $redirect_url;
});
?>