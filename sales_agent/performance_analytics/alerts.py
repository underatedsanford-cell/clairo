from sales_agent.utils.logger import logger
from sales_agent.utils.notifications import send_slack_alert

async def check_for_performance_alerts(metrics):
    logger.info("Checking for performance alerts.")

    # Define alert thresholds
    thresholds = {
        "lead_to_qualified": 40,  # e.g., alert if conversion rate drops below 40%
        "outreach_to_booked": 15,   # e.g., alert if booking rate drops below 15%
    }

    alerts = []

    # Check conversion rates
    if metrics["conversion_rates"]["lead_to_qualified"] < thresholds["lead_to_qualified"]:
        alert_message = f":warning: Alert: Lead-to-Qualified conversion rate has dropped to {metrics['conversion_rates']['lead_to_qualified']:.2f}%, which is below the {thresholds['lead_to_qualified']}% threshold."
        alerts.append(alert_message)

    if metrics["conversion_rates"]["outreach_to_booked"] < thresholds["outreach_to_booked"]:
        alert_message = f":warning: Alert: Outreach-to-Booked conversion rate has dropped to {metrics['conversion_rates']['outreach_to_booked']:.2f}%, which is below the {thresholds['outreach_to_booked']}% threshold."
        alerts.append(alert_message)

    # Send alerts if any were triggered
    if alerts:
        for alert in alerts:
            logger.warning(alert)
            await send_slack_alert(alert)
    else:
        logger.info("No performance alerts triggered.")