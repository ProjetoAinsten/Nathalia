import { get, set } from 'idb-keyval';
import { Message, AppModule, UsageLog } from '../types';
import { initUsage } from './geminiService';

const CHAT_PREFIX = 'ECHO_CHAT_';
const ARCHIVE_PREFIX = 'ECHO_ARCHIVE_';
const MODULES_KEY = 'AINSTEN_MODULE_CONFIG';
const USAGE_KEY = 'AINSTEN_USAGE_V2';

export interface ArchivedSession { id: string; timestamp: number; preview: string; messages: Message[]; }
export interface SearchResult { moduleId: string; message: Message; contextDate: string; }

export const storageService = {
  async saveChat(moduleId: string, messages: Message[]) { try { await set(CHAT_PREFIX + moduleId, messages); } catch {} },
  async getChat(moduleId: string): Promise<Message[]> { try { return (await get(CHAT_PREFIX + moduleId)) || []; } catch { return []; } },
  
  async searchAllMessages(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];
    const results: SearchResult[] = []; const lower = query.toLowerCase();
    const keys = await import('idb-keyval').then(m => m.keys());
    for (const key of keys) {
        if (typeof key === 'string' && key.startsWith(CHAT_PREFIX)) {
            const msgs: Message[] = await get(key);
            msgs?.forEach(m => { if (m.text?.toLowerCase().includes(lower)) results.push({ moduleId: key.replace(CHAT_PREFIX,''), message: m, contextDate: new Date(m.timestamp).toLocaleDateString() }); });
        }
    }
    return results.sort((a,b) => b.message.timestamp - a.message.timestamp);
  },

  async archiveCurrentSession(moduleId: string, messages: Message[]): Promise<ArchivedSession[]> {
    if (!messages.length) return await this.getArchivedSessions(moduleId);
    const session = { id: Date.now().toString(), timestamp: Date.now(), preview: messages.find(m=>m.role==='user')?.text.slice(0,40) || 'Chat', messages };
    const archives = (await get(ARCHIVE_PREFIX + moduleId)) || [];
    const newList = [session, ...archives];
    await set(ARCHIVE_PREFIX + moduleId, newList);
    return newList;
  },

  async getArchivedSessions(moduleId: string): Promise<ArchivedSession[]> { return (await get(ARCHIVE_PREFIX + moduleId)) || []; },
  async deleteArchivedSession(moduleId: string, sessionId: string) {
      const list = (await get(ARCHIVE_PREFIX + moduleId)) || [];
      const updated = list.filter((s:any) => s.id !== sessionId);
      await set(ARCHIVE_PREFIX + moduleId, updated); return updated;
  },

  getModules(defaults: AppModule[]): AppModule[] { try { const s = localStorage.getItem(MODULES_KEY); return s ? JSON.parse(s) : defaults; } catch { return defaults; } },
  saveModules(modules: AppModule[]) { localStorage.setItem(MODULES_KEY, JSON.stringify(modules)); },

  async createBackup(): Promise<string> {
    const backup: any = { timestamp: Date.now(), modules: this.getModules([]), usage: JSON.parse(localStorage.getItem(USAGE_KEY) || '{}'), chats: {}, archives: {} };
    const keys = await import('idb-keyval').then(m => m.keys());
    for (const k of keys) {
        if (typeof k === 'string') {
            if (k.startsWith(CHAT_PREFIX)) backup.chats[k.replace(CHAT_PREFIX,'')] = await get(k);
            if (k.startsWith(ARCHIVE_PREFIX)) backup.archives[k.replace(ARCHIVE_PREFIX,'')] = await get(k);
        }
    }
    return JSON.stringify(backup);
  },
  
  async restoreBackup(json: string): Promise<boolean> {
      try {
          const data = JSON.parse(json);
          if (data.modules) this.saveModules(data.modules);
          if (data.usage) localStorage.setItem(USAGE_KEY, JSON.stringify(data.usage));
          if (data.chats) for (const [k,v] of Object.entries(data.chats)) await set(CHAT_PREFIX+k, v);
          if (data.archives) for (const [k,v] of Object.entries(data.archives)) await set(ARCHIVE_PREFIX+k, v);
          return true;
      } catch { return false; }
  }
};