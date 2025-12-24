import os
# Suppress PaddleOCR connectivity checks
os.environ["DISABLE_MODEL_SOURCE_CHECK"] = "True"

import uvicorn
from dotenv import load_dotenv
import nest_asyncio

# Apply nest_asyncio for LlamaIndex/LlamaParse
nest_asyncio.apply()

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    # Point to the new gateway app
    uvicorn.run("whatsapp_gateway.app:app", host="0.0.0.0", port=port, reload=True)
