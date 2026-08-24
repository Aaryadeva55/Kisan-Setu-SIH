export const TRANSACTION_STATUS = {
  REQUESTED: 'REQUESTED',
  MATCHED: 'MATCHED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

export const TRANSACTION_STATUS_CONFIG = {
  [TRANSACTION_STATUS.REQUESTED]: {
    label: 'Requested',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: 'Send',
    description: 'Farmer or FPO has submitted an intent request',
  },
  [TRANSACTION_STATUS.MATCHED]: {
    label: 'Matched',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    icon: 'Sparkles',
    description: 'Algorithmic match identified buyer requirement',
  },
  [TRANSACTION_STATUS.ACCEPTED]: {
    label: 'Accepted',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-600',
    icon: 'CheckCircle2',
    description: 'Buyer accepted request; Farmer notified on WhatsApp',
  },
  [TRANSACTION_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    dot: 'bg-cyan-600',
    icon: 'Truck',
    description: 'Logistics / weighing / mandi hand-off underway',
  },
  [TRANSACTION_STATUS.COMPLETED]: {
    label: 'Completed',
    color: 'bg-agri-100 text-agri-800 border-agri-300 font-semibold',
    dot: 'bg-agri-600',
    icon: 'CheckCheck',
    description: 'Transaction closed and settled successfully',
  },
  [TRANSACTION_STATUS.REJECTED]: {
    label: 'Rejected',
    color: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    icon: 'XCircle',
    description: 'Buyer declined request',
  },
  [TRANSACTION_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
    icon: 'Ban',
    description: 'Farmer or Admin cancelled request',
  },
};
