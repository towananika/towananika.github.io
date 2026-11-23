import csv,json,datetime as dt
def px(s): return dt.datetime.strptime(s.strip('"'),"%a, %b %d, %Y").date().isoformat()
X={}
# Xの公式埋め込みで見つからなかった投稿は再生成時も表示しない。
UNAVAILABLE_X={"2124660961370054723"}
srcs=['/mnt/project-files/x-analytics/raw-2026-11-23/account_analytics_content.csv','/mnt/user-data/uploads/Downloads/hiyoko (2).csv','/mnt/project-files/x-analytics/hiyoko_posts_jul-nov_by_content.csv']
for f in srcs:
    for r in csv.DictReader(open(f,encoding='utf-8-sig')):
        if r['Post id'] in X or r['Post id'] in UNAVAILABLE_X: continue
        d=r['Date'];d=d[:10] if d[:2]=='20' else px(d)
        n=lambda k:int(float(r.get(k) or 0))
        X[r['Post id']]=[d,r['Post text'][:200].replace('\n',' '),r['Post Link'],n('Impressions'),n('Likes'),n('Replies'),n('Reposts'),n('Bookmarks'),n('Profile visits'),n('URL Clicks'),n('Engagements'),n('New follows')]
I=[]
TY={'Instagram 릴스':'リール','Instagram 이미지':'画像','Instagram 슬라이드':'カルーセル'}
for r in csv.DictReader(open('/mnt/project-files/uploads/hearth/236a1f91-06dd-4afc-b307-63868e995d47',encoding='utf-8-sig')):
    d=dt.datetime.strptime(r['게시 시간'],'%m/%d/%Y %H:%M').date().isoformat()
    n=lambda k:int(r[k] or 0)
    I.append([d,(r['설명'] or '').replace('\n',' ')[:200],r['고유 링크'],n('조회'),n('도달'),n('좋아요'),n('댓글'),n('공유'),n('저장'),n('팔로우'),TY.get(r['게시물 유형'],r['게시물 유형'])])
x=sorted(X.values(),key=lambda p:p[0],reverse=True);I.sort(key=lambda p:p[0],reverse=True)
json.dump(dict(x=x,ig=I),open('kpi.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(x),x[0][0],x[-1][0],len(I),I[0][0],I[-1][0])
