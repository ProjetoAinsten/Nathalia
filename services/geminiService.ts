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

export const logger = {
  getLogs: (): SystemLog[] => {
    try { return JSON.parse(localStorage.getItem('AINSTEN_SYSTEM_LOGS') || '[]'); } catch { return []; }
  },
  add: (level: LogLevel, message: string, details?: any) => {
    const logs = logger.getLogs();
    const newLog: SystemLog = { id: Date.now().toString(), timestamp: Date.now(), level, message, details: JSON.stringify(details) };
    localStorage.setItem('AINSTEN_SYSTEM_LOGS', JSON.stringify([newLog, ...logs].slice(0, 50)));
    return newLog;
  }
};

export const estimateTokens = (text: string): number => Math.ceil(text.length / 3.5);

export const initUsage = (): UsageLog => {
    try {
        const saved = localStorage.getItem('AINSTEN_USAGE_V2');
        if (saved) return JSON.parse(saved);
    } catch {}
    return {
        totalInputTokens: 0, totalOutputTokens: 0, totalCostBRL: 0,
        initialBonusBRL: INITIAL_BONUS, remainingBonusBRL: INITIAL_BONUS,
        breakdown: { flash: { input: 0, output: 0, cost: 0 }, pro: { input: 0, output: 0, cost: 0 }, audio: { cost: 0 } },
        lastUpdate: Date.now()
    };
};

export const updateUsage = (model: string, input: number, output: number) => {
    try {
        const safeInput = input || 0; const safeOutput = output || 0;
        const costConfig = COSTS[model as keyof typeof COSTS] || COSTS[MODEL_IDS.FLASH_3_0];
        const totalUSD = ((safeInput / 1e6) * costConfig.input) + ((safeOutput / 1e6) * costConfig.output);
        const totalBRL = (totalUSD * USD_TO_BRL) + CLOUD_RUN_ESTIMATE_PER_MSG_BRL;

        const usage = initUsage();
        usage.totalInputTokens += safeInput; usage.totalOutputTokens += safeOutput; usage.totalCostBRL += totalBRL;
        usage.remainingBonusBRL -= totalBRL; usage.lastUpdate = Date.now();
        localStorage.setItem('AINSTEN_USAGE_V2', JSON.stringify(usage));
    } catch (e) { console.error(e); }
};

const formatHistory = (messages: Message[]): Content[] => {
  return messages.filter(msg => !msg.hasError && msg.text.trim()).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.role === 'user' && msg.image 
        ? [{ text: msg.text }, { inlineData: { mimeType: 'image/jpeg', data: msg.image.split(',')[1] } }]
        : [{ text: msg.text }]
  }));
};

export const streamChatResponse = async (
  currentHistory: Message[], prompt: string, systemInstruction: string,
  attachment: { mimeType: string; data: string } | null | undefined,
  modelId: string, useSearch: boolean = false,
  onUsageUpdate?: (i: number, o: number) => void, signal?: AbortSignal
): Promise<AsyncGenerator<string, void, unknown>> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key Ausente");

  const ai = new GoogleGenAI({ apiKey });
  const timeNow = new Date().toLocaleString('pt-BR');
  const finalInst = `${systemInstruction}\n[SISTEMA] Hora: ${timeNow}. Modelo: ${modelId}`;
  
  const isReasoning = modelId.includes('pro');
  const config: any = { systemInstruction: finalInst, temperature: 0, topP: 0.95 };
  if (isReasoning) config.thinkingConfig = { thinkingBudget: 16000 };
  if (useSearch) config.tools = [{ googleSearch: {} }];

  const parts: Part[] = [{ text: prompt }];
  if (attachment) parts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data.split(',')[1] } });

  const history = currentHistory.length > 0 ? formatHistory(currentHistory) : undefined;
  
  let responseStream;
  if (!history) {
     responseStream = await ai.models.generateContentStream({ model: modelId, contents: [{ role: 'user', parts }], config });
  } else {
     const chat = ai.chats.create({ model: modelId, history, config });
     responseStream = await chat.sendMessageStream({ message: parts as any });
  }

  return (async function* () {
      for await (const chunk of responseStream) {
          if (signal?.aborted) break;
          if (chunk.text) yield chunk.text;
          if (chunk.usageMetadata) {
              updateUsage(modelId, chunk.usageMetadata.promptTokenCount, chunk.usageMetadata.candidatesTokenCount);
              if (onUsageUpdate) onUsageUpdate(chunk.usageMetadata.promptTokenCount, chunk.usageMetadata.candidatesTokenCount);
          }
      }
  })();
};

export const exportConversation = (messages: Message[], format: 'pdf' | 'md' | 'txt' | 'jsonl', filename: string) => {
    const BOM = "\uFEFF"; 
    let content, type, ext;
    if (format === 'jsonl') {
        content = messages.map(m => JSON.stringify({ role: m.role, content: m.text, timestamp: new Date(m.timestamp).toISOString() })).join('\n');
        type = 'application/json'; ext = 'jsonl';
    } else if (format === 'txt') {
        content = BOM + messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.role}:\n${m.text}`).join('\n\n---\n\n');
        type = 'text/plain'; ext = 'txt';
    } else if (format === 'md') {
        content = BOM + messages.map(m => `### ${m.role}\n\n${m.text}`).join('\n\n---\n\n');
        type = 'text/markdown'; ext = 'md';
    } else {
        const doc = new jsPDF();
        let y = 20;
        doc.text("AINSTEN LOG", 20, y); y += 10;
        messages.forEach(m => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFontSize(10); doc.text(`[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role}:`, 20, y); y += 5;
            const lines = doc.splitTextToSize(m.text.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ''), 170);
            doc.text(lines, 20, y); y += (lines.length * 4) + 5;
        });
        doc.save(`${filename}.pdf`); return;
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = `${filename}.${ext}`; a.click();
};