/* 二水の学び場の画面。 */
(function () {
  'use strict';
  var C = window.TRI_LEARN, E = window.TriLearn, app = document.getElementById('app');
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function intro() {
    app.innerHTML = '<section class="card intro"><p class="eyebrow">NISUI LEARNING · 5 MINUTES</p><h1>町の出来事から、考える力を育てる。</h1><p>二水の小さな出来事を読み、観察・比較・確認を練習します。正解の点数より、理由を確かめる習慣が目的です。</p><button class="primary" id="start">学びをはじめる</button><p class="note">この記録はこの端末にだけ保存されます。</p></section>';
    document.getElementById('start').onclick = function () { render(E.start()); };
  }
  function question(s, lesson) {
    var answered = s.answers[s.index], choice = answered && lesson.choices.filter(function (item) { return item.id === answered.choice; })[0];
    return '<section class="card lesson"><p class="eyebrow">' + (s.index + 1) + ' / ' + C.lessons.length + ' · ' + esc(lesson.place) + '</p><h2>' + esc(lesson.title) + '</h2><p class="scene">' + esc(lesson.scene) + '</p><p class="question">' + esc(lesson.question) + '</p>' + (answered ? '<div class="result ' + (answered.correct ? 'ok' : 'again') + '"><b>' + (answered.correct ? 'よく見ている。' : 'もう一度、理由を見よう。') + '</b><p>' + esc(lesson.note) + '</p></div><button class="primary" id="next">' + (s.index + 1 === C.lessons.length ? '今日の学びを見る' : '次の出来事へ') + '</button>' : '<div class="choices">' + lesson.choices.map(function (item) { return '<button data-answer="' + item.id + '">' + esc(item.label) + '<span>→</span></button>'; }).join('') + '</div>') + '</section>';
  }
  function finish(s) {
    return '<section class="card finish"><p class="eyebrow">TODAY\'S NOTE</p><h1>今日の学び</h1><p class="score"><b>' + s.score + '</b> / ' + C.lessons.length + ' の気づき</p><p>答えを覚えるより、次に何かを見聞きしたとき「ほかの理由はある？」「比べる相手はそろっている？」「出どころは？」と一度立ち止まれたら十分です。</p><ol>' + s.answers.map(function (answer) { var lesson = C.lessons.filter(function (item) { return item.id === answer.lesson; })[0]; return '<li>' + (answer.correct ? '●' : '○') + ' ' + esc(lesson.title) + ' — ' + (answer.correct ? '確かめられた' : 'あとで見直せる') + '</li>'; }).join('') + '</ol><button class="primary" id="again">もう一度学ぶ</button></section>';
  }
  function render(s) {
    if (!s) { intro(); return; }
    app.innerHTML = '<header><a href="../../">← TRIATHLON</a><span>二水の学び場</span></header>' + (s.finished ? finish(s) : question(s, E.current(s)));
    app.querySelectorAll('[data-answer]').forEach(function (button) { button.onclick = function () { render(E.answer(s, button.dataset.answer)); }; });
    var next = document.getElementById('next'); if (next) next.onclick = function () { render(E.next(s)); };
    var again = document.getElementById('again'); if (again) again.onclick = function () { E.reset(); intro(); };
  }
  render(E.get());
})();
