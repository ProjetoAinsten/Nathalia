import { get, set } from 'idb-keyval';
import { Message, AppModule, UsageLog } from '../types';
import { initUsage } from './geminiService';

const CHAT_PREFIX = 'ECHO_CHAT_';
const ARCHIVE_PREFIX = 'ECHO_ARCHIVE_';
const MODULES_KEY = 'AINSTEN_MODULE_CONFIG';
const USAGE_KEY = 'AINSTEN_USAGE_V2';

export interface ArchivedSession {
  id: string;
  timestamp: number;
  preview: string;
  messages: Message[];
}

export interface SearchResult {
  moduleId: string;
  message: Message;
  contextDate: string;
}

export const storageService = {
  // SALVAR CHAT ATUAL (Persistência Automática)
  async saveChat(moduleId: string, messages: Message[]) {
    try { await set(CHAT_PREFIX + moduleId, messages); } 
    catch (e) { console.error("DB Error:", e); }
  },

  // CARREGAR CHAT ATUAL
  async getChat(moduleId: string): Promise<Message[]> {
    try { return (await get(CHAT_PREFIX + moduleId)) || []; } 
    catch (e) { return []; }
  },

  // --- BUSCA GLOBAL ---
  async searchAllMessages(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];
    
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    
    try {
        const keys = await import('idb-keyval').then(m => m.keys());
        
        for (const key of keys) {
            if (typeof key === 'string' && key.startsWith(CHAT_PREFIX)) {
                const moduleId = key.replace(CHAT_PREFIX, '');
                const messages: Message[] = await get(key);
                
                if (messages && Array.isArray(messages)) {
                    messages.forEach(msg => {
                        if (msg.text && msg.text.toLowerCase().includes(lowerQuery)) {
                            results.push({
                                moduleId: moduleId,
                                message: msg,
                                contextDate: new Date(msg.timestamp).toLocaleDateString('pt-BR')
                            });
                        }
                    });
                }
            }
        }
    } catch (e) {
        console.error("Erro na busca global:", e);
    }
    
    // Ordena por data (mais recente primeiro)
    return results.sort((a, b) => b.message.timestamp - a.message.timestamp);
  },

  // --- ARQUIVAR SESSÃO ---
  async archiveCurrentSession(moduleId: string, messages: Message[]): Promise<ArchivedSession[]> {
    if (!messages || messages.length === 0) return await this.getArchivedSessions(moduleId);
    
    const sessionId = Date.now().toString();
    const firstUserMsg = messages.find(m => m.role === 'user');
    const preview = firstUserMsg 
      ? firstUserMsg.text.slice(0, 40) + (firstUserMsg.text.length > 40 ? '...' : '') 
      : 'Nova Conversa';
    
    const sessionData: ArchivedSession = {
      id: sessionId,
      timestamp: Date.now(),
      preview,
      messages
    };

    try {
        const archives: ArchivedSession[] = (await get(ARCHIVE_PREFIX + moduleId)) || [];
        const newList = [sessionData, ...archives];
        await set(ARCHIVE_PREFIX + moduleId, newList);
        return newList;
    } catch (e) {
        return [];
    }
  },

  async getArchivedSessions(moduleId: string): Promise<ArchivedSession[]> {
      try { return (await get(ARCHIVE_PREFIX + moduleId)) || []; }
      catch { return []; }
  },

  async deleteArchivedSession(moduleId: string, sessionId: string): Promise<ArchivedSession[]> {
      try {
          const archives: ArchivedSession[] = (await get(ARCHIVE_PREFIX + moduleId)) || [];
          const newList = archives.filter(s => s.id !== sessionId);
          await set(ARCHIVE_PREFIX + moduleId, newList);
          return newList;
      } catch { return []; }
  },

  // MÓDULOS
  getModules(defaults: AppModule[]): AppModule[] {
    try {
      const saved = localStorage.getItem(MODULES_KEY);
      return saved ? JSON.parse(saved) : defaults;
    } catch { return defaults; }
  },

  saveModules(modules: AppModule[]) {
    localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
  },

  // BACKUP COMPLETO
  async createBackup(): Promise<string> {
    let currentUsage: UsageLog;
    try {
        const savedUsage = localStorage.getItem(USAGE_KEY);
        currentUsage = savedUsage ? JSON.parse(savedUsage) : initUsage();
    } catch { currentUsage = initUsage(); }

    const backupData: any = {
      timestamp: Date.now(),
      version: '1.5',
      modules: this.getModules([]),
      usage: currentUsage,
      chats: {},
      archives: {}
    };

    try {
      const keys = await import('idb-keyval').then(m => m.keys());
      for (const key of keys) {
        if (typeof key === 'string') {
            if (key.startsWith(CHAT_PREFIX)) {
              const moduleId = key.replace(CHAT_PREFIX, '');
              backupData.chats[moduleId] = await get(key);
            } else if (key.startsWith(ARCHIVE_PREFIX)) {
              const moduleId = key.replace(ARCHIVE_PREFIX, '');
              backupData.archives[moduleId] = await get(key);
            }
        }
      }
    } catch (e) {
      console.error("Backup generation error", e);
    }
    return JSON.stringify(backupData);
  },

  // RESTAURAR BACKUP
  async restoreBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (data.modules) this.saveModules(data.modules);
      if (data.usage) localStorage.setItem(USAGE_KEY, JSON.stringify(data.usage));
      
      if (data.chats) {
        for (const [moduleId, messages] of Object.entries(data.chats)) {
          await this.saveChat(moduleId, messages as Message[]);
        }
      }
      if (data.archives) {
        for (const [moduleId, sessions] of Object.entries(data.archives)) {
            await set(ARCHIVE_PREFIX + moduleId, sessions as any);
        }
      }
      return true;
    } catch (e) {
      console.error("Restore error", e);
      return false;
    }
  }
};