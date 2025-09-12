import asyncio
import os
from sales_agent.leads.realtime_finder import find_leads_realtime

os.environ["LEADS_DEBUG"] = "1"

async def main():
    leads = await find_leads_realtime(niche="real estate", location="kenya", desired_count=1, channels=['google_maps', 'linkedin'])
    print("RESULTS:")
    for i, l in enumerate(leads, 1):
        print(i, l)

if __name__ == "__main__":
    asyncio.run(main())