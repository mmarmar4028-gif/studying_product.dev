window.TOPICS = window.TOPICS || [];
// Темы, презентации которых ещё не загружены. Будут заменены полноценными файлами topicN.js
[
  [7, 'Тема 7', 'Ожидает презентацию (вероятно, инфраструктура)', { name: 'Infrastructure', url: 'https://productgamer.ru/' }],
  [8, 'Тема 8', 'Ожидает презентацию (вероятно, финальная игра)', { name: 'Final Game', url: 'https://productgamer.ru/' }]
].forEach(([id, short, title, game]) => {
  if (!window.TOPICS.some(t => t.id === id)) window.TOPICS.push({ id, short, title, game, soon: true });
});
