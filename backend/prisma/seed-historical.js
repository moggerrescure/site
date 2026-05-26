// Seed: 12 исторических событий XX века для общей летописи.
// Идемпотентно: проверяет существование по (title + date), не дублирует.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EVENTS = [
  { date: '1914-07-28', title: 'Начало Первой мировой войны',     iconKey: 'war',  description: 'Австро-Венгрия объявила войну Сербии. Война охватила Европу и стала одной из самых разрушительных в истории.' },
  { date: '1917-11-07', title: 'Октябрьская революция',            iconKey: 'flag', description: 'Большевики во главе с Лениным взяли власть в Петрограде. Падение Временного правительства.' },
  { date: '1919-01-01', title: 'Образование БССР',                 iconKey: 'flag', description: 'Провозглашение Белорусской Советской Социалистической Республики. Минск стал столицей.' },
  { date: '1921-10-30', title: 'Открытие БГУ',                     iconKey: 'book', description: 'Основан Белорусский государственный университет — старейший университет республики.' },
  { date: '1922-12-30', title: 'Образование СССР',                 iconKey: 'flag', description: 'Договор об образовании Союза Советских Социалистических Республик. БССР вошла в состав СССР.' },
  { date: '1939-09-01', title: 'Начало Второй мировой войны',      iconKey: 'war',  description: 'Нападение Германии на Польшу. Война охватила весь мир и продлилась шесть лет.' },
  { date: '1941-06-22', title: 'Начало Великой Отечественной войны', iconKey: 'war', description: 'Нападение нацистской Германии на СССР. Беларусь оказалась в зоне оккупации.' },
  { date: '1945-05-09', title: 'День Победы',                      iconKey: 'star', description: 'Безоговорочная капитуляция нацистской Германии. Конец Великой Отечественной войны.' },
  { date: '1961-04-12', title: 'Полёт Юрия Гагарина',              iconKey: 'star', description: 'Первый в истории полёт человека в космос. Гагарин совершил один оборот вокруг Земли за 108 минут.' },
  { date: '1986-04-26', title: 'Авария на Чернобыльской АЭС',      iconKey: 'war',  description: 'Крупнейшая ядерная катастрофа в истории. Радиоактивное загрязнение затронуло значительную часть Беларуси.' },
  { date: '1991-12-08', title: 'Распад СССР',                      iconKey: 'flag', description: 'Беловежские соглашения. Прекращение существования СССР, образование СНГ.' },
  { date: '1994-07-10', title: 'Первые президентские выборы Беларуси', iconKey: 'flag', description: 'Состоялись первые в истории независимой Беларуси выборы президента.' },
];

async function main() {
  let created = 0, skipped = 0;
  for (const ev of EVENTS) {
    const date = new Date(ev.date);
    const exists = await prisma.timelineEvent.findFirst({
      where: { title: ev.title, date, category: 'HISTORICAL' },
    });
    if (exists) { skipped++; continue; }
    await prisma.timelineEvent.create({
      data: {
        category: 'HISTORICAL',
        title: ev.title,
        description: ev.description,
        date,
        dateAccuracy: 'day',
        iconKey: ev.iconKey,
        // familyNodeId / profileId / createdById намеренно NULL — это глобальное событие
      },
    });
    created++;
    console.log(`  ✓ ${ev.date} — ${ev.title}`);
  }
  console.log(`\nДобавлено: ${created}, пропущено (уже есть): ${skipped}, всего: ${EVENTS.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
