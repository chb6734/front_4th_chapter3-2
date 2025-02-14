import { EventForm, Event } from '../types';
import { formatDate } from './dateUtils';

export function generateRepeatingEvents(event: Event): EventForm[] {
  const { repeat } = event;

  if (repeat.type === 'none') {
    return [event];
  } else if (repeat.type === 'daily') {
    return getDailyRepeatingEvents(event);
  } else if (repeat.type === 'weekly') {
    return getWeeklyRepeatingEvents(event);
  } else if (repeat.type === 'monthly') {
    return getMonthlyRepeatingEvents(event);
  }

  return [event];
}

export function getDailyRepeatingEvents(event: Event): EventForm[] {
  const { date, repeat } = event;
  const { interval, endDate } = repeat;

  const convertedDate = new Date(date);

  const repeatingEvents: EventForm[] = [];

  for (let i = 0; i < interval; i++) {
    const repeatingDate = convertedDate;
    console.log(repeatingDate);
    repeatingEvents.push({
      ...event,
      date: formatDate(repeatingDate),
    });

    if (convertedDate.toISOString() === endDate) break;
    convertedDate.setDate(convertedDate.getDate() + 1);
  }

  return repeatingEvents;
}

export function getWeeklyRepeatingEvents(event: Event): EventForm[] {
  const { date, repeat } = event;
  const { interval, endDate } = repeat;

  const convertedDate = new Date(date);

  const repeatingEvents: EventForm[] = [];

  for (let i = 0; i < interval; i++) {
    if (convertedDate.toISOString() === endDate) break;
    const repeatingDate = new Date(convertedDate);
    repeatingEvents.push({
      ...event,
      date: repeatingDate.toISOString(),
    });
    convertedDate.setDate(convertedDate.getDate() + 7);
  }

  return repeatingEvents;
}

export function getMonthlyRepeatingEvents(event: Event): EventForm[] {
  const { date, repeat } = event;
  const { interval, endDate } = repeat;

  const convertedDate = new Date(date);

  const repeatingEvents: EventForm[] = [];

  for (let i = 0; i < interval; i++) {
    if (convertedDate.toISOString() === endDate) break;
    const repeatingDate = new Date(convertedDate);
    repeatingEvents.push({
      ...event,
      date: repeatingDate.toISOString(),
    });
    convertedDate.setMonth(convertedDate.getMonth() + 1);
  }

  return repeatingEvents;
}
