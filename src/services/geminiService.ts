
import { GoogleGenAI } from "@google/genai";
import { Member, Transaction, Assembly, Document, DocumentType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    return "En este momento no se puede generar el análisis automático de finanzas.";
  }
};

export const draftSecretariatDocument = async (docType: DocumentType, subject: string, context: string) => {
  const prompt = `Actúa como el Secretario de un Comité de Vivienda llamado "Tierra Esperanza". 
  Redacta el contenido de un ${docType} oficial.
  Asunto: ${subject}
  Contexto y detalles: ${context}
  
  Instrucciones:
  - Mantén un tono formal, institucional y claro.
  - El contenido debe estar listo para ser impreso en papel membretado.
  - Incluye secciones pertinentes (Introducción, Desarrollo, Conclusión/Acuerdos si aplica).
  - No incluyas el encabezado de la institución (eso se añade automáticamente).
  - Máximo 500 palabras.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error drafting with Gemini:", error);
    return "No se pudo generar el borrador automáticamente. Por favor redacte el contenido manualmente.";
  }
};

export type RefineAction = 'expand' | 'shorten' | 'formalize' | 'persuade';

export const refineSecretariatText = async (currentText: string, action: RefineAction) => {
  const actionPrompts = {
    expand: 'expándelo, añadiendo más detalle, formalidad y claridad, sin perder el punto principal',
    shorten: 'resúmelo, haciéndolo más conciso y directo, manteniendo la formalidad y la información esencial',
    formalize: 'hazlo más formal, institucional y solemne, mejorando el vocabulario y la estructura gramatical',
    persuade: 'hazlo más persuasivo y motivador, resaltando la importancia de la participación y el beneficio común'
  };

  const prompt = `Actúa como un experto en redacción institucional para comités de vivienda. 
  Toma el siguiente texto y ${actionPrompts[action]}.
  
  Texto actual:
  ${currentText}
  
  Instrucciones:
  - Mantén el sentido original del mensaje.
  - El resultado debe ser solo el nuevo contenido del documento, listo para ser utilizado.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error refining with Gemini:", error);
    return currentText; 
  }
};

export const summarizeDocument = async (content: string) => {
  const prompt = `Actúa como un asistente administrativo experto. Resume el siguiente documento institucional de forma muy concisa (máximo 100 palabras). 
  Enfócate en los puntos clave, acuerdos o acciones requeridas.
  
  Contenido del documento:
  ${content}
  
  Responde solo con el resumen, sin introducciones.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error summarizing with Gemini:", error);
    return "No se pudo generar el resumen en este momento.";
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
