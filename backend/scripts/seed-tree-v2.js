'use strict';

require('dotenv').config();
const path = require('node:path');
const fs = require('node:fs');
const sharp = require('sharp');
const prisma = require('../lib/prisma');
const auth = require('../auth');
const { generateUniqueSlug } = require('../lib/slug');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

const CLANS_DATA = [
  { key: 'Морозовы', name: 'Морозовы', color: '#c0392b', icon: '❦', description: 'Род полоцких конструкторов и инженеров.' },
  { key: 'Волковы',  name: 'Волковы',  color: '#27ae60', icon: '✦', description: 'Род витебских врачей и ученых.' },
  { key: 'Соколовы', name: 'Соколовы', color: '#2980b9', icon: '✶', description: 'Род гродненских учителей и музыкантов.' },
  { key: 'Петровы',  name: 'Петровы',  color: '#8e44ad', icon: '◆', description: 'Род могилевских строителей и агрономов.' }
];

// ═══════════════════════════════════════════════════════════════
//  30 PEOPLE (trimmed from 43)
//  Removed: Светлана(Gen2), Наталья+Дарья(Gen3),
//  Gen4: keep only Тимур(Морозовы) + Максим(Соколовы)
// ═══════════════════════════════════════════════════════════════

const PEOPLE = [
  // ==================== GENERATION 0 (1905-1913, all deceased) ====================
  {
    key: 'fedor_g0',
    firstName: 'Фёдор', lastName: 'Морозов', patronymic: 'Иванович',
    gender: 'MALE',
    birthDate: '1905-03-12', deathDate: '1943-11-05',
    birthPlace: 'д. Любань', deathPlace: 'Поле сражения',
    burialPlace: 'Братская могила, Любань',
    bio: 'Крестьянин из деревни Любань, погиб в Великой Отечественной войне.',
    clanKey: 'Морозовы', generation: 0,
    posX: 540, posY: 1120,
    blocks: [
      { type: 'CHILDHOOD', title: 'Детство в Любани', body: 'Родился в простой крестьянской семье, с детства приучался к тяжелому крестьянскому труду на земле.' },
      { type: 'CAREER', title: 'Крестьянский труд', body: 'До войны занимался сельским хозяйством, помогал односельчанам, прослыл мастером на все руки.' }
    ],
    reviews: [
      { author: 'Пётр (сын)', text: 'Отец ушел на фронт в сорок первом и остался в нашей памяти героем.' }
    ]
  },
  {
    key: 'anna_g0',
    firstName: 'Анна', lastName: 'Морозова', maidenName: 'Ковалёва',
    patronymic: 'Степановна',
    gender: 'FEMALE',
    birthDate: '1908-05-18', deathDate: '1979-09-22',
    birthPlace: 'д. Любань', deathPlace: 'г. Минск',
    burialPlace: 'Северное кладбище, Минск',
    bio: 'Домохозяйка, хранительница очага, воспитавшая детей в трудные военные годы.',
    clanKey: 'Морозовы', generation: 0,
    posX: 760, posY: 1120,
    blocks: [
      { type: 'FAMILY', title: 'Хранительница очага', body: 'Оставшись без мужа в суровые годы войны, сумела сберечь и вырастить детей, дать им образование.' },
      { type: 'HOBBIES', title: 'Любовь к вышивке', body: 'Создавала прекрасные рушники и вышиванки с традиционными орнаментами.' }
    ],
    reviews: [
      { author: 'Нина (дочь)', text: 'Мама умела согреть теплом в самые голодные зимы. Её рушники мы храним как реликвию.' }
    ]
  },
  {
    key: 'ivan_g0',
    firstName: 'Иван', lastName: 'Соколов', patronymic: 'Григорьевич',
    gender: 'MALE',
    birthDate: '1907-06-15', deathDate: '1944-07-28',
    birthPlace: 'г. Гомель', deathPlace: 'Фронт',
    burialPlace: 'Воинское кладбище, Гомель',
    bio: 'Кузнец из Гомеля, мужественно сражавшийся и погибший в годы Великой Отечественной войны.',
    clanKey: 'Соколовы', generation: 0,
    posX: 1200, posY: 1120,
    blocks: [
      { type: 'CAREER', title: 'Кузнечное мастерство', body: 'Работал кузнецом в Гомеле, ковал металл и создавал надежные инструменты для всего города.' },
      { type: 'LEGACY', title: 'Воинский долг', body: 'Был призван на фронт в первые дни войны. Погиб при освобождении родной земли в 1944 году.' }
    ],
    reviews: [
      { author: 'Владимир (сын)', text: 'Отец ковал победу в кузнице, а затем защитил нас ценой своей жизни на фронте.' }
    ]
  },
  {
    key: 'maria_g0',
    firstName: 'Мария', lastName: 'Соколова', maidenName: 'Гурло',
    patronymic: 'Павловна',
    gender: 'FEMALE',
    birthDate: '1910-09-02', deathDate: '1988-12-14',
    birthPlace: 'г. Гомель', deathPlace: 'г. Гомель',
    burialPlace: 'Новобелицкое кладбище, Гомель',
    bio: 'Швея из Гомеля, посвятившая жизнь заботе о семье в послевоенные годы.',
    clanKey: 'Соколовы', generation: 0,
    posX: 1420, posY: 1120,
    blocks: [
      { type: 'CAREER', title: 'Гомельское ателье', body: 'Шила верхнюю одежду для жителей Гомеля, работала в городском ателье.' },
      { type: 'FAMILY', title: 'Воспитание внуков', body: 'Всегда с радостью принимала внуков на каникулах, шила для них лучшие наряды.' }
    ],
    reviews: [
      { author: 'Татьяна (дочь)', text: 'Мама шила прекрасные платья и научила меня ценить аккуратность в деталях.' }
    ]
  },

  // ==================== GENERATION 1 (1928-1936, all deceased) ====================
  {
    key: 'petr_g1',
    firstName: 'Пётр', lastName: 'Морозов', patronymic: 'Фёдорович',
    gender: 'MALE',
    birthDate: '1930-01-20', deathDate: '2005-04-12',
    birthPlace: 'д. Любань', deathPlace: 'г. Минск',
    burialPlace: 'Северное кладбище, Минск',
    bio: 'Труженик Минского тракторного завода (МТЗ), внесший вклад в послевоенное восстановление.',
    clanKey: 'Морозовы', generation: 1,
    posX: 540, posY: 840,
    blocks: [
      { type: 'CAREER', title: 'Рабочий МТЗ', body: 'Более 40 лет проработал слесарем-сборщиком на тракторном заводе, награжден медалью Трудовой Славы.' },
      { type: 'EDUCATION', title: 'Вечерняя школа', body: 'После войны совмещал тяжелую работу на заводе с учебой в вечерней школе.' }
    ],
    reviews: [
      { author: 'Иван (сын)', text: 'Отец научил меня главному — уважать свой труд и никогда не бросать начатое дело.' }
    ]
  },
  {
    key: 'olga_g1',
    firstName: 'Ольга', lastName: 'Морозова', maidenName: 'Лагунова',
    patronymic: 'Антоновна',
    gender: 'FEMALE',
    birthDate: '1934-11-02', deathDate: '2011-08-30',
    birthPlace: 'г. Минск', deathPlace: 'г. Минск',
    burialPlace: 'Северное кладбище, Минск',
    bio: 'Бухгалтер, проработавшая долгие годы в системе коммунального хозяйства Минска.',
    clanKey: 'Морозовы', generation: 1,
    posX: 760, posY: 840,
    blocks: [
      { type: 'CAREER', title: 'Бухгалтерия Минска', body: 'Точность и аккуратность в расчетах были ее визитной карточкой. Уважаемый специалист в коллективе.' },
      { type: 'FAMILY', title: 'Любящая мать', body: 'Создала теплый и уютный дом для мужа Петра и двоих детей.' }
    ],
    reviews: [
      { author: 'Иван (сын)', text: 'У мамы всегда все лежало по полочкам — и в бухгалтерии, и дома.' }
    ]
  },
  {
    key: 'nina_g1',
    firstName: 'Нина', lastName: 'Волкова', maidenName: 'Морозова',
    patronymic: 'Фёдоровна',
    gender: 'FEMALE',
    birthDate: '1933-04-15', deathDate: '2012-05-20',
    birthPlace: 'д. Любань', deathPlace: 'г. Витебск',
    burialPlace: 'Мазуринское кладбище, Витебск',
    bio: 'Заслуженный учитель математики в Витебске, дочь рода Морозовых.',
    clanKey: 'Морозовы', // дочь рода — сохраняет цвет Морозовых
    generation: 1,
    posX: 310, posY: 840,
    blocks: [
      { type: 'CAREER', title: 'Витебская школа', body: 'Преподавала точные науки, вела математические кружки, помогала детям находить призвание.' },
      { type: 'HOBBIES', title: 'Выращивание цветов', body: 'В свободное время занималась разведением гераней и роз на дачном участке.' }
    ],
    reviews: [
      { author: 'Виктор (сын)', text: 'Мама умела объяснить сложнейшую теорему так, что понимал каждый ученик.' }
    ]
  },
  {
    key: 'sergey_g1',
    firstName: 'Сергей', lastName: 'Волков', patronymic: 'Андреевич',
    gender: 'MALE',
    birthDate: '1928-10-12', deathDate: '1998-03-03',
    birthPlace: 'г. Витебск', deathPlace: 'г. Витебск',
    burialPlace: 'Мазуринское кладбище, Витебск',
    bio: 'Ветеран Великой Отечественной войны, после войны работал профессиональным шофёром.',
    clanKey: 'Волковы', generation: 1,
    posX: 90, posY: 840,
    blocks: [
      { type: 'CAREER', title: 'Профессиональный шофёр', body: 'Проехал сотни тысяч километров по дорогам БССР, управляя грузовыми автомобилями автобазы.' },
      { type: 'LEGACY', title: 'Фронтовые воспоминания', body: 'Служил водителем полуторки во время прорыва блокады, награжден боевыми медалями.' }
    ],
    reviews: [
      { author: 'Виктор (сын)', text: 'Отец обожал технику, мог починить мотор грузовика прямо в чистом поле.' }
    ]
  },
  {
    key: 'vladimir_g1',
    firstName: 'Владимир', lastName: 'Соколов', patronymic: 'Иванович',
    gender: 'MALE',
    birthDate: '1932-08-11', deathDate: '2009-02-14',
    birthPlace: 'г. Гомель', deathPlace: 'г. Гомель',
    burialPlace: 'Рандовское кладбище, Гомель',
    bio: 'Инженер-строитель, руководивший восстановлением и застройкой кварталов Гомеля.',
    clanKey: 'Соколовы', generation: 1,
    posX: 1200, posY: 840,
    blocks: [
      { type: 'CAREER', title: 'Генплан Гомеля', body: 'Принимал активное участие в проектировании промышленных зон и жилых микрорайонов.' },
      { type: 'EDUCATION', title: 'Строительный институт', body: 'Окончил Ленинградский инженерно-строительный институт и вернулся восстанавливать родную Беларусь.' }
    ],
    reviews: [
      { author: 'Андрей (сын)', text: 'Дедушка строил жилые дома, в которых до сих пор счастливо живут люди.' }
    ]
  },
  {
    key: 'valentina_g1',
    firstName: 'Валентина', lastName: 'Соколова', maidenName: 'Дроздова',
    patronymic: 'Петровна',
    gender: 'FEMALE',
    birthDate: '1937-05-05', deathDate: '2015-10-25',
    birthPlace: 'г. Рогачев', deathPlace: 'г. Гомель',
    burialPlace: 'Рандовское кладбище, Гомель',
    bio: 'Медицинская сестра Гомельской областной больницы с многолетним стажем.',
    clanKey: 'Соколовы', generation: 1,
    posX: 1420, posY: 840,
    blocks: [
      { type: 'CAREER', title: 'Медицинское служение', body: 'Помогала людям восстанавливаться после операций, дарила пациентам искреннюю заботу и тепло.' },
      { type: 'HOBBIES', title: 'Вязание теплых вещей', body: 'Вязала красивые свитера и носки для всей большой семьи.' }
    ],
    reviews: [
      { author: 'Андрей (сын)', text: 'Мама была самым добрым человеком. Умела лечить просто своим тихим словом.' }
    ]
  },
  {
    key: 'tatiana_g1',
    firstName: 'Татьяна', lastName: 'Петрова', maidenName: 'Соколова',
    patronymic: 'Ивановна',
    gender: 'FEMALE',
    birthDate: '1936-07-07', deathDate: '2018-09-12',
    birthPlace: 'г. Гомель', deathPlace: 'г. Минск',
    burialPlace: 'Восточное кладбище, Минск',
    bio: 'Библиотекарь, много лет заведовавшая отделом редких книг научной библиотеки в Минске.',
    clanKey: 'Соколовы', // дочь рода Соколовых
    generation: 1,
    posX: 2080, posY: 840,
    blocks: [
      { type: 'CAREER', title: 'Отдел редких книг', body: 'Занималась каталогизацией и оцифровкой старинных рукописей, организовывала книжные лектории.' },
      { type: 'EDUCATION', title: 'Минский институт культуры', body: 'Окончила институт культуры с красным дипломом, была влюблена в литературу.' }
    ],
    reviews: [
      { author: 'Михаил (сын)', text: 'Мама привила мне огромную любовь к книгам и уважение к истории.' }
    ]
  },
  {
    key: 'nikolay_g1',
    firstName: 'Николай', lastName: 'Петров', patronymic: 'Степанович',
    gender: 'MALE',
    birthDate: '1931-12-12', deathDate: '2007-06-18',
    birthPlace: 'г. Могилев', deathPlace: 'г. Минск',
    burialPlace: 'Восточное кладбище, Минск',
    bio: 'Токарь-универсал Минского автомобильного завода (МАЗ), заслуженный рационализатор.',
    clanKey: 'Петровы', generation: 1,
    posX: 1860, posY: 840,
    blocks: [
      { type: 'CAREER', title: 'Завод МАЗ', body: 'Разрабатывал уникальные приспособления для скоростной металлообработки деталей грузовиков.' },
      { type: 'HOBBIES', title: 'Дачное хозяйство', body: 'Своими руками построил дачный дом и выращивал прекрасные сорта яблонь.' }
    ],
    reviews: [
      { author: 'Михаил (сын)', text: 'Отец мог выточить на станке деталь любой сложности с ювелирной точностью.' }
    ]
  },

  // ==================== GENERATION 2 (1954-1962, mixed D/L) ====================
  {
    key: 'ivan_g2',
    firstName: 'Иван', lastName: 'Морозов', patronymic: 'Петрович',
    gender: 'MALE',
    birthDate: '1955-02-18', deathDate: '2020-03-14',
    birthPlace: 'г. Минск', deathPlace: 'г. Минск',
    burialPlace: 'Чижовское кладбище, Минск',
    bio: 'Инженер-электрик, проектировавший системы электроснабжения промышленных предприятий.',
    clanKey: 'Морозовы', generation: 2,
    posX: 540, posY: 560,
    blocks: [
      { type: 'CAREER', title: 'Инженерные проекты', body: 'Работал главным специалистом в проектном институте Минэнерго, внедрял энергоэффективные подстанции.' },
      { type: 'EDUCATION', title: 'БПИ', body: 'Окончил энергетический факультет Белорусского политехнического института.' }
    ],
    reviews: [
      { author: 'Сергей (сын)', text: 'Отец всегда учил меня просчитывать безопасность на два шага вперед.' }
    ]
  },
  {
    key: 'tamara_g2',
    firstName: 'Тамара', lastName: 'Морозова', maidenName: 'Шуба',
    patronymic: 'Викторовна',
    gender: 'FEMALE',
    birthDate: '1957-04-20', deathDate: '2019-11-22',
    birthPlace: 'г. Слуцк', deathPlace: 'г. Минск',
    burialPlace: 'Чижовское кладбище, Минск',
    bio: 'Экономист, специалист в области планирования материально-технического снабжения.',
    clanKey: 'Морозовы', generation: 2,
    posX: 760, posY: 560,
    blocks: [
      { type: 'CAREER', title: 'Плановый отдел', body: 'Занималась координацией поставок сырья на крупные трикотажные производства.' },
      { type: 'FAMILY', title: 'Семейная гармония', body: 'Окружила теплом мужа Ивана и детей, сохраняя дружественную атмосферу дома.' }
    ],
    reviews: [
      { author: 'Сергей (сын)', text: 'Мама всегда помогала найти верное решение в любых жизненных вопросах.' }
    ]
  },
  {
    key: 'andrey_g2',
    firstName: 'Андрей', lastName: 'Соколов', patronymic: 'Владимирович',
    gender: 'MALE',
    birthDate: '1956-07-24', deathDate: null,
    birthPlace: 'г. Гомель',
    bio: 'Офицер в отставке, ныне преподает начальную военную подготовку в Минске.',
    clanKey: 'Соколовы', generation: 2,
    posX: 1200, posY: 560
  },
  {
    key: 'larisa_g2',
    firstName: 'Лариса', lastName: 'Соколова', maidenName: 'Дубко',
    patronymic: 'Михайловна',
    gender: 'FEMALE',
    birthDate: '1959-11-12', deathDate: null,
    birthPlace: 'г. Минск',
    bio: 'Врач-педиатр высшей категории в детской городской поликлинике Минска.',
    clanKey: 'Соколовы', generation: 2,
    posX: 1420, posY: 560
  },
  {
    key: 'viktor_g2',
    firstName: 'Виктор', lastName: 'Волков', patronymic: 'Сергеевич',
    gender: 'MALE',
    birthDate: '1954-10-18', deathDate: '2018-05-05',
    birthPlace: 'г. Витебск', deathPlace: 'г. Витебск',
    burialPlace: 'Мазуринское кладбище, Витебск',
    bio: 'Водитель-дальнобойщик, осуществивший сотни международных рейсов.',
    clanKey: 'Волковы', generation: 2,
    posX: 90, posY: 560,
    blocks: [
      { type: 'CAREER', title: 'Международные трассы', body: 'Работал в системе Совтрансавто, объездил множество стран, доставляя ценные грузы.' },
      { type: 'HOBBIES', title: 'Сбор дорожных историй', body: 'Был великолепным рассказчиком, знал сотни интересных историй о дорогах.' }
    ],
    reviews: [
      { author: 'Дмитрий (сын)', text: 'Отец привозил из поездок удивительные сувениры и открытки из разных городов.' }
    ]
  },
  {
    key: 'raisa_g2',
    firstName: 'Раиса', lastName: 'Волкова', maidenName: 'Корзун',
    patronymic: 'Ивановна',
    gender: 'FEMALE',
    birthDate: '1956-03-30', deathDate: null,
    birthPlace: 'г. Полоцк',
    bio: 'Продавец-консультант центрального универмага в Витебске.',
    clanKey: 'Волковы', generation: 2,
    posX: 310, posY: 560
  },
  {
    key: 'mikhail_g2',
    firstName: 'Михаил', lastName: 'Петров', patronymic: 'Николаевич',
    gender: 'MALE',
    birthDate: '1959-06-15', deathDate: '2021-12-08',
    birthPlace: 'г. Минск', deathPlace: 'г. Могилев',
    burialPlace: 'Ново-Машековское кладбище, Могилев',
    bio: 'Учитель истории средней школы, краевед, исследователь Могилевского замка.',
    clanKey: 'Петровы', generation: 2,
    posX: 1860, posY: 560,
    blocks: [
      { type: 'CAREER', title: 'Преподавание истории', body: 'Увлекал школьников уроками истории, вел кружок исторической реконструкции.' },
      { type: 'HOBBIES', title: 'Археологические раскопки', body: 'Каждое лето организовывал экспедиции по исследованию замчищ Могилевщины.' }
    ],
    reviews: [
      { author: 'Роман (сын)', text: 'Отец научил меня любить историю родного края и понимать ценность прошлого.' }
    ]
  },
  {
    key: 'zoya_g2',
    firstName: 'Зоя', lastName: 'Петрова', maidenName: 'Каспер',
    patronymic: 'Александровна',
    gender: 'FEMALE',
    birthDate: '1961-04-22', deathDate: null,
    birthPlace: 'г. Могилев',
    bio: 'Старший воспитатель детского дошкольного центра развития в Могилеве.',
    clanKey: 'Петровы', generation: 2,
    posX: 2080, posY: 560
  },

  // ==================== GENERATION 3 (1979-1986, all living) ====================
  {
    key: 'sergey_g3',
    firstName: 'Сергей', lastName: 'Морозов', patronymic: 'Иванович',
    gender: 'MALE',
    birthDate: '1980-03-12', deathDate: null,
    birthPlace: 'г. Минск',
    bio: 'Старший программист в сфере разработки облачных решений, Минск.',
    clanKey: 'Морозовы', generation: 3,
    posX: 540, posY: 280
  },
  {
    key: 'alena_g3',
    firstName: 'Алёна', lastName: 'Морозова', maidenName: 'Лис',
    patronymic: 'Олеговна',
    gender: 'FEMALE',
    birthDate: '1982-08-15', deathDate: null,
    birthPlace: 'г. Гродно',
    bio: 'Ведущий дизайнер интерьеров в архитектурной студии, Минск.',
    clanKey: 'Морозовы', generation: 3,
    posX: 760, posY: 280
  },
  {
    key: 'artem_g3',
    firstName: 'Артём', lastName: 'Соколов', patronymic: 'Андреевич',
    gender: 'MALE',
    birthDate: '1981-11-05', deathDate: null,
    birthPlace: 'г. Минск',
    bio: 'Врач-хирург отделения сосудистой хирургии в клинической больнице Минска.',
    clanKey: 'Соколовы', generation: 3,
    posX: 1200, posY: 280
  },
  {
    key: 'yulia_g3',
    firstName: 'Юлия', lastName: 'Соколова', maidenName: 'Кот',
    patronymic: 'Романовна',
    gender: 'FEMALE',
    birthDate: '1984-06-12', deathDate: null,
    birthPlace: 'г. Минск',
    bio: 'Фармацевт, управляющая современной сетевой аптекой в Минске.',
    clanKey: 'Соколовы', generation: 3,
    posX: 1420, posY: 280
  },
  {
    key: 'dmitry_g3',
    firstName: 'Дмитрий', lastName: 'Волков', patronymic: 'Викторович',
    gender: 'MALE',
    birthDate: '1979-05-18', deathDate: null,
    birthPlace: 'г. Витебск',
    bio: 'Частный предприниматель в сфере логистических услуг, Витебск.',
    clanKey: 'Волковы', generation: 3,
    posX: 90, posY: 280
  },
  {
    key: 'marina_g3',
    firstName: 'Марина', lastName: 'Волкова', maidenName: 'Шах',
    patronymic: 'Сергеевна',
    gender: 'FEMALE',
    birthDate: '1983-12-25', deathDate: null,
    birthPlace: 'г. Витебск',
    bio: 'Главный бухгалтер в торговой компании, Витебск.',
    clanKey: 'Волковы', generation: 3,
    posX: 310, posY: 280
  },
  {
    key: 'roman_g3',
    firstName: 'Роман', lastName: 'Петров', patronymic: 'Михайлович',
    gender: 'MALE',
    birthDate: '1982-02-14', deathDate: null,
    birthPlace: 'г. Могилев',
    bio: 'Ведущий инженер-программист промышленного холдинга, Могилев.',
    clanKey: 'Петровы', generation: 3,
    posX: 1860, posY: 280
  },
  {
    key: 'oksana_g3',
    firstName: 'Оксана', lastName: 'Петрова', maidenName: 'Бель',
    patronymic: 'Павловна',
    gender: 'FEMALE',
    birthDate: '1985-07-04', deathDate: null,
    birthPlace: 'г. Могилев',
    bio: 'Учитель английского языка высшей категории в гимназии Могилева.',
    clanKey: 'Петровы', generation: 3,
    posX: 2080, posY: 280
  },

  // ==================== GENERATION 4 (2007-2013, living children) ====================
  {
    key: 'timur_g4',
    firstName: 'Тимур', lastName: 'Морозов', patronymic: 'Сергеевич',
    gender: 'MALE',
    birthDate: '2008-05-12', deathDate: null,
    birthPlace: 'г. Минск',
    bio: 'Школьник, увлекается робототехникой и шахматами, Минск.',
    clanKey: 'Морозовы', generation: 4,
    posX: 650, posY: 0
  },
  {
    key: 'maksim_g4',
    firstName: 'Максим', lastName: 'Соколов', patronymic: 'Артёмович',
    gender: 'MALE',
    birthDate: '2009-03-20', deathDate: null,
    birthPlace: 'г. Минск',
    bio: 'Школьник, занимается плаванием и игрой на гитаре, Минск.',
    clanKey: 'Соколовы', generation: 4,
    posX: 1310, posY: 0
  }
];

