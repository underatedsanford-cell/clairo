import sys
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()
import discord
from discord.ext import commands
from discord import app_commands
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from sales_agent.main import run_sales_agent
from sales_agent.utils.logger import logger
from sales_agent.leads.google_sheets import GoogleSheet
from sales_agent.config import GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")

intents = discord.Intents.default()
intents.message_content = True # Required to read message content

bot = commands.Bot(command_prefix="!", intents=intents, help_command=None)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user} (ID: {bot.user.id})')
    logger.info(f'Logged in as {bot.user} (ID: {bot.user.id})')
    print('------')
    await bot.tree.sync()

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    await bot.process_commands(message)

@bot.tree.command(name="create_meeting", description="Creates a new Jitsi meeting link.")
async def create_meeting_command(interaction: discord.Interaction):
    """Creates a new Jitsi meeting link."""
    await interaction.response.defer(ephemeral=True)
    import httpx
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post("http://localhost:5000/api/create-meeting")
            response.raise_for_status()
            data = response.json()
            if data.get("success"):
                await interaction.followup.send(f"Successfully created a new meeting: {data.get('meeting_url')}", ephemeral=True)
            else:
                await interaction.followup.send("Failed to create a meeting. Please check the logs.", ephemeral=True)
        except httpx.RequestError as e:
            logger.error(f"Error calling /api/create-meeting: {e}")
            await interaction.followup.send("An error occurred while trying to create a meeting.", ephemeral=True)


@bot.tree.command(name="send_email", description="Sends a cold outreach email to the specified recipient.")
@app_commands.describe(recipient_email="The email address of the recipient")
async def send_email_command(interaction: discord.Interaction, recipient_email: str):
    """Sends a cold outreach email to the specified recipient with automatically generated subject and body.
    Usage: /send_email <recipient_email>
    Example: /send_email test@example.com"""
    await interaction.response.defer(ephemeral=True)
    from sales_agent.outreach.gpt_script_generation import generate_outreach_script
    from sales_agent.outreach.gmail_smtp import send_email

    # Generate a generic cold outreach message
    # Since this is a standalone command, we don't have specific lead info
    # For a standalone email, we'll use generic placeholders for lead info
    # In a real scenario, this would come from a lead object
    lead_name = "Valued Customer"
    company = "Their Company"
    role = "Decision Maker"
    generated_content = await generate_outreach_script(lead_name, company, role)

    if generated_content is None:
        await interaction.followup.send("Failed to generate outreach script. Please check bot logs for details.", ephemeral=True)
        return

    # Attempt to parse subject and body from the generated content
    # This is a simple parsing and might need refinement based on actual GPT-4 output format
    subject_line = "" # Default empty
    email_body = generated_content # Default to full content if parsing fails

    # Look for common subject line indicators
    if "Subject:" in generated_content:
        lines = generated_content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith("Subject:"):
                subject_line = line.replace("Subject:", "").strip()
                email_body = "\n".join(lines[i+1:]).strip()
                break
    elif "Subject:" in generated_content.lower(): # Case-insensitive check
        lines = generated_content.split('\n')
        for i, line in enumerate(lines):
            if "subject:" in line.lower():
                subject_line = line.split("subject:", 1)[1].strip()
                email_body = "\n".join(lines[i+1:]).strip()
                break

    if not subject_line and len(email_body.split('\n')) > 1: # If no explicit subject, take first line as subject
        subject_line = email_body.split('\n')[0].strip()
        email_body = "\n".join(email_body.split('\n')[1:]).strip()

    if not subject_line: # Fallback if no subject found
        subject_line = "Quick Question about Your Business Growth"

    success = await send_email(recipient_email, subject_line, email_body)
    if success:
        await interaction.followup.send(f"Email successfully sent to {recipient_email} with subject '{subject_line}'.", ephemeral=True)
    else:
        await interaction.followup.send(f"Failed to send email to {recipient_email}. Check logs for details.", ephemeral=True)



