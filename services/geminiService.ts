
import { GoogleGenAI } from "@google/genai";
import { Member, Transaction, Assembly } from "../types";

// strictly use the named parameter and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialSummary = async (transactions: Transaction[]) => {
  const prompt = `Analiza los siguientes movimientos financieros de un comité de vivienda llamado "Tierra Esperanza" y genera un resumen ejecutivo breve (máximo 3 párrafos). 
  Datos de transacciones (formato JSON): ${JSON.stringify(transactions.slice(0, 50))}
  Incluye: 
  1. Balance general actual.
  2. Análisis de tendencias de ingresos vs egresos.
  3. Una sugerencia estratégica para mejorar la recaudación o ahorro.
  Responde de forma profesional y motivadora para los socios.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Correct model for analysis
      contents: prompt,
    });
    return response.text; // Access .text property directly
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "En este momento no se puede generar el análisis automático de finanzas.";
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
