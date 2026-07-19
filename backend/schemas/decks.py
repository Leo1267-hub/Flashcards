from pydantic import BaseModel,Field,ConfigDict

class DeckCreate(BaseModel):
    name:str = Field(min_length=1,max_length=100)
    description: str | None = Field(default=None, max_length=500,min_length=1)

class DeckUpdate(BaseModel):
    name:str | None = Field(default=None,min_length=1,max_length=100)
    description: str | None = Field(default=None, max_length=500,min_length=1)
    
    
class DeckResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
    
class DeckSummaryResponse(DeckResponse):
    card_count: int
    due_count: int