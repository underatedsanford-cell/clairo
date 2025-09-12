import re
import json
from typing import Optional, Dict
from urllib.parse import unquote

def score_lead(lead_data: dict) -> int:
    """Scores a lead based on predefined criteria."""
    score = 0
    
    # Score based on industry
    industry_scores = {
        "Technology": 20,
        "SaaS": 25,
        "Software": 25,
        "Fintech": 15,
    }
    industry = lead_data.get("industry", "").lower()
    for key, value in industry_scores.items():
        if key.lower() in industry:
            score += value
            break

    # Score based on role
    role_scores = {
        "CEO": 30,
        "Founder": 30,
        "CTO": 25,
        "VP": 20,
        "Director": 15,
        "Manager": 10,
    }
    role = lead_data.get("role", "")
    for key, value in role_scores.items():
        if key.lower() in role.lower():
            score += value
            break

    # Score based on company size
    company_size = lead_data.get("company_size")
    if isinstance(company_size, int):
        if 10 <= company_size <= 50:
            score += 20
        elif 51 <= company_size <= 200:
            score += 15
        elif company_size > 200:
            score += 10

    return score

def enrich_lead_data(lead_data: dict) -> dict:
    """Enriches lead data with additional information and a qualification score."""
    # This is a placeholder. In a real scenario, this would call an enrichment API.
    lead_data["Work Email"] = "dummy_work_email@example.com"
    
    # Add dummy data for scoring if not present
    if "industry" not in lead_data:
        lead_data["industry"] = "SaaS"
    if "role" not in lead_data:
        lead_data["role"] = "CTO"
    if "company_size" not in lead_data:
        lead_data["company_size"] = 25

    lead_data["qualification_score"] = score_lead(lead_data)
    return lead_data



def _extract_title_name(html: str) -> Optional[str]:
    try:
        m = re.search(r"<title[^>]*>(.*?)</title>", html, flags=re.IGNORECASE | re.DOTALL)
        if not m:
            return None
        title = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(1))).strip()
        for sep in ["|", "-", ":", "–", "—"]:
            if sep in title:
                part = title.split(sep)[0].strip()
                if 2 <= len(part) <= 120:
                    return part
        return title if 2 <= len(title) <= 120 else None
    except Exception:
        return None


def _extract_jsonld_business(html: str) -> Dict[str, Optional[str]]:
    out: Dict[str, Optional[str]] = {"business_name": None, "address": None, "contact_person": None}
    try:
        for m in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, flags=re.IGNORECASE | re.DOTALL):
            block = (m.group(1) or "").strip()
            if not block:
                continue
            try:
                data = json.loads(block)
            except Exception:
                # Some sites embed multiple JSON objects or invalid JSON; skip
                continue
            nodes = data if isinstance(data, list) else [data]
            for node in nodes:
                if not isinstance(node, dict):
                    continue
                t = str(node.get("@type") or "").lower()
                if not any(x in t for x in ["organization", "localbusiness", "professionalservice", "store", "service", "plumber"]):
                    continue
                name = node.get("name") or node.get("legalName")
                if not out["business_name"] and isinstance(name, str):
                    out["business_name"] = name.strip()[:200]
                addr = node.get("address")
                if isinstance(addr, dict):
                    parts = [
                        addr.get("streetAddress"), addr.get("addressLocality"), addr.get("addressRegion"), addr.get("postalCode"), addr.get("addressCountry"),
                    ]
                    addr_str = ", ".join([p for p in parts if isinstance(p, str) and p.strip()])
                    if addr_str:
                        out["address"] = addr_str[:300]
                cp = None
                contact = node.get("contactPoint")
                if isinstance(contact, dict):
                    cp = contact.get("name") or contact.get("email")
                if isinstance(cp, str) and not out["contact_person"]:
                    out["contact_person"] = cp[:120]
    except Exception:
        pass
    return out

def enrich_business_profile(html: str) -> Dict[str, Optional[str]]:
    info = _extract_jsonld_business(html)
    if not info.get("business_name"):
        t = _extract_title_name(html)
        if t:
            info["business_name"] = t
    return info