/* 二水の学び場。教科を増やすときは lesson を追加する。 */
(function () {
  'use strict';
  window.TRI_LEARN = {
    lessons: [
      {
        id: 'observe', title: '観察する', place: '中路の朝市',
        scene: '三日続けて、あるパンだけが昼前に売り切れた。',
        question: '「このパンは人気だ」と決める前に、まず何をする？',
        choices: [
          { id: 'check', label: '値段・天気・売る数も確かめる', correct: true },
          { id: 'copy', label: 'ほかの店も同じパンを作る', correct: false },
          { id: 'claim', label: '人気だとみんなに伝える', correct: false }
        ],
        note: '一つの出来事だけでは理由は決められない。ほかに変わった条件を比べると、思い込みを減らせる。'
      },
      {
        id: 'compare', title: '比べる', place: '二つの川の合流点',
        scene: '渡し船の待ち時間が、先週より長くなった。',
        question: '原因を考えるために、いちばん役立つ比べ方は？',
        choices: [
          { id: 'otherday', label: '同じ時間帯の先週と、乗る人の数を比べる', correct: true },
          { id: 'guess', label: '船頭の顔色から理由を決める', correct: false },
          { id: 'ignore', label: '待ち時間は気にしない', correct: false }
        ],
        note: '比べる相手をそろえると、何が変わったのかが見えやすくなる。'
      },
      {
        id: 'verify', title: '確かめる', place: '学園図書館',
        scene: '古い地図に「北の水路は閉じた」と書かれていた。',
        question: 'この情報を使う前に、何を確かめる？',
        choices: [
          { id: 'source', label: '誰が、いつ、何のために記録したのかを見る', correct: true },
          { id: 'believe', label: '本に書いてあるので、そのまま信じる', correct: false },
          { id: 'hide', label: 'ほかの人に見せない', correct: false }
        ],
        note: '記録には書いた人の目的や時代がある。出どころを確かめると、情報を安全に使える。'
      }
    ]
  };
})();
