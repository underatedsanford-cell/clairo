import os
from leads.realtime_finder import find_leads_realtime

os.environ["LEADS_DEBUG"] = "1"

leads = find_leads_realtime(niche="plumber", location="miami", max_results=3, time_budget_sec=25)
print("RESULTS:")
for i, l in enumerate(leads, 1):
    print(i, l)