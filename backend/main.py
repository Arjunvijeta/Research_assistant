from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import openai
import asyncio
import json
from datetime import datetime, timedelta
import sqlite3
# import requests
from enum import Enum

app = FastAPI(title="Scientific Research Customer Service Bot API")
security = HTTPBearer()

# Configuration
OPENAI_API_KEY = "your-openai-api-key"
openai.api_key = OPENAI_API_KEY

class ActionType(str, Enum):
    SCHEDULE_EQUIPMENT = "schedule_equipment"
    CHECK_ORDER_STATUS = "check_order_status"
    GENERATE_REPORT = "generate_report"
    ESCALATE_ISSUE = "escalate_issue"
    UPDATE_PROTOCOL = "update_protocol"

class CustomerQuery(BaseModel):
    query: str
    customer_id: str
    context: Optional[Dict[str, Any]] = None

class BotResponse(BaseModel):
    response: str
    actions_taken: List[Dict[str, Any]]
    confidence_score: float
    requires_human_review: bool

class EquipmentBooking(BaseModel):
    equipment_id: str
    customer_id: str
    start_time: datetime
    duration_hours: int
    purpose: str

# Database setup (simplified - use proper DB in production)
def init_db():
    conn = sqlite3.connect('research_bot.db')
    cursor = conn.cursor()
    
    # Equipment table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS equipment (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            status TEXT,
            location TEXT
        )
    ''')
    
    # Bookings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_id TEXT,
            customer_id TEXT,
            start_time TEXT,
            end_time TEXT,
            status TEXT,
            purpose TEXT
        )
    ''')
    
    # Customer orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            customer_id TEXT,
            items TEXT,
            status TEXT,
            created_at TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

# Knowledge Base Integration
class KnowledgeBase:
    def __init__(self):
        self.protocols = {
            "sample_preparation": "Standard sample prep involves...",
            "equipment_maintenance": "Regular maintenance schedule...",
            "safety_protocols": "All lab work requires..."
        }
        
        self.faq = {
            "equipment_booking": "To book equipment, specify the instrument, date, and duration",
            "order_tracking": "Orders can be tracked using your order ID",
            "data_analysis": "Our analysis services include statistical analysis, visualization..."
        }
    
    def search_protocols(self, query: str) -> List[str]:
        # Simple keyword matching - use vector search in production
        relevant = []
        query_lower = query.lower()
        for key, value in self.protocols.items():
            if any(word in key for word in query_lower.split()):
                relevant.append(f"{key}: {value}")
        return relevant
    
    def search_faq(self, query: str) -> List[str]:
        relevant = []
        query_lower = query.lower()
        for key, value in self.faq.items():
            if any(word in key for word in query_lower.split()):
                relevant.append(f"{key}: {value}")
        return relevant

kb = KnowledgeBase()

