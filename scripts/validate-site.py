#!/usr/bin/env python3
"""Validate the actual static publish artifact, not source fragments."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,sys,xml.etree.ElementTree as ET
ROOT=Path('dist').resolve(); errors=[]; catalog=json.loads(Path('src/data/tools.json').read_text())
class Parser(HTMLParser):
 def __init__(self):
  super().__init__();self.ids=set();self.refs=[];self.h1=0;self.canon=[];self.description=False;self.title=False;self.in_head=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='head':self.in_head=True
  if tag in ['meta','title'] or (tag=='link' and a.get('rel')=='canonical'):
   if not self.in_head:errors.append('Metadata outside head: '+tag)
  if a.get('id'):
   if a['id'] in self.ids:errors.append('Duplicate id: '+a['id'])
   self.ids.add(a['id'])
  self.h1+=tag=='h1';self.title|=tag=='title'
  self.description|=tag=='meta' and a.get('name')=='description' and bool(a.get('content'))
  if tag=='link' and a.get('rel')=='canonical':self.canon.append(a.get('href',''))
  attr={'a':'href','link':'href','script':'src','img':'src'}.get(tag)
  if attr and a.get(attr):self.refs.append(a[attr])
  if any(k.startswith('on') for k in a):errors.append('Inline event handler')
 def handle_endtag(self,tag):
  if tag=='head':self.in_head=False
def target(url,source):
 u=urlsplit(url)
 if u.scheme and (u.scheme not in ['https','http'] or u.netloc!='tools.openaa.com'):return None
 if u.netloc and u.netloc!='tools.openaa.com':return None
 p=(ROOT/unquote(u.path).lstrip('/')) if u.path.startswith('/') else source.parent/unquote(u.path)
 if not u.path:p=source
 if p.is_dir():p=p/'index.html'
 return p
for f in ROOT.rglob('*.html'):
 text=f.read_text();p=Parser();p.feed(text)
 if p.h1!=1:errors.append(f'{f.relative_to(ROOT)}: h1 count {p.h1}')
 if not p.title or not p.description:errors.append(f'{f}: missing metadata')
 if len(p.canon)!=1 or not p.canon[0].startswith('https://tools.openaa.com/'):errors.append(f'{f}: wrong canonical')
 if 'toolku' in text.lower():errors.append(f'{f}: old brand')
 for ref in p.refs:
  t=target(ref,f)
  if t is not None and not t.exists():errors.append(f'{f.relative_to(ROOT)}: missing {ref}')
for tool in catalog:
 if not target(tool['path'],ROOT/'index.html').is_file():errors.append('Missing tool '+tool['path'])
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[e.text for e in ET.parse(ROOT/'sitemap.xml').findall('.//s:loc',ns)]
assert len(urls)==len(catalog)+2+len(json.loads(Path("src/data/seo-guides.json").read_text()))+sum(len(json.loads(p.read_text())) for p in Path("src/data/tool-guides").glob("*.json")) and len(set(urls))==len(urls)
assert not any('404' in x for x in urls)
assert 'https://tools.openaa.com/tools/' not in urls
assert not (ROOT/'tools/index.html').exists(), 'Removed catalog must not be published'
for url in urls:
 if not target(url,ROOT/'index.html').exists():errors.append('Missing sitemap URL '+url)
if errors:
 print('\n'.join(errors));sys.exit(1)
print(f'Validated {len(list(ROOT.rglob("*.html")))} pages, {len(catalog)} tool routes, metadata, IDs, scripts, styles, icons and sitemap.')
