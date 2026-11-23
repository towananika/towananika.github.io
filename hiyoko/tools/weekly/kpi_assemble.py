import re,os
R='/home/claude/towananika.github.io/hiyoko/'
h=open(R+'analysis/index.html',encoding='utf-8').read()
m=open('kpi_main.html',encoding='utf-8').read().replace('__KPI__',open('kpi.json',encoding='utf-8').read())
h=re.sub(r'<main id="main">.*</main>',lambda _:m,h,count=1,flags=re.S)
h=re.sub(r'<title>.*?</title>','<title>KPI一覧 | HIYOKO</title>',h)
h=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="HIYOKO公式XとInstagramの投稿ごとのKPIを、事実のデータだけで並べた一覧。反応・反応率・表示などで並べ替えできます。">',h)
h=h.replace('</head>','<style>\n'+open('kpi.css',encoding='utf-8').read()+'</style>\n</head>',1)
os.makedirs(R+'kpi',exist_ok=True)
open(R+'kpi/index.html','w',encoding='utf-8').write(h)
print('ok',len(h))
