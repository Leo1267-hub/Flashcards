from pydantic import BaseModel,Field,ConfigDict

class CardCreate(BaseModel):
    front:str = Field(min_length=1,max_length=500)
    back:str = Field(min_length=1,max_length=500)
    
class CardUpdate(BaseModel):
    front:str | None = Field(default=None,min_length=1,max_length=500)
    back: str | None = Field(default=None,min_length=1,max_length=500)
    


class CardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:int
    deck_id:int
    front:str
    back:str