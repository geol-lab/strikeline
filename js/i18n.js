/**
 * i18n.js — built-in EN ↔ RU translation.
 *
 * English is the source language and lives in the HTML. Elements carry
 * data-i18n="key" (text) or data-i18n-attr="attr:key" (attributes).
 * On first switch the English text is captured from the DOM, so the
 * dictionary below only needs the Russian side. Strings built in JS
 * (demo notes, results) use t(key, vars) with both languages in STR.
 */

const STORE_KEY = 'strikeline.lang';

/* ---- Russian text for the static page ---- */
const RU = {
  skip: 'Перейти к содержанию',
  'nav.label': 'Основное меню',
  'nav.method': 'Как это работает',
  'nav.workspace': 'Рабочая среда',
  'nav.stereonet': 'Стереосетка',
  'nav.faq': 'Вопросы',
  'nav.about': 'О проекте',
  'nav.menu': 'Меню',
  'lang.label': 'Язык',
  'cta.open': 'Открыть рабочую среду',

  'hero.title': 'Отметьте точки. Strikeline проведёт линию.',
  'hero.lead': 'Линии простирания, strike и dip и разрезы в истинном масштабе по вашей карте из лабораторной.',
  'hero.load': 'Загрузить карту',
  'hero.how': 'Как это работает',
  'hero.note': 'PNG, JPG или скриншот PDF. Карта остаётся на вашем устройстве.',

  'key.title': 'Условные обозначения',
  'bed.conglomerate': 'Конгломерат',
  'bed.sandstone': 'Песчаник',
  'bed.shale': 'Сланец (shale)',
  'bed.limestone': 'Известняк',
  'key.contour': 'Горизонталь, сечение 100 м',
  'key.structure': 'Линия простирания через отмеченные точки',
  'key.section': 'Линия разреза X–Y',
  'key.dip': 'Элементы залегания (strike/dip)',

  'demo.title': 'Пример построения на учебной карте',
  'demo.desc': 'Три контакта пересекают горизонтали через 100 м. Через точки пересечения проведены прямые линии простирания: пласты простираются по 002° и падают на восток под 14°. Под картой в том же масштабе построен разрез по линии X–Y.',
  'demo.steps': 'Шаги построения',
  'step.scale': 'Масштаб',
  'step.mark': 'Точки',
  'step.fit': 'Линии',
  'step.dip': 'Падение',
  'step.section': 'Разрез',
  'demo.replay': 'Повторить',
  'demo.meta': 'Учебная карта · сечение рельефа 100 м · разрез в масштабе карты',

  'method.title': 'Один лабораторный лист, шесть построений',
  'method.lead': 'В том же порядке, что и в задании. Каждое значение получено из ваших отметок, поэтому любой шаг можно проверить.',
  'm1.t': 'Масштаб',
  'm1.d': 'Щёлкните по обоим концам масштабной линейки и введите её длину. Вторая точка встаёт на одну высоту с первой, поэтому измерение остаётся точным.',
  'm2.t': 'Точки пересечения',
  'm2.d': 'Ставьте маркер там, где контакт пересекает горизонталь. Маркер получает высоту горизонтали и цвет пласта.',
  'm3.t': 'Линии простирания',
  'm3.d': 'Точки одного пласта на одной высоте соединяются прямой методом наименьших квадратов. Видны её длина, отклонение каждой точки и место пересечения с X–Y.',
  'm4.t': 'Простирание и падение',
  'm4.d': 'Strike — азимут линии простирания. Dip считается по расстоянию между двумя линиями одного пласта; падение направлено к более низкой линии.',
  'm5.t': 'Разрез',
  'm5.d': 'Задайте X и Y. Разрез строится под картой в её масштабе, высота зависит от точек на линии. Если задание требует, измените вертикальное преувеличение.',
  'm6.t': 'Таблица и легенда',
  'm6.d': 'Шаблоны стратиграфической колонки и легенды сразу заполнены вашими пластами и цветами. Меняйте их под каждое задание.',
  'm6.f': 'моложе ↑ древнее ↓',

  'ws.title': 'Четыре вкладки, один проект',
  'ws.lead': 'Карта, разрез, стереосетка и таблицы связаны между собой. Поменяйте цвет пласта один раз, и он изменится везде.',
  'ws.map.t': 'Карта',
  'ws.map.d': 'Загрузите карту, задайте масштаб, отметьте точки и постройте линии простирания, у каждого пласта свой цвет. Длины и положение на X–Y видны сразу.',
  'ws.sec.t': 'Разрез',
  'ws.sec.d': 'Строится по линии разреза автоматически, в масштабе карты. Видимые углы падения и замки антиформ и синформ подписаны, интерпретация за вами.',
  'ws.net.t': 'Стереосетка',
  'ws.net.d': 'Введите strike и dip, нанесите плоскости и полюса и найдите общую линию двух пластов. Включите её, чтобы увидеть на карте.',
  'ws.tab.t': 'Таблицы и легенды',
  'ws.tab.d': 'Шаблоны стратиграфической таблицы и легенды, которые можно менять под задание и экспортировать вместе с картой и разрезом.',
  'ws.plan': 'Схема рабочей среды: слева карта и разрез под ней, справа стереосетка и таблицы.',
  'ws.note': 'Бесплатно. Ничего не нужно устанавливать, аккаунт не нужен.',

  'net.title': 'Два крыла на входе, ось складки на выходе',
  'net.lead': 'Введите strike и dip двух пластов. Равноплощадная сетка покажет обе плоскости и линию их пересечения: у складки это шарнир.',
  'net.desc': 'Равноплощадная стереосетка, нижняя полусфера: две плоскости и линия их пересечения.',
  'net.p1': 'Плоскость 1, западное крыло',
  'net.p2': 'Плоскость 2, восточное крыло',
  'net.strike': 'Strike °',
  'net.dip': 'Dip °',
  'net.towards': 'Падение на',
  'net.hint': 'Пример: пологое крыло и крутое. Strike 0–360°, dip 0–90°.',
  'net.result': 'Линия пересечения',
  'net.unit': 'азимут/угол погружения',

  'faq.title': 'Вопросы',
  'faq.q1': 'Какие карты подходят?',
  'faq.a1': 'Любое изображение карты с горизонталями и масштабной линейкой: скан, фото листа или скриншот PDF. Фотографируйте строго сверху, чтобы не исказить расстояния. Strikeline считает, что север вверху.',
  'faq.q2': 'Моя карта куда-то загружается?',
  'faq.a2': 'Нет. Карта и всё, что вы нарисовали, остаются в браузере. Сохраните проект в файл, чтобы продолжить на другом компьютере.',
  'faq.q3': 'Он сделает лабораторную за меня?',
  'faq.a3': 'Нет. Вы решаете, какие точки к какому пласту относятся и что означают структуры. Strikeline считает, держит линии прямыми, а масштаб точным и показывает, откуда взялось каждое число.',
  'faq.q4': 'Точки не ложатся на одну прямую. Что делать?',
  'faq.a4': 'Прямая всё равно пройдёт через них наилучшим образом, а у каждой точки будет видно отклонение. Сильное отклонение обычно значит неверную высоту или точку на другом контакте.',
  'faq.q5': 'Можно читать по-русски?',
  'faq.a5': 'Да. Переключите EN / RU вверху любой страницы. Термины соответствуют английским методичкам, поэтому перевод помогает понять смысл, а сдаёте вы работу с привычной терминологией.',

  'about.label': 'Примечание составителей',
  'about.title': 'Сделано в NU студентами-геологами.',
  'about.lead': 'Мы сделали Strikeline для студентов и кафедры геологии Назарбаев Университета после слишком многих вечеров с линейкой, транспортиром и затёртым лабораторным листом.',
  'p1.t': 'Геология за вами.',
  'p1.d': 'Инструмент измеряет и считает. Выбор точек, пластов и интерпретация — ваша работа.',
  'p2.t': 'У каждого числа есть источник.',
  'p2.d': 'Каждая длина, угол и положение связаны с отметками, из которых получены.',
  'p3.t': 'Ваша работа остаётся у вас.',
  'p3.d': 'Без аккаунтов и загрузок. Проекты хранятся в браузере и в файлах.',

  // Workspace
  'app.tabs': 'Рабочая среда',
  'app.undo': 'Отменить',
  'app.redo': 'Повторить',
  'app.tools': 'Инструменты',
  'tool.pan': 'Двигать',
  'tool.scale': 'Масштаб',
  'tool.section': 'Разрез X–Y',
  'tool.point': 'Маркер',
  'tool.ground': 'Рельеф',
  'tool.erase': 'Стереть',
  'app.mapLabel': 'Карта',
  'app.zoom': 'Масштаб просмотра',
  'app.fit': 'Вписать карту',
  'app.ve': 'Вертикальное преувеличение',
  'app.project': 'Проект',
  'app.mapFile': 'Карта',
  'app.sample': 'Учебная карта',
  'app.barLen': 'Масштабная линейка, м',
  'app.elevation': 'Высота следующей отметки',
  'app.interval': 'Сечение рельефа, м',
  'app.beds': 'Пласты и контакты',
  'app.addBed': 'Добавить пласт',
  'app.lines': 'Линии простирания',
  'app.soonSection': 'Полноразмерный разрез с экспортом появится на шаге 3. Пока он находится под картой на вкладке A.',
  'app.soonNet': 'Вкладка стереосетки появится на шаге 3. Пока попробуйте стереосетку на главной странице.',
  'app.soonTables': 'Шаблоны стратиграфической таблицы и легенды появятся на шаге 4.',

  'secTab.title': 'Разрез X–Y',
  'secTab.desc': 'Разрез по линии X–Y в горизонтальном масштабе карты.',
  'secTab.key': 'Условные обозначения',
  'secTab.att': 'Залегание вдоль разреза',
  'netTab.caption': 'Равноплощадная сетка, нижняя полусфера. Квадраты — полюса, точка — линия пересечения.',
  'netTab.planes': 'Плоскости',
  'netTab.add': 'Добавить плоскость',
  'netTab.poles': 'Показывать полюса',
  'netTab.inter': 'Линия пересечения',
  'netTab.a': 'Плоскость A',
  'netTab.b': 'Плоскость B',
  'netTab.onMap': 'Показать эту линию на карте',
  'tabD.title': 'Стратиграфическая таблица',
  'tabD.fill': 'Заполнить по пластам',
  'tabD.add': 'Добавить слой',
  'tabD.lead': 'Самые молодые сверху. Меняйте любую ячейку под задание. Мощность по карте оценивается там, где у двух контактов есть линии на одной высоте: t = d · sin δ.',
  'tabD.colCap': 'Колонка построена по мощностям из таблицы; ширина показывает, насколько порода устойчива к выветриванию.',
  'tabD.legend': 'Легенда',
  'tabD.reset': 'Сбросить шаблон',
  'tabD.legendTitle': 'Заголовок легенды',
  'tabD.legendCap': 'Легенда в том виде, в каком она будет экспортирована.',
  'file.menu': 'Файл',
  'file.open': 'Открыть проект…',
  'file.save': 'Сохранить проект в файл',
  'file.exportMap': 'Экспорт карты с отметками (PNG)',
  'file.exportSection': 'Экспорт разреза (SVG)',
  'file.exportColumn': 'Экспорт колонки и легенды (SVG)',
  'foot.sheet': 'Инструменты для лабораторных по структурной геологии',
  'foot.made': 'Сделано в',
  'foot.nu': 'Назарбаев Университет, Астана',
  'foot.scale': 'Масштаб',
  'foot.scaleval': 'Ваш: по масштабной линейке',
  'foot.edition': 'Версия',
};

