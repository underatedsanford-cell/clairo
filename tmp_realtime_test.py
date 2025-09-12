import json, os
from sales_agent.leads.realtime_finder import search_duckduckgo, search_bing, extract_contacts_from_html, _get, find_leads_realtime

queries = [
    "plumber miami contact",
    "SaaS startups remote contact email",
]

for q in queries:
    ddg = search_duckduckgo(q, max_pages=1)
    bing = search_bing(q, max_pages=1)
    print("Q:", q)
    print("DDG count:", len(ddg))
    print("Bing count:", len(bing))
    print("DDG sample:", ddg[:5])
    print("Bing sample:", bing[:5])
    print("---")

# Try fetching first non-social url and extract contacts
cands = []
for q in queries:
    cands += search_duckduckgo(q, max_pages=1) + search_bing(q, max_pages=1)
seen = set()
for u in cands:
    if any(s in u for s in ("facebook.com","instagram.com","twitter.com","linkedin.com","youtube.com","tiktok.com")):
        continue
    if u in seen:
        continue
    seen.add(u)
    html = _get(u)
    if not html:
        continue
    c = extract_contacts_from_html(html, u)
    if c.get('emails') or c.get('phones') or c.get('whatsapp'):
        print("Hit:", u)
        print(json.dumps(c, indent=2)[:800])
        break

# End-to-end realtime leads test
os.environ.setdefault("LEADS_DEBUG", "1")
print("\n=== Realtime Leads ===")
leads = find_leads_realtime(niche="plumber", location="miami", max_results=5, time_budget_sec=25)
print(f"Produced {len(leads)} leads")
for i, lead in enumerate(leads[:5], 1):
    print(f"[{i}] {lead.get('business_name') or ''} :: {lead.get('website')} :: emails={len(lead.get('emails', []))} phones={len(lead.get('phones', []))}")
    print(json.dumps(lead, indent=2)[:800])
    print("---")