/**
 * Push notification strategy for PickleballHQ.
 * Sends notifications only during optimal play times.
 */

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Hours when users are most likely to want to play (in user's local timezone)
const PRIME_HOURS = {
  weekday: { start: 17, end: 19 }, // 5-7 PM after work
  weekend: { start: 8, end: 10 },  // 8-10 AM morning play
};

// Hours to never send notifications
const QUIET_HOURS = { start: 22, end: 8 }; // 10 PM - 8 AM

/**
 * Check if it's a good time to send a push notification.
 * @param date - Date to check (defaults to now)
 * @param timezone - User's timezone (e.g., 'America/Los_Angeles')
 */
export function shouldSendPush(date: Date = new Date()): boolean {
  const hour = date.getHours();
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;

  // Never send during quiet hours
  if (hour >= QUIET_HOURS.start || hour < QUIET_HOURS.end) {
    return false;
  }

  // Only send during prime play hours
  if (isWeekend) {
    return hour >= PRIME_HOURS.weekend.start && hour < PRIME_HOURS.weekend.end;
  } else {
    return hour >= PRIME_HOURS.weekday.start && hour < PRIME_HOURS.weekday.end;
  }
}

/**
 * Generate a relevant push notification message.
 */
export function generatePushMessage(params: {
  activeGames?: number;
  courtName?: string;
  lookingForPartners?: number;
  cityName?: string;
}): PushNotification | null {
  const { activeGames = 0, courtName, lookingForPartners = 0, cityName = 'near you' } = params;

  if (activeGames > 0 && courtName) {
    return {
      title: '🏓 Game starting soon!',
      body: `${activeGames} game${activeGames > 1 ? 's' : ''} at ${courtName}. Join now!`,
      data: { screen: 'play-now' },
    };
  }

  if (lookingForPartners > 0) {
    return {
      title: '🏓 Players nearby',
      body: `${lookingForPartners} player${lookingForPartners > 1 ? 's' : ''} looking for a game ${cityName} now`,
      data: { screen: 'play-now' },
    };
  }

  if (activeGames > 0) {
    return {
      title: '🏓 Active courts nearby',
      body: `${activeGames} court${activeGames > 1 ? 's' : ''} with people playing ${cityName} right now`,
      data: { screen: 'play-now' },
    };
  }

  return null;
}

/**
 * Get next optimal push time.
 */
export function getNextPushTime(): Date {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  const next = new Date(now);

  if (isWeekend) {
    if (hour < PRIME_HOURS.weekend.start) {
      next.setHours(PRIME_HOURS.weekend.start, 0, 0, 0);
    } else if (hour < PRIME_HOURS.weekend.end) {
      // We're in prime time already
      return now;
    } else {
      // Next day
      next.setDate(next.getDate() + 1);
      const nextDay = next.getDay();
      const nextIsWeekend = nextDay === 0 || nextDay === 6;
      next.setHours(nextIsWeekend ? PRIME_HOURS.weekend.start : PRIME_HOURS.weekday.start, 0, 0, 0);
    }
  } else {
    if (hour < PRIME_HOURS.weekday.start) {
      next.setHours(PRIME_HOURS.weekday.start, 0, 0, 0);
    } else if (hour < PRIME_HOURS.weekday.end) {
      return now;
    } else {
      next.setDate(next.getDate() + 1);
      const nextDay = next.getDay();
      const nextIsWeekend = nextDay === 0 || nextDay === 6;
      next.setHours(nextIsWeekend ? PRIME_HOURS.weekend.start : PRIME_HOURS.weekday.start, 0, 0, 0);
    }
  }

  return next;
}
