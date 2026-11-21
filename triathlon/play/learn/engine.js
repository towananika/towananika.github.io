/* 二水の学び場の状態だけを扱う。 */
(function () {
  'use strict';
  var KEY = 'triathlon-learn-v1', C = window.TRI_LEARN;
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); return s; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } }
  function start() { return save({ version: 1, index: 0, score: 0, answers: [], finished: false }); }
  function current(s) { return s && C.lessons[s.index] || null; }
  function answer(s, id) {
    var lesson = current(s);
    if (!lesson || s.finished || s.answers[s.index]) return s;
    var choice = lesson.choices.filter(function (item) { return item.id === id; })[0];
    if (!choice) return s;
    s.answers.push({ lesson: lesson.id, choice: choice.id, correct: choice.correct });
    if (choice.correct) s.score += 1;
    return save(s);
  }
  function next(s) {
    if (!s || s.finished || !s.answers[s.index]) return s;
    s.index += 1;
    if (s.index >= C.lessons.length) s.finished = true;
    return save(s);
  }
  window.TriLearn = { get: load, start: start, current: current, answer: answer, next: next, reset: function () { localStorage.removeItem(KEY); } };
})();