# LLM Integration with Function Calling
class ResearchBotLLM:
    def __init__(self):
        self.system_prompt = """
        You are a customer service assistant for a scientific research company. 
        You help customers with:
        - Equipment booking and scheduling
        - Order status inquiries
        - Protocol questions
        - Technical support
        - Report generation
        
        Always prioritize safety and accuracy. If unsure about protocols or safety procedures, 
        escalate to human experts. Use the available functions to take actions.
        """
        
        self.functions = [
            {
                "name": "schedule_equipment",
                "description": "Book laboratory equipment for a customer",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "equipment_id": {"type": "string"},
                        "customer_id": {"type": "string"},
                        "start_time": {"type": "string"},
                        "duration_hours": {"type": "integer"},
                        "purpose": {"type": "string"}
                    },
                    "required": ["equipment_id", "customer_id", "start_time", "duration_hours"]
                }
            },
            {
                "name": "check_order_status",
                "description": "Check the status of a customer order",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "string"},
                        "customer_id": {"type": "string"}
                    },
                    "required": ["order_id", "customer_id"]
                }
            },
            {
                "name": "search_knowledge_base",
                "description": "Search protocols and FAQ",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"}
                    },
                    "required": ["query"]
                }
            }
        ]
    
    async def process_query(self, query: str, customer_id: str, context: Dict = None) -> BotResponse:
        # Add knowledge base context
        kb_results = kb.search_protocols(query) + kb.search_faq(query)
        context_info = "\n".join(kb_results) if kb_results else ""
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "system", "content": f"Knowledge base context: {context_info}"},
            {"role": "user", "content": f"Customer ID: {customer_id}\nQuery: {query}"}
        ]
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=messages,
                functions=self.functions,
                function_call="auto",
                temperature=0.3
            )
            
            message = response.choices[0].message
            actions_taken = []
            
            # Handle function calls
            if message.get("function_call"):
                function_name = message["function_call"]["name"]
                function_args = json.loads(message["function_call"]["arguments"])
                
                if function_name == "schedule_equipment":
                    result = await self.schedule_equipment(**function_args)
                    actions_taken.append({
                        "action": "schedule_equipment",
                        "result": result
                    })
                elif function_name == "check_order_status":
                    result = await self.check_order_status(**function_args)
                    actions_taken.append({
                        "action": "check_order_status",
                        "result": result
                    })
                elif function_name == "search_knowledge_base":
                    result = kb.search_protocols(function_args["query"])
                    actions_taken.append({
                        "action": "knowledge_search",
                        "result": result
                    })
            
            # Determine if human review is needed
            requires_review = self.needs_human_review(query, message.content)
            
            return BotResponse(
                response=message.content,
                actions_taken=actions_taken,
                confidence_score=0.85,  # Implement proper confidence scoring
                requires_human_review=requires_review
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LLM processing error: {str(e)}")
    
    def needs_human_review(self, query: str, response: str) -> bool:
        # Keywords that suggest high-risk scenarios
        safety_keywords = ["safety", "hazard", "toxic", "emergency", "accident"]
        regulatory_keywords = ["compliance", "regulation", "audit", "legal"]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in safety_keywords + regulatory_keywords)
    
    async def schedule_equipment(self, equipment_id: str, customer_id: str, 
                               start_time: str, duration_hours: int, purpose: str = ""):
        # Database integration for equipment booking
        conn = sqlite3.connect('research_bot.db')
        cursor = conn.cursor()
        
        # Check equipment availability
        cursor.execute('''
            SELECT COUNT(*) FROM bookings 
            WHERE equipment_id = ? AND status = 'active'
            AND datetime(start_time) <= datetime(?) 
            AND datetime(end_time) >= datetime(?)
        ''', (equipment_id, start_time, start_time))
        
        if cursor.fetchone()[0] > 0:
            conn.close()
            return {"success": False, "message": "Equipment not available at requested time"}
        
        # Create booking
        end_time = (datetime.fromisoformat(start_time) + timedelta(hours=duration_hours)).isoformat()
        cursor.execute('''
            INSERT INTO bookings (equipment_id, customer_id, start_time, end_time, status, purpose)
            VALUES (?, ?, ?, ?, 'active', ?)
        ''', (equipment_id, customer_id, start_time, end_time, purpose))
        
        booking_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "booking_id": booking_id,
            "message": f"Equipment {equipment_id} booked for {duration_hours} hours starting {start_time}"
        }
    
    async def check_order_status(self, order_id: str, customer_id: str):
        conn = sqlite3.connect('research_bot.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT status, items, created_at FROM orders 
            WHERE order_id = ? AND customer_id = ?
        ''', (order_id, customer_id))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                "order_id": order_id,
                "status": result[0],
                "items": result[1],
                "created_at": result[2]
            }
        else:
            return {"error": "Order not found"}

# Initialize components
init_db()
bot_llm = ResearchBotLLM()

# API Authentication
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Implement proper JWT validation in production
    if credentials.credentials != "your-api-token":
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return credentials.credentials

# API Endpoints
@app.post("/chat", response_model=BotResponse)
async def chat_with_bot(
    query: CustomerQuery,
    token: str = Depends(verify_token)
):
    """Main endpoint for customer service bot interaction"""
    try:
        response = await bot_llm.process_query(
            query.query, 
            query.customer_id, 
            query.context
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bot processing error: {str(e)}")

@app.post("/equipment/book")
async def book_equipment(
    booking: EquipmentBooking,
    token: str = Depends(verify_token)
):
    """Direct equipment booking endpoint"""
    result = await bot_llm.schedule_equipment(
        booking.equipment_id,
        booking.customer_id,
        booking.start_time.isoformat(),
        booking.duration_hours,
        booking.purpose
    )
    return result

@app.get("/equipment/available")
async def get_available_equipment(token: str = Depends(verify_token)):
    """Get list of available equipment"""
    conn = sqlite3.connect('research_bot.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, name, type, status, location FROM equipment WHERE status = "available"')
    equipment = cursor.fetchall()
    conn.close()
    
    return {
        "equipment": [
            {
                "id": eq[0], "name": eq[1], "type": eq[2], 
                "status": eq[3], "location": eq[4]
            } for eq in equipment
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)