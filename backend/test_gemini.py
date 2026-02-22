import traceback
from decouple import config
from google import genai

key = config("GEMINI_API_KEY")
print(f"Key: {key[:12]}...")

try:
    client = genai.Client(api_key=key)
    resp = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Say hi"
    )
    print("SUCCESS:", resp.text)
except Exception as e:
    print(f"ERROR TYPE: {type(e).__name__}")
    print(f"ERROR: {e}")
    traceback.print_exc()