class FindLeadsModal(discord.ui.Modal, title='Find New Leads'):
    niche = discord.ui.TextInput(label='Niche', placeholder='e.g., "AI startups in San Francisco"')
    location = discord.ui.TextInput(label='Location', placeholder='e.g., "San Francisco, CA"')
    count = discord.ui.TextInput(label='Number of Leads', placeholder='e.g., 10')

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        
        from sales_agent.leads.realtime_finder import find_leads_realtime
        
        num_leads = int(self.count.value)
        
        await interaction.followup.send(f"Finding {num_leads} leads in the {self.niche.value} niche located in {self.location.value}...", ephemeral=True)
        
        leads = await find_leads_realtime(self.niche.value, self.location.value, num_leads)
        
        if not leads:
            await interaction.followup.send("No leads found.", ephemeral=True)
            return
            
        embed = discord.Embed(title="New Leads Found", color=discord.Color.blue())
        
        for lead in leads:
            embed.add_field(name=lead.get('name'), value=f"**Contact:** {lead.get('contact_name', 'N/A')}\n**Email:** {lead.get('email', 'N/A')}\n**Phone:** {lead.get('phone', 'N/A')}", inline=False)
            
        await interaction.followup.send(embed=embed, ephemeral=True)


@bot.tree.command(name="find_leads", description="Searches for businesses based on specified criteria.")
async def find_leads_command(interaction: discord.Interaction):
    """Searches for businesses based on specified criteria."""
    modal = FindLeadsModal()
    await interaction.response.send_modal(modal)

@bot.tree.command(name="chat", description="Starts a new chat session with the AI assistant.")
@app_commands.describe(initial_message="The initial message to start the chat with")
async def chat_command(interaction: discord.Interaction, initial_message: str):
    """Starts a new chat session with the AI assistant."""
    await interaction.response.defer(ephemeral=True)
    
    from sales_agent.calls.ai_assistant import chat_with_assistant
    
    await interaction.followup.send(f"Starting chat session. You can stop by typing `stop`.", ephemeral=True)
    
    # Start the chat session in a separate thread to avoid blocking the bot
    chat_task = asyncio.create_task(chat_with_assistant(initial_message, interaction.user.id))
    
    while not chat_task.done():
        try:
            message = await bot.wait_for('message', timeout=60.0, check=lambda m: m.author == interaction.user and m.channel == interaction.channel)
            if message.content.lower() == 'stop':
                chat_task.cancel()
                await interaction.followup.send("Chat session ended.", ephemeral=True)
                return
            else:
                # This is where you would pass the message to the chat_with_assistant function
                # For now, we'll just log it
                logger.info(f"User message: {message.content}")
        except asyncio.TimeoutError:
            pass

    try:
        response = await chat_task
        await interaction.followup.send(response, ephemeral=True)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Error in chat session: {e}")
        await interaction.followup.send("An error occurred during the chat session.", ephemeral=True)



@bot.tree.command(name="verifyemail", description="Verifies a work email address before outreach.")
@app_commands.describe(email="The email address to verify")
async def verify_email_command(interaction: discord.Interaction, email: str):
    """Verifies a work email address before outreach.
    Usage: /verifyemail <email_address>
    Example: /verifyemail example@company.com"""
    from sales_agent.utils.email_verification import verify_email_with_abstractapi

    await interaction.response.send_message(f"Verifying email: {email}...")
    verification_result = await verify_email_with_abstractapi(email)

    if verification_result:
        is_valid = verification_result.get('is_valid_format', False) and verification_result.get('is_smtp_valid', False)
        deliverability = verification_result.get('deliverability', 'unknown')
        quality_score = verification_result.get('quality_score', 'N/A')

        response_message = (
            f"Email: `{email}`\n"
            f"Valid Format: `{verification_result.get('is_valid_format')}`\n"
            f"SMTP Valid: `{verification_result.get('is_smtp_valid')}`\n"
            f"Deliverability: `{deliverability}`\n"
            f"Quality Score: `{quality_score}`\n"
            f"Disposable: `{verification_result.get('is_disposable')}`\n"
            f"Free Email: `{verification_result.get('is_free_email')}`\n"
            f"Catch All: `{verification_result.get('is_catchall')}`\n"
            f"Did You Mean: `{verification_result.get('did_you_mean', 'N/A')}`\n"
        )
        await interaction.followup.send(f"Email verification complete:\n{response_message}")
    else:
        await interaction.followup.send("Failed to verify email. Please check the logs for details or ensure the API key is set.")

