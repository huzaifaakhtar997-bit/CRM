export enum LifecycleStage {
  LEAD = "LEAD",
  MARKETING_QUALIFIED = "MARKETING_QUALIFIED",
  SALES_QUALIFIED = "SALES_QUALIFIED",
  OPPORTUNITY = "OPPORTUNITY",
  CUSTOMER = "CUSTOMER",
  EVANGELIST = "EVANGELIST",
  OTHER = "OTHER",
}

export enum LeadSource {
  ORGANIC_SEARCH = "ORGANIC_SEARCH",
  PAID_SEARCH = "PAID_SEARCH",
  SOCIAL_MEDIA = "SOCIAL_MEDIA",
  REFERRAL = "REFERRAL",
  DIRECT = "DIRECT",
  OFFLINE = "OFFLINE",
  OTHER = "OTHER",
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  companyId: string | null;
  companyName?: string | null; // Used in some custom responses
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
  } | null;
  assignedUserId: string | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  leadSource: LeadSource | null;
  lifecycleStage: LifecycleStage;
  status: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  annualRevenue: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contacts: number;
    deals: number;
  };
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string | null;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate: string;
  closedAt: string | null;
  priority: Priority;
  notes: string | null;
  lostReason: string | null;
  hubspotId: string | null;
  stageId: string;
  contactId: string | null;
  companyId: string | null;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  stage: PipelineStage;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    avatarUrl: string | null;
  } | null;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
  } | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

export enum TaskType {
  CALL = "CALL",
  EMAIL = "EMAIL",
  MEETING = "MEETING",
  OTHER = "OTHER",
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  taskType: TaskType;
  dueDate: string | null;
  dueTime: string | null;
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  companyName: string | null;
  
  createdAt: string;
  updatedAt: string;
  
  assignedUserId: string | null;
  contactId: string | null;
  dealId: string | null;

  assignedUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  deal?: {
    id: string;
    title: string;
    value: number;
    stageId: string;
  } | null;
}

// Inbox / Conversation Enums
export enum ConversationChannel {
  EMAIL = "EMAIL",
}

export enum ConversationStatus {
  OPEN = "OPEN",
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum SenderType {
  CUSTOMER = "CUSTOMER",
  USER = "USER",
}

export interface Conversation {
  id: string;
  subject: string | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  
  contactId: string | null;
  assignedUserId: string | null;

  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    avatarUrl: string | null;
  } | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

export interface Message {
  id: string;
  content: string;
  senderType: SenderType;
  senderName: string | null;
  senderEmail: string | null;
  isInternalNote: boolean;
  createdAt: string;

  conversationId: string;
}


export interface ListResponse<T> {
  success: boolean;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } & Record<string, T[]>;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

// Leads
export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  QUALIFIED = "QUALIFIED",
  LOST = "LOST",
}



export interface Lead {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  source: LeadSource | null;
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUserId: string | null;
  convertedContactId: string | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

// Imports
export enum ImportJobStatus {
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export type ImportType = "contacts" | "companies";

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportJob {
  id: string;
  fileName: string;
  importType: ImportType;
  status: ImportJobStatus;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;
  errorLog: ImportError[] | null;
  completedAt: string | null;
  createdAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

// ── Integrations / HubSpot ────────────────────────────────────────────────────

export type IntegrationProvider = "HUBSPOT";

export type IntegrationConnectionStatus = "CONNECTED" | "DISCONNECTED";

/** Returned by GET /integrations/hubspot, POST /integrations/hubspot/connect, DELETE /integrations/hubspot */
export interface IntegrationStatus {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationConnectionStatus;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SyncLogStatus = "SUCCESS" | "FAILED" | "SKIPPED";

/** Returned by GET /integrations/hubspot/{contacts|companies|deals}/sync-status */
export interface SyncStatusDetails {
  provider: string;
  status: IntegrationConnectionStatus;
  lastSyncAt: string | null;
  latestLog: {
    status: SyncLogStatus;
    message: string | null;
    createdAt: string;
  } | null;
}

/** Returned by import / export / sync action endpoints */
export interface SyncSummary {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface FieldMapping {
  entityType: "contact" | "company" | "deal";
  crmField: string;
  hubspotProperty: string;
}

export interface StageMapping {
  pipelineStageName: string;
  hubspotStage: string;
}

export interface HubSpotMappings {
  fieldMappings: FieldMapping[];
  stageMappings: StageMapping[];
}

// ── Campaigns ────────────────────────────────────────────────────────────────

export enum CampaignStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  PAUSED = "PAUSED",
}

export enum CampaignRecipientStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  OPENED = "OPENED",
  CLICKED = "CLICKED",
  REPLIED = "REPLIED",
  BOUNCED = "BOUNCED",
  FAILED = "FAILED",
}

export interface Campaign {
  id: string;
  name: string;
  objective: string | null;
  status: CampaignStatus;
  subject: string | null;
  previewText: string | null;
  content: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CampaignRecipient {
  id: string;
  status: CampaignRecipientStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  repliedAt: string | null;
  campaignId: string;
  contactId: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
}

export interface CampaignTrackingSummary {
  campaignId: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

