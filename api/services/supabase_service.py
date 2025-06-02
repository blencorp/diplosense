from supabase import create_client, Client
from config import settings
from typing import Dict, List, Any, Optional
import json
from datetime import datetime

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    async def store_analysis(self, meeting_id: str, analysis_type: str, data: Dict[str, Any]) -> bool:
        """Store analysis data in Supabase"""
        try:
            result = self.client.table('analyses').insert({
                'meeting_id': meeting_id,
                'analysis_type': analysis_type,
                'data': json.dumps(data),
                'timestamp': datetime.now().isoformat()
            }).execute()
            return True
        except Exception as e:
            print(f"Error storing analysis: {e}")
            return False

    async def store_diplomatic_cable(self, meeting_id: str, cable_data: Dict[str, Any]) -> bool:
        """Store diplomatic cable in Supabase"""
        try:
            result = self.client.table('diplomatic_cables').insert({
                'meeting_id': meeting_id,
                'cable_data': json.dumps(cable_data),
                'timestamp': datetime.now().isoformat()
            }).execute()
            return True
        except Exception as e:
            print(f"Error storing diplomatic cable: {e}")
            return False

    async def get_meeting_analyses(self, meeting_id: str) -> List[Dict[str, Any]]:
        """Get all analyses for a meeting"""
        try:
            result = self.client.table('analyses').select('*').eq('meeting_id', meeting_id).execute()
            return result.data
        except Exception as e:
            print(f"Error retrieving analyses: {e}")
            return []

    async def get_cultural_rules(self) -> Dict[str, Any]:
        """Get cultural rules from database"""
        try:
            result = self.client.table('cultural_rules').select('*').execute()
            rules = {}
            for item in result.data:
                rules[item['culture']] = json.loads(item['rules'])
            return rules
        except Exception as e:
            print(f"Error retrieving cultural rules: {e}")
            return {}

    async def store_cultural_rule(self, culture: str, rules: Dict[str, Any]) -> bool:
        """Store or update cultural rule"""
        try:
            result = self.client.table('cultural_rules').upsert({
                'culture': culture,
                'rules': json.dumps(rules),
                'updated_at': datetime.now().isoformat()
            }).execute()
            return True
        except Exception as e:
            print(f"Error storing cultural rule: {e}")
            return False