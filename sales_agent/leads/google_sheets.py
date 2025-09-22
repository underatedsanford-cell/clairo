import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from sales_agent.config import GOOGLE_SHEETS_CREDENTIALS_PATH, GOOGLE_SHEET_ID
from sales_agent.utils.logger import logger
import asyncio

class GoogleSheet:
    def __init__(self, sheet_id, credentials_path):
        self.sheet_id = sheet_id
        self.credentials_path = credentials_path
        self.client = None
        self.sheet = None

    async def _authenticate(self):
        """Authenticates with Google Sheets API and returns a client."""
        try:
            scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
            creds = await asyncio.to_thread(ServiceAccountCredentials.from_json_keyfile_name, self.credentials_path, scope)
            self.client = await asyncio.to_thread(gspread.authorize, creds)
            return True
        except Exception as e:
            logger.error(f"Failed to authenticate with Google Sheets API: {e}")
            return False

    async def _open_leads_sheet(self):
        """Opens the 'Leads' Google Sheet by ID and ensures necessary columns exist."""
        if not self.client:
            if not await self._authenticate():
                return False
        try:
            sheet = await asyncio.to_thread(self.client.open_by_key, self.sheet_id)
            self.sheet = await asyncio.to_thread(sheet.worksheet, 'Leads')
            
            # Check and add missing columns
            headers = await asyncio.to_thread(self.sheet.row_values, 1)
            missing_columns = [col for col in ['Lead Score', 'Outreach Status', 'Reply Channel'] if col not in headers]

            if missing_columns:
                num_existing_columns = len(headers)
                cells_to_update = []
                for i, col_name in enumerate(missing_columns):
                    cells_to_update.append(gspread.Cell(1, num_existing_columns + 1 + i, col_name))
                
                if cells_to_update:
                    await asyncio.to_thread(self.sheet.update_cells, cells_to_update)
                    logger.info(f"Added missing columns to the sheet: {', '.join(missing_columns)}")
                    # Re-fetch the worksheet to ensure headers are updated for the current session
                    self.sheet = await asyncio.to_thread(sheet.worksheet, 'Leads')

            return True
        except Exception as e:
            logger.error(f"Failed to open Google Sheet with ID {self.sheet_id} or 'Leads' worksheet: {e}")
            return False

    async def read_leads(self, start_row=0):
        """Reads new leads from the Google Sheet starting from a specific row."""
        if not self.sheet:
            if not await self._open_leads_sheet():
                return []
        try:
            all_records = await asyncio.to_thread(self.sheet.get_all_records)
            new_leads = [lead for i, lead in enumerate(all_records) if i >= start_row and ('Status' not in lead or lead['Status'] == 'New')]
            return new_leads
        except Exception as e:
            logger.error(f"Failed to read new leads from Google Sheet: {e}")
            return []

    async def read_leads_sorted_by_score(self, num_leads: int = 10):
        """Reads all leads and returns the top N leads sorted by score."""
        all_leads = await self.read_leads()
        if not all_leads:
            return []
        
        # Sort leads by 'Lead Score' in descending order.
        # Handle cases where score might be missing or not a number.
        for lead in all_leads:
            try:
                lead['Lead Score'] = int(lead.get('Lead Score', 0))
            except (ValueError, TypeError):
                lead['Lead Score'] = 0
        
        sorted_leads = sorted(all_leads, key=lambda x: x.get('Lead Score', 0), reverse=True)
        return sorted_leads[:num_leads]

    async def add_lead(self, lead_data):
        """Adds a new lead to the Google Sheet."""
        if not self.sheet:
            if not await self._open_leads_sheet():
                return False
        try:
            headers = await asyncio.to_thread(self.sheet.row_values, 1)
            row_to_insert = [lead_data.get(header, '') for header in headers]
            await asyncio.to_thread(self.sheet.append_row, row_to_insert)
            logger.info(f"Added new lead: {lead_data.get('Lead Name', 'Unknown')}")
            return True
        except Exception as e:
            logger.error(f"Error adding new lead {lead_data.get('Lead Name', 'Unknown')}: {e}")
            return False

    async def update_lead_data(self, lead_name, updates):
        """Updates specific columns for a given lead based on a dictionary of updates."""
        if not self.sheet:
            if not await self._open_leads_sheet():
                return False
        try:
            cell = await asyncio.to_thread(self.sheet.find, lead_name, in_column=1) 
            if cell:
                row_index = cell.row
                headers = await asyncio.to_thread(self.sheet.row_values, 1) 
                
                cells_to_update = []
                for column_name, new_value in updates.items():
                    if column_name in headers:
                        col_index = headers.index(column_name) + 1
                        cells_to_update.append(gspread.Cell(row_index, col_index, new_value))
                        logger.info(f"Prepared update for {column_name} for {lead_name} to {new_value}")
                    else:
                        logger.warning(f"Column '{column_name}' not found in sheet headers for lead {lead_name}.")
                
                if cells_to_update:
                    await asyncio.to_thread(self.sheet.update_cells, cells_to_update)
                    logger.info(f"Batch updated {len(cells_to_update)} cells for {lead_name}")
                return True
            else:
                print(f"Lead '{lead_name}' not found.")
                return False
        except Exception as e:
            logger.error(f"Error updating lead data for {lead_name}: {e}")

    async def append_row_to_sheet(self, sheet_name: str, headers: list, row_data: list):
        try:
            spreadsheet = self.client.open_by_id(self.spreadsheet_id)
            worksheet = spreadsheet.worksheet(sheet_name)
            # Check if headers exist, if not, add them
            if not worksheet.row_values(1):
                worksheet.append_row(headers)
            worksheet.append_row(row_data)
            logger.info(f"Row appended to {sheet_name} sheet.")
        except Exception as e:
            logger.error(f"Error appending row to {sheet_name} sheet: {e}")
            return False

    async def update_lead_score(self, lead_name, score_change):
        """Updates the lead score for a given lead."""
        if not self.sheet:
            if not await self._open_leads_sheet():
                return False
        try:
            cell = await asyncio.to_thread(self.sheet.find, lead_name, in_column=1)
            if cell:
                row_index = cell.row
                headers = await asyncio.to_thread(self.sheet.row_values, 1)
                if 'Lead Score' in headers:
                    col_index = headers.index('Lead Score') + 1
                    current_score = 0
                    try:
                        cell_obj = await asyncio.to_thread(self.sheet.cell, row_index, col_index)
                        current_score = int(cell_obj.value)
                    except (ValueError, TypeError, AttributeError):
                        pass # Score might be empty, non-numeric, or cell is empty
                    new_score = current_score + score_change
                    await asyncio.to_thread(self.sheet.update_cell, row_index, col_index, new_score)
                    logger.info(f"Updated Lead Score for {lead_name} from {current_score} to {new_score}")
                    return True
                else:
                    logger.warning(f"'Lead Score' column not found in sheet headers for {lead_name}.")
                    return False
            else:
                logger.warning(f"Lead '{lead_name}' not found for score update.")
                return False
        except Exception as e:
            logger.error(f"Error updating lead score for {lead_name}: {e}")
            return False

    async def get_all_sheet_values(self):
        """Retrieves all values from the 'Leads' sheet."""
        if not self.sheet:
            if not await self._open_leads_sheet():
                return []
        try:
            return await asyncio.to_thread(self.sheet.get_all_values)
        except Exception as e:
            logger.error(f"Failed to retrieve all values from Google Sheet: {e}")
            return []

    async def get_all_company_names(self):
        """Retrieves all company names from the 'Leads' sheet."""
        if not self.sheet:
            if not await self._open_leads_sheet():
                return []
        try:
            all_records = await asyncio.to_thread(self.sheet.get_all_records)
            return [record.get('Company') for record in all_records if record.get('Company')]
        except Exception as e:
            logger.error(f"Failed to retrieve company names from Google Sheet: {e}")
            return []