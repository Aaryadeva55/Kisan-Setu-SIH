export enum Role {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  FPO = 'FPO',
  ADMIN = 'ADMIN',
  GOVERNMENT_EVALUATOR = 'GOVERNMENT_EVALUATOR',
}

export enum Language {
  MARATHI = 'MARATHI',
  HINDI = 'HINDI',
  ENGLISH = 'ENGLISH',
}

export enum TransactionStatus {
  REQUESTED = 'REQUESTED',
  MATCHED = 'MATCHED',
  PENDING_BUYER = 'PENDING_BUYER',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const QUEUE_NAMES = {
  PRICE_INGESTION: 'price-ingestion',
  WEATHER_INGESTION: 'weather-ingestion',
  RECOMMENDATIONS: 'recommendations',
  BUYER_MATCHING: 'buyer-matching',
  NOTIFICATIONS: 'notifications',
  WHATSAPP: 'whatsapp',
  CLEANUP: 'cleanup',
} as const;


export interface JwtPayload {
  userId: string;
  role: Role;
  phone?: string;
  email?: string;
}

export interface AuthSession {
  user: {
    id: string;
    phone: string;
    email: string | null;
    role: Role;
    preferredLang: Language;
    farmerProfile?: any;
    buyer?: any;
    fpo?: any;
  };
  accessToken: string;
}

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  applies: boolean;
  delta: number;
  reasonText: string;
  metadata?: Record<string, unknown>;
}

export interface AdvisoryResult {
  cropId: string;
  cropName?: string;
  suitabilityScore: number;
  reason: string;
  ruleTrace: RuleResult[];
}

export interface MatchScoreBreakdown {
  locationScore: number;
  quantityScore: number;
  priceScore: number;
  qualityScore: number;
  timingScore: number;
  baseScore?: number;
}

export interface MatchScoreResult {
  score: number;
  breakdown: MatchScoreBreakdown;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SystemHealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  uptimeSeconds: number;
  timestamp: string;
  database: {
    connected: boolean;
    latencyMs?: number;
  };
  redis: {
    connected: boolean;
    mode: 'redis' | 'in-memory-fallback';
  };
  queues: Array<{
    name: string;
    waiting: number;
    active: number;
    failed: number;
    completed: number;
    lastRun?: string;
    status: 'ACTIVE' | 'IDLE' | 'FAILED';
  }>;
}

export interface OverviewMetrics {
  totalFarmers: number;
  totalFarmersDelta: number;
  advisoriesDelivered: number;
  activeSellIntents: number;
  gmvClosed: number;
  funnel: {
    requested: number;
    matched: number;
    accepted: number;
    inProgress: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
  topDistricts: Array<{
    districtName: string;
    farmerCount: number;
    transactionCount: number;
    gmv: number;
  }>;
}
