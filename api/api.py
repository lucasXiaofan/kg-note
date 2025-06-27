from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Knowledge Weaver API",
    description="API for categorizing notes and managing categories",
    version="1.0.0"
)

# Add CORS middleware for browser requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com")

CATEGORIES_FILE = "../categories/categories.json"

class WebpageMetadata(BaseModel):
    title: str = ""
    url: str = ""
    domain: str = ""
    summary: str = ""

class Note(BaseModel):
    content: str
    url: str = ""  # Backward compatibility
    metadata: WebpageMetadata = None  # New structured metadata

class Category(BaseModel):
    category: str
    definition: str

def read_categories():
    if not os.path.exists(CATEGORIES_FILE):
        return []
    with open(CATEGORIES_FILE, "r") as f:
        return json.load(f)

def write_categories(categories):
    # Ensure the directory exists
    os.makedirs(os.path.dirname(CATEGORIES_FILE), exist_ok=True)
    with open(CATEGORIES_FILE, "w") as f:
        json.dump(categories, f, indent=2)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Knowledge Weaver API is running"}

@app.get("/categories")
async def get_categories():
    """Get all categories"""
    return read_categories()

@app.post("/categories")
async def add_category(category: Category):
    """Add a new category"""
    categories = read_categories()
    
    # Check if category already exists
    for existing in categories:
        if existing["category"].lower() == category.category.lower():
            raise HTTPException(status_code=400, detail="Category already exists")
    
    categories.append(category.model_dump())
    write_categories(categories)
    return {"message": "Category added successfully", "category": category.model_dump()}

@app.put("/categories/{index}")
async def update_category(index: int, category: Category):
    """Update a category by index"""
    categories = read_categories()
    
    if index < 0 or index >= len(categories):
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts with existing categories (excluding current one)
    for i, existing in enumerate(categories):
        if i != index and existing["category"].lower() == category.category.lower():
            raise HTTPException(status_code=400, detail="Category name already exists")
    
    categories[index] = category.model_dump()
    write_categories(categories)
    return {"message": "Category updated successfully", "category": category.model_dump()}

@app.delete("/categories/{index}")
async def delete_category(index: int):
    """Delete a category by index"""
    categories = read_categories()
    
    if index < 0 or index >= len(categories):
        raise HTTPException(status_code=404, detail="Category not found")
    
    deleted_category = categories.pop(index)
    write_categories(categories)
    return {"message": "Category deleted successfully", "deleted_category": deleted_category}

@app.post("/categorize")
async def categorize_note(note: Note):
    # Extract URL and metadata for context
    context_url = note.url
    context_title = ""
    context_domain = ""
    
    if note.metadata:
        context_url = note.metadata.url or note.url
        context_title = note.metadata.title
        context_domain = note.metadata.domain
    
    print(f"Received categorization request: content='{note.content[:50]}...', url='{context_url}', title='{context_title}'")
    categories = read_categories()
    
    existing_categories = [f"{cat['category']}: {cat['definition']}" for cat in categories]
    
    system_prompt = """You are an expert knowledge manager who excels at categorizing content. Your goal is to help users organize their knowledge effectively by assigning relevant, meaningful categories.

INSTRUCTIONS:
1. Analyze the note content and identify ALL relevant topics, themes, and concepts
2. Assign 1-4 categories that best represent the content (multiple categories are encouraged for rich content)
3. Use existing categories when they match, create new ones when needed
4. Be creative and specific - help users discover connections they might not see
5. NEVER use "Uncategorized" - every piece of content has some categorizable aspect

RESPONSE FORMATS:

For single category (existing):
{
    "categories": ["Web Development"]
}

For multiple categories (mix of existing and new):
{
    "categories": ["Machine Learning", "Research Methods"],
    "new_categories": [
        {
            "category": "Research Methods",
            "definition": "Methodologies and approaches for conducting research and analysis"
        }
    ]
}

For multiple new categories:
{
    "categories": ["Data Visualization", "Business Intelligence"],
    "new_categories": [
        {
            "category": "Data Visualization", 
            "definition": "Techniques and tools for visual representation of data and insights"
        },
        {
            "category": "Business Intelligence",
            "definition": "Strategic use of data analytics for business decision making"
        }
    ]
}

Always provide meaningful, specific categories that help organize knowledge effectively."""

    # Build context information for better categorization
    context_info = f"URL: {context_url}"
    if context_title:
        context_info += f"\nPage Title: {context_title}"
    if context_domain:
        context_info += f"\nWebsite: {context_domain}"
    
    user_prompt = f"""Note Content: "{note.content}"

Webpage Context:
{context_info}

Existing Categories:
{json.dumps(existing_categories, indent=2)}

Please categorize this note considering both the content and the webpage context, and respond with JSON only."""

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={'type': 'json_object'},
            temperature=0.1,
            stream=False
        )
        
        raw_response = response.choices[0].message.content
        print("DeepSeek API JSON Response:", raw_response)
        
        # Parse the JSON response
        category_data = json.loads(raw_response)
        
        # Validate the response structure
        if "categories" not in category_data:
            raise ValueError("Response missing required 'categories' field")
            
        print("Successfully parsed category data:", category_data)
        
        # Process new categories if they exist
        if "new_categories" in category_data and category_data["new_categories"]:
            existing_names = [cat["category"].lower() for cat in categories]
            for new_cat in category_data["new_categories"]:
                if new_cat["category"].lower() not in existing_names:
                    categories.append(new_cat)
                    existing_names.append(new_cat["category"].lower())
                    print(f"Added new category: {new_cat['category']}")
            write_categories(categories)

    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response: {raw_response}")
        category_data = {"categories": ["General"], "definition": "JSON parsing failed"}
    except Exception as e:
        print(f"API call error: {e}")
        category_data = {"categories": ["General"], "definition": "API call failed"}

    return category_data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