/* ---- Strings built in JavaScript, both languages ---- */
const STR = {
  en: {
    'note.1': 'Scale set: {bar} m on the scale bar = {px} px, so 1 px = {mpp} m.',
    'note.2': '{n} points marked where a contact crosses a contour line. Each takes the contour’s elevation.',
    'note.3': '{n} structure contours fitted, one colour per bed. The number on X–Y is how far each line sits from X, in metres.',
    'note.4': 'Spacing {d} m for {dh} m of height: dip = arctan({dh} ÷ {d}) = {dip}°. Strike {strike}°, dipping {dir}: {label}.',
    'note.5': 'Section X–Y, {L} m long, drawn at map scale with no vertical exaggeration. Height {z0}–{z1} m, set by the points on the line.',
    'net.explain': 'The planes dip {a} and {b}. They meet along a line trending {trend}° and plunging {plunge}°.',
    'net.parallel': 'The planes are parallel, so they do not meet in a single line.',
    'net.invalid': 'Check the values: strike 0–360°, dip 0–90°.',
    'readout.contact': 'Base of {bed}, on X–Y (m from X)',
    'readout.attitude': 'Strike/dip, all beds',
    'bed.short.1': 'shale', 'bed.short.2': 'sandstone', 'bed.short.3': 'conglomerate',
    'note.noMap': 'Load a map, or open the practice map, to begin.',
    'note.tool.pan': 'Drag to move the map, scroll or pinch to zoom. Pick a tool on the left to start marking.',
    'note.tool.scale': 'Click the left end of the scale bar, then its right end. The second click snaps level with the first (hold Shift to turn that off).',
    'note.scale.second': 'Now click the other end of the scale bar.',
    'note.scale.tooShort': 'Those two clicks are too close together. Click both ends of the scale bar.',
    'note.scale.done': 'Scale set: {len} m = {px} px, so 1 px = {mpp} m. Next: Section X–Y.',
    'note.tool.section': 'Click X, then Y, at the two ends of the section line.',
    'note.section.second': 'Now click Y, the other end of the section line.',
    'note.section.done': 'Section line set, {len} m long. Next: choose a bed and use the Marker.',
    'note.section.doneNoScale': 'Section line set. Set the scale to see lengths in metres.',
    'note.tool.point': 'Click where the active bed\'s contact crosses a contour line. Set the contour\'s elevation first; [ and ] step it by one interval.',
    'note.point.noBed': 'Add a bed first, or just click: a bed is created for you.',
    'note.point.noElev': 'Type the elevation of the contour first.',
    'note.point.first': 'Point marked at {h} m. Mark another point of this bed at {h} m to draw its structure contour.',
    'note.point.line': 'Structure contour {h} m: {n} points, {len} m long, fitted as a straight line.',
    'note.tool.ground': 'Click where the section line crosses a contour line, to draw the ground surface in the section. The mark snaps onto X–Y.',
    'note.ground.noSection': 'Draw the section line X–Y first.',
    'note.ground.done': 'Ground point at {h} m added to the section.',
    'note.tool.erase': 'Click a marker or a ground point to remove it.',
    'note.erase.miss': 'Nothing to erase there. Click right on a marker.',
    'note.erase.done': 'Removed. Ctrl+Z brings it back.',
    'app.bedDefault': 'Bed {n}',
    'app.bedColor': 'Bed colour',
    'app.bedName': 'Bed name',
    'app.bedUse': 'Use',
    'app.bedActive': 'Active',
    'app.bedCounts': '{p} points · {l} lines',
    'app.delete': 'Delete',
    'app.delConfirm': 'Delete with its points?',
    'app.noBeds': 'No beds yet. Add one for each contact you will trace.',
    'app.scaleOut': '1 px = {mpp} m (bar {len} m)',
    'app.scaleNone': 'Not set. Choose Scale and click both ends of the scale bar.',
    'app.noLines': 'Mark two points of one bed at the same elevation to draw a line.',
    'app.colH': 'Elev. m',
    'app.colN': 'Pts',
    'app.colLen': 'Length m',
    'app.colXY': 'On X–Y m',
    'app.colDev': '± m',
    'app.linesCaption': '“On X–Y” is the distance from X. “±” is how far the points sit off the line on average; red means check those marks.',
    'sec.needScale': 'Set the scale to build the section.',
    'sec.needLine': 'Draw the section line X–Y to build the section.',
    'sec.meta': 'X–Y {len} m · vertical ×{ve}',
    'sec.needPoints': 'The section appears once structure contours cross X–Y or you add ground points.',
    'sec.needGround': 'Use the Ground tool where X–Y crosses contours to draw the topography.',
    'sec.antiform': '{bed}: antiform hinge near {d} m.',
    'sec.synform': '{bed}: synform hinge near {d} m.',
    'sec.interpret': 'Shape only: an antiform is an anticline if older rocks are in its core.',
    'secTab.ground': 'Ground surface',
    'secTab.noAtt': 'Strike and dip appear here once a bed has two structure contours.',
    'secTab.bed': 'Bed',
    'secTab.true': 'Strike/dip',
    'secTab.apparent': 'Apparent dip',
    'secTab.azimuth': 'Section X–Y bears {az}°. Apparent dip: tan α = tan δ · sin β.',
    'netTab.planeDefault': 'Plane {n}',
    'netTab.planeName': 'Plane name',
    'netTab.fromMap': 'from map',
    'netTab.empty': 'No planes yet. Measure strike/dip on the map, or add a plane by hand.',
    'netTab.needTwo': 'Choose two planes to find the line they share.',
    'netTab.explain': '{a} ({sa}) and {b} ({sb}) meet along a line trending {trend}° and plunging {plunge}°. On a fold this is the hinge line.',
    'tabD.empty': 'No units yet. Press “Fill from beds” or add a unit.',
    'tabD.unitDefault': 'New unit',
    'tabD.below': 'Unit below the oldest contact',
    'tabD.cName': 'Unit', 'tabD.cLith': 'Lithology', 'tabD.cAge': 'Age', 'tabD.cThick': 'Thickness, m', 'tabD.cDesc': 'Description', 'tabD.cLegend': 'Legend',
    'tabD.agePh': 'e.g. Jurassic',
    'tabD.linked': 'Colour follows the bed on the map',
    'tabD.up': 'Move up', 'tabD.down': 'Move down',
    'tabD.columnTitle': 'Stratigraphic column',
    'tabD.colFoot': 'Thickness in metres, top of column = youngest',
    'tabD.legendDefault': 'Legend',
    'tabD.show': 'Show in legend', 'tabD.label': 'Legend text',
    'leg.contact': 'Geological contact', 'leg.contour': 'Topographic contour (m)', 'leg.structure': 'Structure contour (m)',
    'leg.section': 'Line of section X–Y', 'leg.strike': 'Strike and dip of bedding', 'leg.axis': 'Fold axis, trend and plunge',
    'leg.anticline': 'Anticline axial trace', 'leg.syncline': 'Syncline axial trace',
    'file.saved': 'Project saved as a file. Open it from File → Open project.',
    'file.opened': 'Opened “{name}”.',
    'file.exported': 'Exported.',
    'file.err.notJson': 'That file is not a Strikeline project.',
    'file.err.notProject': 'That file is not a Strikeline project.',
    'file.err.noImage': 'That project file has no map image in it.',
    'lith.limestone': 'Limestone',
    'lith.sandstone': 'Sandstone',
    'lith.conglomerate': 'Conglomerate',
    'lith.siltstone': 'Siltstone',
    'lith.shale': 'Shale',
    'lith.mudstone': 'Mudstone',
    'lith.coal': 'Coal',
    'lith.igneous': 'Igneous rock',
    'lith.other': 'Other',
    'map.loading': 'Opening your map…',
    'map.error': 'That file is not an image. Try a PNG or JPG.',
    'map.storeError': 'Your browser blocked local storage, so the map could not be passed to the workspace.',
    'dir.E': 'east', 'dir.W': 'west', 'dir.N': 'north', 'dir.S': 'south',
    'dir.NE': 'north-east', 'dir.NW': 'north-west', 'dir.SE': 'south-east', 'dir.SW': 'south-west',
  },
  ru: {
    'note.1': 'Масштаб задан: {bar} м на линейке = {px} px, значит 1 px = {mpp} м.',
    'note.2': 'Отмечено {n} точек, где контакт пересекает горизонталь. Каждая получает высоту горизонтали.',
    'note.3': 'Построено {n} линий простирания, у каждого пласта свой цвет. Число на X–Y — расстояние линии от точки X в метрах.',
    'note.4': 'Расстояние {d} м на {dh} м высоты: dip = arctg({dh} ÷ {d}) = {dip}°. Strike {strike}°, падение на {dir}: {label}.',
    'note.5': 'Разрез X–Y длиной {L} м в масштабе карты, без вертикального преувеличения. Высота {z0}–{z1} м определяется точками на линии.',
    'net.explain': 'Плоскости падают на {a} и на {b}. Они пересекаются по линии с азимутом {trend}° и углом погружения {plunge}°.',
    'net.parallel': 'Плоскости параллельны, общей линии у них нет.',
    'net.invalid': 'Проверьте значения: strike 0–360°, dip 0–90°.',
    'readout.contact': 'Подошва: {bed}, на X–Y (м от X)',
    'readout.attitude': 'Strike/dip, все пласты',
    'bed.short.1': 'сланец', 'bed.short.2': 'песчаник', 'bed.short.3': 'конгломерат',
    'note.noMap': 'Загрузите карту или откройте учебную, чтобы начать.',
    'note.tool.pan': 'Перетаскивайте карту, колесом или двумя пальцами меняйте масштаб. Выберите инструмент слева, чтобы начать.',
    'note.tool.scale': 'Щёлкните по левому концу масштабной линейки, затем по правому. Вторая точка встаёт на одну высоту с первой (Shift отключает).',
    'note.scale.second': 'Теперь щёлкните по другому концу линейки.',
    'note.scale.tooShort': 'Точки слишком близко. Щёлкните по обоим концам линейки.',
    'note.scale.done': 'Масштаб задан: {len} м = {px} px, значит 1 px = {mpp} м. Дальше: Разрез X–Y.',
    'note.tool.section': 'Щёлкните по X, затем по Y — концам линии разреза.',
    'note.section.second': 'Теперь щёлкните по Y, второму концу линии разреза.',
    'note.section.done': 'Линия разреза задана, длина {len} м. Дальше: выберите пласт и возьмите Маркер.',
    'note.section.doneNoScale': 'Линия разреза задана. Задайте масштаб, чтобы видеть длины в метрах.',
    'note.tool.point': 'Щёлкните там, где контакт активного пласта пересекает горизонталь. Сначала задайте высоту горизонтали; [ и ] меняют её на одно сечение.',
    'note.point.noBed': 'Сначала добавьте пласт или просто щёлкните — пласт создастся сам.',
    'note.point.noElev': 'Сначала введите высоту горизонтали.',
    'note.point.first': 'Точка на {h} м. Отметьте ещё одну точку этого пласта на {h} м, и появится линия простирания.',
    'note.point.line': 'Линия простирания {h} м: {n} точек, длина {len} м, проведена прямой.',
    'note.tool.ground': 'Щёлкните там, где линия разреза пересекает горизонталь, чтобы построить рельеф на разрезе. Точка встаёт на X–Y.',
    'note.ground.noSection': 'Сначала проведите линию разреза X–Y.',
    'note.ground.done': 'Точка рельефа {h} м добавлена в разрез.',
    'note.tool.erase': 'Щёлкните по маркеру или точке рельефа, чтобы удалить.',
    'note.erase.miss': 'Здесь нечего стирать. Щёлкните точно по маркеру.',
    'note.erase.done': 'Удалено. Ctrl+Z вернёт обратно.',
    'app.bedDefault': 'Пласт {n}',
    'app.bedColor': 'Цвет пласта',
    'app.bedName': 'Название пласта',
    'app.bedUse': 'Выбрать',
    'app.bedActive': 'Активный',
    'app.bedCounts': 'точек: {p} · линий: {l}',
    'app.delete': 'Удалить',
    'app.delConfirm': 'Удалить вместе с точками?',
    'app.noBeds': 'Пластов пока нет. Добавьте по одному на каждый контакт.',
    'app.scaleOut': '1 px = {mpp} м (линейка {len} м)',
    'app.scaleNone': 'Не задан. Выберите «Масштаб» и щёлкните по концам линейки.',
    'app.noLines': 'Отметьте две точки одного пласта на одной высоте, и появится линия.',
    'app.colH': 'Выс. м',
    'app.colN': 'Точ.',
    'app.colLen': 'Длина м',
    'app.colXY': 'На X–Y м',
    'app.colDev': '± м',
    'app.linesCaption': '«На X–Y» — расстояние от X. «±» — среднее отклонение точек от линии; красным — стоит проверить отметки.',
    'sec.needScale': 'Задайте масштаб, чтобы построить разрез.',
    'sec.needLine': 'Проведите линию разреза X–Y, чтобы построить разрез.',
    'sec.meta': 'X–Y {len} м · по вертикали ×{ve}',
    'sec.needPoints': 'Разрез появится, когда линии простирания пересекут X–Y или вы добавите точки рельефа.',
    'sec.needGround': 'Инструментом «Рельеф» отметьте пересечения X–Y с горизонталями, чтобы построить рельеф.',
    'sec.antiform': '{bed}: замок антиформы около {d} м.',
    'sec.synform': '{bed}: замок синформы около {d} м.',
    'sec.interpret': 'Это только форма: антиформа — антиклиналь, если в ядре более древние породы.',
    'secTab.ground': 'Поверхность рельефа',
    'secTab.noAtt': 'Strike и dip появятся, когда у пласта будет две линии простирания.',
    'secTab.bed': 'Пласт',
    'secTab.true': 'Strike/dip',
    'secTab.apparent': 'Видимый угол',
    'secTab.azimuth': 'Азимут разреза X–Y {az}°. Видимое падение: tg α = tg δ · sin β.',
    'netTab.planeDefault': 'Плоскость {n}',
    'netTab.planeName': 'Название плоскости',
    'netTab.fromMap': 'с карты',
    'netTab.empty': 'Плоскостей пока нет. Измерьте strike/dip на карте или добавьте плоскость вручную.',
    'netTab.needTwo': 'Выберите две плоскости, чтобы найти их общую линию.',
    'netTab.explain': '{a} ({sa}) и {b} ({sb}) пересекаются по линии с азимутом {trend}° и углом погружения {plunge}°. У складки это шарнир.',
    'tabD.empty': 'Слоёв пока нет. Нажмите «Заполнить по пластам» или добавьте слой.',
    'tabD.unitDefault': 'Новый слой',
    'tabD.below': 'Слой ниже самого древнего контакта',
    'tabD.cName': 'Слой', 'tabD.cLith': 'Литология', 'tabD.cAge': 'Возраст', 'tabD.cThick': 'Мощность, м', 'tabD.cDesc': 'Описание', 'tabD.cLegend': 'Легенда',
    'tabD.agePh': 'напр. юра',
    'tabD.linked': 'Цвет совпадает с пластом на карте',
    'tabD.up': 'Выше', 'tabD.down': 'Ниже',
    'tabD.columnTitle': 'Стратиграфическая колонка',
    'tabD.colFoot': 'Мощность в метрах, вверху — самые молодые',
    'tabD.legendDefault': 'Условные обозначения',
    'tabD.show': 'Показывать в легенде', 'tabD.label': 'Текст в легенде',
    'leg.contact': 'Геологическая граница', 'leg.contour': 'Горизонталь (м)', 'leg.structure': 'Линия простирания (м)',
    'leg.section': 'Линия разреза X–Y', 'leg.strike': 'Элементы залегания слоя', 'leg.axis': 'Ось складки, азимут и угол погружения',
    'leg.anticline': 'Осевая линия антиклинали', 'leg.syncline': 'Осевая линия синклинали',
    'file.saved': 'Проект сохранён в файл. Открыть: Файл → Открыть проект.',
    'file.opened': 'Открыт «{name}».',
    'file.exported': 'Экспортировано.',
    'file.err.notJson': 'Это не файл проекта Strikeline.',
    'file.err.notProject': 'Это не файл проекта Strikeline.',
    'file.err.noImage': 'В этом файле проекта нет изображения карты.',
    'lith.limestone': 'Известняк',
    'lith.sandstone': 'Песчаник',
    'lith.conglomerate': 'Конгломерат',
    'lith.siltstone': 'Алевролит',
    'lith.shale': 'Аргиллит, сланец',
    'lith.mudstone': 'Глина',
    'lith.coal': 'Уголь',
    'lith.igneous': 'Магматическая порода',
    'lith.other': 'Другое',
    'map.loading': 'Открываем карту…',
    'map.error': 'Это не изображение. Попробуйте PNG или JPG.',
    'map.storeError': 'Браузер запретил локальное хранилище, поэтому карту не удалось передать в рабочую среду.',
    'dir.E': 'восток', 'dir.W': 'запад', 'dir.N': 'север', 'dir.S': 'юг',
    'dir.NE': 'северо-восток', 'dir.NW': 'северо-запад', 'dir.SE': 'юго-восток', 'dir.SW': 'юго-запад',
  },
};

