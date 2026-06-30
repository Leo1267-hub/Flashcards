from fastapi import FastAPI,HTTPException,Depends,Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel,ConfigDict,Field
from database import get_db,engine,Base
from models import Deck,Card


app = FastAPI()
Base.metadata.create_all(bind=engine)

class DeckCreate(BaseModel):
    name:str = Field(min_length=1,max_length=100)
    description: str | None = Field(default=None, max_length=500,min_length=1)

class DeckUpdate(BaseModel):
    name:str | None = Field(default=None,min_length=1,max_length=100)
    description: str | None = Field(default=None, max_length=500,min_length=1)
    
class CardCreate(BaseModel):
    front:str = Field(min_length=1,max_length=500)
    back:str = Field(min_length=1,max_length=500)
    
class CardUpdate(BaseModel):
    front:str | None = Field(default=None,min_length=1,max_length=500)
    back: str | None = Field(default=None,min_length=1,max_length=500)
    
class DeckResponse(BaseModel):
    # from_attributes = True, allows pydantic to read data from ORM models and convert them into pydantic models JSON format
    model_config = ConfigDict(from_attributes=True)
    id:int 
    name:str
    description:str | None = None
    card_count:int

class CardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:int
    deck_id:int
    front:str
    back:str

def check_deck(deck_id:int,db:Session):
    deck = db.get(Deck,deck_id)
    if deck is None:
        raise HTTPException(status_code=404,detail='Deck not found')
    return deck

def check_card(card_id:int,db:Session):
    card = db.get(Card,card_id)
    if card is None:
        raise HTTPException(status_code=404,detail="Card not found")
    return card

@app.get('/',tags=['Root'])
def root():
    return {'message':'Flashcards API'}

@app.get('/health',tags=['Health'])
def health():
    return {'status':'OK'}

@app.get('/decks',tags=['Decks'],response_model=list[DeckResponse])
def get_decks(
    limit:int | None = Query(default=None,gt=0,le=100),
    db:Session = Depends(get_db)
    ):
    query = select(Deck)
    if limit is not None:
        query = query.limit(limit)
    return db.scalars(query).all()
    
    

@app.get('/decks/{deck_id}',tags=['Decks'],response_model=DeckResponse)
def get_one_deck(deck_id:int,db:Session = Depends(get_db)):
    return check_deck(deck_id,db)


@app.post('/decks',status_code=201,tags=['Decks'],response_model=DeckResponse)
def create_deck(deck:DeckCreate,db:Session = Depends(get_db)):
    db_deck = Deck(
        name = deck.name,
        description = deck.description
    )
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    return db_deck


@app.patch('/decks/{deck_id}',tags=['Decks'],response_model=DeckResponse)
def update_deck(deck_id:int,
                update:DeckUpdate,
                db:Session = Depends(get_db)
                ):
    deck = check_deck(deck_id,db)
    # convert provided fields from pydantic model(DeckUpdate) into dictionary (JSON )format
    # exclude_unset = True, any fields that wasnt explicitly provided will be excluded 
    changes = update.model_dump(exclude_unset=True)
    for field,value in changes.items():
        # eg setattr(deck, "name", "Networking") = deck.name = "Networking"
        setattr(deck,field,value)
    db.commit()
    db.refresh(deck)
    return deck


@app.delete('/decks/{deck_id}',status_code=204,tags=['Decks'])
def delete_deck(deck_id:int,db:Session = Depends(get_db)):
    deck = check_deck(deck_id,db)
    db.delete(deck)
    db.commit()

@app.post('/decks/{deck_id}/cards',status_code=201,tags=['Cards'],response_model=CardResponse)
def create_card(deck_id:int, card:CardCreate,db:Session = Depends(get_db)):
    check_deck(deck_id,db)
    db_card = Card(
        deck_id= deck_id,
        front = card.front,
        back = card.back
    )
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card


@app.get('/decks/{deck_id}/cards',tags=['Cards'],response_model=list[CardResponse])
def get_deck_cards(deck_id:int,db:Session = Depends(get_db)):
    check_deck(deck_id,db)
    query = select(Card).where(Card.deck_id == deck_id)
    return db.scalars(query).all()


@app.get('/cards/{card_id}',tags=['Cards'],response_model=CardResponse)
def get_cards(card_id:int,db:Session = Depends(get_db)):
    return check_card(card_id,db)

@app.patch('/cards/{card_id}',tags=['Cards'],response_model=CardResponse)
def update_card(card_id:int,updates:CardUpdate,db:Session = Depends(get_db)):
    card = check_card(card_id,db)
    changes = updates.model_dump(exclude_unset=True)
    for field,value in changes.items():
        setattr(card,field,value)
    db.commit()
    db.refresh(card)
    return card
    
@app.delete('/cards/{card_id}',tags=['Cards'],status_code=204)
def delete_card(card_id:int,db:Session = Depends(get_db)):
    card = check_card(card_id,db)
    db.delete(card)
    db.commit()
    