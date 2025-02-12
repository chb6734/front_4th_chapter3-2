import { EventForm, Event } from '../types';

export function generateRepeatingEvents(event: Event): EventForm[] {
  return [event];
}

export function getDailyRepeatingEvents(event: Event): EventForm[] {
  return [event];
}

export function getWeeklyRepeatingEvents(event: Event): EventForm[] {
  return [event];
}

export function getMonthlyRepeatingEvents(event: Event): EventForm[] {
  return [event];
}
