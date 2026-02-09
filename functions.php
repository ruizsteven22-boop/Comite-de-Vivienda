<?php
/**
 * 🌳 Tierra Esperanza - Gestión de Comité
 * Archivo de funciones y utilidades para el backend (PHP)
 * 
 * Este archivo contiene la lógica de negocio para el procesamiento de datos
 * del Comité de Vivienda Tierra Esperanza en entornos de servidor.
 */

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

// 2. CÁLCULO DE INTERESES POR MOROSIDAD
// Útil para el módulo de Tesorería al calcular deudas de cuotas sociales
function calcularInteresMorosidad($monto, $fechaVencimiento) {
    $fecha_actual = new DateTime();
    $vencimiento = new DateTime($fechaVencimiento);
    
    if ($fecha_actual <= $vencimiento) return 0;
    
    $intervalo = $vencimiento->diff($fecha_actual);
    $mesesAtraso = ($intervalo->y * 12) + $intervalo->m;
    
    // Tasa ejemplo: 1.5% mensual simple (ajustable según estatutos del comité)
    $tasaMensual = 0.015;
    $interes = $monto * $tasaMensual * ($mesesAtraso + ($intervalo->d > 0 ? 1 : 0));
    
    return round($interes);
}

// 3. CÁLCULO DE ANTIGÜEDAD (Puntaje de Vivienda)
function obtenerAntiguedadSocio($fechaIngreso) {
    $ingreso = new DateTime($fechaIngreso);
    $actual = new DateTime();
    $diferencia = $ingreso->diff($actual);
    
    return [
        'años' => $diferencia->y,
        'meses' => $diferencia->m,
        'total_meses' => ($diferencia->y * 12) + $diferencia->m
    ];
}

// 4. FORMATEO DE MONEDA NACIONAL (CLP)
function formatearPesoChileno($monto) {
    return '$' . number_format($monto, 0, ',', '.');
}

// 5. SANITIZACIÓN DE DATOS PARA INFORMES
function limpiarTextoActa($texto) {
    $texto = trim($texto);
    $texto = stripslashes($texto);
    $texto = htmlspecialchars($texto);
    return $texto;
}

// 6. GENERADOR DE COLOR PARA AVATARES (Basado en nombre)
function generarColorAvatar($nombre) {
    $hash = md5($nombre);
    return '#' . substr($hash, 0, 6);
}

/**
 * Nota: Si se utiliza este archivo como API, asegúrese de implementar 
 * las cabeceras CORS necesarias para comunicarse con el frontend de Tierra Esperanza.
 */
?>