<?php
/**
 * 🌳 Tierra Esperanza - WordPress Theme Functions
 * NOTA: No agregue espacios ni líneas antes de '<?php'
 */

// Desactivar avisos de PHP en la salida para evitar corromper JSON en modo debug
if (defined('REST_REQUEST') && REST_REQUEST) {
    @ini_set('display_errors', 0);
}

// 1. VALIDACIÓN DE RUT CHILENO (Módulo 11)
function validarRut($rut) {
    $rut = preg_replace('/[^k0-9]/i', '', $rut);
    if (strlen($rut) < 2) return false;
    
    $dv  = substr($rut, -1);
    $numero = substr($rut, 0, strlen($rut) - 1);
    $i = 2;
    $suma = 0;
    
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

// 2. FORMATEO DE MONEDA NACIONAL (CLP)
function formatearPesoChileno($monto) {
    return '$' . number_format($monto, 0, ',', '.');
}

// 3. SOPORTE DE TEMA BÁSICO
add_action('after_setup_theme', function() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
});

// 4. EVITAR REDIRECCIONES CANÓNICAS QUE ROMPAN EL SPA
// Esto evita que WP intente "adivinar" la URL y redirija peticiones de React
add_filter('redirect_canonical', function($redirect_url) {
    if (is_404()) {
        return false;
    }
    return $redirect_url;
});
?>