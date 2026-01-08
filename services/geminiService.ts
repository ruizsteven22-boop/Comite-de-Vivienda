
import { GoogleGenAI } from "@google/genai";
import { Member, Transaction, Assembly } from "../types";

// Strictly follow initialization guidelines for GoogleGenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialSummary = async (transactions: Transaction[]) => {
  const prompt = `Analiza los siguientes movimientos financieros de un comité de vivienda y genera un resumen ejecutivo breve (máximo 3 párrafos). 
  Datos de transacciones (formato JSON): ${JSON.stringify(transactions.slice(0, 50))}
  Incluye: 
  1. Balance general.
  2. Tendencia de ingresos vs egresos.
  3. Sugerencia estratégica para el ahorro.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "No se pudo generar el resumen automático en este momento.";
  }
};

export const generateMassNotificationDraft = async (assembly: Assembly, channel: 'email' | 'sms') => {
  const prompt = `Actúa como el secretario de un comité de vivienda llamado "Tierra Esperanza". 
  Redacta un ${channel === 'email' ? 'correo electrónico formal' : 'mensaje de texto (SMS) breve y directo'} 
  para convocar a los socios a la siguiente asamblea:
  Tipo: ${assembly.type}
  Fecha: ${assembly.date}
  Hora Citación: ${assembly.summonsTime} hrs.
  Lugar: ${assembly.location}
  Motivo: ${assembly.description}
  
  El tono debe ser ${channel === 'email' ? 'profesional y motivador' : 'urgente y claro'}. 
  Si es correo, incluye un asunto sugerido al inicio.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return `Citación Tierra Esperanza: ${assembly.description}. Día ${assembly.date} a las ${assembly.summonsTime} en ${assembly.location}. Asistencia obligatoria.`;
  }
};

export const generateReceiptText = (member: Member, transaction: Transaction) => {
  const refText = transaction.referenceNumber ? `\n*Ref/Doc:* ${transaction.referenceNumber}` : '';
  
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
         `_Este es un recibo digital válido. Gracias por su compromiso._`;
};

export const generateAssemblyReminderText = (member: Member, assembly: Assembly) => {
  return `*CITACIÓN ASAMBLEA ${assembly.type.toUpperCase()}*\n` +
         `*COMITÉ TIERRA ESPERANZA*\n\n` +
         `Estimado(a) *${member.name}*,\n\n` +
         `Se le cita cordialmente a nuestra próxima asamblea:\n` +
         `📅 *Fecha:* ${assembly.date}\n` +
         `⏰ *Hora:* ${assembly.summonsTime} hrs.\n` +
         `📍 *Lugar:* ${assembly.location}\n` +
         `📝 *Motivo:* ${assembly.description}\n\n` +
         `Su asistencia es fundamental para el quórum y la toma de decisiones del comité. ¡Le esperamos!\n\n` +
         `_Mensaje enviado vía Sistema de Gestión Tierra Esperanza_`;
};
