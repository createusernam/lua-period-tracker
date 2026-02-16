export const translations = {
  ru: {
    // Phase names
    'phase.menstrual': 'Менструальная фаза',
    'phase.follicular': 'Фолликулярная фаза',
    'phase.ovulation': 'Овуляция',
    'phase.luteal': 'Лютеиновая фаза',
    'phase.premenstrual': 'Предменструальная фаза',

    // Phase status
    'status.day_of': 'День {day} из ~{total}',
    'status.period_in': 'До месячных ~{days} д.',
    'status.period_today': 'Ожидается ~сегодня',
    'status.period_overdue': 'Задержка ~{days} д.',
    'status.during_period': 'Месячные: день {day}',
    'status.no_recent': 'Нет недавних месячных',
    'status.last_period_ago': 'Последние месячные {ago}',
    'status.log_more': 'Залогируйте ещё один период для прогнозов',
    'status.no_periods': 'Нет залогированных периодов',
    'status.no_data': 'Нет данных',
    'status.no_active_cycle': 'Нет текущего цикла',

    // Calendar
    'cal.weekdays': ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    'cal.months': [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ],
    'cal.month': 'Месяц',
    'cal.year': 'Год',
    'cal.today': 'Сегодня',
    'cal.edit_dates': 'Изменить даты месячных',
    'cal.prev_year': 'Предыдущий год',
    'cal.next_year': 'Следующий год',

    // Edit mode
    'edit.title': 'Даты месячных',
    'edit.instruction': 'Нажмите на дни, чтобы отметить месячные',
    'edit.cancel': 'Отмена',
    'edit.save': 'Сохранить',
    'edit.saving': 'Сохранение...',
    'edit.saved': 'Сохранено!',
    'edit.overlap_error': 'Пересечение с существующим периодом',
    'edit.save_error': 'Не удалось сохранить',

    // Home
    'home.log_period': 'Отметить месячные',
    'home.cycle_history': 'История циклов',
    'home.dynamics': 'Динамика цикла',
    'home.stats': 'Статистика',

    // Stats
    'stats.fluctuation': 'Колебания: {min}–{max} дней',
    'stats.prev_cycle': 'Предыдущий цикл: {days} дней',
    'stats.prev_period': 'Предыдущие месячные: {days} дней',
    'stats.avg_cycle': 'Средняя длина цикла: ~{days} дней',

    // Onboarding
    'onboarding.import': 'Загрузить данные',
    'onboarding.log_first': 'Залогировать первый период',
    'onboarding.welcome': 'Добро пожаловать в Lua',
    'onboarding.subtitle': 'Все данные хранятся локально на вашем устройстве',
    'onboarding.privacy': 'Все данные хранятся только на вашем устройстве. Без аккаунтов. Без рекламы.',

    // Import
    'import.success': 'Данные загружены',

    // Legend
    'legend.period': 'Месячные',
    'legend.fertile': 'Фертильность',
    'legend.ovulation': 'Овуляция',
    'legend.predicted': 'Прогноз',

    // Dynamics chart
    'chart.normal_note': 'Длина {count} последних полных циклов была в нормальном диапазоне.',
    'chart.normal_range': 'В пределах нормального диапазона (21–35 дней)',

    // Cycle history items
    'history.current_cycle': 'Текущий цикл: {days} дней',
    'history.days': '{days} дней',
    'history.est_days': '~{days} дней',
    'history.started': 'Начался {date}',
    'history.ongoing': 'Текущий',
    'history.no_data': 'Нет данных о циклах',
    'history.log_completed': 'Залогируйте хотя бы один завершённый период.',

    // Settings
    'settings.title': 'Настройки',
    'settings.export': 'Экспортировать данные (JSON)',
    'settings.import': 'Импортировать данные (JSON)',
    'settings.delete_all': 'Удалить все данные',
    'settings.confirm_delete': 'Удалить ВСЕ данные? Это необратимо.',
    'settings.about': 'О приложении',
    'settings.about_text': 'Lua — трекер цикла.\nВсе данные хранятся локально.\nБез аккаунтов. Без рекламы. Без слежки.',
    'settings.exported': 'Экспорт выполнен',
    'settings.imported': 'Импортировано {count} периодов',
    'settings.deleted': 'Все данные удалены',
    'settings.back': 'Назад',
    'settings.data_section': 'Данные',
    'settings.export_failed': 'Не удалось экспортировать: {error}',
    'settings.import_failed': 'Не удалось импортировать: {error}',

    // Common
    'common.close': 'Закрыть',

    // Chart
    'chart.aria_label': 'График динамики цикла: {count} циклов',

    // Errors
    'error.load_failed': 'Не удалось загрузить данные',
    'error.retry': 'Повторить',
  },

  en: {
    'phase.menstrual': 'Menstrual phase',
    'phase.follicular': 'Follicular phase',
    'phase.ovulation': 'Ovulation',
    'phase.luteal': 'Luteal phase',
    'phase.premenstrual': 'Premenstrual phase',

    'status.day_of': 'Day {day} of ~{total}',
    'status.period_in': 'Period in ~{days} days',
    'status.period_today': 'Period expected ~today',
    'status.period_overdue': '~{days} days overdue',
    'status.during_period': 'Period: day {day}',
    'status.no_recent': 'No recent periods',
    'status.last_period_ago': 'Last period started {ago}',
    'status.log_more': 'Log one more period for predictions',
    'status.no_periods': 'No periods logged',
    'status.no_data': 'No data',
    'status.no_active_cycle': 'No active cycle',

    'cal.weekdays': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    'cal.months': [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    'cal.month': 'Month',
    'cal.year': 'Year',
    'cal.today': 'Today',
    'cal.edit_dates': 'Edit period dates',
    'cal.prev_year': 'Previous year',
    'cal.next_year': 'Next year',

    'edit.title': 'Period dates',
    'edit.instruction': 'Tap days to mark your period',
    'edit.cancel': 'Cancel',
    'edit.save': 'Save',
    'edit.saving': 'Saving...',
    'edit.saved': 'Saved!',
    'edit.overlap_error': 'Overlaps with an existing period',
    'edit.save_error': 'Failed to save period',

    'home.log_period': 'Log period',
    'home.cycle_history': 'Cycle history',
    'home.dynamics': 'Cycle dynamics',
    'home.stats': 'Statistics',

    'stats.fluctuation': 'Range: {min}–{max} days',
    'stats.prev_cycle': 'Previous cycle: {days} days',
    'stats.prev_period': 'Previous period: {days} days',
    'stats.avg_cycle': 'Average cycle length: ~{days} days',

    'onboarding.import': 'Import data',
    'onboarding.log_first': 'Log first period',
    'onboarding.welcome': 'Welcome to Lua',
    'onboarding.subtitle': 'All data stored locally on your device',
    'onboarding.privacy': 'All data stored only on your device. No accounts. No ads.',

    'import.success': 'Data imported',

    'legend.period': 'Period',
    'legend.fertile': 'Fertile',
    'legend.ovulation': 'Ovulation',
    'legend.predicted': 'Predicted',

    'chart.normal_note': 'Last {count} cycles were in the normal range.',
    'chart.normal_range': 'Normal range (21–35 days)',

    'history.current_cycle': 'Current cycle: {days} days',
    'history.days': '{days} days',
    'history.est_days': '~{days} days',
    'history.started': 'Started {date}',
    'history.ongoing': 'Ongoing',
    'history.no_data': 'No cycle data',
    'history.log_completed': 'Log at least one completed period to see history.',

    'settings.title': 'Settings',
    'settings.export': 'Export data as JSON',
    'settings.import': 'Import data from JSON',
    'settings.delete_all': 'Delete all data',
    'settings.confirm_delete': 'Delete ALL data? This cannot be undone.',
    'settings.about': 'About',
    'settings.about_text': 'Lua — Period Tracker.\nAll data stored locally.\nNo accounts. No ads. No tracking.',
    'settings.exported': 'Exported successfully',
    'settings.imported': 'Imported {count} periods',
    'settings.deleted': 'All data deleted',
    'settings.back': 'Back',
    'settings.data_section': 'Data',
    'settings.export_failed': 'Export failed: {error}',
    'settings.import_failed': 'Import failed: {error}',

    'common.close': 'Close',

    'chart.aria_label': 'Cycle dynamics chart showing {count} cycles',

    'error.load_failed': 'Failed to load data',
    'error.retry': 'Retry',
  },
} as const;