// ═══════════════════════════════════════════════════════════════
//  CONNECTIONS (trimmed for 30 people)
// ═══════════════════════════════════════════════════════════════

const CONNECTIONS = [
  // Generation 0 spouses
  { fromKey: 'fedor_g0', toKey: 'anna_g0', type: 'SPOUSE' },
  { fromKey: 'ivan_g0', toKey: 'maria_g0', type: 'SPOUSE' },

  // Gen 0 → Gen 1
  { fromKey: 'fedor_g0', toKey: 'petr_g1', type: 'PARENT' },
  { fromKey: 'anna_g0', toKey: 'petr_g1', type: 'PARENT' },
  { fromKey: 'fedor_g0', toKey: 'nina_g1', type: 'PARENT' },
  { fromKey: 'anna_g0', toKey: 'nina_g1', type: 'PARENT' },
  { fromKey: 'ivan_g0', toKey: 'vladimir_g1', type: 'PARENT' },
  { fromKey: 'maria_g0', toKey: 'vladimir_g1', type: 'PARENT' },
  { fromKey: 'ivan_g0', toKey: 'tatiana_g1', type: 'PARENT' },
  { fromKey: 'maria_g0', toKey: 'tatiana_g1', type: 'PARENT' },

  // Gen 1 spouses
  { fromKey: 'petr_g1', toKey: 'olga_g1', type: 'SPOUSE' },
  { fromKey: 'sergey_g1', toKey: 'nina_g1', type: 'SPOUSE' },
  { fromKey: 'vladimir_g1', toKey: 'valentina_g1', type: 'SPOUSE' },
  { fromKey: 'nikolay_g1', toKey: 'tatiana_g1', type: 'SPOUSE' },

  // Gen 1 → Gen 2
  { fromKey: 'petr_g1', toKey: 'ivan_g2', type: 'PARENT' },
  { fromKey: 'olga_g1', toKey: 'ivan_g2', type: 'PARENT' },
  { fromKey: 'vladimir_g1', toKey: 'andrey_g2', type: 'PARENT' },
  { fromKey: 'valentina_g1', toKey: 'andrey_g2', type: 'PARENT' },
  { fromKey: 'sergey_g1', toKey: 'viktor_g2', type: 'PARENT' },
  { fromKey: 'nina_g1', toKey: 'viktor_g2', type: 'PARENT' },
  { fromKey: 'nikolay_g1', toKey: 'mikhail_g2', type: 'PARENT' },
  { fromKey: 'tatiana_g1', toKey: 'mikhail_g2', type: 'PARENT' },

  // Gen 2 spouses
  { fromKey: 'ivan_g2', toKey: 'tamara_g2', type: 'SPOUSE' },
  { fromKey: 'andrey_g2', toKey: 'larisa_g2', type: 'SPOUSE' },
  { fromKey: 'viktor_g2', toKey: 'raisa_g2', type: 'SPOUSE' },
  { fromKey: 'mikhail_g2', toKey: 'zoya_g2', type: 'SPOUSE' },

  // Gen 2 → Gen 3
  { fromKey: 'ivan_g2', toKey: 'sergey_g3', type: 'PARENT' },
  { fromKey: 'tamara_g2', toKey: 'sergey_g3', type: 'PARENT' },
  { fromKey: 'andrey_g2', toKey: 'artem_g3', type: 'PARENT' },
  { fromKey: 'larisa_g2', toKey: 'artem_g3', type: 'PARENT' },
  { fromKey: 'viktor_g2', toKey: 'dmitry_g3', type: 'PARENT' },
  { fromKey: 'raisa_g2', toKey: 'dmitry_g3', type: 'PARENT' },
  { fromKey: 'mikhail_g2', toKey: 'roman_g3', type: 'PARENT' },
  { fromKey: 'zoya_g2', toKey: 'roman_g3', type: 'PARENT' },

  // Gen 3 spouses
  { fromKey: 'sergey_g3', toKey: 'alena_g3', type: 'SPOUSE' },
  { fromKey: 'artem_g3', toKey: 'yulia_g3', type: 'SPOUSE' },
  { fromKey: 'dmitry_g3', toKey: 'marina_g3', type: 'SPOUSE' },
  { fromKey: 'roman_g3', toKey: 'oksana_g3', type: 'SPOUSE' },

  // Gen 3 → Gen 4
  { fromKey: 'sergey_g3', toKey: 'timur_g4', type: 'PARENT' },
  { fromKey: 'alena_g3', toKey: 'timur_g4', type: 'PARENT' },
  { fromKey: 'artem_g3', toKey: 'maksim_g4', type: 'PARENT' },
  { fromKey: 'yulia_g3', toKey: 'maksim_g4', type: 'PARENT' }
];

