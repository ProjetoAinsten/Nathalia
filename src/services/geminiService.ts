import { GoogleGenAI, Part, Content } from "@google/genai";
import { Message, UsageLog, SystemLog, LogLevel } from "../types";
import { jsPDF } from "jspdf";

export const MODEL_IDS = {
  FLASH_2_0: 'gemini-2.0-flash-exp',
  FLASH_3_0: 'gemini-3-flash-preview',
  PRO_3_0: 'gemini-3-pro-preview',
};

const COSTS = {
    [MODEL_IDS.FLASH_2_0]: { input: 0.10, output: 0.40 },
    [MODEL_IDS.FLASH_3_0]: { input: 0.075, output: 0.30 },
    [MODEL_IDS.PRO_3_0]: { input: 1.25, output: 5.00 }
};

const USD_TO_BRL = 6.0;
const INITIAL_BONUS = 1500.00;
const CLOUD_RUN_ESTIMATE_PER_MSG_BRL = 0.01;

// --- LOGGER SYSTEM ---
export const logger = {
  getLogs: (): SystemLog[] => {
    try {
      return JSON.parse(localStorage.getItem('AINSTEN_SYSTEM_LOGS') || '[]');
    } catch { return []; }
  },
  add: (level: LogLevel, message: string, details?: any) => {
    const logs = logger.getLogs();
    const newLog: SystemLog = {
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      timestamp: Date.now(),
      level,
      message,
      details: typeof details === 'object' ? JSON.stringify(details) : details
    };
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    localStorage.setItem('AINSTEN_SYSTEM_LOGS', JSON.stringify(updatedLogs));
    return newLog;
  },
  clear: () => localStorage.removeItem('AINSTEN_SYSTEM_LOGS')
};

// --- TOKEN ESTIMATION ---
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 3.5);
};

export const initUsage = (): UsageLog => {
    try {
        const saved = localStorage.getItem('AINSTEN_USAGE_V2');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.initialBonusBRL === undefined) parsed.initialBonusBRL = INITIAL_BONUS;
            if (parsed.remainingBonusBRL === undefined) parsed.remainingBonusBRL = INITIAL_BONUS;
            return parsed;
        }
    } catch (e) {
        logger.add('error', 'Falha ao ler UsageLog', e);
    }
    
    return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostBRL: 0,
        initialBonusBRL: INITIAL_BONUS,
        remainingBonusBRL: INITIAL_BONUS,
        breakdown: {
            flash: { input: 0, output: 0, cost: 0 },
            pro: { input: 0, output: 0, cost: 0 },
            audio: { cost: 0 }
        },
        lastUpdate: Date.now()
    };
};

export const updateUsage = (model: string, input: number, output: number) => {
    try {
        const safeInput = input || 0;
        const safeOutput = output || 0;

        const costConfig = COSTS[model as keyof typeof COSTS] || COSTS[MODEL_IDS.FLASH_3_0];
        const costInputUSD = (safeInput / 1000000) * costConfig.input;
        const costOutputUSD = (safeOutput / 1000000) * costConfig.output;
        let totalUSD = costInputUSD + costOutputUSD;
        let totalBRL = totalUSD * USD_TO_BRL;
        
        // Add fixed infra cost per message
        totalBRL += CLOUD_RUN_ESTIMATE_PER_MSG_BRL;

        const usage = initUsage();

        usage.totalInputTokens += safeInput;
        usage.totalOutputTokens += safeOutput;
        usage.totalCostBRL += totalBRL;
        usage.remainingBonusBRL = usage.initialBonusBRL - usage.totalCostBRL;
        usage.lastUpdate = Date.now();

        if (model.includes('pro')) {
            usage.breakdown.pro.input += safeInput;
            usage.breakdown.pro.output += safeOutput;
            usage.breakdown.pro.cost += totalBRL;
        } else {
            usage.breakdown.flash.input += safeInput;
            usage.breakdown.flash.output += safeOutput;
            usage.breakdown.flash.cost += totalBRL;
        }

        localStorage.setItem('AINSTEN_USAGE_V2', JSON.stringify(usage));
    } catch (e) {
        logger.add('error', 'Erro ao atualizar custos', e);
    }
};

const formatHistory = (messages: Message[]): Content[] => {
  return messages
    .filter(msg => !msg.hasError && msg.text && msg.text.trim().length > 0) 
    .map(msg => {
       const parts: Part[] = [{ text: msg.text }];
       if (msg.role === 'user' && msg.image) {
           try {
               const cleanData = msg.image.includes(',') ? msg.image.split(',')[1] : msg.image;
               parts.push({
                   inlineData: {
                       mimeType: 'image/jpeg',
                       data: cleanData
                   }
               });
           } catch (e) {
               logger.add('warn', 'Erro ao processar imagem para histórico', e);
           }
       }
       return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts: parts
       };
    });
};

