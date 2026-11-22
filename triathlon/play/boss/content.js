/* ボス戦の固定データ。数値はすべて仮。 */
(function () {
  'use strict';
  window.TRI_BOSS = {
    mpPerAttack: 10,
    party: [
      { id: 'akari', name: 'アカリ', cls: 'ファイター', color: '#D9707A', hp: 70, atk: 12,
        skill: { id: 'smash', name: '一発いこ', cost: 30, text: 'ためた力で、思いきり一撃。' } },
      { id: 'shion', name: 'シオン', cls: 'ナイト', color: '#4FAE84', hp: 90, atk: 8,
        skill: { id: 'guard', name: '盾の構え', cost: 30, text: '次のボスの攻撃まで、みんなの痛みを半分に。' } },
      { id: 'seira', name: 'セイラ', cls: 'クレリック', color: '#5B8FD6', hp: 60, atk: 6,
        skill: { id: 'heal', name: 'ゆっくりでいいよ', cost: 30, text: 'みんなの体力を少し戻す。' } }
    ],
    boss: { name: 'ボス（仮）', hp: 320, atk: 18, bigEvery: 3, bigAtk: 14 }
  };
})();
