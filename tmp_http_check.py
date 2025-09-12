import re
import requests
from sales_agent.leads.realtime_finder import _REQUESTS_KW

urls = [
    'https://example.com',
    'https://duckduckgo.com/html/?q=test',
    'https://lite.duckduckgo.com/lite/?q=test',
    'https://www.bing.com/search?q=test'
]

block_markers = [
    'unusual traffic', 'verify you are human', 'captcha', 'enable javascript',
    'Access Denied', 'denied', 'blocked', 'forbidden'
]

for u in urls:
    try:
        r = requests.get(u, **_REQUESTS_KW)
        text = r.text or ''
        snippet = re.sub(r'\s+', ' ', text[:600])
        blocked = any(m.lower() in text.lower() for m in block_markers)
        print(f"URL: {u}\nStatus: {r.status_code}, Len: {len(text)}, BlockedHint: {blocked}\nSnippet: {snippet}\n---")
    except Exception as e:
        print(f"URL: {u}\nERROR: {type(e).__name__}: {e}\n---")