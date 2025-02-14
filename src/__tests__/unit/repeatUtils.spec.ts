import { describe, it, expect } from 'vitest';

import { Event } from '../../types';
import {
  generateRepeatingEvents,
  getDailyRepeatingEvents,
  getWeeklyRepeatingEvents,
  getMonthlyRepeatingEvents,
} from '../../utils/repeatUtils';

const baseEvent: Event = {
  id: '1',
  title: '테스트 일정',
  date: '2024-01-15',
  startTime: '09:00',
  endTime: '10:00',
  description: '',
  location: '',
  category: '',
  repeat: {
    type: 'none',
    interval: 1,
    endDate: '2024-02-15',
  },
  notificationTime: 5,
};

describe('매일 반복 일정 테스트', () => {
  it('기본 매일 반복 일정이 정상 생성된다', () => {
    const dailyEvent: Event = {
      ...baseEvent,
      repeat: { ...baseEvent.repeat, type: 'daily', interval: 30, endDate: '2024-02-15' },
    };
    const events = getDailyRepeatingEvents(dailyEvent);

    expect(events.length).toBeGreaterThan(0);
    expect(events[1].date).toBe('2024-01-16');
    expect(events[29].date).toBe('2024-02-13');
  });

  it('월말을 걸쳐서 매일 반복 일정이 정상 생성된다', () => {
    const dailyEvent: Event = {
      ...baseEvent,
      date: '2024-01-31',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2024-02-02',
      },
    };
    const events = getDailyRepeatingEvents(dailyEvent);

    expect(events.map((e) => e.date)).toEqual(['2024-01-31', '2024-02-01', '2024-02-02']);
  });
});

describe('매주 반복 일정 테스트', () => {
  it('기본 매주 반복 일정이 정상 생성된다', () => {
    const weeklyEvent: Event = {
      ...baseEvent,
      repeat: { ...baseEvent.repeat, type: 'weekly' },
    };
    const events = getWeeklyRepeatingEvents(weeklyEvent);

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].date).toBe('2024-01-15');
    expect(events[1].date).toBe('2024-01-22');
    expect(events[2].date).toBe('2024-01-29');
  });

  it('월말을 걸쳐서 매주 반복 일정이 정상 생성된다', () => {
    const weeklyEvent: Event = {
      ...baseEvent,
      date: '2024-01-29',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2024-02-12',
      },
    };
    const events = getWeeklyRepeatingEvents(weeklyEvent);

    expect(events.map((e) => e.date)).toEqual(['2024-01-29', '2024-02-05', '2024-02-12']);
  });
});

describe('매월 반복 일정 테스트', () => {
  it('기본 매월 반복 일정이 정상 생성된다', () => {
    const monthlyEvent: Event = {
      ...baseEvent,
      date: '2024-01-15',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2024-03-15',
      },
    };
    const events = getMonthlyRepeatingEvents(monthlyEvent);

    expect(events.map((e) => e.date)).toEqual(['2024-01-15', '2024-02-15', '2024-03-15']);
  });

  it('31일에 시작하는 매월 반복 일정이 정상 생성된다', () => {
    const monthlyEvent: Event = {
      ...baseEvent,
      date: '2024-01-31',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2024-04-30',
      },
    };
    const events = getMonthlyRepeatingEvents(monthlyEvent);

    expect(events.map((e) => e.date)).toEqual([
      '2024-01-31',
      '2024-02-29', // 윤년
      '2024-03-31',
      '2024-04-30',
    ]);
  });

  it('윤년 2월 29일에 시작하는 매월 반복 일정이 정상 생성된다', () => {
    const monthlyEvent: Event = {
      ...baseEvent,
      date: '2024-02-29',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-02-28',
      },
    };
    const events = getMonthlyRepeatingEvents(monthlyEvent);

    expect(events.map((e) => e.date)).toEqual([
      '2024-02-29',
      '2024-03-29',
      '2024-04-29',
      // ... 중간 날짜들
      '2025-01-29',
      '2025-02-28', // 윤년이 아닌 해는 28일로 조정
    ]);
  });
});

describe('통합 테스트', () => {
  it('generateRepeatingEvents가 모든 반복 유형을 정상 처리한다', () => {
    const types: ('daily' | 'weekly' | 'monthly' | 'none')[] = [
      'daily',
      'weekly',
      'monthly',
      'none',
    ];

    types.forEach((type) => {
      const event = {
        ...baseEvent,
        repeat: { ...baseEvent.repeat, type },
      };
      const events = generateRepeatingEvents(event);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].repeat.type).toBe(type);
    });
  });

  it('반복 종료일이 없는 경우 기본 일정만 생성된다', () => {
    const event: Event = {
      ...baseEvent,
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: undefined,
      },
    };
    const events = generateRepeatingEvents(event);
    expect(events.length).toBe(1);
    expect(events[0].date).toBe(event.date);
  });
});
