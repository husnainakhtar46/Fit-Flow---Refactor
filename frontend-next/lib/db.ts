import Dexie, { Table } from 'dexie';

export interface OfflineInspection {
  id?: number;
  server_id?: number;
  formData: any;
  images: Array<{
    file: Blob;
    caption: string;
    category: string;
  }>;
  createdAt: number;
  status: 'pending_sync' | 'synced';
  type: 'evaluation' | 'final_inspection';
}

export interface CachedCustomer {
  id: string;
  name: string;
  cachedAt: number;
}

export interface CachedFactory {
  id: string;
  name: string;
  cachedAt: number;
}

export interface CachedTemplate {
  id: string;
  name: string;
  customer: string;
  poms: Array<{
    id: string;
    name: string;
    default_std: number;
    default_tol: number;
  }>;
  cachedAt: number;
}

export interface DraftEntry {
  draftKey: string;
  formData: any;
  imageSlots: any;
  serverId?: string;
  updatedAt: number;
  formType: 'evaluation' | 'final_inspection';
}

export class AppDatabase extends Dexie {
  inspections!: Table<OfflineInspection>;
  customers!: Table<CachedCustomer>;
  factories!: Table<CachedFactory>;
  templates!: Table<CachedTemplate>;
  drafts!: Table<DraftEntry>;

  constructor() {
    super('FitFlowDB');
    this.version(4).stores({
      inspections: '++id, createdAt, status',
      customers: 'id, cachedAt',
      factories: 'id, cachedAt',
      templates: 'id, customer, cachedAt',
      drafts: 'draftKey, updatedAt, formType',
    });
  }
}

export const db = new AppDatabase();

export async function cacheCustomers(customers: CachedCustomer[]) {
  const now = Date.now();
  await db.customers.bulkPut(customers.map((c) => ({ ...c, cachedAt: now })));
}

export async function cacheTemplates(templates: CachedTemplate[]) {
  const now = Date.now();
  await db.templates.bulkPut(templates.map((t) => ({ ...t, cachedAt: now })));
}

export async function cacheFactories(factories: CachedFactory[]) {
  const now = Date.now();
  await db.factories.bulkPut(factories.map((f) => ({ ...f, cachedAt: now })));
}

export async function getCachedFactories(): Promise<CachedFactory[]> {
  return db.factories.toArray();
}

export async function getCachedCustomers(): Promise<CachedCustomer[]> {
  return db.customers.toArray();
}

export async function getCachedTemplates(): Promise<CachedTemplate[]> {
  return db.templates.toArray();
}

export async function saveDraftLocally(draft: DraftEntry): Promise<void> {
  await db.drafts.put(draft);
}

export async function getDraft(draftKey: string): Promise<DraftEntry | undefined> {
  return db.drafts.get(draftKey);
}

export async function deleteDraft(draftKey: string): Promise<void> {
  await db.drafts.delete(draftKey);
}

export async function getAllDrafts(formType: 'evaluation' | 'final_inspection'): Promise<DraftEntry[]> {
  return db.drafts.where('formType').equals(formType).reverse().sortBy('updatedAt');
}
