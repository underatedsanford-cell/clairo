import os
import json
from realtime_finder import find_leads_realtime

if __name__ == "__main__":
    # Ensure debug is on for this run
    os.environ.setdefault("LEADS_DEBUG", "1")

    niche = "plumber"
    location = "miami"
    max_results = 3
    time_budget_sec = 25

    print(f"Running find_leads_realtime(niche={niche!r}, location={location!r}, max_results={max_results}, time_budget_sec={time_budget_sec})")
    try:
        leads = find_leads_realtime(niche=niche, location=location, max_results=max_results, time_budget_sec=time_budget_sec)
        print("RESULTS ({} leads):".format(len(leads)))
        for i, lead in enumerate(leads, 1):
            print(f"#{i}")
            print(json.dumps(lead, ensure_ascii=False, indent=2))
    except Exception as e:
        print("ERROR during realtime run:", e)
        raise