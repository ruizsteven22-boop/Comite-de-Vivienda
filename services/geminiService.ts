
import { GoogleGenAI } from "@google/genai";
import { Member, Transaction, Assembly } from "../types";

// strictly use the named parameter and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialSummary = async (transactions: Transaction[]) => {
  const prompt = `Actúa como un asesor financiero experto para organizaciones comunitarias. Analiza los siguientes movimientos contables del comité de vivienda "Tierra Esperanza" y genera un informe ejecutivo estratégico. 
  
  Datos de transacciones (formato JSON): ${JSON.stringify(transactions.slice(0, 50))}
  
  Estructura del informe:
  1. Estado de Salud Financiera: Resume el balance y si los fondos son suficientes para el gasto operativo.
  2. Alertas o Hallazgos: Identifica gastos inusuales o meses de baja recaudación.
  3. Propuesta de Mejora: Sugiere una acción concreta para aumentar el fondo común o reducir costos.
  
  Responde con un tono profesional, claro y constructivo. Máximo 300 palabras.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "En este momento no se puede generar el análisis automático de finanzas. Por favor revise el balance manual en el módulo de Tesorería.";
  }
};

export const generateMassNotificationDraft = async (assembly: Assembly, channel: 'email' | 'sms') => {
  const prompt = `Actúa como el secretario de un comité de vivienda "Tierra Esperanza". 
  Redacta un ${channel === 'email' ? 'correo electrónico formal' : 'mensaje de texto (SMS) breve'} 
  para citar a los socios a la siguiente asamblea:
  Tipo: ${assembly.type}
  Fecha: ${assembly.date}
  Hora Citación: ${assembly.summonsTime} hrs.
  Lugar: ${assembly.location}
  Motivo/Descripción: ${assembly.description}
  
  ${channel === 'email' ? 'Incluye un asunto profesional.' : 'Máximo 160 caracteres.'}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return `Citación Tierra Esperanza: ${assembly.description}. Día ${assembly.date} a las ${assembly.summonsTime} en ${assembly.location}. ¡Le esperamos!`;
  }
};

export const generateReceiptText = (member: Member, transaction: Transaction) => {
  const refText = transaction.referenceNumber ? `\n*Ref:* ${transaction.referenceNumber}` : '';
  
  return `*📄 COMPROBANTE DE PAGO OFICIAL*\n` +
         `*COMITÉ TIERRA ESPERANZA*\n` +
         `------------------------------------------\n` +
         `*Folio:* ${transaction.id}\n` +
         `*Fecha:* ${transaction.date}\n\n` +
         `*Socio:* ${member.name}\n` +
         `*RUT:* ${member.rut}\n\n` +
         `*MONTO:* $${transaction.amount.toLocaleString('es-CL')}\n` +
         `*Método:* ${transaction.paymentMethod}${refText}\n` +
         `*Concepto:* ${transaction.description}\n` +
         `------------------------------------------\n` +
         `_Documento digital generado por Sistema TE. Gracias por su puntualidad._`;
};

export const generateAssemblyReminderText = (member: Member, assembly: Assembly) => {
  return `*CITACIÓN ASAMBLEA ${assembly.type.toUpperCase()}*\n` +
         `*COMITÉ TIERRA ESPERANZA*\n\n` +
         `Estimado(a) *${member.name}*,\n\n` +
         `Le recordamos nuestra próxima asamblea:\n` +
         `📅 *Fecha:* ${assembly.date}\n` +
         `⏰ *Hora:* ${assembly.summonsTime} hrs.\n` +
         `📍 *Lugar:* ${assembly.location}\n` +
         `📝 *Motivo:* ${assembly.description}\n\n` +
         `Su presencia es clave para la toma de decisiones.\n\n` +
         `_Enviado vía Sistema Tierra Esperanza_`;
};
