'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CrowdLevel, ManagementRushAlert } from '@/lib/rush-types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export type NotificationType = 
  | 'train_arriving'
  | 'delay'
  | 'platform_change'
  | 'door_side'
  | 'crowd_alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Storage Keys
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NOTIFICATIONS_KEY = 'bmrcl_notifications';
const RUSH_ALERTS_KEY = 'bmrcl_rush_alerts';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sample Notification Templates
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NOTIFICATION_TEMPLATES: Array<{
  type: NotificationType;
  title: string;
  messages: string[];
}> = [
  {
    type: 'train_arriving',
    title: '🚆 Train Arriving',
    messages: [
      'Your train to Whitefield arrives at Platform 2 in 3 mins',
      'Train to MG Road arriving at Platform 1 in 2 mins',
      'Kempegowda bound train arriving at Platform 2 in 4 mins',
      'Next train to Nagasandra in 5 mins at Platform 1',
    ],
  },
  {
    type: 'delay',
    title: '⏱️ Delay Alert',
    messages: [
      'Purple Line: 8-min delay near Baiyappanahalli due to signal issue',
      'Green Line: 5-min delay at Peenya due to technical maintenance',
      'Service disruption between MG Road and Indiranagar. Expect 10-min delays',
      'Minor delay on Purple Line. Services resuming shortly',
    ],
  },
  {
    type: 'platform_change',
    title: '📢 Platform Change',
    messages: [
      'Train to Silk Institute now departing from Platform 2 (changed from Platform 1)',
      'Whitefield bound train shifted to Platform 1',
      'Platform change: Nagasandra train now at Platform 2',
    ],
  },
  {
    type: 'door_side',
    title: '🚪 Door Side Info',
    messages: [
      'Train to MG Road: Board from Coach 3, doors open LEFT side',
      'At Majestic: Exit doors on RIGHT for Green Line interchange',
      'Whitefield direction: Doors will open on LEFT at next station',
      'Kempegowda: Doors open on BOTH sides for 60 seconds',
    ],
  },
  {
    type: 'crowd_alert',
    title: '👥 Crowd Alert',
    messages: [
      'Majestic station: HIGH crowd density. Consider alternative routes',
      'MG Road: Moderate crowd expected due to event nearby',
      'Peak hours at Indiranagar. Board from rear coaches for more space',
      'Kempegowda Bus Station: Expected rush. Plan extra travel time',
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateRandomNotification(): Notification {
  const template = NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)];
  const message = template.messages[Math.floor(Math.random() * template.messages.length)];

  return {
    id: generateNotificationId(),
    type: template.type,
    title: template.title,
    message,
    read: false,
    timestamp: new Date().toISOString(),
  };
}

function loadNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) {
      return JSON.parse(stored) as Notification[];
    }
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
  return [];
}

function saveNotifications(notifications: Notification[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Keep only the last 50 notifications
    const trimmed = notifications.slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save notifications:', error);
  }
}

function getSuggestedActions(rushPercent: number, stationName: string): string[] {
  if (rushPercent >= 95) {
    return [
      `Halt entry at all gates at ${stationName} immediately`,
      'Deploy RPF and crowd control personnel to platform',
      'Broadcast alternate station announcement on PA system',
      'Coordinate with police for crowd management',
      'Notify adjacent stations to prepare for overflow',
    ];
  }

  if (rushPercent >= 90) {
    return [
      `Deploy all available staff to ${stationName} concourse`,
      'Open all entry and exit gates to maximum width',
      'Broadcast expected wait times on station PA',
      'Alert feeder bus operators for rerouting',
      'Monitor situation every 2 minutes',
    ];
  }

  return [
    `Send 2 additional staff to ${stationName} entry`,
    'Open secondary concourse if available',
    'Monitor crowd trend - prepare escalation plan',
  ];
}

function normalizeCrowdLevel(value: string): CrowdLevel {
  if (value === 'CRITICAL' || value === 'HEAVY' || value === 'MODERATE' || value === 'LIGHT') {
    return value;
  }
  return 'MODERATE';
}

function appendToBellNotifications(title: string, message: string): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const existing = loadNotifications();
    const notif: Notification = {
      id: generateNotificationId(),
      type: 'delay',
      title,
      message,
      read: false,
      timestamp: new Date().toISOString(),
    };
    saveNotifications([notif, ...existing]);
  } catch {
    // Keep rush alert flow non-blocking.
  }
}

export function triggerRushManagementAlert(data: {
  stationId: string;
  stationName: string;
  rushPercent: number;
  crowdLevel: string;
  message: string;
}): void {
  const severity: ManagementRushAlert['severity'] = data.rushPercent >= 95
    ? 'EMERGENCY'
    : data.rushPercent >= 90
      ? 'URGENT'
      : 'WARNING';

  const alert: ManagementRushAlert = {
    id: `RA-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    stationId: data.stationId,
    stationName: data.stationName,
    rushPercent: Math.round(data.rushPercent),
    crowdLevel: normalizeCrowdLevel(data.crowdLevel),
    message: data.message,
    suggestedActions: getSuggestedActions(data.rushPercent, data.stationName),
    triggeredAt: new Date().toISOString(),
    isRead: false,
    severity,
  };

  try {
    if (typeof localStorage !== 'undefined') {
      const existing = getRushAlerts();
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const recentForStation = existing.find(
        a => a.stationId === data.stationId && new Date(a.triggeredAt).getTime() > fiveMinAgo
      );

      if (!recentForStation) {
        const trimmed = [alert, ...existing].slice(0, 50);
        localStorage.setItem(RUSH_ALERTS_KEY, JSON.stringify(trimmed));
      }
    }
  } catch {
    // Server-side or restricted environments can skip localStorage.
  }

  try {
    appendToBellNotifications(
      severity === 'EMERGENCY'
        ? 'EMERGENCY: Immediate Action Required'
        : severity === 'URGENT'
          ? 'URGENT: Capacity Breach'
          : 'WARNING: High Crowd Density',
      data.message,
    );
  } catch {
    // Keep non-blocking.
  }
}

export function getRushAlerts(): ManagementRushAlert[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem(RUSH_ALERTS_KEY);
    return data ? (JSON.parse(data) as ManagementRushAlert[]) : [];
  } catch {
    return [];
  }
}

export function markRushAlertRead(alertId: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const alerts = getRushAlerts();
    const updated = alerts.map(a => (a.id === alertId ? { ...a, isRead: true } : a));
    localStorage.setItem(RUSH_ALERTS_KEY, JSON.stringify(updated));
  } catch {
    // Keep non-blocking.
  }
}

export function getUnreadRushAlertCount(): number {
  return getRushAlerts().filter(a => !a.isRead).length;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hook
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications on mount
  useEffect(() => {
    const loaded = loadNotifications();
    
    // If no notifications exist, seed with a few initial ones
    if (loaded.length === 0) {
      const initial: Notification[] = [];
      for (let i = 0; i < 4; i++) {
        const notif = generateRandomNotification();
        // Stagger timestamps for realism
        notif.timestamp = new Date(Date.now() - i * 300000).toISOString();
        initial.push(notif);
      }
      setNotifications(initial);
      saveNotifications(initial);
    } else {
      setNotifications(loaded);
    }
  }, []);

  // Simulate new notifications every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newNotif = generateRandomNotification();
      setNotifications(prev => {
        const updated = [newNotif, ...prev];
        saveNotifications(updated);
        return updated;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
  };
}
