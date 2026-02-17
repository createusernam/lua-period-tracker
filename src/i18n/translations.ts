export const translations = {
  ru: {
    // Phase names
    'phase.menstrual': 'Менструальная фаза',
    'phase.follicular': 'Фолликулярная фаза',
    'phase.ovulation': 'Овуляция',
    'phase.luteal': 'Лютеиновая фаза',
    'phase.premenstrual': 'Предменструальная фаза',

    // Phase status
    'status.day': 'День {day}',
    'status.period_in': 'До месячных ~{days} д.',
    'status.period_today': 'Ожидается ~сегодня',
    'status.period_overdue_1': 'Задержка ~{days} день',
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
    'onboarding.privacy': 'Данные хранятся на вашем устройстве. Резервная копия в Google Drive — по желанию. Без рекламы.',

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
    'settings.about_text': 'Lua — трекер цикла.\nДанные хранятся на устройстве.\nРезервная копия в Google Drive — по желанию.\nLua не видит ваши данные. Без рекламы. Без слежки.',
    'settings.disclaimer': 'Lua не является медицинским прибором. Прогнозы циклов, фертильных окон и овуляции носят информационный характер и основаны на статистических средних. Не используйте их для контрацепции или медицинских решений без консультации врача.',
    'settings.privacy_policy': 'Политика конфиденциальности',
    'settings.exported': 'Экспорт выполнен',
    'settings.imported': 'Импортировано {count} периодов',
    'settings.deleted': 'Все данные удалены',
    'settings.back': 'Назад',
    'settings.data_section': 'Данные',
    'settings.export_failed': 'Не удалось экспортировать: {error}',
    'settings.import_failed': 'Не удалось импортировать: {error}',

    // Cloud Sync
    'sync.section_title': 'Облачная синхронизация',
    'sync.connect': 'Подключить Google Drive',
    'sync.disconnect': 'Отключить Google Drive',
    'sync.confirm_disconnect': 'Отключить синхронизацию? Локальные данные сохранятся.',
    'sync.connected': 'Подключено',
    'sync.disconnected': 'Не подключено',
    'sync.connect_failed': 'Не удалось подключиться: {error}',
    'sync.syncing': 'Синхронизация…',
    'sync.last_synced': 'Синхронизировано {time}',
    'sync.error': 'Ошибка синхронизации',
    'sync.idle': 'Ожидание',
    'sync.sync_now': 'Синхронизировать',
    'sync.synced': 'Синхронизировано',
    'sync.sync_failed': 'Ошибка: {error}',
    'sync.gis_not_loaded': 'Сервис авторизации не загружен',

    // Privacy policy
    'privacy.title': 'Политика конфиденциальности',
    'privacy.intro': 'Lua — трекер менструального цикла, работающий полностью в вашем браузере. Ваша конфиденциальность — основа архитектуры приложения.',
    'privacy.data_title': 'Какие данные собираются',
    'privacy.data_text': 'Lua хранит только даты месячных, которые вы вводите. Приложение не собирает имена, email, номера телефонов или какие-либо персональные данные. Аналитика, отслеживание и реклама отсутствуют.',
    'privacy.storage_title': 'Где хранятся данные',
    'privacy.storage_text': 'Все данные хранятся в IndexedDB вашего браузера — локально на вашем устройстве. Данные никогда не отправляются на сервер Lua, потому что у Lua нет сервера.',
    'privacy.gdrive_title': 'Резервное копирование в Google Drive',
    'privacy.gdrive_text': 'Если вы подключите Google Drive, данные будут загружены в ваш личный аккаунт Google Drive как JSON-файл. Lua использует область доступа drive.file — может видеть только файлы, созданные приложением. Данные хранятся в незашифрованном виде в вашем Drive. Lua не имеет доступа к вашим данным на серверах Google. Вы можете отключить синхронизацию в любой момент.',
    'privacy.thirdparty_title': 'Третьи стороны',
    'privacy.thirdparty_text': 'Lua не передаёт данные третьим лицам. При использовании Google Drive применяется политика конфиденциальности Google в отношении данных, хранящихся в вашем аккаунте.',
    'privacy.rights_title': 'Ваши права',
    'privacy.rights_text': 'Вы полностью контролируете свои данные. Экспортируйте, импортируйте или удалите все данные в любой момент через Настройки.',
    'privacy.contact_title': 'Контакт',
    'privacy.contact_text': 'Вопросы и замечания — через Issues в репозитории проекта на GitHub.',
    'privacy.not_medical': 'Медицинский отказ от ответственности',
    'privacy.not_medical_text': 'Lua не является медицинским прибором. Прогнозы циклов, фертильных окон и овуляции носят информационный характер и основаны на статистических средних ваших прошлых данных. Не используйте их для контрацепции или принятия медицинских решений без консультации с врачом.',

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

    'status.day': 'Day {day}',
    'status.period_in': 'Period in ~{days} days',
    'status.period_today': 'Period expected ~today',
    'status.period_overdue_1': '~{days} day overdue',
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
    'onboarding.privacy': 'Data stored on your device. Google Drive backup optional. No ads.',

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
    'settings.about_text': 'Lua — Period Tracker.\nData stored on your device.\nGoogle Drive backup is optional.\nLua cannot see your data. No ads. No tracking.',
    'settings.disclaimer': 'Lua is not a medical device. Cycle predictions, fertility windows, and ovulation estimates are informational only — based on statistical averages of your past data. Do not use them for contraception or medical decisions without consulting a healthcare provider.',
    'settings.privacy_policy': 'Privacy Policy',
    'settings.exported': 'Exported successfully',
    'settings.imported': 'Imported {count} periods',
    'settings.deleted': 'All data deleted',
    'settings.back': 'Back',
    'settings.data_section': 'Data',
    'settings.export_failed': 'Export failed: {error}',
    'settings.import_failed': 'Import failed: {error}',

    'sync.section_title': 'Cloud Sync',
    'sync.connect': 'Connect Google Drive',
    'sync.disconnect': 'Disconnect Google Drive',
    'sync.confirm_disconnect': 'Disconnect sync? Local data will be preserved.',
    'sync.connected': 'Connected',
    'sync.disconnected': 'Disconnected',
    'sync.connect_failed': 'Connection failed: {error}',
    'sync.syncing': 'Syncing…',
    'sync.last_synced': 'Synced {time}',
    'sync.error': 'Sync error',
    'sync.idle': 'Idle',
    'sync.sync_now': 'Sync now',
    'sync.synced': 'Synced',
    'sync.sync_failed': 'Error: {error}',
    'sync.gis_not_loaded': 'Auth service not loaded',

    // Privacy policy
    'privacy.title': 'Privacy Policy',
    'privacy.intro': 'Lua is a menstrual cycle tracker that runs entirely in your browser. Your privacy is the foundation of the app\'s architecture.',
    'privacy.data_title': 'What data is collected',
    'privacy.data_text': 'Lua only stores the period dates you enter. The app does not collect names, emails, phone numbers, or any personal information. There are no analytics, no tracking, and no ads.',
    'privacy.storage_title': 'Where data is stored',
    'privacy.storage_text': 'All data is stored in your browser\'s IndexedDB — locally on your device. Data is never sent to a Lua server because Lua has no server.',
    'privacy.gdrive_title': 'Google Drive backup',
    'privacy.gdrive_text': 'If you connect Google Drive, your data is uploaded to your personal Google Drive account as a JSON file. Lua uses the drive.file scope — it can only see files created by the app. Data is stored unencrypted in your Drive. Lua has no access to your data on Google\'s servers. You can disconnect sync at any time.',
    'privacy.thirdparty_title': 'Third parties',
    'privacy.thirdparty_text': 'Lua does not share data with third parties. When using Google Drive, Google\'s privacy policy applies to data stored in your account.',
    'privacy.rights_title': 'Your rights',
    'privacy.rights_text': 'You have full control over your data. Export, import, or delete all data at any time via Settings.',
    'privacy.contact_title': 'Contact',
    'privacy.contact_text': 'Questions and feedback — via Issues in the project\'s GitHub repository.',
    'privacy.not_medical': 'Medical disclaimer',
    'privacy.not_medical_text': 'Lua is not a medical device. Cycle predictions, fertility windows, and ovulation estimates are informational only — based on statistical averages of your past data. Do not use them for contraception or medical decisions without consulting a healthcare provider.',

    'common.close': 'Close',

    'chart.aria_label': 'Cycle dynamics chart showing {count} cycles',

    'error.load_failed': 'Failed to load data',
    'error.retry': 'Retry',
  },
} as const;
