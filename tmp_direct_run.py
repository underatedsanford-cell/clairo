import json, time
from sales_agent.leads.realtime_finder import find_leads_realtime

start = time.time()
leads = find_leads_realtime(
    niche='Plumber',
    location='Miami',
    desired_count=1,
    preferred_channels=['phone','email'],
    time_limit_seconds=150,
)
print('Elapsed:', round(time.time()-start,1),'s')
print(json.dumps(leads, indent=2)[:1600])