@bot.tree.command(name="stop_bot", description="Stops the Discord bot. (Owner Only)")
@commands.is_owner()
async def stop_bot_command(interaction: discord.Interaction):
    """Stops the Discord bot."""
    await interaction.response.send_message("Shutting down bot...", ephemeral=True)
    logger.info("Discord bot shutting down by command.")
    await bot.close()

@bot.tree.command(name="competitors", description="Monitors competitors' pricing, offers, and marketing campaigns.")
@app_commands.describe(niche="The market niche to analyze", region="The geographical region to focus on")
async def competitors_command(interaction: discord.Interaction, niche: str, region: str):
    """Monitors competitors' pricing, offers, and marketing campaigns."""
    await interaction.response.defer(ephemeral=True)
    try:
        from sales_agent.market_intelligence.competitor_analysis import analyze_competitors
        result = await analyze_competitors(niche, region)
        await interaction.followup.send(result, ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /competitors command: {e}")
        await interaction.followup.send(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="trends", description="Pulls data from Google Trends, Reddit, LinkedIn to spot rising topics.")
@app_commands.describe(keyword="The keyword to detect trends for")
async def trends_command(interaction: discord.Interaction, keyword: str):
    """Pulls data from Google Trends, Reddit, LinkedIn to spot rising topics."""
    await interaction.response.defer(ephemeral=True)
    try:
        from sales_agent.market_intelligence.trend_detection import detect_trends
        result = await detect_trends(keyword)
        await interaction.followup.send(result, ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /trends command: {e}")
        await interaction.followup.send(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="customerinsights", description="Scrapes reviews & forums to identify unmet needs.")
@app_commands.describe(topic="The topic to gather customer insights on")
async def customer_insights_command(interaction: discord.Interaction, topic: str):
    """Scrapes reviews & forums to identify unmet needs."""
    await interaction.response.defer(ephemeral=True)
    try:
        from sales_agent.market_intelligence.customer_insights import get_customer_insights
        result = await get_customer_insights(topic)
        await interaction.followup.send(result, ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /customerinsights command: {e}")
        await interaction.followup.send(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="dripcampaign", description="Auto-creates personalized email & SMS drip campaigns.")
@app_commands.describe(lead_ids="Comma-separated lead IDs (e.g., 3,4,5)", template="The template to use (e.g., warm_up)")
async def drip_campaign_command(interaction: discord.Interaction, lead_ids: str, template: str):
    """Auto-creates personalized email & SMS drip campaigns."""
    await interaction.response.defer(ephemeral=True)
    try:
        from sales_agent.nurture_sequences.drip_campaigns import start_drip_campaign
        lead_id_list = [int(x.strip()) for x in lead_ids.split(',')]
        result = await start_drip_campaign(lead_id_list, template)
        await interaction.followup.send(result, ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /dripcampaign command: {e}")
        await interaction.followup.send(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="upsell", description="Suggests upsell/cross-sell offers based on lead interest.")
@app_commands.describe(lead_id="The ID of the lead", offer="The offer to suggest (e.g., premium maintenance package)")
async def upsell_command(interaction: discord.Interaction, lead_id: int, offer: str):
    """Suggests upsell/cross-sell offers based on lead interest."""
    await interaction.response.defer(ephemeral=True)
    try:
        from sales_agent.revenue_optimization.upsell_cross_sell import suggest_upsell_cross_sell
        result = await suggest_upsell_cross_sell(lead_id, offer)
        await interaction.followup.send(result, ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /upsell command: {e}")
        await interaction.followup.send(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="findpartners", description="Finds potential referral partners.")
@app_commands.describe(niche="The niche to search for partners (e.g., HVAC services)", location="The location to search for partners (e.g., Canada)")
async def find_partners_command(interaction: discord.Interaction, niche: str, location: str):
    """Finds potential referral partners."""
    await interaction.response.defer(ephemeral=True)
    try:
        from sales_agent.partnership_engine.partner_finder import find_partners
        result = await find_partners(niche, location)
        await interaction.followup.send(result, ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /findpartners command: {e}")
        await interaction.followup.send(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="retentionoffer", description="Triggers retention offers or discounts automatically.")
@app_commands.describe(lead_id="The ID of the lead", discount="The discount to offer (e.g., 15%)", reason="The reason for the offer (e.g., missed call follow-up)")
async def retention_offer_command(interaction: discord.Interaction, lead_id: int, discount: str, reason: str):
    """Triggers retention offers or discounts automatically."""
    await interaction.response.defer(ephemeral=True)
    try:
        from sales_agent.client_retention.retention_offers import trigger_retention_offer
        result = await trigger_retention_offer(lead_id, discount, reason)
        await interaction.followup.send(result, ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /retentionoffer command: {e}")
        await interaction.followup.send(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="dashboard", description="Builds a live business dashboard showing leads, revenue, CAC, ROI.")
@app_commands.describe(period="The period for the dashboard (e.g., monthly)")
async def dashboard_command(interaction: discord.Interaction, period: str):
    """Builds a live business dashboard showing leads, revenue, CAC, ROI."""
    await interaction.response.defer(ephemeral=True)
    try:
        from sales_agent.data_driven_decisions.dashboard import build_dashboard
        result = await build_dashboard(period)
        await interaction.followup.send(result, ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /dashboard command: {e}")
        await interaction.followup.send(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="predictsales", description="Predicts sales for a given number of days ahead.")
@app_commands.describe(days="The number of days to predict sales for (e.g., 30)")
async def predict_sales_command(interaction: discord.Interaction, days: int):
    """Predicts sales for a given number of days ahead."""
    await interaction.response.defer(ephemeral=True)
    try:
        from sales_agent.data_driven_decisions.sales_prediction import predict_sales
        result = await predict_sales(days)
        await interaction.followup.send(result, ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /predictsales command: {e}")
        await interaction.followup.send(f"An error occurred: {e}", ephemeral=True)

@bot.tree.command(name="synthesize_speech", description="Synthesizes speech from text using Coqui TTS.")
@app_commands.describe(text="The text to synthesize", speaker_wav="The path to the speaker wav file", language="The language of the text")
async def synthesize_speech_command(interaction: discord.Interaction, text: str, speaker_wav: str, language: str):
    """Synthesizes speech from text using Coqui TTS."""
    from sales_agent.tts.coqui_tts import synthesize_speech
    await interaction.response.defer(ephemeral=True)
    try:
        output_path = "output.wav"
        synthesize_speech(text, speaker_wav, language, output_path)
        await interaction.followup.send(file=discord.File(output_path))
    except Exception as e:
        logger.error(f"Error in synthesize_speech_command: {e}")
        await interaction.followup.send("An error occurred while trying to synthesize speech.")

@bot.tree.command(name="leadscore", description="Assigns a score to a lead based on deal potential.")
@app_commands.describe(lead_name="The name of the lead", score_change="The score change to apply (e.g., 5 or -3)")
async def lead_score_command(interaction: discord.Interaction, lead_name: str, score_change: int):
    await interaction.response.defer(ephemeral=True)
    try:
        google_sheet = GoogleSheet(GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH)
        success = await google_sheet.update_lead_score(lead_name, score_change)
        if success:
            await interaction.followup.send(f"Updated Lead Score for '{lead_name}' by {score_change}.", ephemeral=True)
        else:
            await interaction.followup.send(f"Failed to update score for '{lead_name}'. Make sure the lead exists in the sheet.", ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /leadscore command: {e}")
        await interaction.followup.send("An error occurred while updating lead score.", ephemeral=True)

@bot.tree.command(name="addlead", description="Adds a new lead to the lead.json file.")
@app_commands.describe(name='Name of the lead', email='Email of the lead', company='Company of the lead', notes='Notes about the lead')
async def addlead(interaction: discord.Interaction, name: str, email: str, company: str, notes: str):
    """
    Slash command to add a new lead to the lead.json file.
    """
    await interaction.response.defer(ephemeral=True)
    try:
        json_file_path = os.path.join(os.path.dirname(__file__), '..', 'sales_agent_website', 'lead.json')
        
        new_lead = {"name": name, "email": email, "status": status}
        
        if os.path.exists(json_file_path):
            with open(json_file_path, 'r+') as f:
                try:
                    leads_data = json.load(f)
                except json.JSONDecodeError:
                    leads_data = []
                leads_data.append(new_lead)
                f.seek(0)
                json.dump(leads_data, f, indent=4)
        else:
            with open(json_file_path, 'w') as f:
                json.dump([new_lead], f, indent=4)
                
        await interaction.followup.send(f"Lead '{name}' added successfully.")
        
    except Exception as e:
        logger.error(f"Error in /addlead command: {e}")
        await interaction.followup.send("An error occurred while adding the lead.")

@bot.tree.command(name="readleads", description="Reads leads from the JSON file and displays them.")
async def readleads(interaction: discord.Interaction):
    """
    Slash command to read leads from the JSON file and display them.
    """
    try:
        await interaction.response.defer()
        
        # Correctly reference the lead.json file at the root of the sales_agent_website directory
        json_file_path = os.path.join(os.path.dirname(__file__), '..', 'sales_agent_website', 'lead.json')
        
        if not os.path.exists(json_file_path):
            await interaction.followup.send("The lead.json file was not found.")
            return
        
        with open(json_file_path, 'r') as f:
            leads_data = json.load(f)
        
        if not leads_data:
            await interaction.followup.send("No leads found in the file.")
            return
        
        # Format the leads into a readable message
        message = "### Current Leads:\n"
        for lead in leads_data:
            message += f"- **Name:** {lead.get('name', 'N/A')}, **Email:** {lead.get('email', 'N/A')}, **Status:** {lead.get('status', 'N/A')}\n"
        
        # Ensure the message is not too long for Discord
        if len(message) > 2000:
            message = message[:1997] + "..."
            
        await interaction.followup.send(message)
        
    except Exception as e:
        logger.error(f"Error in /readleads command: {e}")
        await interaction.followup.send("An error occurred while reading the leads.")

# New slash command: hotleads
@bot.tree.command(name="hotleads", description="Shows top leads by score from the Google Sheet.")
@app_commands.describe(limit="Maximum number of leads to list (default 5)")
async def hot_leads_slash_command(interaction: discord.Interaction, limit: int = 5):
    await interaction.response.defer(ephemeral=True)
    try:
        google_sheet = GoogleSheet(GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH)
        top_leads = await google_sheet.read_leads_sorted_by_score(num_leads=max(1, min(limit, 25)))
        if not top_leads:
            await interaction.followup.send("No leads found in the sheet.", ephemeral=True)
            return
        lines = []
        for i, lead in enumerate(top_leads):
            score = lead.get('Lead Score', 0)
            name = lead.get('Lead Name', 'Unknown')
            company = lead.get('Company', '')
            niche = lead.get('Niche', '')
            lines.append(f"{i+1}. {name} – {company} – {niche} – Score: {score}")
        await interaction.followup.send("Top Leads by Score:\n" + "\n".join(lines), ephemeral=True)
    except Exception as e:
        logger.error(f"Error in /hotleads command: {e}")
        await interaction.followup.send("An error occurred while reading top leads.", ephemeral=True)

@bot.tree.command(name="outreach", description="Sends initial outreach via email/text/DM.")
@app_commands.describe(lead_id="The ID of the lead", channel="The channel type (e.g., email, text, DM)")
async def outreach_command(interaction: discord.Interaction, lead_id: int, channel: str):
    await interaction.response.send_message(f"Sending outreach to lead {lead_id} via {channel} (Placeholder)." )

@bot.tree.command(name="bulkoutreach", description="Sends outreach to multiple leads at once.")
@app_commands.describe(lead_ids="Comma-separated lead IDs", channel="The channel type (e.g., email, text, DM)")
async def bulk_outreach_command(interaction: discord.Interaction, lead_ids: str, channel: str):
    await interaction.response.send_message(f"Sending bulk outreach to leads {lead_ids} via {channel} (Placeholder).")

@bot.tree.command(name="followup", description="Sends follow-up to a lead.")
@app_commands.describe(lead_id="The ID of the lead", template="The template name to use")
async def followup_command(interaction: discord.Interaction, lead_id: int, template: str):
    await interaction.response.send_message(f"Sending follow-up to lead {lead_id} using template {template} (Placeholder).")

@bot.tree.command(name="bulkfollowup", description="Follows up with multiple leads.")
@app_commands.describe(status="The status type (e.g., no_reply)", template="The template name to use")
async def bulk_followup_command(interaction: discord.Interaction, status: str, template: str):
    await interaction.response.send_message(f"Sending bulk follow-up to leads with status {status} using template {template} (Placeholder).")

@bot.tree.command(name="bookcall", description="Books a call with a specific lead.")
@app_commands.describe(lead_id="The ID of the lead", date="The date of the call (YYYY-MM-DD)", time="The time of the call (HH:MM)")
async def book_call_command(interaction: discord.Interaction, lead_id: int, date: str, time: str):
    """Books a call with a specific lead.
    Usage: /bookcall <id> "YYYY-MM-DD" "HH:MM"
    Example: /bookcall 3 "2025-08-10" "14:00""" 
    await interaction.response.send_message(f"Booking call for lead {lead_id} on {date} at {time} (Placeholder).")

@bot.command(name="listcommands", description="Displays a list of available commands.")
async def listcommands_command(ctx):
    """Displays a list of available commands."""
    help_message = "Here are the available commands:\n\n"
    for command in bot.tree.get_commands():
        help_message += f"`!<{command.name}>`: {command.description}\n"
    await ctx.send(help_message)







@bot.command(name="resume", description="Resumes a paused automation.")
async def resume_command(ctx, task_id: int):
    """Resumes a paused automation.
    Usage: !resume <id>
    Example: !resume 3"""
    await ctx.send(f"Resuming automation for task ID: {task_id} (Placeholder).")



@bot.command(name="sendbookinglink", description="Sends a booking link to a lead.")
async def sendbookinglink_command(ctx, lead_id: int, service: str):
    """Sends a booking link to a lead.
    Usage: !sendbookinglink <id> "<service_name>"
    Example: !sendbookinglink 3 "TidyCal"""
    await ctx.send(f"Sending booking link for lead {lead_id} via {service} (Placeholder).")

@bot.command(name="reschedulecall")
async def reschedule_call_command(ctx, call_id: int, date: str, time: str):
    """Changes a booked call time.
    Usage: !reschedulecall <id> "YYYY-MM-DD" "HH:MM"
    Example: !reschedulecall 2 "2025-08-12" "15:30""" 
    await ctx.send(f"Rescheduling call {call_id} to {date} at {time} (Placeholder).")

@bot.command(name="pipeline")
async def pipeline_command(ctx, stage: str):
    """Shows the full sales pipeline.
    Usage: !pipeline "<stage_name>"
    Example: !pipeline "all""" 
    await ctx.send(f"Displaying sales pipeline for stage: {stage} (Placeholder).")

@bot.command(name="status")
async def status_command(ctx, task_id: int):
    """Shows current progress on a task.
    Usage: !status <id>
    Example: !status 5""" 
    await ctx.send(f"Displaying status for task ID: {task_id} (Placeholder).")

@bot.command(name="report", description="Generates daily/weekly sales report.")
async def report_command(ctx, period: str):
    """Generates daily/weekly sales report.
    Usage: !report <period_type>
    Example: !report weekly"""
    await ctx.send(f"Generating {period} sales report (Placeholder).")

@bot.command(name="hotleads")
async def hot_leads_command(ctx):
    """Shows top 5 leads by score.
    Usage: !hotleads""" 
    await ctx.send("Displaying top 5 hot leads (Placeholder).")

@bot.command(name="analytics")
async def analytics_command(ctx):
    """Displays website analytics.
    Usage: !analytics"""
    await ctx.send("Displaying website analytics (Placeholder).")

@bot.command(name="trendingniches")
async def trending_niches_command(ctx):
    """Displays top trending niches.
    Usage: !trendingniches"""
    await ctx.send("Displaying top trending niches (Placeholder).")

@bot.command(name="potentialclients")
async def potential_clients_command(ctx):
    """Displays a list of potential clients.
    Usage: !potentialclients"""
    await ctx.send("Displaying a list of potential clients (Placeholder).")


@bot.command(name="setwebhook")
async def set_webhook_command(ctx, url: str):
    """Sets Slack/Telegram webhook for alerts.
    Usage: !setwebhook "<webhook_url>"
    Example: !setwebhook "https://hooks.slack.com/services/...""" 
    await ctx.send(f"Setting webhook to {url} (Placeholder).")

@bot.command(name="connectsheet")
async def connect_sheet_command(ctx, file: str):
    """Connects Google Sheets or Excel.
    Usage: !connectsheet "<file_name>"
    Example: !connectsheet "SalesTracker.xlsx""" 
    await ctx.send(f"Connecting to sheet: {file} (Placeholder).")

@bot.command(name="setscript", description="Sets default outreach/follow-up scripts.")
async def setscript_command(ctx, type: str, text: str):
    """Sets default outreach/follow-up scripts.
    Usage: !setscript "<script_type>" "<script_text>"
    Example: !setscript "outreach" "Hi {{name}}, I noticed..."""
    await ctx.send(f"Setting script for type '{type}' with text: '{text}' (Placeholder).")

@bot.command(name="pause")
async def pause_command(ctx, task_id: int):
    """Pauses current automation.
    Usage: !pause <id>
    Example: !pause 3""" 
    await ctx.send(f"Pausing task ID: {task_id} (Placeholder).")



@bot.command(name="help")
async def help_command(ctx):
    """Displays a list of all available commands and their descriptions.
    Usage: !help"""
    help_message = "**Available Commands:**\n"
    # List prefix commands
    for command in bot.commands:
        if command.help:
            help_message += f"`!{command.name}` - {command.help}\n"
    # List slash commands
    for command in bot.tree.get_commands():
        help_message += f"`/{command.name}` - {command.description}\n"
    await ctx.send(help_message)

@bot.command(name="sales_status")
async def sales_status_command(ctx):
    """Displays the current sales agent status.
    Usage: !sales_status <id>
    Example: !sales_status 123"""
    from sales_agent.shared_state import sales_agent_status
    status_message = (
        f"📊 **Current Sales Agent Status:**\n"
        f"Last Update: {sales_agent_status['last_update']}\n"
        f"New Leads Added: {sales_agent_status['new_leads_added']}\n"
        f"Outreach Sent: {sales_agent_status['outreach_sent_count']}\n"
        f"Replies Received: {sales_agent_status['replies_received_count']}\n"
        f"Calls Booked: {sales_agent_status['calls_booked_count']}\n"
        f"Deals Closed: {sales_agent_status['deals_closed_count']}\n"
        f"Total Pipeline Value: ${sales_agent_status['total_pipeline_value']}\n"
        f"Follow-ups Scheduled: {sales_agent_status['follow_ups_scheduled_count']}\n"
        f"Booked Calls: {', '.join(sales_agent_status['booked_calls_list']) if sales_agent_status['booked_calls_list'] else 'None'}"
    )
    await ctx.send(status_message)

@bot.command(name="start_sales_agent")
async def start_sales_agent_command(ctx):
    """Starts the sales agent process.
    Usage: !start_sales_agent <number> "<audience>"
    Example: !start_sales_agent 50 "SaaS companies"
    """
    await ctx.send("Please enter the number of leads to process (e.g., 10):")
    
    def check(m):
        return m.author == ctx.author and m.channel == ctx.channel and m.content.isdigit()
    
    try:
        msg = await bot.wait_for('message', check=check, timeout=60.0)
        num_leads = int(msg.content)
        await ctx.send(f"You entered {num_leads} leads. Now, please enter the target audience (e.g., 'small businesses in tech'):")
    
        def check_audience(m):
            return m.author == ctx.author and m.channel == ctx.channel
    
        msg = await bot.wait_for('message', check=check_audience, timeout=120.0)
        target_audience = msg.content
        await ctx.send(f"Okay, so you're targeting '{target_audience}'.")

        from sales_agent.config import ENRICHMENT_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY, update_config

        current_enrichment_key = ENRICHMENT_API_KEY
        current_openai_key = OPENAI_API_KEY or DEEPSEEK_API_KEY

        if not current_enrichment_key:
            await ctx.send("Please enter your Enrichment API Key (e.g., Clearbit, InstantData): ")
            msg = await bot.wait_for('message', check=check_audience, timeout=120.0)
            enrichment_api_key = msg.content
        else:
            enrichment_api_key = current_enrichment_key
            await ctx.send("Using existing Enrichment API Key.")

        if not current_openai_key:
            await ctx.send("Please enter your OpenAI API Key (or DeepSeek API Key if you prefer): ")
            msg = await bot.wait_for('message', check=check_audience, timeout=120.0)
            openai_api_key = msg.content
        else:
            openai_api_key = current_openai_key
            await ctx.send("Using existing OpenAI/DeepSeek API Key.")

        # Update config.py with the provided keys (only if new values were entered)
        if not current_enrichment_key or not current_openai_key:
            update_config(ENRICHMENT_API_KEY=enrichment_api_key, OPENAI_API_KEY=openai_api_key)

        await ctx.send(f"Starting sales agent process for {num_leads} leads targeting '{target_audience}'...")
        logger.info(f"Sales agent process initiated by {ctx.author} via Discord command for {num_leads} leads targeting '{target_audience}'.")

        # Run the sales agent in a separate task to not block the bot
        asyncio.create_task(run_sales_agent(num_leads=num_leads, target_audience=target_audience))
        await ctx.send("Sales agent process started successfully! I will provide updates every 5 minutes.")
        asyncio.create_task(send_periodic_status_updates(ctx.channel))
    
    except asyncio.TimeoutError:
        await ctx.send("You took too long to respond. Please restart the command.")
    except Exception as e:
        logger.error(f"Error starting sales agent from Discord: {e}")
        await ctx.send(f"Error starting sales agent: {e}")

async def send_periodic_status_updates(channel):
    while True:
        await asyncio.sleep(300)  # Wait for 5 minutes (300 seconds)
        from sales_agent.shared_state import sales_agent_status
        status_message = (
            f"📊 **Automated Sales Agent Status Update:**\n"
            f"Last Update: {sales_agent_status['last_update']}\n"
            f"New Leads Added: {sales_agent_status['new_leads_added']}\n"
            f"Outreach Sent: {sales_agent_status['outreach_sent_count']}\n"
            f"Replies Received: {sales_agent_status['replies_received_count']}\n"
            f"Calls Booked: {sales_agent_status['calls_booked_count']}\n"
            f"Deals Closed: {sales_agent_status['deals_closed_count']}\n"
            f"Total Pipeline Value: ${sales_agent_status['total_pipeline_value']}\n"
            f"Follow-ups Scheduled: {sales_agent_status['follow_ups_scheduled_count']}\n"
            f"Booked Calls: {', '.join(sales_agent_status['booked_calls_list']) if sales_agent_status['booked_calls_list'] else 'None'}"
        )
        await channel.send(status_message)

@bot.command(name="approve_action")
async def approve_action(ctx, lead_name: str, action_type: str):
    from sales_agent.shared_state import set_approval_event
    set_approval_event(lead_name, action_type)
    await ctx.send(f"Approved '{action_type}' for lead '{lead_name}'.")


async def main():
    if not DISCORD_BOT_TOKEN:
        logger.error("DISCORD_BOT_TOKEN not found in environment variables.")
        print("Error: DISCORD_BOT_TOKEN not found. Please set it in your .env file.")
        return
    
    try:
        await bot.start(DISCORD_BOT_TOKEN)
    except Exception as e:
        logger.error(f"Error starting Discord bot: {e}")
        print(f"Error starting Discord bot: {e}")

if __name__ == "__main__":
    asyncio.run(main())