let lang = 'en';
const listeners = new Set();
const original = new Map(); // element → captured English text/attributes

/** Current language code. */
export const getLang = () => lang;

/** Translate a JS string, filling {placeholders}. */
export function t(key, vars = {}) {
  const s = (STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

/** Format a number for the current language (thin-space thousands in RU). */
export function fmt(n, digits = 0) {
  return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

/** Subscribe to language changes. Returns an unsubscribe function. */
export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Apply a language to every tagged element on the page. */
export function setLang(next) {
  lang = next === 'ru' ? 'ru' : 'en';
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (!original.has(el)) original.set(el, { text: el.textContent });
    const key = el.dataset.i18n;
    el.textContent = lang === 'ru' && RU[key] ? RU[key] : original.get(el).text;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const [attr, key] = el.dataset.i18nAttr.split(':');
    if (!attr || !key) return;
    const store = original.get(el) || {};
    if (!(attr in store)) store[attr] = el.getAttribute(attr);
    original.set(el, store);
    el.setAttribute(attr, lang === 'ru' && RU[key] ? RU[key] : store[attr]);
  });

  document.querySelectorAll('[data-lang]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });

  try { localStorage.setItem(STORE_KEY, lang); } catch { /* private mode: not remembered */ }
  listeners.forEach((fn) => fn(lang));
}

/** Read the saved language (or the browser's) and wire the EN/RU buttons. */
export function initI18n() {
  let saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch { /* ignore */ }
  const initial = saved || ((navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en');

  document.querySelectorAll('[data-lang]').forEach((b) => {
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });
  setLang(initial);
}
