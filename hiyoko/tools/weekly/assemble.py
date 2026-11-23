import json,re
R='/home/claude/towananika.github.io/hiyoko/'
d=json.load(open('data.json'))
d['ig']=[w for w in d['ig'] if '2026-04-27'<=w['week']<'2026-11-16']
h=open(R+'analysis/index.html',encoding='utf-8').read()
m=open('main.html',encoding='utf-8').read().replace('__DATA__',json.dumps(d,ensure_ascii=False,separators=(',',':')))
h=re.sub(r'<main id="main">.*</main>',lambda _:m,h,count=1,flags=re.S)
h=h.replace('HIYOKO公式XとInstagramの投稿分析の概要。チャンネルごとの要点と、コンテンツの3グループ。','HIYOKO公式XとInstagramの数字を、週ごとと、これまでの流れで見るページ。')
open(R+'analysis/index.html','w',encoding='utf-8').write(h)
css=open(R+'style.css',encoding='utf-8').read()
if '/* weekly analysis + trend' not in css:
    open(R+'style.css','a',encoding='utf-8').write('\n'+open('wa.css',encoding='utf-8').read())
print('ok',len(h))