export const streamChatResponse = async (
  currentHistory: Message[],
  prompt: string,
  systemInstruction: string,
  attachment: { mimeType: string; data: string } | null | undefined,
  modelId: string,
  useSearch: boolean = false,
  onUsageUpdate?: (input: number, output: number) => void,
  signal?: AbortSignal
): Promise<AsyncGenerator<string, void, unknown>> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      logger.add('error', 'API KEY Ausente');
      throw new Error("Chave API ausente.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const timeNow = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const finalSystemInstruction = `${systemInstruction}\n[SISTEMA] Hora: ${timeNow}.\nModelo Ativo: ${modelId}.`;
  
  const MODEL = modelId;
  const isReasoning = MODEL.includes('pro');

  try {
    let responseStream: any;
    
    const tools: any[] = [];
    if (useSearch) tools.push({ googleSearch: {} });

    const config: any = {
      systemInstruction: finalSystemInstruction,
      temperature: 0,
      topP: 0.95,
      topK: 40,
    };
    
    if (isReasoning) {
        config.thinkingConfig = { thinkingBudget: 16000 };
    }
    
    if (tools.length > 0) config.tools = tools;

    const parts: Part[] = [{ text: prompt }];

    if (attachment) {
        const cleanBase64 = attachment.data.includes(',') ? attachment.data.split(',')[1] : attachment.data;
        parts.push({ 
            inlineData: { 
                mimeType: attachment.mimeType, 
                data: cleanBase64 
            } 
        });
    }

    // Logger
    logger.add('info', `Iniciando request para ${MODEL}`, { reasoning: isReasoning, search: useSearch, historyLen: currentHistory.length });

    if (currentHistory.length === 0) {
         responseStream = await ai.models.generateContentStream({
            model: MODEL,
            contents: [{ role: 'user', parts: parts }],
            config: config
        });
    } else {
        const validHistory = formatHistory(currentHistory);
        const chat = ai.chats.create({
            model: MODEL,
            history: validHistory,
            config: config
        });

        responseStream = await chat.sendMessageStream({ message: parts as any }); 
    }

    return (async function* () {
        let fullText = "";
        for await (const chunk of responseStream) {
            if (signal?.aborted) break;
            
            if (chunk.text) {
                fullText += chunk.text;
                yield chunk.text;
            }
            
            if (chunk.usageMetadata) {
                updateUsage(MODEL, chunk.usageMetadata.promptTokenCount, chunk.usageMetadata.candidatesTokenCount);
                if (onUsageUpdate) onUsageUpdate(chunk.usageMetadata.promptTokenCount, chunk.usageMetadata.candidatesTokenCount);
            }
        }
        logger.add('success', 'Resposta concluída', { length: fullText.length });
    })();

  } catch (error: any) {
    if (error.name !== 'AbortError') {
        logger.add('error', 'Erro Gemini API', error.message || error);
        console.error("Erro Crítico Gemini:", error);
    }
    throw error;
  }
};

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportConversation = (messages: Message[], format: 'pdf' | 'md' | 'txt' | 'jsonl', filename: string) => {
    const BOM = "\uFEFF"; 

    if (format === 'jsonl') {
        const content = messages.map(m => JSON.stringify({
            role: m.role,
            content: m.text,
            timestamp: new Date(m.timestamp).toISOString()
        })).join('\n');
        downloadBlob(new Blob([content], { type: 'application/json' }), `${filename}.jsonl`);
    } 
    else if (format === 'txt') {
        const content = BOM + messages.map(m => 
            `[${new Date(m.timestamp).toLocaleString()}] ${m.role === 'user' ? 'Nathália' : 'Ainsten'}:\n${m.text}\n`
        ).join('\n----------------------------------------\n\n');
        downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), `${filename}.txt`);
    }
    else if (format === 'md') {
        const content = BOM + messages.map(m => `### ${m.role === 'user' ? 'Nathália' : 'Ainsten'}\n\n${m.text}`).join('\n\n---\n\n');
        downloadBlob(new Blob([content], { type: 'text/markdown;charset=utf-8' }), `${filename}.md`);
    } 
    else {
        const doc = new jsPDF();
        let y = 20;
        
        doc.setFontSize(16);
        doc.setTextColor(0, 100, 255);
        doc.text("AINSTEN CORE - LOG", 20, y);
        y += 15;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        messages.forEach(m => {
            if (y > 270) { doc.addPage(); y = 20; }
            
            const role = m.role === 'user' ? 'NATHÁLIA' : 'AINSTEN';
            doc.setFont("helvetica", "bold");
            doc.text(`[${new Date(m.timestamp).toLocaleTimeString()}] ${role}:`, 20, y);
            y += 7;
            
            doc.setFont("helvetica", "normal");
            const cleanText = m.text.replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F]/g, ''); 
            const lines = doc.splitTextToSize(cleanText, 170);
            doc.text(lines, 20, y);
            y += (lines.length * 5) + 10;
        });

        doc.save(`${filename}.pdf`);
    }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key Ausente");
    
    const ai = new GoogleGenAI({ apiKey });
    const model = MODEL_IDS.FLASH_3_0;
    
    const mimeMatch = base64Audio.match(/^data:(.*?);base64,(.*)$/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'audio/webm';
    const data = mimeMatch ? mimeMatch[2] : base64Audio;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: {
            parts: [
                { inlineData: { mimeType, data } },
                { text: "Transcribe the audio to text verbatim." }
            ]
        }
    });
    
    return response.text || "";
};