// ═══════════════════════════════════════════════════════════════
//  Fallback photos: map person keys to existing old portrait files
//  These are used when we can't generate new photos (quota exhausted)
// ═══════════════════════════════════════════════════════════════

// For deceased persons who need extra photos (photo_1, photo_2),
// we check for existing files or duplicate the avatar as fallback
function getFallbackPhoto(personKey, suffix) {
  // Check if specific photo already exists
  const specificFile = `photo_${personKey}_${suffix}.webp`;
  if (fs.existsSync(path.join(UPLOADS_DIR, specificFile))) {
    return specificFile;
  }
  // Otherwise use the avatar as fallback
  const avatarFile = `avatar_${personKey}.webp`;
  if (fs.existsSync(path.join(UPLOADS_DIR, avatarFile))) {
    return avatarFile;
  }
  return null;
}

async function main() {
  console.log('🔄 Cleaning up database records inside a transaction...');

  await prisma.$transaction(async (tx) => {
    // Delete all rows in proper order to prevent constraint violations
    await tx.candleLight.deleteMany({});
    await tx.guestMemory.deleteMany({});
    await tx.galleryItem.deleteMany({});
    await tx.profileAccess.deleteMany({});
    await tx.profileAccessCode.deleteMany({});
    await tx.qrPlaque.deleteMany({});
    await tx.profileDispute.deleteMany({});
    await tx.profileMergeRequest.deleteMany({});
    await tx.contentBlock.deleteMany({});
    await tx.timelineEvent.deleteMany({});
    await tx.familyConnection.deleteMany({});
    await tx.profile.deleteMany({});
    await tx.familyNode.deleteMany({});
    await tx.familyClan.deleteMany({});
    await tx.familyTree.deleteMany({});
    await tx.media.deleteMany({});

    console.log('🗑️ DB rows cleared.');

    // 1. Recreate Admin
    const email = 'admin@admin.local';
    const passwordHash = auth.hashPassword('qwer2609');
    let admin = await tx.user.findUnique({ where: { email } });
    if (!admin) {
      admin = await tx.user.create({
        data: {
          email,
          displayName: 'admin',
          role: 'ADMIN',
          passwordHash,
          acceptedTermsAt: new Date()
        }
      });
    } else {
      admin = await tx.user.update({
        where: { email },
        data: { role: 'ADMIN', passwordHash }
      });
    }
    console.log('👤 Admin verified:', admin.email);

    // 2. Recreate single FamilyTree
    const tree = await tx.familyTree.create({
      data: {
        name: 'Родословное древо Морозовых, Соколовых, Волковых и Петровых',
        description: 'Белорусское генеалогическое древо четырёх пересекающихся родов на протяжении пяти поколений (30 человек).',
        ownerId: admin.id,
        visibility: 'PUBLIC',
      }
    });
    console.log('🌳 FamilyTree created:', tree.id);

    // 3. Create Clans
    const clanIds = {};
    for (const c of CLANS_DATA) {
      const clan = await tx.familyClan.create({
        data: {
          treeId: tree.id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          description: c.description
        }
      });
      clanIds[c.key] = clan.id;
    }
    console.log('✅ Clans created:', Object.keys(clanIds));

    // Helper to register a file as Media record
    async function registerMedia(filename) {
      const url = `/uploads/${filename}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      let size = 1024 * 50;
      let width = 600;
      let height = 600;
      if (fs.existsSync(filePath)) {
        size = fs.statSync(filePath).size;
        try {
          const meta = await sharp(filePath).metadata();
          width = meta.width || 600;
          height = meta.height || 600;
        } catch (err) {
          console.error(`Failed to read metadata for ${filename}:`, err);
        }
      } else {
        console.warn(`⚠️ File not found: ${filename}, registering with defaults`);
      }
      const media = await tx.media.create({
        data: {
          kind: 'IMAGE',
          url,
          originalName: filename,
          mimeType: 'image/webp',
          sizeBytes: size,
          width,
          height,
          uploadedById: admin.id
        }
      });
      return media.id;
    }

    const nodeIds = {};

    // 4. Create Nodes and optionally Profiles
    for (const p of PEOPLE) {
      const dec = !!p.deathDate;
      const avatarFilename = `avatar_${p.key}.webp`;
      const avatarMediaId = await registerMedia(avatarFilename);

      const birthDate = new Date(Date.UTC(...p.birthDate.split('-').map((x, idx) => idx === 1 ? parseInt(x) - 1 : parseInt(x))));
      const deathDate = p.deathDate
        ? new Date(Date.UTC(...p.deathDate.split('-').map((x, idx) => idx === 1 ? parseInt(x) - 1 : parseInt(x))))
        : null;

      const bornYear = birthDate.getUTCFullYear();
      const diedYear = deathDate ? deathDate.getUTCFullYear() : '';

      const node = await tx.familyNode.create({
        data: {
          treeId: tree.id,
          firstName: p.firstName,
          lastName: p.lastName,
          maidenName: p.maidenName,
          birthDate,
          deathDate,
          gender: p.gender,
          photoId: avatarMediaId,
          clanId: clanIds[p.clanKey] || null,
          posX: p.posX,
          posY: p.posY,
          generation: p.generation,
          notes: p.bio
        }
      });
      nodeIds[p.key] = node.id;

      // Timeline: Birth
      await tx.timelineEvent.create({
        data: {
          familyNodeId: node.id,
          category: 'BIRTH',
          title: 'Рождение',
          description: `Рождение в ${p.birthPlace || 'родном крае'}.`,
          date: birthDate,
          dateAccuracy: 'day'
        }
      });

      // Timeline: Death
      if (deathDate) {
        await tx.timelineEvent.create({
          data: {
            familyNodeId: node.id,
            category: 'DEATH',
            title: 'Уход из жизни',
            description: `Скончался в возрасте ${diedYear - bornYear} лет. Похоронен: ${p.burialPlace || 'на местном кладбище'}.`,
            date: deathDate,
            dateAccuracy: 'day'
          }
        });
      }

      // If deceased, create a Profile (Memory Page)
      if (dec) {
        const slugBase = `${p.lastName}-${p.firstName}`;
        const slug = await generateUniqueSlug(slugBase, tx);
        const fullName = `${p.lastName} ${p.firstName} ${p.patronymic || ''}`;

        // Use avatar for cover
        const profile = await tx.profile.create({
          data: {
            slug,
            fullName,
            birthDate,
            deathDate,
            birthPlace: p.birthPlace,
            deathPlace: p.deathPlace,
            burialPlace: p.burialPlace,
            bio: p.bio,
            coverPhotoId: avatarMediaId,
            gender: p.gender,
            visibility: 'PUBLIC',
            ownerId: admin.id,
            familyNodeId: node.id
          }
        });

        // Link timeline events to profile too
        await tx.timelineEvent.updateMany({
          where: { familyNodeId: node.id },
          data: { profileId: profile.id }
        });

        // Extra photos for content blocks — use fallbacks from existing uploads
        const photo1File = getFallbackPhoto(p.key, '1') || avatarFilename;
        const photo2File = getFallbackPhoto(p.key, '2') || avatarFilename;
        const photo1Id = await registerMedia(photo1File);
        const photo2Id = await registerMedia(photo2File);

        // Create Content Blocks
        let blockOrder = 0;
        if (p.blocks) {
          for (const bl of p.blocks) {
            const photoId = blockOrder === 0 ? photo1Id : photo2Id;
            await tx.contentBlock.create({
              data: {
                profileId: profile.id,
                type: bl.type,
                title: bl.title,
                body: bl.body,
                photoId,
                order: blockOrder++
              }
            });
          }
        }

        // Create Gallery items
        await tx.galleryItem.create({
          data: {
            profileId: profile.id,
            mediaId: photo1Id,
            caption: `${p.firstName} — архивное фото`,
            order: 0
          }
        });
        await tx.galleryItem.create({
          data: {
            profileId: profile.id,
            mediaId: photo2Id,
            caption: `${p.firstName} — семейный снимок`,
            order: 1
          }
        });

        // Guest Memories (reviews)
        if (p.reviews) {
          for (const rev of p.reviews) {
            await tx.guestMemory.create({
              data: {
                profileId: profile.id,
                authorName: rev.author,
                type: 'TEXT',
                text: rev.text,
                isApproved: true,
                approvedAt: new Date(),
                approvedById: admin.id
              }
            });
          }
        }
      }
    }

    console.log(`👤 ${PEOPLE.length} family nodes created. Profiles generated for deceased.`);

    // 5. Create connections
    for (const conn of CONNECTIONS) {
      const fromId = nodeIds[conn.fromKey];
      const toId = nodeIds[conn.toKey];
      if (fromId && toId) {
        await tx.familyConnection.create({
          data: {
            fromNodeId: fromId,
            toNodeId: toId,
            type: conn.type
          }
        });

        // Mirror SPOUSE connection
        if (conn.type === 'SPOUSE') {
          await tx.familyConnection.create({
            data: {
              fromNodeId: toId,
              toNodeId: fromId,
              type: 'SPOUSE'
            }
          });
        }
      }
    }
    console.log(`🔗 ${PEOPLE.length}-person tree connections generated successfully.`);
  }, { maxWait: 30000, timeout: 120000 });

  console.log('🎉 Database transaction seeding complete!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('FATAL TRANSACTION SEED ERROR:', e);
  process.exit(1);
});
