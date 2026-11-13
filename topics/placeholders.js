window.TOPICS = window.TOPICS || [];
// Темы, презентации которых ещё не загружены. Будут заменены полноценными файлами topicN.js
[
  [3, 'Тема 3', 'Финансовая модель и юнит-экономика (ожидается)', { name: 'Unit Economics', url: 'https://productgamer.ru/' }],
  [4, 'Тема 4', 'Ожидает презентацию', { name: 'Hiring a team', url: 'https://productgamer.ru/' }],
  [5, 'Тема 5', 'Ожидает презентацию', { name: 'LeSS', url: 'https://productgamer.ru/' }],
  [6, 'Тема 6', 'Ожидает презентацию', { name: 'Development', url: 'https://productgamer.ru/' }],
  [7, 'Тема 7', 'Ожидает презентацию', { name: 'Infrastructure', url: 'https://productgamer.ru/' }],
  [8, 'Тема 8', 'Ожидает презентацию', { name: 'Final Game', url: 'https://productgamer.ru/' }]
].forEach(([id, short, title, game]) => {
  if (!window.TOPICS.some(t => t.id === id)) window.TOPICS.push({ id, short, title, game, soon: true });
});
