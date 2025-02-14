import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { ReactElement } from 'react';

import App from '../App';
import { Event } from '../types';

// ! Hard 여기 제공 안함
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Med: 왜 ChakraProvider로 감싸는지 물어보자
};

// ! Hard 여기 제공 안함
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('이벤트 폼 반복 일정 테스트', () => {
  // 기본 렌더링 및 사용자 이벤트 설정
  beforeEach(() => {
    // render(<EventForm />);
  });

  it('반복 일정 체크박스 선택 시 반복 설정 UI가 표시된다', async () => {
    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2024-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    // 반복 일정 체크박스 찾기
    const repeatCheckbox = screen.getByRole('checkbox', { name: '반복 설정 반복 일정' });

    // 체크박스 클릭
    await userEvent.click(repeatCheckbox);

    // 반복 설정 UI 요소들이 나타나는지 확인
    expect(screen.getByText('반복 유형')).toBeInTheDocument();
    expect(screen.getByText('반복 간격')).toBeInTheDocument();
    expect(screen.getByText('반복 종료일')).toBeInTheDocument();
  });

  it('모든 반복 유형을 선택할 수 있다', async () => {
    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2024-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });
    // 반복 일정 활성화
    const repeatCheckbox = screen.getByRole('checkbox', { name: '반복 설정 반복 일정' });
    await userEvent.click(repeatCheckbox);

    // 반복 유형 선택
    const repeatTypeSelect = screen.getByRole('combobox', { name: '반복 유형' });

    // 각 반복 유형 선택 및 확인
    const repeatTypes = ['매일', '매주', '매월', '매년'];

    for (const type of repeatTypes) {
      await userEvent.selectOptions(repeatTypeSelect, type);
      expect(repeatTypeSelect).toHaveValue(
        type === '매일'
          ? 'daily'
          : type === '매주'
            ? 'weekly'
            : type === '매월'
              ? 'monthly'
              : 'yearly'
      );
    }
  });

  it('윤년 2월 29일에 매월 반복 일정 선택 후 일정추가 버튼 클릭 시 적절히 처리된다', async () => {
    const mockSubmit = vi.fn();
    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2024-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });
    // 반복 일정 활성화
    const repeatCheckbox = screen.getByRole('checkbox', { name: '반복 설정 반복 일정' });
    await userEvent.click(repeatCheckbox);

    // 날짜를 2024년 2월 29일로 설정
    const dateInput = screen.getByLabelText('날짜');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, '2024-02-29');

    // 반복 유형을 '매월'로 설정
    const repeatTypeSelect = screen.getByRole('combobox', { name: '반복 유형' });
    await userEvent.selectOptions(repeatTypeSelect, '매월');

    // 반복 종료일을 2024년 5월 29일로 설정
    const endDateInput = screen.getByLabelText('반복 종료일');
    await userEvent.clear(endDateInput);
    await userEvent.type(endDateInput, '2024-05-29');

    // 필수 필드 입력
    await userEvent.type(screen.getByRole('textbox', { name: '제목' }), '테스트 일정');
    await userEvent.type(screen.getByLabelText('시작 시간'), '09:00');
    await userEvent.type(screen.getByLabelText('종료 시간'), '10:00');

    // 일정 추가 버튼 클릭
    const submitButton = screen.getByTestId('event-submit-button');
    await userEvent.click(submitButton);

    // Assertion 추가
    expect(mockSubmit).toHaveBeenCalled(); // submit 함수가 호출되었는지 확인

    // submit된 데이터의 형식 확인
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2024-02-29',
        repeatType: 'monthly',
        repeatEndDate: '2024-05-29',
        isRepeating: true,
        // 다른 필드들도 필요에 따라 추가
      })
    );

    // 에러 메시지가 표시되지 않는지 확인
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // 또는 특정 처리 결과를 확인
    const processedDates = mockSubmit.mock.calls[0][0].processedDates;
    expect(processedDates).toEqual(
      expect.arrayContaining([
        '2024-02-29',
        '2024-03-28', // 또는 29 (구현에 따라)
        '2024-04-29',
        '2024-05-29',
      ])
    );
  });

  it('31일에 매월 반복 일정 생성 시 적절히 처리된다', async () => {
    render(<App />);
    const user = userEvent.setup();

    await saveSchedule(user, {
      title: '새 회의',
      date: '2024-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });
    // 반복 일정 활성화
    const repeatCheckbox = screen.getByRole('checkbox', { name: '반복 설정 반복 일정' });
    await user.click(repeatCheckbox);

    // 날짜를 2024년 1월 31일로 설정
    const dateInput = screen.getByLabelText('날짜');
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-31');

    // 반복 유형을 '매월'로 설정
    const repeatTypeSelect = screen.getByRole('combobox', { name: '반복 유형' });
    await user.selectOptions(repeatTypeSelect, '매월');

    // 반복 종료일을 2024년 4월 30일로 설정
    const endDateInput = screen.getByLabelText('반복 종료일');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2024-04-30');

    // 필수 필드 입력
    await user.type(screen.getByRole('textbox', { name: '제목' }), '테스트 일정');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '10:00');

    // 일정 추가 버튼 클릭
    const submitButton = screen.getByTestId('event-submit-button');
    await user.click(submitButton);

    // 1. 기본 일정이 생성되었는지 확인
    expect(screen.getByText('테스트 일정')).toBeInTheDocument();
    expect(screen.getByText('2024-01-31')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument();

    // 2. 반복 일정 정보가 표시되는지 확인
    expect(screen.getByText(/반복: 1월마다/)).toBeInTheDocument();
    expect(screen.getByText(/종료: 2024-04-30/)).toBeInTheDocument();

    // 3. 월간 뷰로 전환하여 반복 일정 확인
    const viewSelect = screen.getByRole('combobox', { name: 'view' });
    await user.selectOptions(viewSelect, 'month');

    // 4. 각 월의 마지막 날짜에 일정이 생성되었는지 확인
    const expectedDates = [
      '2024-01-31', // 1월 31일
      '2024-02-29', // 2월 마지막 날
      '2024-03-31', // 3월 31일
      '2024-04-30', // 4월 30일
    ];

    // 5. 모든 예상 날짜에 일정이 존재하는지 확인
    expectedDates.forEach((date) => {
      const dateElement = screen.getByText(date);
      expect(dateElement).toBeInTheDocument();

      // 해당 날짜에 일정 제목이 표시되는지 확인
      const eventTitle = screen.getAllByText('테스트 일정');
      expect(eventTitle.length).toBeGreaterThanOrEqual(expectedDates.length);
    });

    // 6. 알림 또는 성공 메시지가 표시되는지 확인
    expect(screen.getByText(/일정이 성공적으로 추가되었습니다/)).toBeInTheDocument();

    // 7. 에러 메시지가 없는지 확인
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // 8. 반복 일정 요약 정보 확인
    const repeatSummary = screen.getByText(/매월 마지막 날 반복/);
    expect(repeatSummary).toBeInTheDocument();
  });
});
