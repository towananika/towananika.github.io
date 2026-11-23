import csv,json,datetime as dt,collections
D=dt.date
def mon(d): return d-dt.timedelta(days=d.weekday())
def px(s): return dt.datetime.strptime(s.strip('"'),"%a, %b %d, %Y").date()
# X daily
X=collections.OrderedDict()
for r in csv.DictReader(open('/mnt/user-data/uploads/hearth/5463ede9-1971-41d1-9c5f-0952e5c4859f/5463ede9-1971-41d1-9c5f-0952e5c4859f.csv',encoding='utf-8-sig')):
    d=px(r['Date']);w=mon(d)
    if w<D(2025,11,24) or w>D(2026,11,16): continue
    a=X.setdefault(w,dict(days=0,follows=0,unfollows=0,imp=0,likes=0,pv=0,posts=0))
    a['days']+=1;a['follows']+=int(r['New follows']);a['unfollows']+=int(r['Unfollows']);a['imp']+=int(r['Impressions']);a['likes']+=int(r['Likes']);a['pv']+=int(r['Profile visits']);a['posts']+=int(r['Create Post'])
XP=collections.defaultdict(list)
seen=set()
for r in [*csv.DictReader(open('/mnt/user-data/uploads/hearth/4c1174a6-22a6-4885-84f3-659c4363df18/4c1174a6-22a6-4885-84f3-659c4363df18.csv',encoding='utf-8-sig')),*csv.DictReader(open('/mnt/user-data/uploads/Downloads/hiyoko (2).csv',encoding='utf-8-sig'))]:
    if r['Post id'] in seen: continue
    seen.add(r['Post id']);d=px(r['Date']);XP[mon(d)].append(dict(t=r['Post text'][:60].replace('\n',' '),u=r['Post Link'],imp=int(r['Impressions']),likes=int(r['Likes']),date=d.isoformat()))
xs=[]
for w in sorted(X):
    a=X[w];p=sorted(XP.get(w,[]),key=lambda q:-q['imp'])
    xs.append(dict(week=w.isoformat(),**a,top=p[:2],low=p[-2:][::-1] if len(p)>=4 else []))
# IG per post
IG=collections.defaultdict(list)
TY={'Instagram 릴스':'リール','Instagram 이미지':'画像','Instagram 슬라이드':'スライド'}
for r in csv.DictReader(open('/mnt/project-files/uploads/hearth/236a1f91-06dd-4afc-b307-63868e995d47',encoding='utf-8-sig')):
    d=dt.datetime.strptime(r['게시 시간'],'%m/%d/%Y %H:%M').date()
    IG[mon(d)].append(dict(t=(r['설명'] or '(テキストなし)')[:60].replace('\n',' '),u=r['고유 링크'],views=int(r['조회'] or 0),likes=int(r['좋아요'] or 0),shares=int(r['공유'] or 0),follows=int(r['팔로우'] or 0),date=d.isoformat(),type=TY.get(r['게시물 유형'],r['게시물 유형'])))
SPV=20000
spc=[q for L in IG.values() for q in L if q['views']>=SPV]
for k in IG: IG[k]=[q for q in IG[k] if q['views']<SPV]
igs=[];w=min(IG)
while w<=D(2026,11,16):
    p=sorted(IG.get(w,[]),key=lambda q:-q['views'])
    igs.append(dict(week=w.isoformat(),posts=len(p),views=sum(q['views'] for q in p),likes=sum(q['likes'] for q in p),shares=sum(q['shares'] for q in p),follows=sum(q['follows'] for q in p),top=[dict(q) for q in p[:2]],low=[dict(q) for q in p[-2:][::-1]] if len(p)>=4 else []))
    w+=dt.timedelta(days=7)
xsp=[]
for r in csv.DictReader(open('/mnt/user-data/uploads/hearth/5463ede9-1971-41d1-9c5f-0952e5c4859f/5463ede9-1971-41d1-9c5f-0952e5c4859f.csv',encoding='utf-8-sig')):
    d=px(r['Date'])
    if d.isoformat() in ('2026-04-15','2026-06-15','2026-06-16','2026-06-17'): xsp.append(dict(date=d.isoformat(),follows=int(r['New follows']),imp=int(r['Impressions']),likes=int(r['Likes']),pv=int(r['Profile visits'])))
xsp.sort(key=lambda q:q['date'])
spc.sort(key=lambda q:q['date']);xp=[]
for r in csv.DictReader(open('/mnt/project-files/x-analytics/hiyoko_posts_jul-nov_by_content.csv',encoding='utf-8-sig')):
    xp.append([r['Date'][:10],r['Post text'][:70].replace('\n',' '),r['Post Link'],int(r['Impressions']),int(r['Likes']),int(r['Profile visits']),r['fmt'],r['theme']])
igp=[]
for r in csv.DictReader(open('/mnt/project-files/x-analytics/hiyoko_instagram_posts_classified.csv',encoding='utf-8-sig')):
    v=int(r['views'] or 0)
    if v>=SPV: continue
    igp.append([r['time'][:10],(r['text'] or '(テキストなし)')[:70].replace('\n',' '),r['link'],v,int(r['likes'] or 0),int(r['shares'] or 0),int(r['follows'] or 0),r['type'],r['theme']])
json.dump(dict(x=xs,ig=igs,sp=spc,xsp=xsp,xp=xp,igp=igp),open('data.json','w'),ensure_ascii=False)
for s in xs: print('X',s['week'],s['days'],s['follows']-s['unfollows'],s['imp'],s['likes'],s['pv'],s['posts'])
for s in igs: print('IG',s['week'],s['posts'],s['views'],s['likes'],s['shares'],s['follows'],[q['type'] for q in s['top']][:1])
